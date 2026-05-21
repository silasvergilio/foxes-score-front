export interface PitchingLeader {
  Name: string;
  Team?: string;
  IP: number;
  K: number;
  K_per_IP: number;
  H: number;
  H_per_IP: number;
  ERA: number;
  composite: number;
}

export interface BattingAvgLeader {
  Name: string;
  Team?: string;
  AB: number;
  H: number;
  AVG: number;
  RBI: number;
}

export interface RbiLeader {
  Name: string;
  Team?: string;
  RBI: number;
}

export interface RunsLeader {
  Name: string;
  Team?: string;
  R: number;
}

export interface SbLeader {
  Name: string;
  Team?: string;
  SB: number;
  R: number;
}

export interface TeamStats {
  pitching: PitchingLeader[];
  batting_avg: BattingAvgLeader[];
  rbi: RbiLeader[];
  runs: RunsLeader[];
  stolen_bases: SbLeader[];
}

export interface CompetitionStats {
  thresholds: { avg_ip: number; avg_ab: number };
  leaders: {
    pitching: PitchingLeader[];
    batting_avg: BattingAvgLeader[];
    rbi: RbiLeader[];
    runs: RunsLeader[];
    stolen_bases: SbLeader[];
  };
  byTeam: Record<string, TeamStats>;
}
