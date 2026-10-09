/**
 * LLM classify layer for My AI — maps fuzzy NL → MyAiRoute when the keyword
 * router is unsure. Falls back to the keyword route on any failure.
 */
import { createAgentIntent, isWorkbenchModuleId, type AgentIntentAction } from '@uniwork/practice-core'
import type { AiSettings } from '@genoffice/ai-provider/browser'
import {
  isSubstantiveCreateBrief,
  synthesizePlanGoal,
  type MyAiRoute,
  type MyAiStep,
  type OfficeApp,
} from './my-ai-router'

const OFFICE_APPS: readonly OfficeApp[] = ['docs', 'sheets', 'slides', 'pdf']
const WB_ACTIONS: readonly AgentIntentAction[] = [
  'open',
  'add_item',
  'summarize',
  'run_skill',
  'navigate',
]

export type ClassifyJson = {
  kind?: string
  app?: string
  blank?: boolean
  brief?: string
  query?: string
  limit?: number
  workbenchModule?: string
  workbenchAction?: string
  steps?: ClassifyJson[]
  goalVi?: string
  goalEn?: string
  hintVi?: string
  hintEn?: string
}

/** Keyword routes that already understood the user — skip Token classify. */
export function shouldAttemptLlmClassify(route: MyAiRoute): boolean {
  if (route.kind === 'unknown') return true
  if (route.kind === 'ask_create') return true
  if (route.kind === 'plan' && route.playbookId) return false
  if (route.kind === 'fill_form' || route.kind === 'fill_template') return false
  if (route.kind === 'create_file') {
    if (route.blank) return false
    return !isSubstantiveCreateBrief(route.brief ?? '')
  }
  return false
}

/**
 * Strong on-device local answers (morning brief, calendar, tasks…) — skip classify
 * so we do not burn trial Credit before the free local reply.
 */
export function shouldSkipClassifyForLocalTopic(
  topic: string | undefined | null,
): boolean {
  if (!topic) return false
  return (
    topic === 'brief' ||
    topic === 'pulse' ||
    topic === 'calendar' ||
    topic === 'tasks' ||
    topic === 'notes' ||
    topic === 'email' ||
    topic === 'recents' ||
    topic === 'plan'
  )
}

export function classifySystemPrompt(vi: boolean, contextPlain: string): string {
  const pack = contextPlain.trim().slice(0, 2_200)
  const common = [
    'You are the UniWork Office My AI router.',
    'Map the user message to ONE JSON object (no markdown, no commentary).',
    'Allowed kind values:',
    'create_file | ask_create | open_file | search_files | summarize_recents | summarize_attachments | summarize_active | continue_active | workbench | plan | unknown',
    'Fields by kind:',
    '- create_file: app (docs|sheets|slides|pdf), blank (bool), brief (string, topic to draft)',
    '- ask_create: app',
    '- open_file / search_files: query',
    '- summarize_recents: optional query, limit (default 8)',
    '- summarize_attachments | summarize_active: no extra fields',
    '- continue_active: optional brief (instruction for the open Office tab)',
    '- workbench: workbenchModule (tasks|calendar|notes|email|clients|…), workbenchAction (add_item|open|summarize|navigate)',
    '- plan: steps (2–4 of the above kinds), goalVi, goalEn (one user-facing goal, not a step list)',
    '- unknown: when it is only casual chat / unclear (hintVi/hintEn optional)',
    'Prefer concrete office/workbench actions over unknown when the user wants to create, open, summarize, continue, or add a task/reminder.',
    'If they want a document but gave no topic → ask_create, not create_file with empty brief.',
    'If they want a blank document → create_file blank:true.',
    pack ? `On-device context:\n${pack}` : '',
  ]
  if (vi) {
    return [
      ...common,
      'User language is often Vietnamese; keep brief/query/goals in the user language.',
    ]
      .filter(Boolean)
      .join('\n')
  }
  return common.filter(Boolean).join('\n')
}

export function extractClassifyJson(text: string): ClassifyJson | null {
  const raw = text.trim()
  if (!raw) return null
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = (fenced?.[1] ?? raw).trim()
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    const parsed: unknown = JSON.parse(body.slice(start, end + 1))
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as ClassifyJson
  } catch {
    return null
  }
}

function asApp(v: unknown): OfficeApp | null {
  return typeof v === 'string' && (OFFICE_APPS as readonly string[]).includes(v)
    ? (v as OfficeApp)
    : null
}

function asWbAction(v: unknown): AgentIntentAction | null {
  return typeof v === 'string' && (WB_ACTIONS as readonly string[]).includes(v)
    ? (v as AgentIntentAction)
    : null
}

function parseStep(raw: ClassifyJson, userText: string): MyAiStep | null {
  const kind = typeof raw.kind === 'string' ? raw.kind : ''
  switch (kind) {
    case 'create_file': {
      const app = asApp(raw.app)
      if (!app) return null
      const blank = raw.blank === true
      const brief = typeof raw.brief === 'string' ? raw.brief.trim() : ''
      if (blank) return { kind: 'create_file', app, blank: true }
      if (!isSubstantiveCreateBrief(brief)) return { kind: 'ask_create', app }
      return { kind: 'create_file', app, blank: false, brief }
    }
    case 'ask_create': {
      const app = asApp(raw.app)
      return app ? { kind: 'ask_create', app } : null
    }
    case 'open_file': {
      const query = typeof raw.query === 'string' ? raw.query.trim() : ''
      return query ? { kind: 'open_file', query } : null
    }
    case 'search_files': {
      const query = typeof raw.query === 'string' ? raw.query.trim() : userText.trim()
      return query ? { kind: 'search_files', query } : null
    }
    case 'summarize_recents': {
      const query = typeof raw.query === 'string' ? raw.query.trim() : ''
      const limit =
        typeof raw.limit === 'number' && Number.isFinite(raw.limit)
          ? Math.min(20, Math.max(1, Math.floor(raw.limit)))
          : 8
      return {
        kind: 'summarize_recents',
        limit,
        ...(query ? { query } : {}),
      }
    }
    case 'summarize_attachments':
      return { kind: 'summarize_attachments' }
    case 'summarize_active':
      return { kind: 'summarize_active' }
    case 'continue_active': {
      const brief = typeof raw.brief === 'string' ? raw.brief.trim() : ''
      return {
        kind: 'continue_active',
        ...(brief.length >= 4 ? { brief } : {}),
      }
    }
    case 'workbench': {
      const mod = raw.workbenchModule
      if (!isWorkbenchModuleId(mod)) return null
      const action = asWbAction(raw.workbenchAction) ?? 'open'
      return {
        kind: 'workbench',
        intent: createAgentIntent({
          target: { kind: 'module', id: mod },
          action,
          scope: 'local',
          source: 'desktop',
          requireConsent: false,
          summary:
            action === 'add_item'
              ? `Add ${mod}`
              : action === 'summarize'
                ? `Summarize ${mod}`
                : `Open ${mod}`,
          text: userText,
        }),
      }
    }
    default:
      return null
  }
}

/** Convert model JSON → MyAiRoute; null if unusable. */
export function routeFromClassifyJson(raw: ClassifyJson, userText: string): MyAiRoute | null {
  const kind = typeof raw.kind === 'string' ? raw.kind : ''
  if (kind === 'unknown' || kind === 'chat') {
    return {
      kind: 'unknown',
      hintVi:
        typeof raw.hintVi === 'string' && raw.hintVi.trim()
          ? raw.hintVi.trim()
          : 'Mình chưa chắc lệnh — nói rõ hơn giúp nhé.',
      hintEn:
        typeof raw.hintEn === 'string' && raw.hintEn.trim()
          ? raw.hintEn.trim()
          : 'I’m not sure what to run — please clarify.',
    }
  }
  if (kind === 'plan') {
    if (!Array.isArray(raw.steps) || raw.steps.length < 2) return null
    const steps: MyAiStep[] = []
    for (const s of raw.steps.slice(0, 4)) {
      if (!s || typeof s !== 'object') continue
      const step = parseStep(s, userText)
      if (step) steps.push(step)
    }
    if (steps.length < 2) return null
    const goals = synthesizePlanGoal(steps)
    return {
      kind: 'plan',
      steps,
      goalVi:
        typeof raw.goalVi === 'string' && raw.goalVi.trim() ? raw.goalVi.trim() : goals.goalVi,
      goalEn:
        typeof raw.goalEn === 'string' && raw.goalEn.trim() ? raw.goalEn.trim() : goals.goalEn,
      summaryVi:
        typeof raw.goalVi === 'string' && raw.goalVi.trim() ? raw.goalVi.trim() : goals.goalVi,
      summaryEn:
        typeof raw.goalEn === 'string' && raw.goalEn.trim() ? raw.goalEn.trim() : goals.goalEn,
    }
  }
  const step = parseStep(raw, userText)
  return step
}

export async function classifyMyAiRoute(opts: {
  userText: string
  contextPlain: string
  vi: boolean
  hasAttachments: boolean
  settings?: AiSettings
  /** Injected for tests */
  chat?: (input: {
    system: string
    user: string
    settings?: AiSettings
  }) => Promise<{ ok: boolean; content?: string; error?: string }>
}): Promise<MyAiRoute | null> {
  const text = opts.userText.trim()
  if (!text) return null
  const chat = opts.chat ?? ((input) => window.aiOffice.aiChat(input))
  const user = [
    text,
    opts.hasAttachments ? '\n(User attached file(s) in this turn.)' : '',
  ]
    .filter(Boolean)
    .join('')
  try {
    const result = await chat({
      system: classifySystemPrompt(opts.vi, opts.contextPlain),
      user,
      ...(opts.settings ? { settings: opts.settings } : {}),
    })
    if (!result.ok || !result.content?.trim()) return null
    const json = extractClassifyJson(result.content)
    if (!json) return null
    return routeFromClassifyJson(json, text)
  } catch {
    return null
  }
}
