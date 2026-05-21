import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Team, Coach } from '../../interfaces/team.interface';
import { Player } from '../../interfaces/player.interface';
import { ApiService } from '../../services/api.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-teams',
  standalone: true,
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamsComponent implements OnInit {
  teams: Team[] = [];
  selectedTeam: Team | null = null;
  roster: Player[] = [];

  loadingTeams = false;
  loadingRoster = false;
  error = '';

  rosterColumns = ['jerseyNumber', 'name', 'nickname', 'bats', 'throws'];

  constructor(
    private api: ApiService,
    private loader: LoaderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchTeams();
  }

  fetchTeams() {
    this.loadingTeams = true;
    this.error = '';
    this.loader.start();

    this.api.get<Team[]>('teams').subscribe({
      next: (data) => {
        this.teams = data ?? [];
        this.loadingTeams = false;
        this.loader.stop();
        if (this.teams.length > 0) {
          this.selectTeam(this.teams[0]);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao buscar equipes', err);
        this.error = 'Não foi possível carregar as equipes.';
        this.loadingTeams = false;
        this.loader.stop();
        this.cdr.markForCheck();
      },
    });
  }

  selectTeam(team: Team) {
    this.selectedTeam = team;
    this.roster = [];
    this.loadingRoster = true;
    this.cdr.markForCheck();

    this.api.get<Player[]>(`teams/${team._id}/players`).subscribe({
      next: (players) => {
        this.roster = (players ?? []).sort(
          (a, b) => (a.rosterNumber ?? a.jerseyNumber ?? 999) - (b.rosterNumber ?? b.jerseyNumber ?? 999)
        );
        this.loadingRoster = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao buscar elenco', err);
        this.roster = [];
        this.loadingRoster = false;
        this.cdr.markForCheck();
      },
    });
  }

  headCoaches(coaches?: Coach[]): Coach[] {
    return (coaches ?? []).filter((c) => c.role === 'head');
  }

  assistantCoaches(coaches?: Coach[]): Coach[] {
    return (coaches ?? []).filter((c) => c.role === 'assistant');
  }

  handLabel(hand?: 'right' | 'left'): string {
    if (hand === 'right') return 'Direita';
    if (hand === 'left') return 'Esquerda';
    return '—';
  }

  openLink(team: Team, ev: Event) {
    ev.stopPropagation();
    if (team.link) {
      window.open(team.link, '_blank', 'noopener');
    }
  }
}
