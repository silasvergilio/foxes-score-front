export interface BalLGame {
    id: string;
    awayTeam: String;
    homeTeam: String;
    awayScore : number;
    homeScore : number;
    firstBaseRunner :  Boolean;
    secondBaseRunner : Boolean;
    thirdBaseRunner : Boolean;
    balls : number;
    strikes : number;
    outs : number;
    inning :number;
    inningHalf : string;
}