import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultDeskLayout, isDeskWidgetId } from '../src/renderer/src/workbench-desk'
import {
  ensureGradebook,
  exportGradebookCsv,
  resolveStudentParentContact,
  writeGradebooks,
  writeParents,
  writeStudents,
  type WbStudentItem,
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

describe('P1 teacher grades + desk + contact resolve', () => {
  afterEach(() => {
    store.clear()
  })

  it('builds gradebook and exports CSV with BOM', () => {
    const { book, books } = ensureGradebook([], '10A1')
    expect(book.columns.length).toBeGreaterThanOrEqual(3)
    const col = book.columns[0]!
    const withScore = {
      ...book,
      scores: { s1: { [col.id]: '8.5' } },
    }
    writeGradebooks('teacher', books.map((b) => (b.className === '10A1' ? withScore : b)))
    const students: WbStudentItem[] = [
      { id: 's1', name: 'An', className: '10A1' },
      { id: 's2', name: 'Bình', className: '10A1' },
    ]
    const csv = exportGradebookCsv(withScore, students)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('Họ tên')
    expect(csv).toContain('An')
    expect(csv).toContain('8.5')
    expect(csv).toContain('Bình')
  })

  it('resolves student parent email for playbook', () => {
    writeStudents('teacher', [
      { id: 's1', name: 'Nguyễn Văn An', className: '10A1', parentId: 'p1', parentName: 'Bình' },
    ])
    writeParents('teacher', [
      { id: 'p1', name: 'Bình', studentIds: ['s1'], email: 'binh@example.com' },
    ])
    const hit = resolveStudentParentContact('teacher', 'Soạn nhận xét học sinh Nguyễn Văn An')
    expect(hit?.student.name).toBe('Nguyễn Văn An')
    expect(hit?.email).toBe('binh@example.com')
  })

  it('defaults teacher desk with lessons + follow-up widgets', () => {
    const layout = defaultDeskLayout('teacher')
    expect(layout[0]).toBe('lessons-today')
    expect(layout).toContain('students-followup')
    expect(isDeskWidgetId('lessons-today')).toBe(true)
    expect(defaultDeskLayout('sales')[0]).not.toBe('lessons-today')
  })
})
