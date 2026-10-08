/**
 * Shallow walk of the default save folder (and similar roots) for My AI
 * open/search when Recents miss. Caps depth + file count for IPC latency.
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, join } from 'node:path'

const OFFICE_EXT = new Set([
  'docx',
  'doc',
  'xlsx',
  'xlsm',
  'xls',
  'csv',
  'pptx',
  'ppt',
  'pdf',
  'md',
  'html',
  'htm',
])

const MAX_SCAN = 400
const MAX_DEPTH = 2

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '')
}

function norm(s: string): string {
  return stripDiacritics(s).toLowerCase().trim()
}

function scoreName(fileName: string, query: string): number {
  const q = norm(query)
  if (!q) return 1
  const name = norm(fileName)
  const base = name.replace(/\.[^.]+$/, '')
  if (name === q || base === q) return 100
  if (name.startsWith(q) || base.startsWith(q)) return 80
  if (name.includes(q) || base.includes(q)) return 60
  const qTokens = q.split(/[\s._-]+/).filter((t) => t.length > 1)
  if (qTokens.length === 0) return 0
  let hits = 0
  for (const t of qTokens) {
    if (name.includes(t) || base.includes(t)) hits++
  }
  if (hits === 0) return 0
  return Math.round((hits / qTokens.length) * 50)
}

/** Collect office file paths under roots (shallow). */
export function collectLocalOfficePaths(
  roots: readonly string[],
  maxScan = MAX_SCAN,
  maxDepth = MAX_DEPTH,
): string[] {
  const out: string[] = []
  const seen = new Set<string>()

  const walk = (dir: string, depth: number) => {
    if (out.length >= maxScan || depth > maxDepth) return
    if (!dir || !existsSync(dir)) return
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const name of entries) {
      if (out.length >= maxScan) return
      if (name.startsWith('.')) continue
      const full = join(dir, name)
      let st
      try {
        st = statSync(full)
      } catch {
        continue
      }
      if (st.isDirectory()) {
        walk(full, depth + 1)
        continue
      }
      if (!st.isFile()) continue
      const ext = extname(name).slice(1).toLowerCase()
      if (!OFFICE_EXT.has(ext)) continue
      if (seen.has(full)) continue
      seen.add(full)
      out.push(full)
    }
  }

  for (const root of roots) walk(root, 0)
  return out
}

/** Rank paths by filename match; empty query returns newest-ish order (caller stats). */
export function filterPathsByQuery(paths: readonly string[], query: string, limit = 12): string[] {
  const q = query.trim()
  const scored = paths
    .map((path) => ({ path, score: scoreName(basename(path), q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
  return scored.slice(0, limit).map((x) => x.path)
}
