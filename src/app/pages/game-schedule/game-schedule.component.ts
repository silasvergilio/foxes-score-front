import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface ScheduleGame {
  teamA: string;
  teamB: string;
  date: string;
  status: 'scheduled' | 'live' | 'finished';
  scoreA?: number;
  scoreB?: number;
}

interface ScheduleField {
  id: number;
  name: string;
  teams: string[];
  games: ScheduleGame[];
}

@Component({
  selector: 'app-game-schedule',
  standalone: true,
  imports: [NgFor, NgIf, MatIconModule],
  templateUrl: './game-schedule.component.html',
  styleUrl: './game-schedule.component.scss'
})
export class GameScheduleComponent {
  currentYear = new Date().getFullYear();

  fields: ScheduleField[] = [
    {
      id: 1,
      name: 'Campo 1',
      teams: ['A Definir', 'A Definir', 'A Definir'],
      games: [
        { teamA: 'A Definir', teamB: 'A Definir', date: 'A Definir', status: 'scheduled' },
        { teamA: 'A Definir', teamB: 'A Definir', date: 'A Definir', status: 'scheduled' },
        { teamA: 'A Definir', teamB: 'A Definir', date: 'A Definir', status: 'scheduled' },
      ]
    },
    {
      id: 2,
      name: 'Campo 2',
      teams: ['A Definir', 'A Definir', 'A Definir'],
      games: [
        { teamA: 'A Definir', teamB: 'A Definir', date: 'A Definir', status: 'scheduled' },
        { teamA: 'A Definir', teamB: 'A Definir', date: 'A Definir', status: 'scheduled' },
        { teamA: 'A Definir', teamB: 'A Definir', date: 'A Definir', status: 'scheduled' },
      ]
    },
    {
      id: 3,
      name: 'Campo 3',
      teams: ['A Definir', 'A Definir', 'A Definir'],
      games: [
        { teamA: 'A Definir', teamB: 'A Definir', date: 'A Definir', status: 'scheduled' },
        { teamA: 'A Definir', teamB: 'A Definir', date: 'A Definir', status: 'scheduled' },
        { teamA: 'A Definir', teamB: 'A Definir', date: 'A Definir', status: 'scheduled' },
      ]
    }
  ];

  statusLabel(status: string): string {
    switch (status) {
      case 'live': return 'Ao Vivo';
      case 'finished': return 'Finalizado';
      default: return 'A Definir';
    }
  }
}
