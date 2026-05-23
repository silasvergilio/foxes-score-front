export type Handedness = 'right' | 'left' | 'switch';

/**
 * Tournament-scoped pitching stats embedded on the Player document.
 * Backend defaults every field to 0 for non-pitchers, so check `G > 0`
 * before treating a player as having actual pitching data.
 */
export interface PitchingStats {
  G: number;   // games pitched
  IP: number;  // innings pitched (may be fractional, e.g. 6.2)
  R: number;   // runs allowed
  ERA: number; // earned run average
  K: number;   // strikeouts
  H: number;   // hits allowed
  BB: number;  // walks
}

export interface Player {
  _id: string;
  team: string;
  rosterNumber?: number;
  jerseyNumber: number;
  name: string;
  nickname?: string;
  email?: string;
  birthDate?: string;
  documentId?: string;
  throws?: Handedness;
  bats?: Handedness;
  pitching?: PitchingStats;
}
