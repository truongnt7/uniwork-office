import { describe, expect, it } from 'vitest'

import { needsCellTextNormalize, normalizeCellText } from '../src/renderer/cell-text-normalize'

describe('normalizeCellText', () => {
  it('is a no-op for ASCII and already-NFC Vietnamese', () => {
    expect(normalizeCellText('hello')).toBe('hello')
    expect(normalizeCellText('Vi\u{1ec7}t Nam')).toBe('Vi\u{1ec7}t Nam')
    expect(normalizeCellText('')).toBe('')
  })

  it('composes NFD Vietnamese into NFC precomposed letters', () => {
    // e + combining dot below + combining circumflex → ệ (U+1EC7)
    const nfd = 'Vie\u{0323}\u{0302}t Nam'
    expect(needsCellTextNormalize(nfd)).toBe(true)
    expect(normalizeCellText(nfd)).toBe('Vi\u{1ec7}t Nam')
    expect(needsCellTextNormalize(normalizeCellText(nfd))).toBe(false)
  })

  it('composes Times-style italic problem cases (o + ̂ + ́ → ố)', () => {
    const nfd = 'c\u{006f}\u{0302}\u{0301}ng'
    expect(normalizeCellText(nfd)).toBe('c\u{1ed1}ng')
  })
})
