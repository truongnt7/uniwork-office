import { describe, expect, it } from 'vitest'
import { parseEmailDraftText } from '../src/renderer/src/my-ai-email-draft'

describe('parseEmailDraftText', () => {
  it('fills subject and a polite body for a short ask', () => {
    const r = parseEmailDraftText('Nháp email về yêu cầu chứng từ tháng 9', true)
    expect(r.subject).toMatch(/chứng từ|tháng 9/i)
    expect(r.body.length).toBeGreaterThan(10)
    expect(r.body).toMatch(/Xin chào|Trân trọng/)
  })

  it('captures to address and subject/body split', () => {
    const r = parseEmailDraftText(
      'Draft email to client@acme.com: Invoice follow-up\nPlease send the signed PDF.',
      false,
    )
    expect(r.to).toBe('client@acme.com')
    expect(r.subject).toMatch(/Invoice/i)
    expect(r.body).toMatch(/signed PDF/)
  })
})
