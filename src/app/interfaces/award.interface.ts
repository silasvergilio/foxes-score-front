/**
 * One award category + the winning player + their team.
 * Backend resolves the player name to a real Player document where
 * possible; if a name in awards.json can't be matched, the player
 * field only carries the raw name (no _id).
 */
export interface Award {
  category: string;
  team: {
    _id?: string;
    code: string;
    name: string;
    slot?: string;
    imageFile?: string;
  };
  player: {
    _id?: string;
    name: string;
    jerseyNumber?: number;
    rosterNumber?: number;
  } | null;
}
