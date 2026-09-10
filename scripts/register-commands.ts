import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commands } from '../src/commands/index.js';
import { env } from '../src/config/env.js';

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

console.log(`Registering ${commands.length} guild command(s)...`);

await rest.put(
  Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID),
  { body: commands.map((command) => command.toJSON()) }
);

console.log('Guild commands registered successfully.');
