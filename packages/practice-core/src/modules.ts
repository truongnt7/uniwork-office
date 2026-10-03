import type { PracticeId } from './types.js'

/**
 * Optional Workbench modules (pinned via Tab +).
 * Core pillars (knowledge / materials / skills / compose) are always present.
 * "Projects" is intentionally omitted — it maps to the Knowledge pillar.
 */
export type WorkbenchModuleId =
  | 'desk'
  | 'calendar'
  | 'tasks'
  | 'notes'
  | 'assistant'
  | 'forms'
  | 'personal'
  | 'personal-finance'
  | 'events'
  | 'health'
  | 'self-growth'
  | 'family'
  | 'travel'
  | 'clients'
  | 'contracts'
  | 'matters'

export interface WorkbenchModuleDef {
  id: WorkbenchModuleId
  labelVi: string
  labelEn: string
  hintVi: string
  hintEn: string
  /** false = listed in + menu but pane shows “soon” guidance */
  available: boolean
}

export const WORKBENCH_MODULES: readonly WorkbenchModuleDef[] = [
  {
    id: 'desk',
    labelVi: 'Bàn làm việc',
    labelEn: 'Desk',
    hintVi: 'Tóm tắt chỉ số, nhắc việc và biểu đồ cá nhân',
    hintEn: 'Personal KPIs, reminders, and charts',
    available: true,
  },
  {
    id: 'calendar',
    labelVi: 'Lịch',
    labelEn: 'Calendar',
    hintVi: 'Mốc hạn / sự kiện theo vai trò',
    hintEn: 'Deadlines and events for this role',
    available: true,
  },
  {
    id: 'tasks',
    labelVi: 'Công việc',
    labelEn: 'Tasks',
    hintVi: 'Việc cần làm gắn workbench',
    hintEn: 'To-dos for this workbench',
    available: true,
  },
  {
    id: 'notes',
    labelVi: 'Notes',
    labelEn: 'Notes',
    hintVi: 'Ghi chú nhanh tại máy',
    hintEn: 'Quick on-device notes',
    available: true,
  },
  {
    id: 'assistant',
    labelVi: 'Trợ lý AI',
    labelEn: 'AI Assistant',
    hintVi: 'Lối tắt vào uniAI (panel chung)',
    hintEn: 'Shortcut to uniAI (shared panel)',
    available: true,
  },
  {
    id: 'forms',
    labelVi: 'Biểu mẫu',
    labelEn: 'Forms',
    hintVi: 'Thư viện biểu mẫu / mẫu giấy tờ hay dùng',
    hintEn: 'Reusable forms and paperwork templates',
    available: true,
  },
  {
    id: 'personal',
    labelVi: 'Cá nhân',
    labelEn: 'Personal',
    hintVi: 'Hồ sơ cá nhân dùng khi soạn văn bản',
    hintEn: 'Personal profile for drafting',
    available: true,
  },
  {
    id: 'personal-finance',
    labelVi: 'Tài chính cá nhân',
    labelEn: 'Personal finance',
    hintVi: 'Thu / chi cá nhân trên máy',
    hintEn: 'On-device personal income & expenses',
    available: true,
  },
  {
    id: 'events',
    labelVi: 'Sự kiện',
    labelEn: 'Events',
    hintVi: 'Hội thảo, họp, sự kiện sắp tới',
    hintEn: 'Upcoming meetings, talks, events',
    available: true,
  },
  {
    id: 'health',
    labelVi: 'Sức khoẻ',
    labelEn: 'Health',
    hintVi: 'Theo dõi sức khoẻ cá nhân trên máy',
    hintEn: 'Personal health tracking on device',
    available: true,
  },
  {
    id: 'self-growth',
    labelVi: 'Phát triển bản thân',
    labelEn: 'Self-growth',
    hintVi: 'Mục tiêu học tập / thói quen phát triển',
    hintEn: 'Learning goals and growth habits',
    available: true,
  },
  {
    id: 'family',
    labelVi: 'Gia đình tôi',
    labelEn: 'My family',
    hintVi: 'Thành viên gia đình & ghi chú quan trọng',
    hintEn: 'Family members and important notes',
    available: true,
  },
  {
    id: 'travel',
    labelVi: 'Travel',
    labelEn: 'Travel',
    hintVi: 'Quản lý du lịch, chuẩn bị chuyến đi, lưu hành trình',
    hintEn: 'Trips, packing prep, and saved itineraries',
    available: true,
  },
  {
    id: 'clients',
    labelVi: 'Khách hàng',
    labelEn: 'Clients',
    hintVi: 'Danh bạ khách hàng / đối tác',
    hintEn: 'Client and partner directory',
    available: true,
  },
  {
    id: 'contracts',
    labelVi: 'Hợp đồng',
    labelEn: 'Contracts',
    hintVi: 'Theo dõi hợp đồng & hạn hiệu lực',
    hintEn: 'Track contracts and validity dates',
    available: true,
  },
  {
    id: 'matters',
    labelVi: 'Vụ việc',
    labelEn: 'Matters',
    hintVi: 'Hồ sơ vụ việc cho Luật sư / Pháp lý',
    hintEn: 'Legal matters for counsel / legal teams',
    available: true,
  },
] as const

/**
 * Suggested pins when a practice has never customized Tab +.
 * Only Bàn làm việc is pinned by default; other modules are opt-in via +.
 */
export function defaultPinnedModules(_practiceId: PracticeId): WorkbenchModuleId[] {
  return ['desk']
}

export function getWorkbenchModule(id: WorkbenchModuleId): WorkbenchModuleDef | undefined {
  return WORKBENCH_MODULES.find((m) => m.id === id)
}

export function isWorkbenchModuleId(value: unknown): value is WorkbenchModuleId {
  return typeof value === 'string' && WORKBENCH_MODULES.some((m) => m.id === value)
}
