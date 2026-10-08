/**
 * Parse My AI / Workbench “add email draft” text into subject + body (+ optional to).
 */
export interface ParsedEmailDraft {
  subject: string
  body: string
  to?: string
}

function stripNoise(raw: string): string {
  return raw
    .replace(
      /^(?:nháp\s+)?(?:email|mail|thư)\s*(?:draft|nháp)?\s*[:：-]?\s*/i,
      '',
    )
    .replace(/^(?:soạn|soan|tạo|tao|viết|viet|draft|create)\s+/i, '')
    .replace(/^(?:email|mail|thư)\s+/i, '')
    .trim()
}

/**
 * Heuristic: optional `to:`, first line / “về …” → subject, remainder → body.
 * Short one-liners get a short polite body that repeats the ask.
 */
export function parseEmailDraftText(text: string, vi = true): ParsedEmailDraft {
  const raw = text.trim()
  if (!raw) {
    return {
      subject: vi ? 'Không tiêu đề' : 'Untitled',
      body: '',
    }
  }

  let rest = stripNoise(raw)
  let to: string | undefined
  const toInline = rest.match(
    /(?:^|\s)(?:to|tới|toi|cho|gửi|gui)\s*:?\s*([\w.+-]+@[\w.-]+\.\w+)\b/i,
  )
  if (toInline?.[1]) {
    to = toInline[1]
    rest = rest.replace(toInline[0], ' ').replace(/\s+/g, ' ').trim()
  } else {
    const bare = rest.match(/\b([\w.+-]+@[\w.-]+\.\w+)\b/)
    if (bare?.[1]) {
      to = bare[1]
      rest = rest.replace(bare[0], ' ').replace(/\s+/g, ' ').trim()
    }
  }

  const about = rest.match(
    /^(?:về|ve|about|re|subject|tiêu đề|tieu de)\s*[:：]?\s*(.+)$/i,
  )
  if (about?.[1]) rest = about[1].trim()

  let subject = ''
  let body = ''

  if (rest.includes('\n')) {
    const lines = rest.split(/\n/)
    subject = (lines[0] ?? '').trim()
    body = lines.slice(1).join('\n').trim()
  } else {
    const dash = rest.split(/\s+[—–-]\s+/)
    if (dash.length >= 2) {
      subject = dash[0]!.trim()
      body = dash.slice(1).join(' — ').trim()
    } else {
      subject = rest.slice(0, 120).trim() || (vi ? 'Không tiêu đề' : 'Untitled')
    }
  }

  if (!subject) subject = vi ? 'Không tiêu đề' : 'Untitled'

  if (!body) {
    body = vi
      ? [
          'Xin chào,',
          '',
          subject === 'Không tiêu đề' ? '…' : subject,
          '',
          'Trân trọng,',
        ].join('\n')
      : ['Hi,', '', subject === 'Untitled' ? '…' : subject, '', 'Best regards,'].join('\n')
  }

  return { subject, body, ...(to ? { to } : {}) }
}
