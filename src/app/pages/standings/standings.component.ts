import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface TeamStanding {
  name: string;
  W: number;
  L: number;
}

interface GroupStanding {
  letter: string;
  label: string;
  teams: TeamStanding[];
}

const STANDINGS_DATA: GroupStanding[] = [
  {
    letter: 'A',
    label: 'Grupo A',
    teams: [
      { name: 'A Definir', W: 0, L: 0 },
      { name: 'A Definir', W: 0, L: 0 },
      { name: 'A Definir', W: 0, L: 0 },
      { name: 'A Definir', W: 0, L: 0 },
    ]
  },
  {
    letter: 'B',
    label: 'Grupo B',
    teams: [
      { name: 'A Definir', W: 0, L: 0 },
      { name: 'A Definir', W: 0, L: 0 },
      { name: 'A Definir', W: 0, L: 0 },
      { name: 'A Definir', W: 0, L: 0 },
    ]
  }
];

@Component({
  selector: 'app-standings',
  standalone: true,
  imports: [NgFor, MatIconModule],
  templateUrl: './standings.component.html',
  styleUrl: './standings.component.scss'
})
export class StandingsComponent {
  groups = STANDINGS_DATA;

  pct(team: TeamStanding): string {
    const total = team.W + team.L;
    if (total === 0) return '.000';
    const val = team.W / total;
    return val === 1 ? '1.000' : val.toFixed(3).replace('0.', '.');
  }

  gb(leader: TeamStanding, team: TeamStanding): string {
    const diff = (leader.W - team.W + team.L - leader.L) / 2;
    if (diff === 0) return '—';
    return diff % 1 === 0 ? diff.toString() : diff.toFixed(1);
  }

  sortedTeams(teams: TeamStanding[]): TeamStanding[] {
    return [...teams].sort((a, b) => {
      const pctA = (a.W + a.L) > 0 ? a.W / (a.W + a.L) : 0;
      const pctB = (b.W + b.L) > 0 ? b.W / (b.W + b.L) : 0;
      return pctB - pctA || b.W - a.W;
    });
  }
}
