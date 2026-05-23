import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormatNamePipe } from '../../pipes/formatName.pipe';
import { Team } from '../../interfaces/team.interface';
import { Player } from '../../interfaces/player.interface';
import { ApiService } from '../../services/api.service';
import { LoaderService } from '../../services/loader.service';

const ALL_TEAMS = '__all__';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FormatNamePipe,
  ],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsComponent implements OnInit {
  readonly ALL_TEAMS = ALL_TEAMS;

  teams: Team[] = [];
  players: Player[] = [];
  selectedTeamId: string = ALL_TEAMS;

  loading = false;
  error = '';

  pitchingColumns = ['name', 'team', 'G', 'IP', 'R', 'ERA', 'K', 'H', 'BB'];
  battingColumns  = ['name', 'team', 'G', 'PA', 'AB', 'R', 'H', 'HR', 'RBI', 'AVG', 'BB', 'SO', 'SB'];

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
      players: this.api.get<Player[]>('player'),
    }).subscribe({
      next: ({ teams, players }) => {
        this.teams = (teams ?? []).sort((a, b) =>
          (a.slot ?? a.name).localeCompare(b.slot ?? b.name)
        );
        this.players = players ?? [];
        this.loading = false;
        this.loader.stop();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar estatísticas', err);
        this.error = 'Não foi possível carregar as estatísticas.';
        this.loading = false;
        this.loader.stop();
        this.cdr.markForCheck();
      },
    });
  }

  onTeamChange(teamId: string) {
    this.selectedTeamId = teamId;
    this.cdr.markForCheck();
  }

  /** Players filtered by selected team, with their team object attached for display. */
  get filteredPlayers(): Array<Player & { _team?: Team }> {
    const byId = new Map(this.teams.map((t) => [t._id, t]));
    const list =
      this.selectedTeamId === ALL_TEAMS
        ? this.players
        : this.players.filter((p) => p.team === this.selectedTeamId);
    return list
      .map((p) => ({ ...p, _team: byId.get(p.team) }))
      .sort((a, b) => {
        // Same-team sort by jersey number; cross-team sort by team code then jersey.
        if (this.selectedTeamId === ALL_TEAMS) {
          const ta = a._team?.code ?? '';
          const tb = b._team?.code ?? '';
          if (ta !== tb) return ta.localeCompare(tb);
        }
        return (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999);
      });
  }

  /**
   * Pitching tab.
   * - When a specific team is selected: show the full roster, even players
   *   with all-zero stats. The source iScore PDFs list the whole pitching
   *   staff, so users expect to see everyone — zeros and all.
   * - When "Todos os times" is selected: keep only players with actual
   *   appearances so the table isn't ~100 rows of zeros.
   */
  get pitchers(): Array<Player & { _team?: Team }> {
    if (this.selectedTeamId === ALL_TEAMS) {
      return this.filteredPlayers.filter((p) => (p.pitching?.G ?? 0) > 0);
    }
    return this.filteredPlayers;
  }

  /**
   * Batting tab. Same display rule as pitching:
   * - Specific team selected: show the full roster, including non-batters.
   * - "Todos os times": only players with at least one plate appearance.
   */
  get batters(): Array<Player & { _team?: Team }> {
    if (this.selectedTeamId === ALL_TEAMS) {
      return this.filteredPlayers.filter((p) => (p.batting?.PA ?? 0) > 0);
    }
    return this.filteredPlayers;
  }

  /** ERA gets a single decimal place; null/undefined renders as "—". */
  formatERA(era: number | undefined): string {
    if (era == null) return '—';
    return era.toFixed(2);
  }

  /** IP can be fractional (e.g. 6.2 = 6⅔ innings); show as-is with one decimal. */
  formatIP(ip: number | undefined): string {
    if (ip == null) return '—';
    return Number.isInteger(ip) ? ip.toString() : ip.toFixed(1);
  }

  /** AVG renders as ".320" / "1.000" / "—". Three decimals, no leading zero. */
  formatAVG(avg: number | undefined): string {
    if (avg == null) return '—';
    if (avg >= 1) return avg.toFixed(3);
    return avg.toFixed(3).replace('0.', '.');
  }

  trackById(_: number, p: Player): string {
    return p._id;
  }
}
