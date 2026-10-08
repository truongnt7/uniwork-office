import { describe, expect, it } from 'vitest'
import { groupRecentByDay, recentDayBucket } from '../src/renderer/src/recent-timeline'

describe('recent-timeline', () => {
  const noon = new Date(2026, 9, 8, 12, 0, 0).getTime() // Oct 8 2026 local

  it('classifies day buckets', () => {
    expect(recentDayBucket(noon, noon)).toBe('today')
    expect(recentDayBucket(noon - 86_400_000, noon)).toBe('yesterday')
    expect(recentDayBucket(noon - 3 * 86_400_000, noon)).toBe('week')
    expect(recentDayBucket(noon - 10 * 86_400_000, noon)).toBe('older')
  })

  it('groups and orders newest-first by default', () => {
    const entries = [
      { id: 'old', mtimeMs: noon - 10 * 86_400_000 },
      { id: 'today', mtimeMs: noon - 60_000 },
      { id: 'yest', mtimeMs: noon - 86_400_000 },
    ]
    const groups = groupRecentByDay(entries, false, noon)
    expect(groups.map((g) => g.bucket)).toEqual(['today', 'yesterday', 'older'])
    expect(groups[0]!.entries[0]!.id).toBe('today')
  })

  it('reverses section order when oldest-first', () => {
    const entries = [
      { id: 'today', mtimeMs: noon },
      { id: 'old', mtimeMs: noon - 10 * 86_400_000 },
    ]
    const groups = groupRecentByDay(entries, true, noon)
    expect(groups.map((g) => g.bucket)).toEqual(['older', 'today'])
  })
})
