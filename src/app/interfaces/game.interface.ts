import { Batting } from './batting.interface';
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
