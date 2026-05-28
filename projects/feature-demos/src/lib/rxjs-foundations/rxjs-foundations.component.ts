import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import {
  AsyncSubject,
  BehaviorSubject,
  Observable,
  Observer,
  ReplaySubject,
  Subject,
  Subscription,
  interval,
  map,
  take,
  tap,
} from 'rxjs';
import { CodeFile, CodeViewerComponent } from '../code-viewer/code-viewer.component';

interface ConceptCard {
  name: string;
  definition: string;
  fintechUse: string;
  seniorNote: string;
}

interface SubjectType {
  name: string;
  memory: string;
  lateSubscriber: string;
  completeBehavior: string;
  fintechFit: string;
}

interface DemoLog {
  id: number;
  channel: 'Observable' | 'Observer' | 'Subject' | 'Behavior' | 'Replay' | 'Async' | 'Subscription';
  message: string;
}

@Component({
  selector: 'lib-rxjs-foundations',
  standalone: true,
  imports: [CommonModule, CodeViewerComponent],
  templateUrl: './rxjs-foundations.component.html',
  styleUrls: ['./rxjs-foundations.component.scss'],
})
export class RxjsFoundationsComponent implements OnDestroy {
  private logId = 0;
  private pollingSub?: Subscription;
  private coldRun = 0;

  logs: DemoLog[] = [];

  readonly concepts: ConceptCard[] = [
    {
      name: 'Observable',
      definition:
        'A lazy push source. Nothing executes until someone subscribes, then it can emit zero to many values, error, or complete.',
      fintechUse:
        'HTTP calls, WebSocket market ticks, user-input streams, fraud-rule responses, KYC workflow status changes.',
      seniorNote:
        'An Observable describes a producer. It is not the produced value and it is not automatically shared.',
    },
    {
      name: 'Observer',
      definition:
        'A consumer contract with next, error, and complete callbacks. The Observable pushes notifications into it.',
      fintechUse:
        'A quote screen observer renders ticks, an audit observer records events, an error observer routes failed payments.',
      seniorNote:
        'In Angular templates, the async pipe creates and owns an observer for you.',
    },
    {
      name: 'Subscription',
      definition:
        'The disposable handle returned by subscribe. It represents one execution and can cancel work through unsubscribe.',
      fintechUse:
        'Stop polling a loan application, detach a live-trade widget, cancel a long-lived browser event stream.',
      seniorNote:
        'Unsubscribe matters for infinite or long-lived streams. Finite HTTP streams complete by themselves.',
    },
    {
      name: 'Subject',
      definition:
        'Both Observable and Observer. It multicasts values to current subscribers and remembers no previous value.',
      fintechUse:
        'Internal event bus for command clicks, manual refresh triggers, upload progress events, wizard transitions.',
      seniorNote:
        'A late subscriber misses prior emissions. Use it for events, not durable state.',
    },
  ];

  readonly subjectTypes: SubjectType[] = [
    {
      name: 'Subject',
      memory: 'No stored value',
      lateSubscriber: 'Receives only future emissions',
      completeBehavior: 'Completes current and future subscribers',
      fintechFit: 'Button commands, payment retry clicks, manual refresh triggers',
    },
    {
      name: 'BehaviorSubject',
      memory: 'Stores exactly one current value and requires an initial value',
      lateSubscriber: 'Immediately receives the latest value',
      completeBehavior: 'After complete, new subscribers receive only complete',
      fintechFit: 'Current account, selected portfolio, feature flag, auth session state',
    },
    {
      name: 'ReplaySubject',
      memory: 'Stores a configured count or time window of previous values',
      lateSubscriber: 'Replays buffered history, then receives future emissions',
      completeBehavior: 'After complete, new subscribers receive replayed values and complete',
      fintechFit: 'Recent audit trail, latest N price ticks, chat/escalation transcript buffer',
    },
    {
      name: 'AsyncSubject',
      memory: 'Stores only the final value before completion',
      lateSubscriber: 'Receives final value only after complete',
      completeBehavior: 'Must complete before any value is delivered',
      fintechFit: 'One final export URL, signed document result, batch settlement confirmation',
    },
  ];

  readonly codeFiles: CodeFile[] = [
    {
      name: 'observable-observer-subscription.ts',
      language: 'typescript',
      code: FOUNDATION_OBSERVABLE_CODE,
    },
    {
      name: 'subject-types.ts',
      language: 'typescript',
      code: FOUNDATION_SUBJECT_CODE,
    },
  ];

  runSubjectComparison(): void {
    this.logs = [];

    const subject = new Subject<string>();
    subject.subscribe((value) => this.addLog('Subject', `A received ${value}`));
    subject.next('order-created');
    subject.next('risk-approved');
    subject.subscribe((value) => this.addLog('Subject', `B late subscriber received ${value}`));
    subject.next('settlement-booked');
    subject.complete();

    const behavior = new BehaviorSubject<string>('kyc-pending');
    behavior.subscribe((value) => this.addLog('Behavior', `A received ${value}`));
    behavior.next('kyc-review');
    behavior.next('kyc-approved');
    behavior.subscribe((value) => this.addLog('Behavior', `B late subscriber immediately received ${value}`));
    behavior.complete();

    const replay = new ReplaySubject<string>(2);
    replay.next('tick: 100.10');
    replay.next('tick: 100.15');
    replay.next('tick: 100.12');
    replay.subscribe((value) => this.addLog('Replay', `B replayed ${value}`));
    replay.next('tick: 100.18');
    replay.complete();

    const asyncSubject = new AsyncSubject<string>();
    asyncSubject.subscribe((value) => this.addLog('Async', `A received final ${value}`));
    asyncSubject.next('export-started');
    asyncSubject.next('export-validating');
    asyncSubject.next('export-ready-url');
    asyncSubject.subscribe((value) => this.addLog('Async', `B received final ${value}`));
    asyncSubject.complete();
  }

  runColdHotDemo(): void {
    this.logs = [];

    const coldLedger$ = new Observable<string>((observer: Observer<string>) => {
      const run = ++this.coldRun;
      observer.next(`ledger execution ${run}: open connection`);
      observer.next(`ledger execution ${run}: emit balance snapshot`);
      observer.complete();
    });

    coldLedger$.subscribe((value) => this.addLog('Observable', `Subscriber A ${value}`));
    coldLedger$.subscribe((value) => this.addLog('Observable', `Subscriber B ${value}`));

    const hotDesk = new Subject<string>();
    hotDesk.subscribe((value) => this.addLog('Subject', `Trader A saw ${value}`));
    hotDesk.subscribe((value) => this.addLog('Subject', `Trader B saw ${value}`));
    hotDesk.next('same multicast FX tick: EUR/USD 1.0842');
    hotDesk.complete();
  }

  startPollingDemo(): void {
    this.cancelPollingDemo();
    this.addLog('Subscription', 'Started AML review polling every 500ms');

    this.pollingSub = interval(500)
      .pipe(
        take(6),
        map((index) => index + 1),
        tap((attempt) => this.addLog('Subscription', `poll attempt ${attempt}: review still active`))
      )
      .subscribe({
        complete: () => this.addLog('Subscription', 'Polling completed after finite take(6) guard'),
      });
  }

  cancelPollingDemo(): void {
    if (this.pollingSub && !this.pollingSub.closed) {
      this.pollingSub.unsubscribe();
      this.addLog('Subscription', 'Polling cancelled through unsubscribe()');
    }
  }

  ngOnDestroy(): void {
    this.cancelPollingDemo();
  }

  private addLog(channel: DemoLog['channel'], message: string): void {
    this.logs.unshift({ id: ++this.logId, channel, message });
  }
}

const FOUNDATION_OBSERVABLE_CODE = `import { Observable, Observer, Subscription } from 'rxjs';

const ledgerSnapshot$ = new Observable<number>((observer: Observer<number>) => {
  observer.next(124500);
  observer.next(124900);
  observer.complete();

  return () => {
    // Teardown runs on complete, error, or unsubscribe.
    console.log('close socket, abort request, remove event listener');
  };
});

const subscription: Subscription = ledgerSnapshot$.subscribe({
  next: (balance) => renderBalance(balance),
  error: (err) => showIncident(err),
  complete: () => markWidgetFresh(),
});

subscription.unsubscribe();`;

const FOUNDATION_SUBJECT_CODE = `import { AsyncSubject, BehaviorSubject, ReplaySubject, Subject } from 'rxjs';

// Event stream: late subscribers miss prior events.
const refreshClicks$ = new Subject<void>();

// State stream: late subscribers receive the current value.
const selectedAccount$ = new BehaviorSubject<string>('ACC-001');

// History stream: late subscribers receive the last two ticks.
const recentTicks$ = new ReplaySubject<number>(2);

// Final-result stream: emits only the last value when completed.
const statementExport$ = new AsyncSubject<string>();

statementExport$.next('draft-url');
statementExport$.next('final-signed-url');
statementExport$.complete();`;
