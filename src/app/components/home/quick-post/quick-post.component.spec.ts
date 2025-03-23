import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickPostComponent } from './quick-post.component';

describe('QuickPostComponent', () => {
  let component: QuickPostComponent;
  let fixture: ComponentFixture<QuickPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickPostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
