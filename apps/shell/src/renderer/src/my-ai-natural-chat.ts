/**
 * Phase A natural chat — only for `route.kind === 'unknown'`.
 * Clear action phrases keep the existing `routeMyAiText` → executeStep / plan path;
 * this module must never replace or short-circuit that router.
 * When unknown + Hub AI ready + opt-in (`on`), stream a short conversational reply
 * instead of the hard local fallback.
 */

import {
  OPENROUTER_CHAT_MODELS,
  type AiProviderId,
  type AiSettings,
} from '@genoffice/ai-provider/browser'

/** OpenRouter catalog shown in the My AI natural-chat model picker. */
export const NATURAL_CHAT_MODEL_OPTIONS: readonly string[] = OPENROUTER_CHAT_MODELS

/** Short labels for the picker (fallback: bare OpenRouter id). */
const NATURAL_CHAT_MODEL_LABELS: Record<string, string> = {
  'openrouter/auto': 'Auto (OpenRouter)',
  'anthropic/claude-opus-5.5': 'Claude Opus 5.5',
  'anthropic/claude-sonnet-5.5': 'Claude Sonnet 5.5',
  'anthropic/claude-sonnet-5': 'Claude Sonnet 5',
  'anthropic/claude-opus-5': 'Claude Opus 5',
  'anthropic/claude-haiku-5.5': 'Claude Haiku 5.5',
  'anthropic/claude-fable-5.1': 'Claude Fable 5.1',
  'openai/gpt-5.6-sol': 'GPT-5.6 Sol',
  'openai/gpt-5.6-terra': 'GPT-5.6 Terra',
  'openai/gpt-5.6-luna': 'GPT-5.6 Luna',
  'google/gemini-3.8-flash': 'Gemini 3.8 Flash',
  'google/gemini-3.7-flash': 'Gemini 3.7 Flash',
  'google/gemini-3.1-pro-preview': 'Gemini 3.1 Pro',
  'deepseek/deepseek-v4-pro': 'DeepSeek V4 Pro',
  'deepseek/deepseek-v4-flash': 'DeepSeek V4 Flash',
  'deepseek/deepseek-v4.1-flash': 'DeepSeek V4.1 Flash',
  'moonshotai/kimi-k3': 'Kimi K3',
  'moonshotai/kimi-k2.7-code': 'Kimi K2.7 Code',
  'z-ai/glm-5.3': 'GLM 5.3',
  'z-ai/glm-5.3-flash': 'GLM 5.3 Flash',
  'qwen/qwen3.8-max-prime': 'Qwen 3.8 Max',
  'qwen/qwen3.8-flash': 'Qwen 3.8 Flash',
  'x-ai/grok-4.7': 'Grok 4.7',
  'x-ai/grok-4.6': 'Grok 4.6',
  'minimax/minimax-m3': 'MiniMax M3',
  'mistralai/mistral-large-4-0': 'Mistral Large 4',
  'mistralai/mistral-medium-3-5': 'Mistral Medium 3.5',
}

export function naturalChatModelLabel(modelId: string): string {
  return NATURAL_CHAT_MODEL_LABELS[modelId] ?? modelId
}

/** Map OpenRouter vendor-prefixed id → AI provider logo id. */
export function naturalChatModelProviderId(modelId: string): AiProviderId {
  const id = modelId.trim().toLowerCase()
  if (!id || id === 'openrouter/auto' || id.startsWith('openrouter/')) return 'openrouter'
  const vendor = id.split('/')[0] ?? ''
  switch (vendor) {
    case 'anthropic':
      return 'anthropic'
    case 'openai':
      return 'openai'
    case 'google':
      return 'gemini'
    case 'deepseek':
      return 'deepseek'
    case 'moonshotai':
      return 'kimi'
    case 'z-ai':
    case 'zhipu':
      return 'glm'
    case 'qwen':
      return 'qwen'
    case 'x-ai':
      return 'xai'
    case 'minimax':
      return 'minimax'
    case 'mistralai':
      return 'mistral'
    case 'doubao':
    case 'bytedance':
      return 'doubao'
    default:
      return 'openrouter'
  }
}

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
