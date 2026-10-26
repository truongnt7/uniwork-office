/**
 * Trial install activation codes — gate the app until a valid code is redeemed.
 *
 * Modes:
 * - Server (recommended): UNIWORK_TRIAL_ACTIVATION_URL → 1 code = 1 deviceId
 * - Local hashes (dev / offline): packaged/env codeHashes — does NOT enforce 1 machine
 *
 * See docs/pricing/TRIAL_AI.md.
 */
import { createHash, randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app } from 'electron'

const HASH_PREFIX = 'uniwork-trial-v1:'
/** UniWork Cloud Hub (Lovable) — default when trial key is present and no URL override. */
export const DEFAULT_TRIAL_ACTIVATION_URL = 'https://uniwork-cloud-hub.lovable.app'
/** Trial window after first successful start/activation (must match Hub `TRIAL_DAYS`). */
export const TRIAL_DURATION_DAYS = 7
/** Default Credit when starting a self-serve trial (must match Hub trial plan). */
export const DEFAULT_SELF_TRIAL_CREDITS = 10_000
/** Marker stored in local activation file for self-serve trials. */
export const SELF_TRIAL_CODE_HASH = 'self-serve-trial'

function trialDurationDays(): number {
  const raw = Number((process.env.UNIWORK_TRIAL_DAYS ?? '').trim())
  if (Number.isFinite(raw) && raw > 0 && raw <= 365) return Math.floor(raw)
  return TRIAL_DURATION_DAYS
}

/** ISO expiry from activation timestamp (+ trial days). */
export function trialExpiresAtFrom(activatedAt: string, days = trialDurationDays()): string {
  const from = Date.parse(activatedAt)
  const base = Number.isFinite(from) ? from : Date.now()
  return new Date(base + days * 86400000).toISOString()
}

function isPastExpiry(expiresAt: string | undefined): boolean {
  if (!expiresAt) return false
  const exp = Date.parse(expiresAt)
  return Number.isFinite(exp) && Date.now() > exp
}

function trialKeyPresent(): boolean {
  if ((process.env.UNIWORK_TRIAL_OPENROUTER_KEY ?? '').trim()) return true
  try {
    const pkgPath = join(app.getAppPath(), 'package.json')
    if (!existsSync(pkgPath)) return false
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      uniworkTrialAi?: { apiKey?: string }
    }
    return Boolean(pkg.uniworkTrialAi?.apiKey?.trim())
  } catch {
    return false
  }
}

export interface TrialActivationStatus {
  /** Trial build that requires a code before use */
  required: boolean
  /** This install has redeemed a valid code and is still within the trial window */
  activated: boolean
  activatedAt?: string
  /** End of trial window (activatedAt + 7 days, or Hub `expiresAt`) */
  expiresAt?: string
  /** Redeemed before but past expiresAt — gate should lock entire app */
  expired?: boolean
  /** Masked code hint for UI (last 4 of normalized code), if known */
  codeHint?: string
  /** true when redeem goes through UniWork server (1 code = 1 device) */
  serverEnforced?: boolean
  /** Self-serve trial (no pre-issued code) vs license/code redeem */
  kind?: 'trial' | 'license'
  /** Credit allowance returned when starting a self-serve trial */
  creditAllowance?: number
}

interface PackagedActivationMeta {
  activationRequired?: boolean
  /** sha256 hex digests of normalizeCode(code) with HASH_PREFIX */
  codeHashes?: string[]
  /** Base URL for POST /v1/trial/activate (no trailing slash required) */
  activationUrl?: string
}

interface ActivationFile {
  version: 1
  codeHash: string
  codeHint: string
  deviceId: string
  activatedAt: string
  /** End of trial; if missing, derived from activatedAt + TRIAL_DURATION_DAYS */
  expiresAt?: string
  /** Server mode marker */
  viaServer?: boolean
}

function userDataFile(): string {
  return join(app.getPath('userData'), 'trial-activation.json')
}

function deviceIdFile(): string {
  return join(app.getPath('userData'), 'device-id.txt')
}

function readPackagedMeta(): PackagedActivationMeta | null {
  try {
    const pkgPath = join(app.getAppPath(), 'package.json')
    if (!existsSync(pkgPath)) return null
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      uniworkTrialAi?: PackagedActivationMeta & { apiKey?: string }
    }
    const t = pkg.uniworkTrialAi
    return t && typeof t === 'object' ? t : null
  } catch {
    return null
  }
}

/** Normalize customer input: strip separators, uppercase. */
export function normalizeActivationCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function hashActivationCode(raw: string): string {
  const n = normalizeActivationCode(raw)
  return createHash('sha256').update(`${HASH_PREFIX}${n}`).digest('hex')
}

/** Build-time / test helper: hash a plaintext code the same way packaging does. */
export function hashActivationCodes(codes: readonly string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const c of codes) {
    const n = normalizeActivationCode(c)
    if (n.length < 6) continue
    const h = hashActivationCode(n)
    if (seen.has(h)) continue
    seen.add(h)
    out.push(h)
  }
  return out
}

function envCodeHashes(): string[] {
  const raw = (process.env.UNIWORK_TRIAL_ACTIVATION_CODES ?? '').trim()
  if (!raw) return []
  return hashActivationCodes(raw.split(/[,\s]+/))
}

function packagedCodeHashes(): string[] {
  const meta = readPackagedMeta()
  const list = meta?.codeHashes
  if (!Array.isArray(list)) return []
  return list.filter((h) => typeof h === 'string' && /^[a-f0-9]{64}$/i.test(h))
}

/** Dev / unpackaged: bake file next to repo (also merged into package.json at dist). */
function fileCodeHashes(): string[] {
  const candidates = [
    (process.env.UNIWORK_TRIAL_ACTIVATION_HASHES_FILE ?? '').trim(),
    join(process.cwd(), 'apps/shell/build/trial-activation-hashes.json'),
    join(app.getAppPath(), 'trial-activation-hashes.json'),
  ].filter(Boolean)
  for (const p of candidates) {
    try {
      if (!existsSync(p)) continue
      const parsed = JSON.parse(readFileSync(p, 'utf8')) as { hashes?: unknown }
      const list = Array.isArray(parsed.hashes) ? parsed.hashes : []
      const hashes = list.filter(
        (h): h is string => typeof h === 'string' && /^[a-f0-9]{64}$/i.test(h),
      )
      if (hashes.length > 0) return hashes
    } catch {
      /* try next */
    }
  }
  return []
}

function allowedHashes(): string[] {
  const fromEnv = envCodeHashes()
  if (fromEnv.length > 0) return fromEnv
  const packaged = packagedCodeHashes()
  if (packaged.length > 0) return packaged
  return fileCodeHashes()
}

/** Activation API base URL (server mode). Empty = local-hash mode. */
export function getActivationServerUrl(): string {
  const envRaw = (process.env.UNIWORK_TRIAL_ACTIVATION_URL ?? '').trim()
  // Dev escape: UNIWORK_TRIAL_ACTIVATION_URL=off|local → no Cloud Hub (use local hashes).
  if (/^(off|local|none)$/i.test(envRaw)) return ''
  const env = envRaw.replace(/\/+$/, '')
  if (env) return env
  const meta = readPackagedMeta()?.activationUrl
  if (typeof meta === 'string' && meta.trim()) return meta.trim().replace(/\/+$/, '')
  // Single installer: packaged builds + managed-key builds talk to Cloud Hub by default.
  if (trialKeyPresent()) return DEFAULT_TRIAL_ACTIVATION_URL
  try {
    if (app.isPackaged) return DEFAULT_TRIAL_ACTIVATION_URL
  } catch {
    /* not in electron yet */
  }
  return ''
}

export function isActivationServerMode(): boolean {
  return getActivationServerUrl().length > 0
}

/** Stable per-install device id (not a secret). Bound to a code on the server. */
export function getDeviceId(): string {
  try {
    const path = deviceIdFile()
    if (existsSync(path)) {
      const id = readFileSync(path, 'utf8').trim()
      if (id.length >= 8) return id
    }
    const id = randomBytes(16).toString('hex')
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, id, 'utf8')
    return id
  } catch {
    return 'unknown-device'
  }
}

function readActivationFile(): ActivationFile | null {
  try {
    const raw = readFileSync(userDataFile(), 'utf8')
    const parsed = JSON.parse(raw) as ActivationFile
    if (parsed?.version !== 1 || !parsed.codeHash || !parsed.activatedAt) return null
    return parsed
  } catch {
    return null
  }
}

function writeActivationFile(next: ActivationFile): void {
  const path = userDataFile()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(next, null, 2), 'utf8')
}

function codeHintFromNormalized(normalized: string): string {
  return normalized.length <= 4 ? normalized : `••••${normalized.slice(-4)}`
}

/** Local-only redeem (shareable across machines). Off by default — use server. */
export function allowLocalActivation(): boolean {
  return (process.env.UNIWORK_TRIAL_ALLOW_LOCAL_ACTIVATION ?? '').trim() === '1'
}

/**
 * Single-installer license gate: require Hub license/trial when talking to
 * Cloud Hub (packaged or managed key), or when local trial hashes are set.
 * Opt out: UNIWORK_TRIAL_SKIP_ACTIVATION=1 or meta.activationRequired=false.
 */
export function isTrialActivationRequired(): boolean {
  if ((process.env.UNIWORK_TRIAL_SKIP_ACTIVATION ?? '').trim() === '1') return false
  const meta = readPackagedMeta()
  if (meta?.activationRequired === false) return false
  if (isActivationServerMode()) return true
  if (trialKeyPresent() && allowedHashes().length > 0) return true
  return false
}

function resolveExpiresAt(file: ActivationFile): string {
  return file.expiresAt || trialExpiresAtFrom(file.activatedAt)
}

export function isTrialActivated(): boolean {
  if (!isTrialActivationRequired()) return true
  const file = readActivationFile()
  if (!file) return false
  if (file.deviceId && file.deviceId !== getDeviceId()) return false
  if (isPastExpiry(resolveExpiresAt(file))) return false
  // Production path: only server-bound activations count (1 code / 1 self-trial = 1 device).
  if (isActivationServerMode() || !allowLocalActivation()) {
    return Boolean(file.viaServer && file.codeHash)
  }
  if (file.codeHash === SELF_TRIAL_CODE_HASH) return Boolean(file.viaServer)
  const allow = new Set(allowedHashes().map((h) => h.toLowerCase()))
  return allow.has(file.codeHash.toLowerCase())
}

export function getTrialActivationStatus(): TrialActivationStatus {
  const required = isTrialActivationRequired()
  // Treat as server-enforced unless explicitly allowing local share.
  const serverEnforced = isActivationServerMode() || !allowLocalActivation()
  if (!required) {
    return { required: false, activated: true, serverEnforced }
  }
  const file = readActivationFile()
  const expiresAt = file ? resolveExpiresAt(file) : undefined
  const expired = Boolean(file && isPastExpiry(expiresAt))
  const activated = isTrialActivated()
  const kind: 'trial' | 'license' | undefined = file
    ? file.codeHash === SELF_TRIAL_CODE_HASH || file.codeHint === 'SELF••••'
      ? 'trial'
      : 'license'
    : undefined
  return {
    required: true,
    activated,
    serverEnforced,
    ...(expired ? { expired: true } : {}),
    ...(file?.activatedAt ? { activatedAt: file.activatedAt } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    ...(file?.codeHint ? { codeHint: file.codeHint } : {}),
    ...(kind ? { kind } : {}),
  }
}

export type RedeemActivationResult =
  | { ok: true; status: TrialActivationStatus }
  | { ok: false; error: string }

/** Map server error codes → user-facing English (UI may localize). */
export function mapServerActivationError(code: string | undefined, fallback?: string): string {
  switch ((code || '').toLowerCase()) {
    case 'invalid':
    case 'not_found':
      return 'Activation code not recognized.'
    case 'already_used':
    case 'device_mismatch':
      return 'This code is already used on another device.'
    case 'seat_full':
      return 'This code has reached its device limit.'
    case 'revoked':
      return 'This activation code is no longer valid.'
    case 'expired':
      return 'This trial has expired (7-day window). Enter a license to continue.'
    case 'trial_used':
      return 'This device already used its free trial. Enter a license to continue.'
    case 'rate_limited':
      return 'Too many attempts. Try again later.'
    case 'bad_device':
      return 'This install could not identify the device. Reinstall and try again.'
    default:
      return fallback?.trim() || 'Could not activate. Check your connection and try again.'
  }
}

/**
 * POST /v1/trial/activate
 * Body: { code, deviceId, codeHash }
 * OK:   { ok: true, activatedAt?: string }
 * Fail: { ok: false, error: 'invalid'|'already_used'|…, message?: string }
 */
export async function redeemViaServer(
  normalizedCode: string,
  deviceId: string,
): Promise<RedeemActivationResult> {
  const base = getActivationServerUrl()
  if (!base) return { ok: false, error: 'Activation server is not configured.' }
  const codeHash = hashActivationCode(normalizedCode)
  try {
    const res = await fetch(`${base}/v1/trial/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        code: normalizedCode,
        codeHash,
        deviceId,
      }),
    })
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      error?: string
      message?: string
      activatedAt?: string
      expiresAt?: string | null
    }
    if (!res.ok || body.ok !== true) {
      return {
        ok: false,
        error: mapServerActivationError(body.error, body.message || `HTTP ${res.status}`),
      }
    }
    const activatedAt = body.activatedAt || new Date().toISOString()
    const expiresAt =
      typeof body.expiresAt === 'string' && body.expiresAt
        ? body.expiresAt
        : trialExpiresAtFrom(activatedAt)
    writeActivationFile({
      version: 1,
      codeHash,
      codeHint: codeHintFromNormalized(normalizedCode),
      deviceId,
      activatedAt,
      expiresAt,
      viaServer: true,
    })
    return { ok: true, status: getTrialActivationStatus() }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Network error: ${msg}` }
  }
}

function redeemLocally(normalizedCode: string, deviceId: string): RedeemActivationResult {
  const codeHash = hashActivationCode(normalizedCode)
  const allow = allowedHashes().map((h) => h.toLowerCase())
  if (!allow.includes(codeHash.toLowerCase())) {
    return { ok: false, error: 'Activation code not recognized.' }
  }
  const activatedAt = new Date().toISOString()
  writeActivationFile({
    version: 1,
    codeHash,
    codeHint: codeHintFromNormalized(normalizedCode),
    deviceId,
    activatedAt,
    expiresAt: trialExpiresAtFrom(activatedAt),
    viaServer: false,
  })
  return { ok: true, status: getTrialActivationStatus() }
}

export async function redeemTrialActivationCode(raw: string): Promise<RedeemActivationResult> {
  if (!isTrialActivationRequired()) {
    return { ok: true, status: getTrialActivationStatus() }
  }
  const normalized = normalizeActivationCode(raw)
  if (normalized.length < 6) {
    return { ok: false, error: 'Invalid activation code.' }
  }
  const deviceId = getDeviceId()
  if (isActivationServerMode()) {
    return redeemViaServer(normalized, deviceId)
  }
  // Default: refuse offline redeem so one code cannot unlock many machines.
  if (!allowLocalActivation()) {
    return {
      ok: false,
      error:
        'Online activation required. Each license works on one device only. Set UNIWORK_TRIAL_ACTIVATION_URL (or ask UniWork for the license server).',
    }
  }
  return redeemLocally(normalized, deviceId)
}

/**
 * Start the free 7-day Office + AI trial for this device (no pre-issued code).
 * Hub: POST /v1/trial/start — one trial per device; expiry locks the whole app.
 */
export async function startDeviceTrial(): Promise<RedeemActivationResult> {
  if (!isTrialActivationRequired()) {
    return { ok: true, status: getTrialActivationStatus() }
  }
  if (isTrialActivated()) {
    return { ok: true, status: getTrialActivationStatus() }
  }
  const base = getActivationServerUrl()
  if (!base) {
    return {
      ok: false,
      error:
        'Online trial start required. Connect to UniWork Cloud Hub (or set UNIWORK_TRIAL_ACTIVATION_URL).',
    }
  }
  const deviceId = getDeviceId()
  try {
    const res = await fetch(`${base}/v1/trial/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ deviceId }),
    })
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      error?: string
      message?: string
      activatedAt?: string
      expiresAt?: string | null
      creditAllowance?: number
    }
    if (!res.ok || body.ok !== true) {
      return {
        ok: false,
        error: mapServerActivationError(body.error, body.message || `HTTP ${res.status}`),
      }
    }
    const activatedAt = body.activatedAt || new Date().toISOString()
    const expiresAt =
      typeof body.expiresAt === 'string' && body.expiresAt
        ? body.expiresAt
        : trialExpiresAtFrom(activatedAt)
    writeActivationFile({
      version: 1,
      codeHash: SELF_TRIAL_CODE_HASH,
      codeHint: 'SELF••••',
      deviceId,
      activatedAt,
      expiresAt,
      viaServer: true,
    })
    const status = getTrialActivationStatus()
    const creditAllowance =
      typeof body.creditAllowance === 'number' && body.creditAllowance > 0
        ? Math.floor(body.creditAllowance)
        : DEFAULT_SELF_TRIAL_CREDITS
    return { ok: true, status: { ...status, creditAllowance, kind: 'trial' } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Network error: ${msg}` }
  }
}

/** Block entire app (and AI) until licensed or inside an active trial. */
export function trialActivationGateError(): string | null {
  if (!isTrialActivationRequired()) return null
  if (isTrialActivated()) return null
  const st = getTrialActivationStatus()
  if (st.expired) {
    return 'Your UniWork trial has ended. Enter a license to unlock Office and AI.'
  }
  return 'Enter a UniWork license or start the 7-day free trial to use this install.'
}
