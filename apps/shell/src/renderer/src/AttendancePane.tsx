import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import type { PracticeId } from '@uniwork/practice-core'
import {
  attendanceSummary,
  exportAttendanceCsv,
  findAttendanceSession,
  importAttendanceFromRows,
  listStudentClasses,
  readAttendance,
  readStudents,
  writeAttendance,
  type AttendanceMark,
  type WbAttendanceSession,
  type WbStudentItem,
} from './workbench-pins'
import {
  exportCsvAsXlsx,
  normalizeExportBase,
  pickSpreadsheetRows,
} from './workbench-excel-io'

const PERIODS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const

const MARKS: { id: AttendanceMark; vi: string; en: string; short: string }[] = [
  { id: 'present', vi: 'Có mặt', en: 'Present', short: 'C' },
  { id: 'absent', vi: 'Vắng', en: 'Absent', short: 'V' },
  { id: 'late', vi: 'Muộn', en: 'Late', short: 'M' },
  { id: 'excused', vi: 'Phép', en: 'Excused', short: 'P' },
]

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function AttendancePane({
  practiceId,
  vi,
}: {
  practiceId: PracticeId
  vi: boolean
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [students, setStudents] = useState<WbStudentItem[]>(() => readStudents(practiceId))
  const [sessions, setSessions] = useState<WbAttendanceSession[]>(() => readAttendance(practiceId))
  const classes = useMemo(() => listStudentClasses(students), [students])
  const [date, setDate] = useState(todayIso)
  const [className, setClassName] = useState('')
  const [period, setPeriod] = useState('')
  const [marks, setMarks] = useState<Record<string, AttendanceMark>>({})
  const [note, setNote] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setStudents(readStudents(practiceId))
    setSessions(readAttendance(practiceId))
  }, [practiceId])

  useEffect(() => {
    const cls = listStudentClasses(readStudents(practiceId))
    setClassName((prev) => (prev && cls.includes(prev) ? prev : (cls[0] ?? '')))
  }, [practiceId, students])

  useEffect(() => {
    if (!className || !date) return
    const hit = findAttendanceSession(sessions, date, className, period || undefined)
    if (hit) {
      setSessionId(hit.id)
      setMarks({ ...hit.marks })
      setNote(hit.note ?? '')
    } else {
      setSessionId(null)
      setMarks({})
      setNote('')
    }
  }, [date, className, period, sessions])

  const classStudents = useMemo(
    () =>
      students
        .filter((s) => (s.className ?? '') === className)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    [students, className],
  )

  const persistSession = (nextMarks: Record<string, AttendanceMark>, nextNote: string) => {
    if (!className || !date) return
    const id = sessionId ?? newId()
    const row: WbAttendanceSession = {
      id,
      date,
      className,
      marks: nextMarks,
      ...(period.trim() ? { period: period.trim() } : {}),
      ...(nextNote.trim() ? { note: nextNote.trim() } : {}),
    }
    const without = sessions.filter((s) => s.id !== id)
    // Also drop any other session with same key (date/class/period)
    const filtered = without.filter(
      (s) =>
        !(
          s.date === date &&
          s.className === className &&
          (s.period?.trim() || undefined) === (period.trim() || undefined) &&
          s.id !== id
        ),
    )
    const next = [row, ...filtered].sort((a, b) => b.date.localeCompare(a.date))
    setSessions(next)
    writeAttendance(practiceId, next)
    setSessionId(id)
  }

  const setMark = (studentId: string, mark: AttendanceMark) => {
    const next = { ...marks, [studentId]: mark }
    setMarks(next)
    persistSession(next, note)
  }

  const markAllPresent = () => {
    const next: Record<string, AttendanceMark> = {}
    for (const s of classStudents) next[s.id] = 'present'
    setMarks(next)
    persistSession(next, note)
  }

  const summary = attendanceSummary({
    id: sessionId ?? 'tmp',
    date,
    className,
    marks,
  })

  const currentSession = (): WbAttendanceSession => ({
    id: sessionId ?? 'tmp',
    date,
    className,
    marks,
    ...(period.trim() ? { period: period.trim() } : {}),
    ...(note.trim() ? { note: note.trim() } : {}),
  })

  const exportExcel = async () => {
    if (!className) return
    setBusy(true)
    setNotice(null)
    try {
      const session = currentSession()
      const csv = exportAttendanceCsv(session, students)
      const res = await exportCsvAsXlsx({
        csv,
        fileName: `diem-danh-${normalizeExportBase(className)}-${date}.xlsx`,
        sheetName: 'Attendance',
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
    if (!className || !date) return
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
      const result = importAttendanceFromRows(currentSession(), students, picked.rows)
      setMarks(result.session.marks)
      persistSession(result.session.marks, note)
      setNotice(
        label(
          `Đã nhập ${result.updated} dòng điểm danh từ ${picked.name}.`,
          `Imported ${result.updated} attendance rows from ${picked.name}.`,
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

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Điểm danh nhẹ — chọn ngày / lớp / tiết, chạm C·V·M·P. Tự lưu.',
          'Light attendance — pick date / class / period, tap C·A·L·E. Auto-saves.',
        )}
      </p>
      <div className="wb-db-toolbar">
        <label className="wb-roster-filter">
          <span className="sr-only">{label('Ngày', 'Date')}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
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
        <label className="wb-roster-filter">
          <span className="sr-only">{label('Tiết', 'Period')}</span>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="">{label('— Tiết —', '— Period —')}</option>
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {label(`Tiết ${p}`, `P${p}`)}
              </option>
            ))}
          </select>
        </label>
        <span className="teacher-count">
          C{summary.present} · V{summary.absent} · M{summary.late} · P{summary.excused}
        </span>
        <button type="button" className="btn btn-secondary" onClick={markAllPresent} disabled={busy}>
          {label('Tất cả có mặt', 'All present')}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void importExcel()}
          disabled={busy || !className}
        >
          {label('Nhập Excel', 'Import Excel')}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void exportExcel()}
          disabled={busy || !className}
        >
          {label('Xuất Excel', 'Export Excel')}
        </button>
      </div>
      {notice ? <p className="new-chat-attach-notice">{notice}</p> : null}
      <label className="wb-module-form teacher-form-wide" style={{ marginBottom: 12 }}>
        <span>{label('Ghi chú buổi', 'Session note')}</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => persistSession(marks, note)}
          placeholder={label('VD: Kiểm tra miệng', 'e.g. Oral check')}
        />
      </label>
      <ul className="wb-module-list">
        {classStudents.length === 0 ? (
          <li className="teacher-empty">{label('Lớp chưa có học sinh.', 'No students in class.')}</li>
        ) : (
          classStudents.map((s) => {
            const m = marks[s.id]
            return (
              <li key={s.id} className="wb-module-row wb-attendance-row">
                <div className="wb-module-meta">
                  <strong>{s.name}</strong>
                </div>
                <div className="wb-attendance-marks" role="group" aria-label={s.name}>
                  {MARKS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`wb-att-btn${m === opt.id ? ` is-${opt.id}` : ''}`}
                      title={vi ? opt.vi : opt.en}
                      onClick={() => setMark(s.id, opt.id)}
                    >
                      {opt.short}
                    </button>
                  ))}
                </div>
              </li>
            )
          })
        )}
      </ul>
    </>
  )
}
