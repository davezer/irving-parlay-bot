import { EmbedBuilder } from 'discord.js';
import { env } from '../config/env.js';
import { emojiForSport, labelForBetType, labelForSport } from '../config/options.js';
import type { IrvingPickResponse, PickSubmission } from '../types/pick.js';

function selectionText(pick: PickSubmission): string {
  const direction = pick.direction ? pick.direction.toUpperCase() : '';

  switch (pick.betType) {
    case 'moneyline':
      return `${pick.subject} Moneyline`;
    case 'anytime_td':
      return `${pick.subject} Anytime TD`;
    case 'spread':
      return `${pick.subject} ${pick.line ?? ''}`.trim();
    case 'game_total':
    case 'team_total':
    case 'player_prop':
      return `${pick.subject} — ${direction} ${pick.line ?? ''} ${pick.market ?? ''}`
        .replace(/\s+/g, ' ')
        .trim();
    default:
      return `${pick.subject}${pick.market ? ` — ${pick.market}` : ''}${pick.line ? ` ${pick.line}` : ''}`;
  }
}

export function buildPickEmbed(pick: PickSubmission, api: IrvingPickResponse): EmbedBuilder {
  const week = api.pick?.week ? `WEEK ${api.pick.week} ` : '';
  const manager = api.pick?.managerName || pick.discordDisplayName;
  const team = api.pick?.teamName ? ` — ${api.pick.teamName}` : '';

  const embed = new EmbedBuilder()
    .setTitle(`${emojiForSport(pick.sport)} ${week}PARLAY PICK`)
    .setDescription(`**${manager}${team}**\n\n### ${selectionText(pick)}`)
    .addFields(
      { name: 'Sport', value: labelForSport(pick.sport), inline: true },
      { name: 'Bet Type', value: labelForBetType(pick.betType), inline: true },
      { name: 'Odds', value: pick.odds, inline: true },
      { name: 'Sportsbook', value: env.SPORTSBOOK_NAME, inline: true }
    )
    .setFooter({ text: `Submitted by @${pick.discordUsername}` })
    .setTimestamp();

  if (pick.notes) {
    embed.addFields({ name: 'Notes', value: pick.notes.slice(0, 1024), inline: false });
  }

  if (api.progress?.submitted && api.progress?.total) {
    embed.addFields({
      name: 'Weekly Progress',
      value: `**${api.progress.submitted} / ${api.progress.total} picks submitted**`,
      inline: false
    });
  }

  return embed;
}
