import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api.service';
import { LoaderService } from '../../services/loader.service';
import { TournamentService } from '../../services/tournament.service';
import { TournamentKey } from '../../interfaces/tournament.interface';

interface TeamStanding {
  name: string;
  code: string;
  slot?: string;
  W: number;
  L: number;
  T: number;
  RS: number;
  RA: number;
  diff: number;
  /**
   * Team Quality Balance = (runsScored / inningsBatted) − (runsAgainst / inningsFielded).
   * Always finite for any team that's played at least one inning on each side.
   * `null` only when the team hasn't played yet.
   */
  TQB: number | null;
  gamesPlayed: number;
}

interface GroupStanding {
  id: string;
  label: string;
  teams: TeamStanding[];
}

interface ApiStanding {
  team: { _id: string; name: string; code: string; slot?: string; group?: string };
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  runsScored: number;
  runsAgainst: number;
  runDiff: number;
  inningsBatted: number;
  inningsFielded: number;
  /** Comes through as null when the backend computed Infinity (RA === 0). */
  tqb: number | null;
  winPct: number;
}

interface ApiResponse {
  tournament: string | null;
  groups: { group: string; standings: ApiStanding[] }[];
}

@Component({
  selector: 'app-standings',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './standings.component.html',
  styleUrl: './standings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandingsComponent implements OnInit, OnDestroy {
  current!: TournamentKey;
  groups: GroupStanding[] = [];
  loading = false;
  error = '';

  private sub?: Subscription;

  get editionLabel(): string {
    return this.current
      ? `Taça Brasil Amador ${this.current.year} · Divisão ${this.current.division}`
      : '';
  }

  constructor(
    private api: ApiService,
    private loader: LoaderService,
    private cdr: ChangeDetectorRef,
    private tournaments: TournamentService
  ) {}

  ngOnInit() {
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
    this.api
      .get<ApiResponse>(`standings?${q}`)
      .subscribe({
        next: (resp) => {
          this.groups = this.toGroups(resp);
          this.loading = false;
          this.loader.stop();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Erro ao carregar classificação', err);
          this.error = 'Não foi possível carregar a classificação.';
          this.loading = false;
          this.loader.stop();
          this.cdr.markForCheck();
        },
      });
  }

  private toGroups(resp: ApiResponse | null): GroupStanding[] {
    if (!resp || !Array.isArray(resp.groups)) return [];
    return resp.groups
      .filter((g) => g.group !== '_') // skip the "no group" bucket
      .map((g) => ({
        id: g.group,
        label: `Grupo ${g.group}`,
        teams: g.standings.map((s) => ({
          name: s.team.name,
          code: s.team.code,
          slot: s.team.slot,
          W: s.wins,
          L: s.losses,
          T: s.ties,
          RS: s.runsScored,
          RA: s.runsAgainst,
          diff: s.runDiff,
          TQB: s.tqb,
          gamesPlayed: s.gamesPlayed,
        })),
      }));
  }

  pct(team: TeamStanding): string {
    const total = team.W + team.L + team.T;
    if (total === 0) return '.000';
    const val = (team.W + team.T / 2) / total;
    return val === 1 ? '1.000' : val.toFixed(3).replace('0.', '.');
  }

  gb(leader: TeamStanding, team: TeamStanding): string {
    const diff = (leader.W - team.W + team.L - leader.L) / 2;
    if (diff === 0) return '—';
    return diff % 1 === 0 ? diff.toString() : diff.toFixed(1);
  }

  /**
   * Standings already come sorted from the backend (wins desc, losses asc,
   * runDiff desc, runsScored desc), so we just return the array as-is.
   * Kept for template parity with the previous component.
   */
  sortedTeams(teams: TeamStanding[]): TeamStanding[] {
    return teams;
  }

  /**
   * Returns the tiebreaker rule that placed `team` below the team(s) above it
   * with the same wins/losses record, or null if the team isn't part of a
   * W/L tie. Used to mark rows whose order is decided by a tiebreaker rather
   * than by record alone.
   */
  tiebreakerReason(teams: TeamStanding[], i: number): string | null {
    if (i === 0) return null;
    const team = teams[i];
    const above = teams[i - 1];
    if (above.W !== team.W || above.L !== team.L) return null;
    if ((above.TQB ?? 0) !== (team.TQB ?? 0)) return 'TQB';
    if (above.RS !== team.RS) return 'Runs anotadas';
    return 'Critério adicional';
  }

  /**
   * Signed TQB: "+3.595", "−0.452", "0.000", or "—" for unplayed teams.
   * Backend now always returns a finite number (or null when no games), so
   * the legacy "∞" case is gone.
   */
  formatTQB(team: TeamStanding): string {
    if (team.TQB == null) return '—';
    const v = team.TQB;
    if (v > 0) return `+${v.toFixed(3)}`;
    if (v < 0) return `−${Math.abs(v).toFixed(3)}`;
    return '0.000';
  }

  /**
   * Compact run-differential display: "+6", "−5", "0".
   */
  formatDiff(d: number): string {
    if (d > 0) return `+${d}`;
    if (d < 0) return `−${Math.abs(d)}`;
    return '0';
  }
}
