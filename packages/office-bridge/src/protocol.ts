import { OFFICE_LAUNCH_PATH, OFFICE_LAUNCH_SCHEME } from '@uniwork/office-bridge-contracts'

const FORBIDDEN_QUERY_KEYS = new Set([
  'jwt',
  'access_token',
  'refresh_token',
  'id_token',
  'service_role',
  'apikey',
  'api_key',
  'file',
  'path',
  'url',
  'storage',
])

export type ParseLaunchUrlResult =
  | { ok: true; token: string }
  | { ok: false; reason: string }

/**
 * Accept only `uniwork://office/open?token=<opaque>`.
 * Rejects JWTs, file paths, and extra sensitive query keys.
 */
export function parseOfficeLaunchUrl(raw: string): ParseLaunchUrlResult {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return { ok: false, reason: 'malformed' }
  }
  if (url.protocol !== `${OFFICE_LAUNCH_SCHEME}:`) {
    return { ok: false, reason: 'wrong_scheme' }
  }
  const combined = `${url.hostname}${url.pathname}`.replace(/\/+$/, '')
  const normalized = (combined.startsWith('/') ? combined : `/${combined}`).replace(/\/+/g, '/')
  if (normalized !== OFFICE_LAUNCH_PATH) {
    return { ok: false, reason: 'wrong_path' }
  }
  for (const key of url.searchParams.keys()) {
    if (FORBIDDEN_QUERY_KEYS.has(key.toLowerCase())) {
      return { ok: false, reason: 'forbidden_query' }
    }
  }
  const token = url.searchParams.get('token')
  if (!token || token.length < 16 || token.length > 256) {
    return { ok: false, reason: 'missing_token' }
  }
  if (token.includes('.') && token.split('.').length === 3) {
    return { ok: false, reason: 'jwt_shaped_token' }
  }
  if (url.searchParams.getAll('token').length !== 1) {
    return { ok: false, reason: 'duplicate_token' }
  }
  return { ok: true, token }
}

export function extractLaunchUrlFromArgv(argv: readonly string[]): string | null {
  return argv.find((arg) => arg.startsWith(`${OFFICE_LAUNCH_SCHEME}://`)) ?? null
}
