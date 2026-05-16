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
const MIN_INNING_COLUMNS = 9;

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
  tournament = DEFAULT_TOURNAMENT;

  /**
   * Display-name overrides for the field shown on each card. Backend
   * stores the raw field name (e.g. "Field 2"), but the venue's
   * physical fields are numbered Campo 1 and Campo 3 (Campo 2 doesn't
   * exist on site). Map the backend values to the display labels here.
   */
  private fieldNameMap: Record<string, string> = {
    'Field 1': 'Campo 1',
    'Field 2': 'Campo 3',
    'Campo 2': 'Campo 3',
  };

  /** Up next per field — scheduled or live, earliest round wins. */
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
          this.featured = this.pickNextPerField(games ?? []);
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
   * For each field, pick the next non-finished game (scheduled or live).
   * Backend returns games sorted by { round, field, date }, so first
   * non-finished occurrence per field == next up on that field.
   *
   * When a game transitions to finished, it'll drop off and the next
   * round's game on that field surfaces on the next page load.
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
   * Number of inning columns to render. Always at least 9; grows if a
   * game went to extras and either team has runs recorded past inning 9.
   */
  inningRange(game: Game): number[] {
    const recorded = Math.max(
      game.homeInnings?.length ?? 0,
      game.awayInnings?.length ?? 0
    );
    const total = Math.max(MIN_INNING_COLUMNS, recorded);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  /**
   * One cell per inning column. Returns the recorded run count for that
   * inning, or null when no data has been entered yet (rendered blank).
   */
  inningCells(game: Game, side: 'home' | 'away'): (number | null)[] {
    const arr = side === 'home' ? game.homeInnings : game.awayInnings;
    return this.inningRange(game).map((n) => arr?.[n - 1] ?? null);
  }

  fieldDisplayName(field: string | undefined): string {
    if (!field) return 'A Definir';
    return this.fieldNameMap[field] ?? field;
  }

  broadcastFor(game: Game): string | null {
    return game.broadcastUrl?.trim() || null;
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
