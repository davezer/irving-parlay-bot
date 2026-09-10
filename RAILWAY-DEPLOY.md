# Railway deploy

1. Push the bot repo to GitHub.
2. Railway -> New Project -> Deploy from GitHub -> davezer/irving-parlay-bot.
3. Add the bot environment variables in Railway:
   DISCORD_TOKEN
   DISCORD_CLIENT_ID
   DISCORD_GUILD_ID
   PARLAY_CHANNEL_ID
   PICK_COMMAND_CHANNEL_ID
   SPORTSBOOK_NAME=Hard Rock
   IRVING_API_URL=https://irvingleague.club
   IRVING_BOT_SECRET
   IRVING_API_ENABLED=true
4. Railway builds the included Dockerfile and runs npm start.
5. Run npm run register locally whenever slash-command definitions change.
6. Verify Railway logs say the bot logged in and API mode is ENABLED.

After Railway is healthy, your PC can be completely off.
