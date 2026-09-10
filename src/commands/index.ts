import { SlashCommandBuilder } from 'discord.js';
import { pickCommand } from './pick.js';

export const weeklyPicksCommand = new SlashCommandBuilder()
  .setName('weeklypicks')
  .setDescription('Show every submitted pick for the current Irving parlay week.');

export const myPickCommand = new SlashCommandBuilder()
  .setName('mypick')
  .setDescription('Show your pick for the current Irving parlay week.');

export const missingPicksCommand = new SlashCommandBuilder()
  .setName('missingpicks')
  .setDescription('Show which Irving managers still owe a pick this week.');

export const parlayStatusCommand = new SlashCommandBuilder()
  .setName('parlaystatus')
  .setDescription('Show the current Irving parlay status and submission progress.');

export const duplicatesCommand = new SlashCommandBuilder()
  .setName('duplicates')
  .setDescription('Check the current ticket for overlapping or duplicate subjects.');

export const ticketCommand = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Show the current parlay as a clean ticket-building checklist.');

export const pickHistoryCommand = new SlashCommandBuilder()
  .setName('pickhistory')
  .setDescription('Show recent Irving parlay picks for a manager.')
  .addUserOption((option) =>
    option
      .setName('user')
      .setDescription('Discord user to look up. Defaults to you.')
      .setRequired(false)
  );

export const recordCommand = new SlashCommandBuilder()
  .setName('record')
  .setDescription('Show an Irving manager’s all-time parlay record.')
  .addUserOption((option) =>
    option
      .setName('user')
      .setDescription('Discord user to look up. Defaults to you.')
      .setRequired(false)
  );

export const weekResultCommand = new SlashCommandBuilder()
  .setName('weekresult')
  .setDescription('Show the most recently graded Irving parlay week.');

export const randomManagerCommand = new SlashCommandBuilder()
  .setName('randommanager')
  .setDescription('Randomly choose somebody who still owes a pick.');

export const rulesCommand = new SlashCommandBuilder()
  .setName('rules')
  .setDescription('Show the Irving weekly parlay rules.');

export const linkStatusCommand = new SlashCommandBuilder()
  .setName('linkstatus')
  .setDescription('Show which Irving managers are linked to Discord.');

export const lastWeekCommand = new SlashCommandBuilder()
  .setName('lastweek')
  .setDescription('Show the previous Irving parlay week tracked by the new system.');

export const replacePickCommand = new SlashCommandBuilder()
  .setName('replacepick')
  .setDescription('Replace your current Irving parlay pick before the week is locked.');

export const commands = [
  pickCommand,
  replacePickCommand,
  weeklyPicksCommand,
  myPickCommand,
  missingPicksCommand,
  parlayStatusCommand,
  duplicatesCommand,
  ticketCommand,
  pickHistoryCommand,
  recordCommand,
  weekResultCommand,
  randomManagerCommand,
  rulesCommand,
  linkStatusCommand,
  lastWeekCommand
];
