import { describe, expect, it } from 'vitest'
import { answerMyAiLocally, type LocalAnswerSnapshot } from '../src/renderer/src/my-ai-local-answer'

const empty: LocalAnswerSnapshot = {
  tasks: [],
  calendar: [],
  notes: '',
  emails: [],
  recents: [],
}

describe('answerMyAiLocally', () => {
  const now = new Date('2026-10-08T08:00:00')

  it('answers today pulse from calendar + tasks (no LLM)', () => {
    const snap: LocalAnswerSnapshot = {
      ...empty,
      calendar: [
        { date: '2026-10-08', title: 'Họp khách A' },
        { date: '2026-10-09', title: 'Review' },
      ],
      tasks: [
        { title: 'Gửi báo giá', done: false },
        { title: 'Xong rồi', done: true },
      ],
      recents: [{ name: 'BaoGia.docx', ext: 'docx' }],
    }
    const r = answerMyAiLocally('Hôm nay có gì?', snap, true, now)
    expect(r.topic).toBe('pulse')
    expect(r.contextUsed).toBe(true)
    expect(r.text).toMatch(/Họp khách A/)
    expect(r.text).toMatch(/Gửi báo giá/)
    expect(r.text).not.toMatch(/Xong rồi/)
    expect(r.text).toMatch(/BaoGia/)
    expect(r.text).not.toMatch(/Token|Hub|bước/i)
  })

  it('morning brief ranks tasks + unread email', () => {
    const snap: LocalAnswerSnapshot = {
      ...empty,
      calendar: [{ date: '2026-10-08', title: 'Standup' }],
      tasks: [
        { title: 'Gọi khách', done: false, priority: 'urgent' },
        { title: 'Đọc báo', done: false, priority: 'low' },
      ],
      emails: [
        {
          subject: 'Hợp đồng',
          folder: 'inbox',
          from: 'a@x.com',
          unread: true,
          starred: true,
        },
        { subject: 'Spam', folder: 'inbox', unread: false },
      ],
      recents: [{ name: 'Plan.docx', ext: 'docx' }],
    }
    const r = answerMyAiLocally('Hôm nay của tôi', snap, true, now)
    expect(r.topic).toBe('brief')
    expect(r.text).toMatch(/Standup/)
    expect(r.text.indexOf('Gọi khách')).toBeLessThan(r.text.indexOf('Đọc báo'))
    expect(r.text).toMatch(/Hợp đồng/)
    expect(r.offerAi).toBe(false)
  })

  it('prioritizes week plan on device (no longer fallback-only)', () => {
    const snap: LocalAnswerSnapshot = {
      ...empty,
      tasks: [
        { title: 'Low thing', done: false, priority: 'low' },
        { title: 'Ship deck', done: false, priority: 'high', dueDate: '2026-10-09' },
      ],
      calendar: [
        { date: '2026-10-08', title: 'Kickoff' },
        { date: '2026-10-12', title: 'Review' },
      ],
    }
    const r = answerMyAiLocally(
      'Giúp mình sắp xếp công việc tuần này theo ưu tiên',
      snap,
      true,
      now,
    )
    expect(r.topic).toBe('plan')
    expect(r.contextUsed).toBe(true)
    expect(r.text).toMatch(/Ship deck/)
    expect(r.text.indexOf('Ship deck')).toBeLessThan(r.text.indexOf('Low thing'))
    expect(r.text).toMatch(/Kickoff/)
    expect(r.text).toMatch(/Review/)
  })

  it('triages email unread and starred first', () => {
    const snap: LocalAnswerSnapshot = {
      ...empty,
      emails: [
        { subject: 'Old', folder: 'inbox', unread: false },
        { subject: 'Need reply', folder: 'inbox', from: 'b@y.com', unread: true, starred: true },
        { subject: 'Draft', folder: 'drafts', unread: true },
      ],
    }
    const r = answerMyAiLocally('Triage email — đọc gì trước?', snap, true, now)
    expect(r.topic).toBe('email')
    expect(r.text).toMatch(/Need reply/)
    expect(r.text.indexOf('Need reply')).toBeLessThan(r.text.indexOf('Old'))
  })

  it('lists open tasks', () => {
    const snap: LocalAnswerSnapshot = {
      ...empty,
      tasks: [{ title: 'Follow-up', done: false }],
    }
    const r = answerMyAiLocally('Việc đang mở là gì?', snap, true, now)
    expect(r.topic).toBe('tasks')
    expect(r.text).toMatch(/Follow-up/)
    expect(r.offerAi).toBe(false)
  })

  it('lists recent files', () => {
    const snap: LocalAnswerSnapshot = {
      ...empty,
      recents: [{ name: 'Q3.xlsx', ext: 'xlsx' }],
    }
    const r = answerMyAiLocally('File gần đây?', snap, true, now)
    expect(r.topic).toBe('recents')
    expect(r.text).toMatch(/Q3\.xlsx/)
  })

  it('soft-redirects off-topic without inventing facts', () => {
    const r = answerMyAiLocally('Ý nghĩa cuộc sống là gì?', empty, true, now)
    expect(r.topic).toBe('off_topic')
    expect(r.contextUsed).toBe(false)
    expect(r.offerAi).toBe(false)
    expect(r.text).toMatch(/UniWork|lịch|Word/i)
  })

  it('English today calendar', () => {
    const snap: LocalAnswerSnapshot = {
      ...empty,
      calendar: [{ date: '2026-10-08', title: 'Standup' }],
    }
    const r = answerMyAiLocally("What's on my calendar today?", snap, false, now)
    expect(r.topic).toBe('calendar')
    expect(r.text).toMatch(/Standup/)
  })
})
