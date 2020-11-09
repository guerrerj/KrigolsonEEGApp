import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrequencySpectraComponent } from './frequency-spectra.component';

describe('FrequencySpectraComponent', () => {
  let component: FrequencySpectraComponent;
  let fixture: ComponentFixture<FrequencySpectraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FrequencySpectraComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FrequencySpectraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
