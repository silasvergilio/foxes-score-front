import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  TournamentEdition,
  TournamentKey,
} from '../interfaces/tournament.interface';

const STORAGE_KEY = 'foxes.tournament';
const FALLBACK: TournamentKey = { year: 2026, division: '2' };

/**
 * Tracks the tournament edition (year + division) the user is currently
 * viewing. The toolbar selector writes here; pages subscribe to
 * `current$` and re-fetch on change.
 *
 * Persistence: the last selection is stored in localStorage so reloading
 * the site lands on the same edition. If localStorage is empty (first
 * visit) or contains an edition the backend no longer reports, we fall
 * back to the most-recent edition from /tournaments.
 */
@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly _editions = new BehaviorSubject<TournamentEdition[]>([]);
  private readonly _current = new BehaviorSubject<TournamentKey>(this.loadStored());

  readonly editions$ = this._editions.asObservable();
  readonly current$ = this._current.asObservable();

  constructor(private api: ApiService) {}

  /** Fire-and-forget: pull the editions list and reconcile the current pick. */
  load(): Observable<TournamentEdition[]> {
    return this.api.get<TournamentEdition[]>('tournaments').pipe(
      catchError((err) => {
        console.error('Erro ao carregar edições', err);
        return of([] as TournamentEdition[]);
      }),
      tap((list) => {
        this._editions.next(list ?? []);
        this.reconcile(list ?? []);
      })
    );
  }

  setCurrent(key: TournamentKey) {
    if (
      key.year === this._current.value.year &&
      key.division === this._current.value.division
    ) {
      return;
    }
    this._current.next(key);
    this.persist(key);
  }

  get current(): TournamentKey {
    return this._current.value;
  }

  /**
   * If the stored selection isn't in the editions list, switch to the
   * first one (the API sorts year desc, division desc — so index 0 is
   * the most recent edition).
   */
  private reconcile(list: TournamentEdition[]) {
    if (list.length === 0) return;
    const cur = this._current.value;
    const found = list.find(
      (e) => e.year === cur.year && e.division === cur.division
    );
    if (!found) {
      const next = { year: list[0].year, division: list[0].division };
      this._current.next(next);
      this.persist(next);
    }
  }

  private loadStored(): TournamentKey {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          typeof parsed?.year === 'number' &&
          typeof parsed?.division === 'string'
        ) {
          return { year: parsed.year, division: parsed.division };
        }
      }
    } catch {
      /* localStorage disabled / corrupted — fall through */
    }
    return FALLBACK;
  }

  private persist(key: TournamentKey) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(key));
    } catch {
      /* localStorage disabled — silent */
    }
  }
}
