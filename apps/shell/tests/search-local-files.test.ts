import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it, afterEach } from 'vitest'
import {
  collectLocalOfficePaths,
  filterPathsByQuery,
} from '../src/main/search-local-files'

describe('search-local-files', () => {
  const root = join(tmpdir(), `uw-search-${Date.now()}`)

  afterEach(() => {
    try {
      rmSync(root, { recursive: true, force: true })
    } catch {
      /* ignore */
    }
  })

  it('finds office files under save dir by name', () => {
    mkdirSync(join(root, 'nested'), { recursive: true })
    writeFileSync(join(root, 'HopDong-ABC.docx'), 'x')
    writeFileSync(join(root, 'nested', 'BaoCao-Q3.xlsx'), 'x')
    writeFileSync(join(root, 'readme.txt'), 'x')

    const all = collectLocalOfficePaths([root])
    expect(all.some((p) => p.endsWith('HopDong-ABC.docx'))).toBe(true)
    expect(all.some((p) => p.endsWith('BaoCao-Q3.xlsx'))).toBe(true)
    expect(all.some((p) => p.endsWith('readme.txt'))).toBe(false)

    const hits = filterPathsByQuery(all, 'hop dong', 5)
    expect(hits[0]).toMatch(/HopDong-ABC\.docx$/)
  })
})
