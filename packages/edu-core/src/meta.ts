import { EDU_META_VERSION, type CreateEduMetaInput, type EduMeta } from './types.js'

function nowIso(): string {
  return new Date().toISOString()
}

export function packDisplayName(input: CreateEduMetaInput): string {
  const title = input.lessonTitle.trim() || 'Bài học'
  const parts = [input.subject.trim(), input.grade.trim(), title].filter(Boolean)
  return parts.join(' · ')
}

export function createEduMeta(input: CreateEduMetaInput): EduMeta {
  const ts = nowIso()
  return {
    version: EDU_META_VERSION,
    kind: 'education',
    subject: input.subject.trim(),
    grade: input.grade.trim(),
    ...(input.week?.trim() ? { week: input.week.trim() } : {}),
    lessonTitle: input.lessonTitle.trim(),
    ...(typeof input.durationMinutes === 'number' && Number.isFinite(input.durationMinutes)
      ? { durationMinutes: Math.max(1, Math.round(input.durationMinutes)) }
      : {}),
    objectives: (input.objectives ?? []).map((o) => o.trim()).filter(Boolean),
    createdAt: ts,
    updatedAt: ts,
  }
}

export function isEduMeta(value: unknown): value is EduMeta {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    v.kind === 'education' &&
    typeof v.subject === 'string' &&
    typeof v.grade === 'string' &&
    typeof v.lessonTitle === 'string' &&
    Array.isArray(v.objectives)
  )
}
