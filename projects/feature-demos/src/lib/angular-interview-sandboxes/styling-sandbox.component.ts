import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CodeViewerComponent, CodeFile } from '../code-viewer/code-viewer.component';

@Component({
  selector: 'app-styling-child',
  standalone: true,
  template: `
    <div class="child-card">
      <div class="card-badge">Child</div>
      <h4 class="card-title">StylingChildComponent</h4>
      <div class="themed-box">
        <span>.themed-box</span>
      </div>
      <p class="desc">Scoped inside the parent component tree.</p>
    </div>
  `,
  styles: [`
    .child-card {
      padding: 1rem;
      background: rgba(30, 41, 59, 0.4);
      border: 1px dashed rgba(148, 163, 184, 0.2);
      border-radius: 10px;
      position: relative;
    }
    .card-badge {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      font-size: 0.6rem;
      text-transform: uppercase;
      font-weight: bold;
      color: #60a5fa;
      background: rgba(96, 165, 250, 0.1);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }
    .card-title {
      margin: 0 0 0.75rem;
      font-size: 0.85rem;
      color: #e2e8f0;
    }
    .themed-box {
      padding: 0.75rem;
      border: 1px solid #475569;
      background: #1e293b;
      color: #94a3b8;
      font-weight: bold;
      font-family: 'Fira Code', monospace;
      font-size: 0.8rem;
      border-radius: 6px;
      text-align: center;
      transition: all 0.3s ease;
      background-color: var(--themed-bg, #1e293b);
      border-color: var(--themed-border, #475569);
      color: var(--themed-color, #94a3b8);
      box-shadow: var(--themed-shadow, none);
    }
    .desc {
      font-size: 0.7rem;
      color: #64748b;
      margin: 0.5rem 0 0;
    }
  `]
})
export class StylingChildComponent {}

@Component({
  selector: 'app-styling-sibling',
  standalone: true,
  template: `
    <div class="sibling-card">
      <div class="card-badge">Sibling</div>
      <h4 class="card-title">StylingSiblingComponent</h4>
      <div class="themed-box">
        <span>.themed-box</span>
      </div>
      <p class="desc">Unrelated sibling (outside the parent's component hierarchy).</p>
    </div>
  `,
  styles: [`
    .sibling-card {
      padding: 1rem;
      background: rgba(30, 41, 59, 0.4);
      border: 1px dashed rgba(148, 163, 184, 0.2);
      border-radius: 10px;
      position: relative;
    }
    .card-badge {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      font-size: 0.6rem;
      text-transform: uppercase;
      font-weight: bold;
      color: #f87171;
      background: rgba(248, 113, 113, 0.1);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }
    .card-title {
      margin: 0 0 0.75rem;
      font-size: 0.85rem;
      color: #e2e8f0;
    }
    .themed-box {
      padding: 0.75rem;
      border: 1px solid #475569;
      background: #1e293b;
      color: #94a3b8;
      font-weight: bold;
      font-family: 'Fira Code', monospace;
      font-size: 0.8rem;
      border-radius: 6px;
      text-align: center;
      transition: all 0.3s ease;
    }
    .desc {
      font-size: 0.7rem;
      color: #64748b;
      margin: 0.5rem 0 0;
    }
  `]
})
export class StylingSiblingComponent {}

@Component({
  selector: 'app-wrapper-none',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="none-wrapper">
      <div class="themed-box pink-theme">
        <span>.themed-box (ViewEncapsulation.None)</span>
      </div>
    </div>
  `,
  styles: [`
    /* ViewEncapsulation.None will make this CSS globally active! */
    .none-wrapper .pink-theme {
      background: linear-gradient(135deg, #ec4899, #db2777) !important;
      border-color: #f472b6 !important;
      color: #ffffff !important;
      box-shadow: 0 0 12px rgba(236, 72, 153, 0.4) !important;
    }
  `]
})
export class WrapperNoneComponent {}

@Component({
  selector: 'lib-styling-sandbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CodeViewerComponent,
    StylingChildComponent,
    StylingSiblingComponent,
    WrapperNoneComponent
  ],
  templateUrl: './styling-sandbox.component.html',
  styleUrls: ['./styling-sandbox.component.scss']
})
export class StylingSandboxComponent {
  activeStrategy: 'none' | 'naive' | 'safe' | 'css-var' | 'encap-none' = 'none';

  readonly codeFiles: CodeFile[] = [
    {
      name: 'styling-sandbox.component.ts',
      code: `// styling-sandbox.component.ts
@Component({
  selector: 'lib-styling-sandbox',
  templateUrl: './styling-sandbox.component.html',
  styleUrls: ['./styling-sandbox.component.scss']
})
export class StylingSandboxComponent {
  activeStrategy = 'none';
}`,
      language: 'typescript'
    },
    {
      name: 'styling-sandbox.component.scss',
      code: `/* styling-sandbox.component.scss */
.apply-naive {
  /* NAIVE: strips scoping, style bleeds globally! */
  ::ng-deep .themed-box {
    background: linear-gradient(135deg, #ef4444, #b91c1c) !important;
    border-color: #f87171 !important;
    color: #ffffff !important;
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.4) !important;
  }
}

.apply-safe {
  /* SAFE: prefixing with :host scopes the ::ng-deep to children */
  :host ::ng-deep .themed-box {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
    border-color: #60a5fa !important;
    color: #ffffff !important;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.4) !important;
  }
}`,
      language: 'scss'
    },
    {
      name: 'child.component.ts',
      code: `// child.component.ts (CSS Variables theme mapping)
@Component({
  selector: 'app-styling-child',
  styles: [\`
    .themed-box {
      /* Binds to CSS Custom Properties passed down from parent */
      background-color: var(--themed-bg, #1e293b);
      border-color: var(--themed-border, #475569);
      color: var(--themed-color, #94a3b8);
      box-shadow: var(--themed-shadow, none);
    }
  \`]
})
export class StylingChildComponent {}`,
      language: 'typescript'
    }
  ];

  setStrategy(strategy: 'none' | 'naive' | 'safe' | 'css-var' | 'encap-none'): void {
    this.activeStrategy = strategy;
  }
}
