import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BciComponent } from './bci.component';

describe('BciComponent', () => {
  let component: BciComponent;
  let fixture: ComponentFixture<BciComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BciComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BciComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
