import { Routes } from '@angular/router';
import { GameScoreComponent } from './pages/game-score/game-score.component';
import { AddGameComponent } from './pages/add-game/add-game.component';
import { GameCardComponent } from './pages/game-card/game-card.component';
import { GameCardAdminComponent } from './pages/game-card-adm/game-card-adm.component';

export const routes: Routes = [
  {
    path: 'game-view',
    component: GameScoreComponent,
  },
  {
    path: 'add-game',
    component: AddGameComponent,
  },
  {
    path: 'game/:id',
    component: GameCardComponent,
  },
  {
    path: 'game-adm/:id',
    component: GameCardAdminComponent,
  },
  {
    path: '**',
    redirectTo: 'game-view',
  },
];
