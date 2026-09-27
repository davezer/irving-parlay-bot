import { SlashCommandBuilder } from 'discord.js';

export const pickForCommand = new SlashCommandBuilder()
  .setName('pickfor')
  .setDescription('Submit a weekly parlay pick for another Irving manager.');
