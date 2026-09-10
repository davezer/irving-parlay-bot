export const SPORTS = [
  ['NFL', 'nfl', '🏈'],
  ['College Football', 'ncaaf', '🏈']
] as const;

export const BET_TYPES = [
  ['Player Prop', 'player_prop', 'Passing, rushing, receiving, receptions, etc.'],
  ['Spread', 'spread', 'Team point spread'],
  ['Moneyline', 'moneyline', 'Team to win'],
  ['Game Total', 'game_total', 'Full-game over/under'],
  ['Team Total', 'team_total', 'Team scoring over/under'],
  ['Anytime TD', 'anytime_td', 'Anytime touchdown scorer'],
  ['Other', 'other', 'Anything not listed above']
] as const;

export const DIRECTION_TYPES = new Set(['player_prop', 'game_total', 'team_total']);

export type SportValue = (typeof SPORTS)[number][1];
export type BetTypeValue = (typeof BET_TYPES)[number][1];
export type DirectionValue = 'over' | 'under';

export function labelForSport(value: string): string {
  return SPORTS.find((sport) => sport[1] === value)?.[0] ?? value;
}

export function emojiForSport(value: string): string {
  return SPORTS.find((sport) => sport[1] === value)?.[2] ?? '🏈';
}

export function labelForBetType(value: string): string {
  return BET_TYPES.find((type) => type[1] === value)?.[0] ?? value;
}
