import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Team } from '../../interfaces/team.interface';
import { Game, GameStatus } from '../../interfaces/game.interface';
import { ApiService } from '../../services/api.service';
import { LoaderService } from '../../services/loader.service';
import { TournamentService } from '../../services/tournament.service';
import { TournamentKey } from '../../interfaces/tournament.interface';

interface ScheduleGroup {
  id: string;
  label: string;
  teams: Team[];
  games: Game[];
}

const GROUP_IDS = ['1', '2'];

@Component({
  selector: 'app-game-schedule',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './game-schedule.component.html',
  styleUrl: './game-schedule.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameScheduleComponent implements OnInit, OnDestroy {
  current!: TournamentKey;
  groups: ScheduleGroup[] = [];

  get editionLabel(): string {
    return this.current
      ? `Taça Brasil Amador ${this.current.year} · Divisão ${this.current.division}`
      : '';
  }

  loading = false;
  error = '';

  private sub?: Subscription;

  constructor(
    private api: ApiService,
    private loader: LoaderService,
    private cdr: ChangeDetectorRef,
    private tournaments: TournamentService
  ) {}

  ngOnInit() {
    // Re-fetch whenever the toolbar switches editions.
    this.sub = this.tournaments.current$.subscribe((c) => {
      this.current = c;
      this.fetch();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  fetch() {
    if (!this.current) return;
    this.loading = true;
    this.error = '';
    this.loader.start();

    const q = `year=${this.current.year}&division=${encodeURIComponent(this.current.division)}`;
    forkJoin({
      teams: this.api.get<Team[]>(`teams?${q}`),
      games: this.api.get<Game[]>(`game/schedule?${q}`),
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
    // Source of truth for grouping is team.group (string "1" | "2").
    // The /game/schedule endpoint populates homeTeam/awayTeam with a
    // limited selection that doesn't include `group`, so we look it up
    // from the teams response.
    const teamById = new Map<string, Team>();
    for (const t of teams) {
      teamById.set(t._id, t);
    }

    const groupOf = (teamId: string | undefined): string | undefined => {
      if (!teamId) return undefined;
      return teamById.get(teamId)?.group;
    };

    return GROUP_IDS.map((id) => {
      const groupTeams = teams
        .filter((t) => t.group === id)
        .sort((a, b) => (a.slot ?? '').localeCompare(b.slot ?? ''));

      // Match backend's sort order: round -> field -> date.
      // Backend already returns games in this order; we keep the sort
      // explicit on the client in case a future API caches/proxies it.
      const groupGames = games
        .filter((g) => groupOf(g.homeTeam?._id) === id)
        .sort((a, b) => {
          const ra = a.round ?? Number.MAX_SAFE_INTEGER;
          const rb = b.round ?? Number.MAX_SAFE_INTEGER;
          if (ra !== rb) return ra - rb;
          const fa = a.field ?? '';
          const fb = b.field ?? '';
          if (fa !== fb) return fa.localeCompare(fb);
          const da = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
          const db = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;
          return da - db;
        });

      return {
        id,
        label: `Grupo ${id}`,
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

  /**
   * Number of innings to render in the linescore strip for this game.
   * Uses the longer of homeInnings/awayInnings; falls back to current
   * `inning` for in-progress games when no per-inning data has been
   * recorded yet.
   */
  inningCount(game: Game): number {
    const h = game.homeInnings?.length ?? 0;
    const a = game.awayInnings?.length ?? 0;
    return Math.max(h, a);
  }

  /** Returns runs for an inning (1-indexed), or 0 if not recorded. */
  inningRuns(arr: number[] | undefined, inning: number): number {
    return arr?.[inning - 1] ?? 0;
  }

  hasLinescore(game: Game): boolean {
    return this.inningCount(game) > 0;
  }

  // Used by the template to iterate "1..n" without a pipe.
  inningRange(game: Game): number[] {
    const n = this.inningCount(game);
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  formatGameDate(iso: string | undefined): string {
    if (!iso) return 'A Definir';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'A Definir';
    const day = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day} · ${time}`;
  }

  trackById(_: number, item: { _id: string }): string {
    return item._id;
  }

  trackGroup(_: number, item: ScheduleGroup): string {
    return item.id;
  }
}
