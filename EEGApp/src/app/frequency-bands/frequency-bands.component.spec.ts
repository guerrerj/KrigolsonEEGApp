import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrequencyBandsComponent } from './frequency-bands.component';

describe('FrequencyBandsComponent', () => {
  let component: FrequencyBandsComponent;
  let fixture: ComponentFixture<FrequencyBandsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FrequencyBandsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FrequencyBandsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
