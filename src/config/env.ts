import 'dotenv/config';
import { z } from 'zod';

const boolFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const schema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_GUILD_ID: z.string().min(1),
  PARLAY_CHANNEL_ID: z.string().min(1),
  PICK_COMMAND_CHANNEL_ID: z.string().optional().default(''),
  IRVING_API_ENABLED: boolFromString,
  IRVING_API_URL: z.string().url().default('https://irvingleague.club'),
  IRVING_BOT_SECRET: z.string().optional().default(''),
  SPORTSBOOK_NAME: z.string().min(1).default('Hard Rock'),
  BOT_TIMEZONE: z.string().min(1).default('America/New_York')
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (parsed.data.IRVING_API_ENABLED && !parsed.data.IRVING_BOT_SECRET) {
  console.error('IRVING_BOT_SECRET is required when IRVING_API_ENABLED=true.');
  process.exit(1);
}

export const env = parsed.data;
