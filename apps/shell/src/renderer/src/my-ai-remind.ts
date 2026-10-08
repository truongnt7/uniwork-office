/**
 * Parse “remind me / nhắc tôi / deadline” phrases into a title + ISO date.
 */
export interface ParsedSchedule {
  title: string
  /** YYYY-MM-DD */
  date: string
  /** True when the user uttered an explicit day / relative date */
  usedDateToken: boolean
}

function todayIso(now: Date): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(now: Date, n: number): string {
  const t = new Date(now)
  t.setDate(t.getDate() + n)
  return todayIso(t)
}

/** JS getDay(): 0 Sun … 6 Sat → next occurrence (today if same weekday and keepToday). */
function nextWeekday(now: Date, target: number, keepToday = true): string {
  const cur = now.getDay()
  let delta = (target - cur + 7) % 7
  if (delta === 0 && !keepToday) delta = 7
  return addDays(now, delta)
}

function stripNoise(raw: string): string {
  return raw
    .replace(
      /^(?:nhắc(?:\s+tôi)?|nhac(?:\s+toi)?|remind(?:\s+me)?|đặt nhắc|dat nhac|deadline|hạn(?:\s+chót)?|han(?:\s+chot)?)\s*[:：-]?\s*/i,
      '',
    )
    .replace(/^(?:thêm|them|add)\s+(?:việc|viec|task|todo)\s*/i, '')
    .replace(/^(?:vào|vao|lúc|luc|on|by|for|to)\s+/i, '')
    .trim()
}

/**
 * Extract a schedule date + cleaned title from NL (VI/EN).
 * Defaults date to today when no token is found (usedDateToken=false).
 */
export function parseScheduleFromText(text: string, now = new Date()): ParsedSchedule {
  const raw = text.trim()
  if (!raw) {
    return { title: 'Untitled', date: todayIso(now), usedDateToken: false }
  }

  let rest = stripNoise(raw)
  let date = todayIso(now)
  let usedDateToken = false

  const take = (re: RegExp, resolve: (m: RegExpExecArray) => string | null) => {
    const m = re.exec(rest)
    if (!m) return
    const resolved = resolve(m)
    if (!resolved) return
    date = resolved
    usedDateToken = true
    rest = `${rest.slice(0, m.index)} ${rest.slice(m.index + m[0].length)}`.replace(/\s+/g, ' ').trim()
  }

  take(/\b(hôm nay|hom nay|today)\b/i, () => todayIso(now))
  take(/\b(ngày mai|ngay mai|tomorrow)\b/i, () => addDays(now, 1))
  take(/\b(tuần sau|tuan sau|next week)\b/i, () => addDays(now, 7))

  // ISO / numeric dates
  take(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/, (m) => {
    const y = Number(m[1])
    const mo = String(Number(m[2])).padStart(2, '0')
    const d = String(Number(m[3])).padStart(2, '0')
    return `${y}-${mo}-${d}`
  })
  take(/\b(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?\b/, (m) => {
    const d = String(Number(m[1])).padStart(2, '0')
    const mo = String(Number(m[2])).padStart(2, '0')
    let y = m[3] ? Number(m[3]) : now.getFullYear()
    if (y < 100) y += 2000
    return `${y}-${mo}-${d}`
  })

  // Weekdays VI (thứ 2…CN) / EN
  const weekdays: { re: RegExp; day: number }[] = [
    { re: /\b(chủ nhật|chu nhat|sunday|sun)\b/i, day: 0 },
    { re: /\b(thứ\s*hai|thu\s*hai|monday|mon)\b/i, day: 1 },
    { re: /\b(thứ\s*ba|thu\s*ba|tuesday|tue)\b/i, day: 2 },
    { re: /\b(thứ\s*tư|thu\s*tu|wednesday|wed)\b/i, day: 3 },
    { re: /\b(thứ\s*năm|thu\s*nam|thursday|thu)\b/i, day: 4 },
    { re: /\b(thứ\s*sáu|thu\s*sau|friday|fri)\b/i, day: 5 },
    { re: /\b(thứ\s*bảy|thu\s*bay|saturday|sat)\b/i, day: 6 },
  ]
  for (const w of weekdays) {
    if (usedDateToken) break
    take(w.re, () => nextWeekday(now, w.day, true))
  }

  rest = rest
    .replace(/^(?:vào|vao|lúc|luc|ngày|ngay|on|by|for|to|:|—|-)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  const title = rest.slice(0, 160) || raw.slice(0, 160)
  return { title, date, usedDateToken }
}

/** Prefer calendar row for “remind me / nhắc” phrasing. */
export function prefersCalendarRemind(text: string): boolean {
  const lower = text.toLowerCase()
  return /(?:nhắc(?:\s+tôi)?|nhac(?:\s+toi)?|remind(?:\s+me)?|đặt nhắc|dat nhac|lịch(?:\s+họp)?|lich(?:\s+hop)?|meeting|cuộc họp|cuoc hop)/i.test(
    lower,
  )
}
