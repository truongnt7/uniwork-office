/**
 * Managed trial AI: build ships with the vendor OpenRouter key (main process
 * only). Customers never paste a key; usage is capped at a UniWork Credit
 * allowance (default 50_000). See docs/pricing/TRIAL_AI.md.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app } from 'electron'
import type { AiProviderConfig, AiProviderId, AiSettings } from '@genoffice/ai-provider'
import { isManagedAiHubOnly, managedAiModelAllowlist } from './managed-ai'

export const DEFAULT_TRIAL_CREDITS = 50_000

export interface TrialAiConfig {
  enabled: boolean
  apiKey: string
  creditAllowance: number
}

export interface TrialAiStatus {
  enabled: boolean
  creditAllowance: number
  creditUsed: number
  creditRemaining: number
  exhausted: boolean
  /** True when this install is using the managed trial key (no customer BYOK). */
  managed: boolean
  /**
   * Hub-only lock: UniAI + curated Token models only (no BYOK / other providers).
   * Used so UniWork can monetize Token margin on this build.
   */
  hubOnly: boolean
  /** Model ids customers may pick when hubOnly. */
  allowedModels: string[]
}

interface TrialUsageFile {
  version: 1
  creditUsed: number
  activatedAt: string
  updatedAt: string
}

interface PackagedTrialMeta {
  apiKey?: string
  credits?: number
}

function userDataFile(): string {
  return join(app.getPath('userData'), 'trial-ai-usage.json')
}

function readPackagedMeta(): PackagedTrialMeta | null {
  try {
    const pkgPath = join(app.getAppPath(), 'package.json')
    if (!existsSync(pkgPath)) return null
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      uniworkTrialAi?: PackagedTrialMeta
    }
    return pkg.uniworkTrialAi && typeof pkg.uniworkTrialAi === 'object' ? pkg.uniworkTrialAi : null
  } catch {
    return null
  }
}

/** Resolve trial config from env (dev) or packaged extraMetadata (trial builds). */
export function getTrialAiConfig(): TrialAiConfig {
  const envKey = (process.env.UNIWORK_TRIAL_OPENROUTER_KEY ?? '').trim()
  const meta = readPackagedMeta()
  const apiKey = envKey || (typeof meta?.apiKey === 'string' ? meta.apiKey.trim() : '')
  const envCredits = Number(process.env.UNIWORK_TRIAL_CREDITS)
  const metaCredits = typeof meta?.credits === 'number' ? meta.credits : NaN
  const creditAllowance = Number.isFinite(envCredits) && envCredits > 0
    ? Math.floor(envCredits)
    : Number.isFinite(metaCredits) && metaCredits > 0
      ? Math.floor(metaCredits)
      : DEFAULT_TRIAL_CREDITS
  return {
    enabled: apiKey.length > 0,
    apiKey,
    creditAllowance,
  }
}

function readUsageFile(): TrialUsageFile {
  try {
    const raw = readFileSync(userDataFile(), 'utf8')
    const parsed = JSON.parse(raw) as TrialUsageFile
    if (parsed?.version !== 1 || !Number.isFinite(parsed.creditUsed)) {
      return { version: 1, creditUsed: 0, activatedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    }
    return parsed
  } catch {
    return {
      version: 1,
      creditUsed: 0,
      activatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
}

function writeUsageFile(next: TrialUsageFile): void {
  const path = userDataFile()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(next, null, 2), 'utf8')
}

export function getTrialCreditUsed(): number {
  return Math.max(0, readUsageFile().creditUsed)
}

/** Record estimated UniWork Credit consumed by a completed AI turn. */
export function recordTrialCredits(credits: number): TrialAiStatus {
  const cfg = getTrialAiConfig()
  const add = Number.isFinite(credits) && credits > 0 ? credits : 0
  const prev = readUsageFile()
  const creditUsed = Math.round((prev.creditUsed + add) * 10) / 10
  writeUsageFile({
    version: 1,
    creditUsed,
    activatedAt: prev.activatedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  return getTrialAiStatus()
}

export function getTrialAiStatus(): TrialAiStatus {
  const hubOnly = isManagedAiHubOnly()
  const allowedModels = [...managedAiModelAllowlist()]
  const cfg = getTrialAiConfig()
  if (!cfg.enabled) {
    return {
      enabled: false,
      creditAllowance: 0,
      creditUsed: 0,
      creditRemaining: 0,
      exhausted: false,
      managed: false,
      hubOnly,
      allowedModels,
    }
  }
  const creditUsed = getTrialCreditUsed()
  const creditRemaining = Math.max(0, Math.round((cfg.creditAllowance - creditUsed) * 10) / 10)
  return {
    enabled: true,
    creditAllowance: cfg.creditAllowance,
    creditUsed,
    creditRemaining,
    exhausted: creditRemaining <= 0,
    managed: true,
    hubOnly,
    allowedModels,
  }
}

/**
 * Inject the managed trial OpenRouter key when the customer has not pasted
 * their own Token Hub key. Key never lands in ai-settings.json.
 */
export function withTrialAiAuth(
  settings: AiSettings,
  provider: AiProviderId,
  config: AiProviderConfig | undefined,
): AiProviderConfig | undefined {
  if (!config) return config
  if (provider !== 'genspark' && provider !== 'openrouter') return config
  if (config.apiKey?.trim()) return config
  const trial = getTrialAiConfig()
  if (!trial.enabled) return config
  return { ...config, apiKey: trial.apiKey }
}

/** Block streaming when the local trial Credit budget is exhausted. */
export function trialAiGateError(): string | null {
  const status = getTrialAiStatus()
  if (!status.enabled) return null
  if (!status.exhausted) return null
  if (status.hubOnly) {
    return `Trial AI credit exhausted (${status.creditAllowance} Credit). Purchase a UniWork AI plan to continue.`
  }
  return `Trial AI credit exhausted (${status.creditAllowance} Credit). Add your own OpenRouter key in Settings, or upgrade your UniWork plan.`
}

/** Whether settings currently rely on the managed trial key (no BYOK). */
export function isUsingManagedTrialKey(settings: AiSettings): boolean {
  const trial = getTrialAiConfig()
  if (!trial.enabled) return false
  const own =
    settings.providers?.genspark?.apiKey?.trim() ||
    settings.providers?.openrouter?.apiKey?.trim() ||
    ''
  return !own
}
