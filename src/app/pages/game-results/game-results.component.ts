import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class GameResultsComponent implements OnInit {
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

  /** One game per field — the next/current game on that field. */
  featured: Game[] = [];

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

    this.api
      .get<Game[]>(
        `game/schedule?tournament=${encodeURIComponent(this.tournament)}`
      )
      .subscribe({
        next: (games) => {
          this.featured = this.pickFirstPerField(games ?? []);
          this.loading = false;
          this.loader.stop();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Erro ao carregar jogos', err);
          this.error = 'Não foi possível carregar os jogos.';
          this.loading = false;
          this.loader.stop();
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Group games by `field`, pick the first per field by round.
   * Backend already sorts by { round, field, date }, so the first
   * occurrence of each field is the earliest scheduled game there.
   */
  private pickFirstPerField(games: Game[]): Game[] {
    const seen = new Map<string, Game>();
    for (const g of games) {
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
