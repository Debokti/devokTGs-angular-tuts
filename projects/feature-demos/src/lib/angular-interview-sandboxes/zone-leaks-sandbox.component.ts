import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  NgZone,
  ChangeDetectorRef,
  Injectable,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CodeViewerComponent, CodeFile } from '../code-viewer/code-viewer.component';

@Injectable()
export class MemoryLeakService {
  logs: string[] = [];
  activeSubscribers = 0;

  log(message: string): void {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    this.logs.unshift(`[${ts}] ${message}`);
    if (this.logs.length > 30) {
      this.logs.pop();
    }
  }

  clear(): void {
    this.logs = [];
  }
}

@Component({
  selector: 'app-leaky-child',
  standalone: true,
  template: `
    <div class="leaky-box" [class.leaky]="leakMode" [class.clean]="!leakMode">
      <div class="flex justify-between items-center">
        <span>Component Instance #{{ instanceId }}</span>
        <span class="pill">{{ leakMode ? 'LEAKY' : 'CLEAN' }}</span>
      </div>
      <p class="desc mt-1">This component subscribes to an infinite 1s interval stream.</p>
    </div>
  `,
  styles: [`
    .leaky-box {
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.8rem;
    }
    .leaky-box.leaky {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    .leaky-box.clean {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #4ade80;
    }
    .pill {
      font-size: 0.6rem;
      font-weight: bold;
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
      .leaky & { background: rgba(239, 68, 68, 0.2); }
      .clean & { background: rgba(16, 185, 129, 0.2); }
    }
    .desc { color: #64748b; font-size: 0.7rem; margin: 0; }
  `]
})
export class LeakyChildComponent implements OnInit, OnDestroy {
  @Input({ required: true }) instanceId!: number;
  @Input({ required: true }) leakMode!: boolean;

  private readonly leakService = inject(MemoryLeakService);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.leakService.activeSubscribers++;
    this.leakService.log(`🆕 Component #${this.instanceId} mounted. Active subscription count: ${this.leakService.activeSubscribers}`);

    // Infinite subscription stream
    const ticker$ = interval(1000);

    if (this.leakMode) {
      // LEAK MODE: raw subscribe, never unsubscribed
      ticker$.subscribe(() => {
        this.leakService.log(`🔴 Leaked component #${this.instanceId} still executing tick!`);
      });
    } else {
      // CLEAN MODE: properly disposed on destroy
      ticker$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.leakService.log(`🟢 Clean component #${this.instanceId} ticking.`);
      });
    }
  }

  ngOnDestroy(): void {
    // If not in leakMode, we unsubscribe
    if (!this.leakMode) {
      this.destroy$.next();
      this.destroy$.complete();
      this.leakService.activeSubscribers--;
      this.leakService.log(`🗑️ Clean component #${this.instanceId} destroyed & unsubscribed.`);
    } else {
      // Leaky component destroyed, but we leave the subscription active!
      // We do NOT decrement activeSubscribers to represent the memory heap retention
      this.leakService.log(`💀 Leaky component #${this.instanceId} unmounted from DOM but SUBSCRIPTION WAS LEAKED!`);
    }
  }
}

@Component({
  selector: 'lib-zone-leaks-sandbox',
  standalone: true,
  imports: [CommonModule, FormsModule, CodeViewerComponent, LeakyChildComponent],
  providers: [MemoryLeakService],
  templateUrl: './zone-leaks-sandbox.component.html',
  styleUrls: ['./zone-leaks-sandbox.component.scss']
})
export class ZoneLeaksSandboxComponent implements OnInit, OnDestroy {
  // Zone.js variables
  timerCount = 0;
  isTimerRunning = false;
  timerMode: 'inside' | 'outside' = 'inside';
  changeDetectionTicks = 0;
  
  // Memory leaks variables
  instancesList: Array<{ id: number; leak: boolean }> = [];
  instanceIdCounter = 0;
  leakToggle = false; // true = instantiate as leaky

  private timerId: any = null;
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly leakService = inject(MemoryLeakService);

  get leakLogs(): string[] {
    return this.leakService.logs;
  }

  get activeSubscribers(): number {
    return this.leakService.activeSubscribers;
  }

  readonly codeFiles: CodeFile[] = [
    {
      name: 'zone-runs.ts',
      code: `// zone-runs.ts (managing Zone.js triggers)
constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

/* Option A: Run inside Angular Zone (Causes continuous Change Detection) */
runInsideZone() {
  this.isTimerRunning = true;
  this.timerId = setInterval(() => {
    this.timerCount++; // Every update triggers Angular's CD!
  }, 50);
}

/* Option B: Run outside Angular Zone (Opt-out of auto Change Detection) */
runOutsideZone() {
  this.isTimerRunning = true;
  this.ngZone.runOutsideAngular(() => {
    this.timerId = setInterval(() => {
      this.timerCount++; // Updates variable, but DOES NOT trigger Change Detection!
      
      // OPTIONAL: Manually update UI only when needed
      // this.cdr.detectChanges();
    }, 50);
  });
}`,
      language: 'typescript'
    },
    {
      name: 'memory-leak.component.ts',
      code: `// memory-leak.component.ts (unsubscription mitigation)
export class LeakyChildComponent implements OnInit, OnDestroy {
  @Input() leakMode = false;
  private destroy$ = new Subject<void>();

  ngOnInit() {
    const stream$ = interval(1000);

    if (this.leakMode) {
      // ⚠️ DANGER: dangling subscription. Logs will run forever in memory!
      stream$.subscribe(() => {
        console.log('Tick executing...');
      });
    } else {
      // ✅ SAFE: takeUntil clears subscription when component destroys
      stream$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        console.log('Tick executing...');
      });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}`,
      language: 'typescript'
    }
  ];

  ngOnInit(): void {
    // Settle initial CD
  }

  // Zone.js logic
  startTimer(): void {
    this.stopTimer();
    this.isTimerRunning = true;

    if (this.timerMode === 'inside') {
      this.timerId = setInterval(() => {
        this.timerCount++;
      }, 50);
    } else {
      this.ngZone.runOutsideAngular(() => {
        this.timerId = setInterval(() => {
          this.timerCount++;
        }, 50);
      });
    }
  }

  stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isTimerRunning = false;
  }

  toggleTimerMode(mode: 'inside' | 'outside'): void {
    this.timerMode = mode;
    if (this.isTimerRunning) {
      this.startTimer();
    }
  }

  forceUIDetect(): void {
    this.cdr.detectChanges();
  }

  registerCDTick(): string {
    this.changeDetectionTicks++;
    return '';
  }

  resetZoneStats(): void {
    this.stopTimer();
    this.timerCount = 0;
    this.changeDetectionTicks = 0;
  }

  // Memory leak logic
  spawnInstance(): void {
    const id = ++this.instanceIdCounter;
    this.instancesList.push({ id, leak: this.leakToggle });
  }

  destroyInstance(id: number): void {
    this.instancesList = this.instancesList.filter(item => item.id !== id);
  }

  clearLeakedLogs(): void {
    this.leakService.clear();
  }

  resetLeaks(): void {
    this.instancesList = [];
    this.instanceIdCounter = 0;
    this.leakService.clear();
    this.leakService.activeSubscribers = 0;
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
