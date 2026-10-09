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
  const res = await api()
  if (res.ok && res.rows) {
    return { ok: true, rows: res.rows, name: res.name ?? 'import' }
  }
  return { ok: false, canceled: res.canceled, error: res.error }
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
  const res = await api({
    csv: opts.csv,
    fileName: safeName,
    sheetName: opts.sheetName ?? 'Sheet1',
    open: opts.openInSheets !== false,
  })
  if (res.ok && res.path) return { ok: true, path: res.path }
  return { ok: false, canceled: res.canceled, error: res.error }
}

export function normalizeExportBase(name: string): string {
  return name.replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'export'
}

function csvEscape(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

/** Build a UTF-8 BOM CSV from headers + rows (shared by all Workbench list exports). */
export function buildCsv(
  headers: string[],
  rows: ReadonlyArray<ReadonlyArray<string | number | boolean | null | undefined>>,
): string {
  const lines = [headers.map((h) => csvEscape(String(h))).join(',')]
  for (const row of rows) {
    lines.push(row.map((c) => csvEscape(c == null ? '' : String(c))).join(','))
  }
  return `\uFEFF${lines.join('\n')}`
}

/** Convenience: build CSV then write/open as .xlsx (or .csv fallback). */
export async function exportTableAsXlsx(opts: {
  fileName: string
  sheetName?: string
  headers: string[]
  rows: ReadonlyArray<ReadonlyArray<string | number | boolean | null | undefined>>
  openInSheets?: boolean
}): Promise<XlsxSaveResult> {
  if (opts.rows.length === 0) return { ok: false, error: 'empty' }
  return exportCsvAsXlsx({
    csv: buildCsv(opts.headers, opts.rows),
    fileName: `${normalizeExportBase(opts.fileName)}.xlsx`,
    sheetName: opts.sheetName ?? 'Sheet1',
    openInSheets: opts.openInSheets,
  })
}
