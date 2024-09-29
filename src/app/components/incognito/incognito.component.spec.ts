import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncognitoComponent } from './incognito.component';

describe('IncognitoComponent', () => {
  let component: IncognitoComponent;
  let fixture: ComponentFixture<IncognitoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncognitoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncognitoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
