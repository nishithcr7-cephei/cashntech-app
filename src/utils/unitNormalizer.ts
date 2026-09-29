import {
  INVOICE_UNIT_CODES,
  INVOICE_UNIT_SYNONYMS,
  INVOICE_UNITS,
  type InvoiceUnit,
} from '@constants/invoiceUnits';

const CODE_TO_UNIT = new Map<string, InvoiceUnit>(
  INVOICE_UNITS.map(unit => [String(INVOICE_UNIT_CODES[unit]), unit]),
);

function toKey(text: unknown): string {
  if (text === null || text === undefined) {
    return '';
  }
  return String(text).toUpperCase().replace(/[.\s]/g, '');
}

export function isValidUnit(text: unknown): text is InvoiceUnit {
  return typeof text === 'string' && (INVOICE_UNITS as string[]).includes(text);
}

/** Typed or OCR text → valid unit (`"Nos."` → `PCS`), or `''` when unknown. */
export function normalizeUnit(text: unknown): InvoiceUnit | '' {
  const key = toKey(text);
  if (!key) {
    return '';
  }
  if (isValidUnit(key)) {
    return key;
  }
  return INVOICE_UNIT_SYNONYMS[key] ?? '';
}

/**
 * For the unit text box on blur: valid unit when recognised, otherwise the
 * trimmed uppercase text so the user still sees what they typed and gets a validation error.
 */
export function tidyUnitInput(text: unknown): string {
  return normalizeUnit(text) || String(text ?? '').trim().toUpperCase();
}

/** Backend value (`"2"`, `2`, `"KG"`, `"kgs"`) → label for display/edit. Unknown values stay visible. */
export function unitCodeToLabel(value: unknown): string {
  const raw = String(value ?? '').trim();
  return CODE_TO_UNIT.get(raw) ?? tidyUnitInput(raw);
}

/** Valid unit → code string sent to the backend, or `null` when the unit is not valid. */
export function unitLabelToCode(text: unknown): string | null {
  const unit = normalizeUnit(text);
  return unit ? String(INVOICE_UNIT_CODES[unit]) : null;
}

export const INVOICE_UNITS_HINT = INVOICE_UNITS.join(', ');
