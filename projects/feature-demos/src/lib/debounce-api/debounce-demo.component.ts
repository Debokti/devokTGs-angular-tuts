import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Subject,
  fromEvent,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  takeUntil,
  of,
} from 'rxjs';
import {
  CustomerSearchService,
  CustomerResult,
} from './customer-search.service';
import { CodeViewerComponent, CodeFile } from '../code-viewer/code-viewer.component';
import {
  DEBOUNCE_DEMO_TS,
  DEBOUNCE_DEMO_HTML,
  DEBOUNCE_DEMO_SERVICE,
} from '../code-snippets';

interface CallEvent {
  timestamp: string;
  query: string;
  type: 'naive' | 'debounced';
  hit: boolean; // true = actual API hit
}

/**
 * DebounceDemoComponent
 *
 * Demonstrates WHY debouncing is essential in Fintech search UIs.
 *
 * Problem: Without debounce, every keystroke fires an API call.
 *   User types "Arjun" = 5 keystrokes = 5 API calls.
 *   Only the LAST one matters. The other 4 are wasted compute + network.
 *
 * Solution: debounceTime(400) — waits 400ms after the LAST keystroke.
 *   User types "Arjun" quickly = only 1 API call, fired after 400ms silence.
 *
 * Combined with:
 *   - distinctUntilChanged() → skips API call if value didn't actually change
 *   - switchMap() → cancels in-flight requests when a new search arrives
 *   - takeUntil(destroy$) → cleans up subscriptions on component destroy
 */
@Component({
  selector: 'lib-debounce-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, CodeViewerComponent],
  templateUrl: './debounce-demo.component.html',
  styleUrls: ['./debounce-demo.component.scss'],
})
export class DebounceDemoComponent implements OnInit, OnDestroy {
  @ViewChild('naiveInput', { static: true }) naiveInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('debouncedInput', { static: true }) debouncedInputRef!: ElementRef<HTMLInputElement>;

  readonly codeFiles: CodeFile[] = [
    {
      name: 'debounce-demo.component.ts',
      code: DEBOUNCE_DEMO_TS,
      language: 'typescript',
    },
    {
      name: 'debounce-demo.component.html',
      code: DEBOUNCE_DEMO_HTML,
      language: 'html',
    },
    {
      name: 'customer-search.service.ts',
      code: DEBOUNCE_DEMO_SERVICE,
      language: 'typescript',
    },
  ];

  naiveQuery = '';
  debouncedQuery = '';

  naiveResults: CustomerResult[] = [];
  debouncedResults: CustomerResult[] = [];

  naiveCallCount = 0;
  debouncedCallCount = 0;
  callsSaved = 0;

  naiveLoading = false;
  debouncedLoading = false;

  callLog: CallEvent[] = [];
  private keystrokeCount = 0;

  private destroy$ = new Subject<void>();

  constructor(private searchService: CustomerSearchService) {}

  ngOnInit(): void {
    this.searchService.resetCallCount();
    this.wireNaiveInput();
    this.wireDebouncedInput();
  }

  /**
   * NAIVE APPROACH — no debounce
   * Every keyup event fires a search immediately.
   * This is the BAD pattern. Watch the call counter skyrocket.
   */
  private wireNaiveInput(): void {
    fromEvent<Event>(this.naiveInputRef.nativeElement, 'input')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        const query = (event.target as HTMLInputElement).value;
        this.keystrokeCount++;
        this.callsSaved = Math.max(0, this.keystrokeCount - this.debouncedCallCount);

        if (!query.trim()) {
          this.naiveResults = [];
          this.naiveLoading = false;
          return;
        }

        this.naiveLoading = true;
        this.naiveCallCount++;
        this.logCall(query, 'naive', true);

        this.searchService.search(query).pipe(takeUntil(this.destroy$)).subscribe({
          next: (results) => {
            this.naiveResults = results;
            this.naiveLoading = false;
          },
        });
      });
  }

  /**
   * DEBOUNCED APPROACH — the correct pattern
   *
   * Operator pipeline:
   *  1. debounceTime(400) — waits 400ms after last keystroke before emitting
   *  2. distinctUntilChanged() — skips if value is the same as previous emit
   *  3. switchMap() — cancels the previous observable if a new value arrives;
   *                   prevents race conditions with out-of-order API responses
   */
  private wireDebouncedInput(): void {
    fromEvent<Event>(this.debouncedInputRef.nativeElement, 'input')
      .pipe(
        debounceTime(400),         // ← KEY: wait 400ms of silence
        distinctUntilChanged(),    // ← skip if value is unchanged
        switchMap((event) => {     // ← cancel previous, start new
          const query = (event.target as HTMLInputElement).value;
          this.logCall(query, 'debounced', !!query.trim());

          if (!query.trim()) {
            this.debouncedResults = [];
            this.debouncedLoading = false;
            return of([]);
          }

          this.debouncedLoading = true;
          this.debouncedCallCount++;
          this.callsSaved = Math.max(0, this.keystrokeCount - this.debouncedCallCount);

          return this.searchService.search(query);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (results) => {
          this.debouncedResults = results;
          this.debouncedLoading = false;
        },
      });
  }

  private logCall(query: string, type: 'naive' | 'debounced', hit: boolean): void {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now
      .getMilliseconds()
      .toString()
      .padStart(3, '0')}`;

    this.callLog.unshift({ timestamp, query, type, hit });
    if (this.callLog.length > 20) this.callLog.pop();
  }

  onReset(): void {
    this.naiveQuery = '';
    this.debouncedQuery = '';
    this.naiveResults = [];
    this.debouncedResults = [];
    this.naiveCallCount = 0;
    this.debouncedCallCount = 0;
    this.callsSaved = 0;
    this.keystrokeCount = 0;
    this.callLog = [];
    this.naiveInputRef.nativeElement.value = '';
    this.debouncedInputRef.nativeElement.value = '';
    this.searchService.resetCallCount();
  }

  getRiskClass(risk: string): string {
    return `risk-${risk.toLowerCase()}`;
  }

  get efficiencyPercent(): number {
    if (this.keystrokeCount === 0) return 0;
    return Math.round((this.callsSaved / this.keystrokeCount) * 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
