import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import {
  createAgentIntent,
  resolveAgentIntentFromText,
  type AgentIntent,
  type PracticeId,
} from '@uniwork/practice-core'
import { applyAgentIntent } from './agent-intent-apply'
import { emitAgentIntentNavigate } from './agent-intent-bus'
import { useI18n } from './locale'

type ChatRole = 'user' | 'assistant' | 'system'

interface ChatMessage {
  id: string
  role: ChatRole
  text: string
}

type FileApp = 'docs' | 'sheets' | 'slides'

interface Suggestion {
  id: string
  labelVi: string
  labelEn: string
  promptVi: string
  promptEn: string
}

const SUGGESTIONS: readonly Suggestion[] = [
  {
    id: 'task',
    labelVi: 'Thêm việc',
    labelEn: 'Add a task',
    promptVi: 'Thêm công việc chuẩn bị báo cáo tuần',
    promptEn: 'Add a task to prepare the weekly report',
  },
  {
    id: 'note',
    labelVi: 'Ghim ghi chú',
    labelEn: 'Pin a note',
    promptVi: 'Ghi chú ý tưởng họp khách hàng ngày mai',
    promptEn: 'Note ideas for tomorrow’s client meeting',
  },
  {
    id: 'email',
    labelVi: 'Soạn email',
    labelEn: 'Draft email',
    promptVi: 'Tạo nháp email follow-up sau buổi demo',
    promptEn: 'Create an email draft for post-demo follow-up',
  },
  {
    id: 'cal',
    labelVi: 'Mở lịch',
    labelEn: 'Open calendar',
    promptVi: 'Mở tab lịch của tôi',
    promptEn: 'Open my calendar tab',
  },
  {
    id: 'doc',
    labelVi: 'Tạo Word',
    labelEn: 'New Word',
    promptVi: 'Tạo văn bản Word mới',
    promptEn: 'Create a new Word document',
  },
  {
    id: 'sheet',
    labelVi: 'Tạo Excel',
    labelEn: 'New Excel',
    promptVi: 'Tạo bảng tính Excel mới',
    promptEn: 'Create a new Excel spreadsheet',
  },
  {
    id: 'slide',
    labelVi: 'Tạo Slide',
    labelEn: 'New Slides',
    promptVi: 'Tạo bài thuyết trình mới',
    promptEn: 'Create a new presentation',
  },
  {
    id: 'desk',
    labelVi: 'Không gian của tôi',
    labelEn: 'My Space',
    promptVi: 'Mở không gian của tôi',
    promptEn: 'Open My Space',
  },
]

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function resolveNewFile(text: string): FileApp | null {
  const lower = text.toLowerCase()
  const wantsCreate =
    /\b(tạo|create|new|mở blank|soạn)\b/i.test(lower) ||
    lower.includes('văn bản mới') ||
    lower.includes('bảng tính mới') ||
    lower.includes('thuyết trình mới')
  if (!wantsCreate) return null
  if (
    /\b(excel|xlsx|spreadsheet|sheets?)\b/i.test(lower) ||
    lower.includes('bảng tính') ||
    lower.includes('bảng excel')
  ) {
    return 'sheets'
  }
  if (
    /\b(pptx|powerpoint|slides?|deck)\b/i.test(lower) ||
    lower.includes('thuyết trình') ||
    lower.includes('bài giảng slide')
  ) {
    return 'slides'
  }
  if (
    /\b(word|docx|document|docs?)\b/i.test(lower) ||
    lower.includes('văn bản') ||
    lower.includes('tài liệu word')
  ) {
    return 'docs'
  }
  return null
}

interface Props {
  practiceId: PracticeId
  ensureWorkbench: () => void
  onOpenRecents?: () => void
}

export function NewChatPane({ practiceId, ensureWorkbench }: Props): ReactElement {
  const { lang } = useI18n()
  const vi = lang === 'vi'
  const label = (a: string, b: string) => (vi ? a : b)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const push = (role: ChatRole, text: string) => {
    setMessages((prev) => [...prev, { id: newId(), role, text }])
  }

  const resetChat = () => {
    setMessages([])
    setInput('')
    setBusy(false)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const runFile = async (app: FileApp, userText: string) => {
    push('user', userText)
    setBusy(true)
    try {
      if (app === 'docs') await window.aiOffice.newDoc()
      else if (app === 'sheets') await window.aiOffice.newSheet()
      else await window.aiOffice.newSlide()
      push(
        'assistant',
        app === 'docs'
          ? label('Đã mở Word mới — tiếp tục soạn trong tab vừa tạo.', 'Opened a new Word doc — continue in the new tab.')
          : app === 'sheets'
            ? label('Đã mở Excel mới — tiếp tục trong tab vừa tạo.', 'Opened a new Excel workbook — continue in the new tab.')
            : label('Đã mở Slides mới — tiếp tục trong tab vừa tạo.', 'Opened a new Slides deck — continue in the new tab.'),
      )
    } catch (err) {
      push(
        'system',
        label(
          `Không mở được file: ${err instanceof Error ? err.message : String(err)}`,
          `Could not open file: ${err instanceof Error ? err.message : String(err)}`,
        ),
      )
    } finally {
      setBusy(false)
    }
  }

  const runIntent = (intent: AgentIntent, userText: string) => {
    push('user', userText)
    setBusy(true)
    try {
      ensureWorkbench()
      const result = applyAgentIntent(intent, practiceId)
      emitAgentIntentNavigate(result.tabId, intent)
      push('assistant', vi ? result.messageVi : result.messageEn)
      if (!result.ok) {
        push(
          'system',
          label(
            'Lệnh chưa áp dụng hết — mở Workbench để hoàn tất.',
            'Intent only partly applied — finish in Workbench if needed.',
          ),
        )
      }
    } catch (err) {
      push(
        'system',
        label(
          `Lỗi: ${err instanceof Error ? err.message : String(err)}`,
          `Error: ${err instanceof Error ? err.message : String(err)}`,
        ),
      )
    } finally {
      setBusy(false)
    }
  }

  const submit = (raw?: string) => {
    const text = (raw ?? input).trim()
    if (!text || busy) return
    setInput('')

    const fileApp = resolveNewFile(text)
    if (fileApp) {
      void runFile(fileApp, text)
      return
    }

    const resolved = resolveAgentIntentFromText(text, 'desktop')
    if (!resolved) {
      push('user', text)
      push(
        'assistant',
        label(
          'Chưa nhận ra lệnh. Thử: “Thêm công việc…”, “Mở lịch”, “Tạo văn bản Word”, “Ghim ghi chú…”.',
          'I couldn’t map that yet. Try: “Add a task…”, “Open calendar”, “Create a Word doc”, “Pin a note…”.',
        ),
      )
      return
    }

    // User already sent from New Chat — apply without a second consent banner.
    const intent = createAgentIntent({
      ...resolved,
      source: 'desktop',
      requireConsent: false,
      text,
    })
    runIntent(intent, text)
  }

  const empty = messages.length === 0

  return (
    <main className="new-chat" aria-label={label('Trợ lý của bạn', 'My AI')}>
      <header className="new-chat-bar">
        <div>
          <strong>{label('Trợ lý của bạn', 'My AI')}</strong>
          <span>
            {label(
              'Bắt đầu công việc bằng ngôn ngữ tự nhiên trên máy này.',
              'Start work with natural language on this device.',
            )}
          </span>
        </div>
        <button type="button" className="btn" onClick={resetChat} disabled={busy && empty}>
          {label('Chat mới', 'New chat')}
        </button>
      </header>

      <div className="new-chat-body">
        {empty ? (
          <div className="new-chat-hero">
            <p className="new-chat-kicker">uniAI · UniWork Office</p>
            <h1>
              {label('Bạn muốn làm gì hôm nay?', 'What do you want to get done?')}
            </h1>
            <p className="new-chat-sub">
              {label(
                'Gõ tiếng Việt hoặc English — mở tab Workbench, thêm việc, ghim note, soạn email, hoặc tạo Word/Excel/Slide.',
                'Type in Vietnamese or English — open Workbench tabs, add tasks, pin notes, draft email, or create Word/Excel/Slides.',
              )}
            </p>
            <div className="new-chat-suggestions" role="list">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="new-chat-chip"
                  role="listitem"
                  disabled={busy}
                  onClick={() => submit(vi ? s.promptVi : s.promptEn)}
                >
                  {vi ? s.labelVi : s.labelEn}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="new-chat-thread" aria-live="polite">
            {messages.map((m) => (
              <article
                key={m.id}
                className={`new-chat-msg is-${m.role}`}
                data-role={m.role}
              >
                <span className="new-chat-msg-role">
                  {m.role === 'user'
                    ? label('Bạn', 'You')
                    : m.role === 'assistant'
                      ? 'uniAI'
                      : label('Hệ thống', 'System')}
                </span>
                <p>{m.text}</p>
              </article>
            ))}
            {busy ? (
              <p className="new-chat-typing">{label('Đang xử lý…', 'Working…')}</p>
            ) : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <footer className="new-chat-composer">
        <textarea
          ref={inputRef}
          rows={2}
          value={input}
          disabled={busy}
          placeholder={label(
            'Ví dụ: Thêm công việc gọi khách lúc 3 giờ · Mở lịch · Tạo Word mới…',
            'e.g. Add a task to call the client at 3 · Open calendar · Create a new Word doc…',
          )}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
        />
        <div className="new-chat-composer-actions">
          <span>
            {label('Enter gửi · Shift+Enter xuống dòng', 'Enter to send · Shift+Enter for newline')}
          </span>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !input.trim()}
            onClick={() => submit()}
          >
            {label('Gửi', 'Send')}
          </button>
        </div>
      </footer>
    </main>
  )
}
