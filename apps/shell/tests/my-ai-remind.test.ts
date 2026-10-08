import { describe, expect, it } from 'vitest'
import { parseScheduleFromText, prefersCalendarRemind } from '../src/renderer/src/my-ai-remind'
import { routeMyAiText } from '../src/renderer/src/my-ai-router'

describe('parseScheduleFromText', () => {
  const now = new Date('2026-10-08T08:00:00') // Thursday

  it('parses Vietnamese weekday remind', () => {
    const r = parseScheduleFromText('Nhắc tôi thứ sáu gửi báo cáo tuần', now)
    expect(r.usedDateToken).toBe(true)
    expect(r.date).toBe('2026-10-09') // Friday (now = Thu 2026-10-08)
    expect(r.title).toMatch(/báo cáo/i)
  })

  it('parses English tomorrow deadline', () => {
    const r = parseScheduleFromText('Deadline tomorrow: submit invoice', now)
    expect(r.date).toBe('2026-10-09')
    expect(r.title).toMatch(/invoice/i)
  })

  it('parses dd/mm date', () => {
    const r = parseScheduleFromText('Hạn nộp 15/10 nộp thuế', now)
    expect(r.date).toBe('2026-10-15')
    expect(r.usedDateToken).toBe(true)
  })
})

describe('remind routing', () => {
  it('routes nhắc tôi to calendar add_item', () => {
    const r = routeMyAiText('Nhắc tôi thứ sáu gửi báo cáo', { practiceId: 'sales' })
    expect(r.kind).toBe('workbench')
    if (r.kind === 'workbench') {
      expect(r.intent.action).toBe('add_item')
      expect(r.intent.target).toEqual({ kind: 'module', id: 'calendar' })
    }
    expect(prefersCalendarRemind('Nhắc tôi thứ sáu')).toBe(true)
  })

  it('routes deadline-only to tasks', () => {
    const r = routeMyAiText('Deadline tomorrow submit invoice', { practiceId: 'sales' })
    expect(r.kind).toBe('workbench')
    if (r.kind === 'workbench') {
      expect(r.intent.target).toEqual({ kind: 'module', id: 'tasks' })
    }
  })
})
