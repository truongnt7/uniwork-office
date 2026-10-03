/** Local education lesson-pack metadata (stored as projects/<id>/edu/meta.json). */

export const EDU_META_VERSION = 1 as const

export interface EduMeta {
  version: typeof EDU_META_VERSION
  kind: 'education'
  /** Subject name, e.g. Toán */
  subject: string
  /** Grade / class band, e.g. Lớp 6 */
  grade: string
  /** Optional week label, e.g. Tuần 12 */
  week?: string
  /** Lesson title */
  lessonTitle: string
  /** Planned duration in minutes */
  durationMinutes?: number
  /** Learning objectives / chuẩn đầu ra */
  objectives: string[]
  createdAt: string
  updatedAt: string
}

export type EduTemplateId =
  | 'giao-an'
  | 'khdh'
  | 'slide'
  | 'phieu-hoc-tap'
  | 'ppct'

export type EduWorkflowId = 'draft-lesson-plan' | 'slides-from-plan' | 'worksheet-from-plan'

export interface EduTemplateDef {
  id: EduTemplateId
  /** Suggested file stem (without extension) */
  fileStem: string
  app: 'docs' | 'sheets' | 'slides'
  labelVi: string
  labelEn: string
}

export interface EduWorkflowDef {
  id: EduWorkflowId
  app: 'docs' | 'slides'
  labelVi: string
  labelEn: string
  /** Opens this template outline when the workflow runs */
  seedTemplate: EduTemplateId
}

export interface CreateEduMetaInput {
  subject: string
  grade: string
  week?: string
  lessonTitle: string
  durationMinutes?: number
  objectives?: string[]
}
