import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LoaderService } from '../../services/loader.service';
import {
  CompetitionStats,
  PitchingLeader,
  BattingAvgLeader,
  RbiLeader,
  RunsLeader,
  SbLeader,
  TeamStats,
} from '../../interfaces/competition-stats.interface';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsComponent implements OnInit {
  stats: CompetitionStats | null = null;
  teamNames: string[] = [];
  selectedTeam: string | null = null;

  loading = false;
  error = '';

  pitchingCols         = ['medal', 'name', 'team', 'ip', 'k', 'k_ip', 'h', 'h_ip', 'era'];
  pitchingTeamCols     = ['name', 'ip', 'k', 'k_ip', 'h', 'h_ip', 'era'];
  battingAvgCols       = ['medal', 'name', 'team', 'ab', 'h', 'avg', 'rbi'];
  battingAvgTeamCols   = ['name', 'ab', 'h', 'avg', 'rbi'];
  rbiCols              = ['medal', 'name', 'team', 'rbi'];
  rbiTeamCols          = ['name', 'rbi'];
  runsCols             = ['medal', 'name', 'team', 'r'];
  runsTeamCols         = ['name', 'r'];
  sbCols               = ['medal', 'name', 'team', 'sb', 'r'];
  sbTeamCols           = ['name', 'sb', 'r'];

  constructor(
    private api: ApiService,
    private loader: LoaderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loading = true;
    this.loader.start();
    this.api.get<CompetitionStats>('stats').subscribe({
      next: (data) => {
        this.stats = data;
        this.teamNames = Object.keys(data.byTeam).sort();
        this.loading = false;
        this.loader.stop();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar stats', err);
        this.error = 'Não foi possível carregar as estatísticas.';
        this.loading = false;
        this.loader.stop();
        this.cdr.markForCheck();
      },
    });
  }

  get teamStats(): TeamStats | null {
    if (!this.selectedTeam || !this.stats) return null;
    return this.stats.byTeam[this.selectedTeam] ?? null;
  }

  medal(index: number): string {
    return ['🥇', '🥈', '🥉'][index] ?? '';
  }

  fmt(n: number | null | undefined): string {
    if (n == null) return '—';
    return n.toFixed(2);
  }

  fmtAvg(n: number | null | undefined): string {
    if (n == null) return '—';
    return n.toFixed(3);
  }
}
