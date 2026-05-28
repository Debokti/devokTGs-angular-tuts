import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
  path: string;
  label: string;
  badge: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  sidebarOpen = true;

  readonly navItems: NavItem[] = [
    {
      path: '/dependent-dropdown',
      label: 'Dependent Dropdown',
      badge: '01',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M3 7h18M3 12h12M3 17h8M17 17l2 2 4-4" />
             </svg>`,
      description: 'Reactive Forms, cascading selects',
    },
    {
      path: '/debounce-api',
      label: 'Debounce API Guard',
      badge: '02',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M12 6v6l4 2M12 22a10 10 0 100-20 10 10 0 000 20z" />
             </svg>`,
      description: 'debounceTime, switchMap, RxJS',
    },
    {
      path: '/signals-vs-rxjs',
      label: 'Signals vs RxJS',
      badge: '03',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
             </svg>`,
      description: 'State vs Event streams, glitch-free, rxResource',
    },
    {
      path: '/rxjs-foundations',
      label: 'RxJS Foundations',
      badge: '04',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M4 6h16M4 12h10M4 18h16M17 9l3 3-3 3" />
             </svg>`,
      description: 'Observables, observers, subjects',
    },
    {
      path: '/rxjs-operator-catalog',
      label: 'RxJS Catalog',
      badge: '05',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z" />
             </svg>`,
      description: 'Operators, methods, schedulers',
    },
    {
      path: '/rxjs-fintech-flows',
      label: 'Fintech RxJS Flows',
      badge: '06',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M4 18V7m0 11h16M8 15l3-3 3 2 5-6M8 7h.01M12 7h.01M16 7h.01" />
             </svg>`,
      description: 'Loan, payments, surveillance',
    },
    {
      path: '/angular-di',
      label: 'Angular DI',
      badge: '07',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M5 7h4v4H5zM15 7h4v4h-4zM10 9h5M7 11v4a2 2 0 002 2h6M15 17h4" />
             </svg>`,
      description: 'Injectors, scopes, resolution',
    },
    {
      path: '/standalone-bootstrap',
      label: 'Standalone Bootstrap',
      badge: '08',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M12 3v6M8 7h8M5 12h14M7 12v7h10v-7" />
             </svg>`,
      description: 'Standalone APIs, app config',
    },
    {
      path: '/aot-ivy',
      label: 'AOT & Ivy',
      badge: '09',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M4 5h16v4H4zM4 15h16v4H4zM8 9v6M16 9v6" />
             </svg>`,
      description: 'Compiler, renderer, locality',
    },
    {
      path: '/change-detection-state',
      label: 'CD & State',
      badge: '10',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M4 12a8 8 0 0113.5-5.8M20 12a8 8 0 01-13.5 5.8M17 3v4h-4M7 21v-4h4" />
             </svg>`,
      description: 'Default, OnPush, NgRx',
    },
    {
      path: '/directives-signals',
      label: 'Directives & Signals',
      badge: '11',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M5 5h14v4H5zM5 15h6v4H5zM15 14l4 4M19 14l-4 4" />
             </svg>`,
      description: 'Structural, attribute, signals',
    },
    {
      path: '/view-encapsulation',
      label: 'View Encapsulation',
      badge: '12',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M4 6h16v12H4zM8 10h8M8 14h5" />
             </svg>`,
      description: 'Emulated, ShadowDom, None',
    },
    {
      path: '/styling-sandbox',
      label: 'Child Styling & ::ng-deep',
      badge: '13',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M9.53 16.122A3 3 0 00.75 10.5 3 3 0 009.53 4.878m0 11.244a6.002 6.002 0 000-11.244m0 11.244v1.25A2.25 2.25 0 0011.78 19.5h6.97a2.25 2.25 0 002.25-2.25v-1.25M9.53 4.878v-1.25A2.25 2.25 0 0111.78 1.5h6.97A2.25 2.25 0 0121 3.75v1.25" />
             </svg>`,
      description: 'CSS scoping, ::ng-deep bleed, custom variables',
    },
    {
      path: '/lifecycle-sandbox',
      label: 'Lifecycle Sequence',
      badge: '14',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>`,
      description: '8 hooks order, view query timing, mutations',
    },
    {
      path: '/change-detection-sandbox',
      label: 'OnPush & ngDoCheck',
      badge: '15',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>`,
      description: 'Custom dirty-checking, ChangeDetectorRef',
    },
    {
      path: '/zone-leaks-sandbox',
      label: 'Zone.js & Leaks',
      badge: '16',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>`,
      description: 'runOutsideAngular, observable unsubscriptions',
    },
  ];


  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
