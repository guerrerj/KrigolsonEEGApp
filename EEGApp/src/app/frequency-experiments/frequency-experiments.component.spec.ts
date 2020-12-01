import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrequencyExperimentsComponent } from './frequency-experiments.component';

describe('FrequencyExperimentsComponent', () => {
  let component: FrequencyExperimentsComponent;
  let fixture: ComponentFixture<FrequencyExperimentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FrequencyExperimentsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FrequencyExperimentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
