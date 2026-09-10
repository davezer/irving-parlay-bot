# Discord Setup Checklist

Use this if the application exists but the bot is not fully installed/configured in the Irving server yet.

## Developer Portal

Open your Discord application in the Developer Portal.

### Bot

You do not need Message Content Intent for this bot.

Copy/reset the bot token and put it only in your local `.env` as `DISCORD_TOKEN`.

### Installation / OAuth2

For a server/guild install, the app needs the normal bot/application-command installation scopes. Install the bot into the Irving Discord server and grant only the permissions needed for the parlay channel.

Recommended bot permissions:

- View Channels
- Send Messages
- Embed Links
- Read Message History

No Administrator permission is needed.

## Copy IDs

Enable Discord Developer Mode:

`User Settings → Advanced → Developer Mode`

Then copy:

- Server ID → `DISCORD_GUILD_ID`
- Locked parlay channel ID → `PARLAY_CHANNEL_ID`
- Optional command channel ID → `PICK_COMMAND_CHANNEL_ID`

In the Developer Portal:

- Application ID → `DISCORD_CLIENT_ID`
- Bot Token → `DISCORD_TOKEN`

## Lock the parlay channel

For `@everyone`:

- View Channel: Allow
- Send Messages: Deny

For the Irving Parlay bot:

- View Channel: Allow
- Send Messages: Allow
- Embed Links: Allow
- Read Message History: Allow

This is what makes the channel structured: members submit through `/pick`; the bot is the account that publishes the final formatted messages.
