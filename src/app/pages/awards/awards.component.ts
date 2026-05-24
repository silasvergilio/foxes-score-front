import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { LoaderService } from '../../services/loader.service';
import { Award } from '../../interfaces/award.interface';

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
export class AwardsComponent implements OnInit {
  awards: Award[] = [];
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
    this.api.get<Award[]>('awards').subscribe({
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
