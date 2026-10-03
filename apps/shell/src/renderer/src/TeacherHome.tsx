import { useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import {
  EDU_TEMPLATES,
  EDU_WORKFLOWS,
  eduTemplateHtml,
  eduTemplateTitle,
  eduWorkflowPrompt,
  type EduMeta,
  type EduTemplateId,
  type EduWorkflowId,
} from '@uniwork/edu-core'
import type { CreateEducationProjectArgs, ProjectSummaryEntry } from '../../shared/home-api'
import { useI18n } from './locale'

function toEduMeta(entry: ProjectSummaryEntry): EduMeta | null {
  const e = entry.edu
  if (!e) return null
  return {
    version: 1,
    kind: 'education',
    subject: e.subject,
    grade: e.grade,
    ...(e.week ? { week: e.week } : {}),
    lessonTitle: e.lessonTitle,
    ...(typeof e.durationMinutes === 'number' ? { durationMinutes: e.durationMinutes } : {}),
    objectives: e.objectives ?? [],
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  }
}

interface TeacherHomeProps {
  projects: ProjectSummaryEntry[]
  selectedId: string | null
  onSelectPack: (id: string | null) => void
  /** Leave teacher gallery and open the pack's file list */
  onOpenPackFiles: (id: string) => void
  onRefresh: () => void
}

export function TeacherHome({
  projects,
  selectedId,
  onSelectPack,
  onOpenPackFiles,
  onRefresh,
}: TeacherHomeProps): ReactElement {
  const { lang } = useI18n()
  const vi = lang !== 'en'
  const packs = useMemo(
    () =>
      projects
        .filter((p) => p.kind === 'education' || !!p.edu)
        .sort((a, b) => (b.lastActiveAt > a.lastActiveAt ? 1 : -1)),
    [projects],
  )
  const selected = packs.find((p) => p.id === selectedId) ?? null
  const meta = selected ? toEduMeta(selected) : null

  const [form, setForm] = useState<CreateEducationProjectArgs>({
    subject: '',
    grade: '',
    week: '',
    lessonTitle: '',
    durationMinutes: 45,
    objectives: [],
  })
  const [objectiveText, setObjectiveText] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null)

  const label = (viText: string, enText: string) => (vi ? viText : enText)

  const submitCreate = async () => {
    setError(null)
    const subject = form.subject.trim()
    const grade = form.grade.trim()
    const lessonTitle = form.lessonTitle.trim()
    if (!subject || !grade || !lessonTitle) {
      setError(label('Cần nhập Môn, Lớp và Tên bài.', 'Subject, grade, and lesson title are required.'))
      return
    }
    setCreating(true)
    try {
      const objectives = objectiveText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      const created = await window.aiOfficeProject!.createEducationProject({
        subject,
        grade,
        week: form.week?.trim() || undefined,
        lessonTitle,
        durationMinutes: form.durationMinutes,
        objectives,
      })
      onRefresh()
      onSelectPack(created.id)
      setForm({
        subject: '',
        grade: '',
        week: '',
        lessonTitle: '',
        durationMinutes: 45,
        objectives: [],
      })
      setObjectiveText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setCreating(false)
    }
  }

  const openTemplate = async (templateId: EduTemplateId) => {
    if (!selected || !meta) return
    const def = EDU_TEMPLATES.find((t) => t.id === templateId)
    if (!def) return
    const projectId = selected.id
    if (def.app === 'docs') {
      const html = eduTemplateHtml(templateId, meta)
      if (html) {
        await window.aiOffice.newDoc({
          projectId,
          aiContent: { title: eduTemplateTitle(templateId, meta), html },
        })
        return
      }
      await window.aiOffice.newDoc({ projectId })
      return
    }
    if (def.app === 'slides') {
      await window.aiOffice.newSlide({ projectId })
      return
    }
    await window.aiOffice.newSheet({ projectId })
  }

  const runWorkflow = async (workflowId: EduWorkflowId) => {
    if (!selected || !meta) return
    const wf = EDU_WORKFLOWS.find((w) => w.id === workflowId)
    if (!wf) return
    const prompt = eduWorkflowPrompt(workflowId, meta)
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedPrompt(workflowId)
      window.setTimeout(() => setCopiedPrompt(null), 2500)
    } catch {
      /* clipboard may be denied; still open the seed */
    }
    await openTemplate(wf.seedTemplate)
  }

  return (
    <main className="content teacher-home">
      <section className="teacher-hero" aria-label={label('Giáo viên', 'Teacher')}>
        <h1 className="teacher-title">{label('Chế độ Giáo viên', 'Teacher mode')}</h1>
        <p className="teacher-subtitle">
          {label(
            'Tạo gói bài: giáo án, kế hoạch bài dạy, slide, phiếu học tập. AI (uniAI) hỗ trợ soạn nhanh — cấu hình Hub Token trong Cài đặt.',
            'Create lesson packs: plans, slides, worksheets. uniAI drafts faster — set your Hub Token in Settings.',
          )}
        </p>
      </section>

      <div className="teacher-layout">
        <section className="teacher-create" aria-label={label('Tạo gói bài', 'New lesson pack')}>
          <h2>{label('Gói bài mới', 'New lesson pack')}</h2>
          <div className="teacher-form">
            <label>
              <span>{label('Môn', 'Subject')}</span>
              <input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder={label('VD: Toán', 'e.g. Math')}
              />
            </label>
            <label>
              <span>{label('Lớp', 'Grade')}</span>
              <input
                value={form.grade}
                onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                placeholder={label('VD: Lớp 6', 'e.g. Grade 6')}
              />
            </label>
            <label>
              <span>{label('Tuần (tuỳ chọn)', 'Week (optional)')}</span>
              <input
                value={form.week ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, week: e.target.value }))}
                placeholder={label('VD: Tuần 12', 'e.g. Week 12')}
              />
            </label>
            <label>
              <span>{label('Tên bài', 'Lesson title')}</span>
              <input
                value={form.lessonTitle}
                onChange={(e) => setForm((f) => ({ ...f, lessonTitle: e.target.value }))}
                placeholder={label('VD: Phân số', 'e.g. Fractions')}
              />
            </label>
            <label>
              <span>{label('Thời lượng (phút)', 'Duration (min)')}</span>
              <input
                type="number"
                min={15}
                max={120}
                value={form.durationMinutes ?? 45}
                onChange={(e) =>
                  setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) || 45 }))
                }
              />
            </label>
            <label className="teacher-form-wide">
              <span>{label('Mục tiêu / CĐR (mỗi dòng một ý)', 'Objectives (one per line)')}</span>
              <textarea
                rows={3}
                value={objectiveText}
                onChange={(e) => setObjectiveText(e.target.value)}
                placeholder={label('Nhận biết phân số\nSo sánh phân số', 'Identify fractions\nCompare fractions')}
              />
            </label>
          </div>
          {error && <p className="teacher-error">{error}</p>}
          <button className="btn btn-primary" disabled={creating} onClick={() => void submitCreate()}>
            {creating
              ? label('Đang tạo…', 'Creating…')
              : label('Tạo gói bài', 'Create lesson pack')}
          </button>
        </section>

        <section className="teacher-packs" aria-label={label('Gói bài', 'Lesson packs')}>
          <h2>
            {label('Gói bài của bạn', 'Your lesson packs')}
            <span className="teacher-count">{packs.length}</span>
          </h2>
          {packs.length === 0 ? (
            <p className="teacher-empty">
              {label('Chưa có gói bài nào. Tạo gói đầu tiên bên trái.', 'No packs yet. Create one on the left.')}
            </p>
          ) : (
            <ul className="teacher-pack-list">
              {packs.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`teacher-pack-item${p.id === selectedId ? ' active' : ''}`}
                    onClick={() => onSelectPack(p.id === selectedId ? null : p.id)}
                  >
                    <strong>{p.edu?.lessonTitle || p.name}</strong>
                    <span>
                      {[p.edu?.subject, p.edu?.grade, p.edu?.week].filter(Boolean).join(' · ')}
                    </span>
                    <em>
                      {p.fileCount} {label('tệp', 'files')}
                    </em>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {selected && meta && (
        <section className="teacher-detail" aria-label={selected.name}>
          <header className="teacher-detail-header">
            <div>
              <h2>{meta.lessonTitle}</h2>
              <p>
                {[meta.subject, meta.grade, meta.week, meta.durationMinutes ? `${meta.durationMinutes}'` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onOpenPackFiles(selected.id)}
            >
              {label('Xem file trong gói', 'View pack files')}
            </button>
          </header>

          <div className="teacher-actions">
            <div>
              <h3>{label('Mẫu tài liệu', 'Templates')}</h3>
              <div className="teacher-chip-row">
                {EDU_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="teacher-chip"
                    onClick={() => void openTemplate(t.id)}
                  >
                    {vi ? t.labelVi : t.labelEn}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3>{label('AI workflows (copy prompt + mở mẫu)', 'AI workflows (copy prompt + open seed)')}</h3>
              <div className="teacher-chip-row">
                {EDU_WORKFLOWS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    className="teacher-chip teacher-chip-ai"
                    onClick={() => void runWorkflow(w.id)}
                  >
                    {vi ? w.labelVi : w.labelEn}
                    {copiedPrompt === w.id
                      ? label(' · đã copy', ' · copied')
                      : ''}
                  </button>
                ))}
              </div>
              <p className="teacher-hint">
                {label(
                  'Prompt đã copy — mở panel uniAI trong tab vừa mở và dán (Ctrl/Cmd+V), rồi chạy.',
                  'Prompt copied — open the uniAI panel in the new tab, paste, and run.',
                )}
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
