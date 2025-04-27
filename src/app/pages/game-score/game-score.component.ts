import { Component } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { BallGame } from '../../interfaces/game.interface';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../services/api.service';
import { GameCardPreviewComponent } from '../../components/game-card-preview/game-card-preview.component';

@Component({
  selector: 'game-score',
  imports: [
    MatCardModule,
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    GameCardPreviewComponent
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
  ],
  templateUrl: './game-score.component.html',
  styleUrl: './game-score.component.scss',
})
export class GameScoreComponent {
  public games: BallGame[] = [];

  constructor(private socket: Socket, private api: ApiService) {}

  ngOnInit() {
    this.api.get<BallGame[]>('game').subscribe((data) => {
      this.games = data;
    });
  }
}
