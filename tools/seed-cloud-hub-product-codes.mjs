#!/usr/bin/env node
/**
 * Seed Cloud Hub with product activation hashes (from gen-product-activation-batch.py).
 *
 * Usage:
 *   UNIWORK_CLOUD_ADMIN_TOKEN='…' node tools/seed-cloud-hub-product-codes.mjs
 *   UNIWORK_CLOUD_HUB_URL=https://uniwork-cloud-hub.lovable.app \
 *     UNIWORK_CLOUD_ADMIN_TOKEN='…' \
 *     node tools/seed-cloud-hub-product-codes.mjs \
 *       docs/pricing/product-activation-codes-100000-hashes.json
 *
 * Uploads in chunks of 2000 (admin batch API).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const file =
  process.argv[2] ||
  resolve(root, 'docs/pricing/product-activation-codes-100000-hashes.json')
const base = (process.env.UNIWORK_CLOUD_HUB_URL || 'https://uniwork-cloud-hub.lovable.app').replace(
  /\/+$/,
  '',
)
const token = (process.env.UNIWORK_CLOUD_ADMIN_TOKEN || '').trim()
if (!token) {
  console.error('Set UNIWORK_CLOUD_ADMIN_TOKEN (admin JWT from Hub login).')
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
const CHUNK = 2000

async function postChunk(slice, index) {
  const res = await fetch(`${base}/v1/admin/codes/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      hashes: slice,
      planId,
      kind,
      batch: `${batch}-${index}`,
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.ok === false) {
    throw new Error(`chunk ${index}: HTTP ${res.status} ${JSON.stringify(json)}`)
  }
  return json
}

console.log(`Seeding ${hashes.length} hashes → ${base} plan=${planId}`)
let inserted = 0
for (let i = 0; i < hashes.length; i += CHUNK) {
  const slice = hashes.slice(i, i + CHUNK)
  const idx = Math.floor(i / CHUNK) + 1
  const result = await postChunk(slice, idx)
  inserted += Number(result.inserted ?? slice.length)
  console.log(`  chunk ${idx}: submitted ${slice.length}, running total ~${inserted}`)
}
console.log('Done.')
