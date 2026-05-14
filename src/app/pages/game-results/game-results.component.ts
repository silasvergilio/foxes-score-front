import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GameScore } from '../../interfaces/game-score.interface';
import { FormatNamePipe } from '../../pipes/formatName.pipe';

const GAME_DATA: GameScore[] = [
  {
    teamName: "Foxes",
    score: [1, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    teamName: "UnderDogs",
    score: [1, 2, 3, 0, 0, 0, 0, 0, 0]
  }
];

@Component({
  selector: 'app-game-results',
  standalone: true,
  imports: [NgFor, MatIconModule, FormatNamePipe],
  templateUrl: './game-results.component.html',
  styleUrl: './game-results.component.scss'
})
export class GameResultsComponent {
  innings = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  dataSource = GAME_DATA;

  getRuns(score: number[]): number {
    return score.reduce((a, b) => a + (Number(b) || 0), 0);
  }
}
