import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface GeoOption {
  code: string;
  name: string;
}

const GEO_DATA: Record<string, { states: GeoOption[] }> = {
  IND: {
    states: [
      { code: 'MH', name: 'Maharashtra' },
      { code: 'KA', name: 'Karnataka' },
      { code: 'TN', name: 'Tamil Nadu' },
      { code: 'DL', name: 'Delhi' },
    ],
  },
  USA: {
    states: [
      { code: 'CA', name: 'California' },
      { code: 'NY', name: 'New York' },
      { code: 'TX', name: 'Texas' },
      { code: 'FL', name: 'Florida' },
    ],
  },
  GBR: {
    states: [
      { code: 'ENG', name: 'England' },
      { code: 'SCT', name: 'Scotland' },
      { code: 'WLS', name: 'Wales' },
    ],
  },
  SGP: {
    states: [
      { code: 'CTL', name: 'Central Region' },
      { code: 'EST', name: 'East Region' },
      { code: 'WST', name: 'West Region' },
    ],
  },
};

const CITY_DATA: Record<string, GeoOption[]> = {
  MH: [
    { code: 'MUM', name: 'Mumbai' },
    { code: 'PUN', name: 'Pune' },
    { code: 'NGP', name: 'Nagpur' },
  ],
  KA: [
    { code: 'BLR', name: 'Bengaluru' },
    { code: 'MYS', name: 'Mysuru' },
    { code: 'HBL', name: 'Hubballi' },
  ],
  TN: [
    { code: 'CHE', name: 'Chennai' },
    { code: 'CBE', name: 'Coimbatore' },
    { code: 'MDU', name: 'Madurai' },
  ],
  DL: [
    { code: 'NDL', name: 'New Delhi' },
    { code: 'NDA', name: 'Noida' },
    { code: 'GRG', name: 'Gurugram' },
  ],
  CA: [
    { code: 'LAX', name: 'Los Angeles' },
    { code: 'SFO', name: 'San Francisco' },
    { code: 'SDO', name: 'San Diego' },
  ],
  NY: [
    { code: 'NYC', name: 'New York City' },
    { code: 'BUF', name: 'Buffalo' },
    { code: 'ALB', name: 'Albany' },
  ],
  TX: [
    { code: 'HOU', name: 'Houston' },
    { code: 'DAL', name: 'Dallas' },
    { code: 'AUS', name: 'Austin' },
  ],
  FL: [
    { code: 'MIA', name: 'Miami' },
    { code: 'ORL', name: 'Orlando' },
    { code: 'TPA', name: 'Tampa' },
  ],
  ENG: [
    { code: 'LON', name: 'London' },
    { code: 'MAN', name: 'Manchester' },
    { code: 'BRM', name: 'Birmingham' },
  ],
  SCT: [
    { code: 'EDI', name: 'Edinburgh' },
    { code: 'GLA', name: 'Glasgow' },
  ],
  WLS: [
    { code: 'CDF', name: 'Cardiff' },
    { code: 'SWA', name: 'Swansea' },
  ],
  CTL: [
    { code: 'ORH', name: 'Orchard' },
    { code: 'MAR', name: 'Marina Bay' },
  ],
  EST: [
    { code: 'TAM', name: 'Tampines' },
    { code: 'BED', name: 'Bedok' },
  ],
  WST: [
    { code: 'JRG', name: 'Jurong' },
    { code: 'CLM', name: 'Clementi' },
  ],
};

/**
 * GeoService — Simulates async HTTP calls for geographic data.
 * Uses RxJS `of()` + `delay()` to mimic real API latency.
 *
 * In a real Fintech app, these would be:
 *   GET /api/v1/geo/countries
 *   GET /api/v1/geo/states?country={code}
 *   GET /api/v1/geo/cities?state={code}
 */
@Injectable({ providedIn: 'root' })
export class GeoService {
  readonly countries: GeoOption[] = [
    { code: 'IND', name: 'India' },
    { code: 'USA', name: 'United States' },
    { code: 'GBR', name: 'United Kingdom' },
    { code: 'SGP', name: 'Singapore' },
  ];

  getStates(countryCode: string): Observable<GeoOption[]> {
    const states = GEO_DATA[countryCode]?.states ?? [];
    return of(states).pipe(delay(600)); // simulate network latency
  }

  getCities(stateCode: string): Observable<GeoOption[]> {
    const cities = CITY_DATA[stateCode] ?? [];
    return of(cities).pipe(delay(500));
  }
}
