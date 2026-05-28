import { TestBed } from '@angular/core/testing';

import { FeatureDemosService } from './feature-demos.service';

describe('FeatureDemosService', () => {
  let service: FeatureDemosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FeatureDemosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
