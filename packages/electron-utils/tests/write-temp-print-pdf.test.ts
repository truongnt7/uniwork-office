import { readFile, rm } from 'node:fs/promises'
import { dirname } from 'node:path'
import { describe, expect, it } from 'vitest'
import { writeTempPrintPdf } from '../src/print-html-pdf'

describe('writeTempPrintPdf', () => {
  it('writes bytes under a temp uniwork-print directory', async () => {
    const pdf = Buffer.from('%PDF-1.4 test')
    const path = await writeTempPrintPdf(pdf, 'unit-test')
    expect(path).toMatch(/uniwork-print-/)
    expect(path.endsWith('unit-test.pdf')).toBe(true)
    expect(await readFile(path)).toEqual(pdf)
    await rm(dirname(path), { recursive: true, force: true })
  })
})
