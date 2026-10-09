import { describe, expect, it, vi } from 'vitest'

vi.mock('../src/renderer/src/workbench-pins', () => ({
  readTasks: () => [{ id: '1', title: 'Call client', done: false }],
  readNotes: () => 'Meeting notes',
  readEmails: () => [],
  readCalendar: () => [{ id: 'c1', date: '2026-10-10', title: 'Standup' }],
  readPersonal: () => ({ fullName: 'An', org: 'UniWork', title: '', email: '', phone: '', address: '' }),
  readEvents: () => [],
  readFinance: () => [],
  healthDeskCounts: () => ({}),
}))

import { buildMyAiContextPack } from '../src/renderer/src/context-manager'

describe('buildMyAiContextPack', () => {
  it('includes active office excerpt, memory, tasks, and recents', () => {
    const pack = buildMyAiContextPack('freelancer', {
      vi: true,
      activeOffice: {
        kind: 'docs',
        title: 'Báo giá.docx',
        path: '/tmp/bg.docx',
        excerpt: 'Báo giá dịch vụ tháng 10 cho khách ABC…',
      },
      memoryLines: ['Luôn soạn Word tiếng Việt'],
      recents: [
        { name: 'a.docx', ext: 'docx', mtimeMs: 1 },
        { name: 'b.xlsx', ext: 'xlsx', mtimeMs: 2 },
      ],
    })
    expect(pack.plainText).toContain('Báo giá.docx')
    expect(pack.plainText).toContain('Đoạn trích:')
    expect(pack.plainText).toContain('khách ABC')
    expect(pack.plainText).toContain('Ghi nhớ trợ lý')
    expect(pack.plainText).toContain('Call client')
    expect(pack.plainText).toContain('Standup')
    expect(pack.plainText).toContain('a.docx')
    expect(pack.chunks.some((c) => c.id === 'personal')).toBe(true)
    expect(pack.charCount).toBeGreaterThan(40)
  })
})
