#!/usr/bin/env node
/**
 * Generate trial activation codes for a limited send list.
 *
 * Usage:
 *   node tools/gen-trial-activation-codes.mjs 20
 *   node tools/gen-trial-activation-codes.mjs 20 --prefix UWTRIAL
 *
 * Prints plaintext codes (give one per customer) and a ready-to-paste
 * UNIWORK_TRIAL_ACTIVATION_CODES= line. Keep the plaintext sheet private;
 * only hashes go into the installer when not using the activation server.
 */
import { createHash, randomBytes } from 'node:crypto'

const count = Math.max(1, Math.min(500, Number(process.argv[2]) || 10))
const prefixFlag = process.argv.indexOf('--prefix')
const prefix = (
  prefixFlag >= 0 ? process.argv[prefixFlag + 1] : 'UWTRIAL'
)
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '')
  .slice(0, 12) || 'UWTRIAL'

function normalize(raw) {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function hash(raw) {
  return createHash('sha256').update(`uniwork-trial-v1:${normalize(raw)}`).digest('hex')
}

function oneCode() {
  const body = randomBytes(5).toString('hex').toUpperCase() // 10 hex chars
  // UWTRIAL-XXXX-XXXX style for readability
  return `${prefix}-${body.slice(0, 4)}-${body.slice(4, 8)}`
}

const codes = []
const seen = new Set()
while (codes.length < count) {
  const c = oneCode()
  const n = normalize(c)
  if (seen.has(n)) continue
  seen.add(n)
  codes.push(c)
}

console.log('# Plaintext codes — one per customer (keep private)')
for (const c of codes) {
  console.log(`${c}\t${hash(c)}`)
}
console.log('')
console.log('# For electron-builder.env / CI (local-hash mode or offline allowlist):')
console.log(`UNIWORK_TRIAL_ACTIVATION_CODES=${codes.join(',')}`)
console.log('')
console.log('# For 1-code-1-device, also set server URL and load codes into the DB:')
console.log('# UNIWORK_TRIAL_ACTIVATION_URL=https://your-api.example.com')
console.log('# Insert each plaintext (or hash) into trial_activation_codes before sending.')
