import { Component } from '@angular/core';
import { GameScore } from '../../interfaces/game-score.interface';
import { MatTableModule } from '@angular/material/table';
import { PlayerStats } from '../../interfaces/player-stats.interface';
import { FormatNamePipe } from '../../pipes/formatName.pipe';
import { MatFormField, MatLabel, MatSelect, MatOption } from "@angular/material/select";

const GAME_DATA: GameScore[] = [
  {
    teamName: "Foxes",
    score: [1,0,0,0,0,0,0,0,0]
  },
  {
    teamName: "UnderDogs",
    score: [1,2,3,0,0,0,0,0,0]
  }
];



@Component({
  selector: 'app-game-results',
  imports: [MatTableModule, FormatNamePipe],
  templateUrl: './game-results.component.html',
  styleUrl: './game-results.component.scss'
})
export class GameResultsComponent {

  getRuns(score: number[]): number {
    return score.reduce((a, b) => a + (Number(b) || 0), 0);
  }
  
  displayedColumns = [
    'Equipe', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'R'
  ];  dataSource = GAME_DATA;
  
}
