/**
 * Local Project Management store (Workbench SQLite via wbStore).
 * Projects + DB connections + cards — separate from Knowledge “Projects” packs.
 */
import type { PracticeId } from '@uniwork/practice-core'
import { wbStoreGetRaw, wbStoreRead, wbStoreSetRaw, wbStoreWrite } from './workbench-store-client'

export type PmDbDriver = 'sqlite' | 'postgres' | 'mysql'
export type PmCardStatus = 'backlog' | 'todo' | 'doing' | 'done'
export type PmViewId = 'list' | 'kanban'
export type PmPanelId =
  | 'board'
  | 'investors'
  | 'payments'
  | 'diary'
  | 'docs'
  | 'connections'
export type PmPaymentStatus = 'planned' | 'due' | 'paid' | 'cancelled'

export interface WbPmDbConnection {
  id: string
  name: string
  driver: PmDbDriver
  /** Absolute path for sqlite */
  sqlitePath?: string
  host?: string
  port?: number
  database?: string
  username?: string
  /** Stored locally only — not synced to cloud */
  password?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface WbPmProject {
  id: string
  name: string
  description?: string
  /** Optional link to a saved DB connection */
  connectionId?: string | null
  color?: string
  archived?: boolean
  createdAt: string
  updatedAt: string
}

export interface WbPmCard {
  id: string
  projectId: string
  title: string
  description?: string
  status: PmCardStatus
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  assignee?: string
  tags?: string[]
  sortOrder: number
  createdAt: string
  updatedAt: string
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function connectionsKey(practiceId: PracticeId): string {
  return `uniwork.wb.pm.connections.${practiceId}`
}
function projectsKey(practiceId: PracticeId): string {
  return `uniwork.wb.pm.projects.${practiceId}`
}
function cardsKey(practiceId: PracticeId): string {
  return `uniwork.wb.pm.cards.${practiceId}`
}

export function readPmConnections(practiceId: PracticeId): WbPmDbConnection[] {
  const raw = wbStoreRead<WbPmDbConnection[]>(connectionsKey(practiceId), [])
  return Array.isArray(raw) ? raw.filter((c) => c && typeof c.id === 'string' && c.name) : []
}

export function writePmConnections(practiceId: PracticeId, items: WbPmDbConnection[]): void {
  wbStoreWrite(connectionsKey(practiceId), items)
}

export function upsertPmConnection(
  practiceId: PracticeId,
  input: Partial<WbPmDbConnection> & { name: string; driver: PmDbDriver },
): WbPmDbConnection {
  const list = readPmConnections(practiceId)
  const ts = nowIso()
  if (input.id) {
    const next = list.map((c) =>
      c.id === input.id
        ? {
            ...c,
            ...input,
            name: input.name.trim(),
            updatedAt: ts,
          }
        : c,
    )
    writePmConnections(practiceId, next)
    return next.find((c) => c.id === input.id)!
  }
  const row: WbPmDbConnection = {
    id: newId(),
    name: input.name.trim(),
    driver: input.driver,
    ...(input.sqlitePath?.trim() ? { sqlitePath: input.sqlitePath.trim() } : {}),
    ...(input.host?.trim() ? { host: input.host.trim() } : {}),
    ...(typeof input.port === 'number' ? { port: input.port } : {}),
    ...(input.database?.trim() ? { database: input.database.trim() } : {}),
    ...(input.username?.trim() ? { username: input.username.trim() } : {}),
    ...(input.password ? { password: input.password } : {}),
    ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
    createdAt: ts,
    updatedAt: ts,
  }
  writePmConnections(practiceId, [row, ...list])
  return row
}

export function deletePmConnection(practiceId: PracticeId, id: string): void {
  writePmConnections(
    practiceId,
    readPmConnections(practiceId).filter((c) => c.id !== id),
  )
  // Detach from projects
  const projects = readPmProjects(practiceId).map((p) =>
    p.connectionId === id ? { ...p, connectionId: null, updatedAt: nowIso() } : p,
  )
  writePmProjects(practiceId, projects)
}

export function readPmProjects(practiceId: PracticeId): WbPmProject[] {
  const raw = wbStoreRead<WbPmProject[]>(projectsKey(practiceId), [])
  return Array.isArray(raw) ? raw.filter((p) => p && typeof p.id === 'string' && p.name) : []
}

export function writePmProjects(practiceId: PracticeId, items: WbPmProject[]): void {
  wbStoreWrite(projectsKey(practiceId), items)
}

export function upsertPmProject(
  practiceId: PracticeId,
  input: Partial<WbPmProject> & { name: string },
): WbPmProject {
  const list = readPmProjects(practiceId)
  const ts = nowIso()
  if (input.id) {
    const next = list.map((p) =>
      p.id === input.id
        ? {
            ...p,
            ...input,
            name: input.name.trim(),
            updatedAt: ts,
          }
        : p,
    )
    writePmProjects(practiceId, next)
    return next.find((p) => p.id === input.id)!
  }
  const row: WbPmProject = {
    id: newId(),
    name: input.name.trim(),
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    connectionId: input.connectionId ?? null,
    ...(input.color ? { color: input.color } : {}),
    archived: false,
    createdAt: ts,
    updatedAt: ts,
  }
  writePmProjects(practiceId, [row, ...list])
  return row
}

export function deletePmProject(practiceId: PracticeId, id: string): void {
  writePmProjects(
    practiceId,
    readPmProjects(practiceId).filter((p) => p.id !== id),
  )
  writePmCards(
    practiceId,
    readPmCards(practiceId).filter((c) => c.projectId !== id),
  )
  writePmInvestors(
    practiceId,
    readPmInvestors(practiceId).filter((x) => x.projectId !== id),
  )
  writePmPayments(
    practiceId,
    readPmPayments(practiceId).filter((x) => x.projectId !== id),
  )
  writePmDiary(
    practiceId,
    readPmDiary(practiceId).filter((x) => x.projectId !== id),
  )
  writePmDocs(
    practiceId,
    readPmDocs(practiceId).filter((x) => x.projectId !== id),
  )
}

export function readPmCards(practiceId: PracticeId): WbPmCard[] {
  const raw = wbStoreRead<WbPmCard[]>(cardsKey(practiceId), [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter((c) => c && typeof c.id === 'string' && typeof c.projectId === 'string' && c.title)
    .map((c) => normalizePmCard(c))
}

export function writePmCards(practiceId: PracticeId, items: WbPmCard[]): void {
  wbStoreWrite(
    cardsKey(practiceId),
    items.map((c) => normalizePmCard(c)),
  )
}

export function normalizePmCard(raw: Partial<WbPmCard> & { id: string; projectId: string; title: string }): WbPmCard {
  const status: PmCardStatus =
    raw.status === 'backlog' ||
    raw.status === 'todo' ||
    raw.status === 'doing' ||
    raw.status === 'done'
      ? raw.status
      : 'todo'
  const ts = nowIso()
  return {
    id: raw.id,
    projectId: raw.projectId,
    title: raw.title.trim(),
    status,
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : 0,
    createdAt: raw.createdAt || ts,
    updatedAt: raw.updatedAt || ts,
    ...(raw.description?.trim() ? { description: raw.description.trim() } : {}),
    ...(raw.priority === 'low' || raw.priority === 'medium' || raw.priority === 'high'
      ? { priority: raw.priority }
      : { priority: 'medium' }),
    ...(raw.dueDate ? { dueDate: raw.dueDate } : {}),
    ...(raw.assignee?.trim() ? { assignee: raw.assignee.trim() } : {}),
    ...(raw.tags?.length ? { tags: raw.tags } : {}),
  }
}

export function upsertPmCard(
  practiceId: PracticeId,
  input: Partial<WbPmCard> & { projectId: string; title: string },
): WbPmCard {
  const list = readPmCards(practiceId)
  const ts = nowIso()
  if (input.id) {
    const next = list.map((c) =>
      c.id === input.id
        ? normalizePmCard({ ...c, ...input, title: input.title, updatedAt: ts })
        : c,
    )
    writePmCards(practiceId, next)
    return next.find((c) => c.id === input.id)!
  }
  const row = normalizePmCard({
    id: newId(),
    projectId: input.projectId,
    title: input.title,
    status: input.status ?? 'todo',
    description: input.description,
    priority: input.priority,
    dueDate: input.dueDate,
    assignee: input.assignee,
    tags: input.tags,
    sortOrder: input.sortOrder ?? list.filter((c) => c.projectId === input.projectId).length,
    createdAt: ts,
    updatedAt: ts,
  })
  writePmCards(practiceId, [row, ...list])
  return row
}

export function deletePmCard(practiceId: PracticeId, id: string): void {
  writePmCards(
    practiceId,
    readPmCards(practiceId).filter((c) => c.id !== id),
  )
}

export function readPmView(): PmViewId {
  try {
    const raw = wbStoreGetRaw('uniwork.wb.pm.view')
    if (raw === 'list' || raw === 'kanban') return raw
  } catch {
    /* ignore */
  }
  return 'kanban'
}

export function writePmView(view: PmViewId): void {
  try {
    wbStoreSetRaw('uniwork.wb.pm.view', view)
  } catch {
    /* ignore */
  }
}

export function readPmSelectedProjectId(practiceId: PracticeId): string | null {
  try {
    return wbStoreGetRaw(`uniwork.wb.pm.selected.${practiceId}`) || null
  } catch {
    return null
  }
}

export function writePmSelectedProjectId(practiceId: PracticeId, id: string | null): void {
  try {
    if (!id) wbStoreSetRaw(`uniwork.wb.pm.selected.${practiceId}`, '')
    else wbStoreSetRaw(`uniwork.wb.pm.selected.${practiceId}`, id)
  } catch {
    /* ignore */
  }
}

/** Human-readable connection summary for UI. */
export function formatPmConnectionSummary(c: WbPmDbConnection, vi: boolean): string {
  if (c.driver === 'sqlite') {
    return c.sqlitePath
      ? `SQLite · ${c.sqlitePath}`
      : vi
        ? 'SQLite · chưa chọn file'
        : 'SQLite · no file'
  }
  const host = c.host || 'localhost'
  const port = c.port || (c.driver === 'postgres' ? 5432 : 3306)
  const db = c.database || '?'
  return `${c.driver} · ${host}:${port}/${db}`
}

// ---------- Investors (Chủ đầu tư) ----------
export interface WbPmInvestor {
  id: string
  projectId: string
  name: string
  org?: string
  phone?: string
  email?: string
  sharePercent?: number
  committedAmount?: number
  currency?: string
  note?: string
  createdAt: string
  updatedAt: string
}

function investorsKey(practiceId: PracticeId): string {
  return `uniwork.wb.pm.investors.${practiceId}`
}

export function readPmInvestors(practiceId: PracticeId): WbPmInvestor[] {
  const raw = wbStoreRead<WbPmInvestor[]>(investorsKey(practiceId), [])
  return Array.isArray(raw) ? raw.filter((x) => x && x.id && x.projectId && x.name) : []
}

export function writePmInvestors(practiceId: PracticeId, items: WbPmInvestor[]): void {
  wbStoreWrite(investorsKey(practiceId), items)
}

export function upsertPmInvestor(
  practiceId: PracticeId,
  input: Partial<WbPmInvestor> & { projectId: string; name: string },
): WbPmInvestor {
  const list = readPmInvestors(practiceId)
  const ts = nowIso()
  if (input.id) {
    const next = list.map((x) =>
      x.id === input.id ? { ...x, ...input, name: input.name.trim(), updatedAt: ts } : x,
    )
    writePmInvestors(practiceId, next)
    return next.find((x) => x.id === input.id)!
  }
  const row: WbPmInvestor = {
    id: newId(),
    projectId: input.projectId,
    name: input.name.trim(),
    ...(input.org?.trim() ? { org: input.org.trim() } : {}),
    ...(input.phone?.trim() ? { phone: input.phone.trim() } : {}),
    ...(input.email?.trim() ? { email: input.email.trim() } : {}),
    ...(typeof input.sharePercent === 'number' ? { sharePercent: input.sharePercent } : {}),
    ...(typeof input.committedAmount === 'number' ? { committedAmount: input.committedAmount } : {}),
    currency: input.currency?.trim() || 'VND',
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    createdAt: ts,
    updatedAt: ts,
  }
  writePmInvestors(practiceId, [row, ...list])
  return row
}

export function deletePmInvestor(practiceId: PracticeId, id: string): void {
  writePmInvestors(
    practiceId,
    readPmInvestors(practiceId).filter((x) => x.id !== id),
  )
}

// ---------- Payments (Thanh toán dự án) ----------
export interface WbPmPayment {
  id: string
  projectId: string
  title: string
  amount: number
  currency?: string
  dueDate?: string
  paidAt?: string
  status: PmPaymentStatus
  investorId?: string | null
  counterparty?: string
  note?: string
  createdAt: string
  updatedAt: string
}

function paymentsKey(practiceId: PracticeId): string {
  return `uniwork.wb.pm.payments.${practiceId}`
}

export function readPmPayments(practiceId: PracticeId): WbPmPayment[] {
  const raw = wbStoreRead<WbPmPayment[]>(paymentsKey(practiceId), [])
  return Array.isArray(raw)
    ? raw.filter((x) => x && x.id && x.projectId && x.title && typeof x.amount === 'number')
    : []
}

export function writePmPayments(practiceId: PracticeId, items: WbPmPayment[]): void {
  wbStoreWrite(paymentsKey(practiceId), items)
}

export function upsertPmPayment(
  practiceId: PracticeId,
  input: Partial<WbPmPayment> & { projectId: string; title: string; amount: number },
): WbPmPayment {
  const list = readPmPayments(practiceId)
  const ts = nowIso()
  const status: PmPaymentStatus =
    input.status === 'planned' ||
    input.status === 'due' ||
    input.status === 'paid' ||
    input.status === 'cancelled'
      ? input.status
      : 'planned'
  if (input.id) {
    const next = list.map((x) =>
      x.id === input.id
        ? {
            ...x,
            ...input,
            title: input.title.trim(),
            amount: input.amount,
            status,
            updatedAt: ts,
          }
        : x,
    )
    writePmPayments(practiceId, next)
    return next.find((x) => x.id === input.id)!
  }
  const row: WbPmPayment = {
    id: newId(),
    projectId: input.projectId,
    title: input.title.trim(),
    amount: input.amount,
    currency: input.currency?.trim() || 'VND',
    status,
    investorId: input.investorId ?? null,
    ...(input.dueDate ? { dueDate: input.dueDate } : {}),
    ...(input.paidAt ? { paidAt: input.paidAt } : {}),
    ...(input.counterparty?.trim() ? { counterparty: input.counterparty.trim() } : {}),
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    createdAt: ts,
    updatedAt: ts,
  }
  writePmPayments(practiceId, [row, ...list])
  return row
}

export function deletePmPayment(practiceId: PracticeId, id: string): void {
  writePmPayments(
    practiceId,
    readPmPayments(practiceId).filter((x) => x.id !== id),
  )
}

// ---------- Construction diary (Nhật ký thi công) ----------
export interface WbPmDiaryEntry {
  id: string
  projectId: string
  date: string
  weather?: string
  workArea?: string
  content: string
  workforce?: string
  progress?: string
  author?: string
  createdAt: string
  updatedAt: string
}

function diaryKey(practiceId: PracticeId): string {
  return `uniwork.wb.pm.diary.${practiceId}`
}

export function readPmDiary(practiceId: PracticeId): WbPmDiaryEntry[] {
  const raw = wbStoreRead<WbPmDiaryEntry[]>(diaryKey(practiceId), [])
  return Array.isArray(raw)
    ? raw.filter((x) => x && x.id && x.projectId && x.date && x.content)
    : []
}

export function writePmDiary(practiceId: PracticeId, items: WbPmDiaryEntry[]): void {
  wbStoreWrite(diaryKey(practiceId), items)
}

export function upsertPmDiaryEntry(
  practiceId: PracticeId,
  input: Partial<WbPmDiaryEntry> & { projectId: string; date: string; content: string },
): WbPmDiaryEntry {
  const list = readPmDiary(practiceId)
  const ts = nowIso()
  if (input.id) {
    const next = list.map((x) =>
      x.id === input.id
        ? {
            ...x,
            ...input,
            date: input.date,
            content: input.content.trim(),
            updatedAt: ts,
          }
        : x,
    )
    writePmDiary(practiceId, next)
    return next.find((x) => x.id === input.id)!
  }
  const row: WbPmDiaryEntry = {
    id: newId(),
    projectId: input.projectId,
    date: input.date,
    content: input.content.trim(),
    ...(input.weather?.trim() ? { weather: input.weather.trim() } : {}),
    ...(input.workArea?.trim() ? { workArea: input.workArea.trim() } : {}),
    ...(input.workforce?.trim() ? { workforce: input.workforce.trim() } : {}),
    ...(input.progress?.trim() ? { progress: input.progress.trim() } : {}),
    ...(input.author?.trim() ? { author: input.author.trim() } : {}),
    createdAt: ts,
    updatedAt: ts,
  }
  writePmDiary(practiceId, [row, ...list])
  return row
}

export function deletePmDiaryEntry(practiceId: PracticeId, id: string): void {
  writePmDiary(
    practiceId,
    readPmDiary(practiceId).filter((x) => x.id !== id),
  )
}

// ---------- Project documents (Tài liệu dự án) ----------
export interface WbPmDoc {
  id: string
  projectId: string
  title: string
  category?: string
  filePath?: string
  fileName?: string
  fileExt?: string
  note?: string
  createdAt: string
  updatedAt: string
}

function docsKey(practiceId: PracticeId): string {
  return `uniwork.wb.pm.docs.${practiceId}`
}

export function readPmDocs(practiceId: PracticeId): WbPmDoc[] {
  const raw = wbStoreRead<WbPmDoc[]>(docsKey(practiceId), [])
  return Array.isArray(raw)
    ? raw.filter((x) => x && x.id && x.projectId && x.title)
    : []
}

export function writePmDocs(practiceId: PracticeId, items: WbPmDoc[]): void {
  wbStoreWrite(docsKey(practiceId), items)
}

export function upsertPmDoc(
  practiceId: PracticeId,
  input: Partial<WbPmDoc> & { projectId: string; title: string },
): WbPmDoc {
  const list = readPmDocs(practiceId)
  const ts = nowIso()
  if (input.id) {
    const next = list.map((x) =>
      x.id === input.id
        ? { ...x, ...input, title: input.title.trim(), updatedAt: ts }
        : x,
    )
    writePmDocs(practiceId, next)
    return next.find((x) => x.id === input.id)!
  }
  const row: WbPmDoc = {
    id: newId(),
    projectId: input.projectId,
    title: input.title.trim(),
    ...(input.category?.trim() ? { category: input.category.trim() } : {}),
    ...(input.filePath ? { filePath: input.filePath } : {}),
    ...(input.fileName ? { fileName: input.fileName } : {}),
    ...(input.fileExt ? { fileExt: input.fileExt } : {}),
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    createdAt: ts,
    updatedAt: ts,
  }
  writePmDocs(practiceId, [row, ...list])
  return row
}

export function deletePmDoc(practiceId: PracticeId, id: string): void {
  writePmDocs(
    practiceId,
    readPmDocs(practiceId).filter((x) => x.id !== id),
  )
}

export function readPmPanel(): PmPanelId {
  try {
    const raw = wbStoreGetRaw('uniwork.wb.pm.panel')
    if (
      raw === 'board' ||
      raw === 'investors' ||
      raw === 'payments' ||
      raw === 'diary' ||
      raw === 'docs' ||
      raw === 'connections'
    ) {
      return raw
    }
  } catch {
    /* ignore */
  }
  return 'board'
}

export function writePmPanel(panel: PmPanelId): void {
  try {
    wbStoreSetRaw('uniwork.wb.pm.panel', panel)
  } catch {
    /* ignore */
  }
}
