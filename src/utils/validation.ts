export function cleanText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeOdds(value: string): string | null {
  const cleaned = value.trim().replace(/\s+/g, '');
  if (/^[+-]\d{2,5}$/.test(cleaned)) return cleaned;
  return null;
}

export function normalizeLine(value: string): string | null {
  const cleaned = value.trim().replace(/\s+/g, '');
  if (!cleaned) return null;
  if (/^[+-]?\d+(\.\d+)?$/.test(cleaned)) return cleaned;
  return null;
}
