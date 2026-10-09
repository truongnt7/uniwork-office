/**
 * First-run / unactivated AI detection for My AI soft messaging.
 * Default install ships UniAI (genspark) with an empty Token Hub key — treat
 * that as “not activated” rather than a raw API-key configuration error.
 */
import type { AiSettings } from '@genoffice/ai-provider/browser'
import { uniAiOpenRouterKey } from '@genoffice/ai-provider/browser'

/** True when the active provider can actually send a request. */
export function aiSettingsReady(
  settings: AiSettings,
  opts?: { /** Managed trial / hub-only build injects key in main */ managedHub?: boolean },
): boolean {
  const provider = settings.provider
  if (opts?.managedHub && (provider === 'genspark' || provider === 'openrouter')) {
    return true
  }
  if (provider === 'codex') return true
  if (provider === 'genspark' || provider === 'openrouter') {
    return Boolean(uniAiOpenRouterKey(settings))
  }
  const cfg = settings.providers?.[provider]
  if (!cfg) return false
  if (cfg.apiKey?.trim()) return true
  // Custom OpenAI-compatible endpoints may omit a key when baseUrl is set.
  if (provider === 'custom' && cfg.baseUrl?.trim() && cfg.model?.trim()) return true
  return false
}

/** Match main-process errNoApiKey (any locale) and common English fallbacks. */
export function looksLikeMissingAiActivation(error: string): boolean {
  const e = error.trim()
  if (!e) return false
  return /API\s*[Kk]ey|api key|khóa API|API Key|未配置|未設定|API キー|API 키|clé API|API-Schlüssel|clave de API|API-ключ|مفتاح API|chave de API|chiave API|klucza API|API-sleutel|מפתח API|API कुंजी|kích hoạt|mua gói AI|not activated|purchase an AI/i.test(
    e,
  )
}

export function softAiActivationMessage(vi: boolean): string {
  return vi
    ? 'Chưa kích hoạt / mua gói AI. Hãy mua gói để dùng Trợ lý AI.'
    : 'AI is not activated. Purchase a plan to use the AI assistant.'
}

export function buyAiPlanLabel(vi: boolean): string {
  return vi ? 'Mua gói AI' : 'Buy AI plan'
}

/** Match transport / Hub “credits exhausted” and local trial soft-stop. */
export function looksLikeCreditsExhausted(error: string): boolean {
  const e = error.trim()
  if (!e) return false
  return /credits?\s*exhaust|hết\s*(credit|token)|credit.*(hết|insufficient)|insufficient\s*credit|quota|rate\s*limit.*credit/i.test(
    e,
  )
}

/** Transient network / provider blips that are safe to retry once. */
export function looksLikeRetryableAiError(error: string): boolean {
  const e = error.trim()
  if (!e) return false
  if (looksLikeMissingAiActivation(e) || looksLikeCreditsExhausted(e)) return false
  return /network|timeout|timed\s*out|overloaded|ECONN|ENOTFOUND|503|502|429|try again|thử lại|tạm thời/i.test(
    e,
  )
}

export function softCreditsMessage(
  vi: boolean,
  opts?: { trial?: boolean; remaining?: number; hubOnly?: boolean },
): string {
  if (opts?.trial) {
    const rem = Math.max(0, Math.round(opts.remaining ?? 0))
    if (opts.hubOnly) {
      return vi
        ? `Hết Credit dùng thử (còn ${rem.toLocaleString('vi-VN')}). Mua gói AI UniWork để tiếp tục.`
        : `Trial AI credits used up (${rem.toLocaleString()} left). Purchase a UniWork AI plan to continue.`
    }
    return vi
      ? `Hết Credit dùng thử (còn ${rem.toLocaleString('vi-VN')}). Mua gói AI hoặc gắn Token Hub key riêng trong Cài đặt.`
      : `Trial AI credits used up (${rem.toLocaleString()} left). Buy an AI plan or add your own Token Hub key in Settings.`
  }
  return vi
    ? 'Hết Credit / hạn mức AI. Kiểm tra Ví Credit hoặc gắn key trong Cài đặt → AI.'
    : 'AI credits exhausted. Check the Credit wallet or add a key in Settings → AI.'
}

export function retryAiLabel(vi: boolean): string {
  return vi ? 'Thử lại' : 'Retry'
}

export function openAiSettingsLabel(vi: boolean): string {
  return vi ? 'Cài đặt AI' : 'AI settings'
}
