import { afterEach, describe, expect, it, vi } from 'vitest'
import { ensureTeacherFormSeeds } from '../src/renderer/src/teacher-form-seeds'
import {
  applyRosterImport,
  linkStudentParent,
  listStudentClasses,
  parseRosterImport,
  readForms,
  writeForms,
  type WbParentItem,
  type WbStudentItem,
} from '../src/renderer/src/workbench-pins'
import { matchPracticePlaybook, practiceMyAiChips } from '../src/renderer/src/my-ai-playbooks'

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

describe('P0 teacher roster + forms + My AI', () => {
  afterEach(() => {
    store.clear()
  })

  it('parses CSV/TSV roster lines and skips header', () => {
    const rows = parseRosterImport(
      'Họ tên,Lớp,Phụ huynh,SĐT,Email\nAn,10A1,Bình,09,a@x\nChi\t10A2\tDũng',
    )
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      name: 'An',
      className: '10A1',
      parentName: 'Bình',
      phone: '09',
      email: 'a@x',
    })
    expect(rows[1]).toMatchObject({ name: 'Chi', className: '10A2', parentName: 'Dũng' })
  })

  it('imports with hard HS↔PH links', () => {
    const result = applyRosterImport([], [], [
      { name: 'An', className: '10A1', parentName: 'Bình' },
      { name: 'Chi', className: '10A1', parentName: 'Bình' },
    ])
    expect(result.added).toBe(2)
    expect(result.parents).toHaveLength(1)
    expect(result.parents[0]!.name).toBe('Bình')
    expect(result.parents[0]!.studentIds).toHaveLength(2)
    expect(result.students.every((s) => s.parentId === result.parents[0]!.id)).toBe(true)
    expect(listStudentClasses(result.students)).toEqual(['10A1'])
  })

  it('relinks student to another parent', () => {
    let students: WbStudentItem[] = [{ id: 's1', name: 'An', parentId: 'p1', parentName: 'Bình' }]
    let parents: WbParentItem[] = [
      { id: 'p1', name: 'Bình', studentIds: ['s1'], studentName: 'An' },
      { id: 'p2', name: 'Cúc' },
    ]
    const linked = linkStudentParent(students, parents, 's1', 'p2')
    students = linked.students
    parents = linked.parents
    expect(students[0]!.parentId).toBe('p2')
    expect(students[0]!.parentName).toBe('Cúc')
    expect(parents.find((p) => p.id === 'p1')!.studentIds).toBeUndefined()
    expect(parents.find((p) => p.id === 'p2')!.studentIds).toEqual(['s1'])
  })

  it('seeds teacher forms once', () => {
    const first = ensureTeacherFormSeeds('teacher')
    expect(first.length).toBeGreaterThanOrEqual(5)
    expect(first.some((f) => f.id === 'seed:teacher-parent-letter')).toBe(true)
    expect(first.some((f) => f.templateId === 'teacher-student-comment')).toBe(true)
    const second = ensureTeacherFormSeeds('teacher')
    expect(second).toHaveLength(first.length)
    writeForms('sales', [])
    expect(readForms('sales')).toEqual([])
    expect(ensureTeacherFormSeeds('sales')).toEqual([])
  })

  it('matches parent letter and comment → email PH playbooks', () => {
    const letter = matchPracticePlaybook('teacher', 'Soạn thư thông báo phụ huynh về họp lớp')
    expect(letter?.playbook.id).toBe('teacher-parent-letter')
    expect(letter?.steps[0]).toMatchObject({
      kind: 'fill_template',
      templateId: 'teacher-parent-letter',
    })

    const comment = matchPracticePlaybook('teacher', 'Soạn nhận xét học sinh cuối kỳ')
    expect(comment?.playbook.id).toBe('teacher-student-comment')
    expect(comment?.steps[0]).toMatchObject({
      kind: 'fill_template',
      templateId: 'teacher-student-comment',
    })
    expect(comment?.steps.some((s) => s.kind === 'workbench')).toBe(true)
    expect(comment?.steps.length).toBeGreaterThanOrEqual(2)

    const chips = practiceMyAiChips('teacher')
    expect(chips.some((c) => c.id === 'teacher-parent-letter')).toBe(true)
    expect(chips.some((c) => c.id === 'teacher-student-comment')).toBe(true)
  })
})
