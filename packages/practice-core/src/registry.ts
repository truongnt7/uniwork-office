import { constructionPractice } from './practices/construction.js'
import { legalPractice } from './practices/legal.js'
import { principalPractice } from './practices/principal.js'
import { procurementPractice } from './practices/procurement.js'
import { teacherPractice } from './practices/teacher.js'
import type { PracticeDefinition, PracticeId } from './types.js'

export const PRACTICE_REGISTRY: readonly PracticeDefinition[] = [
  teacherPractice,
  legalPractice,
  constructionPractice,
  procurementPractice,
  principalPractice,
] as const

export function listPractices(): readonly PracticeDefinition[] {
  return PRACTICE_REGISTRY
}

export function getPractice(id: PracticeId): PracticeDefinition | undefined {
  return PRACTICE_REGISTRY.find((p) => p.id === id)
}

export function requirePractice(id: PracticeId): PracticeDefinition {
  const p = getPractice(id)
  if (!p) throw new Error(`Unknown practice: ${id}`)
  return p
}
