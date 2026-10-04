import {
  defaultPinnedSkillDomains,
  isSkillDomainId,
  type SkillDomainId,
} from '@uniwork/practice-core'

const KEY = 'uniwork.skill.domain.pins'
const ACTIVE_KEY = 'uniwork.skill.domain.active'

export function readPinnedSkillDomains(): SkillDomainId[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return defaultPinnedSkillDomains()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return defaultPinnedSkillDomains()
    const ids = parsed.filter(isSkillDomainId)
    return ids.length > 0 ? ids : defaultPinnedSkillDomains()
  } catch {
    return defaultPinnedSkillDomains()
  }
}

export function writePinnedSkillDomains(pins: SkillDomainId[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(pins))
  } catch {
    /* ignore */
  }
}

export function pinSkillDomain(id: SkillDomainId): SkillDomainId[] {
  const cur = readPinnedSkillDomains()
  if (cur.includes(id)) return cur
  const next = [...cur, id]
  writePinnedSkillDomains(next)
  return next
}

export function unpinSkillDomain(id: SkillDomainId): SkillDomainId[] {
  const next = readPinnedSkillDomains().filter((x) => x !== id)
  const safe = next.length > 0 ? next : defaultPinnedSkillDomains()
  writePinnedSkillDomains(safe)
  return safe
}

export function reorderPinnedSkillDomains(
  fromId: SkillDomainId,
  toId: SkillDomainId,
): SkillDomainId[] {
  const cur = readPinnedSkillDomains()
  const from = cur.indexOf(fromId)
  const to = cur.indexOf(toId)
  if (from < 0 || to < 0 || from === to) return cur
  const next = [...cur]
  const [item] = next.splice(from, 1)
  if (!item) return cur
  next.splice(to, 0, item)
  writePinnedSkillDomains(next)
  return next
}

export function readActiveSkillDomain(pins: SkillDomainId[]): SkillDomainId {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    if (raw && isSkillDomainId(raw) && pins.includes(raw)) return raw
  } catch {
    /* ignore */
  }
  return pins[0] ?? 'education'
}

export function writeActiveSkillDomain(id: SkillDomainId): void {
  try {
    localStorage.setItem(ACTIVE_KEY, id)
  } catch {
    /* ignore */
  }
}
