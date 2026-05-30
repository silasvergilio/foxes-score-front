import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { LoaderService } from '../../services/loader.service';
import { Game } from '../../interfaces/game.interface';
import { TournamentService } from '../../services/tournament.service';
import { TournamentKey } from '../../interfaces/tournament.interface';

@Component({
  selector: 'app-bracket',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './bracket.component.html',
  styleUrl: './bracket.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BracketComponent implements OnInit, OnDestroy {
  current!: TournamentKey;
  loading = false;
  error = '';

  /** Gold bracket semifinals, sorted by round/field for stable ordering. */
  goldSemis: Game[] = [];
  goldFinal: Game | null = null;
  goldThird: Game | null = null;
  silver: Game | null = null;
  bronze: Game | null = null;

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
      .get<Game[]>(`game/schedule?${q}`)
      .subscribe({
        next: (games) => {
          this.partition(games ?? []);
          this.loading = false;
          this.loader.stop();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Erro ao carregar chaves', err);
          this.error = 'Não foi possível carregar as chaves.';
          this.loading = false;
          this.loader.stop();
          this.cdr.markForCheck();
        },
      });
  }

  private partition(games: Game[]) {
    this.goldSemis = games
      .filter((g) => g.bracket === 'gold' && g.bracketStage === 'semi')
      .sort((a, b) => (a.field ?? '').localeCompare(b.field ?? ''));

    this.goldFinal =
      games.find((g) => g.bracket === 'gold' && g.bracketStage === 'final') ?? null;
    this.goldThird =
      games.find((g) => g.bracket === 'gold' && g.bracketStage === 'third') ?? null;
    this.silver = games.find((g) => g.bracket === 'silver') ?? null;
    this.bronze = games.find((g) => g.bracket === 'bronze') ?? null;
  }

  statusLabel(g: Game | null | undefined): string {
    if (!g) return '';
    switch (g.status) {
      case 'live': return 'Ao Vivo';
      case 'finished': return 'Finalizado';
      default: return 'Agendado';
    }
  }

  /** "WT 11 - 5 MPS" style summary, or "—" when not yet played. */
  scoreLine(g: Game | null | undefined): string {
    if (!g) return '';
    if (g.status === 'scheduled') return 'A jogar';
    return `${g.homeScore} – ${g.awayScore}`;
  }

  trackById(_: number, g: Game): string {
    return g._id;
  }
}
