import {
  Component,
  Input,
  DoCheck,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CodeViewerComponent, CodeFile } from '../code-viewer/code-viewer.component';

export interface UserProfile {
  name: string;
  balance: number;
}

@Component({
  selector: 'app-cd-child-default',
  standalone: true,
  template: `
    <div class="cd-child-card default-strategy border-red-500">
      <div class="strategy-badge badge-red">Default Strategy</div>
      
      <div class="stat-row">
        <span>User Name:</span>
        <strong>{{ userData.name }}</strong>
      </div>
      <div class="stat-row">
        <span>Account Balance:</span>
        <strong class="text-green-400">\${{ userData.balance }}</strong>
      </div>

      <div class="flash-border-box" [class.flash]="flashActive">
        <span>Template Render Count: <strong>{{ renderCount }}</strong></span>
        {{ triggerFlash() }}
      </div>

      <div class="counters mt-2">
        <span class="cnt-pill">ngDoCheck Fired: <strong>{{ doCheckCount }}</strong></span>
      </div>
    </div>
  `,
  styles: [`
    .cd-child-card {
      padding: 1rem;
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 10px;
      position: relative;
    }
    .strategy-badge {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      font-size: 0.6rem;
      font-weight: 700;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-red { background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25); }
    .stat-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.35rem;
      font-size: 0.85rem;
      color: #94a3b8;
    }
    .stat-row strong { color: #f1f5f9; }
    .flash-border-box {
      margin-top: 0.75rem;
      padding: 0.5rem;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 6px;
      font-size: 0.75rem;
      text-align: center;
      color: #94a3b8;
      transition: all 0.2s ease;
    }
    .flash-border-box.flash {
      border-color: #f87171;
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
      background: rgba(239, 68, 68, 0.05);
    }
    .cnt-pill {
      font-size: 0.65rem;
      background: rgba(148, 163, 184, 0.1);
      color: #94a3b8;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-family: monospace;
    }
  `]
})
export class CdChildDefaultComponent implements DoCheck {
  @Input({ required: true }) userData!: UserProfile;
  
  doCheckCount = 0;
  renderCount = 0;
  flashActive = false;

  ngDoCheck(): void {
    this.doCheckCount++;
  }

  triggerFlash(): string {
    this.renderCount++;
    this.flashActive = true;
    setTimeout(() => { this.flashActive = false; }, 400);
    return '';
  }
}

@Component({
  selector: 'app-cd-child-onpush',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cd-child-card onpush-strategy border-blue-500">
      <div class="strategy-badge badge-blue">OnPush Strategy</div>
      
      <div class="stat-row">
        <span>User Name:</span>
        <strong>{{ userData.name }}</strong>
      </div>
      <div class="stat-row">
        <span>Account Balance:</span>
        <strong class="text-green-400">\${{ userData.balance }}</strong>
      </div>

      <div class="flash-border-box" [class.flash]="flashActive">
        <span>Template Render Count: <strong>{{ renderCount }}</strong></span>
        {{ triggerFlash() }}
      </div>

      <div class="counters mt-2 flex gap-2">
        <span class="cnt-pill">ngDoCheck Fired: <strong>{{ doCheckCount }}</strong></span>
        <span class="cnt-pill" [class.highlight]="dirtyDetected">Mutation Detected: <strong>{{ mutationCheckCount }}</strong></span>
      </div>
    </div>
  `,
  styles: [`
    .cd-child-card {
      padding: 1rem;
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 10px;
      position: relative;
    }
    .strategy-badge {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      font-size: 0.6rem;
      font-weight: 700;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-blue { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.25); }
    .stat-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.35rem;
      font-size: 0.85rem;
      color: #94a3b8;
    }
    .stat-row strong { color: #f1f5f9; }
    .flash-border-box {
      margin-top: 0.75rem;
      padding: 0.5rem;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 6px;
      font-size: 0.75rem;
      text-align: center;
      color: #94a3b8;
      transition: all 0.2s ease;
    }
    .flash-border-box.flash {
      border-color: #60a5fa;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
      background: rgba(59, 130, 246, 0.05);
    }
    .cnt-pill {
      font-size: 0.65rem;
      background: rgba(148, 163, 184, 0.1);
      color: #94a3b8;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-family: monospace;
    }
    .cnt-pill.highlight {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
  `]
})
export class CdChildOnPushComponent implements DoCheck {
  @Input({ required: true }) userData!: UserProfile;
  @Input() mitigationStrategy: 'none' | 'markForCheck' | 'detectChanges' = 'none';

  private readonly cdr = inject(ChangeDetectorRef);
  
  doCheckCount = 0;
  renderCount = 0;
  mutationCheckCount = 0;
  flashActive = false;
  dirtyDetected = false;

  private lastKnownName = '';
  private lastKnownBalance = 0;

  ngDoCheck(): void {
    this.doCheckCount++;

    // Custom dirty checking inside ngDoCheck
    if (this.userData.name !== this.lastKnownName || this.userData.balance !== this.lastKnownBalance) {
      this.mutationCheckCount++;
      this.dirtyDetected = true;
      this.lastKnownName = this.userData.name;
      this.lastKnownBalance = this.userData.balance;
      
      // Execute the selected escape hatch mitigation
      if (this.mitigationStrategy === 'markForCheck') {
        this.cdr.markForCheck();
      } else if (this.mitigationStrategy === 'detectChanges') {
        this.cdr.detectChanges();
      }

      setTimeout(() => { this.dirtyDetected = false; }, 600);
    }
  }

  triggerFlash(): string {
    this.renderCount++;
    this.flashActive = true;
    setTimeout(() => { this.flashActive = false; }, 400);
    return '';
  }
}

@Component({
  selector: 'lib-change-detection-sandbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CodeViewerComponent,
    CdChildDefaultComponent,
    CdChildOnPushComponent
  ],
  templateUrl: './change-detection-sandbox.component.html',
  styleUrls: ['./change-detection-sandbox.component.scss']
})
export class ChangeDetectionSandboxComponent {
  // Shared state object passed to children
  userProfile: UserProfile = {
    name: 'Amit Sharma',
    balance: 5000
  };

  mitigation: 'none' | 'markForCheck' | 'detectChanges' = 'none';
  parentCDCount = 0;
  
  readonly codeFiles: CodeFile[] = [
    {
      name: 'onpush-child.component.ts',
      code: `// onpush-child.component.ts
@Component({
  selector: 'app-cd-child-onpush',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <div>Name: {{ userData.name }}</div>
    <div>Balance: \${{ userData.balance }}</div>
  \`
})
export class CdChildOnPushComponent implements DoCheck {
  @Input() userData!: UserProfile;
  @Input() mitigationStrategy = 'none';

  constructor(private cdr: ChangeDetectorRef) {}

  private lastKnownName = '';
  private lastKnownBalance = 0;

  ngDoCheck() {
    // 1. ngDoCheck ALWAYS runs on every Change Detection tick, even for OnPush!
    // 2. We can perform custom dirty-checking for object mutations here.
    if (
      this.userData.name !== this.lastKnownName || 
      this.userData.balance !== this.lastKnownBalance
    ) {
      this.lastKnownName = this.userData.name;
      this.lastKnownBalance = this.userData.balance;
      
      // 3. Trigger manual update based on selection
      if (this.mitigationStrategy === 'markForCheck') {
        this.cdr.markForCheck(); // Marks ancestors dirty, updates on next tick
      } else if (this.mitigationStrategy === 'detectChanges') {
        this.cdr.detectChanges(); // Immediately executes CD on this component subtree
      }
    }
  }
}`,
      language: 'typescript'
    },
    {
      name: 'parent-mutations.ts',
      code: `// parent-mutations.ts
/* Mutating object properties in-place (same reference) */
mutateInPlace() {
  this.userProfile.balance += 250;
  this.userProfile.name = 'Amit Sharma (Mutated)';
}

/* Reassigning object reference (new reference) */
reassignReference() {
  this.userProfile = {
    name: 'Amit Sharma (Reassigned)',
    balance: Math.floor(Math.random() * 9000) + 1000
  };
}`,
      language: 'typescript'
    }
  ];

  mutateInPlace(): void {
    this.userProfile.balance += 250;
    this.userProfile.name = `Amit Sharma (Mutated ${Math.floor(Math.random() * 100)})`;
  }

  reassignReference(): void {
    this.userProfile = {
      name: `Amit Sharma (Reassigned ${Math.floor(Math.random() * 100)})`,
      balance: Math.floor(Math.random() * 9000) + 1000
    };
  }

  triggerParentCD(): void {
    // Empty trigger to run Angular CD cycle
  }

  registerParentCD(): string {
    this.parentCDCount++;
    return '';
  }

  setMitigation(mode: 'none' | 'markForCheck' | 'detectChanges'): void {
    this.mitigation = mode;
  }

  resetAll(): void {
    this.userProfile = { name: 'Amit Sharma', balance: 5000 };
    this.parentCDCount = 0;
  }
}
