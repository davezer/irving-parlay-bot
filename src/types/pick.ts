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
