import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Game, LineupEntry, LineupPosition } from '../../interfaces/game.interface';
import { Player } from '../../interfaces/player.interface';
import { ApiService } from '../../services/api.service';

type Side = 'home' | 'away';

interface DraftSlot {
  /** Player _id, or '' for empty slot. */
  playerId: string;
  position: LineupPosition | '';
  isStarter: boolean;
}

const ALL_POSITIONS: LineupPosition[] = [
  'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'EH',
];

/** Defensive positions that must be unique per lineup (one per spot). */
const FIELDING_POSITIONS: LineupPosition[] = [
  'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF',
];

const STARTER_COUNT_DEFAULT = 9;

/**
 * Builder for a game's home + away lineup cards.
 *
 * Renders both sides side-by-side (stacks on mobile). For each side:
 * - 9 numbered slots by default; "Adicionar DH" / "EH" bumps to 10 / 11
 * - Each slot picks a player from the team's roster and a position
 * - Save button per side sends PUT /game with {homeLineup}|{awayLineup}
 *
 * Validation is best-effort: duplicates and missing positions are flagged
 * but don't block saving — early data entry is common during a tournament
 * and forcing completeness here would just push users to PUT directly.
 */
@Component({
  selector: 'app-lineup-builder',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './lineup-builder.component.html',
  styleUrl: './lineup-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineupBuilderComponent implements OnInit {
  game: Game | null = null;
  homeRoster: Player[] = [];
  awayRoster: Player[] = [];
  homeDraft: DraftSlot[] = [];
  awayDraft: DraftSlot[] = [];

  loading = false;
  saving: Record<Side, boolean> = { home: false, away: false };
  error = '';

  positions = ALL_POSITIONS;
  /** Render order: visitor first, home second — baseball scoreboard convention. */
  sides: Side[] = ['away', 'home'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('gameId');
    if (!id) {
      this.error = 'Identificador do jogo ausente.';
      return;
    }
    this.fetch(id);
  }

  fetch(id: string) {
    this.loading = true;
    this.error = '';
    this.api.get<Game>(`game/${id}`).subscribe({
      next: (g) => {
        this.game = g;
        // Now load both rosters in parallel.
        const homeId = typeof g.homeTeam === 'object' && g.homeTeam ? g.homeTeam._id : '';
        const awayId = typeof g.awayTeam === 'object' && g.awayTeam ? g.awayTeam._id : '';

        if (!homeId || !awayId) {
          // Bracket placeholder games with TBD opponents — can't build lineups yet.
          this.error = 'Este jogo ainda não tem os dois times definidos.';
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }

        forkJoin({
          home: this.api.get<Player[]>(`teams/${homeId}/players`),
          away: this.api.get<Player[]>(`teams/${awayId}/players`),
        }).subscribe({
          next: ({ home, away }) => {
            this.homeRoster = this.sortRoster(home ?? []);
            this.awayRoster = this.sortRoster(away ?? []);
            this.homeDraft = this.hydrateDraft(g.homeLineup ?? []);
            this.awayDraft = this.hydrateDraft(g.awayLineup ?? []);
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: (err) => this.fail('Não foi possível carregar os elencos.', err),
        });
      },
      error: (err) => this.fail('Não foi possível carregar o jogo.', err),
    });
  }

  private fail(msg: string, err: unknown) {
    console.error('[lineup-builder]', msg, err);
    this.error = msg;
    this.loading = false;
    this.cdr.markForCheck();
  }

  private sortRoster(players: Player[]): Player[] {
    return [...players].sort(
      (a, b) =>
        (a.rosterNumber ?? a.jerseyNumber ?? 999) -
        (b.rosterNumber ?? b.jerseyNumber ?? 999)
    );
  }

  /**
   * Convert an existing LineupEntry[] into N draft slots, padding to 9
   * with empties so the UI always shows the full starting card.
   */
  private hydrateDraft(entries: LineupEntry[]): DraftSlot[] {
    const starters = entries
      .filter((e) => e.isStarter !== false)
      .sort((a, b) => (a.battingOrder ?? 99) - (b.battingOrder ?? 99));

    const slots: DraftSlot[] = starters.map((e) => ({
      playerId: typeof e.player === 'string' ? e.player : e.player._id,
      position: e.position ?? '',
      isStarter: true,
    }));

    while (slots.length < STARTER_COUNT_DEFAULT) {
      slots.push({ playerId: '', position: '', isStarter: true });
    }
    return slots;
  }

  rosterFor(side: Side): Player[] {
    return side === 'home' ? this.homeRoster : this.awayRoster;
  }

  draftFor(side: Side): DraftSlot[] {
    return side === 'home' ? this.homeDraft : this.awayDraft;
  }

  teamName(side: Side): string {
    const t = side === 'home' ? this.game?.homeTeam : this.game?.awayTeam;
    return t?.name || (side === 'home' ? 'Time da casa' : 'Time visitante');
  }

  teamCode(side: Side): string {
    const t = side === 'home' ? this.game?.homeTeam : this.game?.awayTeam;
    return t?.code || side.toUpperCase();
  }

  // ────────── Slot mutations ──────────
  onPickPlayer(side: Side, i: number, playerId: string) {
    this.draftFor(side)[i].playerId = playerId;
    this.cdr.markForCheck();
  }

  onPickPosition(side: Side, i: number, position: LineupPosition | '') {
    this.draftFor(side)[i].position = position;
    this.cdr.markForCheck();
  }

  addExtraSlot(side: Side) {
    if (this.draftFor(side).length >= 11) return;
    this.draftFor(side).push({ playerId: '', position: '', isStarter: true });
    this.cdr.markForCheck();
  }

  removeSlot(side: Side, i: number) {
    if (this.draftFor(side).length <= STARTER_COUNT_DEFAULT) return;
    this.draftFor(side).splice(i, 1);
    this.cdr.markForCheck();
  }

  moveSlot(side: Side, i: number, dir: -1 | 1) {
    const arr = this.draftFor(side);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    this.cdr.markForCheck();
  }

  // ────────── Validation hints (non-blocking) ──────────
  duplicatePlayers(side: Side): Set<string> {
    const counts = new Map<string, number>();
    for (const s of this.draftFor(side)) {
      if (!s.playerId) continue;
      counts.set(s.playerId, (counts.get(s.playerId) ?? 0) + 1);
    }
    const dups = new Set<string>();
    for (const [id, n] of counts) if (n > 1) dups.add(id);
    return dups;
  }

  duplicateFieldingPositions(side: Side): Set<LineupPosition> {
    const counts = new Map<LineupPosition, number>();
    for (const s of this.draftFor(side)) {
      if (!s.position || !FIELDING_POSITIONS.includes(s.position)) continue;
      counts.set(s.position, (counts.get(s.position) ?? 0) + 1);
    }
    const dups = new Set<LineupPosition>();
    for (const [p, n] of counts) if (n > 1) dups.add(p);
    return dups;
  }

  // ────────── Save ──────────
  save(side: Side) {
    if (!this.game) return;

    const entries: LineupEntry[] = this.draftFor(side)
      .filter((s) => !!s.playerId)
      .map((s, i) => ({
        player: s.playerId,
        battingOrder: i + 1,
        position: s.position || undefined,
        isStarter: true,
      }));

    const payload: Record<string, unknown> = {
      _id: this.game._id,
      [`${side}Lineup`]: entries,
    };

    this.saving[side] = true;
    this.cdr.markForCheck();

    this.api.put<{ game: Game }>('game', payload).subscribe({
      next: () => {
        this.saving[side] = false;
        this.snack.open(`Escalação ${this.teamCode(side)} salva.`, 'OK', {
          duration: 2500,
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[lineup-builder] save failed', err);
        this.saving[side] = false;
        this.snack.open(`Falha ao salvar escalação ${this.teamCode(side)}.`, 'OK', {
          duration: 3500,
        });
        this.cdr.markForCheck();
      },
    });
  }

  back() {
    if (history.length > 1) history.back();
    else this.router.navigate(['/game-schedule']);
  }

  /** Track by positional index; slot identity is its order in the lineup. */
  trackByIdx(index: number): number {
    return index;
  }

  trackByPlayer(_: number, p: Player): string {
    return p._id;
  }
}
