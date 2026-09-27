import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { env } from '../config/env.js';
import {
  BET_TYPES,
  DIRECTION_TYPES,
  SPORTS,
  labelForBetType,
  labelForSport
} from '../config/options.js';
import {
  linkDiscordMessageToIrving,
  queryIrving,
  submitPickToIrving
} from '../services/irving-api.js';
import type { PickSubmission } from '../types/pick.js';
import { buildPickEmbed } from '../utils/embed.js';
import { buildCustomId, parseCustomId } from '../utils/custom-id.js';
import { cleanText, normalizeLine, normalizeOdds } from '../utils/validation.js';

type ManagerChoice = {
  managerId: string;
  managerName: string;
  teamName: string;
};

function hasAdminAccess(
  interaction: ChatInputCommandInteraction | StringSelectMenuInteraction | ModalSubmitInteraction
) {
  return Boolean(
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ||
    interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
  );
}

function managerRow(adminUserId: string, managers: ManagerChoice[]) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(buildCustomId('pickfor', 'manager', adminUserId))
    .setPlaceholder('Choose the Irving manager')
    .addOptions(
      managers.slice(0, 25).map((manager) => ({
        label: manager.teamName.slice(0, 100),
        description: manager.managerName.slice(0, 100),
        value: manager.managerId
      }))
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

function sportRow(adminUserId: string, managerId: string) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(buildCustomId('pickfor', 'sport', adminUserId, managerId))
    .setPlaceholder('NFL or College Football?')
    .addOptions(
      SPORTS.map(([label, value, emoji]) => ({
        label,
        value,
        emoji
      }))
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

function betTypeRow(adminUserId: string, managerId: string, sport: string) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(buildCustomId('pickfor', 'type', adminUserId, managerId, sport))
    .setPlaceholder('Choose the wager type')
    .addOptions(
      BET_TYPES.map(([label, value, description]) => ({
        label,
        value,
        description
      }))
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

function directionRow(
  adminUserId: string,
  managerId: string,
  sport: string,
  betType: string
) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(buildCustomId('pickfor', 'direction', adminUserId, managerId, sport, betType))
    .setPlaceholder('Over or Under?')
    .addOptions(
      { label: 'Over', value: 'over', emoji: '⬆️' },
      { label: 'Under', value: 'under', emoji: '⬇️' }
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

function textInput(
  id: string,
  label: string,
  placeholder: string,
  required = true,
  style: TextInputStyle = TextInputStyle.Short,
  maxLength = 100
) {
  return new TextInputBuilder()
    .setCustomId(id)
    .setLabel(label)
    .setPlaceholder(placeholder)
    .setRequired(required)
    .setStyle(style)
    .setMaxLength(maxLength);
}

function buildAdminPickModal(
  adminUserId: string,
  managerId: string,
  sport: string,
  betType: string,
  direction: string | null
) {
  const modal = new ModalBuilder()
    .setCustomId(buildCustomId('pickfor', 'modal', adminUserId, managerId, sport, betType, direction ?? 'none'))
    .setTitle('Submit Pick For Manager');

  const rows: ActionRowBuilder<TextInputBuilder>[] = [];
  const add = (input: TextInputBuilder) =>
    rows.push(new ActionRowBuilder<TextInputBuilder>().addComponents(input));

  if (betType === 'player_prop') {
    add(textInput('subject', 'Player', 'Malik Nabers'));
    add(textInput('market', 'Market', 'Receiving Yards'));
    add(textInput('line', 'Line', '74.5'));
    add(textInput('odds', 'Odds', '-110'));
    add(textInput('notes', 'Notes (optional)', 'Submitted by commissioner', false, TextInputStyle.Paragraph, 300));
  } else if (betType === 'spread') {
    add(textInput('subject', 'Team', 'New York Giants'));
    add(textInput('line', 'Spread', '+3.5'));
    add(textInput('odds', 'Odds', '-110'));
    add(textInput('notes', 'Notes (optional)', 'Submitted by commissioner', false, TextInputStyle.Paragraph, 300));
  } else if (betType === 'moneyline') {
    add(textInput('subject', 'Team', 'New York Giants'));
    add(textInput('odds', 'Odds', '+135'));
    add(textInput('notes', 'Notes (optional)', 'Submitted by commissioner', false, TextInputStyle.Paragraph, 300));
  } else if (betType === 'game_total') {
    add(textInput('subject', 'Game / Matchup', 'Giants @ Cowboys'));
    add(textInput('line', 'Total', '47.5'));
    add(textInput('odds', 'Odds', '-110'));
    add(textInput('notes', 'Notes (optional)', 'Submitted by commissioner', false, TextInputStyle.Paragraph, 300));
  } else if (betType === 'team_total') {
    add(textInput('subject', 'Team', 'New York Giants'));
    add(textInput('line', 'Team Total', '23.5'));
    add(textInput('odds', 'Odds', '-105'));
    add(textInput('notes', 'Notes (optional)', 'Submitted by commissioner', false, TextInputStyle.Paragraph, 300));
  } else if (betType === 'anytime_td') {
    add(textInput('subject', 'Player', 'Malik Nabers'));
    add(textInput('odds', 'Odds', '+160'));
    add(textInput('notes', 'Notes (optional)', 'Submitted by commissioner', false, TextInputStyle.Paragraph, 300));
  } else {
    add(textInput('subject', 'Player / Team', 'Player or team'));
    add(textInput('market', 'Bet / Market', 'Describe the wager'));
    add(textInput('line', 'Line (optional)', '74.5', false));
    add(textInput('odds', 'Odds', '-110'));
    add(textInput('notes', 'Notes (optional)', 'Submitted by commissioner', false, TextInputStyle.Paragraph, 300));
  }

  modal.addComponents(...rows);
  return modal;
}

function optionalField(interaction: ModalSubmitInteraction, id: string): string | null {
  try {
    const value = interaction.fields.getTextInputValue(id);
    const cleaned = cleanText(value);
    return cleaned || null;
  } catch {
    return null;
  }
}

export async function startPickFor(interaction: ChatInputCommandInteraction) {
  if (!hasAdminAccess(interaction)) {
    await interaction.reply({ content: '❌ `/pickfor` is commissioner/admin only.', flags: 64 });
    return;
  }

  if (env.PICK_COMMAND_CHANNEL_ID && interaction.channelId !== env.PICK_COMMAND_CHANNEL_ID) {
    await interaction.reply({
      content: `Use \`/pickfor\` in <#${env.PICK_COMMAND_CHANNEL_ID}>.`,
      flags: 64
    });
    return;
  }

  // Acknowledge Discord immediately before making the Irving API request.
  // Discord interactions time out if they are not acknowledged within a few seconds.
  await interaction.deferReply({ flags: 64 });

  const data = await queryIrving('missing');
  const missing = data.missing ?? [];

  if (!missing.length) {
    await interaction.editReply({
      content: '✅ Everybody already has a pick in for the current week.',
      components: []
    });
    return;
  }

  await interaction.editReply({
    content: '**Commissioner Pick Entry**\n\nChoose the manager you are submitting for:',
    components: [managerRow(interaction.user.id, missing)]
  });
}

export async function handleAdminPickSelect(interaction: StringSelectMenuInteraction) {
  const parts = parseCustomId(interaction.customId);
  if (parts[0] !== 'pickfor') return false;

  if (!hasAdminAccess(interaction)) {
    await interaction.reply({ content: '❌ Commissioner/admin only.', flags: 64 });
    return true;
  }

  const stage = parts[1];
  const adminUserId = parts[2];
  if (!stage || !adminUserId) return false;

  if (interaction.user.id !== adminUserId) {
    await interaction.reply({
      content: 'That commissioner pick form belongs to someone else.',
      flags: 64
    });
    return true;
  }

  if (stage === 'manager') {
    const managerId = interaction.values[0];
    if (!managerId) return true;

    await interaction.update({
      content: '**Manager selected.**\n\nChoose the football league:',
      components: [sportRow(adminUserId, managerId)]
    });
    return true;
  }

  if (stage === 'sport') {
    const managerId = parts[3];
    const sport = interaction.values[0];
    if (!managerId || !sport) return true;

    await interaction.update({
      content: `**${labelForSport(sport)} selected.**\n\nNow choose the wager type:`,
      components: [betTypeRow(adminUserId, managerId, sport)]
    });
    return true;
  }

  if (stage === 'type') {
    const managerId = parts[3];
    const sport = parts[4];
    const betType = interaction.values[0];
    if (!managerId || !sport || !betType) return true;

    if (DIRECTION_TYPES.has(betType)) {
      await interaction.update({
        content: `**${labelForSport(sport)} · ${labelForBetType(betType)}**\n\nChoose the side:`,
        components: [directionRow(adminUserId, managerId, sport, betType)]
      });
    } else {
      await interaction.showModal(buildAdminPickModal(adminUserId, managerId, sport, betType, null));
    }
    return true;
  }

  if (stage === 'direction') {
    const managerId = parts[3];
    const sport = parts[4];
    const betType = parts[5];
    const direction = interaction.values[0];
    if (!managerId || !sport || !betType || !direction) return true;

    await interaction.showModal(
      buildAdminPickModal(adminUserId, managerId, sport, betType, direction)
    );
    return true;
  }

  return false;
}

export async function handleAdminPickModal(interaction: ModalSubmitInteraction) {
  const parts = parseCustomId(interaction.customId);
  if (parts[0] !== 'pickfor' || parts[1] !== 'modal') return false;

  if (!hasAdminAccess(interaction)) {
    await interaction.reply({ content: '❌ Commissioner/admin only.', flags: 64 });
    return true;
  }

  const adminUserId = parts[2];
  const managerId = parts[3];
  const sport = parts[4];
  const betType = parts[5];
  const directionRaw = parts[6];

  if (!adminUserId || !managerId || !sport || !betType || !directionRaw) return false;

  if (interaction.user.id !== adminUserId) {
    await interaction.reply({
      content: 'That commissioner pick form belongs to someone else.',
      flags: 64
    });
    return true;
  }

  const subject = cleanText(interaction.fields.getTextInputValue('subject'));
  const market = optionalField(interaction, 'market');
  const rawLine = optionalField(interaction, 'line');
  const rawOdds = cleanText(interaction.fields.getTextInputValue('odds'));
  const notes = optionalField(interaction, 'notes');

  const odds = normalizeOdds(rawOdds);
  if (!odds) {
    await interaction.reply({
      content: '❌ Odds should look like `-110` or `+150`. Run `/pickfor` again.',
      flags: 64
    });
    return true;
  }

  let line: string | null = null;
  if (rawLine) {
    line = normalizeLine(rawLine);
    if (!line) {
      await interaction.reply({
        content: '❌ The line should be a number such as `74.5`, `+3.5`, or `-1.5`. Run `/pickfor` again.',
        flags: 64
      });
      return true;
    }
  }

  const pick: PickSubmission = {
    discordUserId: interaction.user.id,
    discordUsername: interaction.user.username,
    discordDisplayName:
      interaction.member && 'displayName' in interaction.member
        ? String(interaction.member.displayName)
        : interaction.user.globalName || interaction.user.username,
    managerIdOverride: managerId,
    sport,
    betType,
    direction: directionRaw === 'over' || directionRaw === 'under' ? directionRaw : null,
    subject,
    market,
    line,
    odds,
    notes,
    sportsbook: env.SPORTSBOOK_NAME
  };

  await interaction.deferReply({ flags: 64 });

  let apiResponse;
  try {
    apiResponse = await submitPickToIrving(pick);
  } catch (error) {
    const apiError = error as Error & { apiResponse?: { error?: string; code?: string } };
    await interaction.editReply(
      `❌ **Pick not submitted.**\n${apiError.apiResponse?.error || apiError.message}`
    );
    return true;
  }

  const channel = await interaction.client.channels.fetch(env.PARLAY_CHANNEL_ID);
  if (!channel?.isTextBased() || !('send' in channel)) {
    await interaction.editReply(
      '❌ The configured PARLAY_CHANNEL_ID is not a writable text channel.'
    );
    return true;
  }

  const sent = await channel.send({ embeds: [buildPickEmbed(pick, apiResponse)] });

  if (env.IRVING_API_ENABLED && apiResponse.pick?.id) {
    try {
      await linkDiscordMessageToIrving(apiResponse.pick.id, sent.id);
    } catch (error) {
      console.error('Unable to link commissioner Discord message to Irving pick:', error);
    }
  }

  await interaction.editReply(
    `✅ **Pick submitted for ${apiResponse.pick?.teamName || apiResponse.pick?.managerName || 'manager'}.**\n${sent.url}`
  );

  return true;
}
