import { beforeEach, describe, expect, it, vi } from 'vitest'

const store = new Map<string, string>()

vi.mock('../src/renderer/src/workbench-store-client', () => ({
  wbStoreGetRaw: (key: string) => store.get(key) ?? null,
  wbStoreSetRaw: (key: string, value: string) => {
    store.set(key, value)
  },
}))

import {
  maybeLearnMyAiMemory,
  memoryLinesForPrompt,
  readMyAiMemory,
  rememberMyAiLine,
} from '../src/renderer/src/my-ai-memory'

describe('my-ai-memory', () => {
  beforeEach(() => {
    store.clear()
  })

  it('stores preference lines per practice', () => {
    rememberMyAiLine('freelancer', 'Luôn soạn Word tiếng Việt')
    rememberMyAiLine('freelancer', 'Prefer short emails')
    const mem = readMyAiMemory('freelancer')
    expect(mem.lines).toEqual(['Prefer short emails', 'Luôn soạn Word tiếng Việt'])
    expect(memoryLinesForPrompt('sales')).toEqual([])
    expect(memoryLinesForPrompt('freelancer')).toHaveLength(2)
  })

  it('dedupes case-insensitively and learns from always/luôn cues', () => {
    rememberMyAiLine('freelancer', 'Always use formal tone')
    rememberMyAiLine('freelancer', 'always use formal tone')
    expect(readMyAiMemory('freelancer').lines).toHaveLength(1)

    maybeLearnMyAiMemory('freelancer', 'Luôn trả lời tiếng Việt')
    expect(memoryLinesForPrompt('freelancer').some((l) => /tiếng Việt/i.test(l))).toBe(true)

    maybeLearnMyAiMemory('freelancer', 'Tạo Word báo giá ABC')
    expect(memoryLinesForPrompt('freelancer')).toHaveLength(2)
  })
})
