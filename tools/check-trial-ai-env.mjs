#!/usr/bin/env node
/**
 * Preflight for trial AI packaging — never prints the API key.
 * Usage: node tools/check-trial-ai-env.mjs
 *        node tools/check-trial-ai-env.mjs --asar apps/shell/release/win-unpacked/resources/app.asar
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'

const root = resolve(import.meta.dirname, '..')
const envPath = resolve(root, 'apps/shell/electron-builder.env')

function loadEnvFile(file) {
  if (!existsSync(file)) return {}
  const out = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    out[k] = v
  }
  return out
}

const fileEnv = loadEnvFile(envPath)
const key = (
  process.env.UNIWORK_TRIAL_OPENROUTER_KEY ||
  fileEnv.UNIWORK_TRIAL_OPENROUTER_KEY ||
  ''
).trim()
const creditsRaw = Number(
  process.env.UNIWORK_TRIAL_CREDITS || fileEnv.UNIWORK_TRIAL_CREDITS || 50_000,
)
const credits =
  Number.isFinite(creditsRaw) && creditsRaw > 0 ? Math.floor(creditsRaw) : 50_000

const asarFlag = process.argv.indexOf('--asar')
const asarPath = asarFlag >= 0 ? resolve(process.argv[asarFlag + 1] || '') : ''

console.log('Trial AI env preflight')
console.log(`  electron-builder.env: ${existsSync(envPath) ? 'present' : 'missing'}`)
console.log(`  key: ${key ? `ok (${key.length} chars, ${key.startsWith('sk-or-') ? 'OpenRouter-shaped' : 'unexpected prefix'})` : 'MISSING'}`)
console.log(`  credits: ${credits}`)

let asarOk = true
if (asarPath) {
  if (!existsSync(asarPath)) {
    console.log(`  asar: missing (${asarPath})`)
    asarOk = false
  } else {
    const require = createRequire(import.meta.url)
    const Asar = require('@electron/asar')
    const pkg = JSON.parse(Asar.extractFile(asarPath, 'package.json').toString('utf8'))
    const t = pkg.uniworkTrialAi
    const has = Boolean(t?.apiKey)
    console.log(
      `  asar trial meta: ${has ? `ok (credits=${t.credits ?? '?'}, keyChars=${String(t.apiKey).length})` : 'MISSING uniworkTrialAi'}`,
    )
    asarOk = has
  }
}

const ready = Boolean(key) && asarOk
console.log(ready ? '\nREADY for trial dist / verify.' : '\nNOT READY — set UNIWORK_TRIAL_OPENROUTER_KEY (dedicated trial key).')
process.exit(ready ? 0 : 1)
