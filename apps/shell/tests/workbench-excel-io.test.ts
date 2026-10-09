import { describe, expect, it } from 'vitest'
import {
  applyRosterImport,
  exportAttendanceCsv,
  exportGradebookCsv,
  exportQuestionsCsv,
  exportStudentsCsv,
  exportTimetableCsv,
  importAttendanceFromRows,
  importGradebookFromRows,
  importQuestionsFromRows,
  importTimetableFromRows,
  parseAttendanceMark,
  parseRosterImportRows,
  parseTimetableDay,
  type WbAttendanceSession,
  type WbGradebook,
  type WbQuestionItem,
  type WbStudentItem,
  type WbTimetableSlot,
} from '../src/renderer/src/workbench-pins'

describe('Workbench Excel import/export mappers', () => {
  it('parses roster rows with STT + header', () => {
    const rows = parseRosterImportRows([
      ['STT', 'Họ tên', 'Lớp', 'Phụ huynh', 'SĐT', 'Email'],
      ['1', 'Nguyễn Văn An', '10A1', 'Bình', '090', 'a@x.com'],
      ['2', 'Trần Thị Bé', '10A1', '', '', ''],
    ])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      name: 'Nguyễn Văn An',
      className: '10A1',
      parentName: 'Bình',
      phone: '090',
      email: 'a@x.com',
    })
  })

  it('applies roster import and exports students csv', () => {
    const { students, added } = applyRosterImport(
      [],
      [],
      parseRosterImportRows([
        ['Họ tên', 'Lớp'],
        ['An', '10A1'],
      ]),
    )
    expect(added).toBe(1)
    const csv = exportStudentsCsv(students)
    expect(csv).toContain('An')
    expect(csv).toContain('10A1')
  })

  it('round-trips gradebook scores by student name', () => {
    const students: WbStudentItem[] = [
      { id: 's1', name: 'An', className: '10A1' },
      { id: 's2', name: 'Bình', className: '10A1' },
    ]
    const book: WbGradebook = {
      className: '10A1',
      columns: [{ id: 'c1', label: 'Miệng' }],
      scores: { s1: { c1: '8' } },
    }
    const csv = exportGradebookCsv(book, students)
    expect(csv).toContain('8')
    const imported = importGradebookFromRows(book, students, [
      ['STT', 'Họ tên', 'Miệng', '15p'],
      ['1', 'An', '9', '7'],
      ['2', 'Bình', '6', ''],
    ])
    expect(imported.updated).toBe(2)
    expect(imported.book.columns.some((c) => c.label === '15p')).toBe(true)
    const mieng = imported.book.columns.find((c) => c.label === 'Miệng')!
    expect(imported.book.scores.s1?.[mieng.id]).toBe('9')
  })

  it('imports attendance marks from labels', () => {
    expect(parseAttendanceMark('Có mặt')).toBe('present')
    expect(parseAttendanceMark('V')).toBe('absent')
    const students: WbStudentItem[] = [{ id: 's1', name: 'An', className: '10A1' }]
    const session: WbAttendanceSession = {
      id: 'a1',
      date: '2026-10-09',
      className: '10A1',
      marks: {},
    }
    const csv = exportAttendanceCsv(
      { ...session, marks: { s1: 'present' } },
      students,
    )
    expect(csv).toContain('Có mặt')
    const result = importAttendanceFromRows(session, students, [
      ['STT', 'Họ tên', 'Trạng thái'],
      ['1', 'An', 'Đi muộn'],
    ])
    expect(result.updated).toBe(1)
    expect(result.session.marks.s1).toBe('late')
  })

  it('imports questions and timetable rows', () => {
    const q: WbQuestionItem[] = []
    const qRes = importQuestionsFromRows(q, [
      ['Câu hỏi', 'Đáp án', 'Môn', 'Lớp', 'Tags', 'Độ khó'],
      ['2+2=?', '4', 'Toán', '6', 'cơ bản', 'easy'],
    ])
    expect(qRes.added).toBe(1)
    expect(qRes.items[0]?.stem).toBe('2+2=?')
    expect(exportQuestionsCsv(qRes.items)).toContain('2+2=?')

    expect(parseTimetableDay('T2')).toBe(0)
    expect(parseTimetableDay('Fri')).toBe(4)
    const slots: WbTimetableSlot[] = []
    const tRes = importTimetableFromRows(slots, [
      ['Ngày', 'Tiết', 'Môn', 'Lớp', 'Phòng'],
      ['T2', '1', 'Toán', '10A1', 'P101'],
    ])
    expect(tRes.imported).toBe(1)
    expect(tRes.slots[0]).toMatchObject({ day: 0, period: '1', subject: 'Toán' })
    expect(exportTimetableCsv(tRes.slots)).toContain('Toán')
  })
})
