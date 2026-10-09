import { describe, expect, it } from 'vitest'
import {
  extractJsonObject,
  parseSummaryArtifact,
  summaryFromPlainText,
  summaryToPlainText,
  summaryToSlideBrief,
} from '../src/renderer/src/my-ai-summary'

describe('My AI structured summary', () => {
  it('parses JSON artifact with chart', () => {
    const raw = JSON.stringify({
      title: 'Đề án A',
      sections: [
        { heading: 'Định vị', bullets: ['Nền tảng số'] },
        { heading: 'Vấn đề', bullets: ['Rời rạc'] },
      ],
      nextActions: ['Lưu ghi chú'],
      chart: {
        type: 'bar',
        title: 'Cấu trúc',
        items: [
          { label: 'Hiện trạng', value: 3 },
          { label: 'Giải pháp', value: 5 },
        ],
      },
    })
    const a = parseSummaryArtifact(raw, { kicker: 'Tóm tắt', footnote: 'local' })
    expect(a.title).toBe('Đề án A')
    expect(a.sections).toHaveLength(2)
    expect(a.chart?.type).toBe('bar')
    expect(a.chart?.items).toHaveLength(2)
    expect(a.kicker).toBe('Tóm tắt')
  })

  it('extracts JSON from fenced output', () => {
    const raw = 'Here you go:\n```json\n{"title":"X","sections":[{"heading":"A","bullets":["1"]}],"nextActions":[]}\n```'
    expect(extractJsonObject(raw)).toMatchObject({ title: 'X' })
  })

  it('falls back from markdown-ish plain text', () => {
    const a = summaryFromPlainText(
      [
        'Nguyễn Ngọc Long.',
        '**Định vị:** Nền tảng số',
        '**Vấn đề đặt ra:** Phân mảnh',
        'Việc có thể làm tiếp',
        '• Lưu vào Notes',
      ].join('\n'),
      { vi: true },
    )
    expect(a.title).toMatch(/Nguyễn/)
    expect(a.sections.length).toBeGreaterThanOrEqual(1)
    expect(summaryToPlainText(a)).toContain('Định vị')
  })

  it('drops invalid single-item charts', () => {
    const a = parseSummaryArtifact(
      JSON.stringify({
        title: 'T',
        sections: [{ heading: 'H', bullets: ['b'] }],
        nextActions: [],
        chart: { type: 'donut', title: 'X', items: [{ label: 'Only', value: 1 }] },
      }),
    )
    expect(a.chart).toBeNull()
  })

  it('builds a slide brief from a summary/report', () => {
    const a = parseSummaryArtifact(
      JSON.stringify({
        title: 'Báo cáo Q3',
        sections: [
          { heading: 'Kết quả', bullets: ['Doanh thu tăng 12%'] },
          { heading: 'Rủi ro', bullets: ['Chi phí marketing'] },
        ],
        nextActions: ['Họp tuần tới'],
        chart: {
          type: 'bar',
          title: 'Doanh thu',
          items: [
            { label: 'Q2', value: 100 },
            { label: 'Q3', value: 112 },
          ],
        },
      }),
    )
    const brief = summaryToSlideBrief(a, true)
    expect(brief).toContain('generate_deck')
    expect(brief).toContain('Báo cáo Q3')
    expect(brief).toContain('Kết quả')
    expect(brief).toContain('Doanh thu tăng 12%')
    expect(brief).toContain('Q3')
    expect(brief).toContain('Họp tuần tới')
  })
})
