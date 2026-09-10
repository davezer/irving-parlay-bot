import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
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
import { submitPickToIrving } from '../services/irving-api.js';
import type { PickSubmission } from '../types/pick.js';
import { buildPickEmbed } from '../utils/embed.js';
import { buildCustomId, parseCustomId } from '../utils/custom-id.js';
import { cleanText, normalizeLine, normalizeOdds } from '../utils/validation.js';

function sportRow(userId: string) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(buildCustomId('pick', 'sport', userId))
    .setPlaceholder('Choose a sport')
    .addOptions(
      SPORTS.map(([label, value, emoji]) => ({
        label,
        value,
        emoji
      }))
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

function betTypeRow(userId: string, sport: string) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(buildCustomId('pick', 'type', userId, sport))
    .setPlaceholder('Choose the type of bet')
    .addOptions(
      BET_TYPES.map(([label, value, description]) => ({
        label,
        value,
        description
      }))
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

function directionRow(userId: string, sport: string, betType: string) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(buildCustomId('pick', 'direction', userId, sport, betType))
    .setPlaceholder('Choose Over or Under')
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

function buildPickModal(userId: string, sport: string, betType: string, direction: string | null) {
  const modal = new ModalBuilder()
    .setCustomId(buildCustomId('pick', 'modal', userId, sport, betType, direction ?? 'none'))
    .setTitle('Submit Your Parlay Pick');

  const rows: ActionRowBuilder<TextInputBuilder>[] = [];
  const add = (input: TextInputBuilder) => rows.push(new ActionRowBuilder<TextInputBuilder>().addComponents(input));

  if (betType === 'player_prop') {
    add(textInput('subject', 'Player', 'Malik Nabers'));
    add(textInput('market', 'Market', 'Receiving Yards'));
    add(textInput('line', 'Line', '74.5'));
    add(textInput('odds', 'Odds', '-110'));
    add(textInput('notes', 'Notes (optional)', 'Anything the commissioner should know', false, TextInputStyle.Paragraph, 300));
  } else if (betType === 'spread') {
    add(textInput('subject', 'Team', 'New York Giants'));
    add(textInput('line', 'Spread', '+3.5'));
    add(textInput('odds', 'Odds', '-110'));
    add(textInput('notes', 'Notes (optional)', 'Anything the commissioner should know', false, TextInputStyle.Paragraph, 300));
  } else if (betType === 'moneyline') {
    add(textInput('subject', 'Team', 'New York Giants'));
    add(textInput('odds', 'Odds', '+135'));
    add(textInput('notes', 'Notes (optional)', 'Anything the commissioner should know', false, TextInputStyle.Paragraph, 300));
  } else if (betType === 'game_total') {
    add(textInput('subject', 'Game / Matchup', 'Giants @ Cowboys'));
    add(textInput('line', 'Total', '47.5'));
    add(textInput('odds', 'Odds', '-110'));
    add(textInput('notes', 'Notes (optional)', 'Anything the commissioner should know', false, TextInputStyle.Paragraph, 300));
  } else if (betType === 'team_total') {
    add(textInput('subject', 'Team', 'New York Giants'));
    add(textInput('line', 'Team Total', '23.5'));
    add(textInput('odds', 'Odds', '-105'));
    add(textInput('notes', 'Notes (optional)', 'Anything the commissioner should know', false, TextInputStyle.Paragraph, 300));
  } else if (betType === 'anytime_td') {
    add(textInput('subject', 'Player', 'Malik Nabers'));
    add(textInput('odds', 'Odds', '+160'));
    add(textInput('notes', 'Notes (optional)', 'Anything the commissioner should know', false, TextInputStyle.Paragraph, 300));
  } else {
    add(textInput('subject', 'Player / Team', 'Player or team'));
    add(textInput('market', 'Bet / Market', 'Describe the wager'));
    add(textInput('line', 'Line (optional)', '74.5', false));
    add(textInput('odds', 'Odds', '-110'));
    add(textInput('notes', 'Notes (optional)', 'Anything the commissioner should know', false, TextInputStyle.Paragraph, 300));
  }

  modal.addComponents(...rows);
  return modal;
}

function isOwner(interactionUserId: string, ownerId: string): boolean {
  return interactionUserId === ownerId;
}

export async function startPick(interaction: ChatInputCommandInteraction) {
  if (env.PICK_COMMAND_CHANNEL_ID && interaction.channelId !== env.PICK_COMMAND_CHANNEL_ID) {
    await interaction.reply({
      content: `Use \`/pick\` in <#${env.PICK_COMMAND_CHANNEL_ID}>.`,
      ephemeral: true
    });
    return;
  }

  await interaction.reply({
    content: '**Submit your Irving weekly parlay pick**\n\nFirst, choose the sport:',
    components: [sportRow(interaction.user.id)],
    ephemeral: true
  });
}

export async function handlePickSelect(interaction: StringSelectMenuInteraction) {
  const parts = parseCustomId(interaction.customId);
  if (parts[0] !== 'pick') return false;

  const stage = parts[1];
  const ownerId = parts[2];
  if (!stage || !ownerId) return false;

  if (!isOwner(interaction.user.id, ownerId)) {
    await interaction.reply({ content: 'That pick form belongs to someone else.', ephemeral: true });
    return true;
  }

  if (stage === 'sport') {
    const sport = interaction.values[0];
    if (!sport) return true;

    await interaction.update({
      content: `**${labelForSport(sport)} selected.**\n\nNow choose the bet type:`,
      components: [betTypeRow(ownerId, sport)]
    });
    return true;
  }

  if (stage === 'type') {
    const sport = parts[3];
    const betType = interaction.values[0];
    if (!sport || !betType) return true;

    if (DIRECTION_TYPES.has(betType)) {
      await interaction.update({
        content: `**${labelForSport(sport)} · ${labelForBetType(betType)}**\n\nChoose the side:`,
        components: [directionRow(ownerId, sport, betType)]
      });
    } else {
      await interaction.showModal(buildPickModal(ownerId, sport, betType, null));
    }
    return true;
  }

  if (stage === 'direction') {
    const sport = parts[3];
    const betType = parts[4];
    const direction = interaction.values[0];
    if (!sport || !betType || !direction) return true;

    await interaction.showModal(buildPickModal(ownerId, sport, betType, direction));
    return true;
  }

  return false;
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

export async function handlePickModal(interaction: ModalSubmitInteraction) {
  const parts = parseCustomId(interaction.customId);
  if (parts[0] !== 'pick' || parts[1] !== 'modal') return false;

  const ownerId = parts[2];
  const sport = parts[3];
  const betType = parts[4];
  const directionRaw = parts[5];

  if (!ownerId || !sport || !betType || !directionRaw) return false;

  if (!isOwner(interaction.user.id, ownerId)) {
    await interaction.reply({ content: 'That pick form belongs to someone else.', ephemeral: true });
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
      content: '❌ Odds should look like `-110` or `+150`. Run `/pick` again and fix the odds.',
      ephemeral: true
    });
    return true;
  }

  let line: string | null = null;
  if (rawLine) {
    line = normalizeLine(rawLine);
    if (!line) {
      await interaction.reply({
        content: '❌ The line should be a number such as `74.5`, `+3.5`, or `-1.5`. Run `/pick` again and fix the line.',
        ephemeral: true
      });
      return true;
    }
  }

  const pick: PickSubmission = {
    discordUserId: interaction.user.id,
    discordUsername: interaction.user.username,
    discordDisplayName: interaction.member && 'displayName' in interaction.member
      ? String(interaction.member.displayName)
      : interaction.user.globalName || interaction.user.username,
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

  await interaction.deferReply({ ephemeral: true });

  let apiResponse;
  try {
    apiResponse = await submitPickToIrving(pick);
  } catch (error) {
    const apiError = error as Error & { apiResponse?: { error?: string; code?: string } };
    const message = apiError.apiResponse?.error || apiError.message;
    await interaction.editReply(`❌ **Pick not submitted.**\n${message}`);
    return true;
  }

  const channel = await interaction.client.channels.fetch(env.PARLAY_CHANNEL_ID);
  if (!channel?.isTextBased() || !('send' in channel)) {
    await interaction.editReply('❌ The configured PARLAY_CHANNEL_ID is not a writable text channel.');
    return true;
  }

  const sent = await channel.send({ embeds: [buildPickEmbed(pick, apiResponse)] });

  const modeNote = env.IRVING_API_ENABLED
    ? 'Saved to Irving and posted to the parlay channel.'
    : 'Posted in **TEST MODE**. Irving API saving is currently disabled.';

  await interaction.editReply(
    `✅ **Pick submitted.** ${modeNote}\n${sent.url}`
  );

  return true;
}
