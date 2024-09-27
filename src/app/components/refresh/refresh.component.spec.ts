import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefreshComponent } from './refresh.component';

describe('RefreshComponent', () => {
  let component: RefreshComponent;
  let fixture: ComponentFixture<RefreshComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefreshComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefreshComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
