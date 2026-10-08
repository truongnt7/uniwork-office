/** Day buckets for the home Recent timeline layout. */

export type RecentDayBucket = 'today' | 'yesterday' | 'week' | 'older'

function startOfDayMs(ms: number): number {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function recentDayBucket(mtimeMs: number, nowMs = Date.now()): RecentDayBucket {
  const today = startOfDayMs(nowMs)
  const day = startOfDayMs(mtimeMs)
  const days = Math.round((today - day) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return 'week'
  return 'older'
}

export interface RecentDayGroup<T extends { mtimeMs: number }> {
  bucket: RecentDayBucket
  entries: T[]
}

/** Group entries into timeline sections; empty buckets omitted. */
export function groupRecentByDay<T extends { mtimeMs: number }>(
  entries: readonly T[],
  oldestFirst = false,
  nowMs = Date.now(),
): RecentDayGroup<T>[] {
  const order: RecentDayBucket[] = oldestFirst
    ? ['older', 'week', 'yesterday', 'today']
    : ['today', 'yesterday', 'week', 'older']
  const map = new Map<RecentDayBucket, T[]>()
  for (const entry of entries) {
    const bucket = recentDayBucket(entry.mtimeMs, nowMs)
    const list = map.get(bucket)
    if (list) list.push(entry)
    else map.set(bucket, [entry])
  }
  return order
    .map((bucket) => {
      const raw = map.get(bucket)
      if (!raw?.length) return null
      const sorted = [...raw].sort((a, b) =>
        oldestFirst ? a.mtimeMs - b.mtimeMs : b.mtimeMs - a.mtimeMs,
      )
      return { bucket, entries: sorted }
    })
    .filter((g): g is RecentDayGroup<T> => g != null)
}
