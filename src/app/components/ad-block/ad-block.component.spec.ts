import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdBlockComponent } from './ad-block.component';

describe('AdBlockComponent', () => {
  let component: AdBlockComponent;
  let fixture: ComponentFixture<AdBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdBlockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
