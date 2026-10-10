#!/usr/bin/env node
/**
 * Seed ledger from apps/shell/build/trial-activation-hashes.json (does not wipe
 * already-bound deviceIds).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')
const HASH_FILE = join(ROOT, 'apps/shell/build/trial-activation-hashes.json')
const DATA_DIR = join(__dirname, 'data')
const LEDGER_PATH = join(DATA_DIR, 'ledger.json')

if (!existsSync(HASH_FILE)) {
  console.error('Missing', HASH_FILE)
  console.error('Run: python3 tools/gen-trial-activation-batch.py 100')
  process.exit(1)
}

const batch = JSON.parse(readFileSync(HASH_FILE, 'utf8'))
const hashes = Array.isArray(batch.hashes) ? batch.hashes : []
if (hashes.length === 0) {
  console.error('No hashes in', HASH_FILE)
  process.exit(1)
}

let ledger = { version: 1, codes: {} }
if (existsSync(LEDGER_PATH)) {
  try {
    ledger = JSON.parse(readFileSync(LEDGER_PATH, 'utf8'))
    if (!ledger.codes) ledger = { version: 1, codes: {} }
  } catch {
    ledger = { version: 1, codes: {} }
  }
}

let added = 0
for (const h of hashes) {
  if (typeof h !== 'string' || !/^[a-f0-9]{64}$/i.test(h)) continue
  const key = h.toLowerCase()
  if (ledger.codes[key]) continue
  ledger.codes[key] = {
    deviceId: null,
    activatedAt: null,
    revoked: false,
  }
  added++
}

mkdirSync(DATA_DIR, { recursive: true })
writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2) + '\n', 'utf8')
const used = Object.values(ledger.codes).filter((r) => r.deviceId).length
console.log(`Seeded ${LEDGER_PATH}`)
console.log(`  total=${Object.keys(ledger.codes).length} added=${added} alreadyBound=${used}`)
