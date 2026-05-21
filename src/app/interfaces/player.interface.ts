export type Handedness = 'right' | 'left' | 'switch';

export interface PitchingStats {
  G: number;
  IP: number;
  R: number;
  ERA: number;
  K: number;
  H: number;
  BB: number;
}

export interface Player {
  _id: string;
  team: string;
  rosterNumber?: number;
  jerseyNumber?: number;
  name: string;
  nickname?: string;
  email?: string;
  birthDate?: string;
  documentId?: string;
  throws?: Handedness;
  bats?: Handedness;
  pitching?: PitchingStats;
}
