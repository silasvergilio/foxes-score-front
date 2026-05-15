import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Team } from '../../interfaces/team.interface';
import { Game, GameStatus } from '../../interfaces/game.interface';
import { ApiService } from '../../services/api.service';
import { LoaderService } from '../../services/loader.service';

interface ScheduleGroup {
  letter: string;
  label: string;
  teams: Team[];
  games: Game[];
}

const DEFAULT_TOURNAMENT = 'Taça Brasil Amador 2025';
const GROUP_LETTERS = ['A', 'B'];

@Component({
  selector: 'app-game-schedule',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './game-schedule.component.html',
  styleUrl: './game-schedule.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameScheduleComponent implements OnInit {
  tournament = DEFAULT_TOURNAMENT;
  groups: ScheduleGroup[] = [];

  loading = false;
  error = '';

  constructor(
    private api: ApiService,
    private loader: LoaderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetch();
  }

  fetch() {
    this.loading = true;
    this.error = '';
    this.loader.start();

    forkJoin({
      teams: this.api.get<Team[]>('teams'),
      games: this.api.get<Game[]>(
        `game/schedule?tournament=${encodeURIComponent(this.tournament)}`
      ),
    }).subscribe({
      next: ({ teams, games }) => {
        this.groups = this.buildGroups(teams ?? [], games ?? []);
        this.loading = false;
        this.loader.stop();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar agenda', err);
        this.error = 'Não foi possível carregar a tabela de jogos.';
        this.loading = false;
        this.loader.stop();
        this.cdr.markForCheck();
      },
    });
  }

  private buildGroups(teams: Team[], games: Game[]): ScheduleGroup[] {
    return GROUP_LETTERS.map((letter) => {
      const groupTeams = teams
        .filter((t) => (t.slot ?? '').startsWith(letter))
        .sort((a, b) => (a.slot ?? '').localeCompare(b.slot ?? ''));

      const groupGames = games
        .filter((g) => (g.homeTeam?.slot ?? '').startsWith(letter))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        letter,
        label: `Grupo ${letter}`,
        teams: groupTeams,
        games: groupGames,
      };
    });
  }

  statusLabel(status: GameStatus): string {
    switch (status) {
      case 'live':
        return 'Ao Vivo';
      case 'finished':
        return 'Finalizado';
      default:
        return 'Agendado';
    }
  }

  formatGameDate(iso: string): string {
    if (!iso) return 'A Definir';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'A Definir';
    const day = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day} · ${time}`;
  }

  initials(name: string | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? '')
      .join('');
  }

  teamLogo(team: Team | undefined): string | null {
    if (!team?.imageFile) return null;
    const file = team.imageFile.includes('.') ? team.imageFile : `${team.imageFile}.png`;
    return file;
  }

  trackById(_: number, item: { _id: string }): string {
    return item._id;
  }

  trackGroup(_: number, item: ScheduleGroup): string {
    return item.letter;
  }
}
