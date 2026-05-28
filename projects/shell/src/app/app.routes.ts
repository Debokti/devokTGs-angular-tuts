import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dependent-dropdown',
    pathMatch: 'full',
  },
  {
    path: 'dependent-dropdown',
    loadComponent: () =>
      import('feature-demos').then((m) => m.DependentDropdownComponent),
    title: 'Dependent Dropdown — Angular Hands-On Lab',
  },
  {
    path: 'debounce-api',
    loadComponent: () =>
      import('feature-demos').then((m) => m.DebounceDemoComponent),
    title: 'Debounce API Guard — Angular Hands-On Lab',
  },
  {
    path: 'signals-vs-rxjs',
    loadComponent: () =>
      import('feature-demos').then((m) => m.SignalsVsRxjsComponent),
    title: 'Signals vs RxJS — Angular Hands-On Lab',
  },
  {
    path: 'rxjs-foundations',
    loadComponent: () =>
      import('feature-demos').then((m) => m.RxjsFoundationsComponent),
    title: 'RxJS Foundations - Angular Hands-On Lab',
  },
  {
    path: 'rxjs-operator-catalog',
    loadComponent: () =>
      import('feature-demos').then((m) => m.RxjsOperatorCatalogComponent),
    title: 'RxJS Operator Catalog - Angular Hands-On Lab',
  },
  {
    path: 'rxjs-fintech-flows',
    loadComponent: () =>
      import('feature-demos').then((m) => m.RxjsFintechFlowsComponent),
    title: 'RxJS Fintech Flow Simulator - Angular Hands-On Lab',
  },
  {
    path: 'angular-di',
    loadComponent: () =>
      import('feature-demos').then((m) => m.AngularInterviewConceptsComponent),
    data: { conceptId: 'angular-di' },
    title: 'Angular DI - Angular Hands-On Lab',
  },
  {
    path: 'standalone-bootstrap',
    loadComponent: () =>
      import('feature-demos').then((m) => m.AngularInterviewConceptsComponent),
    data: { conceptId: 'standalone-bootstrap' },
    title: 'Standalone Bootstrapping - Angular Hands-On Lab',
  },
  {
    path: 'aot-ivy',
    loadComponent: () =>
      import('feature-demos').then((m) => m.AngularInterviewConceptsComponent),
    data: { conceptId: 'aot-ivy' },
    title: 'AOT and Ivy - Angular Hands-On Lab',
  },
  {
    path: 'change-detection-state',
    loadComponent: () =>
      import('feature-demos').then((m) => m.AngularInterviewConceptsComponent),
    data: { conceptId: 'change-detection-state' },
    title: 'Change Detection and State - Angular Hands-On Lab',
  },
  {
    path: 'directives-signals',
    loadComponent: () =>
      import('feature-demos').then((m) => m.AngularInterviewConceptsComponent),
    data: { conceptId: 'directives-signals' },
    title: 'Directives and Signals - Angular Hands-On Lab',
  },
  {
    path: 'view-encapsulation',
    loadComponent: () =>
      import('feature-demos').then((m) => m.AngularInterviewConceptsComponent),
    data: { conceptId: 'view-encapsulation' },
    title: 'View Encapsulation - Angular Hands-On Lab',
  },
  {
    path: 'styling-sandbox',
    loadComponent: () =>
      import('feature-demos').then((m) => m.StylingSandboxComponent),
    title: 'Child Scoping & ::ng-deep - Angular Hands-On Lab',
  },
  {
    path: 'lifecycle-sandbox',
    loadComponent: () =>
      import('feature-demos').then((m) => m.LifecycleSandboxComponent),
    title: 'Lifecycle Hooks & Mutability - Angular Hands-On Lab',
  },
  {
    path: 'change-detection-sandbox',
    loadComponent: () =>
      import('feature-demos').then((m) => m.ChangeDetectionSandboxComponent),
    title: 'OnPush & ngDoCheck - Angular Hands-On Lab',
  },
  {
    path: 'zone-leaks-sandbox',
    loadComponent: () =>
      import('feature-demos').then((m) => m.ZoneLeaksSandboxComponent),
    title: 'Zone.js & Memory Leaks - Angular Hands-On Lab',
  },
];

