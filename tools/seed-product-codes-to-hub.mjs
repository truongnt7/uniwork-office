#!/usr/bin/env node
/**
 * Upload product activation hashes to UniWork Cloud Hub / Supabase.
 *
 * Option A — Admin JWT (Hub API, chunks of 2000):
 *   UNIWORK_CLOUD_ADMIN_TOKEN='eyJ…' node tools/seed-product-codes-to-hub.mjs
 *
 * Option B — Supabase service role (direct upsert, chunks of 1000):
 *   SUPABASE_URL='https://….supabase.co' \
 *   SUPABASE_SERVICE_ROLE_KEY='eyJ…' \
 *   node tools/seed-product-codes-to-hub.mjs
 *
 * Default file: docs/pricing/product-activation-codes-100000-hashes.json
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const file =
  process.argv[2] ||
  resolve(root, 'docs/pricing/product-activation-codes-100000-hashes.json')

if (!existsSync(file)) {
  console.error('Missing hash file:', file)
  process.exit(1)
}

const batchFile = JSON.parse(readFileSync(file, 'utf8'))
const hashes = Array.isArray(batchFile.hashes) ? batchFile.hashes : []
if (!hashes.length) {
  console.error('No hashes in', file)
  process.exit(1)
}

const planId = batchFile.planId || 'personal'
const kind = batchFile.kind || 'office'
const batch = batchFile.batch || 'product-100k'
const hubBase = (
  process.env.UNIWORK_CLOUD_HUB_URL ||
  process.env.UNIWORK_TRIAL_ACTIVATION_URL ||
  'https://uniwork-cloud-hub.lovable.app'
).replace(/\/+$/, '')
const adminToken = (process.env.UNIWORK_CLOUD_ADMIN_TOKEN || '').trim()
const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim()
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

function rowsFromSlice(slice, batchLabel) {
  return slice.map((h) => {
    const codeHash =
      typeof h === 'string'
        ? h.toLowerCase()
        : String(h.codeHash || h.code_hash || '').toLowerCase()
    const codeHint =
      typeof h === 'object' && h && (h.codeHint || h.code_hint)
        ? String(h.codeHint || h.code_hint).slice(0, 32)
        : '••••????'
    return {
      code_hash: codeHash,
      code_hint: codeHint,
      plan_id: planId,
      kind,
      max_seats: planId === 'pro' || planId === 'office-pro-lifetime' ? 5 : 1,
      batch: batchLabel,
      recipient_note: null,
    }
  }).filter((r) => /^[0-9a-f]{64}$/.test(r.code_hash))
}

async function seedViaAdmin() {
  const CHUNK = 2000
  let inserted = 0
  console.log(`Hub API ${hubBase} — ${hashes.length} hashes, plan=${planId}`)
  for (let i = 0; i < hashes.length; i += CHUNK) {
    const slice = hashes.slice(i, i + CHUNK)
    const idx = Math.floor(i / CHUNK) + 1
    const res = await fetch(`${hubBase}/v1/admin/codes/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        hashes: slice,
        planId,
        kind,
        batch: `${batch}-${idx}`,
      }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json.ok === false) {
      throw new Error(`chunk ${idx}: HTTP ${res.status} ${JSON.stringify(json)}`)
    }
    inserted += Number(json.inserted ?? 0)
    console.log(`  chunk ${idx}/${Math.ceil(hashes.length / CHUNK)}: +${json.inserted ?? 0} (total inserted reported ${inserted})`)
  }
  return inserted
}

async function seedViaServiceRole() {
  let createClient
  try {
    ;({ createClient } = await import(
      pathToFileURL(
        resolve(root, '../uniwork-cloud-hub/node_modules/@supabase/supabase-js/dist/module/index.js'),
      ).href
    ))
  } catch {
    const hubReq = createRequire(resolve(root, '../uniwork-cloud-hub/package.json'))
    ;({ createClient } = hubReq('@supabase/supabase-js'))
  }
  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: plan, error: planErr } = await sb
    .from('plans')
    .select('id, max_seats')
    .eq('id', planId)
    .maybeSingle()
  if (planErr) throw planErr
  if (!plan) throw new Error(`Plan "${planId}" not found — run Phase A migrations first`)

  const CHUNK = 1000
  let upserted = 0
  console.log(`Supabase direct — ${hashes.length} hashes → plan=${planId}`)
  for (let i = 0; i < hashes.length; i += CHUNK) {
    const slice = hashes.slice(i, i + CHUNK)
    const idx = Math.floor(i / CHUNK) + 1
    const rows = rowsFromSlice(slice, `${batch}-${idx}`).map((r) => ({
      ...r,
      max_seats: plan.max_seats,
    }))
    const { data, error } = await sb
      .from('activation_codes')
      .upsert(rows, { onConflict: 'code_hash', ignoreDuplicates: true })
      .select('code_hash')
    if (error) throw new Error(`chunk ${idx}: ${error.message}`)
    upserted += data?.length ?? 0
    // Legacy mirror (best-effort)
    await sb.from('trial_activation_codes').upsert(
      rows.map((r) => ({
        code_hash: r.code_hash,
        code_hint: r.code_hint,
        batch: r.batch,
        recipient_note: r.recipient_note,
      })),
      { onConflict: 'code_hash', ignoreDuplicates: true },
    )
    if (idx % 10 === 0 || i + CHUNK >= hashes.length) {
      console.log(`  chunk ${idx}/${Math.ceil(hashes.length / CHUNK)}: running inserted≈${upserted}`)
    }
  }
  return upserted
}

if (!adminToken && !(supabaseUrl && serviceKey)) {
  console.error(`
Cannot upload yet — need credentials:

  A) Admin JWT after login at ${hubBase}/admin
     UNIWORK_CLOUD_ADMIN_TOKEN='…' node tools/seed-product-codes-to-hub.mjs

  B) Supabase service role (Lovable → Secrets / Supabase settings)
     SUPABASE_URL='…' SUPABASE_SERVICE_ROLE_KEY='…' node tools/seed-product-codes-to-hub.mjs
`)
  process.exit(2)
}

try {
  const n = adminToken ? await seedViaAdmin() : await seedViaServiceRole()
  console.log(`Done. Reported inserts/upserts: ${n}`)
} catch (err) {
  console.error('Seed failed:', err instanceof Error ? err.message : err)
  process.exit(1)
}
