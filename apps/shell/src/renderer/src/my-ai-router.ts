/**
 * My AI router — single actions + multi-tool plans (B4).
 * Maps NL → create/open/search/summarize/workbench (no UI).
 */
import {
  createAgentIntent,
  resolveAgentIntentFromText,
  type AgentIntent,
  type PracticeId,
} from '@uniwork/practice-core'
import type { RecentEntry } from '../../shared/home-api'
import { matchPracticePlaybook } from './my-ai-playbooks'

export type OfficeApp = 'docs' | 'sheets' | 'slides' | 'pdf'

export type MyAiStep =
  | {
      kind: 'create_file'
      app: OfficeApp
      /** When set, Docs/Slides/Sheets/PDF open with AI auto-run preset */
      brief?: string
      blank: boolean
    }
  | {
      kind: 'open_file'
      query: string
    }
  | {
      kind: 'search_files'
      query: string
    }
  | {
      kind: 'summarize_recents'
      query?: string
      limit: number
    }
  | {
      /** Continue / instruct the last Office tab (even if Home/My AI is focused) */
      kind: 'continue_active'
      brief?: string
    }
  | {
      /** Summarize the last Office tab’s file (excerpt + AI) */
      kind: 'summarize_active'
    }
  | {
      kind: 'workbench'
      intent: AgentIntent
    }

export type MyAiRoute =
  | MyAiStep
  | {
      kind: 'plan'
      steps: MyAiStep[]
      summaryVi: string
      summaryEn: string
      /** Phase C playbook id when matched */
      playbookId?: string
    }
  | {
      kind: 'unknown'
      hintVi: string
      hintEn: string
    }

const MAX_PLAN_STEPS = 4

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '')
}

function norm(s: string): string {
  return stripDiacritics(s).toLowerCase().trim()
}

function fileName(pathOrName: string): string {
  return pathOrName.split(/[\\/]/).pop() ?? pathOrName
}

/** Score how well `query` matches a recent entry (higher = better). */
export function scoreRecentMatch(entry: RecentEntry, query: string): number {
  const q = norm(query)
  if (!q) return 0
  const name = norm(entry.name || fileName(entry.path))
  const base = name.replace(/\.[^.]+$/, '')
  if (name === q || base === q) return 100
  if (name.startsWith(q) || base.startsWith(q)) return 80
  if (name.includes(q) || base.includes(q)) return 60
  // token overlap
  const qTokens = q.split(/[\s._-]+/).filter((t) => t.length > 1)
  if (qTokens.length === 0) return 0
  let hits = 0
  for (const t of qTokens) {
    if (name.includes(t) || base.includes(t)) hits++
  }
  if (hits === 0) return 0
  return Math.round((hits / qTokens.length) * 50)
}

export interface ScoredRecent {
  entry: RecentEntry
  score: number
}

export function rankRecentsScored(
  entries: RecentEntry[],
  query: string,
  limit = 8,
): ScoredRecent[] {
  return entries
    .map((entry) => ({ entry, score: scoreRecentMatch(entry, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.entry.mtimeMs - a.entry.mtimeMs)
    .slice(0, limit)
}

export function rankRecents(entries: RecentEntry[], query: string, limit = 8): RecentEntry[] {
  return rankRecentsScored(entries, query, limit).map((x) => x.entry)
}

/**
 * True when open/search should ask the user to pick (close scores or weak top hit).
 */
export function isAmbiguousRecentMatch(scored: readonly ScoredRecent[]): boolean {
  if (scored.length <= 1) return false
  const top = scored[0]!.score
  const second = scored[1]!.score
  if (top >= 90 && top - second >= 15) return false
  if (top >= 80 && top - second >= 25) return false
  return top - second < 20 || top < 70
}

/** User text that should pull local Workbench context into create/summarize. */
export function wantsLocalContext(text: string): boolean {
  const lower = text.toLowerCase()
  return /\b(theo|dựa|dua vao|dựa vào|based on|from my|from the|ghi chú|ghi chu|notes?|task|công việc|cong viec|việc đang|email|lịch|lich|context|ngữ cảnh|ngu canh)\b/i.test(
    lower,
  )
}

function detectApp(lower: string): OfficeApp | null {
  if (
    /\b(pdf)\b/i.test(lower) ||
    lower.includes('file pdf') ||
    lower.includes('tài liệu pdf')
  ) {
    return 'pdf'
  }
  if (
    /\b(excel|xlsx|xlsm|spreadsheet|sheets?)\b/i.test(lower) ||
    lower.includes('bang tinh') ||
    lower.includes('bảng tính') ||
    lower.includes('bảng excel')
  ) {
    return 'sheets'
  }
  if (
    /\b(pptx|powerpoint|slides?|deck)\b/i.test(lower) ||
    lower.includes('thuyet trinh') ||
    lower.includes('thuyết trình') ||
    lower.includes('bài giảng slide')
  ) {
    return 'slides'
  }
  if (
    /\b(word|docx|document|docs?)\b/i.test(lower) ||
    lower.includes('van ban') ||
    lower.includes('văn bản') ||
    lower.includes('tai lieu word') ||
    lower.includes('tài liệu word')
  ) {
    return 'docs'
  }
  return null
}

function extractAfter(patterns: RegExp[], text: string): string {
  for (const re of patterns) {
    const m = re.exec(text)
    if (m?.[1]?.trim()) return m[1].trim()
  }
  return ''
}

function stripCreateNoise(text: string, app: OfficeApp | null): string {
  let s = text
  const junk = [
    /\b(tạo|tao|create|new|soạn|soan|viết|viet|draft|write|làm|lam)\b/gi,
    /\b(cho tôi|cho toi|giúp tôi|giup toi|please|help me)\b/gi,
    /\b(một|mot|a|an|the|cái|cai)\b/gi,
    /\b(file|tài liệu|tai lieu|document|workbook|deck)\b/gi,
    /\b(mới|moi|blank|trống|trong)\b/gi,
  ]
  if (app === 'docs') {
    junk.push(/\b(word|docx|docs?|văn bản|van ban)\b/gi)
  } else if (app === 'sheets') {
    junk.push(/\b(excel|xlsx|spreadsheet|sheets?|bảng tính|bang tinh)\b/gi)
  } else if (app === 'slides') {
    junk.push(/\b(pptx|powerpoint|slides?|thuyết trình|thuyet trinh)\b/gi)
  } else if (app === 'pdf') {
    junk.push(/\b(pdf)\b/gi)
  }
  for (const re of junk) s = s.replace(re, ' ')
  return s
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[:\-–—|]+\s*/, '')
    .trim()
}

function looksLikeCreate(lower: string): boolean {
  return (
    /\b(tạo|tao|create|new|soạn|soan|viết|viet|draft|write)\b/i.test(lower) ||
    lower.includes('van ban moi') ||
    lower.includes('văn bản mới') ||
    lower.includes('bang tinh moi') ||
    lower.includes('bảng tính mới') ||
    lower.includes('thuyet trinh moi') ||
    lower.includes('thuyết trình mới') ||
    lower.includes('file pdf moi') ||
    lower.includes('file pdf mới')
  )
}

function looksLikeOpenFile(lower: string): boolean {
  // "đang mở" must not count as the open-file verb (ASCII `\b` breaks on Vietnamese).
  if (/(?:đang mở|dang mo)/i.test(lower) && !/(?:mở file|mo file|open file)/i.test(lower)) {
    return false
  }
  return (
    /(?:mở file|mo file|open file|mở tài liệu|mo tai lieu|open document|mở doc|open doc)/i.test(
      lower,
    ) ||
    /(?:^|[\s,;])(?:mở|mo|open)\s+.+\.(docx|xlsx|xlsm|pptx|pdf|md|html)\b/i.test(lower) ||
    (/(?:^|[\s,;])(?:mở|mo|open)(?:\s|$)/i.test(lower) &&
      /(?:file|tài liệu|tai lieu|báo cáo|bao cao|hợp đồng|hop dong|report|contract)/i.test(lower) &&
      !looksLikeCreate(lower))
  )
}

function looksLikeSearch(lower: string): boolean {
  return /\b(tìm file|tim file|tìm kiếm file|tim kiem file|search file|find file|tìm tài liệu|tim tai lieu)\b/i.test(
    lower,
  )
}

function looksLikeSummarizeRecents(lower: string): boolean {
  const sum = /\b(tóm tắt|tom tat|summarize|summary|tổng hợp|tong hop)\b/i.test(lower)
  if (!sum) return false
  if (looksLikeSummarizeActive(lower)) return false
  return /\b(file|recent|gần đây|gan day|tài liệu|tai lieu|recents?)\b/i.test(lower)
}

function looksLikeContinueActive(lower: string): boolean {
  // Avoid `\b` around Vietnamese (JS word-boundary is ASCII-only).
  return (
    /(?:^|[\s,;])(?:tiếp tục|tiep tuc|continue|keep (?:working|editing)|resume)(?:\s|:|$)/i.test(
      lower,
    ) ||
    /(?:trên|tren|on)\s+(?:file|tab|document)\s+(?:này|nay|nầy|this|đang mở|dang mo)/i.test(
      lower,
    ) ||
    /(?:file|tab)\s+(?:đang mở|dang mo|này|this|active)/i.test(lower) ||
    /active\s+(?:file|tab|document)/i.test(lower)
  )
}

function looksLikeSummarizeActive(lower: string): boolean {
  const sum = /(?:tóm tắt|tom tat|summarize|summary|tổng hợp|tong hop)/i.test(lower)
  if (!sum) return false
  // Recents summarize is a different route
  if (/(?:gần đây|gan day|recents?)/i.test(lower)) return false
  return /(?:đang mở|dang mo|tab này|tab nay|file này|file nay|this\s+(?:file|tab|document)|active\s+(?:file|tab|document)|open\s+tab)/i.test(
    lower,
  )
}

/** Split compound NL on conjunctions / action-comma (B4).
 * Avoid `\b` after Vietnamese (JS word-boundary is ASCII-only). */
export function splitMyAiClauses(text: string): string[] {
  const raw = text.trim()
  if (!raw) return []
  const parts = raw
    .split(
      /\s*(?:,\s*(?=(?:thêm|tạo|soạn|viết|mở|tìm|tóm\s*tắt|add|create|draft|write|open|find|summarize)(?:\s|:|$))|\s+(?:và rồi|sau đó|and then|và|rồi|then|also|and)\s+)\s*/i,
    )
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.length >= 2 ? parts : [raw]
}

/**
 * Peel trailing “thêm công việc…” / “mở tab…” companions from a create-heavy sentence.
 */
export function extractCompanionClauses(text: string): { head: string; companions: string[] } {
  let rest = text.trim()
  const companions: string[] = []

  const openTab =
    /(?:^|[\s,;]|(?:\b(?:và|rồi|then|and)\b)\s+)mở\s+(?:tab\s+)?(?!file\b)([^\n]+)$/i.exec(rest)
  if (openTab && openTab.index != null && !/\.(docx|xlsx|xlsm|pptx|pdf)\b/i.test(openTab[0]!)) {
    const target = openTab[1]!.trim()
    if (target.length >= 2) {
      companions.unshift(`Mở tab ${target}`)
      rest = rest.slice(0, openTab.index).trim()
    }
  }

  const task =
    /(?:^|[\s,;]|(?:\b(?:và|rồi|then|and)\b)\s+)(?:thêm\s+)?(?:công việc|cong viec|task|todo)\s*[:\-–]?\s*([^\n]+)$/i.exec(
      rest,
    )
  if (task && task.index != null) {
    const title = task[1]!.trim()
    if (title.length >= 2) {
      companions.unshift(`Thêm công việc ${title}`)
      rest = rest.slice(0, task.index).trim()
    }
  }

  const note =
    /(?:^|[\s,;]|(?:\b(?:và|rồi|then|and)\b)\s+)(?:thêm\s+)?(?:ghi chú|note)\s*[:\-–]?\s*([^\n]+)$/i.exec(
      rest,
    )
  if (note && note.index != null) {
    const title = note[1]!.trim()
    if (title.length >= 2) {
      companions.unshift(`Thêm ghi chú ${title}`)
      rest = rest.slice(0, note.index).trim()
    }
  }

  return { head: rest || text.trim(), companions }
}

function stepKey(step: MyAiStep): string {
  if (step.kind === 'create_file') return `create:${step.app}:${step.brief ?? ''}:${step.blank}`
  if (step.kind === 'open_file') return `open:${step.query}`
  if (step.kind === 'search_files') return `search:${step.query}`
  if (step.kind === 'summarize_recents') return `sum:${step.query ?? ''}:${step.limit}`
  if (step.kind === 'continue_active') return `continue:${step.brief ?? ''}`
  if (step.kind === 'summarize_active') return 'summarize_active'
  return `wb:${step.intent.action}:${step.intent.target.kind}:${'id' in step.intent.target ? step.intent.target.id : ''}:${step.intent.text ?? ''}`
}

function dedupeSteps(steps: MyAiStep[]): MyAiStep[] {
  const seen = new Set<string>()
  const out: MyAiStep[] = []
  for (const s of steps) {
    const k = stepKey(s)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(s)
  }
  return out
}

function labelStep(step: MyAiStep, vi: boolean): string {
  if (step.kind === 'create_file') {
    const app = officeAppLabel(step.app, vi)
    return vi ? `Tạo ${app}` : `Create ${app}`
  }
  if (step.kind === 'open_file') return vi ? `Mở file “${step.query}”` : `Open file “${step.query}”`
  if (step.kind === 'search_files')
    return vi ? `Tìm file “${step.query}”` : `Find file “${step.query}”`
  if (step.kind === 'summarize_recents') return vi ? 'Tóm tắt Recent' : 'Summarize Recents'
  if (step.kind === 'continue_active') return vi ? 'Tiếp tục tab' : 'Continue tab'
  if (step.kind === 'summarize_active') return vi ? 'Tóm tắt tab đang mở' : 'Summarize open tab'
  return step.intent.summary || (vi ? 'Workbench' : 'Workbench')
}

function tryBuildPlan(raw: string): Extract<MyAiRoute, { kind: 'plan' }> | null {
  const fromClauses: MyAiStep[] = []
  const clauses = splitMyAiClauses(raw)
  if (clauses.length >= 2) {
    for (const clause of clauses.slice(0, MAX_PLAN_STEPS)) {
      const r = routeMyAiTextSingle(clause)
      if (r.kind !== 'unknown') fromClauses.push(r)
    }
  }

  let steps = dedupeSteps(fromClauses)

  if (steps.length < 2) {
    const { head, companions } = extractCompanionClauses(raw)
    if (companions.length === 0) return null
    const primary = routeMyAiTextSingle(head)
    if (primary.kind === 'unknown') return null
    const built: MyAiStep[] = [primary]
    for (const c of companions) {
      const r = routeMyAiTextSingle(c)
      if (r.kind !== 'unknown') built.push(r)
    }
    steps = dedupeSteps(built)
  }

  steps = steps.slice(0, MAX_PLAN_STEPS)
  if (steps.length < 2) return null

  // Prefer mixed plans (create+workbench) or 2+ distinct kinds
  const kinds = new Set(steps.map((s) => s.kind))
  if (kinds.size < 2 && !(steps[0]!.kind === 'workbench' && steps.length >= 2)) {
    // allow two workbench steps (add task + open clients)
    if (!(steps.every((s) => s.kind === 'workbench') && steps.length >= 2)) return null
  }

  const labelsVi = steps.map((s) => labelStep(s, true)).join(' → ')
  const labelsEn = steps.map((s) => labelStep(s, false)).join(' → ')
  return {
    kind: 'plan',
    steps,
    summaryVi: `${steps.length} bước: ${labelsVi}`,
    summaryEn: `${steps.length} steps: ${labelsEn}`,
  }
}

/**
 * Route a single clause (no multi-tool planning).
 * Prefer specific file ops before generic Workbench NL.
 */
export function routeMyAiTextSingle(text: string): MyAiStep | Extract<MyAiRoute, { kind: 'unknown' }> {
  const raw = text.trim()
  if (!raw) {
    return {
      kind: 'unknown',
      hintVi: 'Hãy nhập yêu cầu của bạn.',
      hintEn: 'Please enter a request.',
    }
  }
  const lower = raw.toLowerCase()
  const lowerNorm = norm(raw)

  // 0) Active Office tab (before generic summarize / open)
  if (looksLikeSummarizeActive(lower) || looksLikeSummarizeActive(lowerNorm)) {
    return { kind: 'summarize_active' }
  }
  if (looksLikeContinueActive(lower) || looksLikeContinueActive(lowerNorm)) {
    const brief =
      extractAfter(
        [
          /(?:tiếp tục|tiep tuc|continue|resume)\s+(?:trên|tren|on)\s+(?:file|tab|document)\s+(?:này|nay|this|đang mở|dang mo|active)\s*[:\-–]?\s*(.+)$/i,
          /(?:tiếp tục|tiep tuc|continue|resume)\s*[:\-–]\s*(.+)$/i,
          /(?:với|with|bằng|bang)\s+(.+)$/i,
        ],
        raw,
      ) || ''
    const cleaned = brief
      .replace(/^(?:trên|tren|on)\s+/i, '')
      .replace(/\b(file|tab|document|này|nay|this|đang mở|dang mo|active)\b/gi, ' ')
      .replace(/^[:\-–]+\s*/, '')
      .replace(/\s+/g, ' ')
      .trim()
    return {
      kind: 'continue_active',
      ...(cleaned.length >= 4 ? { brief: cleaned } : {}),
    }
  }

  // 1) Search files
  if (looksLikeSearch(lower) || looksLikeSearch(lowerNorm)) {
    const query =
      extractAfter(
        [
          /(?:tìm file|tim file|tìm kiếm file|tim kiem file|search file|find file|tìm tài liệu|tim tai lieu)\s*[:\-–]?\s*(.+)$/i,
          /(?:tìm|tim|search|find)\s+(.+)$/i,
        ],
        raw,
      ) || raw
    return { kind: 'search_files', query: stripCreateNoise(query, null) || query }
  }

  // 2) Open file by name
  if (looksLikeOpenFile(lower) || looksLikeOpenFile(lowerNorm)) {
    const query =
      extractAfter(
        [
          /(?:mở file|mo file|open file|mở tài liệu|mo tai lieu|open document)\s*[:\-–]?\s*(.+)$/i,
          /(?:mở|mo|open)\s+(.+)$/i,
        ],
        raw,
      ) || raw
    const cleaned = stripCreateNoise(query, detectApp(lower))
      .replace(/\b(file|tai lieu|tài liệu)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return { kind: 'open_file', query: cleaned || query }
  }

  // 3) Create Office file (+ optional AI brief for Docs/Slides)
  if (looksLikeCreate(lower) || looksLikeCreate(lowerNorm)) {
    const app = detectApp(lower) ?? detectApp(lowerNorm)
    if (app) {
      const brief = stripCreateNoise(raw, app)
      const blank =
        !brief ||
        brief.length < 6 ||
        /^(moi|mới|blank|trong|trống)$/i.test(brief)
      return {
        kind: 'create_file',
        app,
        blank,
        ...(blank ? {} : { brief }),
      }
    }
    // "viết giúp tôi hợp đồng thuê nhà" without saying Word → default Docs + brief
    if (/\b(viết|viet|soạn|soan|draft|write)\b/i.test(lower)) {
      const brief = stripCreateNoise(raw, 'docs')
      if (brief.length >= 6) {
        return { kind: 'create_file', app: 'docs', blank: false, brief }
      }
    }
  }

  // 4) Summarize recent files
  if (looksLikeSummarizeRecents(lower) || looksLikeSummarizeRecents(lowerNorm)) {
    const query = stripCreateNoise(
      extractAfter(
        [
          /(?:tóm tắt|tom tat|summarize|summary|tổng hợp|tong hop)\s+(.+)$/i,
        ],
        raw,
      ),
      null,
    )
    return {
      kind: 'summarize_recents',
      ...(query ? { query } : {}),
      limit: 8,
    }
  }

  // 5) Workbench / agent intent
  const resolved = resolveAgentIntentFromText(raw, 'desktop')
  if (resolved) {
    const intent = createAgentIntent({
      ...resolved,
      source: 'desktop',
      requireConsent: false,
      text: raw,
    })
    return { kind: 'workbench', intent }
  }

  return {
    kind: 'unknown',
    hintVi:
      'Thử: “Soạn báo giá Word và thêm việc follow-up, mở tab Clients”, “Mở file báo cáo”, “Tóm tắt file gần đây”.',
    hintEn:
      'Try: “Draft a Word quote and add a follow-up task, open Clients”, “Open report file”, “Summarize recent files”.',
  }
}

export interface RouteMyAiOptions {
  practiceId?: PracticeId
}

/** Route a user utterance — may return a multi-tool / practice playbook plan. */
export function routeMyAiText(text: string, opts?: RouteMyAiOptions): MyAiRoute {
  const raw = text.trim()
  if (!raw) {
    return {
      kind: 'unknown',
      hintVi: 'Hãy nhập yêu cầu của bạn.',
      hintEn: 'Please enter a request.',
    }
  }

  // Phase C — practice playbook before generic clause split
  if (opts?.practiceId) {
    const hit = matchPracticePlaybook(opts.practiceId, raw)
    if (hit) {
      const labelsVi = hit.steps.map((s) => labelStep(s, true)).join(' → ')
      const labelsEn = hit.steps.map((s) => labelStep(s, false)).join(' → ')
      return {
        kind: 'plan',
        steps: hit.steps,
        playbookId: hit.playbook.id,
        summaryVi: `${hit.playbook.labelVi}: ${labelsVi}`,
        summaryEn: `${hit.playbook.labelEn}: ${labelsEn}`,
      }
    }
  }

  const plan = tryBuildPlan(raw)
  if (plan) return plan
  return routeMyAiTextSingle(raw)
}

export function officeAppLabel(app: OfficeApp, vi: boolean): string {
  const map: Record<OfficeApp, { vi: string; en: string }> = {
    docs: { vi: 'Word', en: 'Word' },
    sheets: { vi: 'Excel', en: 'Excel' },
    slides: { vi: 'Slides', en: 'Slides' },
    pdf: { vi: 'PDF', en: 'PDF' },
  }
  return vi ? map[app].vi : map[app].en
}
