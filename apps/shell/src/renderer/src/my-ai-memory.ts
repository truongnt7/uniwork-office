/**
 * Lightweight on-device My AI memory (preferences), per practice.
 * Not a chat log — short facts the assistant should prefer.
 */
import type { PracticeId } from '@uniwork/practice-core'
import { wbStoreGetRaw, wbStoreSetRaw } from './workbench-store-client'

const KEY = 'uniwork.my-ai.memory.v1'
const MAX_LINES = 12
const MAX_LINE = 160

export interface MyAiMemory {
  version: 1
  /** Free-form preference lines */
  lines: string[]
  updatedAt: string
}

type Store = Record<string, MyAiMemory>

function readStore(): Store {
  try {
    const raw = wbStoreGetRaw(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as Store) : {}
  } catch {
    return {}
  }
}

function writeStore(store: Store): void {
  wbStoreSetRaw(KEY, JSON.stringify(store))
}

function emptyMemory(): MyAiMemory {
  return { version: 1, lines: [], updatedAt: new Date().toISOString() }
}

export function readMyAiMemory(practiceId: PracticeId): MyAiMemory {
  const row = readStore()[practiceId]
  if (!row || row.version !== 1 || !Array.isArray(row.lines)) return emptyMemory()
  return {
    version: 1,
    lines: row.lines.map((l) => String(l).trim()).filter(Boolean).slice(0, MAX_LINES),
    updatedAt: row.updatedAt || new Date().toISOString(),
  }
}

export function memoryLinesForPrompt(practiceId: PracticeId): string[] {
  return readMyAiMemory(practiceId).lines
}

/** Add or refresh a preference line (deduped, case-insensitive). */
export function rememberMyAiLine(practiceId: PracticeId, line: string): MyAiMemory {
  const cleaned = line.trim().replace(/\s+/g, ' ').slice(0, MAX_LINE)
  if (!cleaned) return readMyAiMemory(practiceId)
  const prev = readMyAiMemory(practiceId)
  const lower = cleaned.toLowerCase()
  const lines = [cleaned, ...prev.lines.filter((l) => l.toLowerCase() !== lower)].slice(
    0,
    MAX_LINES,
  )
  const next: MyAiMemory = {
    version: 1,
    lines,
    updatedAt: new Date().toISOString(),
  }
  const store = readStore()
  store[practiceId] = next
  writeStore(store)
  return next
}

/**
 * Heuristic: learn short “always …” / “luôn …” prefs from user text.
 * Safe no-op when the utterance is an action command.
 */
export function maybeLearnMyAiMemory(practiceId: PracticeId, userText: string): void {
  const t = userText.trim()
  if (t.length < 8 || t.length > 140) return
  if (
    /^(?:tạo|tao|soạn|soan|mở|mo|tóm|tom|tìm|tim|thêm|them|viết|viet|create|open|draft|summarize|find|add)\b/i.test(
      t,
    )
  ) {
    return
  }
  if (
    /(?:luôn|luon|always|mặc định|mac dinh|prefer|ưu tiên|uu tien)\b/i.test(t) ||
    /(?:trả lời|tra loi|reply|answer).{0,20}(?:tiếng việt|tieng viet|vietnamese|english)/i.test(t)
  ) {
    rememberMyAiLine(practiceId, t)
  }
}
