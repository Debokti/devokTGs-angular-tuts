import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { GeoService, GeoOption } from './geo.service';
import { CodeViewerComponent, CodeFile } from '../code-viewer/code-viewer.component';
import {
  DEPENDENT_DROPDOWN_TS,
  DEPENDENT_DROPDOWN_HTML,
  DEPENDENT_DROPDOWN_SERVICE,
} from '../code-snippets';

/**
 * DependentDropdownComponent
 *
 * Demonstrates cascading/dependent select dropdowns using Angular Reactive Forms.
 *
 * Pattern used in Fintech for:
 *  - Branch → Product → Sub-Product selectors in loan origination
 *  - Country → State → City in KYC address forms
 *  - Risk Category → Sub-Category → Risk Code in compliance screens
 *
 * Key Angular concepts demonstrated:
 *  1. FormGroup + FormControl value changes via `valueChanges`
 *  2. Enabling/disabling child controls reactively
 *  3. Managing subscriptions cleanly with `takeUntil` + Subject
 *  4. Loading state management during async data fetch
 */
@Component({
  selector: 'lib-dependent-dropdown',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CodeViewerComponent],
  templateUrl: './dependent-dropdown.component.html',
  styleUrls: ['./dependent-dropdown.component.scss'],
})
export class DependentDropdownComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  readonly codeFiles: CodeFile[] = [
    {
      name: 'dependent-dropdown.component.ts',
      code: DEPENDENT_DROPDOWN_TS,
      language: 'typescript',
    },
    {
      name: 'dependent-dropdown.component.html',
      code: DEPENDENT_DROPDOWN_HTML,
      language: 'html',
    },
    {
      name: 'geo.service.ts',
      code: DEPENDENT_DROPDOWN_SERVICE,
      language: 'typescript',
    },
  ];

  countries: GeoOption[] = [];
  states: GeoOption[] = [];
  cities: GeoOption[] = [];

  loadingStates = false;
  loadingCities = false;

  selectedSummary: { country: string; state: string; city: string } | null =
    null;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private geoService: GeoService) {}

  ngOnInit(): void {
    this.countries = this.geoService.countries;

    this.form = this.fb.group({
      country: [{ value: '', disabled: false }, Validators.required],
      state: [{ value: '', disabled: true }, Validators.required],
      city: [{ value: '', disabled: true }, Validators.required],
    });

    // React to country changes → load states
    this.form
      .get('country')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((countryCode: string) => {
        this.onCountryChange(countryCode);
      });

    // React to state changes → load cities
    this.form
      .get('state')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((stateCode: string) => {
        this.onStateChange(stateCode);
      });
  }

  private onCountryChange(countryCode: string): void {
    // Reset downstream
    this.form.get('state')!.setValue('');
    this.form.get('city')!.setValue('');
    this.form.get('state')!.disable();
    this.form.get('city')!.disable();
    this.states = [];
    this.cities = [];
    this.selectedSummary = null;

    if (!countryCode) return;

    this.loadingStates = true;
    this.geoService
      .getStates(countryCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (states) => {
          this.states = states;
          this.loadingStates = false;
          this.form.get('state')!.enable();
        },
        error: () => {
          this.loadingStates = false;
        },
      });
  }

  private onStateChange(stateCode: string): void {
    this.form.get('city')!.setValue('');
    this.form.get('city')!.disable();
    this.cities = [];
    this.selectedSummary = null;

    if (!stateCode) return;

    this.loadingCities = true;
    this.geoService
      .getCities(stateCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cities) => {
          this.cities = cities;
          this.loadingCities = false;
          this.form.get('city')!.enable();
        },
        error: () => {
          this.loadingCities = false;
        },
      });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const { country, state, city } = this.form.getRawValue();
    this.selectedSummary = {
      country:
        this.countries.find((c) => c.code === country)?.name ?? country,
      state: this.states.find((s) => s.code === state)?.name ?? state,
      city: this.cities.find((c) => c.code === city)?.name ?? city,
    };
  }

  onReset(): void {
    this.form.reset({ country: '', state: '', city: '' });
    this.form.get('state')!.disable();
    this.form.get('city')!.disable();
    this.states = [];
    this.cities = [];
    this.selectedSummary = null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
