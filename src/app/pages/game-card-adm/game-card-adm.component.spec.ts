import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameCardAdmComponent } from './game-card-adm.component';

describe('GameCardAdmComponent', () => {
  let component: GameCardAdmComponent;
  let fixture: ComponentFixture<GameCardAdmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameCardAdmComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameCardAdmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
