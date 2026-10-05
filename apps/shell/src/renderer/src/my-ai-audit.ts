/**
 * Phase D — light local audit log for My AI tool runs (device-only).
 */
import type { PracticeId } from '@uniwork/practice-core'

const KEY = 'uniwork.my-ai.audit.v1'
const MAX = 80

export interface MyAiAuditEntry {
  id: string
  at: string
  practiceId: PracticeId
  userText: string
  routeKind: string
  stepKind?: string
  summary: string
  ok: boolean
  consented?: boolean
}

function readAll(): MyAiAuditEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as MyAiAuditEntry[]) : []
  } catch {
    return []
  }
}

function writeAll(entries: MyAiAuditEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)))
  } catch {
    /* quota */
  }
}

export function appendMyAiAudit(
  entry: Omit<MyAiAuditEntry, 'id' | 'at'> & { id?: string; at?: string },
): void {
  const row: MyAiAuditEntry = {
    id: entry.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: entry.at ?? new Date().toISOString(),
    practiceId: entry.practiceId,
    userText: entry.userText.slice(0, 300),
    routeKind: entry.routeKind,
    ...(entry.stepKind ? { stepKind: entry.stepKind } : {}),
    summary: entry.summary.slice(0, 240),
    ok: entry.ok,
    ...(entry.consented !== undefined ? { consented: entry.consented } : {}),
  }
  writeAll([row, ...readAll()])
}

export function listMyAiAudit(limit = 20): MyAiAuditEntry[] {
  return readAll().slice(0, limit)
}
