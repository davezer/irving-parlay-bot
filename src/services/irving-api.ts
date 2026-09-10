import { env } from '../config/env.js';
import type {
  BotApiResponse,
  IrvingPickResponse,
  PickSubmission
} from '../types/pick.js';

function baseUrl(): string {
  return env.IRVING_API_URL.replace(/\/$/, '');
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(`Irving API returned ${response.status} with an unreadable response.`);
  }
}

function throwApiError(data: { error?: string }, response: Response): never {
  const error = new Error(data.error || `Irving API returned ${response.status}.`);
  Object.assign(error, { apiResponse: data, status: response.status });
  throw error;
}

export async function submitPickToIrving(pick: PickSubmission): Promise<IrvingPickResponse> {
  if (!env.IRVING_API_ENABLED) {
    return {
      success: true,
      pick: {},
      progress: undefined
    };
  }

  const response = await fetch(`${baseUrl()}/api/parlay/picks`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-irving-bot-secret': env.IRVING_BOT_SECRET
    },
    body: JSON.stringify(pick),
    signal: AbortSignal.timeout(10_000)
  });

  const data = await parseJson<IrvingPickResponse>(response);

  if (!response.ok || !data.success) {
    throwApiError(data, response);
  }

  return data;
}

export async function queryIrving(
  action: string,
  params: Record<string, string | number | undefined> = {}
): Promise<BotApiResponse> {
  if (!env.IRVING_API_ENABLED) {
    throw new Error('The Irving API is disabled. This command is unavailable in test mode.');
  }

  const url = new URL(`${baseUrl()}/api/parlay/picks`);
  url.searchParams.set('action', action);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-irving-bot-secret': env.IRVING_BOT_SECRET
    },
    signal: AbortSignal.timeout(10_000)
  });

  const data = await parseJson<BotApiResponse>(response);

  if (!response.ok || !data.success) {
    throwApiError(data, response);
  }

  return data;
}


export async function linkDiscordMessageToIrving(
  pickId: number | string,
  discordMessageId: string
): Promise<void> {
  if (!env.IRVING_API_ENABLED) return;

  const response = await fetch(`${baseUrl()}/api/parlay/picks`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      'x-irving-bot-secret': env.IRVING_BOT_SECRET
    },
    body: JSON.stringify({
      action: 'link-message',
      pickId,
      discordMessageId
    }),
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) {
    let message = `Irving API returned ${response.status} while linking the Discord message.`;

    try {
      const data = await response.json() as { error?: string };
      if (data.error) message = data.error;
    } catch {}

    throw new Error(message);
  }
}
