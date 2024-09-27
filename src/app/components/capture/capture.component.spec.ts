import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptureComponent } from './capture.component';

describe('CaptureComponent', () => {
  let component: CaptureComponent;
  let fixture: ComponentFixture<CaptureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaptureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaptureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
