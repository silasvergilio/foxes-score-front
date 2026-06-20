import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Game } from '../interfaces/game.interface';

/**
 * Type-safe wrapper around the backend's per-game scoring endpoints.
 * Keeps the score-game component free of stringy URL construction.
 *
 * Mirrors:
 *   POST  /game/:id/events           (any event type)
 *   POST  /game/:id/events/undo
 *   POST  /game/:id/events/redo
 *   PUT   /game/:id/start
 *   PUT   /game/:id/end
 */

export type PitchType = 'ball' | 'strike' | 'foul';
export type PaOutcome =
  | '1B' | '2B' | '3B' | 'HR'
  | 'BB' | 'IBB' | 'HBP'
  | 'K' | 'Kc'
  | 'OUT' | 'GO' | 'FO' | 'LO' | 'PO'
  | 'FC' | 'DP' | 'ROE'
  | 'SF' | 'SH';

/** Payload extras the picker can pass alongside an outcome. */
export interface PaExtras {
  batter?: string;
  pitcher?: string;
  /** Manual RBI override (default: server-computed from runsScored). */
  rbi?: number;
  /** Manual runsScored override (default: heuristic from current bases). */
  runsScored?: number;
  /** false = runs hit pitcher.R but not pitcher.ER. Defaults to true. */
  earned?: boolean;
  /** Defensive position the ball was hit to — for spray-chart use later. */
  location?: string;
}

export interface EventResponse {
  game: Game;
  events?: unknown[];
}

@Injectable({ providedIn: 'root' })
export class ScoringService {
  constructor(private api: ApiService) {}

  /** Open the game (status → live). Initialises lineup cursors server-side. */
  start(gameId: string): Observable<EventResponse> {
    return this.api.put<EventResponse>(`game/${gameId}/start`, {});
  }

  /** Close the game (status → finished). Read-only afterwards. */
  end(gameId: string): Observable<EventResponse> {
    return this.api.put<EventResponse>(`game/${gameId}/end`, {});
  }

  /** Single pitch. Server cascades to pa_result on 4 balls / 3 strikes. */
  pitch(gameId: string, pitchType: PitchType): Observable<EventResponse> {
    return this.api.post<EventResponse>(`game/${gameId}/events`, {
      type: 'pitch',
      payload: { pitchType },
    });
  }

  /**
   * Direct plate-appearance result. Batter + pitcher default to whoever
   * the server thinks is up — the OUT button uses this with no extra info.
   * The IN-PLAY picker (Phase 3) will pass batter/pitcher/rbi/runsScored
   * explicitly.
   */
  paResult(
    gameId: string,
    outcome: PaOutcome,
    extra: PaExtras = {}
  ): Observable<EventResponse> {
    return this.api.post<EventResponse>(`game/${gameId}/events`, {
      type: 'pa_result',
      payload: { outcome, ...extra },
    });
  }

  undo(gameId: string): Observable<EventResponse> {
    return this.api.post<EventResponse>(`game/${gameId}/events/undo`, {});
  }

  redo(gameId: string): Observable<EventResponse> {
    return this.api.post<EventResponse>(`game/${gameId}/events/redo`, {});
  }
}
