import type { EduTemplateDef, EduWorkflowDef } from './types.js'

export const EDU_TEMPLATES: readonly EduTemplateDef[] = [
  {
    id: 'giao-an',
    fileStem: 'giao-an',
    app: 'docs',
    labelVi: 'Giáo án',
    labelEn: 'Lesson plan',
  },
  {
    id: 'khdh',
    fileStem: 'ke-hoach-bai-day',
    app: 'docs',
    labelVi: 'Kế hoạch bài dạy',
    labelEn: 'Teaching plan',
  },
  {
    id: 'slide',
    fileStem: 'bai-giang',
    app: 'slides',
    labelVi: 'Slide bài giảng',
    labelEn: 'Lesson slides',
  },
  {
    id: 'phieu-hoc-tap',
    fileStem: 'phieu-hoc-tap',
    app: 'docs',
    labelVi: 'Phiếu học tập',
    labelEn: 'Worksheet',
  },
  {
    id: 'ppct',
    fileStem: 'phan-phoi-chuong-trinh',
    app: 'sheets',
    labelVi: 'Phân phối chương trình',
    labelEn: 'Curriculum map',
  },
] as const

export const EDU_WORKFLOWS: readonly EduWorkflowDef[] = [
  {
    id: 'draft-lesson-plan',
    app: 'docs',
    labelVi: 'Soạn giáo án',
    labelEn: 'Draft lesson plan',
    seedTemplate: 'giao-an',
  },
  {
    id: 'slides-from-plan',
    app: 'slides',
    labelVi: 'Sinh slide từ giáo án',
    labelEn: 'Slides from plan',
    seedTemplate: 'slide',
  },
  {
    id: 'worksheet-from-plan',
    app: 'docs',
    labelVi: 'Sinh phiếu học tập',
    labelEn: 'Worksheet from plan',
    seedTemplate: 'phieu-hoc-tap',
  },
] as const
