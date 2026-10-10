import { useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent as ReactDragEvent, ReactElement, ReactNode } from 'react'
import type { PracticeId } from '@uniwork/practice-core'
import {
  deletePmCard,
  deletePmConnection,
  deletePmDiaryEntry,
  deletePmDoc,
  deletePmInvestor,
  deletePmPayment,
  deletePmProject,
  formatPmConnectionSummary,
  readPmCards,
  readPmConnections,
  readPmDiary,
  readPmDocs,
  readPmInvestors,
  readPmPanel,
  readPmPayments,
  readPmProjects,
  readPmSelectedProjectId,
  readPmView,
  upsertPmCard,
  upsertPmConnection,
  upsertPmDiaryEntry,
  upsertPmDoc,
  upsertPmInvestor,
  upsertPmPayment,
  upsertPmProject,
  writePmPanel,
  writePmSelectedProjectId,
  writePmView,
  type PmCardStatus,
  type PmDbDriver,
  type PmPanelId,
  type PmPaymentStatus,
  type PmViewId,
  type WbPmCard,
  type WbPmDbConnection,
  type WbPmDiaryEntry,
  type WbPmDoc,
  type WbPmInvestor,
  type WbPmPayment,
  type WbPmProject,
} from './workbench-projects'
import { WbExcelExportBtn } from './WbExcelExportBtn'
import { WbDeleteBtn, WbFileBtn, WbRowActions } from './WbRowActions'
import {
  exportPmCardsCsv,
  exportPmDiaryCsv,
  exportPmDocsCsv,
  exportPmInvestorsCsv,
  exportPmPaymentsCsv,
} from './workbench-list-excel'

function todayIsoDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const STATUSES: { id: PmCardStatus; labelVi: string; labelEn: string }[] = [
  { id: 'backlog', labelVi: 'Backlog', labelEn: 'Backlog' },
  { id: 'todo', labelVi: 'Cần làm', labelEn: 'To do' },
  { id: 'doing', labelVi: 'Đang làm', labelEn: 'Doing' },
  { id: 'done', labelVi: 'Xong', labelEn: 'Done' },
]

const DRIVERS: { id: PmDbDriver; label: string }[] = [
  { id: 'sqlite', label: 'SQLite (file)' },
  { id: 'postgres', label: 'PostgreSQL' },
  { id: 'mysql', label: 'MySQL' },
]

function statusLabel(id: PmCardStatus, vi: boolean) {
  const s = STATUSES.find((x) => x.id === id)!
  return vi ? s.labelVi : s.labelEn
}

export function ProjectsPane({ practiceId, vi }: { practiceId: PracticeId; vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [projects, setProjects] = useState<WbPmProject[]>(() => readPmProjects(practiceId))
  const [connections, setConnections] = useState<WbPmDbConnection[]>(() => readPmConnections(practiceId))
  const [cards, setCards] = useState<WbPmCard[]>(() => readPmCards(practiceId))
  const [projectId, setProjectId] = useState<string | null>(() => {
    const saved = readPmSelectedProjectId(practiceId)
    const list = readPmProjects(practiceId)
    if (saved && list.some((p) => p.id === saved)) return saved
    return list[0]?.id ?? null
  })
  const [view, setView] = useState<PmViewId>(() => readPmView())
  const [panel, setPanel] = useState<PmPanelId>(() => readPmPanel())
  const [investors, setInvestors] = useState<WbPmInvestor[]>(() => readPmInvestors(practiceId))
  const [payments, setPayments] = useState<WbPmPayment[]>(() => readPmPayments(practiceId))
  const [diary, setDiary] = useState<WbPmDiaryEntry[]>(() => readPmDiary(practiceId))
  const [docs, setDocs] = useState<WbPmDoc[]>(() => readPmDocs(practiceId))
  const [draft, setDraft] = useState('')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<WbPmProject | null>(null)
  const [editingConn, setEditingConn] = useState<Partial<WbPmDbConnection> & { name?: string; driver?: PmDbDriver } | null>(
    null,
  )
  const fileRef = useRef<HTMLInputElement>(null)

  const reload = () => {
    setProjects(readPmProjects(practiceId))
    setConnections(readPmConnections(practiceId))
    setCards(readPmCards(practiceId))
    setInvestors(readPmInvestors(practiceId))
    setPayments(readPmPayments(practiceId))
    setDiary(readPmDiary(practiceId))
    setDocs(readPmDocs(practiceId))
  }

  useEffect(() => {
    reload()
    const saved = readPmSelectedProjectId(practiceId)
    const list = readPmProjects(practiceId)
    const next = saved && list.some((p) => p.id === saved) ? saved : list[0]?.id ?? null
    setProjectId(next)
    setSelectedCardId(null)
    setPanel(readPmPanel())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceId])

  const selectProject = (id: string | null) => {
    setProjectId(id)
    writePmSelectedProjectId(practiceId, id)
    setSelectedCardId(null)
  }

  const selectPanel = (id: PmPanelId) => {
    setPanel(id)
    writePmPanel(id)
  }

  const selectView = (id: PmViewId) => {
    setView(id)
    writePmView(id)
  }

  const projectInvestors = useMemo(
    () => investors.filter((x) => x.projectId === projectId),
    [investors, projectId],
  )
  const projectPayments = useMemo(
    () => payments.filter((x) => x.projectId === projectId),
    [payments, projectId],
  )
  const projectDiary = useMemo(
    () =>
      diary
        .filter((x) => x.projectId === projectId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [diary, projectId],
  )
  const projectDocs = useMemo(
    () => docs.filter((x) => x.projectId === projectId),
    [docs, projectId],
  )

  const project = projects.find((p) => p.id === projectId) ?? null
  const projectCards = useMemo(
    () =>
      cards
        .filter((c) => c.projectId === projectId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)),
    [cards, projectId],
  )
  const selectedCard = projectCards.find((c) => c.id === selectedCardId) ?? null
  const linkedConn = project?.connectionId
    ? connections.find((c) => c.id === project.connectionId) ?? null
    : null

  const addProject = () => {
    const name = window.prompt(label('Tên dự án', 'Project name'))?.trim()
    if (!name) return
    const p = upsertPmProject(practiceId, { name })
    reload()
    selectProject(p.id)
  }

  const addQuickCard = () => {
    if (!projectId || !draft.trim()) return
    const card = upsertPmCard(practiceId, { projectId, title: draft.trim(), status: 'todo' })
    setDraft('')
    reload()
    setSelectedCardId(card.id)
  }

  const saveConn = () => {
    if (!editingConn?.name?.trim() || !editingConn.driver) return
    upsertPmConnection(practiceId, {
      id: editingConn.id,
      name: editingConn.name,
      driver: editingConn.driver,
      sqlitePath: editingConn.sqlitePath,
      host: editingConn.host,
      port: editingConn.port,
      database: editingConn.database,
      username: editingConn.username,
      password: editingConn.password,
      notes: editingConn.notes,
    })
    setEditingConn(null)
    reload()
  }

  return (
    <div className="wb-pm">
      <header className="wb-tasks-hero">
        <div>
          <strong>{label('Quản lý dự án', 'Project management')}</strong>
          <p>
            {label(
              'Dự án trên máy local — kết nối database, xem List hoặc Kanban.',
              'Local projects — DB connections, list or kanban views.',
            )}
          </p>
        </div>
        <div className="wb-tasks-hero-stats" aria-hidden="true">
          <span>{projects.filter((p) => !p.archived).length}</span>
          <small>{label('dự án', 'projects')}</small>
        </div>
      </header>

      <div className="wb-pm-layout">
        <aside className="wb-pm-sidebar" aria-label={label('Dự án', 'Projects')}>
          <div className="wb-pm-sidebar-head">
            <span>{label('Dự án', 'Projects')}</span>
            <button type="button" className="btn btn-primary" onClick={addProject}>
              +
            </button>
          </div>
          <ul className="wb-pm-project-list">
            {projects.filter((p) => !p.archived).map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`wb-pm-project-item${p.id === projectId ? ' active' : ''}`}
                  onClick={() => {
                    selectProject(p.id)
                    selectPanel('board')
                  }}
                >
                  <strong>{p.name}</strong>
                  {p.connectionId ? (
                    <small>
                      {connections.find((c) => c.id === p.connectionId)?.name ??
                        label('Đã gắn DB', 'DB linked')}
                    </small>
                  ) : (
                    <small>{label('Chưa gắn DB', 'No DB')}</small>
                  )}
                </button>
              </li>
            ))}
            {projects.length === 0 ? (
              <li className="wb-pm-empty-side">{label('Chưa có dự án.', 'No projects yet.')}</li>
            ) : null}
          </ul>
          <button
            type="button"
            className={`wb-pm-conn-tab${panel === 'connections' ? ' active' : ''}`}
            onClick={() => selectPanel('connections')}
          >
            {label('Kết nối Database', 'Database connections')}
          </button>
        </aside>

        <div className="wb-pm-main">
          {panel === 'connections' ? (
            <ConnectionsPanel
              vi={vi}
              connections={connections}
              onAdd={() => setEditingConn({ name: '', driver: 'sqlite' })}
              onEdit={(c) => setEditingConn({ ...c })}
              onDelete={(id) => {
                if (
                  !window.confirm(
                    label('Xoá kết nối này? Dự án gắn sẽ bỏ liên kết.', 'Delete this connection? Linked projects will detach.'),
                  )
                )
                  return
                deletePmConnection(practiceId, id)
                reload()
              }}
            />
          ) : !project ? (
            <div className="wb-tasks-empty">
              <span aria-hidden="true">◫</span>
              <p>{label('Tạo dự án bên trái để bắt đầu.', 'Create a project on the left to start.')}</p>
            </div>
          ) : (
            <>
              <div className="wb-pm-project-bar">
                <div>
                  <h2 className="wb-pm-project-title">{project.name}</h2>
                  <p className="wb-pm-project-meta">
                    {linkedConn
                      ? formatPmConnectionSummary(linkedConn, vi)
                      : label('Chưa gắn kết nối DB', 'No DB connection')}
                  </p>
                </div>
                <div className="wb-pm-project-actions">
                  <button type="button" className="btn" onClick={() => setEditingProject(project)}>
                    {label('Sửa dự án', 'Edit project')}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      if (
                        !window.confirm(
                          label(`Xoá dự án «${project.name}» và mọi dữ liệu?`, `Delete project “${project.name}” and all data?`),
                        )
                      )
                        return
                      deletePmProject(practiceId, project.id)
                      reload()
                      const next = readPmProjects(practiceId)[0]?.id ?? null
                      selectProject(next)
                    }}
                  >
                    {label('Xoá', 'Delete')}
                  </button>
                </div>
              </div>

              <nav className="wb-subtabs" aria-label={label('Tab con dự án', 'Project sub-tabs')}>
                {(
                  [
                    ['board', 'Bảng việc', 'Board'],
                    ['diary', 'Nhật ký thi công', 'Site diary'],
                    ['docs', 'Tài liệu dự án', 'Documents'],
                    ['investors', 'Chủ đầu tư', 'Investors'],
                    ['payments', 'Thanh toán', 'Payments'],
                  ] as const
                ).map(([id, a, b]) => (
                  <button
                    key={id}
                    type="button"
                    className={`wb-subtab${panel === id ? ' active' : ''}`}
                    onClick={() => selectPanel(id)}
                  >
                    {vi ? a : b}
                  </button>
                ))}
              </nav>

              {panel === 'investors' ? (
                <InvestorsPanel
                  vi={vi}
                  practiceId={practiceId}
                  projectId={project.id}
                  items={projectInvestors}
                  onReload={reload}
                />
              ) : null}
              {panel === 'payments' ? (
                <PaymentsPanel
                  vi={vi}
                  practiceId={practiceId}
                  projectId={project.id}
                  items={projectPayments}
                  investors={projectInvestors}
                  onReload={reload}
                />
              ) : null}
              {panel === 'diary' ? (
                <DiaryPanel
                  vi={vi}
                  practiceId={practiceId}
                  projectId={project.id}
                  items={projectDiary}
                  onReload={reload}
                />
              ) : null}
              {panel === 'docs' ? (
                <DocsPanel
                  vi={vi}
                  practiceId={practiceId}
                  projectId={project.id}
                  items={projectDocs}
                  onReload={reload}
                />
              ) : null}

              {panel === 'board' ? (
              <>
              <div className="wb-tasks-toolbar">
                <nav className="wb-subtabs" aria-label={label('Chế độ xem', 'Views')}>
                  {(
                    [
                      ['list', 'Danh sách', 'List'],
                      ['kanban', 'Kanban', 'Kanban'],
                    ] as const
                  ).map(([id, a, b]) => (
                    <button
                      key={id}
                      type="button"
                      className={`wb-subtab${view === id ? ' active' : ''}`}
                      onClick={() => selectView(id)}
                    >
                      {vi ? a : b}
                    </button>
                  ))}
                </nav>
                <WbExcelExportBtn
                  vi={vi}
                  disabled={projectCards.length === 0}
                  csv={exportPmCardsCsv(projectCards)}
                  fileName={`project-cards-${project.name}`}
                  sheetName={label('The viec', 'Cards')}
                />
              </div>

              <div className="wb-tasks-quick">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={label('Thêm thẻ nhanh… Enter', 'Quick add card… Enter')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addQuickCard()
                  }}
                />
                <button type="button" className="btn btn-primary" onClick={addQuickCard} disabled={!draft.trim()}>
                  {label('Thêm', 'Add')}
                </button>
              </div>

              <div className={`wb-tasks-body${selectedCard ? ' has-detail' : ''}`}>
                <div className="wb-tasks-main">
                  {view === 'list' ? (
                    <PmListView
                      vi={vi}
                      items={projectCards}
                      selectedId={selectedCardId}
                      onSelect={setSelectedCardId}
                      onDelete={(id) => {
                        deletePmCard(practiceId, id)
                        if (selectedCardId === id) setSelectedCardId(null)
                        reload()
                      }}
                    />
                  ) : (
                    <PmKanbanView
                      vi={vi}
                      items={projectCards}
                      selectedId={selectedCardId}
                      onSelect={setSelectedCardId}
                      onDropStatus={(id, status) => {
                        const card = cards.find((c) => c.id === id)
                        if (!card) return
                        upsertPmCard(practiceId, { ...card, status, title: card.title })
                        reload()
                      }}
                    />
                  )}
                </div>
                {selectedCard ? (
                  <PmCardDetail
                    vi={vi}
                    card={selectedCard}
                    onClose={() => setSelectedCardId(null)}
                    onChange={(next) => {
                      upsertPmCard(practiceId, { ...next, title: next.title })
                      reload()
                    }}
                    onDelete={() => {
                      deletePmCard(practiceId, selectedCard.id)
                      setSelectedCardId(null)
                      reload()
                    }}
                  />
                ) : null}
              </div>
              </>
              ) : null}
            </>
          )}
        </div>
      </div>

      {editingProject ? (
        <PmModal title={label('Sửa dự án', 'Edit project')} onClose={() => setEditingProject(null)}>
          <label className="wb-pm-field">
            <span>{label('Tên', 'Name')}</span>
            <input
              value={editingProject.name}
              onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
            />
          </label>
          <label className="wb-pm-field">
            <span>{label('Mô tả', 'Description')}</span>
            <textarea
              rows={3}
              value={editingProject.description ?? ''}
              onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
            />
          </label>
          <label className="wb-pm-field">
            <span>{label('Kết nối DB', 'DB connection')}</span>
            <select
              value={editingProject.connectionId ?? ''}
              onChange={(e) =>
                setEditingProject({
                  ...editingProject,
                  connectionId: e.target.value || null,
                })
              }
            >
              <option value="">—</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.driver})
                </option>
              ))}
            </select>
          </label>
          <div className="wb-pm-modal-actions">
            <button type="button" className="btn" onClick={() => setEditingProject(null)}>
              {label('Huỷ', 'Cancel')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                upsertPmProject(practiceId, {
                  id: editingProject.id,
                  name: editingProject.name,
                  description: editingProject.description,
                  connectionId: editingProject.connectionId,
                })
                setEditingProject(null)
                reload()
              }}
              disabled={!editingProject.name.trim()}
            >
              {label('Lưu', 'Save')}
            </button>
          </div>
        </PmModal>
      ) : null}

      {editingConn ? (
        <PmModal
          title={editingConn.id ? label('Sửa kết nối', 'Edit connection') : label('Thêm kết nối', 'Add connection')}
          onClose={() => setEditingConn(null)}
        >
          <label className="wb-pm-field">
            <span>{label('Tên', 'Name')}</span>
            <input
              value={editingConn.name ?? ''}
              onChange={(e) => setEditingConn({ ...editingConn, name: e.target.value })}
            />
          </label>
          <label className="wb-pm-field">
            <span>{label('Loại', 'Driver')}</span>
            <select
              value={editingConn.driver ?? 'sqlite'}
              onChange={(e) =>
                setEditingConn({ ...editingConn, driver: e.target.value as PmDbDriver })
              }
            >
              {DRIVERS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          {(editingConn.driver ?? 'sqlite') === 'sqlite' ? (
            <label className="wb-pm-field">
              <span>{label('Đường dẫn file .db / .sqlite', 'SQLite file path')}</span>
              <div className="wb-pm-path-row">
                <input
                  value={editingConn.sqlitePath ?? ''}
                  onChange={(e) => setEditingConn({ ...editingConn, sqlitePath: e.target.value })}
                  placeholder="/path/to/data.sqlite"
                />
                <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
                  {label('Chọn…', 'Browse…')}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".db,.sqlite,.sqlite3"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    // Electron File may expose path
                    const path = (f as File & { path?: string }).path || f.name
                    setEditingConn({ ...editingConn, sqlitePath: path })
                  }}
                />
              </div>
            </label>
          ) : (
            <>
              <div className="wb-pm-grid2">
                <label className="wb-pm-field">
                  <span>Host</span>
                  <input
                    value={editingConn.host ?? ''}
                    onChange={(e) => setEditingConn({ ...editingConn, host: e.target.value })}
                    placeholder="127.0.0.1"
                  />
                </label>
                <label className="wb-pm-field">
                  <span>Port</span>
                  <input
                    type="number"
                    value={editingConn.port ?? ''}
                    onChange={(e) =>
                      setEditingConn({
                        ...editingConn,
                        port: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder={editingConn.driver === 'postgres' ? '5432' : '3306'}
                  />
                </label>
              </div>
              <label className="wb-pm-field">
                <span>Database</span>
                <input
                  value={editingConn.database ?? ''}
                  onChange={(e) => setEditingConn({ ...editingConn, database: e.target.value })}
                />
              </label>
              <div className="wb-pm-grid2">
                <label className="wb-pm-field">
                  <span>{label('User', 'Username')}</span>
                  <input
                    value={editingConn.username ?? ''}
                    onChange={(e) => setEditingConn({ ...editingConn, username: e.target.value })}
                  />
                </label>
                <label className="wb-pm-field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={editingConn.password ?? ''}
                    onChange={(e) => setEditingConn({ ...editingConn, password: e.target.value })}
                    autoComplete="off"
                  />
                </label>
              </div>
            </>
          )}
          <label className="wb-pm-field">
            <span>{label('Ghi chú', 'Notes')}</span>
            <textarea
              rows={2}
              value={editingConn.notes ?? ''}
              onChange={(e) => setEditingConn({ ...editingConn, notes: e.target.value })}
            />
          </label>
          <p className="wb-pm-hint">
            {label(
              'Kết nối lưu trên máy này (Workbench SQLite). Phase này gắn metadata dự án; truy vấn live DB sẽ bổ sung sau.',
              'Connections stay on this device (Workbench SQLite). This phase stores metadata; live DB queries come later.',
            )}
          </p>
          <div className="wb-pm-modal-actions">
            <button type="button" className="btn" onClick={() => setEditingConn(null)}>
              {label('Huỷ', 'Cancel')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={saveConn}
              disabled={!editingConn.name?.trim()}
            >
              {label('Lưu', 'Save')}
            </button>
          </div>
        </PmModal>
      ) : null}
    </div>
  )
}

function ConnectionsPanel({
  vi,
  connections,
  onAdd,
  onEdit,
  onDelete,
}: {
  vi: boolean
  connections: WbPmDbConnection[]
  onAdd: () => void
  onEdit: (c: WbPmDbConnection) => void
  onDelete: (id: string) => void
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  return (
    <div className="wb-pm-connections">
      <div className="wb-pm-project-bar">
        <div>
          <h2 className="wb-pm-project-title">{label('Kết nối Database', 'Database connections')}</h2>
          <p className="wb-pm-project-meta">
            {label('CRUD kết nối SQLite / Postgres / MySQL trên máy local.', 'CRUD SQLite / Postgres / MySQL connections on this device.')}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onAdd}>
          {label('Thêm kết nối', 'Add connection')}
        </button>
      </div>
      {connections.length === 0 ? (
        <div className="wb-tasks-empty">
          <span aria-hidden="true">⛁</span>
          <p>{label('Chưa có kết nối. Thêm để gắn vào dự án.', 'No connections yet. Add one to link to projects.')}</p>
        </div>
      ) : (
        <ul className="wb-pm-conn-list">
          {connections.map((c) => (
            <li key={c.id} className="wb-pm-conn-row">
              <div>
                <strong>{c.name}</strong>
                <span>{formatPmConnectionSummary(c, vi)}</span>
              </div>
              <div className="wb-pm-conn-actions">
                <button type="button" className="btn" onClick={() => onEdit(c)}>
                  {label('Sửa', 'Edit')}
                </button>
                <button type="button" className="btn" onClick={() => onDelete(c.id)}>
                  {label('Xoá', 'Delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DiaryPanel({
  vi,
  practiceId,
  projectId,
  items,
  onReload,
}: {
  vi: boolean
  practiceId: PracticeId
  projectId: string
  items: WbPmDiaryEntry[]
  onReload: () => void
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [date, setDate] = useState(todayIsoDate)
  const [weather, setWeather] = useState('')
  const [workArea, setWorkArea] = useState('')
  const [content, setContent] = useState('')
  const [workforce, setWorkforce] = useState('')
  const [progress, setProgress] = useState('')
  const [author, setAuthor] = useState('')

  const add = () => {
    if (!date || !content.trim()) return
    upsertPmDiaryEntry(practiceId, {
      projectId,
      date,
      weather,
      workArea,
      content,
      workforce,
      progress,
      author,
    })
    setWeather('')
    setWorkArea('')
    setContent('')
    setWorkforce('')
    setProgress('')
    setAuthor('')
    setDate(todayIsoDate())
    onReload()
  }

  return (
    <div className="wb-pm-subpanel">
      <div className="wb-pm-project-bar">
        <p className="wb-pm-project-meta">
          {label(
            'Ghi nhật ký hiện trường theo ngày — thời tiết, hạng mục, nhân lực, tiến độ.',
            'Daily site diary — weather, work area, crew, progress.',
          )}
        </p>
        <WbExcelExportBtn
          vi={vi}
          disabled={items.length === 0}
          csv={exportPmDiaryCsv(items)}
          fileName="project-diary"
          sheetName={label('Nhat ky', 'Diary')}
        />
      </div>
      <div className="wb-crm-form">
        <div className="wb-pm-grid2">
          <label className="wb-pm-field">
            <span>{label('Ngày *', 'Date *')}</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="wb-pm-field">
            <span>{label('Thời tiết', 'Weather')}</span>
            <input
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              placeholder={label('VD: Nắng nhẹ', 'e.g. Light sun')}
            />
          </label>
        </div>
        <div className="wb-pm-grid2">
          <label className="wb-pm-field">
            <span>{label('Hạng mục / khu vực', 'Work area')}</span>
            <input
              value={workArea}
              onChange={(e) => setWorkArea(e.target.value)}
              placeholder={label('VD: Tầng 3 — cốp pha', 'e.g. Level 3 formwork')}
            />
          </label>
          <label className="wb-pm-field">
            <span>{label('Nhân lực', 'Workforce')}</span>
            <input
              value={workforce}
              onChange={(e) => setWorkforce(e.target.value)}
              placeholder={label('VD: 12 thợ chính', 'e.g. 12 workers')}
            />
          </label>
        </div>
        <label className="wb-pm-field">
          <span>{label('Nội dung *', 'Content *')}</span>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={label('Công việc đã làm trong ngày…', 'Work done today…')}
          />
        </label>
        <div className="wb-pm-grid2">
          <label className="wb-pm-field">
            <span>{label('Tiến độ', 'Progress')}</span>
            <input
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              placeholder={label('VD: Đạt 60% cốp pha', 'e.g. 60% formwork')}
            />
          </label>
          <label className="wb-pm-field">
            <span>{label('Người ghi', 'Author')}</span>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} />
          </label>
        </div>
        <button type="button" className="btn btn-primary" disabled={!date || !content.trim()} onClick={add}>
          {label('Thêm nhật ký', 'Add diary entry')}
        </button>
      </div>
      {items.length === 0 ? (
        <div className="wb-tasks-empty">
          <p>{label('Chưa có nhật ký thi công.', 'No site diary entries yet.')}</p>
        </div>
      ) : (
        <ul className="wb-tasks-list">
          {items.map((it) => (
            <li key={it.id} className="wb-tasks-list-row">
              <div className="wb-tasks-list-main" style={{ cursor: 'default' }}>
                <strong>
                  {it.date}
                  {it.workArea ? ` · ${it.workArea}` : ''}
                </strong>
                <span>
                  {[it.weather, it.workforce, it.progress, it.author].filter(Boolean).join(' · ') || '—'}
                </span>
                <span>{it.content}</span>
              </div>
              <button
                type="button"
                className="wb-tasks-icon-btn"
                onClick={() => {
                  if (!window.confirm(label('Xoá nhật ký này?', 'Delete this diary entry?'))) return
                  deletePmDiaryEntry(practiceId, it.id)
                  onReload()
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DocsPanel({
  vi,
  practiceId,
  projectId,
  items,
  onReload,
}: {
  vi: boolean
  practiceId: PracticeId
  projectId: string
  items: WbPmDoc[]
  onReload: () => void
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [draftFile, setDraftFile] = useState<{
    filePath: string
    fileName: string
    fileExt: string
  } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const pickFile = async () => {
    const result = (await window.aiOffice.pickAttachments?.()) ?? null
    if (!result) return
    const accepted = result.accepted[0]
    if (!accepted) {
      setNotice(
        result.rejected[0] ||
          label('Không chọn được file hỗ trợ.', 'No supported file selected.'),
      )
      window.setTimeout(() => setNotice(null), 4000)
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
    setNotice(null)
  }

  const add = () => {
    const t = title.trim() || draftFile?.fileName.replace(/\.[^.]+$/, '') || ''
    if (!t) return
    upsertPmDoc(practiceId, {
      projectId,
      title: t,
      category,
      note,
      ...(draftFile
        ? {
            filePath: draftFile.filePath,
            fileName: draftFile.fileName,
            fileExt: draftFile.fileExt,
          }
        : {}),
    })
    setTitle('')
    setCategory('')
    setNote('')
    setDraftFile(null)
    onReload()
  }

  return (
    <div className="wb-pm-subpanel">
      <div className="wb-pm-project-bar">
        <p className="wb-pm-project-meta">
          {label(
            'Thư viện tài liệu dự án trên máy — gắn file mẫu / bản vẽ / biên bản.',
            'Local project document library — attach drawings, minutes, templates.',
          )}
        </p>
        <WbExcelExportBtn
          vi={vi}
          disabled={items.length === 0}
          csv={exportPmDocsCsv(items)}
          fileName="project-docs"
          sheetName={label('Tai lieu', 'Documents')}
        />
      </div>
      <div className="wb-crm-form">
        <div className="wb-pm-grid2">
          <label className="wb-pm-field">
            <span>{label('Tiêu đề *', 'Title *')}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="wb-pm-field">
            <span>{label('Loại', 'Category')}</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={label('VD: Bản vẽ, Biên bản', 'e.g. Drawing, Minutes')}
              list="wb-pm-doc-categories"
            />
            <datalist id="wb-pm-doc-categories">
              {(vi
                ? ['Bản vẽ', 'Biên bản', 'Hợp đồng', 'Pháp lý', 'Ảnh hiện trường', 'Khác']
                : ['Drawing', 'Minutes', 'Contract', 'Legal', 'Site photo', 'Other']
              ).map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
        </div>
        <label className="wb-pm-field">
          <span>{label('Ghi chú', 'Note')}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="teacher-chip-row">
          <button type="button" className="btn btn-secondary" onClick={() => void pickFile()}>
            {draftFile
              ? label('Đổi file…', 'Replace file…')
              : label('Đính kèm file…', 'Attach file…')}
          </button>
          {draftFile ? (
            <button type="button" className="btn btn-secondary" onClick={() => setDraftFile(null)}>
              {label('Bỏ file', 'Clear file')}
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!title.trim() && !draftFile}
            onClick={add}
          >
            {label('Thêm tài liệu', 'Add document')}
          </button>
        </div>
        {draftFile ? (
          <p className="wb-pm-hint">
            {label('File:', 'File:')} {draftFile.fileName}
          </p>
        ) : null}
        {notice ? <p className="wb-pm-hint">{notice}</p> : null}
      </div>
      {items.length === 0 ? (
        <div className="wb-tasks-empty">
          <p>{label('Chưa có tài liệu dự án.', 'No project documents yet.')}</p>
        </div>
      ) : (
        <ul className="wb-tasks-list">
          {items.map((it) => (
            <li key={it.id} className="wb-tasks-list-row">
              <div className="wb-tasks-list-main" style={{ cursor: 'default' }}>
                <strong>{it.title}</strong>
                <span>
                  {[it.category, it.fileName, it.note].filter(Boolean).join(' · ') || '—'}
                </span>
              </div>
              <WbRowActions>
                {it.filePath ? (
                  <WbFileBtn
                    label={label('Mở file', 'Open file')}
                    onClick={() => void window.aiOffice.openPath?.(it.filePath!)}
                  />
                ) : null}
                <WbDeleteBtn
                  label={label('Xóa', 'Delete')}
                  onClick={() => {
                    if (!window.confirm(label(`Xoá «${it.title}»?`, `Delete “${it.title}”?`))) return
                    deletePmDoc(practiceId, it.id)
                    onReload()
                  }}
                />
              </WbRowActions>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function InvestorsPanel({
  vi,
  practiceId,
  projectId,
  items,
  onReload,
}: {
  vi: boolean
  practiceId: PracticeId
  projectId: string
  items: WbPmInvestor[]
  onReload: () => void
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [name, setName] = useState('')
  const [org, setOrg] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [share, setShare] = useState('')
  const [amount, setAmount] = useState('')

  const add = () => {
    if (!name.trim()) return
    upsertPmInvestor(practiceId, {
      projectId,
      name,
      org,
      phone,
      email,
      sharePercent: share ? Number(share) : undefined,
      committedAmount: amount ? Number(amount) : undefined,
    })
    setName('')
    setOrg('')
    setPhone('')
    setEmail('')
    setShare('')
    setAmount('')
    onReload()
  }

  return (
    <div className="wb-pm-subpanel">
      <div className="wb-pm-project-bar">
        <p className="wb-pm-project-meta">
          {label('Danh sách chủ đầu tư / cổ đông của dự án.', 'Investors / shareholders for this project.')}
        </p>
        <WbExcelExportBtn
          vi={vi}
          disabled={items.length === 0}
          csv={exportPmInvestorsCsv(items)}
          fileName="project-investors"
          sheetName={label('Chu dau tu', 'Investors')}
        />
      </div>
      <div className="wb-crm-form">
        <div className="wb-pm-grid2">
          <label className="wb-pm-field">
            <span>{label('Tên *', 'Name *')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="wb-pm-field">
            <span>{label('Tổ chức', 'Org')}</span>
            <input value={org} onChange={(e) => setOrg(e.target.value)} />
          </label>
        </div>
        <div className="wb-pm-grid2">
          <label className="wb-pm-field">
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="wb-pm-field">
            <span>{label('SĐT', 'Phone')}</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        </div>
        <div className="wb-pm-grid2">
          <label className="wb-pm-field">
            <span>{label('% sở hữu', 'Share %')}</span>
            <input type="number" value={share} onChange={(e) => setShare(e.target.value)} />
          </label>
          <label className="wb-pm-field">
            <span>{label('Cam kết vốn', 'Committed')}</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
        </div>
        <button type="button" className="btn btn-primary" disabled={!name.trim()} onClick={add}>
          {label('Thêm chủ đầu tư', 'Add investor')}
        </button>
      </div>
      <ul className="wb-tasks-list">
        {items.map((it) => (
          <li key={it.id} className="wb-tasks-list-row">
            <div className="wb-tasks-list-main" style={{ cursor: 'default' }}>
              <strong>{it.name}</strong>
              <span>
                {[it.org, it.email, it.phone, it.sharePercent != null ? `${it.sharePercent}%` : '', it.committedAmount != null ? String(it.committedAmount) : '']
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </span>
            </div>
            <button
              type="button"
              className="wb-tasks-icon-btn"
              onClick={() => {
                if (!window.confirm(label(`Xoá «${it.name}»?`, `Delete “${it.name}”?`))) return
                deletePmInvestor(practiceId, it.id)
                onReload()
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PaymentsPanel({
  vi,
  practiceId,
  projectId,
  items,
  investors,
  onReload,
}: {
  vi: boolean
  practiceId: PracticeId
  projectId: string
  items: WbPmPayment[]
  investors: WbPmInvestor[]
  onReload: () => void
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<PmPaymentStatus>('planned')
  const [investorId, setInvestorId] = useState('')
  const [counterparty, setCounterparty] = useState('')

  const add = () => {
    if (!title.trim() || !amount || Number(amount) <= 0) return
    upsertPmPayment(practiceId, {
      projectId,
      title,
      amount: Number(amount),
      dueDate: dueDate || undefined,
      status,
      investorId: investorId || null,
      counterparty,
    })
    setTitle('')
    setAmount('')
    setDueDate('')
    setStatus('planned')
    setInvestorId('')
    setCounterparty('')
    onReload()
  }

  return (
    <div className="wb-pm-subpanel">
      <div className="wb-pm-project-bar">
        <p className="wb-pm-project-meta">
          {label('Lịch thanh toán / giải ngân của dự án.', 'Project payment / disbursement schedule.')}
        </p>
        <WbExcelExportBtn
          vi={vi}
          disabled={items.length === 0}
          csv={exportPmPaymentsCsv(items)}
          fileName="project-payments"
          sheetName={label('Thanh toan', 'Payments')}
        />
      </div>
      <div className="wb-crm-form">
        <div className="wb-pm-grid2">
          <label className="wb-pm-field">
            <span>{label('Tiêu đề *', 'Title *')}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="wb-pm-field">
            <span>{label('Số tiền *', 'Amount *')}</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
        </div>
        <div className="wb-pm-grid2">
          <label className="wb-pm-field">
            <span>{label('Hạn', 'Due')}</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
          <label className="wb-pm-field">
            <span>{label('Trạng thái', 'Status')}</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as PmPaymentStatus)}>
              <option value="planned">{label('Kế hoạch', 'Planned')}</option>
              <option value="due">{label('Đến hạn', 'Due')}</option>
              <option value="paid">{label('Đã trả', 'Paid')}</option>
              <option value="cancelled">{label('Huỷ', 'Cancelled')}</option>
            </select>
          </label>
        </div>
        <div className="wb-pm-grid2">
          <label className="wb-pm-field">
            <span>{label('Chủ đầu tư', 'Investor')}</span>
            <select value={investorId} onChange={(e) => setInvestorId(e.target.value)}>
              <option value="">—</option>
              {investors.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name}
                </option>
              ))}
            </select>
          </label>
          <label className="wb-pm-field">
            <span>{label('Đối tác', 'Counterparty')}</span>
            <input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} />
          </label>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!title.trim() || !amount || Number(amount) <= 0}
          onClick={add}
        >
          {label('Thêm thanh toán', 'Add payment')}
        </button>
      </div>
      <ul className="wb-tasks-list">
        {items.map((it) => (
          <li key={it.id} className="wb-tasks-list-row">
            <div className="wb-tasks-list-main" style={{ cursor: 'default' }}>
              <strong>
                {it.title} · {it.amount.toLocaleString()} {it.currency ?? 'VND'}
              </strong>
              <span>
                {it.status}
                {it.dueDate ? ` · ${it.dueDate}` : ''}
                {it.counterparty ? ` · ${it.counterparty}` : ''}
              </span>
            </div>
            <div className="wb-pm-conn-actions">
              {it.status !== 'paid' ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    upsertPmPayment(practiceId, {
                      ...it,
                      title: it.title,
                      amount: it.amount,
                      status: 'paid',
                      paidAt: new Date().toISOString().slice(0, 10),
                    })
                    onReload()
                  }}
                >
                  {label('Đánh dấu đã trả', 'Mark paid')}
                </button>
              ) : null}
              <button
                type="button"
                className="wb-tasks-icon-btn"
                onClick={() => {
                  if (!window.confirm(label('Xoá khoản này?', 'Delete this payment?'))) return
                  deletePmPayment(practiceId, it.id)
                  onReload()
                }}
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PmListView({
  vi,
  items,
  selectedId,
  onSelect,
  onDelete,
}: {
  vi: boolean
  items: WbPmCard[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  if (items.length === 0) {
    return (
      <div className="wb-tasks-empty">
        <span aria-hidden="true">✓</span>
        <p>{label('Chưa có thẻ. Thêm nhanh phía trên.', 'No cards yet. Quick-add above.')}</p>
      </div>
    )
  }
  return (
    <ul className="wb-tasks-list">
      {items.map((it) => (
        <li key={it.id} className={`wb-tasks-list-row${selectedId === it.id ? ' is-selected' : ''}`}>
          <button type="button" className="wb-tasks-list-main" onClick={() => onSelect(it.id)}>
            <strong>{it.title}</strong>
            <span>
              {statusLabel(it.status, vi)}
              {it.dueDate ? ` · ${it.dueDate}` : ''}
              {it.assignee ? ` · ${it.assignee}` : ''}
            </span>
          </button>
          <button
            type="button"
            className="wb-tasks-icon-btn"
            aria-label={label('Xoá', 'Delete')}
            onClick={() => {
              if (window.confirm(label(`Xoá «${it.title}»?`, `Delete “${it.title}”?`))) onDelete(it.id)
            }}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}

function PmKanbanView({
  vi,
  items,
  selectedId,
  onSelect,
  onDropStatus,
}: {
  vi: boolean
  items: WbPmCard[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDropStatus: (id: string, status: PmCardStatus) => void
}): ReactElement {
  const onDragStart = (e: ReactDragEvent, id: string) => {
    e.dataTransfer.setData('text/pm-card-id', id)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDrop = (e: ReactDragEvent, status: PmCardStatus) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/pm-card-id')
    if (id) onDropStatus(id, status)
  }
  return (
    <div className="wb-tasks-kanban">
      {STATUSES.map((col) => {
        const colItems = items.filter((c) => c.status === col.id)
        return (
          <section
            key={col.id}
            className="wb-tasks-kanban-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, col.id)}
          >
            <header>
              <strong>{vi ? col.labelVi : col.labelEn}</strong>
              <span>{colItems.length}</span>
            </header>
            <ul>
              {colItems.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    className={`wb-tasks-kanban-card${selectedId === it.id ? ' is-selected' : ''}`}
                    draggable
                    onDragStart={(e) => onDragStart(e, it.id)}
                    onClick={() => onSelect(it.id)}
                  >
                    <strong>{it.title}</strong>
                    {it.dueDate ? <span>{it.dueDate}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function PmCardDetail({
  vi,
  card,
  onClose,
  onChange,
  onDelete,
}: {
  vi: boolean
  card: WbPmCard
  onClose: () => void
  onChange: (c: WbPmCard) => void
  onDelete: () => void
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  return (
    <aside className="wb-tasks-detail" aria-label={label('Chi tiết thẻ', 'Card detail')}>
      <header className="wb-tasks-detail-head">
        <strong>{label('Chi tiết', 'Detail')}</strong>
        <button type="button" className="wb-tasks-icon-btn" onClick={onClose} aria-label={label('Đóng', 'Close')}>
          ×
        </button>
      </header>
      <label className="wb-pm-field">
        <span>{label('Tiêu đề', 'Title')}</span>
        <input value={card.title} onChange={(e) => onChange({ ...card, title: e.target.value })} />
      </label>
      <label className="wb-pm-field">
        <span>{label('Trạng thái', 'Status')}</span>
        <select
          value={card.status}
          onChange={(e) => onChange({ ...card, status: e.target.value as PmCardStatus })}
        >
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {vi ? s.labelVi : s.labelEn}
            </option>
          ))}
        </select>
      </label>
      <label className="wb-pm-field">
        <span>{label('Hạn', 'Due')}</span>
        <input
          type="date"
          value={card.dueDate ?? ''}
          onChange={(e) => onChange({ ...card, dueDate: e.target.value || undefined })}
        />
      </label>
      <label className="wb-pm-field">
        <span>{label('Người làm', 'Assignee')}</span>
        <input
          value={card.assignee ?? ''}
          onChange={(e) => onChange({ ...card, assignee: e.target.value })}
        />
      </label>
      <label className="wb-pm-field">
        <span>{label('Mô tả', 'Description')}</span>
        <textarea
          rows={5}
          value={card.description ?? ''}
          onChange={(e) => onChange({ ...card, description: e.target.value })}
        />
      </label>
      <button
        type="button"
        className="btn"
        onClick={() => {
          if (window.confirm(label('Xoá thẻ này?', 'Delete this card?'))) onDelete()
        }}
      >
        {label('Xoá thẻ', 'Delete card')}
      </button>
    </aside>
  )
}

function PmModal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}): ReactElement {
  return (
    <div className="wb-pm-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="wb-pm-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="wb-pm-modal-head">
          <strong>{title}</strong>
          <button type="button" className="wb-tasks-icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="wb-pm-modal-body">{children}</div>
      </div>
    </div>
  )
}
