import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureDemosComponent } from './feature-demos.component';

describe('FeatureDemosComponent', () => {
  let component: FeatureDemosComponent;
  let fixture: ComponentFixture<FeatureDemosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureDemosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeatureDemosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
