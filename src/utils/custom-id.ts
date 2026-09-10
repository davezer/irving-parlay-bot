const SEP = ':';

export function buildCustomId(...parts: string[]): string {
  return parts.join(SEP);
}

export function parseCustomId(customId: string): string[] {
  return customId.split(SEP);
}
