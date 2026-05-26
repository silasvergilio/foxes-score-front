import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { LoaderService } from '../../services/loader.service';
import { Award } from '../../interfaces/award.interface';
import { TournamentService } from '../../services/tournament.service';
import { TournamentKey } from '../../interfaces/tournament.interface';

/**
 * Material icon per award category. Keeps the visual identity consistent
 * with the rest of the app (we already use Material everywhere).
 */
const ICON_BY_CATEGORY: Record<string, string> = {
  'MVP': 'workspace_premium',
  'Rebatedor': 'sports_cricket',
  'Arremessador': 'sports_baseball',
  'Receptor': 'shield',
  'Defensor Interno': 'security',
  'Defensor Externo': 'grass',
  'Rei do HR': 'rocket_launch',
  'Anotador de Corridas': 'trending_up',
  'Empurrador de Corridas': 'group',
  'Roubador de Bases': 'directions_run',
};

@Component({
  selector: 'app-awards',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './awards.component.html',
  styleUrl: './awards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AwardsComponent implements OnInit, OnDestroy {
  awards: Award[] = [];
  loading = false;
  error = '';
  current!: TournamentKey;

  get editionLabel(): string {
    return this.current
      ? `Taça Brasil Amador ${this.current.year} · Divisão ${this.current.division}`
      : '';
  }

  private sub?: Subscription;

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
    this.api.get<Award[]>(`awards?${q}`).subscribe({
      next: (data) => {
        this.awards = data ?? [];
        this.loading = false;
        this.loader.stop();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar premiações', err);
        this.error = 'Não foi possível carregar as premiações.';
        this.loading = false;
        this.loader.stop();
        this.cdr.markForCheck();
      },
    });
  }

  iconFor(category: string): string {
    return ICON_BY_CATEGORY[category] ?? 'emoji_events';
  }

  trackByCategory(_: number, a: Award): string {
    return a.category;
  }
}
