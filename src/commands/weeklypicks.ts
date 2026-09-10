import { SlashCommandBuilder } from 'discord.js';

export const weeklyPicksCommand = new SlashCommandBuilder()
  .setName('weeklypicks')
  .setDescription('Show every Irving parlay pick submitted for the current week.');
