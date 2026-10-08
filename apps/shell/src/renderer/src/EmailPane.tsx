import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import type { PracticeId } from '@uniwork/practice-core'
import type {
  MailAccountPublic,
  MailApi,
  MailConnectInput,
  MailProviderKind,
} from '../../shared/mail-api'
import {
  createEmailDraft,
  mergeSyncedEmails,
  normalizeEmailMessage,
  normalizeTaskItem,
  readEmails,
  readPersonal,
  readTasks,
  writeEmails,
  writeTasks,
  type WbEmailFolder,
  type WbEmailMessage,
} from './workbench-pins'

type AiAssistId = 'polish' | 'shorter' | 'formal' | 'friendly' | 'followup' | 'vi' | 'en'

const FOLDERS: { id: WbEmailFolder; labelVi: string; labelEn: string }[] = [
  { id: 'inbox', labelVi: 'Hộp thư', labelEn: 'Inbox' },
  { id: 'drafts', labelVi: 'Nháp', labelEn: 'Drafts' },
  { id: 'sent', labelVi: 'Đã gửi', labelEn: 'Sent' },
  { id: 'archive', labelVi: 'Lưu trữ', labelEn: 'Archive' },
]

const AI_ACTIONS: { id: AiAssistId; labelVi: string; labelEn: string }[] = [
  { id: 'polish', labelVi: 'Chỉnh mượt', labelEn: 'Polish' },
  { id: 'shorter', labelVi: 'Rút gọn', labelEn: 'Shorter' },
  { id: 'formal', labelVi: 'Trang trọng', labelEn: 'Formal' },
  { id: 'friendly', labelVi: 'Thân thiện', labelEn: 'Friendly' },
  { id: 'followup', labelVi: 'Follow-up', labelEn: 'Follow-up' },
  { id: 'vi', labelVi: 'Tiếng Việt', labelEn: 'Vietnamese' },
  { id: 'en', labelVi: 'English', labelEn: 'English' },
]

function mailApi(): MailApi | undefined {
  return (window as Window & { uniMail?: MailApi }).uniMail
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function aiSystemPrompt(action: AiAssistId, vi: boolean): string {
  const base = vi
    ? 'Bạn là trợ lý soạn email chuyên nghiệp. Chỉ trả về nội dung email đã chỉnh (có thể kèm subject dòng đầu nếu cần), không giải thích.'
    : 'You are a professional email writing assistant. Return only the revised email body (subject line optional), no commentary.'
  const map: Record<AiAssistId, string> = {
    polish: vi ? 'Chỉnh lại cho mạch lạc, lịch sự, rõ ý.' : 'Polish for clarity, courtesy, and flow.',
    shorter: vi ? 'Rút gọn còn khoảng 60% độ dài, giữ ý chính.' : 'Cut to ~60% length, keep the point.',
    formal: vi ? 'Viết giọng trang trọng, phù hợp công việc.' : 'Rewrite in a formal business tone.',
    friendly: vi ? 'Viết giọng thân thiện, ấm nhưng vẫn chuyên nghiệp.' : 'Rewrite in a warm, friendly professional tone.',
    followup: vi
      ? 'Viết email follow-up lịch sự nhắc việc / chờ phản hồi.'
      : 'Write a polite follow-up email requesting a response.',
    vi: 'Rewrite the email in natural Vietnamese.',
    en: 'Rewrite the email in clear professional English.',
  }
  return `${base}\nTask: ${map[action]}`
}

export function EmailPane({ practiceId, vi }: { practiceId: PracticeId; vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const profile = readPersonal()
  const [items, setItems] = useState<WbEmailMessage[]>(() => readEmails(practiceId))
  const [folder, setFolder] = useState<WbEmailFolder>('inbox')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [account, setAccount] = useState<MailAccountPublic | null>(null)
  const [showConnect, setShowConnect] = useState(false)
  const [connectBusy, setConnectBusy] = useState(false)
  const [syncBusy, setSyncBusy] = useState(false)
  const [sendBusy, setSendBusy] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [kind, setKind] = useState<MailProviderKind>('gmail')
  const [email, setEmail] = useState(profile.email || '')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState(profile.fullName || '')
  const [imapHost, setImapHost] = useState('')
  const [imapPort, setImapPort] = useState('993')
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('587')
  const [presets, setPresets] = useState<Awaited<ReturnType<MailApi['listPresets']>>>([])

  const persist = useCallback(
    (next: WbEmailMessage[]) => {
      const normalized = next.map((m) => normalizeEmailMessage(m))
      setItems(normalized)
      writeEmails(practiceId, normalized)
    },
    [practiceId],
  )

  const refreshAccount = useCallback(async () => {
    const api = mailApi()
    if (!api) return
    const acc = await api.getAccount()
    setAccount(acc)
  }, [])

  const runSync = useCallback(async () => {
    const api = mailApi()
    if (!api) {
      setNotice(
        vi
          ? 'Mail API chưa sẵn sàng — hãy khởi động lại app.'
          : 'Mail API unavailable — relaunch the app.',
      )
      return
    }
    setSyncBusy(true)
    setNotice(null)
    try {
      const res = await api.sync({ limit: 40 })
      if (!res.ok || !res.messages || !res.account) {
        setNotice(res.error || (vi ? 'Đồng bộ thất bại.' : 'Sync failed.'))
        return
      }
      const local = readEmails(practiceId)
      persist(mergeSyncedEmails(local, res.messages, res.account.id))
      setAccount(res.account)
      setFolder('inbox')
      setNotice(
        vi
          ? `Đã đồng bộ ${res.messages.length} thư từ ${res.account.email}.`
          : `Synced ${res.messages.length} messages from ${res.account.email}.`,
      )
    } catch (err) {
      setNotice(err instanceof Error ? err.message : String(err))
    } finally {
      setSyncBusy(false)
    }
  }, [vi, persist, practiceId])

  useEffect(() => {
    setItems(readEmails(practiceId))
    setSelectedId(null)
    setComposing(false)
    setAiError(null)
    setNotice(null)
    void refreshAccount()
    void mailApi()
      ?.listPresets()
      .then((p) => setPresets(p))
      .catch(() => {})
  }, [practiceId, refreshAccount])

  useEffect(() => {
    const preset = presets.find((p) => p.kind === kind)
    if (!preset) return
    if (kind !== 'imap') {
      setImapHost(preset.endpoints.imapHost)
      setImapPort(String(preset.endpoints.imapPort))
      setSmtpHost(preset.endpoints.smtpHost)
      setSmtpPort(String(preset.endpoints.smtpPort))
    }
  }, [kind, presets])

  const visible = useMemo(
    () =>
      items
        .filter((m) => m.folder === folder)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [items, folder],
  )

  const selected = items.find((m) => m.id === selectedId) ?? null
  const editable = Boolean(selected && (selected.folder === 'drafts' || composing))

  const counts = useMemo(() => {
    const c: Record<WbEmailFolder, number> = { inbox: 0, drafts: 0, sent: 0, archive: 0 }
    for (const m of items) c[m.folder] += 1
    return c
  }, [items])

  const startCompose = (seed?: Partial<WbEmailMessage>) => {
    const draft = createEmailDraft(practiceId, {
      from: account?.email || profile.email || 'me@local',
      to: seed?.to,
      subject: seed?.subject,
      body: seed?.body,
    })
    setItems(readEmails(practiceId))
    setFolder('drafts')
    setSelectedId(draft.id)
    setComposing(true)
    setNotice(null)
  }

  const updateSelected = (patch: Partial<WbEmailMessage>) => {
    if (!selected) return
    persist(
      items.map((m) =>
        m.id === selected.id
          ? normalizeEmailMessage({ ...m, ...patch, updatedAt: new Date().toISOString() })
          : m,
      ),
    )
  }

  const markRead = (id: string) => {
    persist(items.map((m) => (m.id === id ? { ...m, unread: false } : m)))
  }

  const moveTo = (id: string, nextFolder: WbEmailFolder) => {
    persist(
      items.map((m) =>
        m.id === id
          ? normalizeEmailMessage({
              ...m,
              folder: nextFolder,
              unread: false,
              updatedAt: new Date().toISOString(),
            })
          : m,
      ),
    )
    if (nextFolder !== folder) setSelectedId(null)
  }

  const removeMessage = (id: string) => {
    persist(items.filter((m) => m.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const connectMailbox = async () => {
    const api = mailApi()
    if (!api) {
      setConnectError(label('Mail API chưa sẵn sàng.', 'Mail API unavailable.'))
      return
    }
    setConnectBusy(true)
    setConnectError(null)
    try {
      const input: MailConnectInput = {
        kind,
        email: email.trim(),
        password,
        ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
        imapHost: imapHost.trim(),
        imapPort: Number(imapPort) || 993,
        imapTls: true,
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort) || 587,
        smtpSecure: Number(smtpPort) === 465,
      }
      const res = await api.connect(input)
      if (!res.ok || !res.account) {
        setConnectError(res.error || label('Kết nối thất bại.', 'Connection failed.'))
        return
      }
      setAccount(res.account)
      setPassword('')
      setShowConnect(false)
      setNotice(
        label(
          `Đã kết nối ${res.account.email}. Đang đồng bộ…`,
          `Connected ${res.account.email}. Syncing…`,
        ),
      )
      await runSync()
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : String(err))
    } finally {
      setConnectBusy(false)
    }
  }

  const disconnectMailbox = async () => {
    const api = mailApi()
    if (!api) return
    await api.disconnect()
    setAccount(null)
    setNotice(label('Đã ngắt kết nối hộp thư.', 'Mailbox disconnected.'))
  }

  const sendMail = async () => {
    if (!selected) return
    if (!selected.to.trim() || !selected.subject.trim()) {
      setNotice(label('Cần người nhận và tiêu đề trước khi gửi.', 'Add recipient and subject before sending.'))
      return
    }
    if (!account) {
      setNotice(
        label(
          'Chưa kết nối hộp thư — kết nối Gmail/Outlook/IMAP để gửi thật, hoặc thư chỉ lưu cục bộ.',
          'No mailbox connected — connect Gmail/Outlook/IMAP to send for real.',
        ),
      )
      return
    }
    const api = mailApi()
    if (!api) return
    setSendBusy(true)
    setNotice(null)
    try {
      const res = await api.send({
        to: selected.to,
        cc: selected.cc,
        subject: selected.subject,
        body: selected.body,
      })
      if (!res.ok) {
        setNotice(res.error || label('Gửi thất bại.', 'Send failed.'))
        return
      }
      persist(
        items.map((m) =>
          m.id === selected.id
            ? normalizeEmailMessage({
                ...m,
                folder: 'sent',
                from: account.email,
                unread: false,
                demo: false,
                accountId: account.id,
                updatedAt: new Date().toISOString(),
              })
            : m,
        ),
      )
      setFolder('sent')
      setComposing(false)
      setNotice(label('Đã gửi qua máy chủ email.', 'Sent through your mail server.'))
    } catch (err) {
      setNotice(err instanceof Error ? err.message : String(err))
    } finally {
      setSendBusy(false)
    }
  }

  const createTaskFromMail = () => {
    if (!selected) return
    const now = new Date().toISOString()
    const title = selected.subject.trim() || label('Việc từ email', 'Task from email')
    const note = [
      selected.from ? `From: ${selected.from}` : '',
      selected.to ? `To: ${selected.to}` : '',
      '',
      selected.body,
    ]
      .filter(Boolean)
      .join('\n')
    writeTasks(practiceId, [
      normalizeTaskItem({
        id: newId(),
        title,
        status: 'todo',
        priority: 'medium',
        done: false,
        description: note,
        createdAt: now,
        updatedAt: now,
      }),
      ...readTasks(practiceId),
    ])
    setNotice(label('Đã tạo việc trong tab Công việc.', 'Created a task in Tasks.'))
  }

  const runAi = async (action: AiAssistId) => {
    if (!selected) return
    setAiBusy(true)
    setAiError(null)
    try {
      const api = window.aiOffice
      if (!api?.aiChat || !api.getAiSettings) {
        throw new Error(label('AI chưa sẵn sàng trên máy này.', 'AI is not available on this device.'))
      }
      const settings = await api.getAiSettings()
      const user = [
        selected.subject ? `Subject: ${selected.subject}` : '',
        selected.to ? `To: ${selected.to}` : '',
        '',
        selected.body ||
          label('(nội dung trống — hãy soạn giúp tôi một email ngắn)', '(empty body — draft a short email for me)'),
      ]
        .filter(Boolean)
        .join('\n')
      const res = await api.aiChat({
        settings,
        system: aiSystemPrompt(action, vi),
        user,
      })
      if (!res.ok || !res.content?.trim()) {
        throw new Error(res.error || label('AI không trả về nội dung.', 'AI returned no content.'))
      }
      let subject = selected.subject
      let body = res.content.trim()
      const subjMatch = /^(?:Subject|Tiêu đề)\s*:\s*(.+)\n+/i.exec(body)
      if (subjMatch) {
        subject = subjMatch[1].trim()
        body = body.slice(subjMatch[0].length).trim()
      }
      if (selected.folder !== 'drafts') {
        startCompose({
          to: selected.from || selected.to,
          subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
          body,
        })
      } else {
        updateSelected({ subject, body })
        setComposing(true)
      }
      setNotice(label('AI đã cập nhật nội dung thư.', 'AI updated the email draft.'))
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err))
    } finally {
      setAiBusy(false)
    }
  }

  const activePresetHint = presets.find((p) => p.kind === kind)?.hint

  return (
    <div className="wb-email">
      <header className="wb-email-hero">
        <div>
          <strong>{label('Email', 'Email')}</strong>
          <p>
            {account
              ? label(
                  `Đã kết nối ${account.email}${account.lastSyncAt ? ` · đồng bộ ${account.lastSyncAt.slice(0, 16).replace('T', ' ')}` : ''}.`,
                  `Connected ${account.email}${account.lastSyncAt ? ` · synced ${account.lastSyncAt.slice(0, 16).replace('T', ' ')}` : ''}.`,
                )
              : label(
                  'Kết nối Gmail, Outlook.com hoặc IMAP webmail để nhận/gửi trong UniOffice — không cần cài Outlook.',
                  'Connect Gmail, Outlook.com, or IMAP webmail to send/receive in UniOffice — no Outlook install needed.',
                )}
          </p>
        </div>
        <div className="wb-email-hero-actions">
          {account ? (
            <>
              <button type="button" className="btn" disabled={syncBusy} onClick={() => void runSync()}>
                {syncBusy ? label('Đang đồng bộ…', 'Syncing…') : label('Đồng bộ', 'Sync')}
              </button>
              <button type="button" className="btn" onClick={() => void disconnectMailbox()}>
                {label('Ngắt kết nối', 'Disconnect')}
              </button>
            </>
          ) : (
            <button type="button" className="btn" onClick={() => setShowConnect((v) => !v)}>
              {showConnect ? label('Đóng', 'Close') : label('Kết nối hộp thư', 'Connect mailbox')}
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={() => startCompose()}>
            {label('Soạn thư', 'Compose')}
          </button>
        </div>
      </header>

      {!account && showConnect ? (
        <aside className="wb-email-connect-form" aria-label={label('Kết nối email', 'Connect email')}>
          <div className="wb-email-connect-providers" role="tablist">
            {(
              [
                ['gmail', 'Gmail'],
                ['outlook', 'Outlook'],
                ['yahoo', 'Yahoo'],
                ['imap', label('IMAP khác', 'Other IMAP')],
              ] as const
            ).map(([id, text]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={kind === id}
                className={`wb-email-provider${kind === id ? ' is-active' : ''}`}
                onClick={() => setKind(id)}
              >
                {text}
              </button>
            ))}
          </div>
          {activePresetHint ? <p className="wb-email-connect-hint">{activePresetHint}</p> : null}
          <div className="wb-email-connect-grid">
            <label>
              <span>{label('Email', 'Email')}</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </label>
            <label>
              <span>{label('Mật khẩu ứng dụng', 'App password')}</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder={label('App password (không phải mật khẩu đăng nhập web nếu 2FA)', 'App password (not your web login if 2FA)')}
              />
            </label>
            <label>
              <span>{label('Tên hiển thị', 'Display name')}</span>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </label>
            {kind === 'imap' || kind === 'outlook' || kind === 'gmail' || kind === 'yahoo' ? (
              <>
                <label>
                  <span>IMAP host</span>
                  <input value={imapHost} onChange={(e) => setImapHost(e.target.value)} disabled={kind !== 'imap'} />
                </label>
                <label>
                  <span>IMAP port</span>
                  <input value={imapPort} onChange={(e) => setImapPort(e.target.value)} disabled={kind !== 'imap'} />
                </label>
                <label>
                  <span>SMTP host</span>
                  <input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} disabled={kind !== 'imap'} />
                </label>
                <label>
                  <span>SMTP port</span>
                  <input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} disabled={kind !== 'imap'} />
                </label>
              </>
            ) : null}
          </div>
          <div className="wb-email-connect-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={connectBusy || !email.trim() || !password}
              onClick={() => void connectMailbox()}
            >
              {connectBusy ? label('Đang kiểm tra…', 'Verifying…') : label('Kết nối & đồng bộ', 'Connect & sync')}
            </button>
          </div>
          {connectError ? <p className="wb-email-ai-error">{connectError}</p> : null}
        </aside>
      ) : null}

      {!account && !showConnect ? (
        <aside className="wb-email-connect" aria-label={label('Kết nối email', 'Connect email')}>
          <div>
            <strong>{label('Kết nối hộp thư', 'Connect mailbox')}</strong>
            <span>
              {label(
                'Gmail, Outlook.com / Microsoft 365, Yahoo hoặc IMAP webmail công ty — dùng mật khẩu ứng dụng.',
                'Gmail, Outlook.com / Microsoft 365, Yahoo, or company IMAP — use an app password.',
              )}
            </span>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setShowConnect(true)}>
            {label('Kết nối hộp thư', 'Connect mailbox')}
          </button>
        </aside>
      ) : null}

      <div className="wb-email-shell">
        <nav className="wb-email-folders" aria-label={label('Thư mục', 'Folders')}>
          {FOLDERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`wb-email-folder${folder === f.id ? ' is-active' : ''}`}
              onClick={() => {
                setFolder(f.id)
                setSelectedId(null)
                setComposing(false)
              }}
            >
              <span>{vi ? f.labelVi : f.labelEn}</span>
              <em>{counts[f.id]}</em>
            </button>
          ))}
        </nav>

        <div className="wb-email-list" role="list">
          {visible.length === 0 ? (
            <div className="wb-email-empty">
              <p>{label('Thư mục trống.', 'This folder is empty.')}</p>
              {folder === 'drafts' || folder === 'inbox' ? (
                <button type="button" className="btn btn-primary" onClick={() => startCompose()}>
                  {label('Soạn thư mới', 'New draft')}
                </button>
              ) : null}
            </div>
          ) : (
            visible.map((m) => (
              <button
                key={m.id}
                type="button"
                role="listitem"
                className={`wb-email-row${selectedId === m.id ? ' is-selected' : ''}${m.unread ? ' is-unread' : ''}`}
                onClick={() => {
                  setSelectedId(m.id)
                  setComposing(m.folder === 'drafts')
                  if (m.unread) markRead(m.id)
                }}
              >
                <div className="wb-email-row-top">
                  <strong>{folder === 'sent' || folder === 'drafts' ? m.to || '—' : m.from || '—'}</strong>
                  <time>{m.updatedAt.slice(0, 10)}</time>
                </div>
                <span className="wb-email-row-subject">
                  {m.starred ? '★ ' : ''}
                  {m.subject || label('(Không tiêu đề)', '(No subject)')}
                </span>
                <span className="wb-email-row-preview">{m.body.replace(/\s+/g, ' ').slice(0, 90)}</span>
                {m.demo ? <i className="wb-email-demo">{label('Mẫu', 'Demo')}</i> : null}
              </button>
            ))
          )}
        </div>

        <section className="wb-email-detail" aria-label={label('Chi tiết thư', 'Message detail')}>
          {!selected ? (
            <div className="wb-email-empty">
              <p>{label('Chọn một thư hoặc soạn thư mới.', 'Select a message or compose a new one.')}</p>
            </div>
          ) : (
            <>
              <div className="wb-email-detail-head">
                {editable ? (
                  <input
                    className="wb-email-subject-input"
                    value={selected.subject}
                    onChange={(e) => updateSelected({ subject: e.target.value })}
                    placeholder={label('Tiêu đề', 'Subject')}
                  />
                ) : (
                  <h3>{selected.subject || label('(Không tiêu đề)', '(No subject)')}</h3>
                )}
                <div className="wb-email-meta-grid">
                  <label>
                    <span>From</span>
                    {editable ? (
                      <input value={selected.from} onChange={(e) => updateSelected({ from: e.target.value })} />
                    ) : (
                      <strong>{selected.from || '—'}</strong>
                    )}
                  </label>
                  <label>
                    <span>To</span>
                    {editable ? (
                      <input
                        value={selected.to}
                        onChange={(e) => updateSelected({ to: e.target.value })}
                        placeholder="name@example.com"
                      />
                    ) : (
                      <strong>{selected.to || '—'}</strong>
                    )}
                  </label>
                  <label>
                    <span>Cc</span>
                    {editable ? (
                      <input value={selected.cc ?? ''} onChange={(e) => updateSelected({ cc: e.target.value })} />
                    ) : (
                      <strong>{selected.cc || '—'}</strong>
                    )}
                  </label>
                </div>
              </div>

              {editable ? (
                <textarea
                  className="wb-email-body-input"
                  value={selected.body}
                  onChange={(e) => updateSelected({ body: e.target.value })}
                  placeholder={label('Nội dung thư…', 'Write your email…')}
                  rows={14}
                />
              ) : (
                <pre className="wb-email-body-view">{selected.body || '—'}</pre>
              )}

              <div className="wb-email-ai">
                <div className="wb-email-ai-head">
                  <strong>{label('AI hỗ trợ soạn', 'AI writing assist')}</strong>
                  <span>
                    {label(
                      'Dùng nhà cung cấp AI đã cấu hình trong Settings.',
                      'Uses the AI provider configured in Settings.',
                    )}
                  </span>
                </div>
                <div className="wb-email-ai-actions">
                  {AI_ACTIONS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="wb-email-ai-chip"
                      disabled={aiBusy}
                      onClick={() => void runAi(a.id)}
                    >
                      {vi ? a.labelVi : a.labelEn}
                    </button>
                  ))}
                </div>
                {aiBusy ? <p className="wb-email-ai-status">{label('Đang gọi AI…', 'Calling AI…')}</p> : null}
                {aiError ? <p className="wb-email-ai-error">{aiError}</p> : null}
              </div>

              <div className="wb-email-actions">
                {selected.folder === 'drafts' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={sendBusy}
                    onClick={() => void sendMail()}
                  >
                    {sendBusy
                      ? label('Đang gửi…', 'Sending…')
                      : account
                        ? label('Gửi', 'Send')
                        : label('Gửi (cần kết nối hộp thư)', 'Send (connect mailbox)')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                      startCompose({
                        to: selected.from || selected.to,
                        subject: selected.subject.startsWith('Re:')
                          ? selected.subject
                          : `Re: ${selected.subject}`,
                        body: `\n\n---\n${selected.body}`,
                      })
                    }
                  >
                    {label('Trả lời (nháp)', 'Reply (draft)')}
                  </button>
                )}
                <button type="button" className="btn" onClick={createTaskFromMail}>
                  {label('Tạo việc', 'Create task')}
                </button>
                <button type="button" className="btn" onClick={() => updateSelected({ starred: !selected.starred })}>
                  {selected.starred ? label('Bỏ sao', 'Unstar') : label('Gắn sao', 'Star')}
                </button>
                {selected.folder !== 'archive' ? (
                  <button type="button" className="btn" onClick={() => moveTo(selected.id, 'archive')}>
                    {label('Lưu trữ', 'Archive')}
                  </button>
                ) : (
                  <button type="button" className="btn" onClick={() => moveTo(selected.id, 'inbox')}>
                    {label('Về Inbox', 'Move to Inbox')}
                  </button>
                )}
                <button type="button" className="btn" onClick={() => removeMessage(selected.id)}>
                  {label('Xoá', 'Delete')}
                </button>
              </div>
              {notice ? <p className="wb-email-notice">{notice}</p> : null}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
