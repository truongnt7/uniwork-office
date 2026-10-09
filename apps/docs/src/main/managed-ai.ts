/**
 * Managed (hub-only) AI lock — UniWork Token margin builds.
 * Forces UniAI + curated OpenRouter catalog; blocks BYOK / other providers.
 * See docs/pricing/TRIAL_AI.md.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import {
  OPENROUTER_CHAT_MODELS,
  OPENROUTER_DEFAULT_MODEL,
  type AiSettings,
} from '@genoffice/ai-provider'

export type ManagedAiModelId = (typeof OPENROUTER_CHAT_MODELS)[number]

interface PackagedManagedMeta {
  hubOnly?: boolean
  /** Optional subset of OPENROUTER_CHAT_MODELS; omit = full curated catalog */
  models?: string[]
}

function readPackagedMeta(): PackagedManagedMeta | null {
  try {
    const pkgPath = join(app.getAppPath(), 'package.json')
    if (!existsSync(pkgPath)) return null
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      uniworkManagedAi?: PackagedManagedMeta
    }
    return pkg.uniworkManagedAi && typeof pkg.uniworkManagedAi === 'object'
      ? pkg.uniworkManagedAi
      : null
  } catch {
    return null
  }
}

const CATALOG = new Set<string>(OPENROUTER_CHAT_MODELS)

/** Allowed chat model ids for hub-only builds. */
export function managedAiModelAllowlist(): readonly string[] {
  const meta = readPackagedMeta()
  const fromEnv = (process.env.UNIWORK_MANAGED_AI_MODELS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const raw = fromEnv.length > 0 ? fromEnv : meta?.models
  if (raw && raw.length > 0) {
    const filtered = raw.filter((m) => CATALOG.has(m))
    if (filtered.length > 0) return filtered
  }
  return OPENROUTER_CHAT_MODELS
}

/**
 * True when this install must stay on UniWork Token Hub models only.
 * Trial packaging sets `uniworkManagedAi.hubOnly` (see electron-builder.cjs).
 * Dev: UNIWORK_MANAGED_AI=1. Opt out: UNIWORK_ALLOW_BYOK=1.
 */
export function isManagedAiHubOnly(): boolean {
  if ((process.env.UNIWORK_ALLOW_BYOK ?? '').trim() === '1') return false
  if ((process.env.UNIWORK_MANAGED_AI ?? '').trim() === '1') return true
  const meta = readPackagedMeta()
  return meta?.hubOnly === true
}

export function clampModelToManagedAllowlist(model: string | undefined): string {
  const allow = managedAiModelAllowlist()
  const m = (model ?? '').trim()
  if (m && allow.includes(m)) return m
  if (allow.includes(OPENROUTER_DEFAULT_MODEL)) return OPENROUTER_DEFAULT_MODEL
  return allow[0] ?? OPENROUTER_DEFAULT_MODEL
}

/** Force UniAI provider + allowlisted model; strip customer hub keys from the file view. */
export function clampSettingsToManagedHub(settings: AiSettings): AiSettings {
  const model = clampModelToManagedAllowlist(
    settings.providers?.genspark?.model || settings.providers?.openrouter?.model,
  )
  const genspark = {
    ...(settings.providers?.genspark ?? { apiKey: '', model }),
    model,
    apiKey: '',
    baseUrl: undefined,
  }
  const openrouter = {
    ...(settings.providers?.openrouter ?? { apiKey: '', model }),
    model,
    apiKey: '',
    baseUrl: undefined,
  }
  return {
    ...settings,
    provider: 'genspark',
    gskToolsEnabled: true,
    providers: {
      ...settings.providers,
      genspark,
      openrouter,
    },
  }
}

export function managedAiGateError(provider: string): string | null {
  if (!isManagedAiHubOnly()) return null
  if (provider === 'genspark' || provider === 'openrouter') return null
  return 'This UniWork build only supports UniAI Token models. Other providers are disabled.'
}
