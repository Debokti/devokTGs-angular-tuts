import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Observable,
  Subject,
  combineLatest,
  forkJoin,
  from,
  interval,
  of,
  throwError,
  timer,
} from 'rxjs';
import {
  catchError,
  concatMap,
  debounceTime,
  delay,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  mergeMap,
  retry,
  scan,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';
import { CodeFile, CodeViewerComponent } from '../code-viewer/code-viewer.component';

interface CatalogEntry {
  name: string;
  category: string;
  kind: 'type' | 'creation' | 'operator' | 'utility' | 'scheduler' | 'instance';
  definition: string;
  fintechUse: string;
}

interface PipelineLog {
  id: number;
  lane: string;
  message: string;
}

@Component({
  selector: 'lib-rxjs-operator-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, CodeViewerComponent],
  templateUrl: './rxjs-operator-catalog.component.html',
  styleUrls: ['./rxjs-operator-catalog.component.scss'],
})
export class RxjsOperatorCatalogComponent {
  query = '';
  selectedCategory = 'All';
  private logId = 0;
  private paymentAttempts = new Map<string, number>();

  logs: PipelineLog[] = [];

  readonly catalog = RXJS_CATALOG;

  readonly methodCards = [
    {
      name: 'subscribe(observerOrNext)',
      definition:
        'Starts one Observable execution and returns a Subscription. Use next, error, and complete handlers or an Observer object.',
    },
    {
      name: 'pipe(...operators)',
      definition:
        'Composes pipeable operators left to right without executing the stream. Execution still starts at subscribe or async pipe.',
    },
    {
      name: 'forEach(next)',
      definition:
        'Converts completion into a Promise. Rare in Angular UI code because it waits for completion and cannot model ongoing streams well.',
    },
    {
      name: 'toPromise()',
      definition:
        'Deprecated in RxJS 7. Use firstValueFrom or lastValueFrom so intent is explicit.',
    },
  ];

  readonly codeFiles: CodeFile[] = [
    {
      name: 'search-switchmap-pipeline.ts',
      language: 'typescript',
      code: SEARCH_PIPELINE_CODE,
    },
    {
      name: 'payment-concatmap-retry.ts',
      language: 'typescript',
      code: PAYMENT_PIPELINE_CODE,
    },
    {
      name: 'risk-combination-pipeline.ts',
      language: 'typescript',
      code: RISK_PIPELINE_CODE,
    },
  ];

  get categories(): string[] {
    return ['All', ...Array.from(new Set(this.catalog.map((entry) => entry.category))).sort()];
  }

  get filteredCatalog(): CatalogEntry[] {
    const normalizedQuery = this.query.trim().toLowerCase();

    return this.catalog.filter((entry) => {
      const matchesCategory = this.selectedCategory === 'All' || entry.category === this.selectedCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        entry.name.toLowerCase().includes(normalizedQuery) ||
        entry.definition.toLowerCase().includes(normalizedQuery) ||
        entry.fintechUse.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }

  runSearchPipeline(): void {
    this.logs = [];
    const terms = ['ac', 'acct', 'acct-42', 'acct-42', 'acct-4209'];

    interval(70)
      .pipe(
        take(terms.length),
        map((index) => terms[index]),
        debounceTime(30),
        distinctUntilChanged(),
        tap((term) => this.addLog('search', `debounced query ${term}`)),
        switchMap((term) =>
          this.lookupAccount(term).pipe(
            finalize(() => this.addLog('search', `request for ${term} closed by completion or cancellation`))
          )
        ),
        shareReplay({ bufferSize: 1, refCount: true })
      )
      .subscribe({
        next: (result) => this.addLog('search', `rendered ${result.join(', ')}`),
        complete: () => this.addLog('search', 'pipeline complete'),
      });
  }

  runPaymentPipeline(): void {
    this.logs = [];
    this.paymentAttempts.clear();

    from([
      { id: 'PAY-1001', rail: 'ACH', amount: 12500 },
      { id: 'PAY-1002', rail: 'WIRE', amount: 88000 },
      { id: 'PAY-1003', rail: 'CARD', amount: 420 },
    ])
      .pipe(
        concatMap((payment) =>
          this.authorizePayment(payment.id, payment.rail).pipe(
            retry(1),
            catchError((err: Error) => of(`${payment.id} failed after retry: ${err.message}`))
          )
        ),
        scan((ledger, event) => [...ledger, event], [] as string[]),
        finalize(() => this.addLog('payments', 'batch stream finalized'))
      )
      .subscribe((ledger) => this.addLog('payments', ledger.join(' | ')));
  }

  runRiskPipeline(): void {
    this.logs = [];

    const exposure$ = of(2450000).pipe(delay(120));
    const kyc$ = of('KYC clear').pipe(delay(180));
    const sanctions$ = of('Sanctions no match').pipe(delay(240));

    forkJoin({ exposure: exposure$, kyc: kyc$, sanctions: sanctions$ })
      .pipe(
        map((snapshot) => ({
          ...snapshot,
          decision: snapshot.exposure > 2000000 ? 'manual approval required' : 'auto approve',
        }))
      )
      .subscribe((snapshot) =>
        this.addLog(
          'risk',
          `${snapshot.kyc}; ${snapshot.sanctions}; exposure ${snapshot.exposure}; ${snapshot.decision}`
        )
      );

    const fxTick$ = timer(0, 170).pipe(
      take(4),
      map((tick) => 1.08 + tick / 1000)
    );
    const position$ = new Subject<number>();

    combineLatest([fxTick$, position$.pipe(startWith(1000000))])
      .pipe(
        map(([rate, position]) => Math.round(rate * position)),
        filter((eurValue) => eurValue > 1080000)
      )
      .subscribe((eurValue) => this.addLog('risk', `live EUR exposure threshold crossed: ${eurValue}`));

    position$.next(1010000);
    position$.next(1020000);
    position$.complete();
  }

  private lookupAccount(term: string): Observable<string[]> {
    return of(['ACC-4209 checking', 'ACC-4210 treasury', 'ACC-4211 escrow']).pipe(
      delay(120),
      map((accounts) => accounts.filter((account) => account.toLowerCase().includes(term.replace('-', '').slice(0, 3))))
    );
  }

  private authorizePayment(id: string, rail: string): Observable<string> {
    const attempt = (this.paymentAttempts.get(id) ?? 0) + 1;
    this.paymentAttempts.set(id, attempt);

    if (id === 'PAY-1002' && attempt === 1) {
      return timer(90).pipe(
        tap(() => this.addLog('payments', `${id} ${rail} transient core timeout on attempt ${attempt}`)),
        mergeMap(() => throwError(() => new Error('core timeout')))
      );
    }

    return of(`${id} ${rail} authorized on attempt ${attempt}`).pipe(delay(90));
  }

  private addLog(lane: string, message: string): void {
    this.logs.unshift({ id: ++this.logId, lane, message });
  }
}

const RXJS_CATALOG: CatalogEntry[] = [
  { name: 'Observable', category: 'Core types', kind: 'type', definition: 'Lazy push producer that emits next, error, and complete notifications to each subscriber.', fintechUse: 'HTTP calls, ledger streams, WebSocket ticks, UI events.' },
  { name: 'Observer', category: 'Core types', kind: 'type', definition: 'Consumer object with next, error, and complete callbacks.', fintechUse: 'Rendering quotes, routing errors, recording audit events.' },
  { name: 'Subscription', category: 'Core types', kind: 'type', definition: 'Disposable handle for one Observable execution.', fintechUse: 'Cancel polling, close sockets, release browser event listeners.' },
  { name: 'Subject', category: 'Core types', kind: 'type', definition: 'Multicast source that is both Observable and Observer and stores no previous value.', fintechUse: 'Manual refresh, retry commands, wizard events.' },
  { name: 'BehaviorSubject', category: 'Core types', kind: 'type', definition: 'Subject that requires an initial value and synchronously exposes the current value to new subscribers.', fintechUse: 'Current user, selected account, active entitlement state.' },
  { name: 'ReplaySubject', category: 'Core types', kind: 'type', definition: 'Subject that replays a bounded count or time window of previous values to new subscribers.', fintechUse: 'Recent price ticks, audit trail buffer, support transcript history.' },
  { name: 'AsyncSubject', category: 'Core types', kind: 'type', definition: 'Subject that emits only the final value when completed.', fintechUse: 'Final export URL, signed-document completion, batch close result.' },
  { name: 'Subscriber', category: 'Core types', kind: 'type', definition: 'Internal Observer plus Subscription implementation used by RxJS.', fintechUse: 'Usually not instantiated in Angular app code.' },
  { name: 'ConnectableObservable', category: 'Core types', kind: 'type', definition: 'Multicast Observable that starts when connected.', fintechUse: 'Legacy controlled sharing for expensive market-data feeds.' },
  { name: 'Notification', category: 'Core types', kind: 'type', definition: 'Object representation of next, error, or complete.', fintechUse: 'Advanced stream diagnostics and event materialization.' },

  { name: 'of', category: 'Creation and constants', kind: 'creation', definition: 'Creates a synchronous stream from listed values.', fintechUse: 'Mock API responses, static product catalogs, test fixtures.' },
  { name: 'from', category: 'Creation and constants', kind: 'creation', definition: 'Creates a stream from arrays, promises, iterables, or observable-like inputs.', fintechUse: 'Process payment batches or bridge promise-based SDKs.' },
  { name: 'fromEvent', category: 'Creation and constants', kind: 'creation', definition: 'Creates a stream from DOM or Node-style event targets.', fintechUse: 'Search input, scroll, file upload, visibility events.' },
  { name: 'fromEventPattern', category: 'Creation and constants', kind: 'creation', definition: 'Creates a stream from custom add/remove handler APIs.', fintechUse: 'Bridge vendor SDK callbacks into Angular.' },
  { name: 'defer', category: 'Creation and constants', kind: 'creation', definition: 'Creates a fresh Observable by running a factory per subscriber.', fintechUse: 'Read latest auth token at subscription time.' },
  { name: 'iif', category: 'Creation and constants', kind: 'creation', definition: 'Chooses one of two Observables at subscribe time.', fintechUse: 'Use cache or network based on current policy.' },
  { name: 'interval', category: 'Creation and constants', kind: 'creation', definition: 'Emits increasing numbers on a fixed period.', fintechUse: 'Polling, heartbeat indicators, timed reconciliation checks.' },
  { name: 'timer', category: 'Creation and constants', kind: 'creation', definition: 'Emits after a delay, optionally repeatedly.', fintechUse: 'Session timeout warnings, delayed retry windows.' },
  { name: 'range', category: 'Creation and constants', kind: 'creation', definition: 'Synchronously emits a range of numbers.', fintechUse: 'Generate page indexes or synthetic test cases.' },
  { name: 'generate', category: 'Creation and constants', kind: 'creation', definition: 'Creates values through an initial state, condition, iterate, and result selector.', fintechUse: 'Synthetic amortization schedules or test cash-flow rows.' },
  { name: 'throwError', category: 'Creation and constants', kind: 'creation', definition: 'Creates a stream that errors immediately or from an error factory.', fintechUse: 'Model rejected API branches in tests and guards.' },
  { name: 'EMPTY', category: 'Creation and constants', kind: 'creation', definition: 'Observable that completes immediately without values.', fintechUse: 'No-op branch after a denied optional action.' },
  { name: 'NEVER', category: 'Creation and constants', kind: 'creation', definition: 'Observable that never emits and never completes.', fintechUse: 'Rare; model disabled streams or tests for timeout behavior.' },
  { name: 'empty', category: 'Creation and constants', kind: 'creation', definition: 'Legacy creator equivalent to EMPTY with optional scheduler.', fintechUse: 'Prefer EMPTY in new code.' },
  { name: 'never', category: 'Creation and constants', kind: 'creation', definition: 'Legacy creator equivalent to NEVER.', fintechUse: 'Prefer NEVER in new code.' },
  { name: 'forkJoin', category: 'Creation and constants', kind: 'creation', definition: 'Waits for all inner Observables to complete, then emits their last values once.', fintechUse: 'Load KYC, exposure, and sanctions snapshots before a decision.' },
  { name: 'combineLatest', category: 'Creation and constants', kind: 'creation', definition: 'Combines latest values from sources after each source has emitted at least once.', fintechUse: 'Live pricing from rate, quantity, and risk inputs.' },
  { name: 'concat', category: 'Creation and constants', kind: 'creation', definition: 'Subscribes to sources sequentially after each completes.', fintechUse: 'Run onboarding steps in strict order.' },
  { name: 'merge', category: 'Creation and constants', kind: 'creation', definition: 'Subscribes to sources concurrently and interleaves emissions.', fintechUse: 'Merge WebSocket ticks with manual refresh events.' },
  { name: 'race', category: 'Creation and constants', kind: 'creation', definition: 'Mirrors the first source to emit and unsubscribes from losers.', fintechUse: 'Choose fastest quote provider or timeout fallback.' },
  { name: 'zip', category: 'Creation and constants', kind: 'creation', definition: 'Pairs values by index from multiple sources.', fintechUse: 'Pair generated statements with matching signatures.' },
  { name: 'partition', category: 'Creation and constants', kind: 'creation', definition: 'Splits one source into pass and fail Observables based on a predicate.', fintechUse: 'Separate approved and flagged transactions.' },
  { name: 'pairs', category: 'Creation and constants', kind: 'creation', definition: 'Legacy helper that emits key-value pairs from an object.', fintechUse: 'Prefer from(Object.entries(obj)) in new code.' },
  { name: 'bindCallback', category: 'Creation and constants', kind: 'creation', definition: 'Converts callback-style APIs into Observable-returning functions.', fintechUse: 'Bridge legacy browser or vendor SDK APIs.' },
  { name: 'bindNodeCallback', category: 'Creation and constants', kind: 'creation', definition: 'Converts Node error-first callback APIs into Observable-returning functions.', fintechUse: 'Bridge server-side Node utilities in tooling.' },
  { name: 'using', category: 'Creation and constants', kind: 'creation', definition: 'Creates an Observable tied to a disposable resource.', fintechUse: 'Advanced resource lifecycle modeling.' },
  { name: 'scheduled', category: 'Creation and constants', kind: 'creation', definition: 'Schedules an input Observable-like source on a scheduler.', fintechUse: 'Control test timing or UI scheduling boundaries.' },
  { name: 'animationFrames', category: 'Creation and constants', kind: 'creation', definition: 'Emits animation-frame timing information.', fintechUse: 'Smooth high-frequency chart rendering.' },

  { name: 'map', category: 'Transformation', kind: 'operator', definition: 'Projects each source value into a new value.', fintechUse: 'Map DTOs to view models or amounts to formatted rows.' },
  { name: 'mapTo', category: 'Transformation', kind: 'operator', definition: 'Maps every value to the same constant value; legacy convenience operator.', fintechUse: 'Convert click events into a fixed command.' },
  { name: 'pluck', category: 'Transformation', kind: 'operator', definition: 'Extracts nested properties by name; deprecated in favor of map.', fintechUse: 'Prefer map(dto => dto.account.id).' },
  { name: 'scan', category: 'Transformation', kind: 'operator', definition: 'Accumulates state over time and emits each intermediate state.', fintechUse: 'Build running ledger totals or notification lists.' },
  { name: 'mergeScan', category: 'Transformation', kind: 'operator', definition: 'Like scan, but accumulator returns an Observable and can merge concurrent work.', fintechUse: 'Async state machines with controlled concurrency.' },
  { name: 'switchScan', category: 'Transformation', kind: 'operator', definition: 'Like scan, but switches to the latest async accumulator result.', fintechUse: 'Cancelable async state recalculation.' },
  { name: 'pairwise', category: 'Transformation', kind: 'operator', definition: 'Emits previous and current values as pairs.', fintechUse: 'Compare old and new risk scores or detect price movement.' },
  { name: 'groupBy', category: 'Transformation', kind: 'operator', definition: 'Splits a source into grouped Observables by key.', fintechUse: 'Group transactions by rail, region, or risk tier.' },
  { name: 'expand', category: 'Transformation', kind: 'operator', definition: 'Recursively projects each value to another Observable and merges the results.', fintechUse: 'Follow paginated APIs or graph-style workflow expansion.' },
  { name: 'buffer', category: 'Transformation', kind: 'operator', definition: 'Collects values until a notifier emits, then emits an array.', fintechUse: 'Batch audit events until a flush signal.' },
  { name: 'bufferCount', category: 'Transformation', kind: 'operator', definition: 'Collects values by count, with optional overlap.', fintechUse: 'Batch card transactions in groups of N.' },
  { name: 'bufferTime', category: 'Transformation', kind: 'operator', definition: 'Collects values over time windows.', fintechUse: 'Batch telemetry or quotes every second.' },
  { name: 'bufferToggle', category: 'Transformation', kind: 'operator', definition: 'Opens and closes buffers with Observable signals.', fintechUse: 'Capture events during a fraud investigation window.' },
  { name: 'bufferWhen', category: 'Transformation', kind: 'operator', definition: 'Starts a buffer and closes it when a factory Observable emits.', fintechUse: 'Batch until the next settlement cycle signal.' },
  { name: 'window', category: 'Transformation', kind: 'operator', definition: 'Like buffer, but emits Observables instead of arrays.', fintechUse: 'Process high-volume streams in windows without materializing all values.' },
  { name: 'windowCount', category: 'Transformation', kind: 'operator', definition: 'Windows values by count.', fintechUse: 'Chunk live ticks into observable groups of N.' },
  { name: 'windowTime', category: 'Transformation', kind: 'operator', definition: 'Windows values by time.', fintechUse: 'Create time-sliced risk analytics streams.' },
  { name: 'windowToggle', category: 'Transformation', kind: 'operator', definition: 'Opens and closes windows with Observable signals.', fintechUse: 'Open monitoring windows around payment release.' },
  { name: 'windowWhen', category: 'Transformation', kind: 'operator', definition: 'Closes the current window using a factory Observable.', fintechUse: 'Window trades until the next market interval.' },

  { name: 'filter', category: 'Filtering and selection', kind: 'operator', definition: 'Allows only values matching a predicate.', fintechUse: 'Show only flagged transactions or active accounts.' },
  { name: 'take', category: 'Filtering and selection', kind: 'operator', definition: 'Takes the first N values then completes.', fintechUse: 'Limit polling or consume the first route param.' },
  { name: 'takeLast', category: 'Filtering and selection', kind: 'operator', definition: 'Waits for completion, then emits the last N values.', fintechUse: 'Display final events from a completed batch.' },
  { name: 'takeUntil', category: 'Filtering and selection', kind: 'operator', definition: 'Emits until a notifier emits, then completes.', fintechUse: 'Destroy-aware Angular subscriptions.' },
  { name: 'takeWhile', category: 'Filtering and selection', kind: 'operator', definition: 'Emits while a predicate remains true.', fintechUse: 'Poll while a case remains pending.' },
  { name: 'skip', category: 'Filtering and selection', kind: 'operator', definition: 'Ignores the first N values.', fintechUse: 'Ignore initial form defaults.' },
  { name: 'skipLast', category: 'Filtering and selection', kind: 'operator', definition: 'Suppresses the final N values, requiring completion.', fintechUse: 'Drop trailing sentinel rows.' },
  { name: 'skipUntil', category: 'Filtering and selection', kind: 'operator', definition: 'Ignores values until a notifier emits.', fintechUse: 'Ignore events before user entitlement loads.' },
  { name: 'skipWhile', category: 'Filtering and selection', kind: 'operator', definition: 'Ignores values while a predicate is true.', fintechUse: 'Ignore pending status until processing starts.' },
  { name: 'first', category: 'Filtering and selection', kind: 'operator', definition: 'Emits the first matching value or errors if none unless a default is supplied.', fintechUse: 'Read first valid route/account selection.' },
  { name: 'last', category: 'Filtering and selection', kind: 'operator', definition: 'Emits the last matching value on completion.', fintechUse: 'Capture the final status of a completed workflow.' },
  { name: 'single', category: 'Filtering and selection', kind: 'operator', definition: 'Requires exactly one matching value and errors otherwise.', fintechUse: 'Assert exactly one primary account in a stream.' },
  { name: 'elementAt', category: 'Filtering and selection', kind: 'operator', definition: 'Emits the value at a specific zero-based index.', fintechUse: 'Pick a known step from a deterministic test stream.' },
  { name: 'find', category: 'Filtering and selection', kind: 'operator', definition: 'Emits the first value matching a predicate, or undefined on completion.', fintechUse: 'Find the first breached rule.' },
  { name: 'findIndex', category: 'Filtering and selection', kind: 'operator', definition: 'Emits the index of the first matching value, or -1.', fintechUse: 'Locate first failed validation step.' },
  { name: 'distinct', category: 'Filtering and selection', kind: 'operator', definition: 'Suppresses values already seen by key until flushed.', fintechUse: 'Remove duplicate transaction ids.' },
  { name: 'distinctUntilChanged', category: 'Filtering and selection', kind: 'operator', definition: 'Suppresses consecutive duplicate values.', fintechUse: 'Avoid duplicate searches or repeated save states.' },
  { name: 'distinctUntilKeyChanged', category: 'Filtering and selection', kind: 'operator', definition: 'Suppresses consecutive duplicates by object key.', fintechUse: 'Ignore unchanged account status objects.' },
  { name: 'ignoreElements', category: 'Filtering and selection', kind: 'operator', definition: 'Drops next values but forwards error and complete.', fintechUse: 'Run side-effect-only workflows while tracking termination.' },

  { name: 'combineLatestWith', category: 'Combination', kind: 'operator', definition: 'Combines the source with other streams using latest values from each.', fintechUse: 'Price = quote plus quantity plus fee model.' },
  { name: 'withLatestFrom', category: 'Combination', kind: 'operator', definition: 'When source emits, attaches latest values from other streams.', fintechUse: 'Submit click plus latest form/auth/account state.' },
  { name: 'concatWith', category: 'Combination', kind: 'operator', definition: 'After source completes, subscribes to additional streams sequentially.', fintechUse: 'Draft, validate, then submit in strict order.' },
  { name: 'mergeWith', category: 'Combination', kind: 'operator', definition: 'Merges source with other streams concurrently.', fintechUse: 'Combine push updates and manual refresh output.' },
  { name: 'raceWith', category: 'Combination', kind: 'operator', definition: 'Mirrors whichever stream emits first.', fintechUse: 'Provider quote race or timeout race.' },
  { name: 'zipWith', category: 'Combination', kind: 'operator', definition: 'Pairs source values by index with other streams.', fintechUse: 'Pair statements with acknowledgement records.' },
  { name: 'startWith', category: 'Combination', kind: 'operator', definition: 'Prepends initial values before source emissions.', fintechUse: 'Seed forms or combineLatest defaults.' },
  { name: 'endWith', category: 'Combination', kind: 'operator', definition: 'Appends values after source completion.', fintechUse: 'Emit final UI state after upload completes.' },
  { name: 'defaultIfEmpty', category: 'Combination', kind: 'operator', definition: 'Emits a default if the source completes without values.', fintechUse: 'Render no-results state for empty searches.' },

  { name: 'mergeMap', category: 'Flattening and concurrency', kind: 'operator', definition: 'Maps values to inner Observables and merges them concurrently.', fintechUse: 'Parallel independent API enrichment.' },
  { name: 'flatMap', category: 'Flattening and concurrency', kind: 'operator', definition: 'Alias for mergeMap.', fintechUse: 'Prefer mergeMap for clarity.' },
  { name: 'concatMap', category: 'Flattening and concurrency', kind: 'operator', definition: 'Maps to inner Observables and queues them sequentially.', fintechUse: 'Payment submission where order matters.' },
  { name: 'switchMap', category: 'Flattening and concurrency', kind: 'operator', definition: 'Maps to an inner Observable and cancels the previous inner stream on a new source value.', fintechUse: 'Typeahead search, account lookup, route-driven loads.' },
  { name: 'exhaustMap', category: 'Flattening and concurrency', kind: 'operator', definition: 'Ignores new source values while the current inner Observable is active.', fintechUse: 'Prevent double-submit on fund transfer.' },
  { name: 'mergeMapTo', category: 'Flattening and concurrency', kind: 'operator', definition: 'Maps every value to the same inner Observable and merges results; legacy convenience operator.', fintechUse: 'Prefer mergeMap(() => request$).' },
  { name: 'concatMapTo', category: 'Flattening and concurrency', kind: 'operator', definition: 'Maps every value to the same inner Observable sequentially; legacy convenience operator.', fintechUse: 'Prefer concatMap(() => request$).' },
  { name: 'switchMapTo', category: 'Flattening and concurrency', kind: 'operator', definition: 'Maps every value to the same inner Observable, canceling previous work; legacy convenience operator.', fintechUse: 'Prefer switchMap(() => request$).' },
  { name: 'mergeAll', category: 'Flattening and concurrency', kind: 'operator', definition: 'Flattens a higher-order Observable by merging inner streams.', fintechUse: 'Merge independently created enrichment streams.' },
  { name: 'concatAll', category: 'Flattening and concurrency', kind: 'operator', definition: 'Flattens a higher-order Observable sequentially.', fintechUse: 'Process generated request streams in order.' },
  { name: 'switchAll', category: 'Flattening and concurrency', kind: 'operator', definition: 'Flattens by subscribing to the latest inner stream only.', fintechUse: 'Route stream of data streams.' },
  { name: 'exhaustAll', category: 'Flattening and concurrency', kind: 'operator', definition: 'Flattens by ignoring new inner streams while one is active.', fintechUse: 'Ignore repeated submit streams during active submit.' },
  { name: 'exhaust', category: 'Flattening and concurrency', kind: 'operator', definition: 'Legacy alias style for exhaustAll.', fintechUse: 'Prefer exhaustAll or exhaustMap.' },
  { name: 'combineLatestAll', category: 'Flattening and concurrency', kind: 'operator', definition: 'After source completes, combineLatest across emitted inner Observables.', fintechUse: 'Dynamic set of completed configuration streams.' },
  { name: 'combineAll', category: 'Flattening and concurrency', kind: 'operator', definition: 'Legacy name for combineLatestAll.', fintechUse: 'Prefer combineLatestAll.' },
  { name: 'zipAll', category: 'Flattening and concurrency', kind: 'operator', definition: 'After source completes, zips emitted inner Observables by index.', fintechUse: 'Pair dynamic generated streams after discovery completes.' },

  { name: 'catchError', category: 'Error and recovery', kind: 'operator', definition: 'Handles an error by returning a replacement Observable.', fintechUse: 'Fallback UI, soft-fail optional product data.' },
  { name: 'retry', category: 'Error and recovery', kind: 'operator', definition: 'Resubscribes on error up to a count or config policy.', fintechUse: 'Retry transient gateway or core-banking timeouts.' },
  { name: 'retryWhen', category: 'Error and recovery', kind: 'operator', definition: 'Uses an error notification stream to decide retry timing.', fintechUse: 'Backoff and retry after rate-limit responses.' },
  { name: 'repeat', category: 'Error and recovery', kind: 'operator', definition: 'Resubscribes after successful completion.', fintechUse: 'Repeat finite polling cycles.' },
  { name: 'repeatWhen', category: 'Error and recovery', kind: 'operator', definition: 'Uses completion notifications to decide repeat timing.', fintechUse: 'Scheduled refresh after completion.' },
  { name: 'onErrorResumeNext', category: 'Error and recovery', kind: 'operator', definition: 'Continues with the next stream after errors without passing the error downstream.', fintechUse: 'Best-effort optional widgets.' },
  { name: 'onErrorResumeNextWith', category: 'Error and recovery', kind: 'operator', definition: 'Pipeable variant that continues with fallback streams after errors.', fintechUse: 'Best-effort optional widgets with explicit fallbacks.' },
  { name: 'throwIfEmpty', category: 'Error and recovery', kind: 'operator', definition: 'Errors if the source completes without values.', fintechUse: 'Treat missing customer or account data as exceptional.' },
  { name: 'timeout', category: 'Error and recovery', kind: 'operator', definition: 'Errors or switches if values do not arrive within a time policy.', fintechUse: 'Guard slow KYC, sanctions, or quote APIs.' },
  { name: 'timeoutWith', category: 'Error and recovery', kind: 'operator', definition: 'Legacy timeout fallback operator.', fintechUse: 'Prefer timeout with config in new code.' },

  { name: 'count', category: 'Aggregation and boolean', kind: 'operator', definition: 'Counts source emissions, optionally matching a predicate, then emits on completion.', fintechUse: 'Count validation failures in a batch.' },
  { name: 'reduce', category: 'Aggregation and boolean', kind: 'operator', definition: 'Accumulates one final value when source completes.', fintechUse: 'Calculate final total from a finite batch.' },
  { name: 'toArray', category: 'Aggregation and boolean', kind: 'operator', definition: 'Collects all values into an array when source completes.', fintechUse: 'Materialize finite API pages for export.' },
  { name: 'max', category: 'Aggregation and boolean', kind: 'operator', definition: 'Emits the maximum source value on completion.', fintechUse: 'Largest exposure in a completed scenario set.' },
  { name: 'min', category: 'Aggregation and boolean', kind: 'operator', definition: 'Emits the minimum source value on completion.', fintechUse: 'Lowest quote or rate in a completed provider list.' },
  { name: 'every', category: 'Aggregation and boolean', kind: 'operator', definition: 'Returns true if every source value satisfies a predicate.', fintechUse: 'All compliance checks passed.' },
  { name: 'isEmpty', category: 'Aggregation and boolean', kind: 'operator', definition: 'Returns true if source completes without emissions.', fintechUse: 'No open alerts or no search results.' },
  { name: 'sequenceEqual', category: 'Aggregation and boolean', kind: 'operator', definition: 'Compares two finite streams for identical sequence.', fintechUse: 'Validate generated cash-flow schedule against expected rows.' },

  { name: 'debounce', category: 'Time and rate limiting', kind: 'operator', definition: 'Waits for a duration Observable to complete before emitting the latest value.', fintechUse: 'Variable debounce based on query length or risk tier.' },
  { name: 'debounceTime', category: 'Time and rate limiting', kind: 'operator', definition: 'Emits the latest value after a fixed quiet period.', fintechUse: 'Search boxes, validation calls, autosave.' },
  { name: 'throttle', category: 'Time and rate limiting', kind: 'operator', definition: 'Limits emissions using a duration Observable.', fintechUse: 'Rate-limit expensive chart refreshes.' },
  { name: 'throttleTime', category: 'Time and rate limiting', kind: 'operator', definition: 'Allows at most one value per fixed time window.', fintechUse: 'Limit high-frequency price ticks in the UI.' },
  { name: 'audit', category: 'Time and rate limiting', kind: 'operator', definition: 'Ignores values for a duration, then emits the most recent value.', fintechUse: 'Render latest portfolio state after bursty events.' },
  { name: 'auditTime', category: 'Time and rate limiting', kind: 'operator', definition: 'Ignores values for a fixed time, then emits the latest.', fintechUse: 'Coalesce rapid balance updates.' },
  { name: 'sample', category: 'Time and rate limiting', kind: 'operator', definition: 'Emits the latest source value when a notifier emits.', fintechUse: 'Sample live exposure on a timer.' },
  { name: 'sampleTime', category: 'Time and rate limiting', kind: 'operator', definition: 'Samples latest value on a fixed interval.', fintechUse: 'Update live dashboards at a stable cadence.' },
  { name: 'delay', category: 'Time and rate limiting', kind: 'operator', definition: 'Delays emissions by time or date.', fintechUse: 'Simulate API latency or delay UI transitions.' },
  { name: 'delayWhen', category: 'Time and rate limiting', kind: 'operator', definition: 'Delays each value using a duration Observable.', fintechUse: 'Delay retry display based on response headers.' },
  { name: 'timeInterval', category: 'Time and rate limiting', kind: 'operator', definition: 'Annotates values with time since previous emission.', fintechUse: 'Measure API heartbeat or tick gaps.' },
  { name: 'timestamp', category: 'Time and rate limiting', kind: 'operator', definition: 'Annotates each value with current timestamp.', fintechUse: 'Client-side event audit metadata.' },

  { name: 'share', category: 'Multicasting', kind: 'operator', definition: 'Shares one subscription among multiple subscribers with ref counting.', fintechUse: 'Avoid duplicate HTTP or WebSocket side effects.' },
  { name: 'shareReplay', category: 'Multicasting', kind: 'operator', definition: 'Shares a source and replays buffered values to late subscribers.', fintechUse: 'Cache latest account summary or lookup result.' },
  { name: 'connect', category: 'Multicasting', kind: 'operator', definition: 'Multicasts through a connector within a selector function.', fintechUse: 'Controlled shared execution for expensive streams.' },
  { name: 'connectable', category: 'Multicasting', kind: 'utility', definition: 'Creates a connectable Observable with an explicit connector.', fintechUse: 'Advanced shared execution control.' },
  { name: 'multicast', category: 'Multicasting', kind: 'operator', definition: 'Legacy multicasting operator using a Subject.', fintechUse: 'Prefer share or connect in new code.' },
  { name: 'refCount', category: 'Multicasting', kind: 'operator', definition: 'Connects while subscriber count is greater than zero.', fintechUse: 'Automatically manage shared live feeds.' },
  { name: 'publish', category: 'Multicasting', kind: 'operator', definition: 'Legacy publish operator.', fintechUse: 'Prefer share or connectable.' },
  { name: 'publishBehavior', category: 'Multicasting', kind: 'operator', definition: 'Legacy BehaviorSubject-backed publish operator.', fintechUse: 'Prefer share with connector configuration.' },
  { name: 'publishLast', category: 'Multicasting', kind: 'operator', definition: 'Legacy AsyncSubject-backed publish operator.', fintechUse: 'Prefer share with connector configuration.' },
  { name: 'publishReplay', category: 'Multicasting', kind: 'operator', definition: 'Legacy ReplaySubject-backed publish operator.', fintechUse: 'Prefer shareReplay or share configuration.' },

  { name: 'tap', category: 'Utility and lifecycle', kind: 'operator', definition: 'Performs side effects for notifications without changing values.', fintechUse: 'Logging, metrics, audit breadcrumbs.' },
  { name: 'finalize', category: 'Utility and lifecycle', kind: 'operator', definition: 'Runs cleanup when source completes, errors, or is unsubscribed.', fintechUse: 'Stop loading state and close resources reliably.' },
  { name: 'materialize', category: 'Utility and lifecycle', kind: 'operator', definition: 'Turns next, error, and complete into Notification values.', fintechUse: 'Represent stream lifecycle in diagnostics UI.' },
  { name: 'dematerialize', category: 'Utility and lifecycle', kind: 'operator', definition: 'Turns Notification values back into real stream notifications.', fintechUse: 'Replay captured stream events.' },
  { name: 'observeOn', category: 'Schedulers and interop', kind: 'operator', definition: 'Reschedules downstream notifications on a scheduler.', fintechUse: 'Move heavy UI notification timing to a chosen scheduler.' },
  { name: 'subscribeOn', category: 'Schedulers and interop', kind: 'operator', definition: 'Controls the scheduler used for source subscription side effects.', fintechUse: 'Testing and advanced subscription timing control.' },
  { name: 'asyncScheduler', category: 'Schedulers and interop', kind: 'scheduler', definition: 'Scheduler backed by async tasks such as setTimeout.', fintechUse: 'Time-based operators and delayed work.' },
  { name: 'async', category: 'Schedulers and interop', kind: 'scheduler', definition: 'Legacy alias for asyncScheduler.', fintechUse: 'Prefer asyncScheduler in new code.' },
  { name: 'asapScheduler', category: 'Schedulers and interop', kind: 'scheduler', definition: 'Scheduler for microtask-like ASAP work.', fintechUse: 'Advanced ordering and test control.' },
  { name: 'asap', category: 'Schedulers and interop', kind: 'scheduler', definition: 'Legacy alias for asapScheduler.', fintechUse: 'Prefer asapScheduler in new code.' },
  { name: 'queueScheduler', category: 'Schedulers and interop', kind: 'scheduler', definition: 'Synchronous queue scheduler.', fintechUse: 'Deterministic recursive scheduling.' },
  { name: 'queue', category: 'Schedulers and interop', kind: 'scheduler', definition: 'Legacy alias for queueScheduler.', fintechUse: 'Prefer queueScheduler in new code.' },
  { name: 'animationFrameScheduler', category: 'Schedulers and interop', kind: 'scheduler', definition: 'Scheduler aligned to browser animation frames.', fintechUse: 'Chart and canvas updates.' },
  { name: 'animationFrame', category: 'Schedulers and interop', kind: 'scheduler', definition: 'Legacy alias for animationFrameScheduler.', fintechUse: 'Prefer animationFrameScheduler in new code.' },
  { name: 'VirtualTimeScheduler', category: 'Schedulers and interop', kind: 'scheduler', definition: 'Scheduler for virtual-time tests.', fintechUse: 'Deterministic marble-style tests.' },
  { name: 'firstValueFrom', category: 'Schedulers and interop', kind: 'utility', definition: 'Converts the first emitted value to a Promise and unsubscribes.', fintechUse: 'Bridge route guards or async functions that need one value.' },
  { name: 'lastValueFrom', category: 'Schedulers and interop', kind: 'utility', definition: 'Converts the final value on completion to a Promise.', fintechUse: 'Bridge finite batch streams to async/await.' },
  { name: 'isObservable', category: 'Schedulers and interop', kind: 'utility', definition: 'Runtime check for observable-like RxJS instances.', fintechUse: 'Library boundary validation.' },
  { name: 'pipe', category: 'Schedulers and interop', kind: 'utility', definition: 'Functional composition helper used internally by Observable.pipe.', fintechUse: 'Reusable operator factories.' },
  { name: 'identity', category: 'Schedulers and interop', kind: 'utility', definition: 'Returns the input unchanged.', fintechUse: 'Default projection or testing helper.' },
  { name: 'noop', category: 'Schedulers and interop', kind: 'utility', definition: 'Function that does nothing.', fintechUse: 'Default callback placeholder.' },
  { name: 'config', category: 'Schedulers and interop', kind: 'utility', definition: 'Global RxJS configuration object.', fintechUse: 'Rare framework-level configuration.' },
  { name: 'observable', category: 'Schedulers and interop', kind: 'utility', definition: 'Symbol used for observable interop.', fintechUse: 'Library interoperability.' },
];

const SEARCH_PIPELINE_CODE = `const accountResults$ = searchTerms$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap((term) =>
    accountApi.lookup(term).pipe(
      catchError(() => of([])),
      finalize(() => metrics.requestClosed(term))
    )
  ),
  shareReplay({ bufferSize: 1, refCount: true })
);`;

const PAYMENT_PIPELINE_CODE = `from(paymentBatch).pipe(
  concatMap((payment) =>
    paymentApi.authorize(payment).pipe(
      retry(1),
      catchError((err) => of({ payment, status: 'failed', err }))
    )
  ),
  scan((ledger, result) => [...ledger, result], []),
  finalize(() => loading.set(false))
);`;

const RISK_PIPELINE_CODE = `forkJoin({
  exposure: exposureApi.snapshot(accountId),
  kyc: kycApi.status(customerId),
  sanctions: sanctionsApi.screen(customerId),
}).pipe(
  map(({ exposure, kyc, sanctions }) => decide({ exposure, kyc, sanctions }))
);

combineLatest([fxTick$, position$]).pipe(
  map(([rate, position]) => rate * position),
  filter((value) => value > limit)
);`;
