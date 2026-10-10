import type { PracticeId } from './types.js'

/**
 * Optional Workbench modules (pinned via Tab +).
 * Pillars (knowledge / materials / skills / compose) are also opt-in via Tab +.
 * Core always-on: My Space / Tasks / Project mgmt / Calendar / Forms.
 * Knowledge pillar “Projects” (packs) is separate from `project-mgmt` (local PM board).
 */
export type WorkbenchModuleId =
  | 'desk'
  | 'calendar'
  | 'tasks'
  | 'project-mgmt'
  | 'crm'
  | 'fund'
  | 'notes'
  | 'email'
  | 'assistant'
  | 'forms'
  | 'personal'
  | 'personal-finance'
  | 'events'
  | 'health'
  | 'self-growth'
  | 'family'
  | 'friends'
  | 'pets'
  | 'travel'
  | 'clients'
  | 'contracts'
  | 'matters'
  | 'students'
  | 'parents'
  | 'grades'
  | 'attendance'
  | 'timetable'
  | 'questions'

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
    labelVi: 'Không gian của tôi',
    labelEn: 'My Space',
    hintVi: 'Tổng hợp việc làm & đời sống — chỉ số, nhắc, biểu đồ',
    hintEn: 'Work and life at a glance — KPIs, reminders, charts',
    available: true,
  },
  {
    id: 'calendar',
    labelVi: 'Lịch',
    labelEn: 'Calendar',
    hintVi: 'Xem dạng Calendar hoặc danh sách · mốc hạn theo vai trò',
    hintEn: 'Calendar or list view · role deadlines',
    available: true,
  },
  {
    id: 'tasks',
    labelVi: 'Công việc',
    labelEn: 'Tasks',
    hintVi: 'Tự quản trị việc cá nhân — List, Kanban, Lịch, Dashboard',
    hintEn: 'Personal task board — list, kanban, calendar, dashboard',
    available: true,
  },
  {
    id: 'project-mgmt',
    labelVi: 'Quản lý dự án',
    labelEn: 'Projects',
    hintVi: 'Dự án local — Kanban, nhật ký, tài liệu, chủ đầu tư, thanh toán',
    hintEn: 'Local projects — kanban, diary, docs, investors, payments',
    available: true,
  },
  {
    id: 'crm',
    labelVi: 'Quan hệ',
    labelEn: 'CRM',
    hintVi: 'Danh bạ CRM / đối tác trên máy — xuất Excel',
    hintEn: 'Local CRM contacts — Excel export',
    available: true,
  },
  {
    id: 'fund',
    labelVi: 'Quỹ',
    labelEn: 'Fund',
    hintVi: 'Ngân quỹ / ví local — thu chi, số dư, Excel',
    hintEn: 'Local fund wallet — in/out, balance, Excel',
    available: true,
  },
  {
    id: 'notes',
    labelVi: 'Ghi chú',
    labelEn: 'Notes',
    hintVi: 'Bảng ghim giấy note — kéo thả, đổi màu',
    hintEn: 'Sticky pinboard — drag, recolor, pin notes',
    available: true,
  },
  {
    id: 'email',
    labelVi: 'Email',
    labelEn: 'Email',
    hintVi: 'Gmail / Outlook / IMAP — nhận gửi + AI hỗ trợ soạn',
    hintEn: 'Gmail / Outlook / IMAP — send, receive, AI polish',
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
    hintVi: 'Mục tiêu · chi tiêu · đầu tư tích luỹ',
    hintEn: 'Goals · spending · investing',
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
    hintVi: 'Chỉ số, chạy bộ, yoga, thể thao, ăn kiêng, IF, ăn chay',
    hintEn: 'Metrics, running, yoga, sports, diet, IF, plant-based',
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
    hintVi: 'Thành viên, đồng hành cùng con, thuốc, chi tiêu, gia phả, cột mốc',
    hintEn: 'Members, parenting, meds, shopping, family tree, milestones',
    available: true,
  },
  {
    id: 'friends',
    labelVi: 'Bạn bè',
    labelEn: 'Friends',
    hintVi: 'Thông tin bạn bè, sự kiện quan trọng, kỷ niệm',
    hintEn: 'Friend profiles, important events, anniversaries',
    available: true,
  },
  {
    id: 'pets',
    labelVi: 'Thú cưng',
    labelEn: 'Pets',
    hintVi: 'Hồ sơ, album ảnh & lịch chăm sóc — lưu trên máy',
    hintEn: 'Profiles, photo albums & care schedule — stored on this device',
    available: true,
  },
  {
    id: 'travel',
    labelVi: 'Du lịch',
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
  {
    id: 'students',
    labelVi: 'Học sinh',
    labelEn: 'Students',
    hintVi: 'Danh sách học sinh — lớp, liên hệ, ghi chú',
    hintEn: 'Student roster — class, contact, notes',
    available: true,
  },
  {
    id: 'parents',
    labelVi: 'Phụ huynh',
    labelEn: 'Parents',
    hintVi: 'Liên hệ phụ huynh — học sinh liên quan, điện thoại, email',
    hintEn: 'Parent contacts — linked student, phone, email',
    available: true,
  },
  {
    id: 'grades',
    labelVi: 'Sổ điểm',
    labelEn: 'Gradebook',
    hintVi: 'Điểm theo lớp — cột kiểm tra, xuất CSV',
    hintEn: 'Scores by class — columns, export CSV',
    available: true,
  },
  {
    id: 'attendance',
    labelVi: 'Điểm danh',
    labelEn: 'Attendance',
    hintVi: 'Điểm danh nhẹ theo lớp / ngày / tiết',
    hintEn: 'Light roll call by class / day / period',
    available: true,
  },
  {
    id: 'timetable',
    labelVi: 'TKB',
    labelEn: 'Timetable',
    hintVi: 'Nhập thời khóa biểu tuần — tiết × thứ',
    hintEn: 'Weekly timetable — period × weekday',
    available: true,
  },
  {
    id: 'questions',
    labelVi: 'Ngân hàng câu hỏi',
    labelEn: 'Question bank',
    hintVi: 'Câu hỏi dùng lại — lọc môn/tag, xuất CSV',
    hintEn: 'Reusable questions — filter, export CSV',
    available: true,
  },
] as const

/**
 * Always-on Workbench tabs (cannot be removed via Tab ×).
 * Order: My Space → Tasks → Projects → CRM → Fund → Calendar → Forms.
 * Everything else is opt-in via +.
 */
export const CORE_PINNED_MODULES: readonly WorkbenchModuleId[] = [
  'desk',
  'tasks',
  'project-mgmt',
  'crm',
  'fund',
  'calendar',
  'forms',
]

/** Teacher-suggested pins (can still be unpinned via Tab ×). */
export const TEACHER_PINNED_MODULES: readonly WorkbenchModuleId[] = [
  'students',
  'parents',
  'grades',
]

/** Suggested pins when a practice has never customized Tab +. */
export function defaultPinnedModules(practiceId: PracticeId): WorkbenchModuleId[] {
  if (practiceId === 'teacher') {
    return [...CORE_PINNED_MODULES, ...TEACHER_PINNED_MODULES]
  }
  return [...CORE_PINNED_MODULES]
}

export function isCorePinnedModule(id: WorkbenchModuleId): boolean {
  return (CORE_PINNED_MODULES as readonly string[]).includes(id)
}

/**
 * Ensure core tabs are present. Preserves existing pin order; inserts any
 * missing cores after the last already-pinned core (or at the front).
 */
export function ensureCorePinnedModules(pins: readonly WorkbenchModuleId[]): WorkbenchModuleId[] {
  const valid = pins.filter(isWorkbenchModuleId)
  const have = new Set(valid)
  const missing = CORE_PINNED_MODULES.filter((id) => !have.has(id))
  if (missing.length === 0) return valid
  if (valid.length === 0) return [...CORE_PINNED_MODULES]
  let insertAt = 0
  for (let i = 0; i < valid.length; i++) {
    if (isCorePinnedModule(valid[i]!)) insertAt = i + 1
  }
  const out = [...valid]
  out.splice(insertAt, 0, ...missing)
  return out
}

export function getWorkbenchModule(id: WorkbenchModuleId): WorkbenchModuleDef | undefined {
  return WORKBENCH_MODULES.find((m) => m.id === id)
}

export function isWorkbenchModuleId(value: unknown): value is WorkbenchModuleId {
  return typeof value === 'string' && WORKBENCH_MODULES.some((m) => m.id === value)
}

/** Sidebar Space groups for hybrid Workbench IA (Notion-like). */
export type WorkbenchSpaceGroupId = 'core' | 'life' | 'work'

export interface WorkbenchSpaceGroup {
  id: WorkbenchSpaceGroupId
  labelVi: string
  labelEn: string
  moduleIds: readonly WorkbenchModuleId[]
}

export const WORKBENCH_SPACE_GROUPS: readonly WorkbenchSpaceGroup[] = [
  {
    id: 'core',
    labelVi: 'Chính',
    labelEn: 'Core',
    moduleIds: [
      'desk',
      'tasks',
      'project-mgmt',
      'crm',
      'fund',
      'calendar',
      'forms',
      'notes',
      'email',
      'assistant',
    ],
  },
  {
    id: 'life',
    labelVi: 'Đời sống',
    labelEn: 'Life',
    moduleIds: [
      'personal',
      'personal-finance',
      'events',
      'health',
      'self-growth',
      'family',
      'friends',
      'pets',
      'travel',
    ],
  },
  {
    id: 'work',
    labelVi: 'Công việc',
    labelEn: 'Work',
    moduleIds: [
      'clients',
      'contracts',
      'matters',
      'students',
      'parents',
      'grades',
      'attendance',
      'timetable',
      'questions',
    ],
  },
] as const

export function spaceGroupForModule(id: WorkbenchModuleId): WorkbenchSpaceGroupId {
  for (const g of WORKBENCH_SPACE_GROUPS) {
    if (g.moduleIds.includes(id)) return g.id
  }
  return 'core'
}
