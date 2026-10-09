import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import type { PracticeId } from '@uniwork/practice-core'
import { EDU_SUBJECTS } from '@uniwork/edu-core'
import {
  listStudentClasses,
  readStudents,
  readTimetable,
  slotKey,
  writeTimetable,
  type TimetableDay,
  type WbTimetableSlot,
} from './workbench-pins'

const PERIODS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const
const DAYS: { day: TimetableDay; vi: string; en: string }[] = [
  { day: 0, vi: 'T2', en: 'Mon' },
  { day: 1, vi: 'T3', en: 'Tue' },
  { day: 2, vi: 'T4', en: 'Wed' },
  { day: 3, vi: 'T5', en: 'Thu' },
  { day: 4, vi: 'T6', en: 'Fri' },
  { day: 5, vi: 'T7', en: 'Sat' },
]

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function TimetablePane({
  practiceId,
  vi,
}: {
  practiceId: PracticeId
  vi: boolean
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [slots, setSlots] = useState<WbTimetableSlot[]>(() => readTimetable(practiceId))
  const [classes, setClasses] = useState<string[]>(() => listStudentClasses(readStudents(practiceId)))
  const [editKey, setEditKey] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [className, setClassName] = useState('')
  const [room, setRoom] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    setSlots(readTimetable(practiceId))
    setClasses(listStudentClasses(readStudents(practiceId)))
    setEditKey(null)
  }, [practiceId])

  const byKey = useMemo(() => {
    const map = new Map<string, WbTimetableSlot>()
    for (const s of slots) map.set(slotKey(s.day, s.period), s)
    return map
  }, [slots])

  const persist = (next: WbTimetableSlot[]) => {
    setSlots(next)
    writeTimetable(practiceId, next)
  }

  const openEdit = (day: TimetableDay, period: string) => {
    const key = slotKey(day, period)
    const hit = byKey.get(key)
    setEditKey(key)
    setSubject(hit?.subject ?? '')
    setClassName(hit?.className ?? '')
    setRoom(hit?.room ?? '')
    setNote(hit?.note ?? '')
  }

  const clearEdit = () => {
    setEditKey(null)
    setSubject('')
    setClassName('')
    setRoom('')
    setNote('')
  }

  const saveSlot = () => {
    if (!editKey) return
    const [dayStr, period] = editKey.split(':')
    const day = Number(dayStr) as TimetableDay
    if (!period || Number.isNaN(day)) return
    const existing = byKey.get(editKey)
    const hasContent = subject.trim() || className.trim() || room.trim() || note.trim()
    if (!hasContent) {
      if (existing) persist(slots.filter((s) => s.id !== existing.id))
      clearEdit()
      return
    }
    const row: WbTimetableSlot = {
      id: existing?.id ?? newId(),
      day,
      period,
      ...(subject.trim() ? { subject: subject.trim() } : {}),
      ...(className.trim() ? { className: className.trim() } : {}),
      ...(room.trim() ? { room: room.trim() } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    }
    const next = existing
      ? slots.map((s) => (s.id === existing.id ? row : s))
      : [row, ...slots]
    persist(next)
    clearEdit()
  }

  const clearSlot = () => {
    if (!editKey) return
    const existing = byKey.get(editKey)
    if (existing) persist(slots.filter((s) => s.id !== existing.id))
    clearEdit()
  }

  const editDay = editKey ? (Number(editKey.split(':')[0]) as TimetableDay) : null
  const editPeriod = editKey?.split(':')[1] ?? ''

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Nhập TKB tuần — chạm ô tiết để gán môn / lớp / phòng. Xóa nội dung để trống ô.',
          'Weekly timetable — tap a cell to set subject / class / room. Clear to empty.',
        )}
      </p>
      <div className="wb-tkb-scroll">
        <table className="wb-tkb-table">
          <thead>
            <tr>
              <th scope="col">{label('Tiết', 'P')}</th>
              {DAYS.map((d) => (
                <th key={d.day} scope="col">
                  {vi ? d.vi : d.en}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((p) => (
              <tr key={p}>
                <th scope="row">{p}</th>
                {DAYS.map((d) => {
                  const key = slotKey(d.day, p)
                  const slot = byKey.get(key)
                  const active = editKey === key
                  return (
                    <td key={key}>
                      <button
                        type="button"
                        className={`wb-tkb-cell${slot ? ' has-slot' : ''}${active ? ' is-active' : ''}`}
                        onClick={() => openEdit(d.day, p)}
                      >
                        {slot ? (
                          <>
                            <strong>{slot.subject || '—'}</strong>
                            <span>
                              {[slot.className, slot.room].filter(Boolean).join(' · ') || ' '}
                            </span>
                          </>
                        ) : (
                          <span className="wb-tkb-empty">+</span>
                        )}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editKey && editDay !== null ? (
        <div className="wb-module-form wb-composer-panel">
          <p className="teacher-hint">
            {label(
              `${DAYS.find((d) => d.day === editDay)?.vi ?? ''} · Tiết ${editPeriod}`,
              `${DAYS.find((d) => d.day === editDay)?.en ?? ''} · Period ${editPeriod}`,
            )}
          </p>
          <label>
            <span>{label('Môn', 'Subject')}</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              list="wb-tkb-subjects"
              placeholder={label('VD: Toán', 'e.g. Math')}
              autoFocus
            />
            <datalist id="wb-tkb-subjects">
              {EDU_SUBJECTS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label>
            <span>{label('Lớp', 'Class')}</span>
            <input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              list="wb-tkb-classes"
              placeholder={label('VD: 10A1', 'e.g. 10A')}
            />
            <datalist id="wb-tkb-classes">
              {classes.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label>
            <span>{label('Phòng', 'Room')}</span>
            <input value={room} onChange={(e) => setRoom(e.target.value)} />
          </label>
          <label className="teacher-form-wide">
            <span>{label('Ghi chú', 'Note')}</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="teacher-chip-row">
            <button type="button" className="btn btn-primary" onClick={saveSlot}>
              {label('Lưu ô', 'Save cell')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={clearSlot}>
              {label('Xóa ô', 'Clear cell')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={clearEdit}>
              {label('Huỷ', 'Cancel')}
            </button>
          </div>
        </div>
      ) : null}

      <p className="teacher-count">
        {slots.length} {label('tiết đã gán', 'slots filled')}
      </p>
    </>
  )
}
