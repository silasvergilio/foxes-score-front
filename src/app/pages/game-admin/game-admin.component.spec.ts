import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameAdminComponent } from './game-admin.component';

describe('GameAdminComponent', () => {
  let component: GameAdminComponent;
  let fixture: ComponentFixture<GameAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
