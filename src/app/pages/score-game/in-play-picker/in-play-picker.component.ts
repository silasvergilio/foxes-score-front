import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PaOutcome } from '../../../services/scoring.service';

/**
 * Bottom-sheet picker shown when the scorer taps IN PLAY (or any
 * non-trivial outcome that needs metadata beyond a single tap).
 *
 * v1 scope:
 *   - Outcome grid (hits, walks, K/HBP, outs, FC/DP/ROE, sacrifices)
 *   - Location chip selector (the 9 defensive positions)
 *   - RBI counter — auto-prefilled from a heuristic on the parent's
 *     known runners-on-base, manually overridable
 *   - Earned toggle (default ON) — when off, the play's runs hit
 *     pitcher.R but not pitcher.ER
 *
 * Emits a `confirm` with the full payload; the parent calls
 * ScoringService.paResult with it.
 */
export interface InPlaySelection {
  outcome: PaOutcome;
  location?: string;
  rbi?: number;
  earned: boolean;
}

interface OutcomeOption {
  code: PaOutcome;
  label: string;
  /** Visual grouping for the grid layout. */
  group: 'hit' | 'walk' | 'out' | 'special' | 'sac';
  hint?: string;
}

const OUTCOMES: OutcomeOption[] = [
  // Hits
  { code: '1B', label: '1B', group: 'hit', hint: 'Single' },
  { code: '2B', label: '2B', group: 'hit', hint: 'Double' },
  { code: '3B', label: '3B', group: 'hit', hint: 'Triple' },
  { code: 'HR', label: 'HR', group: 'hit', hint: 'Home run' },
  // Walks / HBP (BB usually auto-cascades from 4 balls; IBB needs a button)
  { code: 'IBB', label: 'IBB', group: 'walk', hint: 'Intentional walk' },
  { code: 'HBP', label: 'HBP', group: 'walk', hint: 'Hit by pitch' },
  // Outs in play
  { code: 'GO', label: 'GO', group: 'out', hint: 'Ground out' },
  { code: 'FO', label: 'FO', group: 'out', hint: 'Fly out' },
  { code: 'LO', label: 'LO', group: 'out', hint: 'Line out' },
  { code: 'PO', label: 'PO', group: 'out', hint: 'Pop out' },
  // Special
  { code: 'FC',  label: 'FC',  group: 'special', hint: "Fielder's choice" },
  { code: 'DP',  label: 'DP',  group: 'special', hint: 'Double play' },
  { code: 'ROE', label: 'ROE', group: 'special', hint: 'Reach on error' },
  // Sacrifices
  { code: 'SF', label: 'SF', group: 'sac', hint: 'Sacrifice fly' },
  { code: 'SH', label: 'SH', group: 'sac', hint: 'Sacrifice hunt' },
];

const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];

@Component({
  selector: 'app-in-play-picker',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './in-play-picker.component.html',
  styleUrl: './in-play-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InPlayPickerComponent {
  /** How many runners are on base — used to suggest a max RBI value. */
  @Input() runnersOn = 0;

  @Output() confirm = new EventEmitter<InPlaySelection>();
  @Output() cancel = new EventEmitter<void>();

  outcomes = OUTCOMES;
  positions = POSITIONS;

  selected: PaOutcome | null = null;
  location: string | null = null;
  rbi = 0;
  earned = true;

  /** True if the picker is fully filled in enough to submit. */
  get canConfirm(): boolean {
    return this.selected !== null;
  }

  /**
   * Reasonable RBI default per outcome — gives the user a sensible
   * starting point they can bump up/down.
   *   - HR with bases: 1 (batter) + runnersOn
   *   - 1B/2B/3B/SF: 0..runnersOn (default = runnersOn, conservative)
   *   - Walk-style with bases loaded: 1 (forced run)
   *   - ROE/DP: 0 (no RBI credited by default)
   *   - Outs: 0
   */
  private suggestedRBI(o: PaOutcome): number {
    if (o === 'HR') return 1 + this.runnersOn;
    if (o === '1B' || o === '2B' || o === '3B' || o === 'SF' || o === 'SH') {
      return Math.min(this.runnersOn, 4);
    }
    if ((o === 'IBB' || o === 'HBP') && this.runnersOn >= 3) return 1;
    return 0;
  }

  pickOutcome(o: PaOutcome) {
    this.selected = o;
    // Reset earned to default on each outcome change so toggle decisions
    // don't leak across plays.
    this.earned = true;
    this.rbi = this.suggestedRBI(o);
  }

  pickLocation(p: string) {
    this.location = this.location === p ? null : p;
  }

  bumpRBI(delta: number) {
    this.rbi = Math.max(0, Math.min(4, this.rbi + delta));
  }

  toggleEarned() {
    this.earned = !this.earned;
  }

  onConfirm() {
    if (!this.selected) return;
    this.confirm.emit({
      outcome: this.selected,
      location: this.location ?? undefined,
      rbi: this.rbi,
      earned: this.earned,
    });
  }

  onCancel() {
    this.cancel.emit();
  }

  trackByCode(_: number, o: OutcomeOption): string {
    return o.code;
  }

  trackByPos(_: number, p: string): string {
    return p;
  }
}
