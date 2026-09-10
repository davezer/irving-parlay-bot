export type PickDirection = 'over' | 'under' | null;

export interface PickSubmission {
  discordUserId: string;
  discordUsername: string;
  discordDisplayName: string;
  sport: string;
  betType: string;
  direction: PickDirection;
  subject: string;
  market: string | null;
  line: string | null;
  odds: string;
  notes: string | null;
  sportsbook: string;
  replaceExisting?: boolean;
}

export interface IrvingPickResponse {
  success: boolean;
  pick?: {
    id?: number | string;
    season?: number;
    week?: number;
    managerName?: string;
    teamName?: string;
  };
  progress?: {
    submitted?: number;
    total?: number;
  };
  error?: string;
  code?: string;
  existingPick?: unknown;
}

export interface BotPick {
  id: number | string;
  managerId?: string;
  managerName: string;
  teamName: string | null;
  discordUserId?: string | null;
  sport: string;
  subject: string;
  betType: string;
  market: string | null;
  direction: string | null;
  line: number | null;
  odds: number | null;
  sportsbook: string | null;
  result?: string;
  status?: string;
  createdAt?: string | null;
  season?: number;
  week?: number;
}

export interface BotWeek {
  id: number;
  season: number;
  week: number;
  status: string;
  combinedOdds?: string | null;
  wagerAmount?: number | null;
  potentialPayout?: number | null;
}

export interface MissingManager {
  managerId: string;
  managerName: string;
  teamName: string;
  discordUserId: string | null;
}

export interface LinkStatusRow {
  managerId: string;
  managerName: string;
  teamName: string;
  discordUserId: string | null;
  linked: boolean;
}

export interface HistoryPick {
  source: 'new' | 'legacy';
  season: number | null;
  week: number | null;
  date: string | null;
  bet: string;
  category: string | null;
  result: string;
}

export interface BotApiResponse {
  success: boolean;
  action?: string;
  week?: BotWeek | null;
  picks?: BotPick[];
  pick?: BotPick | null;
  previousWeek?: BotWeek | null;
  missing?: MissingManager[];
  links?: LinkStatusRow[];
  overlaps?: {
    subject: string;
    picks: BotPick[];
  }[];
  history?: HistoryPick[];
  record?: {
    wins: number;
    losses: number;
    pushes: number;
    pending: number;
    decided: number;
    hitRate: number;
    total: number;
  };
  manager?: {
    managerId: string;
    managerName: string;
    teamName: string;
    discordUserId: string | null;
  };
  progress?: {
    submitted: number;
    total: number;
    missing: number;
  };
  error?: string;
  code?: string;
}
