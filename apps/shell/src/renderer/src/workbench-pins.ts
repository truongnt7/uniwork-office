import {
  defaultPinnedModules,
  ensureCorePinnedModules,
  isCorePinnedModule,
  isPracticePillarId,
  isWorkbenchModuleId,
  TEACHER_PINNED_MODULES,
  type PracticeId,
  type PracticePillarId,
  type WorkbenchModuleId,
} from '@uniwork/practice-core'

import {
  wbStoreGetRaw,
  wbStoreRead,
  wbStoreRemove,
  wbStoreSetRaw,
  wbStoreWrite,
} from './workbench-store-client'

const PINS_PREFIX = 'uniwork.wb.pins.'
const PILLAR_PINS_PREFIX = 'uniwork.wb.pillarPins.'

/** Pillars (Knowledge / Materials / Skills / Compose) are opt-in via Tab + — none pinned by default. */
export function defaultPinnedPillars(): PracticePillarId[] {
  return []
}

export function readPinnedPillars(practiceId: PracticeId): PracticePillarId[] {
  try {
    const raw = wbStoreGetRaw(PILLAR_PINS_PREFIX + practiceId)
    if (raw === null) return defaultPinnedPillars()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return defaultPinnedPillars()
    return parsed.filter(isPracticePillarId)
  } catch {
    return defaultPinnedPillars()
  }
}

export function writePinnedPillars(practiceId: PracticeId, pins: PracticePillarId[]): void {
  try {
    wbStoreSetRaw(PILLAR_PINS_PREFIX + practiceId, JSON.stringify(pins))
  } catch {
    /* ignore quota */
  }
}

export function pinPillar(practiceId: PracticeId, id: PracticePillarId): PracticePillarId[] {
  const cur = readPinnedPillars(practiceId)
  if (cur.includes(id)) return cur
  const next = [...cur, id]
  writePinnedPillars(practiceId, next)
  return next
}

export function unpinPillar(practiceId: PracticeId, id: PracticePillarId): PracticePillarId[] {
  const next = readPinnedPillars(practiceId).filter((x) => x !== id)
  writePinnedPillars(practiceId, next)
  return next
}

const TEACHER_EDU_TABS_MIGRATION = 'uniwork.wb.migrated.teacher-students-parents.v1'
const TEACHER_GRADES_TAB_MIGRATION = 'uniwork.wb.migrated.teacher-grades.v1'

/** One-time: pin Students/Parents for existing teacher installs that already had custom pins. */
function migrateTeacherEduTabs(pins: WorkbenchModuleId[]): WorkbenchModuleId[] {
  try {
    if (wbStoreGetRaw(TEACHER_EDU_TABS_MIGRATION) === '1') return pins
    const have = new Set(pins)
    const missing = TEACHER_PINNED_MODULES.filter((id) => !have.has(id))
    const next = missing.length === 0 ? pins : [...pins, ...missing]
    wbStoreSetRaw(TEACHER_EDU_TABS_MIGRATION, '1')
    if (missing.length > 0) {
      wbStoreSetRaw(PINS_PREFIX + 'teacher', JSON.stringify(ensureCorePinnedModules(next)))
    }
    return next
  } catch {
    return pins
  }
}

/** One-time: pin Gradebook for teacher installs that already customized pins. */
function migrateTeacherGradesTab(pins: WorkbenchModuleId[]): WorkbenchModuleId[] {
  try {
    if (wbStoreGetRaw(TEACHER_GRADES_TAB_MIGRATION) === '1') return pins
    const have = new Set(pins)
    const next = have.has('grades') ? pins : [...pins, 'grades' as WorkbenchModuleId]
    wbStoreSetRaw(TEACHER_GRADES_TAB_MIGRATION, '1')
    if (!have.has('grades')) {
      wbStoreSetRaw(PINS_PREFIX + 'teacher', JSON.stringify(ensureCorePinnedModules(next)))
    }
    return next
  } catch {
    return pins
  }
}

export function readPinnedModules(practiceId: PracticeId): WorkbenchModuleId[] {
  try {
    const raw = wbStoreGetRaw(PINS_PREFIX + practiceId)
    if (raw === null) return defaultPinnedModules(practiceId)
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return defaultPinnedModules(practiceId)
    let pins = ensureCorePinnedModules(parsed.filter(isWorkbenchModuleId))
    if (practiceId === 'teacher') {
      pins = migrateTeacherEduTabs(pins)
      pins = migrateTeacherGradesTab(pins)
    }
    return pins
  } catch {
    return defaultPinnedModules(practiceId)
  }
}

export function writePinnedModules(practiceId: PracticeId, pins: WorkbenchModuleId[]): void {
  try {
    wbStoreSetRaw(PINS_PREFIX + practiceId, JSON.stringify(ensureCorePinnedModules(pins)))
  } catch {
    /* ignore quota */
  }
}

export function pinModule(practiceId: PracticeId, id: WorkbenchModuleId): WorkbenchModuleId[] {
  const cur = readPinnedModules(practiceId)
  if (cur.includes(id)) return cur
  const next = ensureCorePinnedModules([...cur, id])
  writePinnedModules(practiceId, next)
  return next
}

export function unpinModule(practiceId: PracticeId, id: WorkbenchModuleId): WorkbenchModuleId[] {
  // Core tabs (My Space / Tasks / Calendar / Forms) stay pinned
  if (isCorePinnedModule(id)) return readPinnedModules(practiceId)
  const next = ensureCorePinnedModules(readPinnedModules(practiceId).filter((x) => x !== id))
  writePinnedModules(practiceId, next)
  return next
}

/** Reorder pinned module tabs (drag-and-drop). Returns next pins. */
export function reorderPinnedModules(
  practiceId: PracticeId,
  fromId: WorkbenchModuleId,
  toId: WorkbenchModuleId,
): WorkbenchModuleId[] {
  if (fromId === toId) return readPinnedModules(practiceId)
  const cur = readPinnedModules(practiceId)
  const from = cur.indexOf(fromId)
  const to = cur.indexOf(toId)
  if (from < 0 || to < 0) return cur
  const next = [...cur]
  const [item] = next.splice(from, 1)
  if (!item) return cur
  next.splice(to, 0, item)
  writePinnedModules(practiceId, next)
  return next
}

// ── Lightweight local module data (per practice) ───────────

export interface WbCalendarItem {
  id: string
  date: string
  title: string
  done?: boolean
  /** Lesson period label, e.g. "Tiết 3". */
  period?: string
  /** Linked education / practice pack id. */
  linkedProjectId?: string
  /** Denormalized pack title for display when pack is offline. */
  packTitle?: string
}

export type CalendarViewMode = 'list' | 'calendar'

export function readCalendarView(): CalendarViewMode {
  try {
    const raw = wbStoreGetRaw('uniwork.wb.calendar.view')
    if (raw === 'list' || raw === 'calendar') return raw
  } catch {
    /* ignore */
  }
  return 'calendar'
}

export function writeCalendarView(mode: CalendarViewMode): void {
  try {
    wbStoreSetRaw('uniwork.wb.calendar.view', mode)
  } catch {
    /* ignore */
  }
}

/** Personal task board — no approval workflow. */
export type WbTaskStatus = 'todo' | 'doing' | 'done' | 'cancelled'
export type WbTaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TasksViewId = 'list' | 'kanban' | 'calendar' | 'dashboard'

export interface WbTaskAttachmentMeta {
  id: string
  name: string
  mime?: string
  size: number
  addedAt: string
}

export interface WbTaskItem {
  id: string
  title: string
  /** Kept in sync with status === 'done' for Desk / legacy readers. */
  done: boolean
  status: WbTaskStatus
  priority: WbTaskPriority
  description?: string
  dueDate?: string
  startDate?: string
  tags?: string[]
  attachments?: WbTaskAttachmentMeta[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export function normalizeTaskItem(raw: Partial<WbTaskItem> & { id: string; title: string }): WbTaskItem {
  const now = new Date().toISOString()
  const status: WbTaskStatus =
    raw.status === 'todo' ||
    raw.status === 'doing' ||
    raw.status === 'done' ||
    raw.status === 'cancelled'
      ? raw.status
      : raw.done
        ? 'done'
        : 'todo'
  const priority: WbTaskPriority =
    raw.priority === 'low' ||
    raw.priority === 'medium' ||
    raw.priority === 'high' ||
    raw.priority === 'urgent'
      ? raw.priority
      : 'medium'
  const done = status === 'done'
  return {
    id: raw.id,
    title: raw.title,
    done,
    status,
    priority,
    ...(raw.description?.trim() ? { description: raw.description.trim() } : {}),
    ...(raw.dueDate ? { dueDate: raw.dueDate } : {}),
    ...(raw.startDate ? { startDate: raw.startDate } : {}),
    ...(raw.tags?.length ? { tags: raw.tags } : {}),
    ...(raw.attachments?.length ? { attachments: raw.attachments } : {}),
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    ...(done && (raw.completedAt || now) ? { completedAt: raw.completedAt || now } : {}),
  }
}

export function taskWithStatus(item: WbTaskItem, status: WbTaskStatus): WbTaskItem {
  const done = status === 'done'
  return {
    ...item,
    status,
    done,
    updatedAt: new Date().toISOString(),
    ...(done
      ? { completedAt: item.completedAt || new Date().toISOString() }
      : { completedAt: undefined }),
  }
}

function readJson<T>(key: string, fallback: T): T {
  return wbStoreRead(key, fallback)
}

function writeJson(key: string, value: unknown): void {
  wbStoreWrite(key, value)
}

/** Guard re-entrant dual-write between Calendar ↔ Events. */
let calendarEventsSyncing = false

export function readCalendar(practiceId: PracticeId): WbCalendarItem[] {
  return readJson(`uniwork.wb.calendar.${practiceId}`, [])
}

export function writeCalendar(practiceId: PracticeId, items: WbCalendarItem[]): void {
  writeJson(`uniwork.wb.calendar.${practiceId}`, items)
  if (calendarEventsSyncing) return
  calendarEventsSyncing = true
  try {
    const events = readJson<WbEventItem[]>(`uniwork.wb.events.${practiceId}`, [])
    const map = new Map(events.map((e) => [e.id, e]))
    for (const c of items) {
      const prev = map.get(c.id)
      map.set(c.id, {
        id: c.id,
        date: c.date,
        title: c.title,
        ...(prev?.time ? { time: prev.time } : {}),
        ...(prev?.place ? { place: prev.place } : {}),
      })
    }
    writeJson(`uniwork.wb.events.${practiceId}`, [...map.values()])
  } finally {
    calendarEventsSyncing = false
  }
}

export function readTasks(practiceId: PracticeId): WbTaskItem[] {
  const raw = readJson<Partial<WbTaskItem>[]>(`uniwork.wb.tasks.${practiceId}`, [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter((t): t is Partial<WbTaskItem> & { id: string; title: string } =>
      Boolean(t && typeof t.id === 'string' && typeof t.title === 'string'),
    )
    .map((t) => normalizeTaskItem(t))
}

export function writeTasks(practiceId: PracticeId, items: WbTaskItem[]): void {
  writeJson(
    `uniwork.wb.tasks.${practiceId}`,
    items.map((t) => normalizeTaskItem(t)),
  )
}

export function readTasksView(): TasksViewId {
  try {
    const raw = wbStoreGetRaw('uniwork.wb.tasks.view')
    if (raw === 'list' || raw === 'kanban' || raw === 'calendar' || raw === 'dashboard') return raw
  } catch {
    /* ignore */
  }
  return 'list'
}

export function writeTasksView(view: TasksViewId): void {
  try {
    wbStoreSetRaw('uniwork.wb.tasks.view', view)
  } catch {
    /* ignore */
  }
}

const TASK_MEDIA_DB = 'uniwork.wb.tasks.media'
const TASK_MEDIA_STORE = 'blobs'

function openTaskMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(TASK_MEDIA_DB, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(TASK_MEDIA_STORE)) {
        db.createObjectStore(TASK_MEDIA_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('task_media_open_failed'))
  })
}

export async function putTaskAttachmentBlob(id: string, blob: Blob): Promise<void> {
  const db = await openTaskMediaDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(TASK_MEDIA_STORE, 'readwrite')
    tx.objectStore(TASK_MEDIA_STORE).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('task_media_put_failed'))
  })
  db.close()
}

export async function getTaskAttachmentBlob(id: string): Promise<Blob | null> {
  const db = await openTaskMediaDb()
  const value = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(TASK_MEDIA_STORE, 'readonly')
    const req = tx.objectStore(TASK_MEDIA_STORE).get(id)
    req.onsuccess = () => resolve(req.result instanceof Blob ? req.result : null)
    req.onerror = () => reject(req.error ?? new Error('task_media_get_failed'))
  })
  db.close()
  return value
}

export async function deleteTaskAttachmentBlob(id: string): Promise<void> {
  const db = await openTaskMediaDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(TASK_MEDIA_STORE, 'readwrite')
    tx.objectStore(TASK_MEDIA_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('task_media_delete_failed'))
  })
  db.close()
}

export type WbStickyColor = 'yellow' | 'peach' | 'mint' | 'sky' | 'lilac' | 'rose'

export const STICKY_COLORS: readonly WbStickyColor[] = [
  'yellow',
  'peach',
  'mint',
  'sky',
  'lilac',
  'rose',
]

export interface WbStickyNote {
  id: string
  body: string
  color: WbStickyColor
  /** Board position 0–100 (%) */
  x: number
  y: number
  /** Slight tilt in degrees */
  rotate: number
  z: number
  createdAt: string
  updatedAt: string
}

function stickyKey(practiceId: PracticeId): string {
  return `uniwork.wb.stickies.${practiceId}`
}

function legacyNotesKey(practiceId: PracticeId): string {
  return `uniwork.wb.notes.${practiceId}`
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 8
  return Math.min(88, Math.max(2, n))
}

function isStickyColor(v: unknown): v is WbStickyColor {
  return typeof v === 'string' && (STICKY_COLORS as readonly string[]).includes(v)
}

export function normalizeStickyNote(raw: Partial<WbStickyNote> & { id: string }): WbStickyNote {
  const now = new Date().toISOString()
  return {
    id: raw.id,
    body: typeof raw.body === 'string' ? raw.body : '',
    color: isStickyColor(raw.color) ? raw.color : 'yellow',
    x: clampPct(typeof raw.x === 'number' ? raw.x : 8),
    y: clampPct(typeof raw.y === 'number' ? raw.y : 8),
    rotate: typeof raw.rotate === 'number' && Number.isFinite(raw.rotate) ? Math.max(-8, Math.min(8, raw.rotate)) : 0,
    z: typeof raw.z === 'number' && Number.isFinite(raw.z) ? raw.z : 1,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
  }
}

function migrateLegacyNotes(practiceId: PracticeId): WbStickyNote[] | null {
  try {
    const legacy = wbStoreGetRaw(legacyNotesKey(practiceId))
    if (legacy == null) return null
    const text = legacy.trim()
    wbStoreRemove(legacyNotesKey(practiceId))
    if (!text) return []
    const now = new Date().toISOString()
    return [
      normalizeStickyNote({
        id: `${Date.now().toString(36)}-legacy`,
        body: text,
        color: 'yellow',
        x: 12,
        y: 14,
        rotate: -2,
        z: 1,
        createdAt: now,
        updatedAt: now,
      }),
    ]
  } catch {
    return null
  }
}

export function readStickyNotes(practiceId: PracticeId): WbStickyNote[] {
  const key = stickyKey(practiceId)
  try {
    const raw = wbStoreGetRaw(key)
    if (raw == null) {
      const migrated = migrateLegacyNotes(practiceId)
      if (migrated) {
        writeStickyNotes(practiceId, migrated)
        return migrated
      }
      return []
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((n): n is Partial<WbStickyNote> & { id: string } =>
        Boolean(n && typeof (n as { id?: unknown }).id === 'string'),
      )
      .map((n) => normalizeStickyNote(n))
  } catch {
    return []
  }
}

export function writeStickyNotes(practiceId: PracticeId, items: WbStickyNote[]): void {
  writeJson(
    stickyKey(practiceId),
    items.map((n) => normalizeStickyNote(n)),
  )
}

export function createStickyNote(
  practiceId: PracticeId,
  body: string,
  color?: WbStickyColor,
): WbStickyNote {
  const existing = readStickyNotes(practiceId)
  const now = new Date().toISOString()
  const idx = existing.length
  const note = normalizeStickyNote({
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    body,
    color: color ?? STICKY_COLORS[idx % STICKY_COLORS.length],
    x: 8 + ((idx * 11) % 62),
    y: 10 + ((idx * 13) % 48),
    rotate: ((idx % 5) - 2) * 1.6,
    z: (existing.reduce((m, n) => Math.max(m, n.z), 0) || 0) + 1,
    createdAt: now,
    updatedAt: now,
  })
  writeStickyNotes(practiceId, [note, ...existing])
  return note
}

/** Plain-text join for AI context / legacy callers. */
export function readNotes(practiceId: PracticeId): string {
  return readStickyNotes(practiceId)
    .map((n) => n.body.trim())
    .filter(Boolean)
    .join('\n\n')
}

/** Append as a new sticky note (legacy write path). */
export function writeNotes(practiceId: PracticeId, text: string): void {
  const body = text.trim()
  if (!body) return
  const existing = readStickyNotes(practiceId)
  const joined = existing.map((n) => n.body.trim()).filter(Boolean).join('\n\n')
  if (joined === body) return
  if (body.startsWith(joined) && joined) {
    const appended = body.slice(joined.length).trim()
    if (appended) createStickyNote(practiceId, appended)
    return
  }
  createStickyNote(practiceId, body)
}

export type WbEmailFolder = 'inbox' | 'drafts' | 'sent' | 'archive'

export interface WbEmailMessage {
  id: string
  folder: WbEmailFolder
  from: string
  to: string
  cc?: string
  subject: string
  body: string
  starred?: boolean
  unread?: boolean
  /** Sample rows until a real mailbox is connected */
  demo?: boolean
  /** Connected mailbox account id (when synced from IMAP) */
  accountId?: string
  /** Provider UID within the remote folder */
  remoteUid?: string
  createdAt: string
  updatedAt: string
}

function emailKey(practiceId: PracticeId): string {
  return `uniwork.wb.email.${practiceId}`
}

function isEmailFolder(v: unknown): v is WbEmailFolder {
  return v === 'inbox' || v === 'drafts' || v === 'sent' || v === 'archive'
}

export function normalizeEmailMessage(
  raw: Partial<WbEmailMessage> & { id: string },
): WbEmailMessage {
  const now = new Date().toISOString()
  return {
    id: raw.id,
    folder: isEmailFolder(raw.folder) ? raw.folder : 'drafts',
    from: typeof raw.from === 'string' ? raw.from : '',
    to: typeof raw.to === 'string' ? raw.to : '',
    ...(typeof raw.cc === 'string' && raw.cc.trim() ? { cc: raw.cc.trim() } : {}),
    subject: typeof raw.subject === 'string' ? raw.subject : '',
    body: typeof raw.body === 'string' ? raw.body : '',
    ...(raw.starred ? { starred: true } : {}),
    ...(raw.unread ? { unread: true } : {}),
    ...(raw.demo ? { demo: true } : {}),
    ...(typeof raw.accountId === 'string' && raw.accountId ? { accountId: raw.accountId } : {}),
    ...(typeof raw.remoteUid === 'string' && raw.remoteUid ? { remoteUid: raw.remoteUid } : {}),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
  }
}

/** Merge IMAP sync into local store: keep drafts/archive/local-sent, replace inbox + account sent. */
export function mergeSyncedEmails(
  local: WbEmailMessage[],
  remote: Array<{
    id: string
    accountId: string
    remoteUid: string
    folder: 'inbox' | 'sent'
    from: string
    to: string
    cc?: string
    subject: string
    body: string
    unread: boolean
    createdAt: string
    updatedAt: string
  }>,
  accountId: string,
): WbEmailMessage[] {
  const keep = local.filter(
    (m) =>
      !m.demo &&
      m.folder !== 'inbox' &&
      !(m.folder === 'sent' && m.accountId === accountId),
  )
  const mapped = remote.map((r) =>
    normalizeEmailMessage({
      id: r.id,
      folder: r.folder,
      from: r.from,
      to: r.to,
      cc: r.cc,
      subject: r.subject,
      body: r.body,
      unread: r.unread,
      accountId: r.accountId,
      remoteUid: r.remoteUid,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }),
  )
  return [...mapped, ...keep]
}

function seedDemoEmails(practiceId: PracticeId): WbEmailMessage[] {
  const now = Date.now()
  const iso = (offsetMs: number) => new Date(now - offsetMs).toISOString()
  return [
    normalizeEmailMessage({
      id: `${practiceId}-demo-1`,
      folder: 'inbox',
      from: 'team@uniwork.local',
      to: 'me@local',
      subject: 'Chào mừng bạn đến Tab Email (MVP)',
      body:
        'Đây là thư mẫu trên máy — chưa đồng bộ hộp thư thật.\n\nBạn có thể soạn nháp, dùng AI chỉnh giọng văn, và lưu Sent cục bộ. Kết nối Gmail/Outlook sẽ có ở bước sau.',
      unread: true,
      demo: true,
      createdAt: iso(3600_000),
      updatedAt: iso(3600_000),
    }),
    normalizeEmailMessage({
      id: `${practiceId}-demo-2`,
      folder: 'inbox',
      from: 'notes@uniwork.local',
      to: 'me@local',
      subject: 'Gợi ý: biến email thành việc cần làm',
      body:
        'Mở một thư → “Tạo việc” để đẩy sang tab Công việc.\n\nMVP tập trung soạn thảo + AI; inbox thật sẽ đến khi kết nối tài khoản.',
      unread: true,
      starred: true,
      demo: true,
      createdAt: iso(7200_000),
      updatedAt: iso(7200_000),
    }),
  ]
}

export function readEmails(practiceId: PracticeId): WbEmailMessage[] {
  const key = emailKey(practiceId)
  try {
    const raw = wbStoreGetRaw(key)
    if (raw == null) {
      const seeded = seedDemoEmails(practiceId)
      writeEmails(practiceId, seeded)
      return seeded
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((m): m is Partial<WbEmailMessage> & { id: string } =>
        Boolean(m && typeof (m as { id?: unknown }).id === 'string'),
      )
      .map((m) => normalizeEmailMessage(m))
  } catch {
    return []
  }
}

export function writeEmails(practiceId: PracticeId, items: WbEmailMessage[]): void {
  writeJson(
    emailKey(practiceId),
    items.map((m) => normalizeEmailMessage(m)),
  )
}

export function createEmailDraft(
  practiceId: PracticeId,
  input?: Partial<Pick<WbEmailMessage, 'to' | 'cc' | 'subject' | 'body' | 'from'>>,
): WbEmailMessage {
  const existing = readEmails(practiceId)
  const now = new Date().toISOString()
  const draft = normalizeEmailMessage({
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    folder: 'drafts',
    from: input?.from ?? 'me@local',
    to: input?.to ?? '',
    cc: input?.cc,
    subject: input?.subject ?? '',
    body: input?.body ?? '',
    createdAt: now,
    updatedAt: now,
  })
  writeEmails(practiceId, [draft, ...existing])
  return draft
}

export interface WbFormItem {
  id: string
  title: string
  note?: string
  /** Practice / education pack this form draft is linked into (Tài liệu). */
  linkedProjectId?: string
  /** Absolute path to an uploaded template file (docx/pdf/xlsx/…). */
  filePath?: string
  fileName?: string
  /** lowercased extension without the dot */
  fileExt?: string
  /** Optional link to a built-in My AI practice template id (slot schema). */
  templateId?: string
}

export interface WbPersonalProfile {
  fullName: string
  org: string
  title: string
  phone: string
  email: string
  address: string
}

export interface WbFinanceItem {
  id: string
  date: string
  kind: 'income' | 'expense'
  amount: number
  label: string
  category?: 'living' | 'food' | 'transport' | 'bills' | 'fun' | 'health' | 'other'
}

/** Sub-tabs inside Tài chính cá nhân */
export type FinanceSubTabId = 'goals' | 'spending' | 'invest'

export function readFinanceSubTab(): FinanceSubTabId {
  try {
    const raw = wbStoreGetRaw('uniwork.wb.finance.subtab')
    if (raw === 'goals' || raw === 'spending' || raw === 'invest') return raw
  } catch {
    /* ignore */
  }
  return 'goals'
}

export function writeFinanceSubTab(id: FinanceSubTabId): void {
  try {
    wbStoreSetRaw('uniwork.wb.finance.subtab', id)
  } catch {
    /* ignore */
  }
}

/** Mục tiêu tài chính */
export interface WbFinanceGoal {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  note?: string
  done: boolean
}

export function readFinanceGoals(): WbFinanceGoal[] {
  return readJson('uniwork.wb.finance.goals', [])
}

export function writeFinanceGoals(items: WbFinanceGoal[]): void {
  writeJson('uniwork.wb.finance.goals', items)
}

/** Đầu tư / tích luỹ tài sản */
export interface WbFinanceInvest {
  id: string
  name: string
  kind: 'stock' | 'fund' | 'bond' | 'crypto' | 'savings' | 'gold' | 'realestate' | 'other'
  amount: number
  date: string
  note?: string
}

export function readFinanceInvest(): WbFinanceInvest[] {
  return readJson('uniwork.wb.finance.invest', [])
}

export function writeFinanceInvest(items: WbFinanceInvest[]): void {
  writeJson('uniwork.wb.finance.invest', items)
}

const DEFAULT_PERSONAL: WbPersonalProfile = {
  fullName: '',
  org: '',
  title: '',
  phone: '',
  email: '',
  address: '',
}

export function readForms(practiceId: PracticeId): WbFormItem[] {
  return readJson(`uniwork.wb.forms.${practiceId}`, [])
}

export function writeForms(practiceId: PracticeId, items: WbFormItem[]): void {
  writeJson(`uniwork.wb.forms.${practiceId}`, items)
}

export function readPersonal(): WbPersonalProfile {
  return { ...DEFAULT_PERSONAL, ...readJson('uniwork.wb.personal', {}) }
}

export function writePersonal(profile: WbPersonalProfile): void {
  writeJson('uniwork.wb.personal', profile)
}

export function readFinance(): WbFinanceItem[] {
  return readJson('uniwork.wb.finance', [])
}

export function writeFinance(items: WbFinanceItem[]): void {
  writeJson('uniwork.wb.finance', items)
}

export interface WbEventItem {
  id: string
  date: string
  time?: string
  title: string
  place?: string
}

export interface WbHealthItem {
  id: string
  date: string
  kind: 'sleep' | 'exercise' | 'checkup' | 'other'
  note: string
  value?: string
}

/** Sub-tabs inside Sức khoẻ */
export type HealthSubTabId =
  | 'metrics'
  | 'running'
  | 'yoga'
  | 'sports'
  | 'diet'
  | 'fasting'
  | 'veg'

export function readHealthSubTab(): HealthSubTabId {
  try {
    const raw = wbStoreGetRaw('uniwork.wb.health.subtab')
    const ok: HealthSubTabId[] = [
      'metrics',
      'running',
      'yoga',
      'sports',
      'diet',
      'fasting',
      'veg',
    ]
    if (raw && (ok as string[]).includes(raw)) return raw as HealthSubTabId
  } catch {
    /* ignore */
  }
  return 'metrics'
}

export function writeHealthSubTab(id: HealthSubTabId): void {
  try {
    wbStoreSetRaw('uniwork.wb.health.subtab', id)
  } catch {
    /* ignore */
  }
}

export function readHealth(): WbHealthItem[] {
  return readJson('uniwork.wb.health', [])
}

export function writeHealth(items: WbHealthItem[]): void {
  writeJson('uniwork.wb.health', items)
}

export interface WbHealthMetric {
  id: string
  date: string
  metric: 'weight' | 'bmi' | 'bp' | 'hr' | 'sleep' | 'steps' | 'glucose' | 'other'
  value: string
  unit?: string
  note?: string
}

export function readHealthMetrics(): WbHealthMetric[] {
  return readJson('uniwork.wb.health.metrics', [])
}

export function writeHealthMetrics(items: WbHealthMetric[]): void {
  writeJson('uniwork.wb.health.metrics', items)
}

/** Mục tiêu chỉ số sức khoẻ (cân nặng, bước, ngủ…) */
export interface WbHealthMetricGoal {
  id: string
  metric: WbHealthMetric['metric']
  target: string
  unit?: string
  note?: string
}

export function readHealthMetricGoals(): WbHealthMetricGoal[] {
  return readJson('uniwork.wb.health.metricGoals', [])
}

export function writeHealthMetricGoals(items: WbHealthMetricGoal[]): void {
  writeJson('uniwork.wb.health.metricGoals', items)
}

/** Custom body figure for health metrics (photo blob in IndexedDB; default = bundled mannequin). */
export type WbHealthBodySource = 'default' | 'upload' | 'camera'

export interface WbHealthBodyMeta {
  source: WbHealthBodySource
  updatedAt: string
}

const HEALTH_BODY_DB = 'uniwork.wb.health.media'
const HEALTH_BODY_STORE = 'blobs'
const HEALTH_BODY_BLOB_KEY = 'body-figure'
const HEALTH_BODY_META_KEY = 'uniwork.wb.health.bodyMeta'

function openHealthMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(HEALTH_BODY_DB, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(HEALTH_BODY_STORE)) {
        db.createObjectStore(HEALTH_BODY_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('health_media_idb_open_failed'))
  })
}

export function readHealthBodyMeta(): WbHealthBodyMeta | null {
  try {
    const raw = wbStoreGetRaw(HEALTH_BODY_META_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WbHealthBodyMeta
    if (parsed?.source === 'upload' || parsed?.source === 'camera') return parsed
  } catch {
    /* ignore */
  }
  return null
}

export function writeHealthBodyMeta(meta: WbHealthBodyMeta | null): void {
  try {
    if (!meta) wbStoreRemove(HEALTH_BODY_META_KEY)
    else wbStoreSetRaw(HEALTH_BODY_META_KEY, JSON.stringify(meta))
  } catch {
    /* ignore */
  }
}

export async function putHealthBodyBlob(dataUrl: string): Promise<void> {
  const db = await openHealthMediaDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(HEALTH_BODY_STORE, 'readwrite')
    tx.objectStore(HEALTH_BODY_STORE).put(dataUrl, HEALTH_BODY_BLOB_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('health_media_idb_put_failed'))
  })
  db.close()
}

export async function getHealthBodyBlob(): Promise<string | null> {
  const db = await openHealthMediaDb()
  const value = await new Promise<string | null>((resolve, reject) => {
    const tx = db.transaction(HEALTH_BODY_STORE, 'readonly')
    const req = tx.objectStore(HEALTH_BODY_STORE).get(HEALTH_BODY_BLOB_KEY)
    req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null)
    req.onerror = () => reject(req.error ?? new Error('health_media_idb_get_failed'))
  })
  db.close()
  return value
}

export async function clearHealthBodyBlob(): Promise<void> {
  const db = await openHealthMediaDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(HEALTH_BODY_STORE, 'readwrite')
    tx.objectStore(HEALTH_BODY_STORE).delete(HEALTH_BODY_BLOB_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('health_media_idb_delete_failed'))
  })
  db.close()
}

export interface WbHealthRun {
  id: string
  date: string
  distanceKm: number
  durationMin: number
  pace?: string
  note?: string
}

export function readHealthRuns(): WbHealthRun[] {
  return readJson('uniwork.wb.health.runs', [])
}

export function writeHealthRuns(items: WbHealthRun[]): void {
  writeJson('uniwork.wb.health.runs', items)
}

export interface WbHealthYoga {
  id: string
  date: string
  style: string
  durationMin: number
  intensity: 'easy' | 'moderate' | 'hard'
  note?: string
}

export function readHealthYoga(): WbHealthYoga[] {
  return readJson('uniwork.wb.health.yoga', [])
}

export function writeHealthYoga(items: WbHealthYoga[]): void {
  writeJson('uniwork.wb.health.yoga', items)
}

export interface WbHealthSport {
  id: string
  date: string
  sport: string
  durationMin: number
  note?: string
}

export function readHealthSports(): WbHealthSport[] {
  return readJson('uniwork.wb.health.sports', [])
}

export function writeHealthSports(items: WbHealthSport[]): void {
  writeJson('uniwork.wb.health.sports', items)
}

export interface WbHealthDietPlan {
  id: string
  title: string
  goal?: string
  startDate: string
  endDate?: string
  dailyKcal?: number
  note?: string
  active: boolean
}

export function readHealthDiets(): WbHealthDietPlan[] {
  return readJson('uniwork.wb.health.diets', [])
}

export function writeHealthDiets(items: WbHealthDietPlan[]): void {
  writeJson('uniwork.wb.health.diets', items)
}

export interface WbHealthFasting {
  id: string
  date: string
  protocol: '16:8' | '18:6' | '20:4' | 'OMAD' | '5:2' | 'other'
  fastStart?: string
  fastEnd?: string
  completed: boolean
  note?: string
}

export function readHealthFasting(): WbHealthFasting[] {
  return readJson('uniwork.wb.health.fasting', [])
}

export function writeHealthFasting(items: WbHealthFasting[]): void {
  writeJson('uniwork.wb.health.fasting', items)
}

export interface WbHealthVeg {
  id: string
  date: string
  mode: 'vegetarian' | 'vegan' | 'flexitarian' | 'other'
  meals?: string
  note?: string
  ok: boolean
}

export function readHealthVeg(): WbHealthVeg[] {
  return readJson('uniwork.wb.health.veg', [])
}

export function writeHealthVeg(items: WbHealthVeg[]): void {
  writeJson('uniwork.wb.health.veg', items)
}

/** Aggregated counts for Desk health widget (legacy + new logs). */
export function healthDeskCounts(): {
  exercise: number
  sleep: number
  checkup: number
  other: number
} {
  const legacy = readHealth()
  const metrics = readHealthMetrics()
  const runs = readHealthRuns()
  const yoga = readHealthYoga()
  const sports = readHealthSports()
  return {
    exercise:
      legacy.filter((h) => h.kind === 'exercise').length +
      runs.length +
      yoga.length +
      sports.length,
    sleep:
      legacy.filter((h) => h.kind === 'sleep').length +
      metrics.filter((m) => m.metric === 'sleep').length,
    checkup:
      legacy.filter((h) => h.kind === 'checkup').length +
      metrics.filter((m) => m.metric !== 'sleep' && m.metric !== 'steps' && m.metric !== 'other')
        .length,
    other:
      legacy.filter((h) => h.kind === 'other').length +
      metrics.filter((m) => m.metric === 'other' || m.metric === 'steps').length +
      readHealthDiets().length +
      readHealthFasting().length +
      readHealthVeg().length,
  }
}

export interface WbGrowthItem {
  id: string
  title: string
  progress: number
  note?: string
  done: boolean
}

export function readEvents(practiceId: PracticeId): WbEventItem[] {
  return readJson(`uniwork.wb.events.${practiceId}`, [])
}

export function writeEvents(practiceId: PracticeId, items: WbEventItem[]): void {
  writeJson(`uniwork.wb.events.${practiceId}`, items)
  if (calendarEventsSyncing) return
  calendarEventsSyncing = true
  try {
    const cal = readJson<WbCalendarItem[]>(`uniwork.wb.calendar.${practiceId}`, [])
    const map = new Map(cal.map((c) => [c.id, c]))
    for (const e of items) {
      const prev = map.get(e.id)
      map.set(e.id, {
        id: e.id,
        date: e.date,
        title: e.title,
        ...(prev?.done !== undefined ? { done: prev.done } : {}),
        ...(prev?.period ? { period: prev.period } : {}),
        ...(prev?.linkedProjectId ? { linkedProjectId: prev.linkedProjectId } : {}),
        ...(prev?.packTitle ? { packTitle: prev.packTitle } : {}),
      })
    }
    writeJson(`uniwork.wb.calendar.${practiceId}`, [...map.values()])
  } finally {
    calendarEventsSyncing = false
  }
}

export function readGrowth(): WbGrowthItem[] {
  return readJson('uniwork.wb.growth', [])
}

export function writeGrowth(items: WbGrowthItem[]): void {
  writeJson('uniwork.wb.growth', items)
}

export interface WbFamilyMember {
  id: string
  name: string
  relation: string
  birthday?: string
  phone?: string
  note?: string
}

/** Sub-tabs inside Gia đình tôi */
export type FamilySubTabId =
  | 'members'
  | 'parenting'
  | 'meds'
  | 'shopping'
  | 'tree'
  | 'milestones'

export function readFamilySubTab(): FamilySubTabId {
  try {
    const raw = wbStoreGetRaw('uniwork.wb.family.subtab')
    const ok: FamilySubTabId[] = [
      'members',
      'parenting',
      'meds',
      'shopping',
      'tree',
      'milestones',
    ]
    if (raw && (ok as string[]).includes(raw)) return raw as FamilySubTabId
  } catch {
    /* ignore */
  }
  return 'members'
}

export function writeFamilySubTab(id: FamilySubTabId): void {
  try {
    wbStoreSetRaw('uniwork.wb.family.subtab', id)
  } catch {
    /* ignore */
  }
}

export function readFamily(): WbFamilyMember[] {
  return readJson('uniwork.wb.family', [])
}

export function writeFamily(items: WbFamilyMember[]): void {
  writeJson('uniwork.wb.family', items)
}

/** Đồng hành cùng con — hoạt động / học tập / quan tâm */
export interface WbFamilyParentingItem {
  id: string
  date: string
  childName: string
  title: string
  kind: 'study' | 'health' | 'activity' | 'talk' | 'other'
  note?: string
  done: boolean
}

export function readFamilyParenting(): WbFamilyParentingItem[] {
  return readJson('uniwork.wb.family.parenting', [])
}

export function writeFamilyParenting(items: WbFamilyParentingItem[]): void {
  writeJson('uniwork.wb.family.parenting', items)
}

/** Nhắc thuốc trong gia đình */
export interface WbFamilyMedItem {
  id: string
  person: string
  medicine: string
  dose?: string
  schedule: string
  startDate?: string
  endDate?: string
  note?: string
  active: boolean
}

export function readFamilyMeds(): WbFamilyMedItem[] {
  return readJson('uniwork.wb.family.meds', [])
}

export function writeFamilyMeds(items: WbFamilyMedItem[]): void {
  writeJson('uniwork.wb.family.meds', items)
}

/** Chi tiêu / mua sắm gia đình */
export interface WbFamilyShopItem {
  id: string
  date: string
  title: string
  amount: number
  category: 'food' | 'kids' | 'home' | 'health' | 'gift' | 'other'
  note?: string
}

export function readFamilyShopping(): WbFamilyShopItem[] {
  return readJson('uniwork.wb.family.shopping', [])
}

export function writeFamilyShopping(items: WbFamilyShopItem[]): void {
  writeJson('uniwork.wb.family.shopping', items)
}

/** Gia phả — thành viên trên cây */
export interface WbFamilyTreeNode {
  id: string
  name: string
  generation: number
  side: 'paternal' | 'maternal' | 'self' | 'spouse' | 'other'
  /** Up to two parent node ids (links for the visual tree). */
  parentIds?: string[]
  /** Optional spouse link (pair rendered side-by-side). */
  spouseId?: string
  parentNames?: string
  birthYear?: string
  note?: string
  gender?: 'm' | 'f' | 'x'
}

export function readFamilyTree(): WbFamilyTreeNode[] {
  return readJson('uniwork.wb.family.tree', [])
}

export function writeFamilyTree(items: WbFamilyTreeNode[]): void {
  writeJson('uniwork.wb.family.tree', items)
}

/** Cột mốc kỷ niệm */
export interface WbFamilyMilestone {
  id: string
  date: string
  title: string
  kind: 'birthday' | 'wedding' | 'memorial' | 'achievement' | 'other'
  people?: string
  note?: string
  recurYearly: boolean
}

export function readFamilyMilestones(): WbFamilyMilestone[] {
  return readJson('uniwork.wb.family.milestones', [])
}

export function writeFamilyMilestones(items: WbFamilyMilestone[]): void {
  writeJson('uniwork.wb.family.milestones', items)
}

/** Sub-tabs inside Bạn bè */
export type FriendsSubTabId = 'people' | 'events' | 'anniversaries'

export interface WbFriend {
  id: string
  name: string
  nickname?: string
  howMet?: string
  birthday?: string
  phone?: string
  email?: string
  social?: string
  note?: string
}

export interface WbFriendEvent {
  id: string
  date: string
  title: string
  friendName?: string
  kind: 'meetup' | 'party' | 'trip' | 'gift' | 'other'
  note?: string
  done: boolean
}

export interface WbFriendAnniversary {
  id: string
  date: string
  title: string
  friendName?: string
  kind: 'friendship' | 'birthday' | 'met' | 'other'
  note?: string
  recurYearly: boolean
}

export function readFriendsSubTab(): FriendsSubTabId {
  try {
    const raw = wbStoreGetRaw('uniwork.wb.friends.subtab')
    const ok: FriendsSubTabId[] = ['people', 'events', 'anniversaries']
    if (raw && (ok as string[]).includes(raw)) return raw as FriendsSubTabId
  } catch {
    /* ignore */
  }
  return 'people'
}

export function writeFriendsSubTab(id: FriendsSubTabId): void {
  try {
    wbStoreSetRaw('uniwork.wb.friends.subtab', id)
  } catch {
    /* ignore */
  }
}

export function readFriends(): WbFriend[] {
  return readJson('uniwork.wb.friends', [])
}

export function writeFriends(items: WbFriend[]): void {
  writeJson('uniwork.wb.friends', items)
}

export function readFriendEvents(): WbFriendEvent[] {
  return readJson('uniwork.wb.friends.events', [])
}

export function writeFriendEvents(items: WbFriendEvent[]): void {
  writeJson('uniwork.wb.friends.events', items)
}

export function readFriendAnniversaries(): WbFriendAnniversary[] {
  return readJson('uniwork.wb.friends.anniversaries', [])
}

export function writeFriendAnniversaries(items: WbFriendAnniversary[]): void {
  writeJson('uniwork.wb.friends.anniversaries', items)
}

/** ── Pets (on-device profiles + photo album via IndexedDB) ─ */

export type PetsSubTabId = 'roster' | 'gallery' | 'care'

export type WbPetSpecies = 'dog' | 'cat' | 'bird' | 'fish' | 'rabbit' | 'other'

export type WbPetCareKind =
  | 'feed'
  | 'walk'
  | 'bath'
  | 'groom'
  | 'meds'
  | 'vet'
  | 'play'
  | 'other'

export type WbPetCareStatus = 'planned' | 'done' | 'skipped'

export interface WbPet {
  id: string
  name: string
  species: WbPetSpecies
  breed?: string
  birthday?: string
  sex?: 'male' | 'female' | 'unknown'
  color?: string
  notes?: string
  /** Photo id used as avatar (blob in IndexedDB). */
  avatarPhotoId?: string
  createdAt: string
}

export interface WbPetPhotoMeta {
  id: string
  petId: string
  caption?: string
  takenAt: string
  source: 'upload' | 'camera'
}

/** Scheduled care activity + optional result log (on-device). */
export interface WbPetCareItem {
  id: string
  petId: string
  kind: WbPetCareKind
  /** Optional free-text title; kind covers the category. */
  title?: string
  /** Local calendar date YYYY-MM-DD */
  scheduledDate: string
  /** Optional local time HH:mm */
  scheduledTime?: string
  status: WbPetCareStatus
  /** Plan / reminder note */
  note?: string
  /** Outcome when marked done or skipped */
  result?: string
  completedAt?: string
  createdAt: string
}

const PETS_DB = 'uniwork.wb.pets.media'
const PETS_STORE = 'photos'

function openPetsDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(PETS_DB, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(PETS_STORE)) {
        db.createObjectStore(PETS_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('pets_idb_open_failed'))
  })
}

export async function putPetPhotoBlob(id: string, dataUrl: string): Promise<void> {
  const db = await openPetsDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PETS_STORE, 'readwrite')
    tx.objectStore(PETS_STORE).put(dataUrl, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('pets_idb_put_failed'))
  })
  db.close()
}

export async function getPetPhotoBlob(id: string): Promise<string | null> {
  const db = await openPetsDb()
  const value = await new Promise<string | null>((resolve, reject) => {
    const tx = db.transaction(PETS_STORE, 'readonly')
    const req = tx.objectStore(PETS_STORE).get(id)
    req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null)
    req.onerror = () => reject(req.error ?? new Error('pets_idb_get_failed'))
  })
  db.close()
  return value
}

export async function deletePetPhotoBlob(id: string): Promise<void> {
  const db = await openPetsDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PETS_STORE, 'readwrite')
    tx.objectStore(PETS_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('pets_idb_delete_failed'))
  })
  db.close()
}

export function readPetsSubTab(): PetsSubTabId {
  try {
    const raw = wbStoreGetRaw('uniwork.wb.pets.subtab')
    if (raw === 'roster' || raw === 'gallery' || raw === 'care') return raw
  } catch {
    /* ignore */
  }
  return 'roster'
}

export function writePetsSubTab(id: PetsSubTabId): void {
  try {
    wbStoreSetRaw('uniwork.wb.pets.subtab', id)
  } catch {
    /* ignore */
  }
}

export function readPets(): WbPet[] {
  return readJson('uniwork.wb.pets', [])
}

export function writePets(items: WbPet[]): void {
  writeJson('uniwork.wb.pets', items)
}

export function readPetPhotos(): WbPetPhotoMeta[] {
  return readJson('uniwork.wb.pets.photos', [])
}

export function writePetPhotos(items: WbPetPhotoMeta[]): void {
  writeJson('uniwork.wb.pets.photos', items)
}

export function readPetCare(): WbPetCareItem[] {
  return readJson('uniwork.wb.pets.care', [])
}

export function writePetCare(items: WbPetCareItem[]): void {
  writeJson('uniwork.wb.pets.care', items)
}

/**
 * Resize/compress an image File to a JPEG data URL for on-device storage.
 * Keeps albums usable within browser storage quotas.
 */
export function compressPetImage(file: File, maxEdge = 960, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas_unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      try {
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image_load_failed'))
    }
    img.src = url
  })
}

export interface WbTravelCheckItem {
  id: string
  text: string
  done: boolean
}

export interface WbTravelTrip {
  id: string
  title: string
  destination: string
  startDate?: string
  endDate?: string
  status: 'planning' | 'booked' | 'ongoing' | 'done'
  note?: string
  /** Packing / prep checklist */
  checklist: WbTravelCheckItem[]
  /** Free-form itinerary / nhật ký hành trình */
  itinerary?: string
  linkedProjectId?: string
}

export function defaultTravelChecklist(vi: boolean): WbTravelCheckItem[] {
  const texts = vi
    ? [
        'Hộ chiếu / CCCD còn hạn',
        'Vé máy bay / tàu',
        'Khách sạn / chỗ ở',
        'Bảo hiểm du lịch',
        'Đổi tiền / thẻ',
        'Sạc / ổ chuyển',
        'Thuốc / đồ cá nhân',
        'Offline map / eSIM',
      ]
    : [
        'Passport / ID valid',
        'Flights / trains',
        'Hotel / stay',
        'Travel insurance',
        'Cash / cards',
        'Chargers / adapter',
        'Meds / personal items',
        'Offline maps / eSIM',
      ]
  return texts.map((text, i) => ({
    id: `prep-${i}-${Date.now().toString(36)}`,
    text,
    done: false,
  }))
}

export function readTravel(): WbTravelTrip[] {
  return readJson('uniwork.wb.travel', [])
}

export function writeTravel(items: WbTravelTrip[]): void {
  writeJson('uniwork.wb.travel', items)
}

export interface WbClientItem {
  id: string
  name: string
  contact?: string
  phone?: string
  email?: string
  note?: string
}

export interface WbContractItem {
  id: string
  title: string
  party?: string
  startDate?: string
  endDate?: string
  status: 'draft' | 'active' | 'expired' | 'other'
  note?: string
  /** Pack id — first save of Soạn joins this pack's Tài liệu. */
  linkedProjectId?: string
}

export interface WbMatterItem {
  id: string
  title: string
  client?: string
  matterType?: string
  status: 'open' | 'pending' | 'closed'
  nextDate?: string
  note?: string
  /** Pack id — first save of Tóm tắt joins this pack's Tài liệu. */
  linkedProjectId?: string
}

export function readClients(practiceId: PracticeId): WbClientItem[] {
  return readJson(`uniwork.wb.clients.${practiceId}`, [])
}

export function writeClients(practiceId: PracticeId, items: WbClientItem[]): void {
  writeJson(`uniwork.wb.clients.${practiceId}`, items)
}

export function readContracts(practiceId: PracticeId): WbContractItem[] {
  return readJson(`uniwork.wb.contracts.${practiceId}`, [])
}

export function writeContracts(practiceId: PracticeId, items: WbContractItem[]): void {
  writeJson(`uniwork.wb.contracts.${practiceId}`, items)
}

export function readMatters(practiceId: PracticeId): WbMatterItem[] {
  return readJson(`uniwork.wb.matters.${practiceId}`, [])
}

export function writeMatters(practiceId: PracticeId, items: WbMatterItem[]): void {
  writeJson(`uniwork.wb.matters.${practiceId}`, items)
}

export interface WbStudentItem {
  id: string
  name: string
  className?: string
  /** Hard link to a WbParentItem.id when set. */
  parentId?: string
  parentName?: string
  phone?: string
  email?: string
  note?: string
  /** Flag for Desk “HS cần follow-up”. */
  followUp?: boolean
}

export interface WbParentItem {
  id: string
  name: string
  /** Hard links to WbStudentItem.id rows. */
  studentIds?: string[]
  /** Denormalized student name(s) for list display. */
  studentName?: string
  phone?: string
  email?: string
  note?: string
}

export function readStudents(practiceId: PracticeId): WbStudentItem[] {
  return readJson(`uniwork.wb.students.${practiceId}`, [])
}

export function writeStudents(practiceId: PracticeId, items: WbStudentItem[]): void {
  writeJson(`uniwork.wb.students.${practiceId}`, items)
}

export function readParents(practiceId: PracticeId): WbParentItem[] {
  return readJson(`uniwork.wb.parents.${practiceId}`, [])
}

export function writeParents(practiceId: PracticeId, items: WbParentItem[]): void {
  writeJson(`uniwork.wb.parents.${practiceId}`, items)
}

export function listStudentClasses(students: readonly WbStudentItem[]): string[] {
  const set = new Set<string>()
  for (const s of students) {
    const c = s.className?.trim()
    if (c) set.add(c)
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'vi'))
}

function newRosterId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** Rebuild denormalized parent.studentName + student.parentName from ids. */
export function syncStudentParentDenorm(
  students: WbStudentItem[],
  parents: WbParentItem[],
): { students: WbStudentItem[]; parents: WbParentItem[] } {
  const studentById = new Map(students.map((s) => [s.id, s]))
  const parentById = new Map(parents.map((p) => [p.id, p]))

  const nextStudents = students.map((s) => {
    if (!s.parentId) return s
    const p = parentById.get(s.parentId)
    if (!p) {
      const row = { ...s }
      delete row.parentId
      return row
    }
    return { ...s, parentName: p.name }
  })

  const nextParents = parents.map((p) => {
    const ids = (p.studentIds ?? []).filter((id) => studentById.has(id))
    const names = ids
      .map((id) => studentById.get(id)?.name)
      .filter((n): n is string => Boolean(n))
    const row: WbParentItem = { ...p }
    if (ids.length) row.studentIds = ids
    else delete row.studentIds
    if (names.length) row.studentName = names.join(', ')
    else delete row.studentName
    return row
  })

  return { students: nextStudents, parents: nextParents }
}

/**
 * Link one student ↔ one parent (1 parent per student; parent may have many students).
 * Clears the student's previous parent link.
 */
export function linkStudentParent(
  students: WbStudentItem[],
  parents: WbParentItem[],
  studentId: string,
  parentId: string | null,
): { students: WbStudentItem[]; parents: WbParentItem[] } {
  const nextStudents = students.map((s) => {
    if (s.id !== studentId) return s
    if (!parentId) {
      const row = { ...s }
      delete row.parentId
      delete row.parentName
      return row
    }
    const p = parents.find((x) => x.id === parentId)
    return {
      ...s,
      parentId,
      ...(p ? { parentName: p.name } : {}),
    }
  })

  const nextParents = parents.map((p) => {
    const ids = new Set(p.studentIds ?? [])
    ids.delete(studentId)
    if (parentId && p.id === parentId) ids.add(studentId)
    const row: WbParentItem = { ...p }
    if (ids.size) row.studentIds = [...ids]
    else delete row.studentIds
    return row
  })

  return syncStudentParentDenorm(nextStudents, nextParents)
}

/** Find parent by name (case/diacritic-insensitive) or create one. */
export function ensureParentByName(
  parents: WbParentItem[],
  name: string,
): { parents: WbParentItem[]; parent: WbParentItem } {
  const n = name.trim()
  const norm = (s: string) =>
    s
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
  const existing = parents.find((p) => norm(p.name) === norm(n))
  if (existing) return { parents, parent: existing }
  const parent: WbParentItem = { id: newRosterId(), name: n }
  return { parents: [parent, ...parents], parent }
}

export interface RosterImportRow {
  name: string
  className?: string
  parentName?: string
  phone?: string
  email?: string
}

function normHeader(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
}

function isRosterHeaderRow(cols: readonly string[]): boolean {
  const head = normHeader(cols[0] ?? '')
  return /^(stt|name|ho ten|hoten|student|hoc sinh|ho va ten)$/.test(head)
}

/** Parse spreadsheet / paste rows: name, class, parent, phone, email. */
export function parseRosterImportRows(table: readonly (readonly string[])[]): RosterImportRow[] {
  const rows: RosterImportRow[] = []
  for (const raw of table) {
    const cols = raw.map((c) => String(c ?? '').trim())
    if (!cols.some(Boolean)) continue
    // Drop leading STT column when present
    let offset = 0
    if (cols[0] && /^\d+$/.test(cols[0]) && cols.length >= 2) offset = 1
    const nameCol = cols[offset] ?? ''
    if (!nameCol) continue
    if (rows.length === 0 && isRosterHeaderRow(cols.slice(offset))) continue
    if (rows.length === 0 && isRosterHeaderRow(cols)) continue
    rows.push({
      name: nameCol,
      ...(cols[offset + 1] ? { className: cols[offset + 1] } : {}),
      ...(cols[offset + 2] ? { parentName: cols[offset + 2] } : {}),
      ...(cols[offset + 3] ? { phone: cols[offset + 3] } : {}),
      ...(cols[offset + 4] ? { email: cols[offset + 4] } : {}),
    })
  }
  return rows
}

/**
 * Parse paste of CSV/TSV lines: name, class, parent, phone, email.
 * Header row (name/họ tên…) is skipped when detected.
 */
export function parseRosterImport(text: string): RosterImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const table = lines.map((line) =>
    line.includes('\t')
      ? line.split('\t').map((c) => c.trim())
      : line.split(/[,;]/).map((c) => c.trim()),
  )
  return parseRosterImportRows(table)
}

export function exportStudentsCsv(students: readonly WbStudentItem[]): string {
  const header = ['STT', 'Họ tên', 'Lớp', 'Phụ huynh', 'SĐT', 'Email', 'Ghi chú']
  const lines = [header.join(',')]
  students.forEach((s, i) => {
    lines.push(
      [
        String(i + 1),
        csvEscape(s.name),
        csvEscape(s.className ?? ''),
        csvEscape(s.parentName ?? ''),
        csvEscape(s.phone ?? ''),
        csvEscape(s.email ?? ''),
        csvEscape(s.note ?? ''),
      ].join(','),
    )
  })
  return `\uFEFF${lines.join('\n')}`
}

export function exportParentsCsv(parents: readonly WbParentItem[]): string {
  const header = ['STT', 'Họ tên', 'Học sinh', 'SĐT', 'Email', 'Ghi chú']
  const lines = [header.join(',')]
  parents.forEach((p, i) => {
    lines.push(
      [
        String(i + 1),
        csvEscape(p.name),
        csvEscape(p.studentName ?? ''),
        csvEscape(p.phone ?? ''),
        csvEscape(p.email ?? ''),
        csvEscape(p.note ?? ''),
      ].join(','),
    )
  })
  return `\uFEFF${lines.join('\n')}`
}

export function applyParentsImport(
  students: WbStudentItem[],
  parents: WbParentItem[],
  table: readonly (readonly string[])[],
): { students: WbStudentItem[]; parents: WbParentItem[]; added: number } {
  let nextStudents = [...students]
  let nextParents = [...parents]
  let added = 0
  let started = false
  for (const raw of table) {
    const cols = raw.map((c) => String(c ?? '').trim())
    if (!cols.some(Boolean)) continue
    let offset = 0
    if (cols[0] && /^\d+$/.test(cols[0]) && cols.length >= 2) offset = 1
    const name = cols[offset] ?? ''
    if (!name) continue
    const head = normHeader(name)
    if (!started && /^(stt|name|ho ten|hoten|parent|phu huynh)$/.test(head)) {
      started = true
      continue
    }
    started = true
    const studentNames = (cols[offset + 1] ?? '')
      .split(/[;,/|]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const phone = cols[offset + 2]?.trim()
    const email = cols[offset + 3]?.trim()
    const note = cols[offset + 4]?.trim()
    const ensured = ensureParentByName(nextParents, name)
    nextParents = ensured.parents
    const parent = {
      ...ensured.parent,
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
      ...(note ? { note } : {}),
    }
    nextParents = nextParents.map((p) => (p.id === parent.id ? parent : p))
    for (const sn of studentNames) {
      const hit = nextStudents.find((s) => normHeader(s.name) === normHeader(sn))
      if (!hit) continue
      const linked = linkStudentParent(nextStudents, nextParents, hit.id, parent.id)
      nextStudents = linked.students
      nextParents = linked.parents
    }
    added += 1
  }
  return { ...syncStudentParentDenorm(nextStudents, nextParents), added }
}

/** Merge import rows into students + parents with hard links. */
export function applyRosterImport(
  students: WbStudentItem[],
  parents: WbParentItem[],
  rows: readonly RosterImportRow[],
): { students: WbStudentItem[]; parents: WbParentItem[]; added: number } {
  let nextStudents = [...students]
  let nextParents = [...parents]
  let added = 0
  for (const row of rows) {
    const name = row.name.trim()
    if (!name) continue
    const studentId = newRosterId()
    let parentId: string | undefined
    if (row.parentName?.trim()) {
      const ensured = ensureParentByName(nextParents, row.parentName)
      nextParents = ensured.parents
      parentId = ensured.parent.id
    }
    const student: WbStudentItem = {
      id: studentId,
      name,
      ...(row.className?.trim() ? { className: row.className.trim() } : {}),
      ...(parentId ? { parentId } : {}),
      ...(row.phone?.trim() ? { phone: row.phone.trim() } : {}),
      ...(row.email?.trim() ? { email: row.email.trim() } : {}),
    }
    nextStudents = [student, ...nextStudents]
    if (parentId) {
      const linked = linkStudentParent(nextStudents, nextParents, studentId, parentId)
      nextStudents = linked.students
      nextParents = linked.parents
    }
    added += 1
  }
  const synced = syncStudentParentDenorm(nextStudents, nextParents)
  return { ...synced, added }
}

export interface WbGradeColumn {
  id: string
  label: string
}

/** Simple class gradebook — columns × students (scores as free text). */
export interface WbGradebook {
  className: string
  columns: WbGradeColumn[]
  /** studentId → columnId → score */
  scores: Record<string, Record<string, string>>
}

export function readGradebooks(practiceId: PracticeId): WbGradebook[] {
  const raw = readJson<WbGradebook[]>(`uniwork.wb.grades.${practiceId}`, [])
  if (!Array.isArray(raw)) return []
  return raw.filter((b) => b && typeof b.className === 'string')
}

export function writeGradebooks(practiceId: PracticeId, books: WbGradebook[]): void {
  writeJson(`uniwork.wb.grades.${practiceId}`, books)
}

export function ensureGradebook(
  books: WbGradebook[],
  className: string,
): { books: WbGradebook[]; book: WbGradebook } {
  const c = className.trim()
  const existing = books.find((b) => b.className === c)
  if (existing) return { books, book: existing }
  const book: WbGradebook = {
    className: c,
    columns: [
      { id: newRosterId(), label: 'Miệng' },
      { id: newRosterId(), label: '15p' },
      { id: newRosterId(), label: '1 tiết' },
      { id: newRosterId(), label: 'HK' },
    ],
    scores: {},
  }
  return { books: [...books, book], book }
}

/** CSV export (UTF-8 BOM for Excel). */
export function exportGradebookCsv(
  book: WbGradebook,
  students: readonly WbStudentItem[],
): string {
  const rows = students
    .filter((s) => (s.className ?? '') === book.className)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  const header = ['STT', 'Họ tên', ...book.columns.map((c) => c.label)]
  const lines = [header.join(',')]
  rows.forEach((s, i) => {
    const cells = [
      String(i + 1),
      csvEscape(s.name),
      ...book.columns.map((c) => csvEscape(book.scores[s.id]?.[c.id] ?? '')),
    ]
    lines.push(cells.join(','))
  })
  return `\uFEFF${lines.join('\n')}`
}

function csvEscape(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

/** Import gradebook rows (header: STT?, Họ tên, score columns…). Matches students by name. */
export function importGradebookFromRows(
  book: WbGradebook,
  students: readonly WbStudentItem[],
  table: readonly (readonly string[])[],
): { book: WbGradebook; updated: number } {
  if (table.length === 0) return { book, updated: 0 }
  const header = table[0]!.map((c) => String(c ?? '').trim())
  let nameIdx = header.findIndex((h) =>
    /^(ho ten|hoten|name|hoc sinh|student|ho va ten)$/.test(normHeader(h)),
  )
  if (nameIdx < 0) nameIdx = header.length >= 2 && /^\d+$/.test(header[0] ?? '') ? 1 : 0
  const colMap: { label: string; index: number; id: string }[] = []
  let columns = [...book.columns]
  for (let i = 0; i < header.length; i++) {
    if (i === nameIdx) continue
    const label = header[i]?.trim()
    if (!label || /^(stt|#|no\.?)$/i.test(label)) continue
    let col = columns.find((c) => normHeader(c.label) === normHeader(label))
    if (!col) {
      col = { id: newRosterId(), label }
      columns = [...columns, col]
    }
    colMap.push({ label, index: i, id: col.id })
  }
  const classStudents = students.filter((s) => (s.className ?? '') === book.className)
  const byName = new Map(classStudents.map((s) => [normHeader(s.name), s]))
  const scores: WbGradebook['scores'] = { ...book.scores }
  let updated = 0
  for (const raw of table.slice(1)) {
    const cols = raw.map((c) => String(c ?? '').trim())
    const name = cols[nameIdx]?.trim()
    if (!name) continue
    const student = byName.get(normHeader(name))
    if (!student) continue
    const row = { ...(scores[student.id] ?? {}) }
    let touched = false
    for (const m of colMap) {
      const v = cols[m.index]?.trim() ?? ''
      if (v) {
        row[m.id] = v
        touched = true
      }
    }
    if (touched) {
      scores[student.id] = row
      updated += 1
    }
  }
  return { book: { ...book, columns, scores }, updated }
}

// —— P2 teacher ops: attendance · timetable · question bank ——————————————

export type AttendanceMark = 'present' | 'absent' | 'late' | 'excused'

export interface WbAttendanceSession {
  id: string
  date: string
  className: string
  period?: string
  /** studentId → mark */
  marks: Record<string, AttendanceMark>
  note?: string
}

export function readAttendance(practiceId: PracticeId): WbAttendanceSession[] {
  const raw = readJson<WbAttendanceSession[]>(`uniwork.wb.attendance.${practiceId}`, [])
  return Array.isArray(raw) ? raw : []
}

export function writeAttendance(practiceId: PracticeId, items: WbAttendanceSession[]): void {
  writeJson(`uniwork.wb.attendance.${practiceId}`, items)
}

export function findAttendanceSession(
  sessions: readonly WbAttendanceSession[],
  date: string,
  className: string,
  period?: string,
): WbAttendanceSession | undefined {
  const p = period?.trim() || undefined
  return sessions.find(
    (s) =>
      s.date === date &&
      s.className === className &&
      (s.period?.trim() || undefined) === p,
  )
}

export function attendanceSummary(session: WbAttendanceSession): {
  present: number
  absent: number
  late: number
  excused: number
  total: number
} {
  let present = 0
  let absent = 0
  let late = 0
  let excused = 0
  for (const m of Object.values(session.marks)) {
    if (m === 'present') present += 1
    else if (m === 'absent') absent += 1
    else if (m === 'late') late += 1
    else if (m === 'excused') excused += 1
  }
  return { present, absent, late, excused, total: present + absent + late + excused }
}

/** Monday = 0 … Sunday = 6 */
export type TimetableDay = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface WbTimetableSlot {
  id: string
  day: TimetableDay
  period: string
  subject?: string
  className?: string
  room?: string
  note?: string
}

export function readTimetable(practiceId: PracticeId): WbTimetableSlot[] {
  const raw = readJson<WbTimetableSlot[]>(`uniwork.wb.timetable.${practiceId}`, [])
  return Array.isArray(raw) ? raw : []
}

export function writeTimetable(practiceId: PracticeId, slots: WbTimetableSlot[]): void {
  writeJson(`uniwork.wb.timetable.${practiceId}`, slots)
}

export function slotKey(day: TimetableDay, period: string): string {
  return `${day}:${period}`
}

export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

export interface WbQuestionItem {
  id: string
  stem: string
  subject?: string
  grade?: string
  tags?: string[]
  answer?: string
  difficulty?: QuestionDifficulty
  createdAt: string
}

export function readQuestions(practiceId: PracticeId): WbQuestionItem[] {
  const raw = readJson<WbQuestionItem[]>(`uniwork.wb.questions.${practiceId}`, [])
  return Array.isArray(raw) ? raw : []
}

export function writeQuestions(practiceId: PracticeId, items: WbQuestionItem[]): void {
  writeJson(`uniwork.wb.questions.${practiceId}`, items)
}

export function exportQuestionsCsv(items: readonly WbQuestionItem[]): string {
  const header = ['STT', 'Câu hỏi', 'Đáp án', 'Môn', 'Lớp', 'Tags', 'Độ khó']
  const lines = [header.join(',')]
  items.forEach((q, i) => {
    lines.push(
      [
        String(i + 1),
        csvEscape(q.stem),
        csvEscape(q.answer ?? ''),
        csvEscape(q.subject ?? ''),
        csvEscape(q.grade ?? ''),
        csvEscape((q.tags ?? []).join('; ')),
        csvEscape(q.difficulty ?? ''),
      ].join(','),
    )
  })
  return `\uFEFF${lines.join('\n')}`
}

export function importQuestionsFromRows(
  existing: readonly WbQuestionItem[],
  table: readonly (readonly string[])[],
): { items: WbQuestionItem[]; added: number } {
  if (table.length === 0) return { items: [...existing], added: 0 }
  const header = table[0]!.map((c) => normHeader(String(c ?? '')))
  const findCol = (...names: string[]) =>
    header.findIndex((h) => names.some((n) => h === n || h.includes(n)))
  let stemIdx = findCol('cau hoi', 'stem', 'question', 'cau')
  let answerIdx = findCol('dap an', 'answer')
  let subjectIdx = findCol('mon', 'subject')
  let gradeIdx = findCol('lop', 'grade', 'class')
  let tagsIdx = findCol('tag')
  let diffIdx = findCol('do kho', 'difficulty', 'level')
  const hasHeader = stemIdx >= 0 || findCol('stt') === 0
  if (!hasHeader) {
    stemIdx = 0
    answerIdx = 1
    subjectIdx = 2
    gradeIdx = 3
    tagsIdx = 4
    diffIdx = 5
  }
  const body = hasHeader ? table.slice(1) : table
  const addedItems: WbQuestionItem[] = []
  for (const raw of body) {
    const cols = raw.map((c) => String(c ?? '').trim())
    const stem = (stemIdx >= 0 ? cols[stemIdx] : cols[0])?.trim()
    if (!stem) continue
    const diffRaw = (diffIdx >= 0 ? cols[diffIdx] : '')?.trim().toLowerCase() ?? ''
    const difficulty: QuestionDifficulty | undefined = /hard|kho/.test(diffRaw)
      ? 'hard'
      : /easy|de/.test(diffRaw)
        ? 'easy'
        : /medium|trung/.test(diffRaw)
          ? 'medium'
          : undefined
    const tagsRaw = tagsIdx >= 0 ? cols[tagsIdx] ?? '' : ''
    const tags = tagsRaw
      .split(/[;,|/]/)
      .map((t) => t.trim())
      .filter(Boolean)
    addedItems.push({
      id: newRosterId(),
      stem,
      createdAt: new Date().toISOString(),
      ...(answerIdx >= 0 && cols[answerIdx]?.trim()
        ? { answer: cols[answerIdx]!.trim() }
        : {}),
      ...(subjectIdx >= 0 && cols[subjectIdx]?.trim()
        ? { subject: cols[subjectIdx]!.trim() }
        : {}),
      ...(gradeIdx >= 0 && cols[gradeIdx]?.trim() ? { grade: cols[gradeIdx]!.trim() } : {}),
      ...(tags.length ? { tags } : {}),
      ...(difficulty ? { difficulty } : {}),
    })
  }
  return { items: [...addedItems, ...existing], added: addedItems.length }
}

const ATTENDANCE_MARK_LABEL: Record<AttendanceMark, string> = {
  present: 'Có mặt',
  absent: 'Vắng',
  late: 'Đi muộn',
  excused: 'Có phép',
}

export function parseAttendanceMark(raw: string): AttendanceMark | null {
  const t = normHeader(raw)
  if (!t) return null
  if (/^(c|co mat|present|p|x)$/.test(t)) return 'present'
  if (/^(v|vang|absent|a)$/.test(t)) return 'absent'
  if (/^(m|di muon|late|l)$/.test(t)) return 'late'
  if (/^(cp|co phep|excused|e)$/.test(t)) return 'excused'
  return null
}

export function exportAttendanceCsv(
  session: WbAttendanceSession,
  students: readonly WbStudentItem[],
): string {
  const rows = students
    .filter((s) => (s.className ?? '') === session.className)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  const lines = [['STT', 'Họ tên', 'Trạng thái'].join(',')]
  rows.forEach((s, i) => {
    const m = session.marks[s.id]
    lines.push(
      [String(i + 1), csvEscape(s.name), csvEscape(m ? ATTENDANCE_MARK_LABEL[m] : '')].join(','),
    )
  })
  return `\uFEFF${lines.join('\n')}`
}

export function importAttendanceFromRows(
  session: WbAttendanceSession,
  students: readonly WbStudentItem[],
  table: readonly (readonly string[])[],
): { session: WbAttendanceSession; updated: number } {
  if (table.length === 0) return { session, updated: 0 }
  const header = table[0]!.map((c) => normHeader(String(c ?? '')))
  let nameIdx = header.findIndex((h) =>
    /^(ho ten|hoten|name|hoc sinh|student)$/.test(h),
  )
  let markIdx = header.findIndex((h) =>
    /^(trang thai|status|mark|diem danh)$/.test(h),
  )
  const hasHeader = nameIdx >= 0 || markIdx >= 0
  if (!hasHeader) {
    nameIdx = 1
    markIdx = 2
  } else {
    if (nameIdx < 0) nameIdx = 1
    if (markIdx < 0) markIdx = Math.max(nameIdx + 1, 2)
  }
  const body = hasHeader ? table.slice(1) : table
  const classStudents = students.filter((s) => (s.className ?? '') === session.className)
  const byName = new Map(classStudents.map((s) => [normHeader(s.name), s]))
  const marks = { ...session.marks }
  let updated = 0
  for (const raw of body) {
    const cols = raw.map((c) => String(c ?? '').trim())
    const name = cols[nameIdx]?.trim()
    if (!name) continue
    const student = byName.get(normHeader(name))
    if (!student) continue
    const mark = parseAttendanceMark(cols[markIdx] ?? '')
    if (!mark) continue
    marks[student.id] = mark
    updated += 1
  }
  return { session: { ...session, marks }, updated }
}

const DAY_LABELS_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const
const DAY_LABELS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export function exportTimetableCsv(slots: readonly WbTimetableSlot[]): string {
  const header = ['Ngày', 'Tiết', 'Môn', 'Lớp', 'Phòng', 'Ghi chú']
  const lines = [header.join(',')]
  const sorted = slots.slice().sort((a, b) => a.day - b.day || a.period.localeCompare(b.period))
  for (const s of sorted) {
    lines.push(
      [
        csvEscape(DAY_LABELS_VI[s.day] ?? String(s.day)),
        csvEscape(s.period),
        csvEscape(s.subject ?? ''),
        csvEscape(s.className ?? ''),
        csvEscape(s.room ?? ''),
        csvEscape(s.note ?? ''),
      ].join(','),
    )
  }
  return `\uFEFF${lines.join('\n')}`
}

export function parseTimetableDay(raw: string): TimetableDay | null {
  const t = normHeader(raw)
  if (!t) return null
  if (/^(0|t2|thu 2|mon|monday)$/.test(t)) return 0
  if (/^(1|t3|thu 3|tue|tuesday)$/.test(t)) return 1
  if (/^(2|t4|thu 4|wed|wednesday)$/.test(t)) return 2
  if (/^(3|t5|thu 5|thu|thursday)$/.test(t)) return 3
  if (/^(4|t6|thu 6|fri|friday)$/.test(t)) return 4
  if (/^(5|t7|thu 7|sat|saturday)$/.test(t)) return 5
  if (/^(6|cn|chu nhat|sun|sunday)$/.test(t)) return 6
  const n = Number(t)
  if (n >= 0 && n <= 6) return n as TimetableDay
  return null
}

export function importTimetableFromRows(
  existing: readonly WbTimetableSlot[],
  table: readonly (readonly string[])[],
): { slots: WbTimetableSlot[]; imported: number } {
  if (table.length === 0) return { slots: [...existing], imported: 0 }
  const header = table[0]!.map((c) => normHeader(String(c ?? '')))
  const findCol = (...names: string[]) => header.findIndex((h) => names.some((n) => h === n))
  let dayIdx = findCol('ngay', 'day', 'thu')
  let periodIdx = findCol('tiet', 'period')
  let subjectIdx = findCol('mon', 'subject')
  let classIdx = findCol('lop', 'class')
  let roomIdx = findCol('phong', 'room')
  let noteIdx = findCol('ghi chu', 'note')
  const hasHeader = dayIdx >= 0 || periodIdx >= 0
  if (!hasHeader) {
    dayIdx = 0
    periodIdx = 1
    subjectIdx = 2
    classIdx = 3
    roomIdx = 4
    noteIdx = 5
  }
  const body = hasHeader ? table.slice(1) : table
  const byKey = new Map(existing.map((s) => [slotKey(s.day, s.period), s]))
  let imported = 0
  for (const raw of body) {
    const cols = raw.map((c) => String(c ?? '').trim())
    const day = parseTimetableDay(dayIdx >= 0 ? cols[dayIdx] ?? '' : '')
    const period = (periodIdx >= 0 ? cols[periodIdx] : '')?.trim()
    if (day == null || !period) continue
    const subject = subjectIdx >= 0 ? cols[subjectIdx]?.trim() : ''
    const className = classIdx >= 0 ? cols[classIdx]?.trim() : ''
    const room = roomIdx >= 0 ? cols[roomIdx]?.trim() : ''
    const note = noteIdx >= 0 ? cols[noteIdx]?.trim() : ''
    if (!subject && !className && !room && !note) continue
    const key = slotKey(day, period)
    const prev = byKey.get(key)
    const row: WbTimetableSlot = {
      id: prev?.id ?? newRosterId(),
      day,
      period,
      ...(subject ? { subject } : {}),
      ...(className ? { className } : {}),
      ...(room ? { room } : {}),
      ...(note ? { note } : {}),
    }
    byKey.set(key, row)
    imported += 1
  }
  return { slots: [...byKey.values()], imported }
}

/** @internal — used by export helpers / tests */
export function timetableDayLabel(day: TimetableDay, vi: boolean): string {
  return vi ? (DAY_LABELS_VI[day] ?? String(day)) : (DAY_LABELS_EN[day] ?? String(day))
}

/** Match học sinh + email PH from free text (My AI playbook). */
export function resolveStudentParentContact(
  practiceId: PracticeId,
  text: string,
): { student: WbStudentItem; parent?: WbParentItem; email?: string } | null {
  const students = readStudents(practiceId)
  if (students.length === 0) return null
  const norm = (s: string) =>
    s
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
  const raw = text.trim()
  const hint =
    /(?:học sinh|hoc sinh|student|hs)\s*[:\-–]?\s*([^,.;\n]+)/i.exec(raw)?.[1]?.trim() ||
    /(?:nhận xét|nhan xet)\s+(?:cho\s+)?([^,.;\n]+?)(?:\s+(?:cuối|cuoi|kỳ|ky|email|phụ|phu)|$)/i.exec(
      raw,
    )?.[1]?.trim()
  let student: WbStudentItem | undefined
  if (hint) {
    const n = norm(hint)
    student =
      students.find((s) => norm(s.name) === n) ||
      students.find((s) => norm(s.name).includes(n) || n.includes(norm(s.name)))
  }
  if (!student && students.length === 1) student = students[0]
  if (!student) return null
  const parents = readParents(practiceId)
  const parent = student.parentId
    ? parents.find((p) => p.id === student!.parentId)
    : student.parentName
      ? parents.find((p) => norm(p.name) === norm(student!.parentName!))
      : undefined
  const email = parent?.email || student.email || undefined
  return { student, parent, ...(email ? { email } : {}) }
}
