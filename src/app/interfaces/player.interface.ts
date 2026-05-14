export type Handedness = 'right' | 'left';

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
}
