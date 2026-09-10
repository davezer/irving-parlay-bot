import { SlashCommandBuilder } from 'discord.js';

export const pickCommand = new SlashCommandBuilder()
  .setName('pick')
  .setDescription('Submit your Irving weekly parlay pick.');
