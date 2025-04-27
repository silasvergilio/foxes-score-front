import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameCardPreviewComponent } from './game-card-preview.component';

describe('GameCardPreviewComponent', () => {
  let component: GameCardPreviewComponent;
  let fixture: ComponentFixture<GameCardPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameCardPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameCardPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
