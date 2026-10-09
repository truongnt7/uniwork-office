import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  attendanceSummary,
  exportAttendanceCsv,
  exportQuestionsCsv,
  findAttendanceSession,
  slotKey,
  writeAttendance,
  writeQuestions,
  writeTimetable,
  type WbAttendanceSession,
  type WbQuestionItem,
  type WbTimetableSlot,
} from '../src/renderer/src/workbench-pins'

const store = new Map<string, string>()

vi.mock('../src/renderer/src/workbench-store-client', () => ({
  wbStoreGetRaw: (key: string) => store.get(key) ?? null,
  wbStoreSetRaw: (key: string, value: string) => {
    store.set(key, value)
  },
  wbStoreRead: <T,>(key: string, fallback: T): T => {
    const raw = store.get(key)
    if (raw == null) return fallback
    try {
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  },
  wbStoreWrite: (key: string, value: unknown) => {
    store.set(key, JSON.stringify(value))
  },
  wbStoreRemove: (key: string) => {
    store.delete(key)
  },
}))

describe('P2 teacher attendance · TKB · question bank', () => {
  afterEach(() => {
    store.clear()
  })

  it('finds attendance session and summarizes marks', () => {
    const session: WbAttendanceSession = {
      id: 'a1',
      date: '2026-10-09',
      className: '10A1',
      period: '3',
      marks: {
        s1: 'present',
        s2: 'absent',
        s3: 'late',
        s4: 'excused',
      },
    }
    writeAttendance('teacher', [session])
    const hit = findAttendanceSession([session], '2026-10-09', '10A1', '3')
    expect(hit?.id).toBe('a1')
    expect(findAttendanceSession([session], '2026-10-09', '10A1', '4')).toBeUndefined()
    expect(attendanceSummary(session)).toEqual({
      present: 1,
      absent: 1,
      late: 1,
      excused: 1,
      total: 4,
    })
    const csv = exportAttendanceCsv(session, [
      { id: 's1', name: 'An', className: '10A1' },
      { id: 's2', name: 'Bình', className: '10A1' },
    ])
    expect(csv).toContain('Có mặt')
    expect(csv).toContain('Vắng')
  })

  it('keys timetable slots by day+period', () => {
    const slots: WbTimetableSlot[] = [
      { id: 't1', day: 0, period: '1', subject: 'Toán', className: '10A1' },
      { id: 't2', day: 2, period: '5', subject: 'Văn' },
    ]
    writeTimetable('teacher', slots)
    expect(slotKey(0, '1')).toBe('0:1')
    expect(slots.find((s) => slotKey(s.day, s.period) === '2:5')?.subject).toBe('Văn')
  })

  it('exports question bank CSV', () => {
    const items: WbQuestionItem[] = [
      {
        id: 'q1',
        stem: '2 + 2 = ?',
        answer: '4',
        subject: 'Toán',
        tags: ['đại số'],
        difficulty: 'easy',
        createdAt: '2026-10-09T00:00:00.000Z',
      },
    ]
    writeQuestions('teacher', items)
    const csv = exportQuestionsCsv(items)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('2 + 2')
    expect(csv).toContain('đại số')
  })
})
