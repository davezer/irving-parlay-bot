import { env } from '../config/env.js';
import type { IrvingPickResponse, PickSubmission } from '../types/pick.js';

export async function submitPickToIrving(pick: PickSubmission): Promise<IrvingPickResponse> {
  if (!env.IRVING_API_ENABLED) {
    return {
      success: true,
      pick: {},
      progress: undefined
    };
  }

  const response = await fetch(`${env.IRVING_API_URL.replace(/\/$/, '')}/api/parlay/picks`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-irving-bot-secret': env.IRVING_BOT_SECRET
    },
    body: JSON.stringify(pick),
    signal: AbortSignal.timeout(10_000)
  });

  let data: IrvingPickResponse;

  try {
    data = (await response.json()) as IrvingPickResponse;
  } catch {
    throw new Error(`Irving API returned ${response.status} with an unreadable response.`);
  }

  if (!response.ok || !data.success) {
    const error = new Error(data.error || `Irving API returned ${response.status}.`);
    Object.assign(error, { apiResponse: data, status: response.status });
    throw error;
  }

  return data;
}
