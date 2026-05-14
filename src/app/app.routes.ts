import { Routes } from '@angular/router';
import { GameScoreComponent } from './pages/game-score/game-score.component';
import { AddGameComponent } from './pages/add-game/add-game.component';
import { GameCardComponent } from './pages/game-card/game-card.component';
import { GameCardAdminComponent } from './pages/game-card-adm/game-card-adm.component';
import { StatsComponent } from './pages/stats/stats.component';
import { GameResultsComponent } from './pages/game-results/game-results.component';
import { TeamsComponent } from './pages/teams/teams.component';
import { GameScheduleComponent } from './pages/game-schedule/game-schedule.component';

export const routes: Routes = [
  {
    path: 'game-view',
    component: GameScoreComponent,
  },
  {
    path: 'game-schedule',
    component: GameScheduleComponent,
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
    path: 'stats',
    component: StatsComponent,
  },
  {
    path: 'game-results',
    component: GameResultsComponent
  },
  {
    path: 'teams',
    component: TeamsComponent
  },
  {
    path: '**',
    redirectTo: 'game-view',
  },
];
