/**
 * Cell text normalization for Vietnamese (and other Latin) diacritics.
 *
 * Excel stores / displays precomposed NFC (e.g. U+1ED1 "ố"). Decomposed NFD
 * (o + ◌̂ + ◌́) makes Chromium's canvas pick a different fallback font for the
 * combining marks → floating tone marks next to the base letter in Sheets.
 */

/** Canonical Unicode form for cell display/measure/save. */
export function normalizeCellText(text: string): string {
  if (!text) return text
  // NFC is idempotent for already-composed text; cheap for ASCII-only too.
  return text.normalize('NFC')
}

/** True when normalizing would change the string (useful in tests / interceptors). */
export function needsCellTextNormalize(text: string): boolean {
  return text.normalize('NFC') !== text
}
