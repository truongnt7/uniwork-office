import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import type { PracticeId } from '@uniwork/practice-core'
import {
  ensureGradebook,
  exportGradebookCsv,
  importGradebookFromRows,
  listStudentClasses,
  readGradebooks,
  readStudents,
  writeGradebooks,
  type WbGradebook,
  type WbStudentItem,
} from './workbench-pins'
import {
  exportCsvAsXlsx,
  normalizeExportBase,
  pickSpreadsheetRows,
} from './workbench-excel-io'

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function GradesPane({
  practiceId,
  vi,
}: {
  practiceId: PracticeId
  vi: boolean
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [students, setStudents] = useState<WbStudentItem[]>(() => readStudents(practiceId))
  const [books, setBooks] = useState<WbGradebook[]>(() => readGradebooks(practiceId))
  const classes = useMemo(() => listStudentClasses(students), [students])
  const [className, setClassName] = useState('')
  const [colLabel, setColLabel] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const nextStudents = readStudents(practiceId)
    const nextBooks = readGradebooks(practiceId)
    setStudents(nextStudents)
    setBooks(nextBooks)
    const cls = listStudentClasses(nextStudents)
    setClassName((prev) => (prev && cls.includes(prev) ? prev : (cls[0] ?? '')))
  }, [practiceId])

  useEffect(() => {
    if (!className) return
    setBooks((prev) => {
      if (prev.some((b) => b.className === className)) return prev
      const ensured = ensureGradebook(prev, className)
      writeGradebooks(practiceId, ensured.books)
      return ensured.books
    })
  }, [className, practiceId])

  const updateBook = (classKey: string, fn: (book: WbGradebook) => WbGradebook) => {
    setBooks((prev) => {
      const ensured = ensureGradebook(prev, classKey)
      const mapped = ensured.books.map((b) => (b.className === classKey ? fn(b) : b))
      writeGradebooks(practiceId, mapped)
      return mapped
    })
  }

  const active = useMemo(
    () => books.find((b) => b.className === className) ?? null,
    [books, className],
  )

  const classStudents = useMemo(
    () =>
      students
        .filter((s) => (s.className ?? '') === className)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    [students, className],
  )

  const setScore = (studentId: string, columnId: string, value: string) => {
    if (!className) return
    updateBook(className, (book) => {
      const scores = { ...book.scores }
      const row = { ...(scores[studentId] ?? {}) }
      if (value.trim()) row[columnId] = value.trim()
      else delete row[columnId]
      if (Object.keys(row).length) scores[studentId] = row
      else delete scores[studentId]
      return { ...book, scores }
    })
  }

  const renameColumn = (columnId: string, nextLabel: string) => {
    if (!className) return
    const labelText = nextLabel.trim()
    if (!labelText) return
    updateBook(className, (book) => ({
      ...book,
      columns: book.columns.map((c) => (c.id === columnId ? { ...c, label: labelText } : c)),
    }))
  }

  const addColumn = () => {
    if (!className) return
    updateBook(className, (book) => {
      const lab =
        colLabel.trim() ||
        label(`Cột ${book.columns.length + 1}`, `Col ${book.columns.length + 1}`)
      return { ...book, columns: [...book.columns, { id: newId(), label: lab }] }
    })
    setColLabel('')
  }

  const removeColumn = (columnId: string) => {
    if (!className) return
    updateBook(className, (book) => {
      const scores: WbGradebook['scores'] = {}
      for (const [sid, row] of Object.entries(book.scores)) {
        const next = { ...row }
        delete next[columnId]
        if (Object.keys(next).length) scores[sid] = next
      }
      return {
        ...book,
        columns: book.columns.filter((c) => c.id !== columnId),
        scores,
      }
    })
  }

  const exportExcel = async () => {
    if (!active) return
    setBusy(true)
    setNotice(null)
    try {
      const csv = exportGradebookCsv(active, students)
      const safe = normalizeExportBase(active.className)
      const res = await exportCsvAsXlsx({
        csv,
        fileName: `so-diem-${safe}.xlsx`,
        sheetName: active.className.slice(0, 31) || 'Grades',
        openInSheets: true,
      })
      setNotice(
        res.ok
          ? label(`Đã xuất và mở trong Sheets: ${res.path}`, `Exported and opened in Sheets: ${res.path}`)
          : label(res.error || 'Không xuất được.', res.error || 'Export failed.'),
      )
    } finally {
      setBusy(false)
    }
  }

  const importExcel = async () => {
    if (!active || !className) return
    setBusy(true)
    setNotice(null)
    try {
      const picked = await pickSpreadsheetRows()
      if (!picked.ok) {
        if (!picked.canceled) {
          setNotice(label(picked.error || 'Không đọc được file.', picked.error || 'Could not read file.'))
        }
        return
      }
      const result = importGradebookFromRows(active, students, picked.rows)
      updateBook(className, () => result.book)
      setNotice(
        label(
          `Đã nhập ${result.updated} dòng điểm từ ${picked.name}.`,
          `Imported ${result.updated} score rows from ${picked.name}.`,
        ),
      )
    } finally {
      setBusy(false)
    }
  }

  if (classes.length === 0) {
    return (
      <p className="teacher-empty">
        {label(
          'Chưa có lớp — thêm học sinh và gán lớp ở tab Học sinh trước.',
          'No classes yet — add students with a class in Students first.',
        )}
      </p>
    )
  }

  const book = active

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Sổ điểm theo lớp — nhập điểm, Xuất Excel để mở trong UniWork Sheets, hoặc Nhập Excel để cập nhật điểm.',
          'Class gradebook — enter scores, Export Excel to open in UniWork Sheets, or Import Excel to update scores.',
        )}
      </p>
      <div className="wb-db-toolbar">
        <label className="wb-roster-filter">
          <span className="sr-only">{label('Lớp', 'Class')}</span>
          <select value={className} onChange={(e) => setClassName(e.target.value)}>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <span className="teacher-count">
          {classStudents.length} {label('HS', 'students')}
        </span>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void importExcel()}
          disabled={!book || busy}
        >
          {label('Nhập Excel', 'Import Excel')}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void exportExcel()}
          disabled={!book || busy}
        >
          {label('Xuất Excel', 'Export Excel')}
        </button>
      </div>
      {notice ? <p className="new-chat-attach-notice">{notice}</p> : null}

      <div className="wb-module-form wb-composer-panel wb-grades-addcol">
        <label>
          <span>{label('Thêm cột', 'Add column')}</span>
          <input
            value={colLabel}
            onChange={(e) => setColLabel(e.target.value)}
            placeholder={label('VD: KT giữa kỳ', 'e.g. Midterm')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addColumn()
            }}
          />
        </label>
        <button type="button" className="btn btn-primary" onClick={addColumn} disabled={!className}>
          {label('Thêm cột', 'Add column')}
        </button>
      </div>

      {!book ? (
        <p className="teacher-empty">{label('Đang chuẩn bị sổ…', 'Preparing gradebook…')}</p>
      ) : (
        <div className="wb-grades-scroll">
          <table className="wb-grades-table">
            <thead>
              <tr>
                <th scope="col">{label('STT', '#')}</th>
                <th scope="col">{label('Họ tên', 'Name')}</th>
                {book.columns.map((c) => (
                  <th key={c.id} scope="col">
                    <input
                      className="wb-grades-col-label"
                      defaultValue={c.label}
                      key={`${c.id}:${c.label}`}
                      aria-label={label('Tên cột', 'Column name')}
                      onBlur={(e) => renameColumn(c.id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="wb-grades-col-del"
                      title={label('Xóa cột', 'Remove column')}
                      onClick={() => removeColumn(c.id)}
                    >
                      ×
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={2 + book.columns.length} className="teacher-empty">
                    {label('Lớp chưa có học sinh.', 'No students in this class.')}
                  </td>
                </tr>
              ) : (
                classStudents.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td>
                      <strong>{s.name}</strong>
                    </td>
                    {book.columns.map((c) => (
                      <td key={c.id}>
                        <input
                          className="wb-grades-cell"
                          value={book.scores[s.id]?.[c.id] ?? ''}
                          onChange={(e) => setScore(s.id, c.id, e.target.value)}
                          inputMode="decimal"
                          aria-label={`${s.name} · ${c.label}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
