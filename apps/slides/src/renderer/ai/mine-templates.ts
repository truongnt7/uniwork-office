/**
 * User-pinned builtin gallery templates (“Của tôi”).
 * Stored in localStorage — no upload required; pin from template detail.
 */

const STORAGE_KEY = 'slides.ai.mine-templates.v1'

export function loadMineTemplateIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
  } catch {
    return []
  }
}

export function saveMineTemplateIds(ids: readonly string[]): void {
  const unique = [...new Set(ids.filter(Boolean))]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unique))
}

export function isMineTemplate(id: string): boolean {
  return loadMineTemplateIds().includes(id)
}

export function addMineTemplate(id: string): string[] {
  const next = [...loadMineTemplateIds()]
  if (!next.includes(id)) next.unshift(id)
  saveMineTemplateIds(next)
  return next
}

export function removeMineTemplate(id: string): string[] {
  const next = loadMineTemplateIds().filter((x) => x !== id)
  saveMineTemplateIds(next)
  return next
}

export function toggleMineTemplate(id: string): { ids: string[]; added: boolean } {
  if (isMineTemplate(id)) {
    return { ids: removeMineTemplate(id), added: false }
  }
  return { ids: addMineTemplate(id), added: true }
}
