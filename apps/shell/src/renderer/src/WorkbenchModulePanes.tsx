import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { getWorkbenchModule, type PracticeId, type WorkbenchModuleId } from '@uniwork/practice-core'
import { WorkbenchIcon } from './WorkbenchIcons'
import { CalendarPane } from './CalendarPane'
import { DeskPane } from './DeskPane'
import { AttendancePane } from './AttendancePane'
import { GradesPane } from './GradesPane'
import { QuestionBankPane } from './QuestionBankPane'
import { TimetablePane } from './TimetablePane'
import { FamilyPane } from './FamilyPane'
import { FinancePane } from './FinancePane'
import { FriendsPane } from './FriendsPane'
import { HealthPane } from './HealthPane'
import { EmailPane } from './EmailPane'
import { NotesPane } from './NotesPane'
import { PetsPane } from './PetsPane'
import { TasksPane } from './TasksPane'
import { ensureTeacherFormSeeds } from './teacher-form-seeds'
import {
  WbDeleteBtn,
  WbDraftBtn,
  WbEditBtn,
  WbExpandBtn,
  WbFileBtn,
  WbMailBtn,
  WbRowActions,
} from './WbRowActions'
import {
  applyRosterImport,
  createEmailDraft,
  ensureParentByName,
  linkStudentParent,
  listStudentClasses,
  parseRosterImport,
  pinModule,
  readClients,
  readContracts,
  readEvents,
  defaultTravelChecklist,
  readForms,
  readGrowth,
  readMatters,
  readParents,
  readPersonal,
  readStudents,
  readTravel,
  syncStudentParentDenorm,
  writeClients,
  writeContracts,
  writeEvents,
  writeForms,
  writeGrowth,
  writeMatters,
  writeParents,
  writePersonal,
  writeStudents,
  writeTravel,
  type WbClientItem,
  type WbContractItem,
  type WbEventItem,
  type WbFormItem,
  type WbGrowthItem,
  type WbMatterItem,
  type WbParentItem,
  type WbPersonalProfile,
  type WbStudentItem,
  type WbTravelTrip,
} from './workbench-pins'

interface Props {
  moduleId: WorkbenchModuleId
  practiceId: PracticeId
  vi: boolean
  contextTitle?: string | null
  /** Selected Tri thức pack — Soạn from modules joins Tài liệu on first save. */
  packId?: string | null
  onPackLinked?: () => void
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function WorkbenchModulePane({
  moduleId,
  practiceId,
  vi,
  contextTitle,
  packId = null,
  onPackLinked,
}: Props): ReactElement {
  const mod = getWorkbenchModule(moduleId)
  const label = (a: string, b: string) => (vi ? a : b)

  if (!mod) {
    return <p className="teacher-empty">{label('Module không tồn tại.', 'Unknown module.')}</p>
  }

  const hideChrome = moduleId === 'desk' || moduleId === 'notes' || moduleId === 'email'

  return (
    <section
      className={`teacher-panel teacher-detail wb-page${hideChrome ? ' is-immersive' : ''}`}
      aria-label={vi ? mod.labelVi : mod.labelEn}
    >
      {!hideChrome && (
        <header className="wb-page-header">
          <span className="wb-page-icon" aria-hidden="true">
            <WorkbenchIcon id={moduleId} size={24} tone="quiet" />
          </span>
          <div className="wb-page-heading">
            <h1 className="wb-page-title">{vi ? mod.labelVi : mod.labelEn}</h1>
            <p className="wb-page-desc">
              {vi ? mod.hintVi : mod.hintEn}
              {contextTitle ? ` · ${contextTitle}` : ''}
            </p>
          </div>
        </header>
      )}
      {moduleId === 'desk' && <DeskPane practiceId={practiceId} vi={vi} />}
      {moduleId === 'calendar' && (
        <CalendarPane
          practiceId={practiceId}
          vi={vi}
          packId={packId}
          packTitle={contextTitle ?? null}
        />
      )}
      {moduleId === 'tasks' && <TasksPane practiceId={practiceId} vi={vi} />}
      {moduleId === 'notes' && <NotesPane practiceId={practiceId} vi={vi} />}
      {moduleId === 'email' && <EmailPane practiceId={practiceId} vi={vi} />}
      {moduleId === 'assistant' && <AssistantPane vi={vi} packId={packId} />}
      {moduleId === 'forms' && (
        <FormsPane practiceId={practiceId} vi={vi} packId={packId} onPackLinked={onPackLinked} />
      )}
      {moduleId === 'personal' && <PersonalPane vi={vi} />}
      {moduleId === 'personal-finance' && <FinancePane vi={vi} />}
      {moduleId === 'events' && <EventsPane practiceId={practiceId} vi={vi} />}
      {moduleId === 'health' && <HealthPane vi={vi} />}
      {moduleId === 'self-growth' && <GrowthPane vi={vi} />}
      {moduleId === 'family' && <FamilyPane vi={vi} />}
      {moduleId === 'friends' && <FriendsPane vi={vi} />}
      {moduleId === 'pets' && <PetsPane vi={vi} />}
      {moduleId === 'travel' && (
        <TravelPane vi={vi} packId={packId} onPackLinked={onPackLinked} />
      )}
      {moduleId === 'clients' && <ClientsPane practiceId={practiceId} vi={vi} />}
      {moduleId === 'students' && <StudentsPane practiceId={practiceId} vi={vi} />}
      {moduleId === 'parents' && <ParentsPane practiceId={practiceId} vi={vi} />}
      {moduleId === 'grades' && <GradesPane practiceId={practiceId} vi={vi} />}
      {moduleId === 'attendance' && <AttendancePane practiceId={practiceId} vi={vi} />}
      {moduleId === 'timetable' && <TimetablePane practiceId={practiceId} vi={vi} />}
      {moduleId === 'questions' && (
        <QuestionBankPane
          practiceId={practiceId}
          vi={vi}
          packId={packId}
          onPackLinked={onPackLinked}
        />
      )}
      {moduleId === 'contracts' && (
        <ContractsPane practiceId={practiceId} vi={vi} packId={packId} onPackLinked={onPackLinked} />
      )}
      {moduleId === 'matters' && (
        <MattersPane practiceId={practiceId} vi={vi} packId={packId} onPackLinked={onPackLinked} />
      )}
    </section>
  )
}

function AssistantPane({ vi, packId }: { vi: boolean; packId?: string | null }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  return (
    <div className="wb-assistant">
      <p>
        {label(
          'Trợ lý trên Home là “Trợ lý của bạn” (My AI). Trong Docs / Slides / Sheets dùng panel uniAI của tab đang mở.',
          'Home assistant is My AI. Inside Docs / Slides / Sheets use that tab’s uniAI panel.',
        )}
      </p>
      <p className="teacher-hint">
        {label(
          'Cách dùng: mở My AI để điều phối Workbench / file; hoặc Skills → chạy kỹ năng (có xác nhận Token).',
          'How: open My AI to orchestrate Workbench / files; or Skills → run a skill (Token confirm).',
        )}
      </p>
      {packId ? (
        <p className="teacher-hint">
          {label(
            'Đang chọn gói — file lưu lần đầu sẽ vào Tài liệu của gói.',
            'A pack is selected — first save joins that pack’s Materials.',
          )}
        </p>
      ) : (
        <p className="teacher-hint">
          {label(
            'Chọn gói ở Tri thức trước nếu muốn lưu vào Tài liệu.',
            'Select a Knowledge pack first to save into Materials.',
          )}
        </p>
      )}
      <div className="teacher-chip-row">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.dispatchEvent(new Event('uniwork:open-my-ai'))}
        >
          {label('Mở Trợ lý của bạn', 'Open My AI')}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void window.aiOffice.newDoc?.(packId ? { projectId: packId } : undefined)}
        >
          {label('Mở Docs + uniAI', 'Open Docs + uniAI')}
        </button>
      </div>
    </div>
  )
}

function FormsPane({
  practiceId,
  vi,
  packId,
  onPackLinked,
}: {
  practiceId: PracticeId
  vi: boolean
  packId?: string | null
  onPackLinked?: () => void
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbFormItem[]>(() =>
    practiceId === 'teacher' ? ensureTeacherFormSeeds(practiceId) : readForms(practiceId),
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [draftFile, setDraftFile] = useState<{
    filePath: string
    fileName: string
    fileExt: string
  } | null>(null)
  const [uploadNotice, setUploadNotice] = useState<string | null>(null)

  useEffect(() => {
    setItems(practiceId === 'teacher' ? ensureTeacherFormSeeds(practiceId) : readForms(practiceId))
    setEditingId(null)
    setTitle('')
    setNote('')
    setDraftFile(null)
  }, [practiceId])

  const persist = (next: WbFormItem[]) => {
    setItems(next)
    writeForms(practiceId, next)
  }

  const clearForm = () => {
    setEditingId(null)
    setTitle('')
    setNote('')
    setDraftFile(null)
  }

  const startEdit = (it: WbFormItem) => {
    setEditingId(it.id)
    setTitle(it.title)
    setNote(it.note ?? '')
    setDraftFile(
      it.filePath
        ? {
            filePath: it.filePath,
            fileName: it.fileName || it.filePath.split(/[\\/]/).pop() || it.title,
            fileExt: it.fileExt || '',
          }
        : null,
    )
  }

  const pickTemplateFile = async () => {
    const result = (await window.aiOffice.pickAttachments?.()) ?? null
    if (!result) return
    const accepted = result.accepted[0]
    if (!accepted) {
      setUploadNotice(
        result.rejected[0] ||
          label('Không chọn được file hỗ trợ.', 'No supported file selected.'),
      )
      window.setTimeout(() => setUploadNotice(null), 4000)
      return
    }
    setDraftFile({
      filePath: accepted.path,
      fileName: accepted.name,
      fileExt: accepted.ext,
    })
    if (!title.trim()) {
      setTitle(accepted.name.replace(/\.[^.]+$/, ''))
    }
    setUploadNotice(null)
  }

  const save = () => {
    const t = title.trim() || draftFile?.fileName.replace(/\.[^.]+$/, '') || ''
    if (!t) return
    const existing = editingId ? items.find((x) => x.id === editingId) : undefined
    const row: WbFormItem = {
      id: editingId ?? newId(),
      title: t,
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(existing?.linkedProjectId
        ? { linkedProjectId: existing.linkedProjectId }
        : packId
          ? { linkedProjectId: packId }
          : {}),
      ...(draftFile
        ? {
            filePath: draftFile.filePath,
            fileName: draftFile.fileName,
            ...(draftFile.fileExt ? { fileExt: draftFile.fileExt } : {}),
          }
        : {}),
      ...(existing?.templateId ? { templateId: existing.templateId } : {}),
    }
    if (editingId) {
      persist(items.map((x) => (x.id === editingId ? row : x)))
    } else {
      persist([row, ...items])
    }
    clearForm()
  }

  const openForm = async (item: WbFormItem) => {
    const targetPack = packId ?? item.linkedProjectId
    if (!targetPack) return
    const profile = readPersonal()
    const metaLines = [
      profile.fullName ? `<p><strong>Họ tên:</strong> ${escapeHtml(profile.fullName)}</p>` : '',
      profile.org ? `<p><strong>Đơn vị:</strong> ${escapeHtml(profile.org)}</p>` : '',
      profile.title ? `<p><strong>Chức danh:</strong> ${escapeHtml(profile.title)}</p>` : '',
    ]
      .filter(Boolean)
      .join('')
    const fileHint = item.fileName
      ? `<p><em>${vi ? 'Mẫu gốc' : 'Source template'}: ${escapeHtml(item.fileName)}</em></p>`
      : ''
    const html = `
      <h1>${escapeHtml(item.title)}</h1>
      ${item.note ? `<p><em>${escapeHtml(item.note)}</em></p>` : ''}
      ${fileHint}
      ${metaLines}
      <h2>${vi ? 'Nội dung' : 'Content'}</h2>
      <p></p>
    `.trim()
    await window.aiOffice.newDoc({
      projectId: targetPack,
      aiContent: { title: item.title, html },
    })
    if (!item.linkedProjectId || item.linkedProjectId !== targetPack) {
      persist(items.map((x) => (x.id === item.id ? { ...x, linkedProjectId: targetPack } : x)))
    }
    onPackLinked?.()
  }

  const openTemplateFile = async (item: WbFormItem) => {
    if (!item.filePath) return
    await window.aiOffice.openPath?.(item.filePath)
  }

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Tải file mẫu (Word/PDF/Excel…) vào thư viện — My AI có thể điền theo mẫu thật. “Soạn” seed Docs vào gói đang chọn; “Mở file” mở mẫu gốc.',
          'Upload a template file (Word/PDF/Excel…) — My AI can fill from the real form. “Draft” seeds Docs into the selected pack; “Open file” opens the source template.',
        )}
      </p>
      {!packId ? (
        <p className="teacher-hint">
          {label('Chọn gói ở Tri thức trước khi Soạn.', 'Select a Knowledge pack before drafting.')}
        </p>
      ) : null}
      <div className="wb-module-form">
        <label className="teacher-form-wide">
          <span>{label('Tên biểu mẫu', 'Form title')}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={label('VD: Đơn xin nghỉ phép', 'e.g. Leave request')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
            }}
          />
        </label>
        <label className="teacher-form-wide">
          <span>{label('Ghi chú (tuỳ chọn)', 'Note (optional)')}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="teacher-chip-row">
          <button type="button" className="btn btn-secondary" onClick={() => void pickTemplateFile()}>
            {draftFile
              ? label('Đổi file mẫu…', 'Replace template file…')
              : label('Tải file mẫu…', 'Upload template file…')}
          </button>
          {draftFile ? (
            <button type="button" className="btn btn-secondary" onClick={() => setDraftFile(null)}>
              {label('Bỏ file', 'Clear file')}
            </button>
          ) : null}
        </div>
        {draftFile ? (
          <p className="teacher-hint">
            {label('File mẫu:', 'Template file:')} {draftFile.fileName}
          </p>
        ) : null}
        {uploadNotice ? <p className="teacher-hint">{uploadNotice}</p> : null}
        <div className="teacher-chip-row">
          <button type="button" className="btn btn-primary" onClick={save}>
            {editingId ? label('Lưu biểu mẫu', 'Save form') : label('Thêm vào thư viện', 'Add to library')}
          </button>
          {editingId ? (
            <button type="button" className="btn btn-secondary" onClick={clearForm}>
              {label('Huỷ sửa', 'Cancel edit')}
            </button>
          ) : null}
        </div>
      </div>
      <ul className="wb-module-list">
        {items.length === 0 ? (
          <li className="teacher-empty">{label('Chưa có biểu mẫu.', 'No forms yet.')}</li>
        ) : (
          items.map((it) => {
            const canOpen = Boolean(packId ?? it.linkedProjectId)
            return (
              <li key={it.id} className="wb-module-row">
                <div className="wb-module-meta">
                  <strong>{it.title}</strong>
                  {it.note ? <span>{it.note}</span> : null}
                  {it.fileName ? (
                    <span className="teacher-hint">
                      {label('File:', 'File:')} {it.fileName}
                    </span>
                  ) : null}
                  {it.templateId ? (
                    <span className="teacher-hint">
                      {label('My AI mẫu:', 'My AI template:')} {it.templateId}
                    </span>
                  ) : null}
                  {it.linkedProjectId ? (
                    <span className="teacher-hint">
                      {label('Đã gắn gói Tài liệu', 'Linked to Materials pack')}
                    </span>
                  ) : null}
                </div>
                <WbRowActions>
                  <WbEditBtn label={label('Sửa', 'Edit')} onClick={() => startEdit(it)} />
                  {it.filePath ? (
                    <WbFileBtn
                      label={label('Mở file', 'Open file')}
                      onClick={() => void openTemplateFile(it)}
                    />
                  ) : null}
                  <WbDraftBtn
                    label={label('Soạn', 'Draft')}
                    disabled={!canOpen}
                    title={
                      canOpen
                        ? label('Soạn', 'Draft')
                        : label('Chọn gói ở Tri thức trước', 'Select a Knowledge pack first')
                    }
                    onClick={() => void openForm(it)}
                  />
                  <WbDeleteBtn
                    label={label('Xóa', 'Delete')}
                    onClick={() => {
                      if (editingId === it.id) clearForm()
                      persist(items.filter((x) => x.id !== it.id))
                    }}
                  />
                </WbRowActions>
              </li>
            )
          })
        )}
      </ul>
    </>
  )
}

function PersonalPane({ vi }: { vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [profile, setProfile] = useState<WbPersonalProfile>(() => readPersonal())
  const [saved, setSaved] = useState(false)

  const setField = (key: keyof WbPersonalProfile, value: string) => {
    setProfile((p) => ({ ...p, [key]: value }))
    setSaved(false)
  }

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Hồ sơ dùng chung mọi vai trò — Biểu mẫu có thể ghép tự động khi mở.',
          'Shared across all roles — Forms can merge this when opening.',
        )}
      </p>
      <div className="teacher-form">
        {(
          [
            ['fullName', 'Họ và tên', 'Full name'],
            ['title', 'Chức danh', 'Job title'],
            ['org', 'Đơn vị / trường', 'Organization'],
            ['phone', 'Điện thoại', 'Phone'],
            ['email', 'Email', 'Email'],
            ['address', 'Địa chỉ', 'Address'],
          ] as const
        ).map(([key, viLabel, enLabel]) => (
          <label key={key} className={key === 'address' ? 'teacher-form-wide' : undefined}>
            <span>{vi ? viLabel : enLabel}</span>
            <input value={profile[key]} onChange={(e) => setField(key, e.target.value)} />
          </label>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          writePersonal(profile)
          setSaved(true)
        }}
      >
        {label('Lưu hồ sơ', 'Save profile')}
      </button>
      {saved ? <p className="teacher-hint">{label('Đã lưu.', 'Saved.')}</p> : null}
    </>
  )
}

function EventsPane({ practiceId, vi }: { practiceId: PracticeId; vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbEventItem[]>(() => readEvents(practiceId))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('')
  const [title, setTitle] = useState('')
  const [place, setPlace] = useState('')

  useEffect(() => {
    setItems(readEvents(practiceId))
    setEditingId(null)
    setTitle('')
    setTime('')
    setPlace('')
  }, [practiceId])

  const persist = (next: WbEventItem[]) => {
    setItems(next)
    writeEvents(practiceId, next)
  }

  const clearForm = () => {
    setEditingId(null)
    setTitle('')
    setTime('')
    setPlace('')
    setDate(new Date().toISOString().slice(0, 10))
  }

  const startEdit = (it: WbEventItem) => {
    setEditingId(it.id)
    setDate(it.date)
    setTime(it.time ?? '')
    setTitle(it.title)
    setPlace(it.place ?? '')
  }

  const save = () => {
    const t = title.trim()
    if (!t || !date) return
    const row: WbEventItem = {
      id: editingId ?? newId(),
      date,
      title: t,
      ...(time.trim() ? { time: time.trim() } : {}),
      ...(place.trim() ? { place: place.trim() } : {}),
    }
    const sorted = (list: WbEventItem[]) =>
      [...list].sort((a, b) =>
        `${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`),
      )
    if (editingId) {
      persist(sorted(items.map((x) => (x.id === editingId ? row : x))))
    } else {
      persist(sorted([row, ...items]))
    }
    clearForm()
  }

  const remove = (id: string) => {
    if (editingId === id) clearForm()
    persist(items.filter((x) => x.id !== id))
  }

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Sự kiện theo vai trò (họp, hội thảo, deadline công khai) — khác Lịch mốc hạn nội bộ.',
          'Role events (meetings, talks) — distinct from internal Calendar deadlines.',
        )}
      </p>
      <div className="wb-module-form">
        <label>
          <span>{label('Ngày', 'Date')}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          <span>{label('Giờ', 'Time')}</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <label className="teacher-form-wide">
          <span>{label('Tên sự kiện', 'Event title')}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={label('VD: Họp phụ huynh khối 6', 'e.g. Grade 6 parent meeting')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
            }}
          />
        </label>
        <label className="teacher-form-wide">
          <span>{label('Địa điểm (tuỳ chọn)', 'Place (optional)')}</span>
          <input value={place} onChange={(e) => setPlace(e.target.value)} />
        </label>
        <div className="teacher-chip-row">
          <button type="button" className="btn btn-primary" onClick={save}>
            {editingId ? label('Lưu sự kiện', 'Save event') : label('Thêm sự kiện', 'Add event')}
          </button>
          {editingId ? (
            <button type="button" className="btn btn-secondary" onClick={clearForm}>
              {label('Huỷ sửa', 'Cancel edit')}
            </button>
          ) : null}
        </div>
      </div>
      <ul className="wb-module-list">
        {items.length === 0 ? (
          <li className="teacher-empty">{label('Chưa có sự kiện.', 'No events yet.')}</li>
        ) : (
          items.map((it) => (
            <li key={it.id} className="wb-module-row">
              <div className="wb-module-meta">
                <strong>
                  {it.date}
                  {it.time ? ` · ${it.time}` : ''}
                </strong>
                <span>{it.title}</span>
                {it.place ? <span>{it.place}</span> : null}
              </div>
              <WbRowActions>
                <WbEditBtn label={label('Sửa', 'Edit')} onClick={() => startEdit(it)} />
                <WbDeleteBtn label={label('Xóa', 'Delete')} onClick={() => remove(it.id)} />
              </WbRowActions>
            </li>
          ))
        )}
      </ul>
    </>
  )
}

function GrowthPane({ vi }: { vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbGrowthItem[]>(() => readGrowth())
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')

  const persist = (next: WbGrowthItem[]) => {
    setItems(next)
    writeGrowth(next)
  }

  const add = () => {
    const t = title.trim()
    if (!t) return
    persist([
      {
        id: newId(),
        title: t,
        progress: 0,
        done: false,
        ...(note.trim() ? { note: note.trim() } : {}),
      },
      ...items,
    ])
    setTitle('')
    setNote('')
  }

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Mục tiêu phát triển bản thân (học kỹ năng, đọc sách, chứng chỉ…) — theo dõi tiến độ trên máy.',
          'Self-growth goals (skills, reading, certs…) — track progress on device.',
        )}
      </p>
      <div className="wb-module-form">
        <label className="teacher-form-wide">
          <span>{label('Mục tiêu', 'Goal')}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={label('VD: Học tiếng Anh B1', 'e.g. Reach English B1')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add()
            }}
          />
        </label>
        <label className="teacher-form-wide">
          <span>{label('Ghi chú (tuỳ chọn)', 'Note (optional)')}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="button" className="btn btn-primary" onClick={add}>
          {label('Thêm mục tiêu', 'Add goal')}
        </button>
      </div>
      <ul className="wb-module-list">
        {items.length === 0 ? (
          <li className="teacher-empty">{label('Chưa có mục tiêu.', 'No goals yet.')}</li>
        ) : (
          items.map((it) => (
            <li key={it.id} className={`wb-module-row${it.done ? ' is-done' : ''}`}>
              <div className="wb-growth-main">
                <label className="wb-task-check">
                  <input
                    type="checkbox"
                    checked={it.done}
                    onChange={() =>
                      persist(
                        items.map((x) =>
                          x.id === it.id ? { ...x, done: !x.done, progress: !x.done ? 100 : x.progress } : x,
                        ),
                      )
                    }
                  />
                  <span>{it.title}</span>
                </label>
                {it.note ? <span className="teacher-hint">{it.note}</span> : null}
                <label className="wb-growth-progress">
                  <span>
                    {label('Tiến độ', 'Progress')}: {it.progress}%
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={it.progress}
                    onChange={(e) => {
                      const progress = Number(e.target.value)
                      persist(
                        items.map((x) =>
                          x.id === it.id ? { ...x, progress, done: progress >= 100 } : x,
                        ),
                      )
                    }}
                  />
                </label>
              </div>
              <WbRowActions>
                <WbDeleteBtn
                  label={label('Xóa', 'Delete')}
                  onClick={() => persist(items.filter((x) => x.id !== it.id))}
                />
              </WbRowActions>
            </li>
          ))
        )}
      </ul>
    </>
  )
}

function TravelPane({
  vi,
  packId,
  onPackLinked,
}: {
  vi: boolean
  packId?: string | null
  onPackLinked?: () => void
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbTravelTrip[]>(() => readTravel())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<WbTravelTrip['status']>('planning')
  const [note, setNote] = useState('')
  const [checkDraft, setCheckDraft] = useState('')

  const persist = (next: WbTravelTrip[]) => {
    setItems(next)
    writeTravel(next)
  }

  const statusLabel = (s: WbTravelTrip['status']) => {
    switch (s) {
      case 'planning':
        return label('Đang chuẩn bị', 'Planning')
      case 'booked':
        return label('Đã đặt', 'Booked')
      case 'ongoing':
        return label('Đang đi', 'On trip')
      default:
        return label('Đã xong', 'Done')
    }
  }

  const add = () => {
    const t = title.trim()
    const dest = destination.trim()
    if (!t || !dest) return
    const trip: WbTravelTrip = {
      id: newId(),
      title: t,
      destination: dest,
      status,
      checklist: defaultTravelChecklist(vi),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(packId ? { linkedProjectId: packId } : {}),
    }
    persist([trip, ...items])
    setExpandedId(trip.id)
    setTitle('')
    setDestination('')
    setStartDate('')
    setEndDate('')
    setNote('')
    setStatus('planning')
  }

  const updateTrip = (id: string, patch: Partial<WbTravelTrip>) => {
    persist(items.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

  const toggleCheck = (tripId: string, checkId: string) => {
    persist(
      items.map((t) =>
        t.id !== tripId
          ? t
          : {
              ...t,
              checklist: t.checklist.map((c) =>
                c.id === checkId ? { ...c, done: !c.done } : c,
              ),
            },
      ),
    )
  }

  const addCheck = (tripId: string) => {
    const text = checkDraft.trim()
    if (!text) return
    persist(
      items.map((t) =>
        t.id !== tripId
          ? t
          : {
              ...t,
              checklist: [...t.checklist, { id: newId(), text, done: false }],
            },
      ),
    )
    setCheckDraft('')
  }

  const openItineraryDoc = async (trip: WbTravelTrip) => {
    const targetPack = packId ?? trip.linkedProjectId
    const checks = trip.checklist
      .map((c) => `<li>${c.done ? '☑' : '☐'} ${escapeHtml(c.text)}</li>`)
      .join('')
    const html = `
      <h1>${escapeHtml(trip.title)}</h1>
      <p><em>${label('Hành trình du lịch', 'Travel itinerary')}</em></p>
      <p><strong>${label('Điểm đến', 'Destination')}:</strong> ${escapeHtml(trip.destination)}</p>
      <p><strong>${label('Thời gian', 'Dates')}:</strong> ${escapeHtml(trip.startDate ?? '…')} → ${escapeHtml(trip.endDate ?? '…')}</p>
      <p><strong>${label('Trạng thái', 'Status')}:</strong> ${escapeHtml(statusLabel(trip.status))}</p>
      ${trip.note ? `<p><em>${escapeHtml(trip.note)}</em></p>` : ''}
      <h2>${label('Checklist chuẩn bị', 'Prep checklist')}</h2>
      <ul>${checks || '<li></li>'}</ul>
      <h2>${label('Lịch trình / nhật ký', 'Itinerary / journal')}</h2>
      ${trip.itinerary ? `<p>${escapeHtml(trip.itinerary).replace(/\n/g, '<br/>')}</p>` : '<p></p>'}
      <h2>${label('Ngày 1', 'Day 1')}</h2>
      <ul><li></li><li></li></ul>
      <h2>${label('Ngày 2', 'Day 2')}</h2>
      <ul><li></li><li></li></ul>
    `.trim()
    await window.aiOffice.newDoc({
      ...(targetPack ? { projectId: targetPack } : {}),
      aiContent: { title: trip.title, html },
    })
    if (targetPack && trip.linkedProjectId !== targetPack) {
      updateTrip(trip.id, { linkedProjectId: targetPack })
    }
    onPackLinked?.()
  }

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Quản lý chuyến đi offline: checklist chuẩn bị, lưu hành trình, soạn Docs (gắn gói Tài liệu nếu đã chọn).',
          'Manage trips offline: prep checklist, save itineraries, draft Docs (links to Materials pack when selected).',
        )}
      </p>
      <div className="wb-module-form">
        <label className="teacher-form-wide">
          <span>{label('Tên chuyến', 'Trip name')}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={label('VD: Đà Lạt 3N2Đ', 'e.g. Da Lat weekend')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add()
            }}
          />
        </label>
        <label>
          <span>{label('Điểm đến', 'Destination')}</span>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={label('VD: Đà Lạt', 'e.g. Da Lat')}
          />
        </label>
        <label>
          <span>{label('Trạng thái', 'Status')}</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as WbTravelTrip['status'])}
          >
            <option value="planning">{label('Đang chuẩn bị', 'Planning')}</option>
            <option value="booked">{label('Đã đặt', 'Booked')}</option>
            <option value="ongoing">{label('Đang đi', 'On trip')}</option>
            <option value="done">{label('Đã xong', 'Done')}</option>
          </select>
        </label>
        <label>
          <span>{label('Bắt đầu', 'Start')}</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          <span>{label('Kết thúc', 'End')}</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <label className="teacher-form-wide">
          <span>{label('Ghi chú', 'Note')}</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={label('Bạn bè đi cùng / ngân sách…', 'Companions / budget…')}
          />
        </label>
        <button type="button" className="btn btn-primary" onClick={add}>
          {label('Thêm chuyến đi', 'Add trip')}
        </button>
      </div>
      <ul className="wb-module-list">
        {items.length === 0 ? (
          <li className="teacher-empty">{label('Chưa có chuyến đi.', 'No trips yet.')}</li>
        ) : (
          items.map((it) => {
            const doneN = it.checklist.filter((c) => c.done).length
            const open = expandedId === it.id
            return (
              <li key={it.id} className="wb-module-row wb-travel-row">
                <div className="wb-module-meta">
                  <strong>
                    {it.title} · {statusLabel(it.status)}
                  </strong>
                  <span>
                    {[
                      it.destination,
                      it.startDate && it.endDate
                        ? `${it.startDate} → ${it.endDate}`
                        : it.startDate || it.endDate,
                      `${doneN}/${it.checklist.length} ${label('chuẩn bị', 'prep')}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  {it.note ? <span>{it.note}</span> : null}
                </div>
                <WbRowActions>
                  <WbExpandBtn
                    label={open ? label('Thu gọn', 'Collapse') : label('Chi tiết', 'Details')}
                    open={open}
                    onClick={() => setExpandedId(open ? null : it.id)}
                  />
                  <WbDraftBtn
                    label={label('Soạn hành trình', 'Draft itinerary')}
                    onClick={() => void openItineraryDoc(it)}
                  />
                  <WbDeleteBtn
                    label={label('Xóa', 'Delete')}
                    onClick={() => {
                      persist(items.filter((x) => x.id !== it.id))
                      if (expandedId === it.id) setExpandedId(null)
                    }}
                  />
                </WbRowActions>
                {open ? (
                  <div className="wb-travel-detail">
                    <label>
                      <span>{label('Trạng thái', 'Status')}</span>
                      <select
                        value={it.status}
                        onChange={(e) =>
                          updateTrip(it.id, { status: e.target.value as WbTravelTrip['status'] })
                        }
                      >
                        <option value="planning">{label('Đang chuẩn bị', 'Planning')}</option>
                        <option value="booked">{label('Đã đặt', 'Booked')}</option>
                        <option value="ongoing">{label('Đang đi', 'On trip')}</option>
                        <option value="done">{label('Đã xong', 'Done')}</option>
                      </select>
                    </label>
                    <h4>{label('Checklist chuẩn bị', 'Prep checklist')}</h4>
                    <ul className="wb-travel-checks">
                      {it.checklist.map((c) => (
                        <li key={c.id} className={c.done ? 'is-done' : ''}>
                          <label className="wb-task-check">
                            <input
                              type="checkbox"
                              checked={c.done}
                              onChange={() => toggleCheck(it.id, c.id)}
                            />
                            <span>{c.text}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                    <div className="wb-module-form wb-travel-check-add">
                      <label className="teacher-form-wide">
                        <span>{label('Thêm việc chuẩn bị', 'Add prep item')}</span>
                        <input
                          value={expandedId === it.id ? checkDraft : ''}
                          onChange={(e) => setCheckDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addCheck(it.id)
                          }}
                          placeholder={label('VD: Đặt xe sân bay', 'e.g. Airport transfer')}
                        />
                      </label>
                      <button type="button" className="btn btn-secondary" onClick={() => addCheck(it.id)}>
                        {label('Thêm', 'Add')}
                      </button>
                    </div>
                    <label className="teacher-form-wide">
                      <span>{label('Hành trình / nhật ký', 'Itinerary / journal')}</span>
                      <textarea
                        rows={4}
                        value={it.itinerary ?? ''}
                        onChange={(e) => updateTrip(it.id, { itinerary: e.target.value })}
                        placeholder={label(
                          'Ngày 1: …\nNgày 2: …\nGhi chú địa điểm, đặt bàn…',
                          'Day 1: …\nDay 2: …\nPlaces, reservations…',
                        )}
                      />
                    </label>
                  </div>
                ) : null}
              </li>
            )
          })
        )}
      </ul>
    </>
  )
}

function ClientsPane({ practiceId, vi }: { practiceId: PracticeId; vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbClientItem[]>(() => readClients(practiceId))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    setItems(readClients(practiceId))
    setEditingId(null)
    setComposing(false)
  }, [practiceId])

  const persist = (next: WbClientItem[]) => {
    setItems(next)
    writeClients(practiceId, next)
  }

  const clearForm = () => {
    setEditingId(null)
    setComposing(false)
    setName('')
    setContact('')
    setPhone('')
    setEmail('')
    setNote('')
  }

  const startEdit = (it: WbClientItem) => {
    setEditingId(it.id)
    setComposing(true)
    setName(it.name)
    setContact(it.contact ?? '')
    setPhone(it.phone ?? '')
    setEmail(it.email ?? '')
    setNote(it.note ?? '')
  }

  const save = () => {
    const n = name.trim()
    if (!n) return
    const row: WbClientItem = {
      id: editingId ?? newId(),
      name: n,
      ...(contact.trim() ? { contact: contact.trim() } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    }
    if (editingId) {
      persist(items.map((x) => (x.id === editingId ? row : x)))
    } else {
      persist([row, ...items])
    }
    clearForm()
  }

  const composeEmail = (it: WbClientItem) => {
    pinModule(practiceId, 'email')
    window.dispatchEvent(new Event('uniwork:wb-pins-changed'))
    createEmailDraft(practiceId, {
      to: it.email || undefined,
      subject: label(`Liên hệ ${it.name}`, `Contact ${it.name}`),
      body: label(
        `Xin chào${it.contact ? ` ${it.contact}` : ''},\n\n`,
        `Hello${it.contact ? ` ${it.contact}` : ''},\n\n`,
      ),
    })
    window.dispatchEvent(
      new CustomEvent('uniwork:wb-open-module', { detail: { moduleId: 'email' } }),
    )
  }

  const showForm = composing || Boolean(editingId)

  return (
    <>
      <div className="wb-db-toolbar">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            clearForm()
            setComposing(true)
          }}
        >
          {label('Thêm khách hàng', 'New client')}
        </button>
      </div>
      {showForm ? (
      <div className="wb-module-form wb-composer-panel">
        <label>
          <span>{label('Tên KH / tổ chức', 'Client / org')}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={label('VD: Công ty ABC', 'e.g. ABC Co.')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
            }}
            autoFocus
          />
        </label>
        <label>
          <span>{label('Người liên hệ', 'Contact person')}</span>
          <input value={contact} onChange={(e) => setContact(e.target.value)} />
        </label>
        <label>
          <span>{label('Điện thoại', 'Phone')}</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          <span>Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="teacher-form-wide">
          <span>{label('Ghi chú', 'Note')}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="teacher-chip-row">
          <button type="button" className="btn btn-primary" onClick={save}>
            {editingId
              ? label('Lưu khách hàng', 'Save client')
              : label('Thêm khách hàng', 'Add client')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={clearForm}>
            {label('Huỷ', 'Cancel')}
          </button>
        </div>
      </div>
      ) : null}
      <ul className="wb-module-list">
        {items.length === 0 ? (
          <li className="teacher-empty">{label('Chưa có khách hàng.', 'No clients yet.')}</li>
        ) : (
          items.map((it) => (
            <li key={it.id} className="wb-module-row">
              <div className="wb-module-meta">
                <strong>{it.name}</strong>
                <span>
                  {[it.contact, it.phone, it.email].filter(Boolean).join(' · ')}
                </span>
                {it.note ? <span>{it.note}</span> : null}
              </div>
              <WbRowActions>
                <WbEditBtn label={label('Sửa', 'Edit')} onClick={() => startEdit(it)} />
                <WbMailBtn
                  label={label('Soạn email', 'Draft email')}
                  onClick={() => composeEmail(it)}
                />
                <WbDeleteBtn
                  label={label('Xóa', 'Delete')}
                  onClick={() => persist(items.filter((x) => x.id !== it.id))}
                />
              </WbRowActions>
            </li>
          ))
        )}
      </ul>
    </>
  )
}

function StudentsPane({ practiceId, vi }: { practiceId: PracticeId; vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbStudentItem[]>(() => readStudents(practiceId))
  const [parents, setParents] = useState<WbParentItem[]>(() => readParents(practiceId))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importText, setImportText] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [name, setName] = useState('')
  const [className, setClassName] = useState('')
  const [parentId, setParentId] = useState('')
  const [parentName, setParentName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [followUp, setFollowUp] = useState(false)

  useEffect(() => {
    setItems(readStudents(practiceId))
    setParents(readParents(practiceId))
    setEditingId(null)
    setComposing(false)
    setImporting(false)
    setClassFilter('')
  }, [practiceId])

  const classes = useMemo(() => listStudentClasses(items), [items])

  const filtered = useMemo(() => {
    if (!classFilter) return items
    return items.filter((s) => (s.className ?? '') === classFilter)
  }, [items, classFilter])

  const persistBoth = (nextStudents: WbStudentItem[], nextParents: WbParentItem[]) => {
    const synced = syncStudentParentDenorm(nextStudents, nextParents)
    setItems(synced.students)
    setParents(synced.parents)
    writeStudents(practiceId, synced.students)
    writeParents(practiceId, synced.parents)
  }

  const clearForm = () => {
    setEditingId(null)
    setComposing(false)
    setName('')
    setClassName('')
    setParentId('')
    setParentName('')
    setPhone('')
    setEmail('')
    setNote('')
    setFollowUp(false)
  }

  const startEdit = (it: WbStudentItem) => {
    setEditingId(it.id)
    setComposing(true)
    setImporting(false)
    setName(it.name)
    setClassName(it.className ?? '')
    setParentId(it.parentId ?? '')
    setParentName(it.parentName ?? '')
    setPhone(it.phone ?? '')
    setEmail(it.email ?? '')
    setNote(it.note ?? '')
    setFollowUp(Boolean(it.followUp))
  }

  const save = () => {
    const n = name.trim()
    if (!n) return
    const id = editingId ?? newId()
    let nextParents = parents
    let resolvedParentId = parentId.trim() || null
    if (!resolvedParentId && parentName.trim()) {
      const ensured = ensureParentByName(nextParents, parentName.trim())
      nextParents = ensured.parents
      resolvedParentId = ensured.parent.id
    }
    const base: WbStudentItem = {
      id,
      name: n,
      ...(className.trim() ? { className: className.trim() } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(followUp ? { followUp: true } : {}),
    }
    const without = items.filter((x) => x.id !== id)
    const nextStudents = [base, ...without]
    const linked = linkStudentParent(nextStudents, nextParents, id, resolvedParentId)
    persistBoth(linked.students, linked.parents)
    clearForm()
  }

  const toggleFollowUp = (id: string) => {
    persistBoth(
      items.map((x) => {
        if (x.id !== id) return x
        if (x.followUp) {
          const row = { ...x }
          delete row.followUp
          return row
        }
        return { ...x, followUp: true }
      }),
      parents,
    )
  }

  const remove = (id: string) => {
    const linked = linkStudentParent(items, parents, id, null)
    persistBoth(
      linked.students.filter((x) => x.id !== id),
      linked.parents,
    )
    if (editingId === id) clearForm()
  }

  const runImport = () => {
    const rows = parseRosterImport(importText)
    if (rows.length === 0) return
    const result = applyRosterImport(items, parents, rows)
    persistBoth(result.students, result.parents)
    setImportText('')
    setImporting(false)
  }

  const composeEmail = (it: WbStudentItem) => {
    const parent = it.parentId ? parents.find((p) => p.id === it.parentId) : undefined
    pinModule(practiceId, 'email')
    window.dispatchEvent(new Event('uniwork:wb-pins-changed'))
    createEmailDraft(practiceId, {
      to: parent?.email || it.email || undefined,
      subject: label(`Về học sinh ${it.name}`, `About student ${it.name}`),
      body: label(
        `Xin chào${it.parentName ? ` ${it.parentName}` : ''},\n\n`,
        `Hello${it.parentName ? ` ${it.parentName}` : ''},\n\n`,
      ),
    })
    window.dispatchEvent(
      new CustomEvent('uniwork:wb-open-module', { detail: { moduleId: 'email' } }),
    )
  }

  const openParents = () => {
    pinModule(practiceId, 'parents')
    window.dispatchEvent(new Event('uniwork:wb-pins-changed'))
    window.dispatchEvent(
      new CustomEvent('uniwork:wb-open-module', { detail: { moduleId: 'parents' } }),
    )
  }

  const showForm = composing || Boolean(editingId)

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Lọc theo lớp · liên kết cứng với Phụ huynh · dán danh sách (CSV/TSV: tên, lớp, PH, SĐT, email).',
          'Filter by class · hard-link to Parents · paste roster (CSV/TSV: name, class, parent, phone, email).',
        )}
      </p>
      <div className="wb-db-toolbar">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            clearForm()
            setImporting(false)
            setComposing(true)
          }}
        >
          {label('Thêm học sinh', 'New student')}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            clearForm()
            setImporting((v) => !v)
          }}
        >
          {label('Nhập danh sách', 'Import roster')}
        </button>
        {classes.length > 0 ? (
          <label className="wb-roster-filter">
            <span className="sr-only">{label('Lọc lớp', 'Filter class')}</span>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="">{label('Tất cả lớp', 'All classes')}</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <span className="teacher-count">
          {filtered.length}
          {classFilter ? ` / ${items.length}` : ''}
        </span>
      </div>
      {importing ? (
        <div className="wb-module-form wb-composer-panel">
          <label className="teacher-form-wide">
            <span>{label('Dán danh sách', 'Paste roster')}</span>
            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={label(
                'Nguyễn Văn An, 10A1, Trần Thị Bình, 09…, a@…\n…',
                'Alex Nguyen, 10A, Jane Doe, 09…, a@…\n…',
              )}
            />
          </label>
          <div className="teacher-chip-row">
            <button type="button" className="btn btn-primary" onClick={runImport}>
              {label('Nhập', 'Import')}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setImporting(false)
                setImportText('')
              }}
            >
              {label('Huỷ', 'Cancel')}
            </button>
          </div>
        </div>
      ) : null}
      {showForm ? (
        <div className="wb-module-form wb-composer-panel">
          <label>
            <span>{label('Họ tên học sinh', 'Student name')}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={label('VD: Nguyễn Văn An', 'e.g. Alex Nguyen')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save()
              }}
              autoFocus
            />
          </label>
          <label>
            <span>{label('Lớp', 'Class')}</span>
            <input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder={label('VD: 10A1', 'e.g. 10A')}
              list="wb-student-classes"
            />
            <datalist id="wb-student-classes">
              {classes.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label>
            <span>{label('Phụ huynh (danh sách)', 'Parent (roster)')}</span>
            <select
              value={parentId}
              onChange={(e) => {
                setParentId(e.target.value)
                if (e.target.value) setParentName('')
              }}
            >
              <option value="">{label('— Chưa liên kết —', '— Unlinked —')}</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {!parentId ? (
            <label>
              <span>{label('Hoặc tên PH mới', 'Or new parent name')}</span>
              <input
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder={label('Tạo & liên kết PH mới', 'Create & link new parent')}
              />
            </label>
          ) : null}
          <label>
            <span>{label('Điện thoại', 'Phone')}</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label>
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="teacher-form-wide">
            <span>{label('Ghi chú', 'Note')}</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <label className="wb-cal-link-pack">
            <input
              type="checkbox"
              checked={followUp}
              onChange={(e) => setFollowUp(e.target.checked)}
            />
            <span>{label('Cần follow-up (hiện trên Desk)', 'Needs follow-up (show on Desk)')}</span>
          </label>
          <div className="teacher-chip-row">
            <button type="button" className="btn btn-primary" onClick={save}>
              {editingId
                ? label('Lưu học sinh', 'Save student')
                : label('Thêm học sinh', 'Add student')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={clearForm}>
              {label('Huỷ', 'Cancel')}
            </button>
          </div>
        </div>
      ) : null}
      <ul className="wb-module-list">
        {filtered.length === 0 ? (
          <li className="teacher-empty">
            {items.length === 0
              ? label('Chưa có học sinh.', 'No students yet.')
              : label('Không có học sinh lớp này.', 'No students in this class.')}
          </li>
        ) : (
          filtered.map((it) => (
            <li key={it.id} className={`wb-module-row${it.followUp ? ' is-followup' : ''}`}>
              <div className="wb-module-meta">
                <strong>
                  {it.name}
                  {it.followUp ? (
                    <em className="wb-followup-tag"> {label('· follow-up', '· follow-up')}</em>
                  ) : null}
                </strong>
                <span>
                  {[it.className, it.phone, it.email].filter(Boolean).join(' · ')}
                </span>
                {it.parentName ? (
                  <span>
                    {label('PH:', 'Parent:')}{' '}
                    <button type="button" className="wb-inline-link" onClick={openParents}>
                      {it.parentName}
                    </button>
                    {it.parentId ? null : (
                      <em className="wb-soft-link">
                        {' '}
                        ({label('chưa liên kết id', 'soft name only')})
                      </em>
                    )}
                  </span>
                ) : null}
                {it.note ? <span>{it.note}</span> : null}
              </div>
              <WbRowActions>
                <button
                  type="button"
                  className={`btn btn-secondary${it.followUp ? ' is-active' : ''}`}
                  title={label('Bật/tắt follow-up', 'Toggle follow-up')}
                  onClick={() => toggleFollowUp(it.id)}
                >
                  {it.followUp ? '★' : '☆'}
                </button>
                <WbEditBtn label={label('Sửa', 'Edit')} onClick={() => startEdit(it)} />
                <WbMailBtn
                  label={label('Soạn email', 'Draft email')}
                  onClick={() => composeEmail(it)}
                />
                <WbDeleteBtn label={label('Xóa', 'Delete')} onClick={() => remove(it.id)} />
              </WbRowActions>
            </li>
          ))
        )}
      </ul>
    </>
  )
}

function ParentsPane({ practiceId, vi }: { practiceId: PracticeId; vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbParentItem[]>(() => readParents(practiceId))
  const [students, setStudents] = useState<WbStudentItem[]>(() => readStudents(practiceId))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)
  const [name, setName] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    setItems(readParents(practiceId))
    setStudents(readStudents(practiceId))
    setEditingId(null)
    setComposing(false)
  }, [practiceId])

  const persistBoth = (nextStudents: WbStudentItem[], nextParents: WbParentItem[]) => {
    const synced = syncStudentParentDenorm(nextStudents, nextParents)
    setStudents(synced.students)
    setItems(synced.parents)
    writeStudents(practiceId, synced.students)
    writeParents(practiceId, synced.parents)
  }

  const clearForm = () => {
    setEditingId(null)
    setComposing(false)
    setName('')
    setSelectedStudentIds([])
    setPhone('')
    setEmail('')
    setNote('')
  }

  const startEdit = (it: WbParentItem) => {
    setEditingId(it.id)
    setComposing(true)
    setName(it.name)
    setSelectedStudentIds(it.studentIds ?? [])
    setPhone(it.phone ?? '')
    setEmail(it.email ?? '')
    setNote(it.note ?? '')
  }

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const save = () => {
    const n = name.trim()
    if (!n) return
    const id = editingId ?? newId()
    const row: WbParentItem = {
      id,
      name: n,
      ...(selectedStudentIds.length ? { studentIds: selectedStudentIds } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    }
    let nextParents = editingId
      ? items.map((x) => (x.id === editingId ? row : x))
      : [row, ...items]

    // Relink: clear this parent's previous students, then attach selected.
    let nextStudents = students.map((s) => {
      if (s.parentId === id && !selectedStudentIds.includes(s.id)) {
        const copy = { ...s }
        delete copy.parentId
        delete copy.parentName
        return copy
      }
      return s
    })
    for (const sid of selectedStudentIds) {
      const linked = linkStudentParent(nextStudents, nextParents, sid, id)
      nextStudents = linked.students
      nextParents = linked.parents
    }
    persistBoth(nextStudents, nextParents)
    clearForm()
  }

  const remove = (id: string) => {
    let nextStudents = students
    for (const s of students.filter((x) => x.parentId === id)) {
      const linked = linkStudentParent(nextStudents, items, s.id, null)
      nextStudents = linked.students
    }
    persistBoth(
      nextStudents,
      items.filter((x) => x.id !== id),
    )
    if (editingId === id) clearForm()
  }

  const composeEmail = (it: WbParentItem) => {
    pinModule(practiceId, 'email')
    window.dispatchEvent(new Event('uniwork:wb-pins-changed'))
    createEmailDraft(practiceId, {
      to: it.email || undefined,
      subject: label(
        it.studentName ? `Về học sinh ${it.studentName}` : `Liên hệ ${it.name}`,
        it.studentName ? `About ${it.studentName}` : `Contact ${it.name}`,
      ),
      body: label(`Xin chào ${it.name},\n\n`, `Hello ${it.name},\n\n`),
    })
    window.dispatchEvent(
      new CustomEvent('uniwork:wb-open-module', { detail: { moduleId: 'email' } }),
    )
  }

  const openStudents = () => {
    pinModule(practiceId, 'students')
    window.dispatchEvent(new Event('uniwork:wb-pins-changed'))
    window.dispatchEvent(
      new CustomEvent('uniwork:wb-open-module', { detail: { moduleId: 'students' } }),
    )
  }

  const showForm = composing || Boolean(editingId)

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Chọn học sinh để liên kết cứng (một PH có thể có nhiều HS).',
          'Pick students to hard-link (one parent may have many students).',
        )}
      </p>
      <div className="wb-db-toolbar">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            clearForm()
            setComposing(true)
          }}
        >
          {label('Thêm phụ huynh', 'New parent')}
        </button>
        <span className="teacher-count">{items.length}</span>
      </div>
      {showForm ? (
        <div className="wb-module-form wb-composer-panel">
          <label>
            <span>{label('Họ tên phụ huynh', 'Parent name')}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={label('VD: Trần Thị Bình', 'e.g. Jane Doe')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save()
              }}
              autoFocus
            />
          </label>
          <fieldset className="wb-roster-students teacher-form-wide">
            <legend>{label('Học sinh liên kết', 'Linked students')}</legend>
            {students.length === 0 ? (
              <p className="teacher-hint">
                {label('Chưa có học sinh — thêm ở tab Học sinh.', 'No students yet — add in Students.')}{' '}
                <button type="button" className="wb-inline-link" onClick={openStudents}>
                  {label('Mở Học sinh', 'Open Students')}
                </button>
              </p>
            ) : (
              <div className="wb-roster-checkgrid">
                {students.map((s) => (
                  <label key={s.id} className="wb-roster-check">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                    />
                    <span>
                      {s.name}
                      {s.className ? ` · ${s.className}` : ''}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <label>
            <span>{label('Điện thoại', 'Phone')}</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label>
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="teacher-form-wide">
            <span>{label('Ghi chú', 'Note')}</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="teacher-chip-row">
            <button type="button" className="btn btn-primary" onClick={save}>
              {editingId
                ? label('Lưu phụ huynh', 'Save parent')
                : label('Thêm phụ huynh', 'Add parent')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={clearForm}>
              {label('Huỷ', 'Cancel')}
            </button>
          </div>
        </div>
      ) : null}
      <ul className="wb-module-list">
        {items.length === 0 ? (
          <li className="teacher-empty">{label('Chưa có phụ huynh.', 'No parents yet.')}</li>
        ) : (
          items.map((it) => (
            <li key={it.id} className="wb-module-row">
              <div className="wb-module-meta">
                <strong>{it.name}</strong>
                <span>
                  {[
                    it.studentName
                      ? label(`HS: ${it.studentName}`, `Student: ${it.studentName}`)
                      : null,
                    it.phone,
                    it.email,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                {it.studentName ? (
                  <button type="button" className="wb-inline-link" onClick={openStudents}>
                    {label('Xem học sinh', 'View students')}
                  </button>
                ) : null}
                {it.note ? <span>{it.note}</span> : null}
              </div>
              <WbRowActions>
                <WbEditBtn label={label('Sửa', 'Edit')} onClick={() => startEdit(it)} />
                <WbMailBtn
                  label={label('Soạn email', 'Draft email')}
                  onClick={() => composeEmail(it)}
                />
                <WbDeleteBtn label={label('Xóa', 'Delete')} onClick={() => remove(it.id)} />
              </WbRowActions>
            </li>
          ))
        )}
      </ul>
    </>
  )
}

function ContractsPane({
  practiceId,
  vi,
  packId,
  onPackLinked,
}: {
  practiceId: PracticeId
  vi: boolean
  packId?: string | null
  onPackLinked?: () => void
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbContractItem[]>(() => readContracts(practiceId))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [party, setParty] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<WbContractItem['status']>('draft')
  const [note, setNote] = useState('')

  useEffect(() => {
    setItems(readContracts(practiceId))
    setEditingId(null)
  }, [practiceId])

  const persist = (next: WbContractItem[]) => {
    setItems(next)
    writeContracts(practiceId, next)
  }

  const statusLabel = (s: WbContractItem['status']) => {
    switch (s) {
      case 'draft':
        return label('Nháp', 'Draft')
      case 'active':
        return label('Hiệu lực', 'Active')
      case 'expired':
        return label('Hết hạn', 'Expired')
      default:
        return label('Khác', 'Other')
    }
  }

  const clearForm = () => {
    setEditingId(null)
    setTitle('')
    setParty('')
    setStartDate('')
    setEndDate('')
    setNote('')
    setStatus('draft')
  }

  const startEdit = (it: WbContractItem) => {
    setEditingId(it.id)
    setTitle(it.title)
    setParty(it.party ?? '')
    setStartDate(it.startDate ?? '')
    setEndDate(it.endDate ?? '')
    setStatus(it.status)
    setNote(it.note ?? '')
  }

  const save = () => {
    const t = title.trim()
    if (!t) return
    const existing = editingId ? items.find((x) => x.id === editingId) : undefined
    const row: WbContractItem = {
      id: editingId ?? newId(),
      title: t,
      status,
      ...(party.trim() ? { party: party.trim() } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(existing?.linkedProjectId
        ? { linkedProjectId: existing.linkedProjectId }
        : packId
          ? { linkedProjectId: packId }
          : {}),
    }
    if (editingId) {
      persist(items.map((x) => (x.id === editingId ? row : x)))
    } else {
      persist([row, ...items])
    }
    clearForm()
  }

  const openDraft = async (item: WbContractItem) => {
    const targetPack = packId ?? item.linkedProjectId
    if (!targetPack) return
    const html = `
      <h1>${escapeHtml(item.title)}</h1>
      <p><strong>${vi ? 'Bên liên quan' : 'Party'}:</strong> ${escapeHtml(item.party ?? '…')}</p>
      <p><strong>${vi ? 'Hiệu lực' : 'Term'}:</strong> ${escapeHtml(item.startDate ?? '…')} → ${escapeHtml(item.endDate ?? '…')}</p>
      <p><strong>${vi ? 'Trạng thái' : 'Status'}:</strong> ${escapeHtml(statusLabel(item.status))}</p>
      ${item.note ? `<p><em>${escapeHtml(item.note)}</em></p>` : ''}
      <h2>${vi ? 'Điều khoản chính' : 'Key terms'}</h2>
      <ol><li></li><li></li><li></li></ol>
    `.trim()
    await window.aiOffice.newDoc({
      projectId: targetPack,
      aiContent: { title: item.title, html },
    })
    if (!item.linkedProjectId || item.linkedProjectId !== targetPack) {
      persist(items.map((x) => (x.id === item.id ? { ...x, linkedProjectId: targetPack } : x)))
    }
    onPackLinked?.()
  }

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Theo dõi hợp đồng theo vai trò. Soạn Docs vào gói đang chọn — lưu file để thấy ở Tài liệu.',
          'Track contracts for this role. Draft Docs into the selected pack — save to appear under Materials.',
        )}
      </p>
      {!packId ? (
        <p className="teacher-hint">
          {label('Chọn gói ở Tri thức trước khi Soạn.', 'Select a Knowledge pack before drafting.')}
        </p>
      ) : null}
      <div className="wb-module-form">
        <label className="teacher-form-wide">
          <span>{label('Tên hợp đồng', 'Contract title')}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={label('VD: HĐ thuê văn phòng', 'e.g. Office lease')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
            }}
          />
        </label>
        <label>
          <span>{label('Bên / KH', 'Party / client')}</span>
          <input value={party} onChange={(e) => setParty(e.target.value)} />
        </label>
        <label>
          <span>{label('Trạng thái', 'Status')}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as WbContractItem['status'])}>
            <option value="draft">{label('Nháp', 'Draft')}</option>
            <option value="active">{label('Hiệu lực', 'Active')}</option>
            <option value="expired">{label('Hết hạn', 'Expired')}</option>
            <option value="other">{label('Khác', 'Other')}</option>
          </select>
        </label>
        <label>
          <span>{label('Bắt đầu', 'Start')}</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          <span>{label('Kết thúc', 'End')}</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <label className="teacher-form-wide">
          <span>{label('Ghi chú', 'Note')}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="teacher-chip-row">
          <button type="button" className="btn btn-primary" onClick={save}>
            {editingId ? label('Lưu hợp đồng', 'Save contract') : label('Thêm hợp đồng', 'Add contract')}
          </button>
          {editingId ? (
            <button type="button" className="btn btn-secondary" onClick={clearForm}>
              {label('Huỷ sửa', 'Cancel edit')}
            </button>
          ) : null}
        </div>
      </div>
      <ul className="wb-module-list">
        {items.length === 0 ? (
          <li className="teacher-empty">{label('Chưa có hợp đồng.', 'No contracts yet.')}</li>
        ) : (
          items.map((it) => {
            const canOpen = Boolean(packId ?? it.linkedProjectId)
            return (
              <li key={it.id} className="wb-module-row">
                <div className="wb-module-meta">
                  <strong>
                    {it.title} · {statusLabel(it.status)}
                  </strong>
                  <span>
                    {[it.party, it.startDate && it.endDate ? `${it.startDate} → ${it.endDate}` : it.endDate]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  {it.note ? <span>{it.note}</span> : null}
                  {it.linkedProjectId ? (
                    <span className="teacher-hint">
                      {label('Đã gắn gói Tài liệu', 'Linked to Materials pack')}
                    </span>
                  ) : null}
                </div>
                <WbRowActions>
                  <WbEditBtn label={label('Sửa', 'Edit')} onClick={() => startEdit(it)} />
                  <WbDraftBtn
                    label={label('Soạn', 'Draft')}
                    disabled={!canOpen}
                    title={
                      canOpen
                        ? label('Soạn', 'Draft')
                        : label('Chọn gói ở Tri thức trước', 'Select a Knowledge pack first')
                    }
                    onClick={() => void openDraft(it)}
                  />
                  <WbDeleteBtn
                    label={label('Xóa', 'Delete')}
                    onClick={() => {
                      if (editingId === it.id) clearForm()
                      persist(items.filter((x) => x.id !== it.id))
                    }}
                  />
                </WbRowActions>
              </li>
            )
          })
        )}
      </ul>
    </>
  )
}

function MattersPane({
  practiceId,
  vi,
  packId,
  onPackLinked,
}: {
  practiceId: PracticeId
  vi: boolean
  packId?: string | null
  onPackLinked?: () => void
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbMatterItem[]>(() => readMatters(practiceId))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [client, setClient] = useState('')
  const [matterType, setMatterType] = useState(vi ? 'Hợp đồng' : 'Contract')
  const [status, setStatus] = useState<WbMatterItem['status']>('open')
  const [nextDate, setNextDate] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    setItems(readMatters(practiceId))
    setEditingId(null)
  }, [practiceId])

  const persist = (next: WbMatterItem[]) => {
    setItems(next)
    writeMatters(practiceId, next)
  }

  const statusLabel = (s: WbMatterItem['status']) => {
    switch (s) {
      case 'open':
        return label('Đang xử lý', 'Open')
      case 'pending':
        return label('Chờ', 'Pending')
      default:
        return label('Đã đóng', 'Closed')
    }
  }

  const clearForm = () => {
    setEditingId(null)
    setTitle('')
    setClient('')
    setMatterType(vi ? 'Hợp đồng' : 'Contract')
    setNextDate('')
    setNote('')
    setStatus('open')
  }

  const startEdit = (it: WbMatterItem) => {
    setEditingId(it.id)
    setTitle(it.title)
    setClient(it.client ?? '')
    setMatterType(it.matterType ?? (vi ? 'Hợp đồng' : 'Contract'))
    setStatus(it.status)
    setNextDate(it.nextDate ?? '')
    setNote(it.note ?? '')
  }

  const save = () => {
    const t = title.trim()
    if (!t) return
    const existing = editingId ? items.find((x) => x.id === editingId) : undefined
    const row: WbMatterItem = {
      id: editingId ?? newId(),
      title: t,
      status,
      ...(client.trim() ? { client: client.trim() } : {}),
      ...(matterType.trim() ? { matterType: matterType.trim() } : {}),
      ...(nextDate ? { nextDate } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(existing?.linkedProjectId
        ? { linkedProjectId: existing.linkedProjectId }
        : packId
          ? { linkedProjectId: packId }
          : {}),
    }
    if (editingId) {
      persist(items.map((x) => (x.id === editingId ? row : x)))
    } else {
      persist([row, ...items])
    }
    clearForm()
  }

  const openBrief = async (item: WbMatterItem) => {
    const targetPack = packId ?? item.linkedProjectId
    if (!targetPack) return
    const html = `
      <h1>${escapeHtml(item.title)}</h1>
      <p><em>${vi ? 'Vụ việc pháp lý' : 'Legal matter'}</em></p>
      <p><strong>${vi ? 'Khách hàng' : 'Client'}:</strong> ${escapeHtml(item.client ?? '…')}</p>
      <p><strong>${vi ? 'Loại việc' : 'Type'}:</strong> ${escapeHtml(item.matterType ?? '…')}</p>
      <p><strong>${vi ? 'Trạng thái' : 'Status'}:</strong> ${escapeHtml(statusLabel(item.status))}</p>
      <p><strong>${vi ? 'Mốc tiếp theo' : 'Next date'}:</strong> ${escapeHtml(item.nextDate ?? '…')}</p>
      ${item.note ? `<p><em>${escapeHtml(item.note)}</em></p>` : ''}
      <h2>${vi ? 'Sự kiện / yêu cầu' : 'Facts / asks'}</h2>
      <ul><li></li><li></li></ul>
      <h2>${vi ? 'Điểm pháp lý' : 'Legal points'}</h2>
      <ul><li></li><li></li></ul>
      <h2>${vi ? 'Việc cần làm' : 'Next actions'}</h2>
      <ol><li></li><li></li></ol>
    `.trim()
    await window.aiOffice.newDoc({
      projectId: targetPack,
      aiContent: { title: item.title, html },
    })
    if (!item.linkedProjectId || item.linkedProjectId !== targetPack) {
      persist(items.map((x) => (x.id === item.id ? { ...x, linkedProjectId: targetPack } : x)))
    }
    onPackLinked?.()
  }

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Dành cho Luật sư / Pháp lý: theo dõi vụ việc. Tóm tắt Docs vào gói đang chọn — lưu file để thấy ở Tài liệu.',
          'For legal counsel: track matters. Brief Docs into the selected pack — save to appear under Materials.',
        )}
      </p>
      {!packId ? (
        <p className="teacher-hint">
          {label('Chọn gói ở Tri thức trước khi Soạn.', 'Select a Knowledge pack before drafting.')}
        </p>
      ) : null}
      <div className="wb-module-form">
        <label className="teacher-form-wide">
          <span>{label('Tên vụ / hồ sơ', 'Matter title')}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={label('VD: Tranh chấp HĐ mua bán', 'e.g. Sales contract dispute')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
            }}
          />
        </label>
        <label>
          <span>{label('Khách hàng', 'Client')}</span>
          <input value={client} onChange={(e) => setClient(e.target.value)} />
        </label>
        <label>
          <span>{label('Loại việc', 'Type')}</span>
          <select value={matterType} onChange={(e) => setMatterType(e.target.value)}>
            {(vi
              ? ['Hợp đồng', 'Tranh chấp', 'Tư vấn', 'Tuân thủ', 'SHTT', 'Khác']
              : ['Contract', 'Dispute', 'Advisory', 'Compliance', 'IP', 'Other']
            ).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{label('Trạng thái', 'Status')}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as WbMatterItem['status'])}>
            <option value="open">{label('Đang xử lý', 'Open')}</option>
            <option value="pending">{label('Chờ', 'Pending')}</option>
            <option value="closed">{label('Đã đóng', 'Closed')}</option>
          </select>
        </label>
        <label>
          <span>{label('Mốc tiếp theo', 'Next date')}</span>
          <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
        </label>
        <label className="teacher-form-wide">
          <span>{label('Ghi chú', 'Note')}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="teacher-chip-row">
          <button type="button" className="btn btn-primary" onClick={save}>
            {editingId ? label('Lưu vụ việc', 'Save matter') : label('Thêm vụ việc', 'Add matter')}
          </button>
          {editingId ? (
            <button type="button" className="btn btn-secondary" onClick={clearForm}>
              {label('Huỷ sửa', 'Cancel edit')}
            </button>
          ) : null}
        </div>
      </div>
      <ul className="wb-module-list">
        {items.length === 0 ? (
          <li className="teacher-empty">{label('Chưa có vụ việc.', 'No matters yet.')}</li>
        ) : (
          items.map((it) => {
            const canOpen = Boolean(packId ?? it.linkedProjectId)
            return (
              <li key={it.id} className="wb-module-row">
                <div className="wb-module-meta">
                  <strong>
                    {it.title} · {statusLabel(it.status)}
                  </strong>
                  <span>
                    {[it.client, it.matterType, it.nextDate ? `${label('Mốc', 'Next')}: ${it.nextDate}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  {it.note ? <span>{it.note}</span> : null}
                  {it.linkedProjectId ? (
                    <span className="teacher-hint">
                      {label('Đã gắn gói Tài liệu', 'Linked to Materials pack')}
                    </span>
                  ) : null}
                </div>
                <WbRowActions>
                  <WbEditBtn label={label('Sửa', 'Edit')} onClick={() => startEdit(it)} />
                  <WbDraftBtn
                    label={label('Tóm tắt', 'Brief')}
                    disabled={!canOpen}
                    title={
                      canOpen
                        ? label('Tóm tắt', 'Brief')
                        : label('Chọn gói ở Tri thức trước', 'Select a Knowledge pack first')
                    }
                    onClick={() => void openBrief(it)}
                  />
                  <WbDeleteBtn
                    label={label('Xóa', 'Delete')}
                    onClick={() => {
                      if (editingId === it.id) clearForm()
                      persist(items.filter((x) => x.id !== it.id))
                    }}
                  />
                </WbRowActions>
              </li>
            )
          })
        )}
      </ul>
    </>
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
