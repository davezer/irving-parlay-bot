import { Client, Events, GatewayIntentBits } from 'discord.js';
import { env } from './config/env.js';
import { handlePickModal, handlePickSelect, startPick } from './interactions/pick-flow.js';
import {
  showDuplicates,
  showLastWeek,
  showLinkStatus,
  showMissingPicks,
  showMyPick,
  showParlayStatus,
  showPickHistory,
  showRandomManager,
  showRecord,
  showRules,
  showTicket,
  showWeekResult,
  showWeeklyPicks
} from './interactions/parlay-commands.js';

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
      switch (interaction.commandName) {
        case 'pick':
          await startPick(interaction, 'pick');
          break;
        case 'replacepick':
          await startPick(interaction, 'replace');
          break;
        case 'weeklypicks':
          await showWeeklyPicks(interaction);
          break;
        case 'mypick':
          await showMyPick(interaction);
          break;
        case 'missingpicks':
          await showMissingPicks(interaction);
          break;
        case 'parlaystatus':
          await showParlayStatus(interaction);
          break;
        case 'duplicates':
          await showDuplicates(interaction);
          break;
        case 'ticket':
          await showTicket(interaction);
          break;
        case 'pickhistory':
          await showPickHistory(interaction);
          break;
        case 'record':
          await showRecord(interaction);
          break;
        case 'weekresult':
          await showWeekResult(interaction);
          break;
        case 'randommanager':
          await showRandomManager(interaction);
          break;
        case 'rules':
          await showRules(interaction);
          break;
        case 'linkstatus':
          await showLinkStatus(interaction);
          break;
        case 'lastweek':
          await showLastWeek(interaction);
          break;
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

    const message =
      error instanceof Error
        ? `❌ ${error.message}`
        : '❌ Something went wrong. Check the bot logs.';

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: message, flags: 64 }).catch(() => undefined);
    } else {
      await interaction.reply({ content: message, flags: 64 }).catch(() => undefined);
    }
  }
});

process.on('unhandledRejection', (error) => console.error('Unhandled rejection:', error));
process.on('uncaughtException', (error) => console.error('Uncaught exception:', error));

await client.login(env.DISCORD_TOKEN);
