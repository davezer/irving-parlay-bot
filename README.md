# Irving Parlay Bot

Discord submission bot for the Irving Champions League weekly 14-leg Hard Rock parlay.

## What this starter already does

- Registers `/pick` as a guild slash command.
- Runs the pick workflow entirely inside Discord.
- Sport dropdown.
- Bet-type dropdown.
- Over/Under selection when appropriate.
- Dynamic modal fields based on the wager type.
- Validates American odds and numeric lines.
- Posts the finished pick as a clean embed in a locked parlay channel.
- Supports an optional command-only channel.
- Has an Irving API client already wired in.
- Runs in standalone **TEST MODE** until the Irving API endpoint exists.

## Requirements

- Node.js 20+
- A Discord application/bot
- Bot installed in your Irving Discord server

The bot only needs the `Guilds` gateway intent. It does **not** read normal user messages.

## 1. Install

```bash
npm install
```

## 2. Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Fill in:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_id
DISCORD_GUILD_ID=your_server_id
PARLAY_CHANNEL_ID=your_locked_parlay_channel_id
```

Keep this OFF for now:

```env
IRVING_API_ENABLED=false
```

### Getting Discord IDs

Turn on Discord **Settings → Advanced → Developer Mode**.

- Right-click your server → **Copy Server ID** → `DISCORD_GUILD_ID`
- Right-click the parlay channel → **Copy Channel ID** → `PARLAY_CHANNEL_ID`
- Discord Developer Portal → your application → **General Information → Application ID** → `DISCORD_CLIENT_ID`
- Discord Developer Portal → **Bot → Token** → `DISCORD_TOKEN`

Never commit `.env` or expose your bot token.

## 3. Discord installation + channel permissions

See `DISCORD-SETUP.md` for the full checklist if the bot has not been installed into the server yet.

### Channel permissions

Recommended parlay channel permissions:

### @everyone

- View Channel: Allow
- Send Messages: Deny

### Irving Parlay bot

- View Channel: Allow
- Send Messages: Allow
- Embed Links: Allow
- Read Message History: Allow

Members submit using `/pick`; only the bot posts finalized picks into the channel.

## 4. Register `/pick`

```bash
npm run register
```

This starter registers the command directly to `DISCORD_GUILD_ID`, so it should appear quickly during development.

You only need to rerun `npm run register` when slash-command definitions change.

## 5. Start the bot

Development:

```bash
npm run dev
```

Or build + run:

```bash
npm run build
npm start
```

You should see:

```text
Irving Parlay Bot logged in as ...
Irving API mode: TEST MODE
```

Then run:

```text
/pick
```

in Discord.

## Current pick flow

```text
/pick
  ↓
Sport
  ↓
Bet Type
  ↓
Over / Under (when needed)
  ↓
Discord Modal
  ↓
Validation
  ↓
Irving API (when enabled)
  ↓
Post embed to #weekly-parlay
```

Supported wager types:

- Player Prop
- Spread
- Moneyline
- Game Total
- Team Total
- Anytime TD
- Other

## Irving integration

The client is already implemented in:

```text
src/services/irving-api.ts
```

When the Irving endpoint is ready, set:

```env
IRVING_API_ENABLED=true
IRVING_API_URL=https://irvingleague.club
IRVING_BOT_SECRET=your_shared_secret
```

The bot will call:

```http
POST /api/parlay/picks
Content-Type: application/json
x-irving-bot-secret: YOUR_SECRET
```

Payload example:

```json
{
  "discordUserId": "1234567890",
  "discordUsername": "davezer",
  "discordDisplayName": "Dave",
  "sport": "nfl",
  "betType": "player_prop",
  "direction": "over",
  "subject": "Malik Nabers",
  "market": "Receiving Yards",
  "line": "74.5",
  "odds": "-110",
  "notes": null,
  "sportsbook": "Hard Rock"
}
```

Expected minimum success response:

```json
{
  "success": true
}
```

The future Irving endpoint can additionally return:

```json
{
  "success": true,
  "pick": {
    "id": 42,
    "season": 2026,
    "week": 2,
    "managerName": "Dave Oliverio",
    "teamName": "Lehigh Crucible"
  },
  "progress": {
    "submitted": 7,
    "total": 14
  }
}
```

The Discord embed will automatically use those values when present.

For rejected submissions, return a non-2xx response such as:

```json
{
  "success": false,
  "code": "DUPLICATE_PICK",
  "error": "Kevin already submitted this player and market. Choose another leg."
}
```

The bot will show that error privately to the submitting user and will **not** post the pick to the channel.

## Optional `/pick` channel restriction

If you want `/pick` to work only in a specific Discord channel:

```env
PICK_COMMAND_CHANNEL_ID=123456789012345678
```

Leave it blank to allow `/pick` from anywhere in the server while still posting finalized picks only into `PARLAY_CHANNEL_ID`.

## Project structure

```text
src/
  commands/
    index.ts
    pick.ts
  config/
    env.ts
    options.ts
  interactions/
    pick-flow.ts
  services/
    irving-api.ts
  types/
    pick.ts
  utils/
    custom-id.ts
    embed.ts
    validation.ts
  index.ts
scripts/
  register-commands.ts
```

## Next Irving-side milestone

Build the Irving endpoint and D1 storage so the website becomes the source of truth for:

1. Discord-user → Irving-manager mapping
2. Active season/week
3. One active pick per manager per week
4. Duplicate detection
5. Original vs current line/odds
6. Edit / replace / void
7. 14-of-14 progress
8. Weekly lock

Once that endpoint works, change `IRVING_API_ENABLED=false` to `true` and the bot is connected without redesigning the Discord flow.
