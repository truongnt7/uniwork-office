#!/usr/bin/env node
/**
 * UniWork trial activation ledger — 1 code = 1 deviceId.
 *
 *   node tools/trial-activation-server/seed.mjs   # load 100 hashes
 *   node tools/trial-activation-server/server.mjs
 *
 * Env:
 *   PORT=8787
 *   HOST=127.0.0.1
 *   ADMIN_TOKEN=…   (optional, for revoke)
 */
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const LEDGER_PATH = join(DATA_DIR, 'ledger.json')
const PORT = Number(process.env.PORT || 8787)
const HOST = process.env.HOST || '127.0.0.1'
const ADMIN_TOKEN = (process.env.ADMIN_TOKEN || '').trim()

/** @typedef {{ deviceId: string | null, activatedAt: string | null, revoked: boolean, hint?: string }} CodeRow */
/** @typedef {{ version: 1, codes: Record<string, CodeRow> }} Ledger */

function emptyLedger() {
  return /** @type {Ledger} */ ({ version: 1, codes: {} })
}

function readLedger() {
  try {
    if (!existsSync(LEDGER_PATH)) return emptyLedger()
    const parsed = JSON.parse(readFileSync(LEDGER_PATH, 'utf8'))
    if (!parsed || parsed.version !== 1 || typeof parsed.codes !== 'object') return emptyLedger()
    return /** @type {Ledger} */ (parsed)
  } catch {
    return emptyLedger()
  }
}

function writeLedger(ledger) {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2) + '\n', 'utf8')
}

function json(res, status, body) {
  const raw = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(raw),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  })
  res.end(raw)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function normalizeCode(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

async function handleActivate(req, res) {
  let body
  try {
    body = await readBody(req)
  } catch {
    return json(res, 400, { ok: false, error: 'invalid', message: 'Invalid JSON body' })
  }
  const deviceId = String(body.deviceId || '').trim()
  const codeHash = String(body.codeHash || '')
    .trim()
    .toLowerCase()
  const code = normalizeCode(body.code || '')
  if (!deviceId || deviceId.length < 8) {
    return json(res, 400, { ok: false, error: 'invalid', message: 'Missing deviceId' })
  }
  if (!/^[a-f0-9]{64}$/.test(codeHash)) {
    return json(res, 400, { ok: false, error: 'invalid', message: 'Missing codeHash' })
  }

  const ledger = readLedger()
  const row = ledger.codes[codeHash]
  if (!row) {
    return json(res, 404, { ok: false, error: 'invalid' })
  }
  if (row.revoked) {
    return json(res, 403, { ok: false, error: 'revoked' })
  }
  if (row.deviceId && row.deviceId !== deviceId) {
    return json(res, 409, { ok: false, error: 'already_used' })
  }

  const activatedAt = row.activatedAt || new Date().toISOString()
  ledger.codes[codeHash] = {
    ...row,
    deviceId,
    activatedAt,
    revoked: false,
    ...(code ? { hint: code.length <= 4 ? code : `••••${code.slice(-4)}` } : {}),
  }
  writeLedger(ledger)
  return json(res, 200, { ok: true, activatedAt })
}

async function handleRevoke(req, res) {
  if (!ADMIN_TOKEN) {
    return json(res, 503, { ok: false, error: 'revoked', message: 'Admin token not configured' })
  }
  const auth = String(req.headers.authorization || '')
  if (auth !== `Bearer ${ADMIN_TOKEN}`) {
    return json(res, 401, { ok: false, error: 'invalid', message: 'Unauthorized' })
  }
  let body
  try {
    body = await readBody(req)
  } catch {
    return json(res, 400, { ok: false, error: 'invalid' })
  }
  const codeHash = String(body.codeHash || '')
    .trim()
    .toLowerCase()
  const ledger = readLedger()
  if (!ledger.codes[codeHash]) {
    return json(res, 404, { ok: false, error: 'not_found' })
  }
  ledger.codes[codeHash] = { ...ledger.codes[codeHash], revoked: true }
  writeLedger(ledger)
  return json(res, 200, { ok: true })
}

function handleStatus(_req, res) {
  const ledger = readLedger()
  const total = Object.keys(ledger.codes).length
  const used = Object.values(ledger.codes).filter((r) => r.deviceId).length
  const revoked = Object.values(ledger.codes).filter((r) => r.revoked).length
  return json(res, 200, { ok: true, total, used, free: total - used - revoked, revoked })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    return res.end()
  }
  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      return json(res, 200, { ok: true })
    }
    if (req.method === 'GET' && url.pathname === '/v1/trial/status') {
      return handleStatus(req, res)
    }
    if (req.method === 'POST' && url.pathname === '/v1/trial/activate') {
      return await handleActivate(req, res)
    }
    if (req.method === 'POST' && url.pathname === '/v1/trial/revoke') {
      return await handleRevoke(req, res)
    }
    return json(res, 404, { ok: false, error: 'not_found' })
  } catch (err) {
    console.error(err)
    return json(res, 500, { ok: false, error: 'invalid', message: 'Server error' })
  }
})

server.listen(PORT, HOST, () => {
  const ledger = readLedger()
  const n = Object.keys(ledger.codes).length
  console.log(`Trial activation server http://${HOST}:${PORT}`)
  console.log(`  ledger: ${LEDGER_PATH} (${n} codes)`)
  console.log(`  POST /v1/trial/activate  → 1 code = 1 device`)
  if (n === 0) console.log('  WARN: ledger empty — run: node tools/trial-activation-server/seed.mjs')
})
