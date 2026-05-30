/**
 * A tournament edition uniquely identified by (year, division).
 * Matches GET /tournaments from the backend, which also returns
 * counts and a derived status used to pick the default selection.
 */
export interface TournamentEdition {
  year: number;
  division: string;          // "1" | "2" (string so future "3a" etc. fits)
  tournament: string | null; // display name (e.g. "Taça Brasil Amador 2026")
  teamCount: number;
  gameCount: number;
  finishedCount: number;
  liveCount: number;
  status: 'scheduled' | 'in_progress' | 'live' | 'finished';
}

/** Just the parts that identify which edition the app is currently viewing. */
export interface TournamentKey {
  year: number;
  division: string;
}
