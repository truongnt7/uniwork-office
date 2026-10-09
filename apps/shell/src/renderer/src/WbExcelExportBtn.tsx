import { useState } from 'react'
import type { ReactElement } from 'react'
import { exportCsvFile } from './workbench-list-excel'

/** Shared “Xuất Excel” control for Workbench list panes. */
export function WbExcelExportBtn({
  vi,
  disabled,
  csv,
  fileName,
  sheetName,
}: {
  vi: boolean
  disabled?: boolean
  csv: string
  fileName: string
  sheetName: string
}): ReactElement {
  const [busy, setBusy] = useState(false)
  const label = (a: string, b: string) => (vi ? a : b)
  return (
    <button
      type="button"
      className="btn btn-secondary"
      disabled={disabled || busy}
      title={label('Xuất danh sách ra Excel (.xlsx)', 'Export list to Excel (.xlsx)')}
      onClick={() => {
        setBusy(true)
        void exportCsvFile(csv, fileName, sheetName).finally(() => setBusy(false))
      }}
    >
      {busy ? label('Đang xuất…', 'Exporting…') : label('Xuất Excel', 'Export Excel')}
    </button>
  )
}
