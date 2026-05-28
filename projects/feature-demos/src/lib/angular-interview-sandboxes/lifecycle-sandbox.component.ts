import {
  Component,
  Input,
  SimpleChanges,
  OnInit,
  OnChanges,
  DoCheck,
  AfterContentInit,
  AfterContentChecked,
  AfterViewInit,
  AfterViewChecked,
  OnDestroy,
  ElementRef,
  ViewChild,
  Injectable,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CodeViewerComponent, CodeFile } from '../code-viewer/code-viewer.component';

@Injectable()
export class LifecycleLoggerService {
  logs: Array<{ id: number; hook: string; timestamp: string; details: string }> = [];
  private logCounter = 0;

  log(hook: string, details: string): void {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    this.logs.unshift({
      id: ++this.logCounter,
      hook,
      timestamp: ts,
      details
    });
    if (this.logs.length > 50) {
      this.logs.pop();
    }
  }

  clear(): void {
    this.logs = [];
    this.logCounter = 0;
  }
}

@Component({
  selector: 'app-lifecycle-child',
  standalone: true,
  template: `
    <div class="child-card highlight-border">
      <div class="child-badge">Child Watcher</div>
      <h4 class="text-slate-100 font-semibold mb-2">LifecycleLogChildComponent</h4>
      
      <div class="grid grid-cols-2 gap-4 my-2">
        <div class="stat-box">
          <span class="label">Primitive Input</span>
          <span class="value">{{ primitiveVal }}</span>
        </div>
        <div class="stat-box">
          <span class="label">Object Name Input</span>
          <span class="value">{{ objectVal.name }}</span>
        </div>
      </div>

      <div class="dom-demo mt-3">
        <div #headingElement class="dom-heading">
          🏛️ Target DOM Element
        </div>
        <p class="desc text-xs mt-1">Queried via &#64;ViewChild('headingElement')</p>
      </div>
    </div>
  `,
  styles: [`
    .child-card {
      padding: 1.25rem;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.15);
      border-radius: 12px;
      position: relative;
    }
    .child-badge {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      font-size: 0.6rem;
      background: rgba(96, 165, 250, 0.1);
      color: #60a5fa;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .stat-box {
      display: flex;
      flex-direction: column;
      background: rgba(15, 23, 42, 0.5);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.05);
    }
    .stat-box .label {
      font-size: 0.65rem;
      color: #64748b;
      text-transform: uppercase;
    }
    .stat-box .value {
      font-size: 0.9rem;
      font-weight: 700;
      color: #f1f5f9;
    }
    .dom-demo {
      padding: 0.75rem;
      background: rgba(15, 23, 42, 0.4);
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.08);
      text-align: center;
    }
    .dom-heading {
      color: #fbbf24;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .desc {
      color: #64748b;
    }
  `]
})
export class LifecycleLogChildComponent implements
  OnChanges,
  OnInit,
  DoCheck,
  AfterContentInit,
  AfterContentChecked,
  AfterViewInit,
  AfterViewChecked,
  OnDestroy
{
  @Input() primitiveVal = 0;
  @Input() objectVal: { name: string; experience: number } = { name: 'Initial', experience: 10 };

  @ViewChild('headingElement') headingElement!: ElementRef<HTMLDivElement>;

  private readonly logger = inject(LifecycleLoggerService);

  // 1. ngOnChanges
  ngOnChanges(changes: SimpleChanges): void {
    const keys = Object.keys(changes);
    const details = keys
      .map(k => `${k}: prev=${JSON.stringify(changes[k].previousValue)} -> curr=${JSON.stringify(changes[k].currentValue)}`)
      .join(', ');
    this.logger.log('ngOnChanges', `Triggered for inputs [${keys.join(', ')}]. Details: ${details}`);
  }

  // 2. ngOnInit
  ngOnInit(): void {
    const domReady = !!this.headingElement;
    this.logger.log(
      'ngOnInit', 
      `Class properties initialized (primitiveVal=${this.primitiveVal}). DOM Element available? ${domReady ? '✅ YES' : '❌ NO (headingElement is undefined)'}`
    );
  }

  // 3. ngDoCheck
  ngDoCheck(): void {
    this.logger.log('ngDoCheck', 'Running dirty check detection cycle.');
  }

  // 4. ngAfterContentInit
  ngAfterContentInit(): void {
    this.logger.log('ngAfterContentInit', 'Projected content (<ng-content>) has been fully initialized.');
  }

  // 5. ngAfterContentChecked
  ngAfterContentChecked(): void {
    this.logger.log('ngAfterContentChecked', 'Projected content checked.');
  }

  // 6. ngAfterViewInit
  ngAfterViewInit(): void {
    const domReady = !!this.headingElement;
    const elementText = domReady ? this.headingElement.nativeElement.innerText.trim() : '';
    this.logger.log(
      'ngAfterViewInit', 
      `Component template views & child views initialized. DOM Element available? ${domReady ? `✅ YES (content: "${elementText}")` : '❌ NO'}`
    );
  }

  // 7. ngAfterViewChecked
  ngAfterViewChecked(): void {
    this.logger.log('ngAfterViewChecked', 'Component template views checked.');
  }

  // 8. ngOnDestroy
  ngOnDestroy(): void {
    this.logger.log('ngOnDestroy', 'Component is being unmounted and destroyed. Cleaning up subscriptions.');
  }
}

@Component({
  selector: 'lib-lifecycle-sandbox',
  standalone: true,
  imports: [CommonModule, FormsModule, CodeViewerComponent, LifecycleLogChildComponent],
  providers: [LifecycleLoggerService],
  templateUrl: './lifecycle-sandbox.component.html',
  styleUrls: ['./lifecycle-sandbox.component.scss']
})
export class LifecycleSandboxComponent {
  primitiveValue = 100;
  objectValue = { name: 'Sujata Sen', experience: 10 };
  
  isChildMounted = true;
  private readonly logger = inject(LifecycleLoggerService);

  get logs() {
    return this.logger.logs;
  }

  readonly codeFiles: CodeFile[] = [
    {
      name: 'lifecycle-child.component.ts',
      code: `// lifecycle-child.component.ts
@Component({
  selector: 'app-lifecycle-child',
  template: \`<div #headingElement>DOM Target</div>\`
})
export class LifecycleChildComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() primitiveVal = 0;
  @Input() objectVal = { name: '', experience: 10 };

  @ViewChild('headingElement') headingElement!: ElementRef;

  ngOnChanges(changes: SimpleChanges) {
    // Fires before ngOnInit, and when inputs reference changes
    console.log('ngOnChanges', changes);
  }

  ngOnInit() {
    // Properties initialized, view not ready
    console.log('ngOnInit', this.headingElement); // undefined
  }

  ngAfterViewInit() {
    // Views initialized, safe to query DOM
    console.log('ngAfterViewInit', this.headingElement.nativeElement); // HTMLDivElement
  }

  ngOnDestroy() {
    // Clean up timers, subscriptions
    console.log('ngOnDestroy');
  }
}`,
      language: 'typescript'
    },
    {
      name: 'parent-triggers.ts',
      code: `// parent-triggers.ts (how you trigger updates)
/* 1. Trigger Primitive Change (Fires ngOnChanges) */
incrementPrimitive() {
  this.primitiveValue++;
}

/* 2. Object Mutation in Place (No ngOnChanges!) */
mutateObjectInPlace() {
  // Reference stays the same, Angular's inputs check ignores this mutation
  this.objectValue.name = 'Mutated!';
}

/* 3. Object Reassignment (Fires ngOnChanges) */
reassignObjectRef() {
  // New object reference in memory! Angular detects the reference change
  this.objectValue = {
    ...this.objectValue,
    name: 'New Reference!'
  };
}`,
      language: 'typescript'
    }
  ];

  incrementPrimitive(): void {
    this.primitiveValue++;
  }

  mutateObjectInPlace(): void {
    // Mutation in place
    this.objectValue.name = `Mutated (${Math.floor(Math.random() * 100)})`;
  }

  reassignObjectRef(): void {
    // Object reference reassignment
    this.objectValue = {
      name: `Reassigned (${Math.floor(Math.random() * 100)})`,
      experience: this.objectValue.experience
    };
  }

  toggleChildMount(): void {
    this.isChildMounted = !this.isChildMounted;
  }

  clearLogs(): void {
    this.logger.clear();
  }
}
