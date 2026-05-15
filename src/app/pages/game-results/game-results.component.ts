import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormatNamePipe } from '../../pipes/formatName.pipe';

interface GameScore {
  teamName: string;
  score: number[];
}

interface FieldGame {
  fieldId: number;
  fieldName: string;
  status: 'live' | 'finished' | 'scheduled';
  broadcastUrl?: string;
  teams: GameScore[];
}

const FIELDS_DATA: FieldGame[] = [
  {
    fieldId: 1,
    fieldName: 'Campo 1',
    status: 'finished',
    broadcastUrl: 'https://link-da-transmissao.com',
    teams: [
      { teamName: 'Foxes', score: [1, 0, 0, 0, 0, 0, 0, 0, 0] },
      { teamName: 'UnderDogs', score: [1, 2, 3, 0, 0, 0, 0, 0, 0] },
    ]
  },
  {
    fieldId: 2,
    fieldName: 'Campo 2',
    status: 'scheduled',
    teams: [
      { teamName: 'A Definir', score: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { teamName: 'A Definir', score: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    ]
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
  fields = FIELDS_DATA;

  getRuns(score: number[]): number {
    return score.reduce((a, b) => a + (Number(b) || 0), 0);
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'live': return 'Ao Vivo';
      case 'finished': return 'Finalizado';
      default: return 'A Definir';
    }
  }
}
