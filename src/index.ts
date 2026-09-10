import { Client, Events, GatewayIntentBits } from 'discord.js';
import { env } from './config/env.js';
import { handlePickModal, handlePickSelect, startPick } from './interactions/pick-flow.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Irving Parlay Bot logged in as ${readyClient.user.tag}`);
  console.log(`Irving API mode: ${env.IRVING_API_ENABLED ? 'ENABLED' : 'TEST MODE'}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'pick') {
        await startPick(interaction);
      }
      return;
    }

    if (interaction.isStringSelectMenu()) {
      await handlePickSelect(interaction);
      return;
    }

    if (interaction.isModalSubmit()) {
      await handlePickModal(interaction);
    }
  } catch (error) {
    console.error('Interaction error:', error);

    if (!interaction.isRepliable()) return;

    const message = '❌ Something went wrong while handling that pick. Check the bot logs.';

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: message, ephemeral: true }).catch(() => undefined);
    } else {
      await interaction.reply({ content: message, ephemeral: true }).catch(() => undefined);
    }
  }
});

process.on('unhandledRejection', (error) => console.error('Unhandled rejection:', error));
process.on('uncaughtException', (error) => console.error('Uncaught exception:', error));

await client.login(env.DISCORD_TOKEN);
