import {
  isSkillDomainId,
  moduleSupportsAddItem,
  tabIdForTarget,
  type AgentIntent,
  type PracticeId,
  type WorkbenchModuleId,
} from '@uniwork/practice-core'
import {
  pinModule,
  readCalendar,
  readEvents,
  readFinance,
  readGrowth,
  readHealth,
  createEmailDraft,
  createStickyNote,
  readPinnedModules,
  readTasks,
  writeCalendar,
  writeEvents,
  writeFinance,
  writeGrowth,
  writeHealth,
  writeTasks,
} from './workbench-pins'
import { pinSkillDomain, writeActiveSkillDomain } from './skill-domain-pins'

export interface AgentIntentApplyResult {
  ok: boolean
  tabId: string
  messageVi: string
  messageEn: string
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function ensurePinned(practiceId: PracticeId, moduleId: WorkbenchModuleId): void {
  const pins = readPinnedModules(practiceId)
  if (!pins.includes(moduleId)) pinModule(practiceId, moduleId)
}

function addItem(
  practiceId: PracticeId,
  moduleId: WorkbenchModuleId,
  text: string,
): { vi: string; en: string } | null {
  const title = text.trim() || 'Untitled'
  if (!moduleSupportsAddItem(moduleId)) return null

  if (moduleId === 'tasks') {
    const now = new Date().toISOString()
    writeTasks(practiceId, [
      {
        id: newId(),
        title,
        done: false,
        status: 'todo',
        priority: 'medium',
        createdAt: now,
        updatedAt: now,
      },
      ...readTasks(practiceId),
    ])
    return { vi: `Đã thêm việc: ${title}`, en: `Added task: ${title}` }
  }
  if (moduleId === 'notes') {
    createStickyNote(practiceId, title)
    return { vi: 'Đã ghim note mới.', en: 'Pinned a new sticky note.' }
  }
  if (moduleId === 'email') {
    createEmailDraft(practiceId, { subject: title, body: '' })
    return { vi: `Đã tạo nháp email: ${title}`, en: `Created email draft: ${title}` }
  }
  if (moduleId === 'calendar') {
    writeCalendar(practiceId, [
      { id: newId(), date: todayIso(), title },
      ...readCalendar(practiceId),
    ])
    return { vi: `Đã thêm lịch: ${title}`, en: `Added calendar item: ${title}` }
  }
  if (moduleId === 'events') {
    writeEvents(practiceId, [
      { id: newId(), date: todayIso(), title },
      ...readEvents(practiceId),
    ])
    return { vi: `Đã thêm sự kiện: ${title}`, en: `Added event: ${title}` }
  }
  if (moduleId === 'personal-finance') {
    writeFinance([
      {
        id: newId(),
        date: todayIso(),
        kind: 'expense',
        amount: 0,
        label: title,
      },
      ...readFinance(),
    ])
    return { vi: `Đã ghi chi tiêu nháp: ${title}`, en: `Logged draft expense: ${title}` }
  }
  if (moduleId === 'health') {
    writeHealth([
      { id: newId(), date: todayIso(), kind: 'other', note: title },
      ...readHealth(),
    ])
    return { vi: `Đã ghi sức khoẻ: ${title}`, en: `Logged health note: ${title}` }
  }
  if (moduleId === 'self-growth') {
    writeGrowth([
      { id: newId(), title, progress: 0, done: false },
      ...readGrowth(),
    ])
    return { vi: `Đã thêm mục tiêu: ${title}`, en: `Added growth goal: ${title}` }
  }
  return null
}

/** Apply a consented intent on-device (pin tab + optional store write). */
export function applyAgentIntent(
  intent: AgentIntent,
  practiceId: PracticeId,
): AgentIntentApplyResult {
  const tabId = tabIdForTarget(intent.target)

  if (intent.target.kind === 'module') {
    ensurePinned(practiceId, intent.target.id)
    window.dispatchEvent(new Event('uniwork:wb-pins-changed'))
  }
  if (intent.target.kind === 'skill-domain' && isSkillDomainId(intent.target.id)) {
    pinSkillDomain(intent.target.id)
    writeActiveSkillDomain(intent.target.id)
    window.dispatchEvent(new Event('uniwork:skill-domain-changed'))
  }

  if (intent.action === 'add_item' && intent.target.kind === 'module') {
    const msg = addItem(practiceId, intent.target.id, intent.text ?? intent.summary)
    if (msg) {
      return { ok: true, tabId, messageVi: msg.vi, messageEn: msg.en }
    }
  }

  if (intent.action === 'summarize') {
    window.dispatchEvent(
      new CustomEvent('uniwork:agent-summarize', {
        detail: { practiceId, intentId: intent.intentId, text: intent.text ?? intent.summary },
      }),
    )
    return {
      ok: true,
      tabId: 'assistant',
      messageVi: 'Đã mở My AI để tóm tắt ngữ cảnh máy (cần xác nhận Token nếu hỏi AI).',
      messageEn: 'Opened My AI to summarize on-device context (Token confirm if AI is used).',
    }
  }

  if (intent.action === 'run_skill') {
    const skillHint = (intent.text ?? intent.summary).trim()
    window.dispatchEvent(
      new CustomEvent('uniwork:agent-run-skill', {
        detail: { practiceId, skillHint, intentId: intent.intentId },
      }),
    )
    return {
      ok: true,
      tabId: 'skills',
      messageVi: 'Đã chuyển tới Skills — chọn kỹ năng và xác nhận Token để chạy.',
      messageEn: 'Opened Skills — pick a skill and confirm Tokens to run.',
    }
  }

  const openMsg = {
    vi: `Đã chuyển tới tab tương ứng.`,
    en: `Navigated to the matching tab.`,
  }
  return { ok: true, tabId, messageVi: openMsg.vi, messageEn: openMsg.en }
}
