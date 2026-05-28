import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  forkJoin,
  from,
  merge,
  of,
  timer,
} from 'rxjs';
import {
  bufferCount,
  catchError,
  concatMap,
  delay,
  exhaustMap,
  filter,
  finalize,
  map,
  mergeMap,
  scan,
  shareReplay,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { CodeFile, CodeViewerComponent } from '../code-viewer/code-viewer.component';

interface FlowCard {
  title: string;
  purpose: string;
  backendContract: string;
  operators: string[];
}

interface FlowLog {
  id: number;
  app: string;
  message: string;
}

interface TradeEvent {
  trader: string;
  symbol: string;
  notional: number;
  side: 'BUY' | 'SELL';
}

@Component({
  selector: 'lib-rxjs-fintech-flows',
  standalone: true,
  imports: [CommonModule, CodeViewerComponent],
  templateUrl: './rxjs-fintech-flows.component.html',
  styleUrls: ['./rxjs-fintech-flows.component.scss'],
})
export class RxjsFintechFlowsComponent {
  private logId = 0;

  logs: FlowLog[] = [];
  activeSummary = 'Run a flow to populate the operations log.';

  readonly flows: FlowCard[] = [
    {
      title: 'Loan Origination Cockpit',
      purpose:
        'Aggregates customer profile, bureau score, affordability, and product offers whenever customer or product changes.',
      backendContract:
        'Angular calls Java/FastAPI BFF endpoints that wrap KYC, bureau, pricing, and offer services.',
      operators: ['BehaviorSubject', 'combineLatest', 'switchMap', 'forkJoin', 'catchError', 'shareReplay'],
    },
    {
      title: 'Transfer Submit Guard',
      purpose:
        'Protects a money-movement command from double-submit while still allowing a later transfer after completion.',
      backendContract:
        'Angular posts an idempotency key to a payment orchestration API backed by ACH, card, or wire rails.',
      operators: ['Subject', 'withLatestFrom', 'exhaustMap', 'finalize', 'catchError'],
    },
    {
      title: 'Trade Surveillance Stream',
      purpose:
        'Batches high-volume trade events, scores them asynchronously, and accumulates alerts for the desk.',
      backendContract:
        'Angular consumes a WebSocket/SSE stream from a surveillance service and enriches against risk models.',
      operators: ['merge', 'concatMap', 'bufferCount', 'mergeMap', 'filter', 'scan'],
    },
  ];

  readonly codeFiles: CodeFile[] = [
    { name: 'loan-origination-flow.ts', language: 'typescript', code: LOAN_FLOW_CODE },
    { name: 'transfer-submit-guard.ts', language: 'typescript', code: TRANSFER_FLOW_CODE },
    { name: 'trade-surveillance-stream.ts', language: 'typescript', code: TRADE_FLOW_CODE },
  ];

  runLoanOrigination(): void {
    this.reset('Loan Origination Cockpit');

    const customerId$ = new BehaviorSubject<string>('CUST-1042');
    const product$ = new BehaviorSubject<string>('SME working capital');

    combineLatest([customerId$, product$])
      .pipe(
        tap(([customerId, product]) => this.addLog('loan', `load requested for ${customerId} and ${product}`)),
        switchMap(([customerId, product]) =>
          forkJoin({
            profile: this.fetchProfile(customerId),
            bureau: this.fetchBureau(customerId),
            affordability: this.fetchAffordability(customerId),
            offer: this.fetchOffer(product),
          }).pipe(
            map((snapshot) => ({
              customerId,
              product,
              decision:
                snapshot.bureau >= 720 && snapshot.affordability > 1.25 ? 'pre-approved' : 'manual review',
              limit: snapshot.offer.limit,
            })),
            catchError((err: Error) => of({ customerId, product, decision: err.message, limit: 0 }))
          )
        ),
        shareReplay({ bufferSize: 1, refCount: true })
      )
      .subscribe((decision) => {
        this.activeSummary = `${decision.customerId}: ${decision.decision}, limit USD ${decision.limit}`;
        this.addLog('loan', this.activeSummary);
      });

    customerId$.next('CUST-2044');
    product$.next('Treasury overdraft');
    customerId$.complete();
    product$.complete();
  }

  runTransferGuard(): void {
    this.reset('Transfer Submit Guard');

    const submit$ = new Subject<string>();
    const account$ = new BehaviorSubject<string>('OPERATING-7781');

    submit$
      .pipe(
        tap((idempotencyKey) => this.addLog('transfer', `click ${idempotencyKey}`)),
        withLatestFrom(account$),
        exhaustMap(([idempotencyKey, accountId]) =>
          this.submitTransfer(idempotencyKey, accountId).pipe(
            catchError((err: Error) => of(`failed: ${err.message}`)),
            finalize(() => this.addLog('transfer', `${idempotencyKey} request finalized`))
          )
        )
      )
      .subscribe((message) => {
        this.activeSummary = message;
        this.addLog('transfer', message);
      });

    submit$.next('IDEMP-001');
    submit$.next('IDEMP-001-duplicate');
    timer(260).subscribe(() => {
      submit$.next('IDEMP-002');
      submit$.complete();
      account$.complete();
    });
  }

  runTradeSurveillance(): void {
    this.reset('Trade Surveillance Stream');

    const blotterA$ = from([
      { trader: 'A. Rao', symbol: 'FINBOND', notional: 750000, side: 'BUY' as const },
      { trader: 'A. Rao', symbol: 'FXUSD', notional: 2900000, side: 'SELL' as const },
      { trader: 'M. Singh', symbol: 'NIFTYOPT', notional: 400000, side: 'BUY' as const },
    ]).pipe(concatMap((trade) => of(trade).pipe(delay(60))));

    const blotterB$ = from([
      { trader: 'E. Chen', symbol: 'FINBOND', notional: 1800000, side: 'SELL' as const },
      { trader: 'M. Singh', symbol: 'FXUSD', notional: 3100000, side: 'BUY' as const },
      { trader: 'A. Rao', symbol: 'SMECREDIT', notional: 950000, side: 'BUY' as const },
    ]).pipe(concatMap((trade) => of(trade).pipe(delay(80))));

    merge(blotterA$, blotterB$)
      .pipe(
        tap((trade) => this.addLog('surveillance', `trade ${trade.trader} ${trade.side} ${trade.symbol} ${trade.notional}`)),
        bufferCount(3),
        mergeMap((batch) => this.scoreBatch(batch)),
        filter((alert) => alert.score >= 80),
        scan((alerts, alert) => [...alerts, alert], [] as Array<{ trader: string; score: number; reason: string }>),
        finalize(() => this.addLog('surveillance', 'surveillance stream finalized'))
      )
      .subscribe((alerts) => {
        this.activeSummary = `${alerts.length} high-priority alert(s) accumulated`;
        this.addLog('surveillance', this.activeSummary);
      });
  }

  private fetchProfile(customerId: string): Observable<string> {
    return of(`${customerId} profile complete`).pipe(delay(90));
  }

  private fetchBureau(customerId: string): Observable<number> {
    const score = customerId === 'CUST-2044' ? 690 : 742;
    return of(score).pipe(delay(140));
  }

  private fetchAffordability(customerId: string): Observable<number> {
    const ratio = customerId === 'CUST-2044' ? 1.1 : 1.42;
    return of(ratio).pipe(delay(110));
  }

  private fetchOffer(product: string): Observable<{ product: string; limit: number }> {
    return of({ product, limit: 250000 }).pipe(delay(150));
  }

  private submitTransfer(idempotencyKey: string, accountId: string): Observable<string> {
    return of(`transfer ${idempotencyKey} accepted for ${accountId}`).pipe(delay(220));
  }

  private scoreBatch(batch: TradeEvent[]): Observable<{ trader: string; score: number; reason: string }> {
    const largest = batch.reduce((max, trade) => (trade.notional > max.notional ? trade : max), batch[0]);
    const score = largest.notional > 2500000 ? 92 : 68;
    const reason = largest.notional > 2500000 ? 'large notional concentration' : 'normal batch';

    return of({ trader: largest.trader, score, reason }).pipe(delay(120));
  }

  private reset(summary: string): void {
    this.logs = [];
    this.activeSummary = summary;
  }

  private addLog(app: string, message: string): void {
    this.logs.unshift({ id: ++this.logId, app, message });
  }
}

const LOAN_FLOW_CODE = `const customerId$ = new BehaviorSubject('CUST-1042');
const product$ = new BehaviorSubject('SME working capital');

const decision$ = combineLatest([customerId$, product$]).pipe(
  switchMap(([customerId, product]) =>
    forkJoin({
      profile: profileApi.get(customerId),
      bureau: bureauApi.score(customerId),
      affordability: affordabilityApi.ratio(customerId),
      offer: offerApi.quote(product),
    }).pipe(
      map((snapshot) => decide(snapshot)),
      catchError((err) => of({ status: 'manual-review', reason: err.message }))
    )
  ),
  shareReplay({ bufferSize: 1, refCount: true })
);`;

const TRANSFER_FLOW_CODE = `submitTransferClicks$.pipe(
  withLatestFrom(selectedAccount$),
  exhaustMap(([idempotencyKey, accountId]) =>
    paymentApi.submit({ idempotencyKey, accountId }).pipe(
      catchError((err) => of({ status: 'failed', err })),
      finalize(() => formBusy.set(false))
    )
  )
);`;

const TRADE_FLOW_CODE = `merge(blotterA$, blotterB$).pipe(
  concatMap((trade) => of(trade).pipe(delay(20))),
  bufferCount(100),
  mergeMap((batch) => surveillanceApi.score(batch)),
  filter((alert) => alert.score >= 80),
  scan((alerts, alert) => [alert, ...alerts], [])
);`;
