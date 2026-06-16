import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Game } from '../../interfaces/game.interface';
import { ApiService } from '../../services/api.service';

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
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
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

  /** Elapsed time since the page mounted — placeholder until status='live' starts at the backend. */
  elapsedLabel = '0h 00m';
  private startedAt = Date.now();
  private tickSub?: Subscription;

  /**
   * Pitch-location zone counters. Placeholder values for v1 so the field
   * SVG isn't blank. Real values will come from the scoring state machine.
   * Layout matches the 9 zones on the field roughly (catcher / pitcher /
   * infield / outfield).
   */
  zoneCounters: Record<string, number> = {
    cf: 25, // center field
    lf: 17,
    rf: 0,
    ss: 40, // around pitcher mound — shown highlighted in iScore reference
    p:  4,
    th: 8,  // 3B
    fr: 31, // 1B
    sb: 10, // 2B area / behind mound
    c:  0,  // catcher / behind plate
  };

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
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar jogo', err);
        this.error = 'Não foi possível carregar o jogo.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
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
