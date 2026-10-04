import {
  defaultPinnedModules,
  isWorkbenchModuleId,
  type PracticeId,
  type WorkbenchModuleId,
} from '@uniwork/practice-core'

const PINS_PREFIX = 'uniwork.wb.pins.'

export function readPinnedModules(practiceId: PracticeId): WorkbenchModuleId[] {
  try {
    const raw = localStorage.getItem(PINS_PREFIX + practiceId)
    if (raw === null) return defaultPinnedModules(practiceId)
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return defaultPinnedModules(practiceId)
    return parsed.filter(isWorkbenchModuleId)
  } catch {
    return defaultPinnedModules(practiceId)
  }
}

export function writePinnedModules(practiceId: PracticeId, pins: WorkbenchModuleId[]): void {
  try {
    localStorage.setItem(PINS_PREFIX + practiceId, JSON.stringify(pins))
  } catch {
    /* ignore quota */
  }
}

export function pinModule(practiceId: PracticeId, id: WorkbenchModuleId): WorkbenchModuleId[] {
  const cur = readPinnedModules(practiceId)
  if (cur.includes(id)) return cur
  const next = [...cur, id]
  writePinnedModules(practiceId, next)
  return next
}

export function unpinModule(practiceId: PracticeId, id: WorkbenchModuleId): WorkbenchModuleId[] {
  const next = readPinnedModules(practiceId).filter((x) => x !== id)
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
}

export type CalendarViewMode = 'list' | 'calendar'

export function readCalendarView(): CalendarViewMode {
  try {
    const raw = localStorage.getItem('uniwork.wb.calendar.view')
    if (raw === 'list' || raw === 'calendar') return raw
  } catch {
    /* ignore */
  }
  return 'calendar'
}

export function writeCalendarView(mode: CalendarViewMode): void {
  try {
    localStorage.setItem('uniwork.wb.calendar.view', mode)
  } catch {
    /* ignore */
  }
}

export interface WbTaskItem {
  id: string
  title: string
  done: boolean
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

export function readCalendar(practiceId: PracticeId): WbCalendarItem[] {
  return readJson(`uniwork.wb.calendar.${practiceId}`, [])
}

export function writeCalendar(practiceId: PracticeId, items: WbCalendarItem[]): void {
  writeJson(`uniwork.wb.calendar.${practiceId}`, items)
}

export function readTasks(practiceId: PracticeId): WbTaskItem[] {
  return readJson(`uniwork.wb.tasks.${practiceId}`, [])
}

export function writeTasks(practiceId: PracticeId, items: WbTaskItem[]): void {
  writeJson(`uniwork.wb.tasks.${practiceId}`, items)
}

export function readNotes(practiceId: PracticeId): string {
  try {
    return localStorage.getItem(`uniwork.wb.notes.${practiceId}`) ?? ''
  } catch {
    return ''
  }
}

export function writeNotes(practiceId: PracticeId, text: string): void {
  try {
    localStorage.setItem(`uniwork.wb.notes.${practiceId}`, text)
  } catch {
    /* ignore */
  }
}

export interface WbFormItem {
  id: string
  title: string
  note?: string
  /** Practice / education pack this form draft is linked into (Tài liệu). */
  linkedProjectId?: string
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
    const raw = localStorage.getItem('uniwork.wb.finance.subtab')
    if (raw === 'goals' || raw === 'spending' || raw === 'invest') return raw
  } catch {
    /* ignore */
  }
  return 'goals'
}

export function writeFinanceSubTab(id: FinanceSubTabId): void {
  try {
    localStorage.setItem('uniwork.wb.finance.subtab', id)
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
    const raw = localStorage.getItem('uniwork.wb.health.subtab')
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
    localStorage.setItem('uniwork.wb.health.subtab', id)
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
    const raw = localStorage.getItem(HEALTH_BODY_META_KEY)
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
    if (!meta) localStorage.removeItem(HEALTH_BODY_META_KEY)
    else localStorage.setItem(HEALTH_BODY_META_KEY, JSON.stringify(meta))
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
    const raw = localStorage.getItem('uniwork.wb.family.subtab')
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
    localStorage.setItem('uniwork.wb.family.subtab', id)
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
  parentNames?: string
  birthYear?: string
  note?: string
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
    const raw = localStorage.getItem('uniwork.wb.friends.subtab')
    const ok: FriendsSubTabId[] = ['people', 'events', 'anniversaries']
    if (raw && (ok as string[]).includes(raw)) return raw as FriendsSubTabId
  } catch {
    /* ignore */
  }
  return 'people'
}

export function writeFriendsSubTab(id: FriendsSubTabId): void {
  try {
    localStorage.setItem('uniwork.wb.friends.subtab', id)
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
    const raw = localStorage.getItem('uniwork.wb.pets.subtab')
    if (raw === 'roster' || raw === 'gallery' || raw === 'care') return raw
  } catch {
    /* ignore */
  }
  return 'roster'
}

export function writePetsSubTab(id: PetsSubTabId): void {
  try {
    localStorage.setItem('uniwork.wb.pets.subtab', id)
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
