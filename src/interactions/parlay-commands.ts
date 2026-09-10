import {
  ChatInputCommandInteraction,
  EmbedBuilder
} from 'discord.js';

import { queryIrving } from '../services/irving-api.js';
import type {
  BotPick,
  HistoryPick,
  MissingManager
} from '../types/pick.js';

const TOTAL_MANAGERS = 14;

function americanOdds(value: number | null | undefined): string {
  if (value == null) return '';
  return value > 0 ? `+${value}` : String(value);
}

function titleCase(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pickText(pick: BotPick, includeBook = true): string {
  const wager: string[] = [];

  if (pick.betType === 'moneyline') {
    wager.push('Moneyline');
  } else if (pick.betType === 'anytime_td') {
    wager.push('Anytime TD');
  } else {
    if (pick.direction) wager.push(pick.direction.toUpperCase());
    if (pick.line != null) wager.push(String(pick.line));

    if (pick.market) {
      wager.push(pick.market);
    } else if (pick.betType) {
      wager.push(titleCase(pick.betType));
    }
  }

  const lines = [
    `**${pick.subject}**`,
    wager.join(' ').trim() || titleCase(pick.betType)
  ];

  const odds = americanOdds(pick.odds);
  if (odds || (includeBook && pick.sportsbook)) {
    lines.push(
      [
        odds ? `\`${odds}\`` : '',
        includeBook ? (pick.sportsbook || 'Hard Rock') : ''
      ].filter(Boolean).join(' · ')
    );
  }

  return lines.join('\n');
}

function resultEmoji(result: string | undefined): string {
  switch (String(result || '').toUpperCase()) {
    case 'WIN': return '✅';
    case 'LOSS': return '❌';
    case 'PUSH': return '➖';
    default: return '⏳';
  }
}

function weekTitle(season?: number, week?: number): string {
  if (!season || !week) return 'Irving Parlay';
  return `${season} · Week ${week}`;
}

async function publicEmbedReply(
  interaction: ChatInputCommandInteraction,
  embed: EmbedBuilder
) {
  await interaction.editReply({ embeds: [embed] });
}

export async function showWeeklyPicks(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const data = await queryIrving('current');
  const picks = data.picks ?? [];
  const week = data.week;
  const submitted = data.progress?.submitted ?? picks.length;
  const total = data.progress?.total ?? TOTAL_MANAGERS;
  const missing = Math.max(total - submitted, 0);

  if (!week) {
    await interaction.editReply('🏈 There is no Irving parlay week available yet.');
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🏈 Irving Week ${week.week} Picks`)
    .setDescription(
      `**${submitted}/${total} submitted**${missing ? ` · ${missing} still on the clock` : ' · Ticket complete'}`
    )
    .setFooter({ text: `${week.season} season · ${week.status.toUpperCase()}` })
    .setTimestamp();

  if (!picks.length) {
    embed.addFields({ name: 'No picks yet', value: 'Nobody has submitted a leg yet.' });
  } else {
    picks.forEach((pick, index) => {
      embed.addFields({
        name: `${String(index + 1).padStart(2, '0')} · ${pick.teamName || pick.managerName} · ${String(pick.sport).toUpperCase()}`,
        value: pickText(pick),
        inline: false
      });
    });
  }

  await publicEmbedReply(interaction, embed);
}

export async function showMyPick(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: 64 });

  const data = await queryIrving('mypick', {
    discordUserId: interaction.user.id
  });

  if (!data.pick || !data.week) {
    await interaction.editReply('You have not submitted a pick for the current Irving parlay week.');
    return;
  }

  const pick = data.pick;

  const embed = new EmbedBuilder()
    .setTitle(`🏈 Your Week ${data.week.week} Pick`)
    .setDescription(pickText(pick))
    .addFields(
      { name: 'Team', value: pick.teamName || pick.managerName, inline: true },
      { name: 'Status', value: String(pick.result || 'PENDING').toUpperCase(), inline: true }
    )
    .setFooter({ text: `${data.week.season} Irving Parlay` });

  await interaction.editReply({ embeds: [embed] });
}

export async function showMissingPicks(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const data = await queryIrving('missing');
  const missing = data.missing ?? [];

  const embed = new EmbedBuilder()
    .setTitle('⏰ Still on the Clock')
    .setDescription(
      missing.length
        ? `**${missing.length} manager${missing.length === 1 ? '' : 's'} still owe a pick.**`
        : '**14/14. The ticket is complete.**'
    );

  if (missing.length) {
    embed.addFields({
      name: 'Missing',
      value: missing
        .map((row, index) =>
          `${index + 1}. **${row.teamName}**${row.discordUserId ? ` · <@${row.discordUserId}>` : ''}`
        )
        .join('\n')
    });
  }

  if (data.week) {
    embed.setFooter({ text: weekTitle(data.week.season, data.week.week) });
  }

  await publicEmbedReply(interaction, embed);
}

export async function showParlayStatus(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const data = await queryIrving('status');

  if (!data.week) {
    await interaction.editReply('There is no Irving parlay week available yet.');
    return;
  }

  const week = data.week;
  const submitted = data.progress?.submitted ?? 0;
  const total = data.progress?.total ?? TOTAL_MANAGERS;
  const missing = data.progress?.missing ?? Math.max(total - submitted, 0);

  const embed = new EmbedBuilder()
    .setTitle(`📊 Irving Parlay Status · Week ${week.week}`)
    .addFields(
      { name: 'Picks In', value: `**${submitted}/${total}**`, inline: true },
      { name: 'Still Missing', value: `**${missing}**`, inline: true },
      { name: 'Status', value: `**${week.status.toUpperCase()}**`, inline: true }
    )
    .setFooter({ text: `${week.season} season` });

  if (week.combinedOdds || week.wagerAmount != null || week.potentialPayout != null) {
    embed.addFields(
      { name: 'Combined Odds', value: week.combinedOdds || '—', inline: true },
      { name: 'Wager', value: week.wagerAmount != null ? `$${Number(week.wagerAmount).toFixed(2)}` : '—', inline: true },
      { name: 'Potential Payout', value: week.potentialPayout != null ? `$${Number(week.potentialPayout).toFixed(2)}` : '—', inline: true }
    );
  }

  await publicEmbedReply(interaction, embed);
}

export async function showDuplicates(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const data = await queryIrving('duplicates');
  const overlaps = data.overlaps ?? [];

  const embed = new EmbedBuilder()
    .setTitle('🔎 Duplicate / Overlap Check');

  if (!overlaps.length) {
    embed.setDescription('✅ No overlapping subjects found on the current ticket.');
  } else {
    embed.setDescription(
      `Found **${overlaps.length} potential overlap${overlaps.length === 1 ? '' : 's'}**. These are worth a commissioner look.`
    );

    overlaps.slice(0, 10).forEach((group) => {
      embed.addFields({
        name: group.subject,
        value: group.picks
          .map((pick) => `**${pick.teamName || pick.managerName}** — ${pickText(pick, false).replace(/\n/g, ' · ')}`)
          .join('\n')
      });
    });
  }

  await publicEmbedReply(interaction, embed);
}

export async function showTicket(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const data = await queryIrving('ticket');
  const picks = data.picks ?? [];
  const week = data.week;

  if (!week) {
    await interaction.editReply('There is no Irving parlay week available yet.');
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🎟️ Hard Rock Build Sheet · Week ${week.week}`)
    .setDescription(
      picks.length
        ? `**${picks.length}/${TOTAL_MANAGERS} legs ready.** Add them to Hard Rock in this order.`
        : 'No legs have been submitted yet.'
    )
    .setFooter({ text: `${week.season} Irving Parlay · ${week.status.toUpperCase()}` });

  picks.forEach((pick, index) => {
    embed.addFields({
      name: `${String(index + 1).padStart(2, '0')} · ${pick.subject}`,
      value: `${pickText(pick)}\n*${pick.teamName || pick.managerName}*`,
      inline: false
    });
  });

  await publicEmbedReply(interaction, embed);
}

function historyLine(row: HistoryPick): string {
  const result = `${resultEmoji(row.result)} ${row.result}`;
  const when = row.week
    ? `${row.season ?? '—'} W${row.week}`
    : (row.date || String(row.season ?? '—'));

  return `**${when}** · ${result}\n${row.bet}`;
}

export async function showPickHistory(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const target = interaction.options.getUser('user') || interaction.user;

  const data = await queryIrving('history', {
    discordUserId: target.id,
    limit: 10
  });

  const history = data.history ?? [];
  const manager = data.manager;

  const embed = new EmbedBuilder()
    .setTitle(`📚 Parlay Pick History · ${manager?.teamName || target.displayName}`);

  if (!history.length) {
    embed.setDescription('No parlay history found for that manager.');
  } else {
    history.forEach((row, index) => {
      embed.addFields({
        name: `${index + 1}. ${row.category || 'Parlay Pick'}`,
        value: historyLine(row)
      });
    });
  }

  await publicEmbedReply(interaction, embed);
}

export async function showRecord(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const target = interaction.options.getUser('user') || interaction.user;

  const data = await queryIrving('record', {
    discordUserId: target.id
  });

  const record = data.record;
  const manager = data.manager;

  if (!record) {
    await interaction.editReply('No record was found for that manager.');
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🏆 Parlay Record · ${manager?.teamName || target.displayName}`)
    .setDescription(
      `**${record.wins}-${record.losses}-${record.pushes}**\n` +
      `${record.hitRate.toFixed(1)}% hit rate`
    )
    .addFields(
      { name: 'Wins', value: String(record.wins), inline: true },
      { name: 'Losses', value: String(record.losses), inline: true },
      { name: 'Pushes', value: String(record.pushes), inline: true },
      { name: 'Pending', value: String(record.pending), inline: true },
      { name: 'Decided', value: String(record.decided), inline: true },
      { name: 'All Picks', value: String(record.total), inline: true }
    );

  await publicEmbedReply(interaction, embed);
}

export async function showWeekResult(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const data = await queryIrving('weekresult');
  const picks = data.picks ?? [];
  const week = data.week;

  if (!week) {
    await interaction.editReply('No graded Irving parlay week exists yet.');
    return;
  }

  const wins = picks.filter((p) => String(p.result).toUpperCase() === 'WIN').length;
  const losses = picks.filter((p) => String(p.result).toUpperCase() === 'LOSS').length;
  const pushes = picks.filter((p) => String(p.result).toUpperCase() === 'PUSH').length;

  const embed = new EmbedBuilder()
    .setTitle(`🏁 Week ${week.week} Parlay Result`)
    .setDescription(`**${wins} wins · ${losses} losses · ${pushes} pushes**`)
    .setFooter({ text: `${week.season} season` });

  picks.forEach((pick, index) => {
    embed.addFields({
      name: `${resultEmoji(pick.result)} ${String(index + 1).padStart(2, '0')} · ${pick.teamName || pick.managerName}`,
      value: pickText(pick)
    });
  });

  await publicEmbedReply(interaction, embed);
}

export async function showRandomManager(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const data = await queryIrving('randommanager');
  const manager = data.missing?.[0];

  if (!manager) {
    await interaction.editReply('🎉 Everybody has submitted. Nobody left to shame.');
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🎲 The Wheel Has Spoken')
    .setDescription(
      `${manager.discordUserId ? `<@${manager.discordUserId}>` : `**${manager.managerName}**`}\n\n` +
      `**${manager.teamName}** is officially on the clock. Get that pick in.`
    );

  await publicEmbedReply(interaction, embed);
}

export async function showRules(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('📜 Irving Weekly Parlay Rules')
    .setDescription(
      [
        '**1. One leg per manager, per week.**',
        '**2. No duplicate wagers.** If somebody already owns that player/team + market + side, pick something else.',
        '**3. Submit with `/pick`.** Irving Bot records the original line and odds.',
        '**4. Line moved? No panic.** The commissioner can update the current Hard Rock line while preserving what you originally submitted.',
        '**5. Once the week is locked, picks are locked.** Changes after that are commissioner-only.',
        '**6. Hard Rock is the final ticket.** The website records the actual line/odds used when the 14-leg slip is built.',
        '**7. Results are graded WIN / LOSS / PUSH.**'
      ].join('\n\n')
    )
    .setFooter({ text: 'Fourteen managers. Fourteen legs. Zero chaos.' });

  await interaction.reply({ embeds: [embed] });
}

export async function showLinkStatus(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const data = await queryIrving('linkstatus');
  const links = data.links ?? [];
  const linked = links.filter((row) => row.linked).length;

  const embed = new EmbedBuilder()
    .setTitle('🔗 Discord Link Status')
    .setDescription(`**${linked}/${links.length || TOTAL_MANAGERS} managers linked**`)
    .addFields({
      name: 'Managers',
      value: links.map((row) =>
        `${row.linked ? '✅' : '❌'} **${row.teamName}**${row.discordUserId ? ` · <@${row.discordUserId}>` : ''}`
      ).join('\n') || 'No manager records found.'
    });

  await publicEmbedReply(interaction, embed);
}

export async function showLastWeek(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const data = await queryIrving('lastweek');
  const week = data.previousWeek;
  const picks = data.picks ?? [];

  if (!week) {
    await interaction.editReply('There is no previous week tracked by the new Irving parlay system yet.');
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`⏪ Irving Week ${week.week}`)
    .setDescription(`**${picks.length}/${TOTAL_MANAGERS} picks** · ${week.status.toUpperCase()}`)
    .setFooter({ text: `${week.season} season` });

  picks.forEach((pick, index) => {
    embed.addFields({
      name: `${resultEmoji(pick.result)} ${String(index + 1).padStart(2, '0')} · ${pick.teamName || pick.managerName}`,
      value: pickText(pick)
    });
  });

  await publicEmbedReply(interaction, embed);
}
