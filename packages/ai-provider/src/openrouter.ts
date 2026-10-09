/**
 * OpenRouter Token Hub helpers — key status / remaining limit via GET /api/v1/key.
 * Chat itself already uses the openai-compatible adapter at openrouter.ai/api/v1.
 */

export const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1'
export const OPENROUTER_CREDITS_URL = 'https://openrouter.ai/settings/credits'
export const OPENROUTER_KEYS_URL = 'https://openrouter.ai/settings/keys'

/**
 * Shared catalog for UniAI (genspark id), the explicit OpenRouter provider,
 * and My AI natural-chat model picker. Ids match openrouter.ai/api/v1/models
 * (curated 2026-10 — latest flagship + fast tiers per vendor; no :batch).
 */
export const OPENROUTER_CHAT_MODELS = [
  'openrouter/auto',
  // Anthropic
  'anthropic/claude-opus-5.5',
  'anthropic/claude-sonnet-5.5',
  'anthropic/claude-sonnet-5',
  'anthropic/claude-opus-5',
  'anthropic/claude-haiku-5.5',
  'anthropic/claude-fable-5.1',
  // OpenAI
  'openai/gpt-5.6-sol',
  'openai/gpt-5.6-terra',
  'openai/gpt-5.6-luna',
  // Google
  'google/gemini-3.8-flash',
  'google/gemini-3.7-flash',
  'google/gemini-3.1-pro-preview',
  // DeepSeek
  'deepseek/deepseek-v4-pro',
  'deepseek/deepseek-v4-flash',
  'deepseek/deepseek-v4.1-flash',
  // Moonshot / Kimi
  'moonshotai/kimi-k3',
  'moonshotai/kimi-k2.7-code',
  // Zhipu GLM
  'z-ai/glm-5.3',
  'z-ai/glm-5.3-flash',
  // Qwen
  'qwen/qwen3.8-max-prime',
  'qwen/qwen3.8-flash',
  // xAI Grok
  'x-ai/grok-4.7',
  'x-ai/grok-4.6',
  // MiniMax
  'minimax/minimax-m3',
  // Mistral
  'mistralai/mistral-large-4-0',
  'mistralai/mistral-medium-3-5',
] as const

export const OPENROUTER_DEFAULT_MODEL = 'openrouter/auto'

export interface OpenRouterKeyStatus {
  ok: boolean
  error?: string
  label?: string
  usage?: number
  usageDaily?: number
  usageWeekly?: number
  usageMonthly?: number
  limit?: number | null
  limitRemaining?: number | null
  limitReset?: string | null
  isFreeTier?: boolean
  /** Short UI line, e.g. "Remaining $12.50 · usage $3.20" */
  summary?: string
}

/** Optional ranking headers OpenRouter documents for app attribution. */
export function openRouterAttributionHeaders(baseUrl?: string): Record<string, string> {
  if (!baseUrl?.includes('openrouter.ai')) return {}
  return {
    'HTTP-Referer': 'https://uniwork.app',
    'X-Title': 'UniWork Office',
  }
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function money(n: number): string {
  return `$${n.toFixed(2)}`
}

export function formatOpenRouterKeySummary(data: {
  limitRemaining?: number | null
  limit?: number | null
  usage?: number
  isFreeTier?: boolean
}): string {
  const parts: string[] = []
  if (data.limitRemaining != null && Number.isFinite(data.limitRemaining)) {
    parts.push(`Remaining ${money(data.limitRemaining)}`)
  } else if (data.limit == null) {
    parts.push('No key limit')
  }
  if (data.usage != null && Number.isFinite(data.usage)) {
    parts.push(`usage ${money(data.usage)}`)
  }
  if (data.isFreeTier) parts.push('free tier')
  return parts.join(' · ') || 'Key OK'
}

/**
 * Probe the current OpenRouter API key (not a management key).
 * https://openrouter.ai/docs/api/api-reference/api-keys/get-current-api-key
 */
export async function probeOpenRouterKey(
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<OpenRouterKeyStatus> {
  const key = apiKey.trim()
  if (!key) return { ok: false, error: 'missing-api-key' }
  try {
    const res = await fetchImpl(`${OPENROUTER_API_BASE}/key`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        ...openRouterAttributionHeaders(OPENROUTER_API_BASE),
      },
    })
    const text = await res.text()
    let json: { data?: Record<string, unknown>; error?: { message?: string } } = {}
    try {
      json = JSON.parse(text) as typeof json
    } catch {
      return { ok: false, error: `HTTP ${res.status}: non-JSON` }
    }
    if (!res.ok) {
      const msg =
        typeof json.error?.message === 'string' ? json.error.message : `HTTP ${res.status}`
      return { ok: false, error: msg }
    }
    const d = (json.data && typeof json.data === 'object' ? json.data : json) as Record<
      string,
      unknown
    >
    const usage = num(d.usage)
    const limit = d.limit === null ? null : (num(d.limit) ?? null)
    const limitRemaining = d.limit_remaining === null ? null : (num(d.limit_remaining) ?? null)
    const status: OpenRouterKeyStatus = {
      ok: true,
      label: typeof d.label === 'string' ? d.label : undefined,
      usage,
      usageDaily: num(d.usage_daily),
      usageWeekly: num(d.usage_weekly),
      usageMonthly: num(d.usage_monthly),
      limit,
      limitRemaining,
      limitReset: typeof d.limit_reset === 'string' ? d.limit_reset : null,
      isFreeTier: d.is_free_tier === true,
    }
    status.summary = formatOpenRouterKeySummary(status)
    return status
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
