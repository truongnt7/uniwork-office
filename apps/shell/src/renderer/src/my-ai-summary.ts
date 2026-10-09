/**
 * Structured My AI summary artifacts — parse JSON from the model, fall back to
 * markdown-ish text, render as cards + optional chart.
 */

export interface MyAiSummaryChartItem {
  label: string
  value: number
}

export interface MyAiSummaryChart {
  type: 'bar' | 'donut'
  title: string
  items: MyAiSummaryChartItem[]
}

export interface MyAiSummarySection {
  heading: string
  bullets: string[]
}

export interface MyAiSummaryArtifact {
  title: string
  kicker?: string
  sections: MyAiSummarySection[]
  nextActions: string[]
  chart?: MyAiSummaryChart | null
  footnote?: string
}

const MAX_SECTIONS = 8
const MAX_BULLETS = 12
const MAX_ACTIONS = 8
const MAX_CHART = 8

export function summarySystemPrompt(vi: boolean, contextSlice: string): string {
  const schema = `{
  "title": "short title",
  "sections": [{"heading": "section title", "bullets": ["point", "..."]}],
  "nextActions": ["concrete next step", "..."],
  "chart": null
}`
  if (vi) {
    return [
      'Bạn là trợ lý desktop UniWork. Tóm tắt nội dung THẬT từ excerpt/tệp — không bịa.',
      'Trả về ĐÚNG một JSON (không markdown, không giải thích ngoài JSON) theo schema:',
      schema,
      'Quy tắc:',
      '- sections: 2–5 mục có heading rõ (vd Định vị, Vấn đề, Giải pháp, Cấu trúc).',
      '- bullets ngắn, một ý/điểm.',
      '- nextActions: 2–4 việc có thể làm tiếp trên Workbench (ghi chú, task, email…).',
      '- chart: chỉ khi có số liệu / tỉ lệ / số mục có thể đếm. Dạng {"type":"bar"|"donut","title":"...","items":[{"label":"...","value":number}]}. value > 0; 2–6 mục; label ngắn. bar = so sánh số lượng; donut = tỉ lệ/phần trăm. Không có số liệu → chart: null.',
      '- Nếu không đọc được nội dung: title giải thích + 1 section + nextActions gợi ý thử file khác.',
      contextSlice ? `\nNgữ cảnh máy:\n${contextSlice}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }
  return [
    'You are a UniWork desktop assistant. Summarize REAL content from excerpts/files — do not invent.',
    'Return EXACTLY one JSON object (no markdown fences, no prose) matching:',
    schema,
    'Rules:',
    '- sections: 2–5 clear headings.',
    '- bullets: short, one idea each.',
    '- nextActions: 2–4 concrete follow-ups.',
    '- chart: only when there are counts/ratios (2–6 short-label items). bar = compare amounts; donut = share/ratio. Else null.',
    '- If unreadable: explain in title + one section + nextActions.',
    contextSlice ? `\nOn-device context:\n${contextSlice}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function clampStr(s: string, n: number): string {
  const t = s.trim()
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}

function normalizeChart(raw: unknown): MyAiSummaryChart | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Record<string, unknown>
  const type = c.type === 'donut' ? 'donut' : c.type === 'bar' ? 'bar' : null
  if (!type) return null
  const title = typeof c.title === 'string' ? clampStr(c.title, 80) : ''
  if (!Array.isArray(c.items)) return null
  const items: MyAiSummaryChartItem[] = []
  for (const it of c.items.slice(0, MAX_CHART)) {
    if (!it || typeof it !== 'object') continue
    const row = it as Record<string, unknown>
    const label = typeof row.label === 'string' ? clampStr(row.label, 40) : ''
    const value = typeof row.value === 'number' && Number.isFinite(row.value) ? row.value : NaN
    if (!label || !(value > 0)) continue
    items.push({ label, value })
  }
  if (items.length < 2) return null
  return { type, title: title || (type === 'donut' ? 'Mix' : 'Breakdown'), items }
}

function normalizeArtifact(raw: unknown, meta?: { kicker?: string; footnote?: string }): MyAiSummaryArtifact | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const title = typeof o.title === 'string' ? clampStr(o.title, 160) : ''
  if (!title) return null
  const sections: MyAiSummarySection[] = []
  if (Array.isArray(o.sections)) {
    for (const s of o.sections.slice(0, MAX_SECTIONS)) {
      if (!s || typeof s !== 'object') continue
      const sec = s as Record<string, unknown>
      const heading = typeof sec.heading === 'string' ? clampStr(sec.heading, 80) : ''
      const bullets: string[] = []
      if (Array.isArray(sec.bullets)) {
        for (const b of sec.bullets.slice(0, MAX_BULLETS)) {
          if (typeof b === 'string' && b.trim()) bullets.push(clampStr(b, 280))
        }
      }
      if (heading && bullets.length) sections.push({ heading, bullets })
    }
  }
  const nextActions: string[] = []
  if (Array.isArray(o.nextActions)) {
    for (const a of o.nextActions.slice(0, MAX_ACTIONS)) {
      if (typeof a === 'string' && a.trim()) nextActions.push(clampStr(a, 160))
    }
  }
  if (sections.length === 0 && nextActions.length === 0) return null
  return {
    title,
    ...(meta?.kicker ? { kicker: meta.kicker } : {}),
    sections,
    nextActions,
    chart: normalizeChart(o.chart),
    ...(meta?.footnote ? { footnote: meta.footnote } : {}),
  }
}

/** Extract first JSON object from model output. */
export function extractJsonObject(text: string): unknown | null {
  const raw = text.trim()
  if (!raw) return null
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw)
  const candidate = (fenced?.[1] ?? raw).trim()
  try {
    return JSON.parse(candidate)
  } catch {
    /* find outermost braces */
  }
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(candidate.slice(start, end + 1))
  } catch {
    return null
  }
}

/** Heuristic: turn plain/markdown summary text into a card. */
export function summaryFromPlainText(
  text: string,
  meta?: { title?: string; kicker?: string; footnote?: string; vi?: boolean },
): MyAiSummaryArtifact {
  const vi = meta?.vi !== false
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  let title = meta?.title?.trim() || ''
  const sections: MyAiSummarySection[] = []
  const nextActions: string[] = []
  let current: MyAiSummarySection | null = null

  const flush = () => {
    if (current && current.bullets.length) sections.push(current)
    current = null
  }

  const isNextHeading = (s: string) =>
    /^(?:\*\*)?(?:việc có thể làm tiếp|next(?:\s+steps?|\s+actions?)|làm tiếp)/i.test(
      s.replace(/\*\*/g, ''),
    )

  for (const line of lines) {
    const cleaned = line
      .replace(/^#{1,3}\s+/, '')
      .replace(/^\*\*(.+)\*\*:?\s*$/, '$1')
      .replace(/^_(.+)_$/, '$1')
      .trim()

    if (!title && !cleaned.startsWith('•') && !cleaned.startsWith('-') && !cleaned.startsWith('*')) {
      if (cleaned.length < 120 && !cleaned.startsWith('(')) {
        title = cleaned.replace(/\*\*/g, '')
        continue
      }
    }

    if (isNextHeading(cleaned)) {
      flush()
      current = null
      continue
    }

    const headingMatch =
      /^(?:\*\*)?([^:*]{2,60})(?:\*\*)?\s*:\s*(.*)$/.exec(cleaned) ||
      /^#{1,3}\s+(.+)$/.exec(cleaned)
    if (
      headingMatch &&
      !cleaned.startsWith('•') &&
      !cleaned.startsWith('-') &&
      headingMatch[1] &&
      headingMatch[1].length < 60
    ) {
      const h = headingMatch[1].replace(/\*\*/g, '').trim()
      const rest = (headingMatch[2] ?? '').trim()
      if (isNextHeading(h)) {
        flush()
        if (rest) nextActions.push(clampStr(rest.replace(/^\*\*/, '').replace(/\*\*$/, ''), 160))
        current = null
        continue
      }
      flush()
      current = { heading: h, bullets: [] }
      if (rest) current.bullets.push(clampStr(rest.replace(/^\*\*/, '').replace(/\*\*$/, ''), 280))
      continue
    }

    const bullet = cleaned.replace(/^[-*•]\s+/, '').replace(/^\*\*(.+?)\*\*\s*[:：]?\s*/, '$1: ')
    if (/^[-*•]\s+/.test(cleaned) || (current && bullet)) {
      if (current) current.bullets.push(clampStr(bullet, 280))
      else if (sections.length === 0) {
        current = {
          heading: vi ? 'Điểm chính' : 'Key points',
          bullets: [clampStr(bullet, 280)],
        }
      } else if (nextActions.length > 0 || !current) {
        // after next-actions heading without current section
        nextActions.push(clampStr(bullet, 160))
      }
      continue
    }

    if (cleaned.startsWith('(') || cleaned.startsWith('_(')) continue
    if (current) current.bullets.push(clampStr(cleaned.replace(/\*\*/g, ''), 280))
  }
  flush()

  if (sections.length === 0 && lines.length) {
    sections.push({
      heading: vi ? 'Tóm tắt' : 'Summary',
      bullets: lines
        .filter((l) => !l.startsWith('_') && !l.startsWith('('))
        .slice(0, 8)
        .map((l) => clampStr(l.replace(/^[-*•]\s+/, '').replace(/\*\*/g, ''), 280)),
    })
  }

  return {
    title: title || (vi ? 'Tóm tắt' : 'Summary'),
    ...(meta?.kicker ? { kicker: meta.kicker } : {}),
    sections,
    nextActions,
    chart: null,
    ...(meta?.footnote ? { footnote: meta.footnote } : {}),
  }
}

export function parseSummaryArtifact(
  raw: string,
  meta?: { title?: string; kicker?: string; footnote?: string; vi?: boolean },
): MyAiSummaryArtifact {
  const json = extractJsonObject(raw)
  const fromJson = normalizeArtifact(json, {
    kicker: meta?.kicker,
    footnote: meta?.footnote,
  })
  if (fromJson) {
    if (meta?.title && !fromJson.title) fromJson.title = meta.title
    return fromJson
  }
  return summaryFromPlainText(raw, meta)
}

export function summaryToPlainText(a: MyAiSummaryArtifact): string {
  const lines: string[] = []
  if (a.kicker) lines.push(a.kicker)
  lines.push(a.title)
  lines.push('')
  for (const s of a.sections) {
    lines.push(s.heading)
    for (const b of s.bullets) lines.push(`• ${b}`)
    lines.push('')
  }
  if (a.nextActions.length) {
    lines.push('Next')
    for (const n of a.nextActions) lines.push(`• ${n}`)
    lines.push('')
  }
  if (a.footnote) lines.push(a.footnote)
  return lines.join('\n').trim()
}

/**
 * Build an Slides AI preset brief from a My AI summary/report so generate_deck
 * can plan an outline (user still reviews before slides are created).
 */
export function summaryToSlideBrief(a: MyAiSummaryArtifact, vi: boolean): string {
  const title = a.title.trim() || (vi ? 'Báo cáo' : 'Report')
  const sectionCount = Math.max(1, a.sections.length)
  const hasChart = Boolean(a.chart && a.chart.items.length >= 2)
  const hasNext = a.nextActions.length > 0
  // title + sections + optional chart/data + closing/next ≈ pages
  const approxPages = Math.min(
    12,
    Math.max(4, 1 + sectionCount + (hasChart ? 1 : 0) + (hasNext ? 1 : 0)),
  )

  const structure = a.sections
    .slice(0, 8)
    .map((s, i) => {
      const bullets = s.bullets
        .slice(0, 6)
        .map((b) => `   - ${b}`)
        .join('\n')
      return `${i + 1}. ${s.heading}\n${bullets}`
    })
    .join('\n')

  const chartBlock =
    hasChart && a.chart
      ? [
          '',
          vi ? 'Số liệu (dùng cho 1 slide biểu đồ nếu phù hợp):' : 'Data (use on one chart slide if useful):',
          `Loại: ${a.chart.type} · ${a.chart.title}`,
          ...a.chart.items.slice(0, 8).map((it) => `- ${it.label}: ${it.value}`),
        ].join('\n')
      : ''

  const nextBlock =
    hasNext
      ? [
          '',
          vi ? 'Kết / việc tiếp theo (slide cuối):' : 'Close / next steps (final slide):',
          ...a.nextActions.slice(0, 6).map((n) => `- ${n}`),
        ].join('\n')
      : ''

  if (vi) {
    return [
      `Tạo bộ slide thuyết trình từ báo cáo/tóm tắt My AI dưới đây.`,
      `Dùng generate_deck với topic và khoảng ${approxPages} trang; để tôi xem/sửa dàn bài trước khi sinh slide.`,
      `Giữ đúng nội dung và số liệu — không bịa thêm. Mỗi mục cấu trúc ≈ 1–2 slide, tiêu đề rõ, bullet ngắn.`,
      `Phong cách: chuyên nghiệp, sạch, dễ trình bày.`,
      '',
      `Chủ đề: ${title}`,
      a.kicker ? `Ngữ cảnh: ${a.kicker}` : '',
      '',
      'Cấu trúc gợi ý:',
      structure || '- (tóm tắt ngắn)',
      chartBlock,
      nextBlock,
      a.footnote ? `\nGhi chú: ${a.footnote}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }

  return [
    `Create a presentation deck from the My AI report/summary below.`,
    `Use generate_deck with the topic and about ${approxPages} pages; let me review/edit the outline before generating slides.`,
    `Keep the content and numbers faithful — do not invent facts. Each structure section ≈ 1–2 slides, clear titles, short bullets.`,
    `Style: professional, clean, presentation-ready.`,
    '',
    `Topic: ${title}`,
    a.kicker ? `Context: ${a.kicker}` : '',
    '',
    'Suggested structure:',
    structure || '- (short summary)',
    chartBlock,
    nextBlock,
    a.footnote ? `\nNote: ${a.footnote}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

const EXPORT_SERIES = [
  '#4C8DFF',
  '#2BB673',
  '#FF8A5B',
  '#F5C542',
  '#9B7EDE',
  '#3ECFBE',
  '#FF6B8A',
] as const

/** Inline SVG for Docs export — self-contained (no CSS vars). */
function chartToExportSvg(chart: MyAiSummaryChart): string {
  const items = chart.items.slice(0, 8)
  if (items.length < 2) return ''
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  if (chart.type === 'donut') {
    const total = items.reduce((s, i) => s + i.value, 0) || 1
    const cx = 70
    const cy = 70
    const r = 48
    const stroke = 18
    const circ = 2 * Math.PI * r
    const gap = Math.min(4, circ / (items.length * 8))
    let offset = 0
    const arcs = items
      .map((it, i) => {
        const raw = (it.value / total) * circ
        const len = Math.max(0, raw - gap)
        const color = EXPORT_SERIES[i % EXPORT_SERIES.length]!
        const el = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-dasharray="${len} ${circ - len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`
        offset += raw
        return el
      })
      .join('')
    const legend = items
      .map((it, i) => {
        const color = EXPORT_SERIES[i % EXPORT_SERIES.length]!
        const pct = Math.round((it.value / total) * 100)
        return `<li style="margin:4px 0;list-style:none"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${color};margin-right:6px;vertical-align:middle"></span>${esc(it.label)} — ${it.value} (${pct}%)</li>`
      })
      .join('')
    return `<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin:8px 0 12px">
<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#E5E7EB" stroke-width="${stroke}"/>
${arcs}
<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="16" font-weight="700" fill="#111">${total}</text>
</svg>
<ul style="margin:0;padding:0">${legend}</ul>
</div>`
  }

  const max = Math.max(1, ...items.map((i) => i.value))
  const w = 360
  const h = 180
  const padL = 16
  const padR = 16
  const padT = 24
  const padB = 36
  const plotW = w - padL - padR
  const plotH = h - padT - padB
  const slot = plotW / items.length
  const barW = Math.max(16, Math.min(44, slot - 10))
  const bars = items
    .map((it, i) => {
      const bh = Math.max(4, (it.value / max) * (plotH - 6))
      const x = padL + i * slot + (slot - barW) / 2
      const y = padT + plotH - bh
      const color = EXPORT_SERIES[i % EXPORT_SERIES.length]!
      const label =
        it.label.length > 10 ? `${esc(it.label.slice(0, 9))}…` : esc(it.label)
      return `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="6" fill="${color}"/>
<text x="${x + barW / 2}" y="${y - 6}" text-anchor="middle" font-size="11" font-weight="650" fill="#111">${it.value}</text>
<text x="${x + barW / 2}" y="${h - 12}" text-anchor="middle" font-size="10" fill="#64748B">${label}</text>`
    })
    .join('\n')
  return `<div style="margin:8px 0 12px">
<svg width="100%" style="max-width:420px" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
<rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" rx="8" fill="#F8FAFC"/>
${bars}
</svg>
</div>`
}

export function summaryToHtml(a: MyAiSummaryArtifact, vi: boolean): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const parts: string[] = []
  if (a.kicker) parts.push(`<p><em>${esc(a.kicker)}</em></p>`)
  parts.push(`<h1>${esc(a.title)}</h1>`)
  for (const s of a.sections) {
    parts.push(`<h2>${esc(s.heading)}</h2>`)
    parts.push('<ul>')
    for (const b of s.bullets) parts.push(`<li>${esc(b)}</li>`)
    parts.push('</ul>')
  }
  if (a.nextActions.length) {
    parts.push(`<h2>${esc(vi ? 'Việc có thể làm tiếp' : 'Next actions')}</h2>`)
    parts.push('<ul>')
    for (const n of a.nextActions) parts.push(`<li>${esc(n)}</li>`)
    parts.push('</ul>')
  }
  if (a.chart && a.chart.items.length) {
    parts.push(`<h2>${esc(a.chart.title)}</h2>`)
    parts.push(chartToExportSvg(a.chart))
    parts.push('<ul>')
    for (const it of a.chart.items) {
      parts.push(`<li>${esc(it.label)}: ${it.value}</li>`)
    }
    parts.push('</ul>')
  }
  if (a.footnote) parts.push(`<p><em>${esc(a.footnote)}</em></p>`)
  return parts.join('\n')
}

/** Lightweight sanitize for history persistence. */
export function sanitizeSummaryForStorage(raw: unknown): MyAiSummaryArtifact | undefined {
  const a = normalizeArtifact(raw)
  if (!a) return undefined
  return {
    title: a.title.slice(0, 160),
    ...(typeof (raw as MyAiSummaryArtifact).kicker === 'string'
      ? { kicker: (raw as MyAiSummaryArtifact).kicker!.slice(0, 120) }
      : {}),
    sections: a.sections.slice(0, 6).map((s) => ({
      heading: s.heading.slice(0, 80),
      bullets: s.bullets.slice(0, 8).map((b) => b.slice(0, 240)),
    })),
    nextActions: a.nextActions.slice(0, 6).map((n) => n.slice(0, 120)),
    chart: a.chart
      ? {
          type: a.chart.type,
          title: a.chart.title.slice(0, 80),
          items: a.chart.items.slice(0, 6).map((i) => ({
            label: i.label.slice(0, 40),
            value: i.value,
          })),
        }
      : null,
    ...(typeof (raw as MyAiSummaryArtifact).footnote === 'string'
      ? { footnote: (raw as MyAiSummaryArtifact).footnote!.slice(0, 200) }
      : {}),
  }
}
