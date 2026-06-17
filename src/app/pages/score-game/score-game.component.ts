import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, interval, Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Game, LineupEntry, LineupPosition } from '../../interfaces/game.interface';
import { Player } from '../../interfaces/player.interface';
import { ApiService } from '../../services/api.service';

type Side = 'home' | 'away';

/**
 * Resolved batter — a LineupEntry joined with its Player document so the
 * template can render jersey, name, and position without further lookups.
 */
interface ResolvedBatter {
  battingOrder: number;
  position?: LineupPosition;
  jerseyNumber?: number;
  displayName: string;
}

/**
 * Live scoring screen — fullscreen takeover (no global toolbar/drawer).
 *
 * v1 SCOPE: visual shell + read-only game state. Action buttons (BALL,
 * STRIKE, FOUL, OUT, IN PLAY, UNDO, REDO) are wired to no-op handlers
 * so the layout is clickable and reviewable. The real scoring state
 * machine + PUT /game wiring comes in the next iteration.
 *
 * Modeled after the iScore Baseball mobile scoring screen the user
 * shared as reference; expected to grow toward feature parity.
 */
@Component({
  selector: 'app-score-game',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './score-game.component.html',
  styleUrl: './score-game.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoreGameComponent implements OnInit, OnDestroy {
  game: Game | null = null;
  loading = false;
  error = '';

  /** Linescore columns: at least 9 innings; extras as needed. */
  innings: number[] = Array.from({ length: 9 }, (_, i) => i + 1);

  /**
   * Rosters for each side, used to resolve LineupEntry.player IDs into
   * jersey + name for the batter card. Fetched once after the game loads.
   */
  private homeRoster: Player[] = [];
  private awayRoster: Player[] = [];

  /** Currently-batting player and the on-deck batter, derived from the
   *  batting team's lineup. Null if the lineup isn't set yet. */
  currentBatter: ResolvedBatter | null = null;
  onDeckBatter: ResolvedBatter | null = null;

  /**
   * Defensive position → resolved fielder. Populated from the *fielding*
   * team's lineup (opposite of who's batting). Drives the hover tooltip
   * on the position chips over the field SVG.
   */
  private fielderMap = new Map<LineupPosition, ResolvedBatter>();

  /** Elapsed time since the page mounted — placeholder until status='live' starts at the backend. */
  elapsedLabel = '0h 00m';
  private startedAt = Date.now();
  private tickSub?: Subscription;

  /**
   * Batted-ball location counters per defensive position. Placeholder
   * values for v1 so the field isn't blank — real values land with the
   * scoring state machine. Keys match standard position codes so the
   * template can render them in place alongside the position label.
   *
   * `highlight` is the position currently focused (mirrors iScore's
   * "selected zone" — the next pitch will associate with it).
   */
  zoneCounters: Record<string, number> = {
    P: 4, C: 0,
    '1B': 31, '2B': 10, '3B': 8, SS: 40,
    LF: 17, CF: 25, RF: 0,
  };
  highlightedZone: string = 'SS';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('gameId');
    if (!id) {
      this.error = 'Identificador do jogo ausente.';
      return;
    }
    this.fetch(id);

    // Tick the elapsed clock every 30s; cheap and prevents OnPush staleness.
    this.tickSub = interval(30_000).subscribe(() => {
      this.elapsedLabel = this.formatElapsed(Date.now() - this.startedAt);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.tickSub?.unsubscribe();
  }

  fetch(id: string) {
    this.loading = true;
    this.error = '';
    this.api.get<Game>(`game/${id}`).subscribe({
      next: (g) => {
        this.game = g;
        // Grow the linescore if the game ran into extras.
        const maxInnings = Math.max(
          9,
          g.homeInnings?.length ?? 0,
          g.awayInnings?.length ?? 0
        );
        this.innings = Array.from({ length: maxInnings }, (_, i) => i + 1);

        const homeId = g.homeTeam?._id;
        const awayId = g.awayTeam?._id;
        if (!homeId || !awayId) {
          // Bracket placeholder with TBD opponents — nothing to resolve.
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }

        // Roster fetch is non-fatal: scoring screen still renders even if
        // a roster call fails, just without a populated batter card.
        forkJoin({
          home: this.api.get<Player[]>(`teams/${homeId}/players`),
          away: this.api.get<Player[]>(`teams/${awayId}/players`),
        }).subscribe({
          next: ({ home, away }) => {
            this.homeRoster = home ?? [];
            this.awayRoster = away ?? [];
            this.resolveBatters();
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('[score-game] roster fetch failed', err);
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
      },
      error: (err) => {
        console.error('Erro ao carregar jogo', err);
        this.error = 'Não foi possível carregar o jogo.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Pick the currently-batting team's lineup based on inningHalf and
   * resolve the first two starters into displayable batter records.
   *
   * v1: no per-batter cursor yet — we always show the leadoff batter +
   * #2 hitter as on-deck. Once the scoring state machine lands, this
   * will read a `currentBatterIndex` (per side) instead of slot 1.
   */
  private resolveBatters() {
    this.currentBatter = null;
    this.onDeckBatter = null;
    this.fielderMap.clear();
    if (!this.game) return;

    const battingSide: Side = this.game.inningHalf === 'top' ? 'away' : 'home';
    const battingLineup: LineupEntry[] =
      (battingSide === 'home' ? this.game.homeLineup : this.game.awayLineup) ?? [];
    const battingRoster = battingSide === 'home' ? this.homeRoster : this.awayRoster;

    if (battingLineup.length > 0 && battingRoster.length > 0) {
      const byId = new Map(battingRoster.map((p) => [p._id, p]));
      const starters = battingLineup
        .filter((e) => e.isStarter !== false && e.battingOrder != null)
        .sort((a, b) => (a.battingOrder ?? 99) - (b.battingOrder ?? 99));

      this.currentBatter = this.resolveEntry(starters[0], byId);
      this.onDeckBatter = this.resolveEntry(starters[1], byId);
    }

    // Defensive lineup is the OTHER side. Each position chip on the
    // field SVG looks up its player here for the hover tooltip.
    const fieldingSide: Side = battingSide === 'home' ? 'away' : 'home';
    const fieldingLineup: LineupEntry[] =
      (fieldingSide === 'home' ? this.game.homeLineup : this.game.awayLineup) ?? [];
    const fieldingRoster = fieldingSide === 'home' ? this.homeRoster : this.awayRoster;
    if (fieldingLineup.length > 0 && fieldingRoster.length > 0) {
      const byId = new Map(fieldingRoster.map((p) => [p._id, p]));
      for (const entry of fieldingLineup) {
        if (!entry.position) continue;
        const resolved = this.resolveEntry(entry, byId);
        if (resolved) {
          this.fielderMap.set(entry.position, resolved);
        }
      }
    }
  }

  /**
   * Tooltip text for a position chip. Looks up the player in the
   * defensive lineup; returns a friendly fallback when the slot is
   * empty so the hover still feels intentional.
   */
  fielderTooltip(pos: LineupPosition): string {
    const fielder = this.fielderMap.get(pos);
    if (!fielder) return `${pos} · Sem jogador`;
    const num = fielder.jerseyNumber != null ? `#${fielder.jerseyNumber}` : '';
    return `${pos} · ${num} ${fielder.displayName}`.trim();
  }

  private resolveEntry(
    entry: LineupEntry | undefined,
    byId: Map<string, Player>
  ): ResolvedBatter | null {
    if (!entry) return null;
    const id = typeof entry.player === 'string' ? entry.player : entry.player._id;
    const player = byId.get(id);
    if (!player) return null;
    return {
      battingOrder: entry.battingOrder!,
      position: entry.position,
      jerseyNumber: player.jerseyNumber,
      displayName: player.nickname || player.name,
    };
  }

  /** Side currently at bat, for the batter card heading. */
  get battingSide(): Side {
    return this.game?.inningHalf === 'top' ? 'away' : 'home';
  }

  get battingTeamCode(): string {
    return this.battingSide === 'home'
      ? this.game?.homeTeam?.code ?? 'HOME'
      : this.game?.awayTeam?.code ?? 'AWAY';
  }

  /** Cell content for the linescore — empty string for innings not yet played. */
  inningCell(arr: number[] | undefined, n: number): number | string {
    if (!arr || arr.length < n) return '';
    return arr[n - 1];
  }

  /** Total hits proxy: in v1 we don't track hits separately, so sum innings. */
  totalHits(arr: number[] | undefined): number {
    if (!arr) return 0;
    return arr.reduce((sum, v) => sum + (v || 0), 0);
  }

  formatInningHalf(): string {
    if (!this.game) return '';
    const symbol = this.game.inningHalf === 'top' ? '▲' : '▼';
    return `${symbol}${this.game.inning ?? 1}`;
  }

  private formatElapsed(ms: number): string {
    const totalMin = Math.floor(ms / 60_000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }

  /** Returns an array of n dots, k of which are filled. Used for BSO indicators. */
  dots(filled: number, total: number): Array<{ filled: boolean }> {
    return Array.from({ length: total }, (_, i) => ({ filled: i < filled }));
  }

  // ────────── Navigation ──────────
  exit() {
    // Best-effort back nav; falls back to schedule if there's no history.
    if (history.length > 1) {
      history.back();
    } else {
      this.router.navigate(['/game-schedule']);
    }
  }

  // ────────── Action handlers (v1: no-ops with console log) ──────────
  onBall()   { this.todo('BALL'); }
  onStrike() { this.todo('STRIKE'); }
  onFoul()   { this.todo('FOUL'); }
  onOut()    { this.todo('OUT'); }
  onInPlay() { this.todo('IN PLAY'); }
  onUndo()   { this.todo('UNDO'); }
  onRedo()   { this.todo('REDO'); }

  private todo(action: string) {
    console.warn(`[score-game] ${action} clicked — scoring state machine not implemented yet`);
  }
}
