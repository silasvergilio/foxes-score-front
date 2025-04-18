import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameIndicatorComponent } from './game-indicator.component';

describe('GameIndicatorComponent', () => {
  let component: GameIndicatorComponent;
  let fixture: ComponentFixture<GameIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameIndicatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
