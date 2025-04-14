import { Routes } from '@angular/router';
import { GameScoreComponent } from './components/game-score/game-score.component';

export const routes: Routes = [
  {
    path: 'game-view',
    component: GameScoreComponent,
  },
  {
    path: '**',
    redirectTo: 'game-view',
  },
];
