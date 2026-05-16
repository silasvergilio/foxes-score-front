import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { Socket } from 'ngx-socket-io';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormatNamePipe } from '../../pipes/formatName.pipe';
import { Game, GameStatus } from '../../interfaces/game.interface';
import { ApiService } from '../../services/api.service';
import { LoaderService } from '../../services/loader.service';

const DEFAULT_TOURNAMENT = 'Taça Brasil Amador 2026';
const INNINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

@Component({
  selector: 'app-game-results',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FormatNamePipe,
  ],
  templateUrl: './game-results.component.html',
  styleUrl: './game-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameResultsComponent implements OnInit, OnDestroy {
  innings = INNINGS;
  tournament = DEFAULT_TOURNAMENT;

  /**
   * Broadcast URLs keyed by field name. The Transmissão button only
   * renders for a field that has a URL configured here. Set the field's
   * name exactly as it appears on the Game document (game.field).
   */
  broadcastUrls: Record<string, string> = {
    // 'Field 1': 'https://www.youtube.com/...',
    // 'Field 2': 'https://www.twitch.tv/...',
  };

  /** Up next per field — scheduled or live, earliest round wins. */
  featured: Game[] = [];

  loading = false;
  error = '';

  /** Coalesces rapid socket events so we don't refetch on every PUT. */
  private refresh$ = new Subject<void>();
  private subs = new Subscription();

  constructor(
    private api: ApiService,
    private loader: LoaderService,
    private socket: Socket,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Coalesce a burst of updates (e.g. inning advances, status flips)
    // into one refetch per 500ms window.
    this.subs.add(
      this.refresh$.pipe(auditTime(500)).subscribe(() => this.fetch())
    );

    // Backend emits `gameUpdate` whenever PUT /game runs — status flips,
    // score changes, etc. Each emission triggers a refetch via refresh$.
    this.subs.add(
      this.socket.fromEvent('gameUpdate').subscribe(() => {
        this.refresh$.next();
      })
    );

    this.fetch();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.refresh$.complete();
  }

  fetch() {
    // Silent refresh: don't flicker the spinner / loader overlay when a
    // socket event triggers a refetch — keep the existing scoreboards
    // visible until new data arrives.
    const silent = this.featured.length > 0;
    if (!silent) {
      this.loading = true;
      this.loader.start();
    }
    this.error = '';

    this.api
      .get<Game[]>(
        `game/schedule?tournament=${encodeURIComponent(this.tournament)}`
      )
      .subscribe({
        next: (games) => {
          this.featured = this.pickNextPerField(games ?? []);
          this.loading = false;
          if (!silent) this.loader.stop();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Erro ao carregar jogos', err);
          if (!silent) {
            this.error = 'Não foi possível carregar os jogos.';
          }
          this.loading = false;
          if (!silent) this.loader.stop();
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * For each field, pick the next non-finished game (scheduled or live).
   * Backend returns games sorted by { round, field, date }, so first
   * non-finished occurrence per field == next up on that field.
   *
   * When a game transitions finished, it drops out and the next round's
   * game on that field surfaces automatically on the next refetch.
   */
  private pickNextPerField(games: Game[]): Game[] {
    const seen = new Map<string, Game>();
    for (const g of games) {
      if (g.status === 'finished') continue;
      const key = g.field ?? '__nofield__';
      if (!seen.has(key)) {
        seen.set(key, g);
      }
    }
    return Array.from(seen.values()).sort((a, b) =>
      (a.field ?? '').localeCompare(b.field ?? '')
    );
  }

  /**
   * Placeholder inning row: backend only stores totals (homeScore /
   * awayScore), not per-inning runs. We render zeros for innings 1-9
   * so the scoreboard layout stays intact; the real total goes in R.
   */
  inningCells(_total: number): number[] {
    return INNINGS.map(() => 0);
  }

  broadcastFor(field: string | undefined): string | null {
    if (!field) return null;
    return this.broadcastUrls[field] ?? null;
  }

  statusLabel(status: GameStatus | string | undefined): string {
    switch (status) {
      case 'live': return 'Ao Vivo';
      case 'finished': return 'Finalizado';
      case 'scheduled': return 'Agendado';
      default: return 'A Definir';
    }
  }

  trackById(_: number, item: { _id: string }): string {
    return item._id;
  }
}
