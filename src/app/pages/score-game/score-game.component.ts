import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, interval, Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Socket } from 'ngx-socket-io';
import { Game, LineupEntry, LineupPosition } from '../../interfaces/game.interface';
import { Player } from '../../interfaces/player.interface';
import { ApiService } from '../../services/api.service';
import { ScoringService, PitchType } from '../../services/scoring.service';
import {
  InPlayPickerComponent,
  InPlaySelection,
} from './in-play-picker/in-play-picker.component';

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
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
    InPlayPickerComponent,
  ],
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
   * team's lineup (opposite of who's batting). Drives the tap-to-toggle
   * popover on the position chips over the field SVG.
   */
  private fielderMap = new Map<LineupPosition, ResolvedBatter>();

  /**
   * Which position chip's popover is currently open. Null = none.
   * Tapping a chip toggles it; tapping anywhere else (host click)
   * dismisses. Designed for touch + mouse parity — no hover needed.
   */
  activePos: LineupPosition | null = null;

  /** Order matches the visual top→bottom of the field SVG. */
  readonly fieldingPositions: LineupPosition[] = [
    'CF', 'LF', 'RF', 'SS', '2B', '3B', '1B', 'P', 'C',
  ];

  /**
   * Whether the discreet nav menu (top-left of the field) is showing.
   * Same tap-outside-to-close pattern as the fielder popover.
   */
  menuOpen = false;

  /**
   * Quick-nav targets — mirrors the global drawer items so the scorer
   * can hop to any main page without exiting first. EXIT is still the
   * "back" action; this is for forward navigation.
   */
  readonly navRoutes: ReadonlyArray<{ path: string; icon: string; label: string }> = [
    { path: '/teams',          icon: 'groups_3',       label: 'Equipes' },
    { path: '/game-schedule',  icon: 'table',          label: 'Tabela de Jogos' },
    { path: '/game-results',   icon: 'sports_baseball', label: 'Jogos e Resultados' },
    { path: '/standings',      icon: 'leaderboard',    label: 'Classificação' },
    { path: '/bracket',        icon: 'military_tech',  label: 'Eliminatórias' },
    { path: '/stats',          icon: 'analytics',      label: 'Estatísticas' },
    { path: '/awards',         icon: 'emoji_events',   label: 'Premiações' },
  ];

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

  /** Mid-flight gating so a double-tap doesn't fire two events. */
  busy = false;

  /** True while the IN PLAY outcome picker is open. */
  pickerOpen = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private scoring: ScoringService,
    private socket: Socket,
    private cdr: ChangeDetectorRef
  ) {}

  /** Live updates from gameUpdate (server broadcasts after every event). */
  private socketSub?: Subscription;

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

    // Server broadcasts the populated game on every event. We accept
    // updates for THIS game only — broadcasts for other games on the
    // same socket connection are ignored.
    this.socketSub = this.socket.fromEvent('gameUpdate').subscribe((g: any) => {
      if (g && g._id === id) {
        this.game = g;
        this.resolveBatters();
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy() {
    this.tickSub?.unsubscribe();
    this.socketSub?.unsubscribe();
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
   * Resolved fielder for a position, or null if the lineup slot is empty.
   * The template uses this to render the popover body.
   */
  fielderFor(pos: LineupPosition): ResolvedBatter | null {
    return this.fielderMap.get(pos) ?? null;
  }

  /**
   * The number shown on the chip itself — the fielder's jersey number,
   * or "—" when the lineup slot is empty. We deliberately do NOT show
   * `zoneCounters[pos]` here: those are placeholder batted-ball counts
   * that won't be real until the scoring state machine lands. Showing
   * a fake count next to a real jersey in the popover made the two
   * numbers look like they should match.
   */
  chipNumber(pos: LineupPosition): string {
    const fielder = this.fielderMap.get(pos);
    return fielder?.jerseyNumber != null ? `#${fielder.jerseyNumber}` : '—';
  }

  /**
   * Tap-to-toggle: tap a chip → its popover opens; tap the same chip
   * again → popover closes; tap a different chip → that one opens.
   * Stops propagation so the host-level click that closes the popover
   * doesn't immediately fire on the same tap.
   */
  togglePos(pos: LineupPosition, ev?: Event) {
    ev?.stopPropagation();
    this.activePos = this.activePos === pos ? null : pos;
    this.cdr.markForCheck();
  }

  /** Close any open popover when tapping anywhere outside a chip. */
  closePos() {
    if (this.activePos !== null) {
      this.activePos = null;
      this.cdr.markForCheck();
    }
  }

  /** Discreet quick-nav menu — same tap-to-toggle UX as the chip popover. */
  toggleMenu(ev?: Event) {
    ev?.stopPropagation();
    this.menuOpen = !this.menuOpen;
    // Closing chip popover when menu opens keeps only one overlay at a time.
    if (this.menuOpen) this.activePos = null;
    this.cdr.markForCheck();
  }

  closeMenu() {
    if (this.menuOpen) {
      this.menuOpen = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Host-level click closes any open overlay (chip popover or menu).
   * The trigger elements stop propagation so they don't immediately
   * close themselves on the same tap that opened them.
   */
  @HostListener('click')
  onHostClick() {
    this.closePos();
    this.closeMenu();
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

  // ────────── Scoring actions (wired to /game/:id/events) ──────────
  //
  // Each handler is a thin call into ScoringService. The server returns
  // the updated populated Game; we replace local state with it (also
  // covered by the gameUpdate socket subscription, but doing it inline
  // makes the UI feel instant rather than waiting for the socket
  // round-trip).

  private get gameId(): string | null {
    return this.game?._id ?? this.route.snapshot.paramMap.get('gameId');
  }

  private dispatch(label: string, op: () => any) {
    const id = this.gameId;
    if (!id) return;
    if (this.busy) return;
    this.busy = true;
    this.cdr.markForCheck();
    op()
      .subscribe?.({
        next: (resp: any) => {
          if (resp?.game) {
            this.game = resp.game;
            this.resolveBatters();
          }
          this.busy = false;
          this.cdr.markForCheck();
        },
        error: (err: unknown) => {
          console.error(`[score-game] ${label} failed`, err);
          this.busy = false;
          this.cdr.markForCheck();
        },
      });
  }

  /** Visible only while status === 'scheduled'. */
  startGame() {
    this.dispatch('start', () => this.scoring.start(this.gameId!));
  }

  /** Visible only while status === 'live'. */
  endGame() {
    if (!confirm('Finalizar o jogo? Não será mais possível marcar jogadas.')) return;
    this.dispatch('end', () => this.scoring.end(this.gameId!));
  }

  private pitch(t: PitchType) {
    if (this.game?.status !== 'live') return;
    this.dispatch(t, () => this.scoring.pitch(this.gameId!, t));
  }

  onBall()   { this.pitch('ball'); }
  onStrike() { this.pitch('strike'); }
  onFoul()   { this.pitch('foul'); }

  onOut() {
    if (this.game?.status !== 'live') return;
    this.dispatch('OUT', () => this.scoring.paResult(this.gameId!, 'OUT'));
  }

  onInPlay() {
    if (this.game?.status !== 'live') return;
    this.pickerOpen = true;
    // Close any chip/menu overlay so the sheet doesn't open over them.
    this.activePos = null;
    this.menuOpen = false;
    this.cdr.markForCheck();
  }

  /** How many runners are currently on base — passed to the picker so
   *  it can suggest a sensible default RBI count. */
  get runnersOn(): number {
    const b = this.game?.bases;
    if (!b) return 0;
    return (b.first ? 1 : 0) + (b.second ? 1 : 0) + (b.third ? 1 : 0);
  }

  onPickerCancel() {
    this.pickerOpen = false;
    this.cdr.markForCheck();
  }

  onPickerConfirm(sel: InPlaySelection) {
    this.pickerOpen = false;
    this.cdr.markForCheck();
    this.dispatch(sel.outcome, () =>
      this.scoring.paResult(this.gameId!, sel.outcome, {
        rbi: sel.rbi,
        earned: sel.earned,
        location: sel.location,
      })
    );
  }

  onUndo() {
    this.dispatch('UNDO', () => this.scoring.undo(this.gameId!));
  }

  onRedo() {
    this.dispatch('REDO', () => this.scoring.redo(this.gameId!));
  }
}
