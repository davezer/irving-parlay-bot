# Production cutover

1. Test locally first.
2. Irving production: run remote migrations 0032 and 0033 if they are not already applied.
3. Add Cloudflare server-side secrets:
   IRVING_BOT_SECRET
   DISCORD_BOT_TOKEN
   DISCORD_PARLAY_CHANNEL_ID
4. Deploy Irving.
5. In production Parlay Control Room, import the 352 historical rows.
6. Verify 352/352 and link all managers.
7. Set bot IRVING_API_URL=https://irvingleague.club and IRVING_API_ENABLED=true.
8. Deploy bot to Railway.
9. Submit a fresh test pick.
10. Edit that pick in Irving and verify the original Discord post updates.
11. Grade it and verify Discord updates again.
12. Test /replacepick.
13. Test week rollover.

Keep the Google Sheet as a backup until production D1 is verified. The public board already prefers D1 after a successful archive import, so the final Google-code deletion can safely be a separate cleanup commit.
