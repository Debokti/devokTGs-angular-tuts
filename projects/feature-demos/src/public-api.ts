/*
 * Public API Surface of feature-demos
 *
 * This is the module federation contract — only what's exported here
 * is available to the shell host application.
 */

// Feature 1: Dependent Dropdown
export * from './lib/dependent-dropdown/geo.service';
export * from './lib/dependent-dropdown/dependent-dropdown.component';

// Feature 2: Debounce API Demo
export * from './lib/debounce-api/customer-search.service';
export * from './lib/debounce-api/debounce-demo.component';

// Utilities
export * from './lib/code-viewer/code-viewer.component';

// Feature 3: Signals vs RxJS Demo
export * from './lib/signals-vs-rxjs/signals-vs-rxjs.component';

// Feature 4: RxJS Foundations
export * from './lib/rxjs-foundations/rxjs-foundations.component';

// Feature 5: RxJS Operator Catalog
export * from './lib/rxjs-operator-catalog/rxjs-operator-catalog.component';

// Feature 6: RxJS Fintech Flow Simulator
export * from './lib/rxjs-fintech-flows/rxjs-fintech-flows.component';

// Feature 7-12: Angular Interview Concept Sandboxes
export * from './lib/angular-interview-concepts/angular-interview-concepts.component';

// Feature 13-16: Advanced Prep Sandboxes
export * from './lib/angular-interview-sandboxes/styling-sandbox.component';
export * from './lib/angular-interview-sandboxes/lifecycle-sandbox.component';
export * from './lib/angular-interview-sandboxes/change-detection-sandbox.component';
export * from './lib/angular-interview-sandboxes/zone-leaks-sandbox.component';

