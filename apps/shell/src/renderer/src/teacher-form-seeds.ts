/**
 * Seed Biểu mẫu library entries for Teacher practice (idempotent by stable id).
 */
import type { PracticeId } from '@uniwork/practice-core'
import { readForms, writeForms, type WbFormItem } from './workbench-pins'

const TEACHER_FORM_SEEDS: readonly WbFormItem[] = [
  {
    id: 'seed:teacher-parent-letter',
    title: 'Thư thông báo phụ huynh',
    note: 'Mẫu thư / thông báo gửi phụ huynh — My AI điền theo slot.',
    templateId: 'teacher-parent-letter',
  },
  {
    id: 'seed:teacher-student-comment',
    title: 'Nhận xét học sinh',
    note: 'Nhận xét định kỳ / cuối kỳ — My AI điền theo slot.',
    templateId: 'teacher-student-comment',
  },
  {
    id: 'seed:teacher-leave',
    title: 'Đơn xin nghỉ phép GV',
    note: 'Đơn nghỉ phép giáo viên (hành chính).',
    templateId: 'personal-leave',
  },
  {
    id: 'seed:teacher-meeting-minutes',
    title: 'Biên bản họp phụ huynh',
    note: 'Biên bản họp phụ huynh lớp.',
  },
  {
    id: 'seed:teacher-class-log',
    title: 'Sổ đầu bài',
    note: 'Checklist sổ đầu bài / ghi nhận tiết học.',
  },
]

/** Ensure teacher form seeds exist; returns merged list (and persists when changed). */
export function ensureTeacherFormSeeds(practiceId: PracticeId): WbFormItem[] {
  if (practiceId !== 'teacher') return readForms(practiceId)
  const existing = readForms(practiceId)
  const have = new Set(existing.map((f) => f.id))
  const missing = TEACHER_FORM_SEEDS.filter((s) => !have.has(s.id))
  if (missing.length === 0) return existing
  const next = [...missing, ...existing]
  writeForms(practiceId, next)
  return next
}
