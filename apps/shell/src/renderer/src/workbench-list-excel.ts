/**
 * CSV builders for Workbench list tabs → Export Excel via exportTableAsXlsx.
 */
import type {
  WbCalendarItem,
  WbClientItem,
  WbContractItem,
  WbEventItem,
  WbFamilyMedItem,
  WbFamilyMember,
  WbFamilyMilestone,
  WbFamilyParentingItem,
  WbFamilyShopItem,
  WbFamilyTreeNode,
  WbFinanceGoal,
  WbFinanceInvest,
  WbFinanceItem,
  WbFormItem,
  WbFriend,
  WbFriendAnniversary,
  WbFriendEvent,
  WbGrowthItem,
  WbHealthDietPlan,
  WbHealthFasting,
  WbHealthMetric,
  WbHealthRun,
  WbHealthSport,
  WbHealthVeg,
  WbHealthYoga,
  WbMatterItem,
  WbPet,
  WbPetCareItem,
  WbTaskItem,
  WbTravelTrip,
} from './workbench-pins'
import { buildCsv, exportCsvAsXlsx, exportTableAsXlsx, normalizeExportBase } from './workbench-excel-io'
import {
  fundAccountBalance,
  type WbCrmContact,
  type WbFundAccount,
  type WbFundTxn,
} from './workbench-crm-fund'
import type {
  WbPmCard,
  WbPmDiaryEntry,
  WbPmDoc,
  WbPmInvestor,
  WbPmPayment,
} from './workbench-projects'

export async function exportCsvFile(
  csv: string,
  fileName: string,
  sheetName: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!csv.trim() || csv.replace(/^\uFEFF/, '').split('\n').length <= 1) {
    return { ok: false, error: 'empty' }
  }
  const res = await exportCsvAsXlsx({
    csv,
    fileName: `${normalizeExportBase(fileName)}.xlsx`,
    sheetName,
    openInSheets: true,
  })
  return res.ok ? { ok: true } : { ok: false, error: res.error }
}

export function exportTasksCsv(items: readonly WbTaskItem[]): string {
  return buildCsv(
    ['STT', 'Tiêu đề', 'Trạng thái', 'Ưu tiên', 'Hạn', 'Bắt đầu', 'Tags', 'Mô tả', 'Hoàn thành'],
    items.map((t, i) => [
      i + 1,
      t.title,
      t.status,
      t.priority,
      t.dueDate ?? '',
      t.startDate ?? '',
      (t.tags ?? []).join('; '),
      t.description ?? '',
      t.done ? '1' : '0',
    ]),
  )
}

export function exportCalendarCsv(items: readonly WbCalendarItem[]): string {
  return buildCsv(
    ['STT', 'Ngày', 'Tiêu đề', 'Tiết', 'Xong', 'Gói'],
    items.map((it, i) => [
      i + 1,
      it.date,
      it.title,
      it.period ?? '',
      it.done ? '1' : '0',
      it.packTitle ?? it.linkedProjectId ?? '',
    ]),
  )
}

export function exportEventsCsv(items: readonly WbEventItem[]): string {
  return buildCsv(
    ['STT', 'Ngày', 'Giờ', 'Tiêu đề', 'Địa điểm'],
    items.map((it, i) => [i + 1, it.date, it.time ?? '', it.title, it.place ?? '']),
  )
}

export function exportFamilyMembersCsv(items: readonly WbFamilyMember[]): string {
  return buildCsv(
    ['STT', 'Họ tên', 'Quan hệ', 'Sinh nhật', 'SĐT', 'Ghi chú'],
    items.map((it, i) => [i + 1, it.name, it.relation, it.birthday ?? '', it.phone ?? '', it.note ?? '']),
  )
}

export function exportFamilyParentingCsv(items: readonly WbFamilyParentingItem[]): string {
  return buildCsv(
    ['STT', 'Ngày', 'Con', 'Tiêu đề', 'Loại', 'Ghi chú', 'Xong'],
    items.map((it, i) => [
      i + 1,
      it.date,
      it.childName,
      it.title,
      it.kind,
      it.note ?? '',
      it.done ? '1' : '0',
    ]),
  )
}

export function exportFamilyMedsCsv(items: readonly WbFamilyMedItem[]): string {
  return buildCsv(
    ['STT', 'Người', 'Thuốc', 'Liều', 'Lịch', 'Từ', 'Đến', 'Ghi chú', 'Bật'],
    items.map((it, i) => [
      i + 1,
      it.person,
      it.medicine,
      it.dose ?? '',
      it.schedule,
      it.startDate ?? '',
      it.endDate ?? '',
      it.note ?? '',
      it.active ? '1' : '0',
    ]),
  )
}

export function exportFamilyShoppingCsv(items: readonly WbFamilyShopItem[]): string {
  return buildCsv(
    ['STT', 'Ngày', 'Mục', 'Số tiền', 'Danh mục', 'Ghi chú'],
    items.map((it, i) => [i + 1, it.date, it.title, it.amount, it.category, it.note ?? '']),
  )
}

export function exportFamilyTreeCsv(items: readonly WbFamilyTreeNode[]): string {
  return buildCsv(
    ['STT', 'Họ tên', 'Thế hệ', 'Nhánh', 'Cha/Mẹ', 'Năm sinh', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      it.name,
      it.generation,
      it.side,
      it.parentNames ?? (it.parentIds ?? []).join(';'),
      it.birthYear ?? '',
      it.note ?? '',
    ]),
  )
}

export function exportFamilyMilestonesCsv(items: readonly WbFamilyMilestone[]): string {
  return buildCsv(
    ['STT', 'Ngày', 'Tiêu đề', 'Loại', 'Người', 'Hàng năm', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      it.date,
      it.title,
      it.kind,
      it.people ?? '',
      it.recurYearly ? '1' : '0',
      it.note ?? '',
    ]),
  )
}

export function exportFriendsCsv(items: readonly WbFriend[]): string {
  return buildCsv(
    ['STT', 'Họ tên', 'Biệt danh', 'Quen qua', 'Sinh nhật', 'SĐT', 'Email', 'MXH', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      it.name,
      it.nickname ?? '',
      it.howMet ?? '',
      it.birthday ?? '',
      it.phone ?? '',
      it.email ?? '',
      it.social ?? '',
      it.note ?? '',
    ]),
  )
}

export function exportFriendEventsCsv(items: readonly WbFriendEvent[]): string {
  return buildCsv(
    ['STT', 'Ngày', 'Tiêu đề', 'Bạn', 'Loại', 'Ghi chú', 'Xong'],
    items.map((it, i) => [
      i + 1,
      it.date,
      it.title,
      it.friendName ?? '',
      it.kind,
      it.note ?? '',
      it.done ? '1' : '0',
    ]),
  )
}

export function exportFriendAnniversariesCsv(items: readonly WbFriendAnniversary[]): string {
  return buildCsv(
    ['STT', 'Ngày', 'Tiêu đề', 'Bạn', 'Loại', 'Hàng năm', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      it.date,
      it.title,
      it.friendName ?? '',
      it.kind,
      it.recurYearly ? '1' : '0',
      it.note ?? '',
    ]),
  )
}

export function exportPetsCsv(items: readonly WbPet[]): string {
  return buildCsv(
    ['STT', 'Tên', 'Loài', 'Giống', 'Sinh nhật', 'Giới tính', 'Màu', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      it.name,
      it.species,
      it.breed ?? '',
      it.birthday ?? '',
      it.sex ?? '',
      it.color ?? '',
      it.notes ?? '',
    ]),
  )
}

export function exportPetCareCsv(
  items: readonly WbPetCareItem[],
  pets: readonly WbPet[],
): string {
  const nameOf = (id: string) => pets.find((p) => p.id === id)?.name ?? id
  return buildCsv(
    ['STT', 'Thú cưng', 'Loại', 'Tiêu đề', 'Ngày', 'Giờ', 'Trạng thái', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      nameOf(it.petId),
      it.kind,
      it.title ?? '',
      it.scheduledDate,
      it.scheduledTime ?? '',
      it.status,
      it.note ?? '',
    ]),
  )
}

export function exportTravelCsv(items: readonly WbTravelTrip[]): string {
  return buildCsv(
    ['STT', 'Tiêu đề', 'Đích', 'Bắt đầu', 'Kết thúc', 'Trạng thái', 'Checklist xong', 'Ghi chú'],
    items.map((it, i) => {
      const done = it.checklist.filter((c) => c.done).length
      return [
        i + 1,
        it.title,
        it.destination,
        it.startDate ?? '',
        it.endDate ?? '',
        it.status,
        `${done}/${it.checklist.length}`,
        it.note ?? '',
      ]
    }),
  )
}

export function exportClientsCsv(items: readonly WbClientItem[]): string {
  return buildCsv(
    ['STT', 'Tên', 'Liên hệ', 'SĐT', 'Email', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      it.name,
      it.contact ?? '',
      it.phone ?? '',
      it.email ?? '',
      it.note ?? '',
    ]),
  )
}

export function exportContractsCsv(items: readonly WbContractItem[]): string {
  return buildCsv(
    ['STT', 'Tiêu đề', 'Bên', 'Bắt đầu', 'Kết thúc', 'Trạng thái', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      it.title,
      it.party ?? '',
      it.startDate ?? '',
      it.endDate ?? '',
      it.status,
      it.note ?? '',
    ]),
  )
}

export function exportMattersCsv(items: readonly WbMatterItem[]): string {
  return buildCsv(
    ['STT', 'Tiêu đề', 'Khách', 'Loại', 'Trạng thái', 'Ngày tới', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      it.title,
      it.client ?? '',
      it.matterType ?? '',
      it.status,
      it.nextDate ?? '',
      it.note ?? '',
    ]),
  )
}

export function exportFinanceCsv(items: readonly WbFinanceItem[]): string {
  return buildCsv(
    ['STT', 'Ngày', 'Loại', 'Số tiền', 'Mô tả', 'Danh mục'],
    items.map((it, i) => [i + 1, it.date, it.kind, it.amount, it.label, it.category ?? '']),
  )
}

export function exportFinanceGoalsCsv(items: readonly WbFinanceGoal[]): string {
  return buildCsv(
    ['STT', 'Tiêu đề', 'Mục tiêu', 'Đã có', 'Hạn', 'Ghi chú', 'Xong'],
    items.map((it, i) => [
      i + 1,
      it.title,
      it.targetAmount,
      it.currentAmount,
      it.deadline ?? '',
      it.note ?? '',
      it.done ? '1' : '0',
    ]),
  )
}

export function exportFinanceInvestCsv(items: readonly WbFinanceInvest[]): string {
  return buildCsv(
    ['STT', 'Tên', 'Loại', 'Số tiền', 'Ngày', 'Ghi chú'],
    items.map((it, i) => [i + 1, it.name, it.kind, it.amount, it.date, it.note ?? '']),
  )
}

export function exportHealthMetricsCsv(items: readonly WbHealthMetric[]): string {
  return buildCsv(
    ['STT', 'Ngày', 'Chỉ số', 'Giá trị', 'Đơn vị', 'Ghi chú'],
    items.map((it, i) => [i + 1, it.date, it.metric, it.value, it.unit ?? '', it.note ?? '']),
  )
}

export function exportHealthRunsCsv(items: readonly WbHealthRun[]): string {
  return buildCsv(
    ['STT', 'Ngày', 'Km', 'Phút', 'Pace', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      it.date,
      it.distanceKm,
      it.durationMin,
      it.pace ?? '',
      it.note ?? '',
    ]),
  )
}

export function exportHealthYogaCsv(items: readonly WbHealthYoga[]): string {
  return buildCsv(
    ['STT', 'Ngày', 'Kiểu', 'Phút', 'Cường độ', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      it.date,
      it.style,
      it.durationMin,
      it.intensity,
      it.note ?? '',
    ]),
  )
}

export function exportHealthSportsCsv(items: readonly WbHealthSport[]): string {
  return buildCsv(
    ['STT', 'Ngày', 'Môn', 'Phút', 'Ghi chú'],
    items.map((it, i) => [i + 1, it.date, it.sport, it.durationMin, it.note ?? '']),
  )
}

export function exportHealthDietsCsv(items: readonly WbHealthDietPlan[]): string {
  return buildCsv(
    ['STT', 'Tiêu đề', 'Mục tiêu', 'Bắt đầu', 'Kết thúc', 'Kcal/ngày', 'Ghi chú', 'Bật'],
    items.map((it, i) => [
      i + 1,
      it.title,
      it.goal ?? '',
      it.startDate,
      it.endDate ?? '',
      it.dailyKcal ?? '',
      it.note ?? '',
      it.active ? '1' : '0',
    ]),
  )
}

export function exportHealthFastingCsv(items: readonly WbHealthFasting[]): string {
  return buildCsv(
    ['STT', 'Ngày', 'Protocol', 'Bắt đầu', 'Kết thúc', 'Xong', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      it.date,
      it.protocol,
      it.fastStart ?? '',
      it.fastEnd ?? '',
      it.completed ? '1' : '0',
      it.note ?? '',
    ]),
  )
}

export function exportHealthVegCsv(items: readonly WbHealthVeg[]): string {
  return buildCsv(
    ['STT', 'Ngày', 'Chế độ', 'Bữa', 'Ghi chú', 'OK'],
    items.map((it, i) => [
      i + 1,
      it.date,
      it.mode,
      it.meals ?? '',
      it.note ?? '',
      it.ok ? '1' : '0',
    ]),
  )
}

export function exportGrowthCsv(items: readonly WbGrowthItem[]): string {
  return buildCsv(
    ['STT', 'Tiêu đề', 'Tiến độ %', 'Ghi chú', 'Xong'],
    items.map((it, i) => [i + 1, it.title, it.progress, it.note ?? '', it.done ? '1' : '0']),
  )
}

export function exportFormsCsv(items: readonly WbFormItem[]): string {
  return buildCsv(
    ['STT', 'Tiêu đề', 'File', 'Ghi chú'],
    items.map((it, i) => [i + 1, it.title, it.fileName ?? '', it.note ?? '']),
  )
}

export function exportCrmContactsCsv(items: readonly WbCrmContact[]): string {
  return buildCsv(
    ['STT', 'Tên', 'Tổ chức', 'Vai trò', 'SĐT', 'Email', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      it.name,
      it.org ?? '',
      it.role ?? '',
      it.phone ?? '',
      it.email ?? '',
      it.note ?? '',
    ]),
  )
}

export function exportFundAccountsCsv(
  accounts: readonly WbFundAccount[],
  txns: readonly WbFundTxn[],
): string {
  return buildCsv(
    ['STT', 'Tên', 'Tiền tệ', 'Số dư đầu', 'Số dư hiện tại', 'Ghi chú'],
    accounts.map((a, i) => [
      i + 1,
      a.name,
      a.currency,
      a.openingBalance,
      fundAccountBalance(a, txns),
      a.note ?? '',
    ]),
  )
}

export function exportFundTxnsCsv(
  txns: readonly WbFundTxn[],
  accounts: readonly WbFundAccount[],
): string {
  const nameBy = new Map(accounts.map((a) => [a.id, a.name]))
  return buildCsv(
    ['STT', 'Tài khoản', 'Loại', 'Số tiền', 'Ngày', 'Hạng mục', 'Đối tác', 'Ghi chú'],
    txns.map((t, i) => [
      i + 1,
      nameBy.get(t.accountId) ?? t.accountId,
      t.type,
      t.amount,
      t.date,
      t.category ?? '',
      t.counterparty ?? '',
      t.note ?? '',
    ]),
  )
}

export function exportPmInvestorsCsv(items: readonly WbPmInvestor[]): string {
  return buildCsv(
    ['STT', 'Tên', 'Tổ chức', 'SĐT', 'Email', '% sở hữu', 'Cam kết', 'Tiền tệ', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      it.name,
      it.org ?? '',
      it.phone ?? '',
      it.email ?? '',
      it.sharePercent ?? '',
      it.committedAmount ?? '',
      it.currency ?? 'VND',
      it.note ?? '',
    ]),
  )
}

export function exportPmPaymentsCsv(items: readonly WbPmPayment[]): string {
  return buildCsv(
    ['STT', 'Tiêu đề', 'Số tiền', 'Tiền tệ', 'Hạn', 'Đã trả', 'Trạng thái', 'Đối tác', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      it.title,
      it.amount,
      it.currency ?? 'VND',
      it.dueDate ?? '',
      it.paidAt ?? '',
      it.status,
      it.counterparty ?? '',
      it.note ?? '',
    ]),
  )
}

export function exportPmCardsCsv(items: readonly WbPmCard[]): string {
  return buildCsv(
    ['STT', 'Tiêu đề', 'Trạng thái', 'Ưu tiên', 'Hạn', 'Người làm', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      it.title,
      it.status,
      it.priority ?? '',
      it.dueDate ?? '',
      it.assignee ?? '',
      it.description ?? '',
    ]),
  )
}

export function exportPmDiaryCsv(items: readonly WbPmDiaryEntry[]): string {
  return buildCsv(
    ['STT', 'Ngày', 'Thời tiết', 'Hạng mục / khu vực', 'Nội dung', 'Nhân lực', 'Tiến độ', 'Người ghi'],
    items.map((it, i) => [
      i + 1,
      it.date,
      it.weather ?? '',
      it.workArea ?? '',
      it.content,
      it.workforce ?? '',
      it.progress ?? '',
      it.author ?? '',
    ]),
  )
}

export function exportPmDocsCsv(items: readonly WbPmDoc[]): string {
  return buildCsv(
    ['STT', 'Tiêu đề', 'Loại', 'File', 'Ghi chú'],
    items.map((it, i) => [
      i + 1,
      it.title,
      it.category ?? '',
      it.fileName ?? it.filePath ?? '',
      it.note ?? '',
    ]),
  )
}

export { exportTableAsXlsx }
