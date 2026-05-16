import { Batting } from './batting.interface';
import { Team } from './team.interface';

export type GameStatus = 'scheduled' | 'live' | 'finished';
export type InningHalf = 'top' | 'bottom';

/**
 * Current Game model matching the redesigned backend schema.
 * homeTeam/awayTeam are populated Team objects (selected fields only:
 * _id, name, code, slot, imageFile, location).
 */
export interface Game {
  _id: string;
  tournament: string;
  date?: string;
  field?: string;
  location?: string;
  round?: number;
  /** Optional link to a live broadcast (YouTube/Twitch/etc). */
  broadcastUrl?: string;
  /** Tournament phase. "group" during groups; "gold"/"silver"/"bronze" after. */
  bracket?: 'group' | 'gold' | 'silver' | 'bronze';
  /** Within a bracket: "semi" / "final" / "third" (third-place match). */
  bracketStage?: 'semi' | 'final' | 'third';
  /** May be null for placeholder bracket games (e.g. Final before semis end). */
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeScore: number;
  awayScore: number;
  /** Runs per inning; index 0 = inning 1. Empty until innings are recorded. */
  homeInnings?: number[];
  awayInnings?: number[];
  status: GameStatus;
  inning?: number;
  inningHalf?: InningHalf;
  outs?: number;
  balls?: number;
  strikes?: number;
  bases?: {
    first: boolean;
    second: boolean;
    third: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * @deprecated Legacy game shape from the previous backend schema.
 * Still referenced by game-card, game-card-adm, game-score, and game-admin
 * components which haven't been migrated to the new schema yet.
 */
export interface BallGame {
  _id: string;
  tournament: string;
  location: string;
  date: string;
  startedTime: string;
  status: boolean;
  startOffense: string;
  startDefense: string;
  startOffenseScore: number;
  startDefenseScore: number;
  firstBaseRunner: boolean;
  secondBaseRunner: boolean;
  thirdBaseRunner: boolean;
  balls: number;
  strikes: number;
  outs: number;
  inning: number;
  inningHalf: boolean;
  batting: Batting[];
  battingOrder: number;
}
