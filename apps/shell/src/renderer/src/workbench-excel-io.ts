/**
 * Workbench Excel import/export helpers (renderer).
 * Pick/parse and save/open go through main IPC; CSV download is a local fallback.
 */

export function downloadTextFile(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadCsv(filename: string, csv: string): void {
  downloadTextFile(filename, csv, 'text/csv;charset=utf-8')
}

export type SpreadsheetPickResult =
  | { ok: true; rows: string[][]; name: string }
  | { ok: false; canceled?: boolean; error?: string }

export type XlsxSaveResult =
  | { ok: true; path: string }
  | { ok: false; canceled?: boolean; error?: string }

/** Open system file picker for .xlsx / .csv and return first-sheet rows. */
export async function pickSpreadsheetRows(): Promise<SpreadsheetPickResult> {
  const api = window.aiOffice?.wb?.pickSpreadsheet
  if (!api) {
    return { ok: false, error: 'Excel import is unavailable in this build.' }
  }
  return api()
}

/**
 * Write CSV as .xlsx under the default save folder and optionally open in Sheets.
 * Falls back to downloading .csv when IPC is missing.
 */
export async function exportCsvAsXlsx(opts: {
  csv: string
  fileName: string
  sheetName?: string
  openInSheets?: boolean
}): Promise<XlsxSaveResult> {
  const api = window.aiOffice?.wb?.saveXlsxFromCsv
  if (!api) {
    const base = opts.fileName.replace(/\.xlsx$/i, '') || 'export'
    downloadCsv(`${base}.csv`, opts.csv)
    return { ok: false, error: 'Saved as CSV (Excel bridge unavailable).' }
  }
  const safeName = opts.fileName.toLowerCase().endsWith('.xlsx')
    ? opts.fileName
    : `${opts.fileName.replace(/\.(csv|xlsx)$/i, '')}.xlsx`
  return api({
    csv: opts.csv,
    fileName: safeName,
    sheetName: opts.sheetName ?? 'Sheet1',
    open: opts.openInSheets !== false,
  })
}

export function normalizeExportBase(name: string): string {
  return name.replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'export'
}
