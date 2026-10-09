import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import type { PracticeId } from '@uniwork/practice-core'
import {
  readCalendar,
  readCalendarView,
  writeCalendar,
  writeCalendarView,
  type CalendarViewMode,
  type WbCalendarItem,
} from './workbench-pins'
import { WbDeleteBtn, WbEditBtn, WbRowActions } from './WbRowActions'

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

/** Monday-first weekday index 0..6 */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}

const LESSON_PERIODS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const

export function CalendarPane({
  practiceId,
  vi,
  packId = null,
  packTitle = null,
}: {
  practiceId: PracticeId
  vi: boolean
  packId?: string | null
  packTitle?: string | null
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const lessonMode = practiceId === 'teacher' || practiceId === 'principal'
  const todayIso = toIso(new Date())
  const [items, setItems] = useState<WbCalendarItem[]>(() => readCalendar(practiceId))
  const [view, setView] = useState<CalendarViewMode>(() => readCalendarView())
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(todayIso)
  const [title, setTitle] = useState('')
  const [period, setPeriod] = useState('')
  const [linkPack, setLinkPack] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    setItems(readCalendar(practiceId))
    setEditingId(null)
    setTitle('')
    setPeriod('')
    setLinkPack(false)
  }, [practiceId])

  const persist = (next: WbCalendarItem[]) => {
    setItems(next)
    writeCalendar(practiceId, next)
  }

  const setViewMode = (mode: CalendarViewMode) => {
    setView(mode)
    writeCalendarView(mode)
  }

  const clearForm = () => {
    setEditingId(null)
    setTitle('')
    setPeriod('')
    setLinkPack(false)
  }

  const startEdit = (it: WbCalendarItem) => {
    setEditingId(it.id)
    setTitle(it.title)
    setPeriod(it.period ?? '')
    setLinkPack(Boolean(it.linkedProjectId))
    setSelected(it.date)
    setCursor(startOfMonth(new Date(it.date + 'T12:00:00')))
  }

  const byDate = useMemo(() => {
    const map = new Map<string, WbCalendarItem[]>()
    for (const it of items) {
      const list = map.get(it.date) ?? []
      list.push(it)
      map.set(it.date, list)
    }
    return map
  }, [items])

  const upcoming = useMemo(() => {
    return [...items]
      .filter((i) => !i.done && i.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
  }, [items, todayIso])

  const monthLabel = cursor.toLocaleDateString(vi ? 'vi-VN' : 'en-US', {
    month: 'long',
    year: 'numeric',
  })

  const weekdays = vi
    ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const cells = useMemo(() => {
    const first = startOfMonth(cursor)
    const offset = mondayIndex(first)
    const total = daysInMonth(cursor)
    const out: { iso: string | null; day: number | null }[] = []
    for (let i = 0; i < offset; i++) out.push({ iso: null, day: null })
    for (let d = 1; d <= total; d++) {
      const iso = toIso(new Date(cursor.getFullYear(), cursor.getMonth(), d))
      out.push({ iso, day: d })
    }
    while (out.length % 7 !== 0) out.push({ iso: null, day: null })
    return out
  }, [cursor])

  const selectedItems = (byDate.get(selected) ?? []).slice().sort((a, b) => {
    if (!!a.done !== !!b.done) return a.done ? 1 : -1
    return a.title.localeCompare(b.title)
  })

  const listGroups = useMemo(() => {
    const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
    const groups: { date: string; items: WbCalendarItem[] }[] = []
    for (const it of sorted) {
      const last = groups[groups.length - 1]
      if (last && last.date === it.date) last.items.push(it)
      else groups.push({ date: it.date, items: [it] })
    }
    return groups
  }, [items])

  const buildRow = (id: string, existing?: WbCalendarItem): WbCalendarItem => {
    const row: WbCalendarItem = {
      id,
      date: selected,
      title: title.trim(),
    }
    if (existing?.done) row.done = true
    if (lessonMode) {
      if (period.trim()) row.period = period.trim()
      if (linkPack) {
        if (packId) {
          row.linkedProjectId = packId
          if (packTitle?.trim()) row.packTitle = packTitle.trim()
          else if (existing?.linkedProjectId === packId && existing.packTitle) {
            row.packTitle = existing.packTitle
          }
        } else if (existing?.linkedProjectId) {
          row.linkedProjectId = existing.linkedProjectId
          if (existing.packTitle) row.packTitle = existing.packTitle
        }
      }
    } else {
      if (existing?.period) row.period = existing.period
      if (existing?.linkedProjectId) row.linkedProjectId = existing.linkedProjectId
      if (existing?.packTitle) row.packTitle = existing.packTitle
    }
    return row
  }

  const save = () => {
    const t = title.trim()
    if (!t || !selected) return
    if (editingId) {
      const existing = items.find((x) => x.id === editingId)
      persist(
        items
          .map((x) => (x.id === editingId ? buildRow(editingId, existing) : x))
          .sort((a, b) => a.date.localeCompare(b.date)),
      )
    } else {
      persist(
        [buildRow(newId()), ...items].sort((a, b) => a.date.localeCompare(b.date)),
      )
    }
    clearForm()
  }

  const toggleDone = (id: string) => {
    persist(items.map((x) => (x.id === id ? { ...x, done: !x.done } : x)))
  }

  const remove = (id: string) => {
    if (editingId === id) clearForm()
    persist(items.filter((x) => x.id !== id))
  }

  const renderItemActions = (it: WbCalendarItem) => (
    <WbRowActions>
      <WbEditBtn label={label('Sửa', 'Edit')} onClick={() => startEdit(it)} />
      <WbDeleteBtn label={label('Xóa', 'Delete')} onClick={() => remove(it.id)} />
    </WbRowActions>
  )

  const openCount = items.filter((i) => !i.done).length
  const monthCount = items.filter((i) => i.date.startsWith(toIso(cursor).slice(0, 7))).length

  return (
    <div className="wb-cal">
      <p className="teacher-hint">
        {lessonMode
          ? label(
              'Lịch tiết dạy — gắn tiết và gói Tri thức đang chọn để mở nhanh học liệu.',
              'Lesson calendar — attach a period and the selected Knowledge pack.',
            )
          : label(
              'Lịch mốc hạn trực quan — xem dạng lịch tháng hoặc danh sách. Chạm ngày để thêm sự kiện.',
              'Visual deadline calendar — month grid or list. Tap a day to add events.',
            )}
      </p>

      <div className="wb-cal-toolbar">
        <div className="wb-cal-stats">
          <span>
            {label('Đang mở', 'Open')} <strong>{openCount}</strong>
          </span>
          <span>
            {label('Tháng này', 'This month')} <strong>{monthCount}</strong>
          </span>
        </div>
        <div className="wb-subtabs wb-cal-view-toggle" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'calendar'}
            className={`wb-subtab${view === 'calendar' ? ' active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            {label('Calendar', 'Calendar')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'list'}
            className={`wb-subtab${view === 'list' ? ' active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            {label('Danh sách', 'List')}
          </button>
        </div>
      </div>

      {upcoming.length > 0 ? (
        <div className="wb-cal-upcoming">
          <h4>{label('Sắp tới', 'Upcoming')}</h4>
          <div className="wb-cal-upcoming-row">
            {upcoming.map((it) => (
              <button
                key={it.id}
                type="button"
                className="wb-cal-upcoming-card"
                onClick={() => {
                  setSelected(it.date)
                  setCursor(startOfMonth(new Date(it.date + 'T12:00:00')))
                  setViewMode('calendar')
                }}
              >
                <strong>{it.date.slice(5)}</strong>
                <span>{it.title}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="wb-module-form wb-cal-add">
        <label>
          <span>{label('Ngày', 'Date')}</span>
          <input
            type="date"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value)
              if (e.target.value) {
                setCursor(startOfMonth(new Date(e.target.value + 'T12:00:00')))
              }
            }}
          />
        </label>
        <label className="teacher-form-wide">
          <span>
            {lessonMode
              ? label('Tiết / sự kiện', 'Period / event')
              : label('Sự kiện / hạn', 'Event / deadline')}
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              lessonMode
                ? label('VD: Phân số — luyện tập', 'e.g. Fractions — practice')
                : label('VD: Nộp giáo án tuần 12', 'e.g. Submit week-12 plan')
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
            }}
          />
        </label>
        {lessonMode ? (
          <>
            <label>
              <span>{label('Tiết', 'Period')}</span>
              <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="">{label('— Không chọn —', '— None —')}</option>
                {LESSON_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {label(`Tiết ${p}`, `Period ${p}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="wb-cal-link-pack">
              <input
                type="checkbox"
                checked={linkPack}
                disabled={!packId && !linkPack}
                onChange={(e) => setLinkPack(e.target.checked)}
              />
              <span>
                {packId
                  ? label(
                      `Gắn gói Tri thức${packTitle ? `: ${packTitle}` : ''}`,
                      `Link Knowledge pack${packTitle ? `: ${packTitle}` : ''}`,
                    )
                  : linkPack
                    ? label('Giữ liên kết gói hiện tại', 'Keep current pack link')
                    : label(
                        'Chọn gói Tri thức để gắn tiết học',
                        'Select a Knowledge pack to link this lesson',
                      )}
              </span>
            </label>
          </>
        ) : null}
        <div className="teacher-chip-row">
          <button type="button" className="btn btn-primary" onClick={save}>
            {editingId ? label('Lưu', 'Save') : label('Thêm', 'Add')}
          </button>
          {editingId ? (
            <button type="button" className="btn btn-secondary" onClick={clearForm}>
              {label('Huỷ sửa', 'Cancel edit')}
            </button>
          ) : null}
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="wb-cal-month">
          <div className="wb-cal-month-head">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCursor((c) => addMonths(c, -1))}
              aria-label={label('Tháng trước', 'Previous month')}
            >
              ‹
            </button>
            <h3>{monthLabel}</h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCursor((c) => addMonths(c, 1))}
              aria-label={label('Tháng sau', 'Next month')}
            >
              ›
            </button>
            <button
              type="button"
              className="btn btn-secondary wb-cal-today-btn"
              onClick={() => {
                const now = new Date()
                setCursor(startOfMonth(now))
                setSelected(toIso(now))
              }}
            >
              {label('Hôm nay', 'Today')}
            </button>
          </div>

          <div className="wb-cal-grid" role="grid" aria-label={monthLabel}>
            {weekdays.map((w) => (
              <div key={w} className="wb-cal-dow">
                {w}
              </div>
            ))}
            {cells.map((cell, idx) => {
              if (!cell.iso || cell.day === null) {
                return <div key={`e-${idx}`} className="wb-cal-cell is-empty" />
              }
              const dayItems = byDate.get(cell.iso) ?? []
              const open = dayItems.filter((i) => !i.done).length
              const isToday = cell.iso === todayIso
              const isSelected = cell.iso === selected
              return (
                <button
                  key={cell.iso}
                  type="button"
                  className={`wb-cal-cell${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}${
                    open > 0 ? ' has-events' : ''
                  }`}
                  onClick={() => setSelected(cell.iso!)}
                >
                  <span className="wb-cal-daynum">{cell.day}</span>
                  {dayItems.length > 0 ? (
                    <span className="wb-cal-dots" aria-hidden>
                      {dayItems.slice(0, 3).map((it) => (
                        <i key={it.id} className={it.done ? 'is-done' : ''} />
                      ))}
                    </span>
                  ) : (
                    <span className="wb-cal-dots" />
                  )}
                  {open > 0 ? <span className="wb-cal-count">{open}</span> : null}
                </button>
              )
            })}
          </div>

          <div className="wb-cal-day-panel">
            <h4>
              {label('Ngày', 'Day')} {selected}
              <span className="teacher-count">{selectedItems.length}</span>
            </h4>
            {selectedItems.length === 0 ? (
              <p className="teacher-empty">{label('Chưa có mốc ngày này.', 'No events this day.')}</p>
            ) : (
              <ul className="wb-module-list">
                {selectedItems.map((it) => (
                  <li key={it.id} className={`wb-module-row${it.done ? ' is-done' : ''}`}>
                    <label className="wb-task-check">
                      <input
                        type="checkbox"
                        checked={!!it.done}
                        onChange={() => toggleDone(it.id)}
                      />
                      <div>
                        <strong>{it.title}</strong>
                        {it.period || it.packTitle ? (
                          <span>
                            {[
                              it.period
                                ? label(`Tiết ${it.period}`, `Period ${it.period}`)
                                : null,
                              it.packTitle,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        ) : null}
                      </div>
                    </label>
                    {renderItemActions(it)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="wb-cal-list">
          {listGroups.length === 0 ? (
            <p className="teacher-empty">{label('Chưa có mốc nào.', 'No events yet.')}</p>
          ) : (
            listGroups.map((g) => {
              const isPast = g.date < todayIso
              const isToday = g.date === todayIso
              return (
                <section
                  key={g.date}
                  className={`wb-cal-list-group${isToday ? ' is-today' : ''}${isPast ? ' is-past' : ''}`}
                >
                  <header>
                    <button
                      type="button"
                      className="wb-cal-list-date"
                      onClick={() => {
                        setSelected(g.date)
                        setCursor(startOfMonth(new Date(g.date + 'T12:00:00')))
                        setViewMode('calendar')
                      }}
                    >
                      <strong>{g.date}</strong>
                      <span>
                        {new Date(g.date + 'T12:00:00').toLocaleDateString(vi ? 'vi-VN' : 'en-US', {
                          weekday: 'long',
                        })}
                      </span>
                    </button>
                    <span className="teacher-count">{g.items.length}</span>
                  </header>
                  <ul className="wb-module-list">
                    {g.items.map((it) => (
                      <li key={it.id} className={`wb-module-row${it.done ? ' is-done' : ''}`}>
                        <label className="wb-task-check">
                          <input
                            type="checkbox"
                            checked={!!it.done}
                            onChange={() => toggleDone(it.id)}
                          />
                          <div>
                            <strong>{it.title}</strong>
                            {it.period || it.packTitle ? (
                              <span>
                                {[
                                  it.period
                                    ? label(`Tiết ${it.period}`, `Period ${it.period}`)
                                    : null,
                                  it.packTitle,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </span>
                            ) : null}
                          </div>
                        </label>
                        {renderItemActions(it)}
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
