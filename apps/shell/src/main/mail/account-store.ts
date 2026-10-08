import { randomUUID } from 'node:crypto'
import { readFileSync, renameSync, unlinkSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { safeStorage } from 'electron'
import type { MailAccountPublic, MailConnectInput, MailProviderKind } from '../../shared/mail-api'
import { resolveEndpoints, validateEndpoints } from './presets'

interface StoredAccount {
  public: MailAccountPublic
  /** safeStorage ciphertext as base64, or legacy plain marker */
  passwordEnc: string
}

function accountPath(userData: string): string {
  return join(userData, 'mail', 'account.json')
}

function readStored(userData: string): StoredAccount | null {
  const path = accountPath(userData)
  if (!existsSync(path)) return null
  try {
    const raw: unknown = JSON.parse(readFileSync(path, 'utf8'))
    if (!raw || typeof raw !== 'object') return null
    const obj = raw as { public?: unknown; passwordEnc?: unknown }
    if (!obj.public || typeof obj.public !== 'object') return null
    if (typeof obj.passwordEnc !== 'string' || !obj.passwordEnc) return null
    const pub = obj.public as MailAccountPublic
    if (typeof pub.email !== 'string' || typeof pub.id !== 'string') return null
    return { public: pub, passwordEnc: obj.passwordEnc }
  } catch {
    return null
  }
}

function writeStored(userData: string, stored: StoredAccount): void {
  const path = accountPath(userData)
  mkdirSync(dirname(path), { recursive: true })
  const temp = `${path}.${process.pid}.${randomUUID()}.tmp`
  writeFileSync(temp, JSON.stringify(stored, null, 2), { encoding: 'utf8', flag: 'wx', flush: true })
  try {
    renameSync(temp, path)
  } catch (err) {
    try {
      unlinkSync(temp)
    } catch {
      /* ignore */
    }
    throw err
  }
}

function encryptPassword(password: string): string {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(password).toString('base64')
  }
  // Dev / headless fallback — still better than nothing; UI warns when encryption is off.
  return `plain:${Buffer.from(password, 'utf8').toString('base64')}`
}

function decryptPassword(enc: string): string {
  if (enc.startsWith('plain:')) {
    return Buffer.from(enc.slice('plain:'.length), 'base64').toString('utf8')
  }
  return safeStorage.decryptString(Buffer.from(enc, 'base64'))
}

export function getMailAccount(userData: string): MailAccountPublic | null {
  return readStored(userData)?.public ?? null
}

export function getMailCredentials(
  userData: string,
): { account: MailAccountPublic; password: string } | null {
  const stored = readStored(userData)
  if (!stored) return null
  try {
    return { account: stored.public, password: decryptPassword(stored.passwordEnc) }
  } catch {
    return null
  }
}

export function saveMailAccount(
  userData: string,
  input: MailConnectInput,
): { ok: true; account: MailAccountPublic } | { ok: false; error: string } {
  const email = input.email.trim()
  const password = input.password
  if (!email || !email.includes('@')) return { ok: false, error: 'Enter a valid email address' }
  if (!password) return { ok: false, error: 'Password / app password is required' }

  const kind: MailProviderKind = input.kind
  const endpoints = resolveEndpoints(kind, input)
  const epErr = validateEndpoints(endpoints)
  if (epErr) return { ok: false, error: epErr }

  const existing = readStored(userData)
  const now = new Date().toISOString()
  const account: MailAccountPublic = {
    id: existing?.public.id ?? randomUUID(),
    kind,
    email,
    ...(input.displayName?.trim() ? { displayName: input.displayName.trim() } : {}),
    ...endpoints,
    connectedAt: existing?.public.connectedAt ?? now,
    ...(existing?.public.lastSyncAt ? { lastSyncAt: existing.public.lastSyncAt } : {}),
  }

  writeStored(userData, {
    public: account,
    passwordEnc: encryptPassword(password),
  })
  return { ok: true, account }
}

export function touchMailSync(userData: string, at = new Date().toISOString()): MailAccountPublic | null {
  const stored = readStored(userData)
  if (!stored) return null
  const next = { ...stored, public: { ...stored.public, lastSyncAt: at } }
  writeStored(userData, next)
  return next.public
}

export function clearMailAccount(userData: string): void {
  const path = accountPath(userData)
  try {
    unlinkSync(path)
  } catch {
    /* missing is fine */
  }
}

export function mailEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}
