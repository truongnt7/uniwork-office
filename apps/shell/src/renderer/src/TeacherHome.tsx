import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import {
  EDU_LESSON_CHAIN_TEMPLATES,
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

async function openDocsTemplate(
  projectId: string,
  templateId: EduTemplateId,
  meta: EduMeta,
  aiPreset?: { text: string; autoRun?: boolean; displayText?: string },
): Promise<void> {
  const html = eduTemplateHtml(templateId, meta)
  await window.aiOffice.newDoc({
    projectId,
    ...(html ? { aiContent: { title: eduTemplateTitle(templateId, meta), html } } : {}),
    ...(aiPreset ? { aiPreset } : {}),
  })
}

const AI_WORKFLOWS = EDU_WORKFLOWS.filter((w) => w.id !== 'lesson-chain-templates')

interface TeacherHomeProps {
  projects: ProjectSummaryEntry[]
  selectedId: string | null
  onSelectPack: (id: string | null) => void
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
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmAi, setConfirmAi] = useState<EduWorkflowId | null>(null)
  const [exportMsg, setExportMsg] = useState<string | null>(null)

  const [hubBaseUrl, setHubBaseUrl] = useState('')
  const [hubToken, setHubToken] = useState('')
  const [hubModel, setHubModel] = useState('')
  const [hubStatus, setHubStatus] = useState<string | null>(null)
  const [hubOk, setHubOk] = useState<boolean | null>(null)
  const [hubSaving, setHubSaving] = useState(false)

  const label = (viText: string, enText: string) => (vi ? viText : enText)

  useEffect(() => {
    void window.aiOffice.getAiSettings?.().then((s) => {
      const custom = s.providers.custom
      setHubBaseUrl(custom?.baseUrl ?? '')
      setHubToken(custom?.apiKey ?? '')
      setHubModel(custom?.model ?? '')
      if (s.provider === 'custom' && custom?.baseUrl) {
        setHubStatus(label('Đang dùng Hub (Custom).', 'Using Hub (Custom).'))
        setHubOk(true)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveHub = async () => {
    setHubSaving(true)
    setHubStatus(null)
    try {
      const current = await window.aiOffice.getAiSettings()
      const baseUrl = hubBaseUrl.trim().replace(/\/+$/, '')
      const apiKey = hubToken.trim()
      const model = hubModel.trim()
      if (!baseUrl || !apiKey) {
        setHubOk(false)
        setHubStatus(label('Cần Base URL và Token.', 'Base URL and token are required.'))
        return
      }
      const next = {
        ...current,
        provider: 'custom' as const,
        providers: {
          ...current.providers,
          custom: {
            ...current.providers.custom,
            apiKey,
            baseUrl,
            model: model || current.providers.custom.model || 'gpt-4o',
          },
        },
      }
      await window.aiOffice.setAiSettings(next)
      const probe = await window.aiOffice.probeAiHub({ baseUrl, apiKey })
      setHubOk(probe.ok)
      setHubStatus(
        probe.ok
          ? label(`Đã lưu. ${probe.message}`, `Saved. ${probe.message}`)
          : label(
              `Đã lưu token, nhưng kiểm tra Hub: ${probe.message}`,
              `Token saved, but Hub check failed: ${probe.message}`,
            ),
      )
    } catch (err) {
      setHubOk(false)
      setHubStatus(err instanceof Error ? err.message : String(err))
    } finally {
      setHubSaving(false)
    }
  }

  const probeHub = async () => {
    setHubStatus(null)
    const probe = await window.aiOffice.probeAiHub({
      baseUrl: hubBaseUrl.trim(),
      apiKey: hubToken.trim(),
    })
    setHubOk(probe.ok)
    setHubStatus(probe.message)
  }

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
      const createdMeta = toEduMeta(created)
      if (createdMeta) {
        await openDocsTemplate(created.id, 'giao-an', createdMeta)
      }
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
    setBusy(`tpl:${templateId}`)
    try {
      if (def.app === 'docs') {
        await openDocsTemplate(selected.id, templateId, meta)
        return
      }
      if (def.app === 'slides') {
        await window.aiOffice.newSlide({ projectId: selected.id })
        return
      }
      await window.aiOffice.newSheet({ projectId: selected.id })
    } finally {
      setBusy(null)
    }
  }

  const openLessonChainFree = async () => {
    if (!selected || !meta) return
    setBusy('chain')
    try {
      for (const id of EDU_LESSON_CHAIN_TEMPLATES) {
        const def = EDU_TEMPLATES.find((t) => t.id === id)
        if (!def) continue
        if (def.app === 'docs') await openDocsTemplate(selected.id, id, meta)
        else if (def.app === 'slides') await window.aiOffice.newSlide({ projectId: selected.id })
        else await window.aiOffice.newSheet({ projectId: selected.id })
      }
    } finally {
      setBusy(null)
    }
  }

  const runAiWorkflow = async (workflowId: EduWorkflowId) => {
    if (!selected || !meta || workflowId === 'lesson-chain-templates') return
    const wf = AI_WORKFLOWS.find((w) => w.id === workflowId)
    if (!wf) return
    const prompt = eduWorkflowPrompt(workflowId, meta)
    const displayText = vi ? wf.labelVi : wf.labelEn
    setBusy(`ai:${workflowId}`)
    setConfirmAi(null)
    try {
      const projectId = selected.id
      const preset = { text: prompt, autoRun: true, displayText }
      if (wf.app === 'slides') {
        await window.aiOffice.newSlide({ projectId, aiPreset: preset })
        return
      }
      await openDocsTemplate(projectId, wf.seedTemplate, meta, preset)
    } finally {
      setBusy(null)
    }
  }

  const exportPack = async () => {
    if (!selected) return
    setExportMsg(null)
    setBusy('export')
    try {
      const r = await window.aiOffice.exportLessonPack(selected.id)
      if (r.canceled) return
      if (!r.ok) {
        setExportMsg(r.error || label('Xuất thất bại.', 'Export failed.'))
        return
      }
      setExportMsg(
        label(`Đã xuất: ${r.path}`, `Exported: ${r.path}`),
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="content teacher-home">
      <section className="teacher-hero" aria-label={label('Giáo viên', 'Teacher')}>
        <h1 className="teacher-title">{label('Chế độ Giáo viên', 'Teacher mode')}</h1>
        <p className="teacher-subtitle">
          {label(
            'Cài trên máy · soạn và xuất gói bài miễn phí. Chỉ trừ Token AI khi bạn chủ động chạy workflow / chat AI.',
            'Installed on your computer · draft and export for free. AI Tokens are charged only when you run AI workflows / chat.',
          )}
        </p>
      </section>

      <section className="teacher-hub" aria-label={label('Hub AI Token', 'Hub AI Token')}>
        <h2>{label('Hub AI Token (thu phí khi dùng AI)', 'Hub AI Token (pay only when using AI)')}</h2>
        <p className="teacher-hint">
          {label(
            'Gateway OpenAI-compatible của bạn. Mở mẫu / xuất zip không trừ Token.',
            'Your OpenAI-compatible gateway. Opening templates / exporting zip does not charge Tokens.',
          )}
        </p>
        <div className="teacher-form">
          <label className="teacher-form-wide">
            <span>Base URL</span>
            <input
              value={hubBaseUrl}
              onChange={(e) => setHubBaseUrl(e.target.value)}
              placeholder="https://your-hub.example/v1"
            />
          </label>
          <label className="teacher-form-wide">
            <span>API Token</span>
            <input
              type="password"
              value={hubToken}
              onChange={(e) => setHubToken(e.target.value)}
              placeholder="sk-…"
              autoComplete="off"
            />
          </label>
          <label>
            <span>{label('Model (tuỳ chọn)', 'Model (optional)')}</span>
            <input
              value={hubModel}
              onChange={(e) => setHubModel(e.target.value)}
              placeholder="gpt-4o"
            />
          </label>
        </div>
        {hubStatus && (
          <p className={`teacher-hint${hubOk === false ? ' teacher-error-inline' : ''}`}>{hubStatus}</p>
        )}
        <div className="teacher-chip-row">
          <button className="btn btn-secondary" disabled={hubSaving} onClick={() => void saveHub()}>
            {hubSaving
              ? label('Đang lưu…', 'Saving…')
              : label('Lưu & kiểm tra Hub', 'Save & check Hub')}
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => void probeHub()}>
            {label('Kiểm tra lại', 'Re-check')}
          </button>
        </div>
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
                placeholder={label(
                  'Nhận biết phân số\nSo sánh phân số',
                  'Identify fractions\nCompare fractions',
                )}
              />
            </label>
          </div>
          {error && <p className="teacher-error">{error}</p>}
          <button className="btn btn-primary" disabled={creating} onClick={() => void submitCreate()}>
            {creating
              ? label('Đang tạo…', 'Creating…')
              : label('Tạo gói + mở giáo án (miễn phí)', 'Create pack + open plan (free)')}
          </button>
        </section>

        <section className="teacher-packs" aria-label={label('Gói bài', 'Lesson packs')}>
          <h2>
            {label('Gói bài của bạn', 'Your lesson packs')}
            <span className="teacher-count">{packs.length}</span>
          </h2>
          {packs.length === 0 ? (
            <p className="teacher-empty">
              {label(
                'Chưa có gói bài nào. Tạo gói đầu tiên bên trái.',
                'No packs yet. Create one on the left.',
              )}
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
                {[
                  meta.subject,
                  meta.grade,
                  meta.week,
                  meta.durationMinutes ? `${meta.durationMinutes}'` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <div className="teacher-chip-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onOpenPackFiles(selected.id)}
              >
                {label('Xem file', 'View files')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy === 'export'}
                onClick={() => void exportPack()}
              >
                {busy === 'export'
                  ? label('Đang xuất…', 'Exporting…')
                  : label('Xuất gói ZIP', 'Export ZIP')}
              </button>
            </div>
          </header>
          {exportMsg && <p className="teacher-hint">{exportMsg}</p>}

          <div className="teacher-actions">
            <div>
              <h3>{label('Mẫu (miễn phí, không trừ Token)', 'Templates (free, no Token)')}</h3>
              <div className="teacher-chip-row">
                {EDU_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="teacher-chip"
                    disabled={busy === `tpl:${t.id}`}
                    onClick={() => void openTemplate(t.id)}
                  >
                    {vi ? t.labelVi : t.labelEn}
                  </button>
                ))}
                <button
                  type="button"
                  className="teacher-chip"
                  disabled={busy === 'chain'}
                  onClick={() => void openLessonChainFree()}
                >
                  {label('Chuỗi tiết dạy (giáo án→slide→phiếu)', 'Lesson chain (plan→slides→worksheet)')}
                </button>
              </div>
            </div>
            <div>
              <h3>{label('AI workflows (có trừ Token — cần xác nhận)', 'AI workflows (uses Tokens — confirm)')}</h3>
              <div className="teacher-chip-row">
                {AI_WORKFLOWS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    className="teacher-chip teacher-chip-ai"
                    disabled={!!busy}
                    onClick={() => setConfirmAi(w.id)}
                  >
                    {vi ? w.labelVi : w.labelEn}
                  </button>
                ))}
              </div>
              <p className="teacher-hint">
                {label(
                  'Mỗi lần chạy sẽ mở mẫu và gửi prompt AI. Hết Token thì soạn tay / dùng mẫu vẫn được.',
                  'Each run opens a seed and sends an AI prompt. If Tokens run out, templates still work offline.',
                )}
              </p>
            </div>
          </div>
        </section>
      )}

      {confirmAi && (
        <div className="modal-overlay" onClick={() => setConfirmAi(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={label('Xác nhận dùng Token AI', 'Confirm AI Token use')}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{label('Dùng Token AI?', 'Use AI Tokens?')}</h3>
            <p>
              {label(
                'Thao tác này sẽ gọi Hub AI và có thể trừ credit/token. Soạn mẫu thủ công thì không bị trừ.',
                'This will call your AI Hub and may spend credits/tokens. Manual templates are free.',
              )}
            </p>
            <div className="modal-buttons">
              <button className="btn btn-secondary" type="button" onClick={() => setConfirmAi(null)}>
                {label('Huỷ', 'Cancel')}
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => void runAiWorkflow(confirmAi)}
              >
                {label('Chạy AI', 'Run AI')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
