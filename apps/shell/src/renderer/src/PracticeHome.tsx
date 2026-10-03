import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import {
  isWorkbenchModuleId,
  practiceMaterialSeedHtml,
  practiceMatchesFilter,
  practiceSkillPrompt,
  type PracticeDefinition,
  type PracticeId,
  type PracticeMeta,
} from '@uniwork/practice-core'
import type { ProjectSummaryEntry } from '../../shared/home-api'
import { WorkbenchModulePane } from './WorkbenchModulePanes'
import { WorkbenchTabs } from './WorkbenchTabs'

const UI_LANG_KEY = 'uniwork.teacherUiLang'

interface PracticeHomeProps {
  practice: PracticeDefinition
  projects: ProjectSummaryEntry[]
  selectedId: string | null
  onSelectPack: (id: string | null) => void
  onOpenPackFiles: (id: string) => void
  onRefresh: () => void
  onSwitchPractice: (id: PracticeId) => void
  practices: readonly PracticeDefinition[]
}

function toPracticeMeta(entry: ProjectSummaryEntry, practiceId: PracticeId): PracticeMeta | null {
  const p = entry.practice
  if (!p || p.practiceId !== practiceId) return null
  return {
    version: 1,
    kind: 'practice',
    practiceId: p.practiceId,
    title: p.title,
    facets: p.facets ?? {},
    ...(p.tags?.length ? { tags: p.tags } : {}),
    ...(p.notes ? { notes: p.notes } : {}),
    ...(p.materials ? { materials: p.materials } : {}),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

export function PracticeHome({
  practice,
  projects,
  selectedId,
  onSelectPack,
  onOpenPackFiles,
  onRefresh,
  onSwitchPractice,
  practices,
}: PracticeHomeProps): ReactElement {
  const [uiLang, setUiLang] = useState<'vi' | 'en'>(() => {
    try {
      const s = localStorage.getItem(UI_LANG_KEY)
      return s === 'en' ? 'en' : 'vi'
    } catch {
      return 'vi'
    }
  })
  const vi = uiLang === 'vi'
  const label = (a: string, b: string) => (vi ? a : b)

  const [tab, setTab] = useState<string>('desk')
  const [qQuery, setQQuery] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmSkill, setConfirmSkill] = useState<string | null>(null)
  const [facetDraft, setFacetDraft] = useState<Record<string, string>>({})
  const [titleDraft, setTitleDraft] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [noteDraft, setNoteDraft] = useState('')
  const [tagDraft, setTagDraft] = useState('')
  const [addRole, setAddRole] = useState(practice.materialRoles[0]?.id ?? 'khac')
  const [packFiles, setPackFiles] = useState<string[]>([])

  useEffect(() => {
    const init: Record<string, string> = {}
    for (const f of practice.facets) {
      if (f.id === practice.titleFacetId) continue
      init[f.id] = f.options?.[0] ?? ''
    }
    setFacetDraft(init)
    setTitleDraft('')
    setAddRole(practice.materialRoles[0]?.id ?? 'khac')
    setTab('desk')
  }, [practice.id])

  const packs = useMemo(() => {
    return projects
      .filter((p) => p.kind === practice.projectKind && !!p.practice)
      .map((p) => ({ entry: p, meta: toPracticeMeta(p, practice.id) }))
      .filter((x): x is { entry: ProjectSummaryEntry; meta: PracticeMeta } => !!x.meta)
      .filter(({ entry, meta }) =>
        practiceMatchesFilter(
          {
            id: entry.id,
            name: entry.name,
            fileCount: entry.fileCount,
            lastActiveAt: entry.lastActiveAt,
            meta,
          },
          { query: qQuery || undefined },
        ),
      )
      .sort((a, b) => (b.entry.lastActiveAt > a.entry.lastActiveAt ? 1 : -1))
  }, [projects, practice.id, practice.projectKind, qQuery])

  const selected = projects.find((p) => p.id === selectedId) ?? null
  const meta = selected ? toPracticeMeta(selected, practice.id) : null

  useEffect(() => {
    if (!meta) {
      setNoteDraft('')
      setTagDraft('')
      return
    }
    setNoteDraft(meta.notes ?? '')
    setTagDraft((meta.tags ?? []).join(', '))
  }, [selected?.id, meta?.notes, meta?.tags])

  useEffect(() => {
    if (!selectedId || !window.aiOfficeProject) {
      setPackFiles([])
      return
    }
    void window.aiOfficeProject.listFiles(selectedId).then(setPackFiles).catch(() => setPackFiles([]))
  }, [selectedId, selected?.fileCount])

  const rememberRole = async (projectId: string, role: string) => {
    const current = await window.aiOfficeProject!.getPracticeMeta(projectId)
    const materials = { ...(current?.materials ?? {}), [`role:${role}`]: role }
    await window.aiOfficeProject!.patchPracticeMeta({ projectId, patch: { materials } })
    onRefresh()
  }

  const openDocs = async (
    projectId: string,
    title: string,
    html: string,
    aiPreset?: { text: string; autoRun?: boolean; displayText?: string },
  ) => {
    await window.aiOffice.newDoc({
      projectId,
      aiContent: { title, html },
      ...(aiPreset ? { aiPreset } : {}),
    })
  }

  const submitCreate = async () => {
    setError(null)
    const title = titleDraft.trim()
    if (!title) {
      setError(label('Cần nhập tiêu đề gói.', 'Pack title is required.'))
      return
    }
    for (const f of practice.facets) {
      if (f.id === practice.titleFacetId) continue
      if (f.required && !(facetDraft[f.id] ?? '').trim()) {
        setError(label(`Thiếu: ${f.labelVi}`, `Missing: ${f.labelEn}`))
        return
      }
    }
    setBusy('create')
    try {
      const tags = tagsText
        .split(/[,;]/)
        .map((t) => t.trim())
        .filter(Boolean)
      if (practice.id === 'teacher') {
        throw new Error('Teacher packs use TeacherHome')
      }
      const created = await window.aiOfficeProject!.createPracticeProject({
        practiceId: practice.id as Exclude<PracticeId, 'teacher'>,
        title,
        facets: facetDraft,
        tags,
      })
      onRefresh()
      onSelectPack(created.id)
      const createdMeta = toPracticeMeta(created, practice.id)
      const seedRole = practice.templates[0]?.materialRole ?? practice.materialRoles[0]?.id
      if (createdMeta && seedRole) {
        const roleDef = practice.materialRoles.find((r) => r.id === seedRole)
        const html = practiceMaterialSeedHtml(
          seedRole,
          vi ? (roleDef?.labelVi ?? seedRole) : (roleDef?.labelEn ?? seedRole),
          createdMeta,
        )
        if (roleDef?.app === 'slides') {
          await window.aiOffice.newSlide({ projectId: created.id })
        } else if (roleDef?.app === 'sheets') {
          await window.aiOffice.newSheet({ projectId: created.id })
        } else {
          await openDocs(created.id, `${roleDef?.labelVi ?? seedRole} — ${title}`, html)
        }
        await rememberRole(created.id, seedRole)
      }
      setTitleDraft('')
      setTagsText('')
      setTab('materials')
      setNotice(label('Đã tạo gói trong Tri thức.', 'Pack added to Knowledge.'))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  const saveMeta = async () => {
    if (!selected || !meta) return
    setBusy('meta')
    try {
      const tags = tagDraft
        .split(/[,;]/)
        .map((t) => t.trim())
        .filter(Boolean)
      await window.aiOfficeProject!.patchPracticeMeta({
        projectId: selected.id,
        patch: { notes: noteDraft, tags },
      })
      onRefresh()
      setNotice(label('Đã lưu.', 'Saved.'))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  const addMaterial = async () => {
    if (!selected || !meta) return
    const roleDef = practice.materialRoles.find((r) => r.id === addRole)
    if (!roleDef) return
    setBusy(`mat:${addRole}`)
    try {
      if (roleDef.app === 'slides') await window.aiOffice.newSlide({ projectId: selected.id })
      else if (roleDef.app === 'sheets') await window.aiOffice.newSheet({ projectId: selected.id })
      else {
        const html = practiceMaterialSeedHtml(addRole, vi ? roleDef.labelVi : roleDef.labelEn, meta)
        await openDocs(selected.id, `${roleDef.labelVi} — ${meta.title}`, html)
      }
      await rememberRole(selected.id, addRole)
      setNotice(label(`Đã thêm: ${roleDef.labelVi}`, `Added: ${roleDef.labelEn}`))
    } finally {
      setBusy(null)
    }
  }

  const openTemplate = async (templateId: string) => {
    if (!selected || !meta) return
    const tpl = practice.templates.find((t) => t.id === templateId)
    if (!tpl) return
    setBusy(`tpl:${templateId}`)
    try {
      if (tpl.app === 'slides') await window.aiOffice.newSlide({ projectId: selected.id })
      else if (tpl.app === 'sheets') await window.aiOffice.newSheet({ projectId: selected.id })
      else {
        const roleDef = practice.materialRoles.find((r) => r.id === tpl.materialRole)
        const html = practiceMaterialSeedHtml(
          tpl.materialRole,
          vi ? (roleDef?.labelVi ?? tpl.labelVi) : (roleDef?.labelEn ?? tpl.labelEn),
          meta,
        )
        await openDocs(selected.id, `${tpl.labelVi} — ${meta.title}`, html)
      }
      await rememberRole(selected.id, tpl.materialRole)
    } finally {
      setBusy(null)
    }
  }

  const runSkill = async (skillId: string) => {
    if (!selected || !meta) return
    const skill = practice.skills.find((s) => s.id === skillId)
    if (!skill) return
    setConfirmSkill(null)
    setBusy(`skill:${skillId}`)
    try {
      const prompt = practiceSkillPrompt(
        vi ? skill.labelVi : skill.labelEn,
        vi ? skill.descVi : skill.descEn,
        meta,
      )
      const preset = {
        text: prompt,
        autoRun: true,
        displayText: vi ? skill.labelVi : skill.labelEn,
      }
      if (skill.app === 'slides') {
        await window.aiOffice.newSlide({ projectId: selected.id, aiPreset: preset })
      } else {
        const role = skill.seedRole ?? practice.materialRoles[0]?.id ?? 'khac'
        const roleDef = practice.materialRoles.find((r) => r.id === role)
        const html = practiceMaterialSeedHtml(
          role,
          vi ? (roleDef?.labelVi ?? role) : (roleDef?.labelEn ?? role),
          meta,
        )
        await openDocs(selected.id, `${skill.labelVi} — ${meta.title}`, html, preset)
        await rememberRole(selected.id, role)
      }
      setNotice(label(`Đã chạy skill: ${skill.labelVi}`, `Ran skill: ${skill.labelEn}`))
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="content teacher-home">
      <section className="teacher-hero">
        <div className="teacher-hero-top">
          <div>
            <p className="teacher-hint">{label('Vai trò làm việc', 'Practice role')}</p>
            <h1 className="teacher-title">{vi ? practice.labelVi : practice.labelEn}</h1>
            <p className="teacher-subtitle">{vi ? practice.subtitleVi : practice.subtitleEn}</p>
            <p className="teacher-hint">
              {label(`${packs.length} gói trong thư viện`, `${packs.length} packs in library`)}
            </p>
          </div>
          <div className="teacher-hero-controls">
            <label className="teacher-lang">
              <span>{label('Vai trò', 'Role')}</span>
              <select
                value={practice.id}
                onChange={(e) => onSwitchPractice(e.target.value as PracticeId)}
              >
                {practices.map((p) => (
                  <option key={p.id} value={p.id}>
                    {vi ? p.labelVi : p.labelEn}
                  </option>
                ))}
              </select>
            </label>
            <label className="teacher-lang">
              <span>{label('Ngôn ngữ', 'Language')}</span>
              <select
                value={uiLang}
                onChange={(e) => {
                  const next = e.target.value as 'vi' | 'en'
                  setUiLang(next)
                  try {
                    localStorage.setItem(UI_LANG_KEY, next)
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <WorkbenchTabs
        practiceId={practice.id}
        pillars={practice.pillars}
        active={tab}
        onSelect={setTab}
        vi={vi}
        onPinsChange={(pins) => {
          if (isWorkbenchModuleId(tab) && !pins.includes(tab)) setTab(pins.includes('desk') ? 'desk' : 'knowledge')
        }}
      />

      {error && <p className="teacher-error">{error}</p>}
      {notice && <p className="teacher-hint">{notice}</p>}

      {isWorkbenchModuleId(tab) ? (
        <WorkbenchModulePane
          moduleId={tab}
          practiceId={practice.id}
          vi={vi}
          contextTitle={meta?.title}
          packId={selectedId}
          onPackLinked={onRefresh}
        />
      ) : null}

      {tab === 'knowledge' && (
        <section className="teacher-panel">
          <label className="teacher-form-wide">
            <span>{label('Tìm', 'Search')}</span>
            <input
              value={qQuery}
              onChange={(e) => setQQuery(e.target.value)}
              placeholder={label('Tên gói, thẻ, ghi chú…', 'Title, tags, notes…')}
            />
          </label>
          <div className="teacher-layout">
            <section className="teacher-packs">
              <h2>
                {label('Thư viện', 'Library')}
                <span className="teacher-count">{packs.length}</span>
              </h2>
              {packs.length === 0 ? (
                <p className="teacher-empty">
                  {label('Chưa có gói. Tạo ở tab Soạn mới.', 'No packs yet. Create in Compose.')}
                </p>
              ) : (
                <ul className="teacher-pack-list">
                  {packs.map(({ entry, meta: m }) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className={`teacher-pack-item${entry.id === selectedId ? ' active' : ''}`}
                        onClick={() => onSelectPack(entry.id === selectedId ? null : entry.id)}
                      >
                        <strong>{m.title}</strong>
                        <span>{Object.values(m.facets).filter(Boolean).join(' · ')}</span>
                        <em>
                          {entry.fileCount} {label('tệp', 'files')}
                        </em>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <aside className="teacher-detail">
              {selected && meta ? (
                <>
                  <h2>{meta.title}</h2>
                  <p>{Object.values(meta.facets).filter(Boolean).join(' · ')}</p>
                  <div className="teacher-chip-row">
                    <button type="button" className="btn btn-secondary" onClick={() => setTab('materials')}>
                      {label('Tài liệu', 'Materials')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onOpenPackFiles(selected.id)}
                    >
                      {label('Xem file', 'View files')}
                    </button>
                  </div>
                  <div className="teacher-form teacher-form-spaced">
                    <label className="teacher-form-wide">
                      <span>{label('Thẻ', 'Tags')}</span>
                      <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} />
                    </label>
                    <label className="teacher-form-wide">
                      <span>{label('Ghi chú', 'Notes')}</span>
                      <textarea rows={3} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
                    </label>
                  </div>
                  <button type="button" className="btn btn-primary" disabled={!!busy} onClick={() => void saveMeta()}>
                    {label('Lưu', 'Save')}
                  </button>
                </>
              ) : (
                <p className="teacher-empty">{label('Chọn một gói.', 'Select a pack.')}</p>
              )}
            </aside>
          </div>
        </section>
      )}

      {tab === 'materials' && (
        <section className="teacher-panel teacher-detail">
          {!selected || !meta ? (
            <p className="teacher-empty">{label('Chọn gói ở Tri thức trước.', 'Select a Knowledge pack first.')}</p>
          ) : (
            <>
              <h2>
                {label('Tài liệu', 'Materials')} · {meta.title}
              </h2>
              <ul className="teacher-material-list">
                {packFiles.length === 0 ? (
                  <li className="teacher-empty">{label('Chưa có file — thêm bên dưới.', 'No files yet — add below.')}</li>
                ) : (
                  packFiles.map((fp) => {
                    const base = fp.split(/[/\\]/).pop() || fp
                    return (
                      <li key={fp} className="teacher-material-row">
                        <div>
                          <strong>{base}</strong>
                          <span>{meta.materials?.[fp] ?? meta.materials?.[`role:${base}`] ?? '—'}</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => void window.aiOffice.openPath(fp)}
                        >
                          {label('Mở', 'Open')}
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
              <div className="teacher-add-row">
                <label>
                  <span>{label('Thêm tài liệu', 'Add material')}</span>
                  <select value={addRole} onChange={(e) => setAddRole(e.target.value)}>
                    {practice.materialRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {vi ? r.labelVi : r.labelEn}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className="btn btn-primary" disabled={!!busy} onClick={() => void addMaterial()}>
                  {label('Thêm & mở', 'Add & open')}
                </button>
              </div>
              <p className="teacher-hint">
                {label(
                  'Tạo nhanh Office vào gói này (lưu lần đầu = hiện trong danh sách). File đã có: chuyển gói từ Home → danh sách file.',
                  'Quick-create Office into this pack (first save lists it here). Existing files: move pack from Home → file list.',
                )}
              </p>
              <div className="teacher-chip-row">
                <button
                  type="button"
                  className="teacher-chip"
                  disabled={!!busy}
                  onClick={() => void window.aiOffice.newDoc({ projectId: selected.id })}
                >
                  Docs
                </button>
                <button
                  type="button"
                  className="teacher-chip"
                  disabled={!!busy}
                  onClick={() => void window.aiOffice.newSheet({ projectId: selected.id })}
                >
                  Sheets
                </button>
                <button
                  type="button"
                  className="teacher-chip"
                  disabled={!!busy}
                  onClick={() => void window.aiOffice.newSlide({ projectId: selected.id })}
                >
                  Slides
                </button>
                <button
                  type="button"
                  className="teacher-chip"
                  disabled={!!busy}
                  onClick={() => void window.aiOffice.newPdf({ projectId: selected.id })}
                >
                  PDF
                </button>
              </div>
              <h3>{label('Mẫu nhanh (miễn phí)', 'Quick templates (free)')}</h3>
              <div className="teacher-chip-row">
                {practice.templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="teacher-chip"
                    disabled={!!busy}
                    onClick={() => void openTemplate(t.id)}
                  >
                    {vi ? t.labelVi : t.labelEn}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {tab === 'skills' && (
        <section className="teacher-panel teacher-detail">
          <h2>Skills</h2>
          <p className="teacher-hint">
            {label(
              'Mỗi lần chạy hỏi xác nhận Token. Mẫu tay vẫn miễn phí.',
              'Each run asks to confirm Tokens. Manual templates stay free.',
            )}
          </p>
          {!selected || !meta ? (
            <p className="teacher-empty">{label('Chọn gói để gắn ngữ cảnh.', 'Select a pack for context.')}</p>
          ) : (
            <p>
              {label('Ngữ cảnh:', 'Context:')} <strong>{meta.title}</strong>
            </p>
          )}
          <ul className="teacher-skill-list">
            {practice.skills.map((s) => (
              <li key={s.id} className="teacher-skill-row">
                <div>
                  <strong>{vi ? s.labelVi : s.labelEn}</strong>
                  <span>{vi ? s.descVi : s.descEn}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!!busy || !selected}
                  onClick={() => setConfirmSkill(s.id)}
                >
                  {label('Chạy', 'Run')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'compose' && (
        <section className="teacher-panel teacher-create">
          <h2>{label('Soạn gói mới', 'New pack')}</h2>
          <div className="teacher-form">
            {practice.facets.map((f) => {
              if (f.id === practice.titleFacetId) {
                return (
                  <label key={f.id} className="teacher-form-wide">
                    <span>{vi ? f.labelVi : f.labelEn}</span>
                    <input
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      placeholder={vi ? f.placeholderVi : f.placeholderEn}
                    />
                  </label>
                )
              }
              return (
                <label key={f.id}>
                  <span>{vi ? f.labelVi : f.labelEn}</span>
                  {f.options ? (
                    <select
                      value={facetDraft[f.id] ?? ''}
                      onChange={(e) => setFacetDraft((d) => ({ ...d, [f.id]: e.target.value }))}
                    >
                      {f.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={facetDraft[f.id] ?? ''}
                      onChange={(e) => setFacetDraft((d) => ({ ...d, [f.id]: e.target.value }))}
                      placeholder={vi ? f.placeholderVi : f.placeholderEn}
                    />
                  )}
                </label>
              )
            })}
            <label className="teacher-form-wide">
              <span>{label('Thẻ', 'Tags')}</span>
              <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
            </label>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy === 'create'}
            onClick={() => void submitCreate()}
          >
            {busy === 'create'
              ? label('Đang tạo…', 'Creating…')
              : label('Tạo gói vào Tri thức', 'Create pack in Knowledge')}
          </button>
        </section>
      )}

      {confirmSkill && (
        <div className="modal-overlay" onClick={() => setConfirmSkill(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>{label('Dùng Token AI?', 'Use AI Tokens?')}</h3>
            <p>
              {label(
                'Thao tác này gọi Hub AI và có thể trừ token.',
                'This calls your AI Hub and may spend tokens.',
              )}
            </p>
            <div className="modal-buttons">
              <button className="btn btn-secondary" type="button" onClick={() => setConfirmSkill(null)}>
                {label('Huỷ', 'Cancel')}
              </button>
              <button className="btn btn-primary" type="button" onClick={() => void runSkill(confirmSkill)}>
                {label('Chạy AI', 'Run AI')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
