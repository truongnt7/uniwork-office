/**
 * Phase A natural chat — only for `route.kind === 'unknown'`.
 * Clear action phrases keep the existing `routeMyAiText` → executeStep / plan path;
 * this module must never replace or short-circuit that router.
 * When unknown + Hub AI ready + opt-in (`on`), stream a short conversational reply
 * instead of the hard local fallback.
 */

import {
  OPENROUTER_CHAT_MODELS,
  type AiSettings,
} from '@genoffice/ai-provider'

/** OpenRouter catalog shown in the My AI natural-chat model picker. */
export const NATURAL_CHAT_MODEL_OPTIONS: readonly string[] = OPENROUTER_CHAT_MODELS

/** Empty / missing = use the model from Settings (AI Model pane). */
export function normalizeNaturalChatModel(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  const t = raw.trim()
  if (!t) return ''
  if ((NATURAL_CHAT_MODEL_OPTIONS as readonly string[]).includes(t)) return t
  // Allow a previously saved custom OpenRouter id
  return t.slice(0, 120)
}

/** Clone settings with an optional model override for one natural-chat turn. */
export function withNaturalChatModel(
  settings: AiSettings,
  modelOverride: string | undefined | null,
): AiSettings {
  const model = normalizeNaturalChatModel(modelOverride)
  if (!model) return settings
  const provider = settings.provider
  const cur = settings.providers?.[provider]
  if (!cur) return settings
  return {
    ...settings,
    providers: {
      ...settings.providers,
      [provider]: { ...cur, model },
    },
  }
}

/** unset = never asked; on = auto natural chat; off = local/fallback only */
export type MyAiNaturalChatPref = 'unset' | 'on' | 'off'

export function normalizeMyAiNaturalChatPref(raw: unknown): MyAiNaturalChatPref {
  if (raw === true || raw === 'on' || raw === 'true') return 'on'
  if (raw === false || raw === 'off' || raw === 'false') return 'off'
  return 'unset'
}

export function naturalChatSystemPrompt(vi: boolean, contextPackPlain: string): string {
  const pack = contextPackPlain.trim().slice(0, 2_500)
  if (vi) {
    return [
      'Bạn là uniAI — trợ lý desktop UniWork Office.',
      'Trả lời tự nhiên, ngắn (≤5 câu) bằng tiếng Việt.',
      'Chỉ dùng ngữ cảnh máy / tệp đính kèm bên dưới — không bịa tên file, lịch hay việc.',
      'Nếu thiếu thông tin: hỏi 1 câu rõ ràng.',
      'Cuối câu trả lời, gợi ý 1–2 hành động cụ thể người dùng có thể làm tiếp (soạn Word, mở file, thêm việc, mở lịch, tóm tắt file).',
      'Không nói bạn là chatbot chung; bạn giúp làm việc trên máy UniWork.',
      pack ? `\nNgữ cảnh trên máy:\n${pack}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }
  return [
    'You are uniAI — the UniWork Office desktop assistant.',
    'Reply naturally and briefly (≤5 sentences) in English.',
    'Use only the on-device context / attachments below — do not invent files, calendar items, or tasks.',
    'If information is missing: ask one clear question.',
    'End with 1–2 concrete next actions the user can take (draft Word, open a file, add a task, open calendar, summarize a file).',
    'You are not a generic chatbot; you help get work done in UniWork.',
    pack ? `\nOn-device context:\n${pack}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export function naturalChatUserPayload(
  userText: string,
  attachBlock: string | null | undefined,
): string {
  const parts = [userText.trim()]
  if (attachBlock?.trim()) parts.push(`\n\nAttachments:\n${attachBlock.trim()}`)
  return parts.join('')
}

/** Auto-stream natural chat for unknown routes when Hub AI is configured + opted in. */
export function shouldAutoNaturalChat(opts: {
  aiReady: boolean
  userText: string
  hasAttachments: boolean
  /** Must be `unknown` — clear actions stay on the router */
  routeKind?: string
  /** Settings / first-time opt-in must be `on` for automatic chat */
  naturalChatPref?: MyAiNaturalChatPref
  /** User already tapped “Clarify with AI” / first-time Enable */
  consentGranted?: boolean
  /** Local answer already covered a concrete on-device topic */
  localTopic?: string
  localContextUsed?: boolean
}): boolean {
  if (opts.routeKind !== undefined && opts.routeKind !== 'unknown') return false
  if (!opts.aiReady && !opts.consentGranted) return false
  const text = opts.userText.trim()
  if (!text && !opts.hasAttachments) return false
  // Explicit one-shot consent always chats (even if pref is off/unset)
  if (opts.consentGranted) return true
  if (opts.naturalChatPref !== 'on') return false
  // Keep strong local answers (calendar / tasks pulse) free & instant
  if (
    opts.localContextUsed &&
    opts.localTopic &&
    opts.localTopic !== 'fallback' &&
    opts.localTopic !== 'off_topic'
  ) {
    return false
  }
  return text.length >= 2 || opts.hasAttachments
}

/** Show first-time “enable natural chat?” card instead of hard fallback. */
export function shouldPromptNaturalChatOptIn(opts: {
  aiReady: boolean
  naturalChatPref: MyAiNaturalChatPref
  userText: string
  hasAttachments: boolean
  /** Must be `unknown` — clear actions stay on the router */
  routeKind?: string
  consentGranted?: boolean
  localTopic?: string
  localContextUsed?: boolean
}): boolean {
  if (opts.routeKind !== undefined && opts.routeKind !== 'unknown') return false
  if (opts.consentGranted) return false
  if (!opts.aiReady) return false
  if (opts.naturalChatPref !== 'unset') return false
  const text = opts.userText.trim()
  if (!text && !opts.hasAttachments) return false
  if (
    opts.localContextUsed &&
    opts.localTopic &&
    opts.localTopic !== 'fallback' &&
    opts.localTopic !== 'off_topic'
  ) {
    return false
  }
  return text.length >= 2 || opts.hasAttachments
}
