export type CoachRole = 'head' | 'assistant';

export interface Coach {
  name: string;
  role: CoachRole;
  phone?: string;
}

export interface Team {
  _id: string;
  name: string;
  code: string;
  group?: string;
  slot?: string;
  imageFile?: string;
  location?: string;
  link?: string;
  email?: string;
  division?: string;
  tournament?: string;
  coaches?: Coach[];
}
