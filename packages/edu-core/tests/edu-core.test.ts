import { describe, expect, it } from 'vitest'
import {
  createEduMeta,
  eduTemplateHtml,
  eduWorkflowPrompt,
  isEduMeta,
  packDisplayName,
} from '../src/index.js'

describe('edu-core', () => {
  it('creates meta and display name', () => {
    const meta = createEduMeta({
      subject: 'Toán',
      grade: 'Lớp 6',
      week: 'Tuần 12',
      lessonTitle: 'Phân số',
      durationMinutes: 45,
      objectives: ['Nhận biết phân số'],
    })
    expect(meta.kind).toBe('education')
    expect(isEduMeta(meta)).toBe(true)
    expect(packDisplayName(meta)).toContain('Phân số')
  })

  it('builds giáo án HTML outline', () => {
    const meta = createEduMeta({
      subject: 'Văn',
      grade: 'Lớp 8',
      lessonTitle: 'Nghị luận',
    })
    const html = eduTemplateHtml('giao-an', meta)
    expect(html).toContain('GIÁO ÁN')
    expect(html).toContain('Nghị luận')
  })

  it('builds workflow prompts in Vietnamese', () => {
    const meta = createEduMeta({
      subject: 'Toán',
      grade: 'Lớp 6',
      lessonTitle: 'Phân số',
    })
    expect(eduWorkflowPrompt('draft-lesson-plan', meta)).toContain('giáo án')
    expect(eduWorkflowPrompt('slides-from-plan', meta)).toContain('slide')
    expect(eduWorkflowPrompt('worksheet-from-plan', meta)).toContain('phiếu')
  })
})
