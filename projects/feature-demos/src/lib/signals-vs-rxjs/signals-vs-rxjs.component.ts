import {
  Component,
  signal,
  computed,
  effect,
  OnInit,
  OnDestroy,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, Subject, of, Observable } from 'rxjs';
import { map, takeUntil, delay, switchMap, startWith } from 'rxjs/operators';
import { rxResource } from '@angular/core/rxjs-interop';
import { CodeViewerComponent, CodeFile } from '../code-viewer/code-viewer.component';
import { SIGNALS_VS_RXJS_TS, SIGNALS_VS_RXJS_HTML } from '../code-snippets';

interface ConsoleLog {
  id: number;
  timestamp: string;
  source: 'RxJS' | 'Signals' | 'Info';
  message: string;
  isGlitch?: boolean;
}

@Component({
  selector: 'lib-signals-vs-rxjs',
  standalone: true,
  imports: [CommonModule, FormsModule, CodeViewerComponent],
  templateUrl: './signals-vs-rxjs.component.html',
  styleUrls: ['./signals-vs-rxjs.component.scss'],
})
export class SignalsVsRxjsComponent implements OnInit, OnDestroy {
  readonly codeFiles: CodeFile[] = [
    { name: 'signals-vs-rxjs.component.ts', code: SIGNALS_VS_RXJS_TS, language: 'typescript' },
    { name: 'signals-vs-rxjs.component.html', code: SIGNALS_VS_RXJS_HTML, language: 'html' },
  ];

  // ── Console Logs ──────────────────────────────────────────
  consoleLogs: ConsoleLog[] = [];
  private logIdCounter = 0;
  private initialized = false;

  // ── Initial Values ────────────────────────────────────────
  readonly initialPrice = 100;
  readonly initialQty = 2;
  readonly initialDiscount = 10;

  // ──────────────────────────────────────────────────────────
  // SIGNALS IMPLEMENTATION
  // ──────────────────────────────────────────────────────────
  priceSig    = signal<number>(this.initialPrice);
  quantitySig = signal<number>(this.initialQty);
  discountSig = signal<number>(this.initialDiscount);
  currencySig = signal<'USD' | 'EUR' | 'INR'>('USD');

  // Pure derivations — NO side-effects inside computed()
  // computed() must stay referentially transparent (pure functions only)
  subtotalSig    = computed(() => this.priceSig() * this.quantitySig());
  discountAmtSig = computed(() => (this.subtotalSig() * this.discountSig()) / 100);
  totalSig       = computed(() => this.subtotalSig() - this.discountAmtSig());

  // Async: Angular 19 rxResource — reactive wrapper around async data
  currencyRateResource = rxResource({
    request: () => this.currencySig(),
    loader: ({ request: currency }) => this.fetchExchangeRate(currency),
  });

  convertedTotalSig = computed(() => {
    const rate = this.currencyRateResource.value() ?? 1.0;
    return this.totalSig() * rate;
  });

  // ──────────────────────────────────────────────────────────
  // RxJS IMPLEMENTATION
  // ──────────────────────────────────────────────────────────
  price$    = new BehaviorSubject<number>(this.initialPrice);
  quantity$ = new BehaviorSubject<number>(this.initialQty);
  discount$ = new BehaviorSubject<number>(this.initialDiscount);
  currency$ = new BehaviorSubject<'USD' | 'EUR' | 'INR'>('USD');

  subtotal$:      Observable<number>;
  discountAmt$:   Observable<number>;
  total$:         Observable<number>;
  exchangeRate$:  Observable<number>;
  convertedTotal$: Observable<number>;

  // Cached values for template binding (avoids spawning extra async pipe subscriptions)
  rxSubtotal = 0;
  rxDiscount = 0;
  rxTotal    = 0;
  rxConverted = 0;
  rxCurrency: 'USD' | 'EUR' | 'INR' = 'USD';

  private destroy$ = new Subject<void>();

  // trackBy for ngFor performance
  trackById(_: number, log: ConsoleLog): number {
    return log.id;
  }

  constructor() {

    // ── Build RxJS derivation chains ──────────────────────────
    this.subtotal$ = combineLatest([this.price$, this.quantity$]).pipe(
      map(([p, q]) => p * q),
    );

    this.discountAmt$ = combineLatest([this.subtotal$, this.discount$]).pipe(
      map(([sub, d]) => (sub * d) / 100),
    );

    this.total$ = combineLatest([this.subtotal$, this.discountAmt$]).pipe(
      map(([sub, disc]) => sub - disc),
    );

    this.exchangeRate$ = this.currency$.pipe(
      switchMap((curr) => this.fetchExchangeRate(curr)),
      startWith(1.0),
    );

    this.convertedTotal$ = combineLatest([this.total$, this.exchangeRate$]).pipe(
      map(([tot, rate]) => tot * rate),
    );

    // ── Signals: side-effects live in effect(), NOT computed() ──
    // effect() is scheduled by Angular's reactive graph — it re-runs any time
    // any signal it reads changes. Using untracked() prevents nested reads
    // from adding extra dependencies.
    effect(() => {
      const sub  = this.subtotalSig();
      const disc = this.discountAmtSig();
      const tot  = this.totalSig();
      const p    = this.priceSig();
      const q    = this.quantitySig();
      const d    = this.discountSig();

      untracked(() => {
        if (!this.initialized) return;
        // Effect fires ONCE per batch — even if multiple signals changed
        this.addLog('Signals', `Computed: $${p} × ${q} = subtotal $${sub} | −${d}% = $${disc.toFixed(2)} | Total = $${tot.toFixed(2)}`);
      });
    });
  }

  ngOnInit(): void {
    // Subscribe to RxJS streams and log emissions
    this.subtotal$.pipe(takeUntil(this.destroy$)).subscribe((sub) => {
      this.rxSubtotal = sub;
      if (this.initialized) {
        const p = this.price$.value;
        const q = this.quantity$.value;
        this.addLog('RxJS', `Derived Subtotal: $${p} × ${q} = $${sub}`);
      }
    });

    this.discountAmt$.pipe(takeUntil(this.destroy$)).subscribe((disc) => {
      this.rxDiscount = disc;
      if (this.initialized) {
        const sub = this.price$.value * this.quantity$.value;
        const d   = this.discount$.value;
        this.addLog('RxJS', `Derived Discount: ($${sub} × ${d}%) = $${disc.toFixed(2)}`);
      }
    });

    this.total$.pipe(takeUntil(this.destroy$)).subscribe((tot) => {
      this.rxTotal = tot;
      if (this.initialized) {
        const sub  = this.price$.value * this.quantity$.value;
        const disc = (sub * this.discount$.value) / 100;
        this.addLog('RxJS', `Derived Total: $${sub} − $${disc.toFixed(2)} = $${tot.toFixed(2)}`);
      }
    });

    this.exchangeRate$.pipe(takeUntil(this.destroy$)).subscribe();

    this.convertedTotal$.pipe(takeUntil(this.destroy$)).subscribe((ct) => {
      this.rxConverted = ct;
    });

    this.currency$.pipe(takeUntil(this.destroy$)).subscribe((c) => {
      this.rxCurrency = c;
    });

    // Allow boot subscriptions to settle silently before enabling logging
    setTimeout(() => { this.initialized = true; }, 80);
  }

  // ── Controls ──────────────────────────────────────────────
  updatePrice(val: number): void {
    const n = Number(val);
    this.priceSig.set(n);
    this.price$.next(n);
  }

  updateQuantity(val: number): void {
    const n = Number(val);
    this.quantitySig.set(n);
    this.quantity$.next(n);
  }

  updateDiscount(val: number): void {
    const n = Number(val);
    this.discountSig.set(n);
    this.discount$.next(n);
  }

  updateCurrency(val: 'USD' | 'EUR' | 'INR'): void {
    this.currencySig.set(val);
    this.currency$.next(val);
  }

  /**
   * THE GLITCH DEMONSTRATION
   *
   * When two BehaviorSubjects are updated synchronously, combineLatest fires
   * for EACH .next() call independently — producing a transient, incorrect
   * intermediate state before the second update arrives:
   *
   *   .next(newPrice)  → combineLatest emits: [newPrice, OLD_qty]  ← GLITCH
   *   .next(newQty)    → combineLatest emits: [newPrice, newQty]   ← correct
   *
   * Signals batch both .set() calls and recalculate the reactive graph only
   * once — the glitch intermediate state never exists.
   */
  triggerSyncMultiUpdate(): void {
    const newPrice = Math.floor(Math.random() * 151) + 50;
    const oldQty   = this.quantity$.value;
    const newQty   = Math.floor(Math.random() * 5) + 1;

    this.addLog('Info', `⚡ SYNC MULTI-UPDATE → Price: $${newPrice}, Qty: ${newQty} (previous qty was ${oldQty})`);

    // ── RxJS: capture glitch by tapping the stream before updates ──
    let rxEmitCount = 0;
    const glitchSub = this.subtotal$.subscribe((sub) => {
      rxEmitCount++;
      const currentQty = this.quantity$.value;
      const currentPrice = this.price$.value;
      const isGlitch = rxEmitCount === 1 && currentQty === oldQty && currentPrice !== this.price$.value;
      // Glitch: price already changed but qty hasn't yet
      const label = isGlitch ? '⚠️ GLITCH (stale qty)' : '✅ Final value';
      this.addLog('RxJS', `Emission #${rxEmitCount}: $${currentPrice} × ${currentQty} = $${sub} — ${label}`, isGlitch);
    });

    // These two lines are synchronous — combineLatest will emit between them
    this.price$.next(newPrice);     // Emission 1: newPrice × oldQty ← GLITCH
    this.quantity$.next(newQty);    // Emission 2: newPrice × newQty ← correct
    glitchSub.unsubscribe();

    // Signals: both .set() calls are synchronous, but computed recalcs only once
    this.priceSig.set(newPrice);
    this.quantitySig.set(newQty);

    const finalSubtotal = this.subtotalSig();
    this.addLog('Signals', `✅ Both .set() calls made synchronously — Signals computed ONCE: $${finalSubtotal}`);
    this.addLog('Signals', `✅ No intermediate glitch state ever existed in the Signals graph.`);
  }

  clearLogs(): void {
    this.consoleLogs = [];
  }

  // ── Helpers ───────────────────────────────────────────────
  private fetchExchangeRate(currency: 'USD' | 'EUR' | 'INR'): Observable<number> {
    const rates: Record<string, number> = { USD: 1.0, EUR: 0.92, INR: 83.5 };
    return of(rates[currency] ?? 1.0).pipe(delay(400));
  }

  private addLog(source: 'RxJS' | 'Signals' | 'Info', message: string, isGlitch = false): void {
    const now = new Date();
    const ts = [
      now.getHours().toString().padStart(2, '0'),
      now.getMinutes().toString().padStart(2, '0'),
      now.getSeconds().toString().padStart(2, '0'),
    ].join(':') + '.' + now.getMilliseconds().toString().padStart(3, '0');
    this.consoleLogs.unshift({ id: ++this.logIdCounter, timestamp: ts, source, message, isGlitch });
    if (this.consoleLogs.length > 60) this.consoleLogs.pop();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
