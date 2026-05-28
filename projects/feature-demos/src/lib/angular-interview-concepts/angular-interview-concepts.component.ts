import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CodeFile, CodeViewerComponent } from '../code-viewer/code-viewer.component';

interface ConceptSection {
  title: string;
  body: string;
  bullets: string[];
}

interface ComparisonRow {
  left: string;
  middle: string;
  right: string;
}

interface AngularConcept {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  tags: string[];
  scenario: string;
  sections: ConceptSection[];
  processTitle: string;
  processSteps: string[];
  comparisonTitle: string;
  comparisonHeaders: [string, string, string];
  comparisonRows: ComparisonRow[];
  interviewAnswer: string;
  seniorTraps: string[];
  codeFiles: CodeFile[];
}

@Component({
  selector: 'lib-angular-interview-concepts',
  standalone: true,
  imports: [CommonModule, CodeViewerComponent],
  templateUrl: './angular-interview-concepts.component.html',
  styleUrls: ['./angular-interview-concepts.component.scss'],
})
export class AngularInterviewConceptsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  concept: AngularConcept = ANGULAR_CONCEPTS['angular-di'];

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      const conceptId = data['conceptId'] as string | undefined;
      this.concept = ANGULAR_CONCEPTS[conceptId ?? 'angular-di'] ?? ANGULAR_CONCEPTS['angular-di'];
    });
  }
}

export const ANGULAR_CONCEPTS: Record<string, AngularConcept> = {
  'angular-di': {
    id: 'angular-di',
    badge: 'Feature 07',
    title: 'Angular Hierarchical DI and Resolution',
    subtitle:
      'A senior-level mental model for ElementInjector, EnvironmentInjector, provider scopes, resolution modifiers, and why service placement matters in fintech Angular apps.',
    tags: ['ElementInjector', 'EnvironmentInjector', 'providers', 'viewProviders', '@Self', '@SkipSelf', '@Host', '@Optional'],
    scenario:
      'A wealth dashboard has a root AuthSessionService, a route-level CustomerContextService, and a component-level FraudRulesService. The same token can legitimately resolve to different instances depending on where Angular starts lookup.',
    sections: [
      {
        title: 'Definition',
        body:
          'Angular DI is a hierarchical runtime lookup system for tokens. A token can be a class, InjectionToken, string-like legacy token, or value provider. Angular resolves it against two related injector hierarchies.',
        bullets: [
          'ElementInjector hierarchy is tied to components and directives in the rendered view tree.',
          'EnvironmentInjector hierarchy is tied to application, route, standalone component environment, platform, or legacy NgModule scopes.',
          'The same service class can be singleton, route-scoped, component-scoped, or platform-scoped depending on where it is provided.',
        ],
      },
      {
        title: 'Provider placement',
        body:
          'Provider placement is architecture. In full-stack fintech apps, putting a mutable context service at root can leak customer state across tabs or routes; route providers isolate it for a workflow.',
        bullets: [
          'providedIn: root creates one app-wide instance for most apps.',
          'Route providers create a fresh instance for that route subtree and are useful for wizard or case-management state.',
          'Component providers create an instance per component instance and are useful for local strategies or adapters.',
        ],
      },
      {
        title: 'Resolution modifiers',
        body:
          'Decorators narrow or soften lookup. They are interview favorites because they prove whether you understand where Angular is allowed to search.',
        bullets: [
          '@Self() checks only the current injector.',
          '@SkipSelf() starts lookup at the parent injector.',
          '@Host() stops at the host boundary.',
          '@Optional() returns null instead of throwing NullInjectorError.',
        ],
      },
    ],
    processTitle: 'Resolution process',
    processSteps: [
      'Angular starts at the requesting directive or component ElementInjector.',
      'It checks providers on that element and then walks parent ElementInjectors up the DOM/view tree.',
      'If ElementInjector lookup misses, Angular falls back to the relevant EnvironmentInjector chain.',
      'Environment lookup climbs route or standalone environment, root application injector, then platform injector.',
      'If no provider is found, Angular throws NullInjectorError unless the dependency is optional.',
    ],
    comparisonTitle: 'Provider scope decision table',
    comparisonHeaders: ['Scope', 'Lifetime', 'Fintech fit'],
    comparisonRows: [
      { left: 'root', middle: 'One app-wide instance', right: 'Auth session, feature flags, HTTP interceptors, reference data cache' },
      { left: 'route', middle: 'One instance per route subtree', right: 'Loan application context, customer case workspace, onboarding wizard' },
      { left: 'component', middle: 'One instance per component instance', right: 'Local calculation strategy, table state, embedded widget adapter' },
      { left: 'platform', middle: 'Shared by apps on the same page', right: 'Rare shell-level integrations or micro-frontend host services' },
    ],
    interviewAnswer:
      'Angular first tries the ElementInjector tree because component-local providers should win. If it cannot resolve there, it falls back to the EnvironmentInjector tree, where app, route, standalone, module, root, and platform providers live. The practical skill is choosing the provider scope so state does not leak wider than intended.',
    seniorTraps: [
      'Do not call everything singleton by default. Customer-specific workflow state often belongs at route or component scope.',
      'Do not confuse imports with providers. imports make directives/components/pipes available; providers create DI records.',
      'Use InjectionToken for configuration and strategy contracts rather than injecting raw objects everywhere.',
    ],
    codeFiles: [
      { name: 'di-resolution-sandbox.ts', language: 'typescript', code: DI_CODE() },
      { name: 'route-providers.ts', language: 'typescript', code: ROUTE_PROVIDERS_CODE() },
    ],
  },
  'standalone-bootstrap': {
    id: 'standalone-bootstrap',
    badge: 'Feature 08',
    title: 'Standalone Components and Bootstrapping',
    subtitle:
      'How modern Angular removes NgModule ceremony, composes dependencies through imports, and bootstraps full-stack-ready apps with application providers.',
    tags: ['standalone: true', 'imports', 'bootstrapApplication', 'ApplicationConfig', 'provideRouter', 'provideHttpClient'],
    scenario:
      'A new payments cockpit starts with a standalone AppComponent, route-level feature screens, HTTP clients for Java/FastAPI APIs, interceptors, guards, and environment-specific app providers.',
    sections: [
      {
        title: 'Definition',
        body:
          'A standalone component declares its own template dependencies directly in the imports array. It can import other standalone components, directives, pipes, and NgModules that still exist in older libraries.',
        bullets: [
          'standalone: true means the component does not need to be declared by an NgModule.',
          'The imports array controls template availability, not DI scope by itself.',
          'Application-wide providers move to bootstrapApplication or app.config.ts.',
        ],
      },
      {
        title: 'Bootstrapping',
        body:
          'bootstrapApplication creates the root application using a standalone root component and an ApplicationConfig provider list.',
        bullets: [
          'provideRouter wires route definitions without RouterModule.forRoot.',
          'provideHttpClient wires HttpClient without HttpClientModule.',
          'Feature providers can be added at root, route, or component scope depending on lifetime.',
        ],
      },
      {
        title: 'Migration model',
        body:
          'Standalone Angular is incremental. You can convert leaf components first, keep older NgModule libraries, and slowly move providers to route or app configuration.',
        bullets: [
          'Do not rewrite a stable enterprise module graph all at once.',
          'Route-level lazy loading becomes simpler because loadComponent can import a standalone screen directly.',
          'In interviews, explain what moved from NgModule: declarations disappear, imports become local, providers become explicit.',
        ],
      },
    ],
    processTitle: 'Standalone bootstrap flow',
    processSteps: [
      'main.ts calls bootstrapApplication(AppComponent, appConfig).',
      'appConfig registers root providers such as router, HttpClient, interceptors, hydration, and global error handling.',
      'Routes lazy-load standalone feature components with loadComponent.',
      'Each standalone feature imports only the directives, pipes, and child components its template needs.',
      'Route providers create workflow state for a subtree when root singleton state would be too broad.',
    ],
    comparisonTitle: 'NgModule era vs standalone era',
    comparisonHeaders: ['Concern', 'NgModule style', 'Standalone style'],
    comparisonRows: [
      { left: 'Root bootstrapping', middle: 'platformBrowserDynamic().bootstrapModule(AppModule)', right: 'bootstrapApplication(AppComponent, appConfig)' },
      { left: 'Template dependencies', middle: 'Component declared in a module that imports dependencies', right: 'Component imports dependencies directly' },
      { left: 'Lazy route', middle: 'loadChildren to a feature module', right: 'loadComponent to a standalone screen or loadChildren to route array' },
      { left: 'Providers', middle: 'forRoot patterns and module providers', right: 'ApplicationConfig, route providers, component providers' },
    ],
    interviewAnswer:
      'Standalone components replace the declarations mental model with local imports. Bootstrapping moves root providers into bootstrapApplication/ApplicationConfig. The result is less module ceremony, cleaner lazy loading, and clearer provider scope.',
    seniorTraps: [
      'Standalone does not mean dependency-free. You still import CommonModule, forms APIs, pipes, child components, or standalone directives used by the template.',
      'Avoid dumping all providers into root. Route providers are a major win for isolated workflow state.',
      'A standalone app can still consume NgModule-based libraries; migration is not all-or-nothing.',
    ],
    codeFiles: [
      { name: 'main.ts', language: 'typescript', code: STANDALONE_MAIN_CODE() },
      { name: 'payment-shell.component.ts', language: 'typescript', code: STANDALONE_COMPONENT_CODE() },
    ],
  },
  'aot-ivy': {
    id: 'aot-ivy',
    badge: 'Feature 09',
    title: 'AOT vs JIT and the Ivy Renderer',
    subtitle:
      'What Angular compiles, why production builds use AOT, and how Ivy changed debugging, tree shaking, locality, and incremental compilation.',
    tags: ['AOT', 'JIT', 'Ivy', 'Locality', 'Tree shaking', 'Template type checking'],
    scenario:
      'A fintech shell must load quickly on locked-down corporate laptops. AOT and Ivy reduce shipped compiler code, catch template errors in CI, and make lazy feature chunks smaller.',
    sections: [
      {
        title: 'JIT definition',
        body:
          'Just-in-Time compilation compiles Angular templates in the browser at runtime. It is flexible for development, but the browser pays for compilation and the compiler must be available.',
        bullets: [
          'Historically useful for rapid development and dynamic template scenarios.',
          'Larger runtime cost because template compilation happens after download.',
          'Not the default mental model for production Angular.',
        ],
      },
      {
        title: 'AOT definition',
        body:
          'Ahead-of-Time compilation converts templates and decorators into efficient JavaScript during the build. Production users receive compiled code rather than the compiler workload.',
        bullets: [
          'Catches template binding errors during build.',
          'Improves startup because the browser executes compiled instructions.',
          'Enables better minification and dead-code elimination.',
        ],
      },
      {
        title: 'Ivy definition',
        body:
          'Ivy is Angulars modern compilation and rendering pipeline. It emits instruction-based component definitions and uses locality: each component can be compiled mostly from its own decorator metadata.',
        bullets: [
          'Locality improves incremental build behavior and library compatibility.',
          'Instruction output is tree-shakable because unused Angular features do not need to ship.',
          'Generated code is easier to map back to components during debugging.',
        ],
      },
    ],
    processTitle: 'Build and render flow',
    processSteps: [
      'TypeScript and Angular compiler read component metadata, templates, and styles.',
      'AOT template type checking validates bindings against component class types.',
      'Ivy emits component definitions and template instructions.',
      'Bundlers tree-shake unused framework and app code.',
      'The browser runs compiled instructions to create and update views.',
    ],
    comparisonTitle: 'AOT vs JIT interview contrast',
    comparisonHeaders: ['Concern', 'JIT', 'AOT with Ivy'],
    comparisonRows: [
      { left: 'Compilation time', middle: 'Browser runtime', right: 'Build time' },
      { left: 'Bundle profile', middle: 'Compiler needed at runtime', right: 'Compiled output shipped to browser' },
      { left: 'Template errors', middle: 'Can surface later', right: 'Caught in CI/build with strict templates' },
      { left: 'Production fit', middle: 'Poor for normal enterprise production', right: 'Default and expected production path' },
    ],
    interviewAnswer:
      'AOT compiles Angular templates ahead of time, which improves startup and catches template errors before production. Ivy is the compiler/runtime architecture that emits local, instruction-based, tree-shakable component definitions, making builds smaller and debugging more direct.',
    seniorTraps: [
      'Do not say Ivy is only a renderer. It is also a compiler pipeline and runtime instruction model.',
      'Do not imply AOT and Ivy are opposites. AOT is when compilation happens; Ivy is how modern Angular compiles/renders.',
      'Strict template checking is a major enterprise benefit, especially when Copilot generates API models that templates consume.',
    ],
    codeFiles: [
      { name: 'template-type-checking.component.ts', language: 'typescript', code: AOT_TEMPLATE_CHECK_CODE() },
      { name: 'ivy-shape-pseudocode.ts', language: 'typescript', code: IVY_PSEUDO_CODE() },
    ],
  },
  'change-detection-state': {
    id: 'change-detection-state',
    badge: 'Feature 10',
    title: 'Change Detection and Application State',
    subtitle:
      'Default vs OnPush change detection, Zone.js triggers, AsyncPipe and signals, plus when service state is enough versus NgRx or NGXS.',
    tags: ['Default CD', 'OnPush', 'Zone.js', 'AsyncPipe', 'Signals', 'BehaviorSubject', 'NgRx', 'NGXS'],
    scenario:
      'A portfolio dashboard consumes account summaries, live FX rates, entitlement state, and case workflow state. The wrong CD/state strategy creates duplicate API calls, stale views, and painful debugging.',
    sections: [
      {
        title: 'Default change detection',
        body:
          'Default strategy checks the component tree after async activity that Zone.js knows about: events, timers, promises, HTTP callbacks, and other patched browser APIs.',
        bullets: [
          'It is simple and forgiving, good for smaller screens and early development.',
          'It checks broadly from top to bottom, so large trees can pay for unrelated changes.',
          'It does not require immutable input references to update child templates.',
        ],
      },
      {
        title: 'OnPush change detection',
        body:
          'OnPush lets Angular skip a component subtree unless a recognized trigger marks it dirty. It works best with immutable inputs, AsyncPipe, signals, and explicit state boundaries.',
        bullets: [
          'Triggers include changed @Input reference, events inside the component subtree, AsyncPipe emissions, signal writes, and manual markForCheck.',
          'Mutating an input object in place is a classic bug because the reference did not change.',
          'OnPush is not no-change-detection; it is more precise scheduling.',
        ],
      },
      {
        title: 'State management choice',
        body:
          'A BehaviorSubject service is fast to build and fine for simple state. NgRx or NGXS adds structure when workflows are large, shared, audited, and side-effect heavy.',
        bullets: [
          'Service state fits isolated screens or low-to-medium complexity workflows.',
          'NgRx/NGXS fits cross-feature state, explicit effects, undo/time-travel, and team-scale predictability.',
          'Signals are excellent for synchronous local state; RxJS is still natural for streams over time.',
        ],
      },
    ],
    processTitle: 'OnPush update triggers',
    processSteps: [
      'Parent passes a new @Input object reference.',
      'User event fires inside the component or a child component.',
      'AsyncPipe receives a new Observable emission and marks the view for check.',
      'A signal read by the template changes and marks its dependent view.',
      'Code calls ChangeDetectorRef.markForCheck or detectChanges for a specific escape hatch.',
    ],
    comparisonTitle: 'State strategy trade-offs',
    comparisonHeaders: ['Option', 'Best for', 'Risk'],
    comparisonRows: [
      { left: 'BehaviorSubject service', middle: 'Small and medium feature state, lightweight shared selections', right: 'Mutation from many places becomes hard to audit' },
      { left: 'Signals service', middle: 'Synchronous UI state and derived values', right: 'Not a replacement for complex async event streams' },
      { left: 'NgRx/NGXS', middle: 'Complex workflows, devtools, explicit effects, single source of truth', right: 'Boilerplate and ceremony if the problem is small' },
      { left: 'Component local state', middle: 'Purely local controls, filters, expanded rows', right: 'Can become duplicated if other screens need it' },
    ],
    interviewAnswer:
      'Default checks broadly after Zone-triggered async work. OnPush skips subtrees until Angular has a reason to check them: new input reference, local event, AsyncPipe emission, signal write, or manual CD. For state, start local, use services for bounded shared state, and reach for NgRx/NGXS when workflow complexity, auditing, and side effects justify it.',
    seniorTraps: [
      'Do not mutate OnPush inputs in place and expect child views to update.',
      'Do not use a global store for every dropdown and modal flag.',
      'Do not ignore backend idempotency and retry semantics just because state is centralized on the front end.',
    ],
    codeFiles: [
      { name: 'onpush-portfolio-card.ts', language: 'typescript', code: ONPUSH_CODE() },
      { name: 'state-service-vs-store.ts', language: 'typescript', code: STATE_SERVICE_CODE() },
    ],
  },
  'directives-signals': {
    id: 'directives-signals',
    badge: 'Feature 11',
    title: 'Directives, Signals, and RxJS Boundaries',
    subtitle:
      'Structural vs attribute directives, custom role-based rendering, and the practical boundary between Angular signals and RxJS Observables.',
    tags: ['Attribute directives', 'Structural directives', 'TemplateRef', 'ViewContainerRef', 'signal', 'computed', 'effect', 'Observable'],
    scenario:
      'A relationship-manager portal hides privileged actions by role, colors high-risk rows, derives synchronous UI totals with signals, and keeps HTTP/WebSocket streams in RxJS.',
    sections: [
      {
        title: 'Attribute directives',
        body:
          'Attribute directives change the behavior, styling, classes, or attributes of an existing element. They do not create or remove host elements by themselves.',
        bullets: [
          'Examples include ngClass, ngStyle, custom risk-highlighting, and focus or permission behavior.',
          'They are good for DOM behavior that should be reusable across components.',
          'They should stay focused; avoid hiding business workflows inside DOM directives.',
        ],
      },
      {
        title: 'Structural directives',
        body:
          'Structural directives change DOM layout by creating, moving, or clearing embedded views from a template.',
        bullets: [
          'The star syntax is microsyntax; *ngIf expands to an ng-template behind the scenes.',
          'TemplateRef describes what to render.',
          'ViewContainerRef describes where Angular inserts or clears the embedded view.',
        ],
      },
      {
        title: 'Signals vs Observables',
        body:
          'Signals hold a current synchronous value. Observables model values over time and require subscription. They solve overlapping but different problems.',
        bullets: [
          'Use signals for local component state, derived UI state, and synchronous reads in templates.',
          'Use RxJS for HTTP cancellation, WebSocket streams, timers, user-event streams, retries, and multi-step async workflows.',
          'Interop APIs such as toSignal and toObservable bridge the two worlds when needed.',
        ],
      },
    ],
    processTitle: 'Custom structural directive flow',
    processSteps: [
      'Angular sees *appHasRole and desugars it to an ng-template.',
      'The directive receives the TemplateRef for the protected content.',
      'The directive receives a ViewContainerRef pointing to the insertion location.',
      'When the input role changes, the directive checks the current user state.',
      'It calls createEmbeddedView to render or clear to remove the protected DOM.',
    ],
    comparisonTitle: 'Reactive primitive decision table',
    comparisonHeaders: ['Primitive', 'Meaning', 'Use it for'],
    comparisonRows: [
      { left: 'signal', middle: 'Current synchronous value', right: 'Selected account, modal open flag, local form display state' },
      { left: 'computed', middle: 'Derived synchronous value', right: 'Totals, eligibility labels, filtered view models' },
      { left: 'effect', middle: 'Side effect reacting to signal reads', right: 'Logging, local storage sync, bridge code used sparingly' },
      { left: 'Observable', middle: 'Lazy stream over time', right: 'HTTP, WebSocket, debounce, retry, cancellation, events' },
    ],
    interviewAnswer:
      'Attribute directives modify an existing element; structural directives change the view structure using TemplateRef and ViewContainerRef. Signals are synchronous state containers with fine-grained dependency tracking; Observables are lazy streams over time. A strong Angular app uses both at the right boundary.',
    seniorTraps: [
      'Do not implement security only in a directive. The backend must enforce authorization too.',
      'Do not turn every Observable into a signal if you need cancellation, backpressure, or retry operators.',
      'Do not overuse effects for state propagation; prefer computed values for derivation.',
    ],
    codeFiles: [
      { name: 'has-role.directive.ts', language: 'typescript', code: HAS_ROLE_DIRECTIVE_CODE() },
      { name: 'signals-rxjs-boundary.ts', language: 'typescript', code: SIGNALS_RXJS_BOUNDARY_CODE() },
    ],
  },
  'view-encapsulation': {
    id: 'view-encapsulation',
    badge: 'Feature 12',
    title: 'View Encapsulation and CSS Scoping',
    subtitle:
      'Emulated, ShadowDom, and None modes, plus what Angular actually generates with _nghost and _ngcontent attributes.',
    tags: ['Emulated', 'ShadowDom', 'None', '_nghost', '_ngcontent', ':host', ':host-context'],
    scenario:
      'A fintech design system ships dashboard cards, risk badges, charts, and micro-frontend widgets. Encapsulation decides whether component styles are isolated, simulated, or intentionally global.',
    sections: [
      {
        title: 'View encapsulation definition',
        body:
          'View encapsulation controls how component styles are scoped. Angular prevents accidental style bleed by default while still letting teams choose native shadow boundaries or global styles.',
        bullets: [
          'Emulated is the default and simulates component scoping with generated attributes.',
          'ShadowDom uses the browsers native Shadow DOM boundary.',
          'None applies component styles globally and should be deliberate.',
        ],
      },
      {
        title: 'How Emulated works',
        body:
          'During compilation, Angular adds a unique host attribute to the component host and content attributes to elements inside the template. It rewrites CSS selectors to include those attributes.',
        bullets: [
          'Host element receives an attribute such as _nghost-c12.',
          'Template elements receive attributes such as _ngcontent-c12.',
          'A selector like .risk-card becomes .risk-card[_ngcontent-c12].',
        ],
      },
      {
        title: 'Choosing a mode',
        body:
          'Most enterprise Angular apps use Emulated. ShadowDom is useful for hard isolation and design-system widgets. None is for global themes, resets, typography, and intentionally shared utility classes.',
        bullets: [
          'Use :host for styling the component host.',
          'Use CSS custom properties for theming across boundaries.',
          'Avoid broad ::ng-deep usage; prefer public inputs, CSS variables, or documented styling APIs.',
        ],
      },
    ],
    processTitle: 'Emulated compilation trace',
    processSteps: [
      'Component template and styles enter Angular compilation.',
      'Angular assigns a stable component style scope id for the build.',
      'The component host gets a generated host attribute.',
      'Elements in the component template get a generated content attribute.',
      'CSS selectors are rewritten so they match only that components generated attributes.',
    ],
    comparisonTitle: 'Encapsulation mode comparison',
    comparisonHeaders: ['Mode', 'Isolation', 'Best fit'],
    comparisonRows: [
      { left: 'Emulated', middle: 'Simulated CSS scoping with generated attributes', right: 'Default app components, enterprise feature screens' },
      { left: 'ShadowDom', middle: 'Native browser shadow boundary', right: 'Design-system widgets, embedded apps, strong isolation' },
      { left: 'None', middle: 'No component-level isolation', right: 'Global theme, reset, typography, utility styles' },
      { left: 'CSS variables', middle: 'Cross-boundary theme channel', right: 'Brand colors, risk palette, density tokens' },
    ],
    interviewAnswer:
      'Angular view encapsulation scopes component styles. Emulated rewrites selectors using generated _nghost and _ngcontent attributes, ShadowDom uses native browser isolation, and None makes styles global. A senior answer includes both the modes and how Emulated works under the hood.',
    seniorTraps: [
      'Do not put global resets in component styles with ViewEncapsulation.None unless that is intentionally a global style component.',
      'Do not rely on private generated attributes in application CSS; they are implementation details.',
      'Do not assume ShadowDom styles can be overridden like Emulated styles. Use CSS custom properties or explicit parts/APIs.',
    ],
    codeFiles: [
      { name: 'encapsulation.component.ts', language: 'typescript', code: ENCAPSULATION_TS_CODE() },
      { name: 'emulated-output.scss', language: 'scss', code: ENCAPSULATION_SCSS_CODE() },
    ],
  },
};

function DI_CODE(): string {
  return `import { Component, Inject, Injectable, InjectionToken, Optional, Self, SkipSelf } from '@angular/core';

export interface FraudRulesConfig {
  ruleset: string;
  highRiskThreshold: number;
}

export const FRAUD_RULES = new InjectionToken<FraudRulesConfig>('fraud.rules');

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  readonly userId = 'rm-1042';
}

@Injectable()
export class CustomerContextService {
  readonly customerId = 'CUST-7781';
}

@Component({
  selector: 'app-case-workspace',
  standalone: true,
  providers: [
    CustomerContextService,
    { provide: FRAUD_RULES, useValue: { ruleset: 'SME_LOAN_V3', highRiskThreshold: 720 } },
  ],
  template: '<app-risk-panel />',
})
export class CaseWorkspaceComponent {}

@Component({
  selector: 'app-risk-panel',
  standalone: true,
  template: '{{ customer.customerId }} uses {{ rules.ruleset }}',
})
export class RiskPanelComponent {
  constructor(
    public customer: CustomerContextService,
    @Inject(FRAUD_RULES) public rules: FraudRulesConfig,
    @Self() @Optional() private localOverride: CustomerContextService | null,
    @SkipSelf() private parentCustomer: CustomerContextService
  ) {}
}`;
}

function ROUTE_PROVIDERS_CODE(): string {
  return `import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'loan/:applicationId',
    providers: [
      LoanApplicationContextService,
      { provide: WORKFLOW_KIND, useValue: 'SME_LOAN_ORIGINATION' },
    ],
    loadComponent: () =>
      import('./loan-workspace.component').then((m) => m.LoanWorkspaceComponent),
  },
];

// Every visit to /loan/:applicationId receives a workflow-scoped context.
// AuthSessionService can remain providedIn: 'root' because it is truly app-wide.`;
}

function STANDALONE_MAIN_CODE(): string {
  return `import { bootstrapApplication, ApplicationConfig } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';

const routes: Routes = [
  {
    path: 'payments',
    loadComponent: () =>
      import('./payments/payment-shell.component').then((m) => m.PaymentShellComponent),
  },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authTokenInterceptor, correlationIdInterceptor])),
    { provide: API_BASE_URL, useValue: 'https://bff.bank.example/api' },
  ],
};

bootstrapApplication(AppComponent, appConfig).catch(console.error);`;
}

function STANDALONE_COMPONENT_CODE(): string {
  return `import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment-shell',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaymentLimitCardComponent],
  providers: [PaymentDraftStore],
  template: \`
    <app-payment-limit-card />
    <form [formGroup]="form">...</form>
  \`,
})
export class PaymentShellComponent {
  readonly form = this.paymentDraftStore.form;

  constructor(private readonly paymentDraftStore: PaymentDraftStore) {}
}`;
}

function AOT_TEMPLATE_CHECK_CODE(): string {
  return `import { Component, Input } from '@angular/core';

interface AccountSummary {
  accountId: string;
  availableBalance: number;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
}

@Component({
  selector: 'app-account-summary',
  standalone: true,
  template: \`
    <strong>{{ summary.accountId }}</strong>
    <span>{{ summary.availableBalance | currency }}</span>
    <em>{{ summary.riskTier }}</em>
  \`,
})
export class AccountSummaryComponent {
  @Input({ required: true }) summary!: AccountSummary;
}

// With strict template checking, {{ summary.unknownField }} fails during build,
// not after a banker opens the dashboard in production.`;
}

function IVY_PSEUDO_CODE(): string {
  return `// Simplified Ivy-style mental model. This is not exact generated output.
const AccountSummaryComponent_Definition = defineComponent({
  type: AccountSummaryComponent,
  selectors: [['app-account-summary']],
  inputs: { summary: 'summary' },
  template: function AccountSummaryTemplate(rf, ctx) {
    if (rf & Create) {
      elementStart(0, 'strong');
      text(1);
      elementEnd();
    }
    if (rf & Update) {
      advance(1);
      textInterpolate(ctx.summary.accountId);
    }
  },
});`;
}

function ONPUSH_CODE(): string {
  return `import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

interface PositionVm {
  symbol: string;
  marketValue: number;
}

@Component({
  selector: 'app-position-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <strong>{{ position.symbol }}</strong>
    <span>{{ position.marketValue | currency }}</span>
  \`,
})
export class PositionCardComponent {
  @Input({ required: true }) position!: PositionVm;
}

// Correct for OnPush:
this.position = { ...this.position, marketValue: nextValue };

// Bug-prone for OnPush:
this.position.marketValue = nextValue;`;
}

function STATE_SERVICE_CODE(): string {
  return `@Injectable({ providedIn: 'root' })
export class PortfolioSelectionStore {
  private readonly selectedAccountSubject = new BehaviorSubject<string | null>(null);
  readonly selectedAccount$ = this.selectedAccountSubject.asObservable();

  selectAccount(accountId: string): void {
    this.selectedAccountSubject.next(accountId);
  }
}

// Good for bounded state.
// For a cross-application trading workflow, prefer NgRx/NGXS when you need:
// - action history
// - reducer purity
// - explicit effects
// - devtools and time travel
// - predictable team-scale state transitions`;
}

function HAS_ROLE_DIRECTIVE_CODE(): string {
  return `import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private rendered = false;

  @Input() set appHasRole(role: string) {
    const allowed = this.userService.hasRole(role);

    if (allowed && !this.rendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.rendered = true;
      return;
    }

    if (!allowed) {
      this.viewContainer.clear();
      this.rendered = false;
    }
  }

  constructor(
    private readonly templateRef: TemplateRef<unknown>,
    private readonly viewContainer: ViewContainerRef,
    private readonly userService: UserService
  ) {}
}

// Usage:
// <button *appHasRole="'PAYMENT_APPROVER'">Approve transfer</button>`;
}

function SIGNALS_RXJS_BOUNDARY_CODE(): string {
  return `import { computed, signal } from '@angular/core';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

const quantity = signal(100);
const unitPrice = signal(42);
const notional = computed(() => quantity() * unitPrice());

// Signals are ideal for synchronous state that always has a current value.
console.log(notional());

// RxJS is ideal for streams over time, cancellation, and async workflows.
const searchResults$ = searchInput$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap((term) => accountApi.search(term))
);`;
}

function ENCAPSULATION_TS_CODE(): string {
  return `import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-risk-card',
  standalone: true,
  encapsulation: ViewEncapsulation.Emulated,
  template: \`
    <section class="risk-card">
      <strong>High Risk Exposure</strong>
    </section>
  \`,
  styles: [\`
    :host { display: block; }
    .risk-card { border-color: var(--risk-color, #ef4444); }
  \`],
})
export class RiskCardComponent {}

// Other modes:
// encapsulation: ViewEncapsulation.ShadowDom
// encapsulation: ViewEncapsulation.None`;
}

function ENCAPSULATION_SCSS_CODE(): string {
  return `/* Author writes this in risk-card.component.scss */
:host {
  display: block;
}

.risk-card {
  border: 1px solid #ef4444;
}

/* Emulated mental model after compilation */
app-risk-card[_nghost-c12] {
  display: block;
}

.risk-card[_ngcontent-c12] {
  border: 1px solid #ef4444;
}`;
}
