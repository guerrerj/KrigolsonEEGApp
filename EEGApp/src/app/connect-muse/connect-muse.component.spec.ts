import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectMuseComponent } from './connect-muse.component';

describe('ConnectMuseComponent', () => {
  let component: ConnectMuseComponent;
  let fixture: ComponentFixture<ConnectMuseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConnectMuseComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectMuseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
