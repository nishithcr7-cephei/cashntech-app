import {decryptValue} from './decrypt';

export function normalizeReportSearchTerm(term: string): string {
  return term.toLowerCase().trim();
}

/**
 * Lowercase text for client-side report search.
 * Decrypts encrypted API values so users can search by plain loan account / name.
 */
export function toReportSearchableText(
  value: string | number | undefined | null,
): string {
  if (value == null || value === '') {
    return '';
  }
  const raw = String(value);
  if (raw === '-') {
    return '';
  }
  return decryptValue(raw).toLowerCase().trim();
}

/** Returns true when any field contains the search term (case-insensitive). */
export function matchesReportSearch(
  term: string,
  ...values: Array<string | number | undefined | null>
): boolean {
  const normalized = normalizeReportSearchTerm(term);
  if (!normalized) {
    return true;
  }
  return values.some(v => toReportSearchableText(v).includes(normalized));
}
