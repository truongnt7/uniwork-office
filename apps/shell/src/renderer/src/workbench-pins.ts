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

export function readHealth(): WbHealthItem[] {
  return readJson('uniwork.wb.health', [])
}

export function writeHealth(items: WbHealthItem[]): void {
  writeJson('uniwork.wb.health', items)
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

export function readFamily(): WbFamilyMember[] {
  return readJson('uniwork.wb.family', [])
}

export function writeFamily(items: WbFamilyMember[]): void {
  writeJson('uniwork.wb.family', items)
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
