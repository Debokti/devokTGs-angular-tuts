import { Injectable } from '@angular/core';
import { Observable, of, delay, tap } from 'rxjs';

export interface CustomerResult {
  id: string;
  name: string;
  accountNo: string;
  product: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

const MOCK_CUSTOMERS: CustomerResult[] = [
  { id: 'C001', name: 'Arjun Mehta', accountNo: 'ACC-10023', product: 'Personal Loan', risk: 'LOW' },
  { id: 'C002', name: 'Priya Sharma', accountNo: 'ACC-10045', product: 'Credit Card', risk: 'MEDIUM' },
  { id: 'C003', name: 'Rahul Verma', accountNo: 'ACC-10089', product: 'Home Loan', risk: 'HIGH' },
  { id: 'C004', name: 'Sneha Nair', accountNo: 'ACC-10112', product: 'Auto Loan', risk: 'LOW' },
  { id: 'C005', name: 'Vikram Singh', accountNo: 'ACC-10134', product: 'Business Loan', risk: 'HIGH' },
  { id: 'C006', name: 'Deepa Kumar', accountNo: 'ACC-10156', product: 'Credit Card', risk: 'LOW' },
  { id: 'C007', name: 'Aditya Rao', accountNo: 'ACC-10178', product: 'Personal Loan', risk: 'MEDIUM' },
  { id: 'C008', name: 'Kavya Reddy', accountNo: 'ACC-10200', product: 'Home Loan', risk: 'LOW' },
  { id: 'C009', name: 'Manish Joshi', accountNo: 'ACC-10222', product: 'Auto Loan', risk: 'MEDIUM' },
  { id: 'C010', name: 'Ananya Das', accountNo: 'ACC-10244', product: 'Business Loan', risk: 'HIGH' },
];

/**
 * CustomerSearchService
 *
 * Simulates a real-world customer search API endpoint.
 * Includes artificial latency of 300ms to mimic network round-trip.
 *
 * In production Fintech apps this would call:
 *   GET /api/v1/customers/search?q={query}&limit=10
 */
@Injectable({ providedIn: 'root' })
export class CustomerSearchService {
  private _totalApiCalls = 0;

  get totalApiCalls(): number {
    return this._totalApiCalls;
  }

  /**
   * Simulated search — each call increments the API call counter.
   * The `tap` operator lets us track side effects without altering the stream.
   */
  search(query: string): Observable<CustomerResult[]> {
    const trimmed = query.trim().toLowerCase();
    const results = trimmed
      ? MOCK_CUSTOMERS.filter(
          (c) =>
            c.name.toLowerCase().includes(trimmed) ||
            c.accountNo.toLowerCase().includes(trimmed) ||
            c.product.toLowerCase().includes(trimmed)
        )
      : [];

    return of(results).pipe(
      tap(() => this._totalApiCalls++), // count the call
      delay(300)                         // simulate network latency
    );
  }

  resetCallCount(): void {
    this._totalApiCalls = 0;
  }
}
