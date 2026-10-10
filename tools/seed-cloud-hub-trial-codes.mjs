#!/usr/bin/env node
/**
 * Seed UniWork Cloud Hub with the Office trial activation hash batch.
 *
 * Prefers one-shot bootstrap (empty DB):
 *   POST {URL}/v1/bootstrap/trial-codes
 *
 * Fallback (admin JWT):
 *   UNIWORK_CLOUD_ADMIN_TOKEN=… node tools/seed-cloud-hub-trial-codes.mjs
 *
 * Usage:
 *   node tools/seed-cloud-hub-trial-codes.mjs
 *   UNIWORK_TRIAL_ACTIVATION_URL=https://… node tools/seed-cloud-hub-trial-codes.mjs
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const DEFAULT_URL = 'https://uniwork-cloud-hub.lovable.app'
const base = (
  process.env.UNIWORK_TRIAL_ACTIVATION_URL ||
  process.env.UNIWORK_CLOUD_HUB_URL ||
  DEFAULT_URL
)
  .trim()
  .replace(/\/+$/, '')

function normalize(code) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function hashCode(code) {
  return createHash('sha256').update(`uniwork-trial-v1:${normalize(code)}`).digest('hex')
}

function hint(code) {
  const n = normalize(code)
  return `••••${n.slice(-4)}`
}

function loadHashes() {
  const txtPath = resolve(root, 'docs/pricing/trial-activation-codes-100.txt')
  if (existsSync(txtPath)) {
    const codes = readFileSync(txtPath, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const m = l.match(/^\d+\s+(\S+)/)
        return m ? m[1] : l
      })
      .filter((c) => normalize(c).length >= 6)
    return codes.map((c) => ({ codeHash: hashCode(c), codeHint: hint(c) }))
  }
  const hashPath = resolve(root, 'apps/shell/build/trial-activation-hashes.json')
  const parsed = JSON.parse(readFileSync(hashPath, 'utf8'))
  const list = Array.isArray(parsed.hashes) ? parsed.hashes : []
  return list
    .filter((h) => typeof h === 'string' && /^[a-f0-9]{64}$/i.test(h))
    .map((h) => ({ codeHash: h.toLowerCase(), codeHint: '••••????' }))
}

const hashes = loadHashes()
if (hashes.length === 0) {
  console.error('No trial hashes/codes found to seed.')
  process.exit(1)
}

const body = { hashes, batch: 'uwtrial-100' }
const adminToken = (process.env.UNIWORK_CLOUD_ADMIN_TOKEN || '').trim()

async function post(path, headers = {}) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

console.log(`Cloud Hub: ${base}`)
console.log(`Hashes: ${hashes.length}`)

let result = await post('/v1/bootstrap/trial-codes')
if (result.status === 404) {
  console.log('Bootstrap route not deployed yet — retry after Lovable sync.')
  console.log(JSON.stringify(result.json))
  process.exit(2)
}

if (result.json?.ok) {
  console.log(`Bootstrap OK — inserted ${result.json.inserted}`)
  process.exit(0)
}

if (result.json?.error === 'already_seeded') {
  console.log(`Already seeded (count=${result.json.count}). Nothing to do.`)
  process.exit(0)
}

if (adminToken) {
  console.log('Bootstrap refused — trying admin batch…')
  result = await post('/v1/admin/codes/batch', {
    Authorization: `Bearer ${adminToken}`,
  })
  if (result.json?.ok) {
    console.log(
      `Admin batch OK — submitted ${result.json.submitted}, inserted ${result.json.inserted}`,
    )
    process.exit(0)
  }
}

console.error('Seed failed:', result.status, JSON.stringify(result.json))
process.exit(1)
