import { describe, expect, it } from 'vitest'
import {
  SKILL_DOMAINS,
  WORKBENCH_MODULES,
  createPracticeMeta,
  defaultPinnedModules,
  defaultPinnedSkillDomains,
  getPractice,
  isPracticeMeta,
  isSkillDomainId,
  listPractices,
  practiceIdFromProjectKind,
  practiceMatchesFilter,
  practiceMaterialSeedHtml,
  practiceProjectKind,
  practiceSkillPrompt,
  skillsForDomain,
} from '../src/index.js'

describe('practice-core', () => {
  it('registers five profession practices including teacher', () => {
    const ids = listPractices().map((p) => p.id)
    expect(ids).toEqual(['teacher', 'legal', 'construction', 'procurement', 'principal'])
    expect(getPractice('teacher')?.projectKind).toBe('education')
    expect(practiceProjectKind('legal')).toBe('legal')
    expect(practiceIdFromProjectKind('education')).toBe('teacher')
  })

  it('creates and filters practice meta', () => {
    const meta = createPracticeMeta({
      practiceId: 'legal',
      title: 'HĐ thuê VP',
      facets: { client: 'ABC', matterType: 'Hợp đồng' },
      tags: ['thuê'],
    })
    expect(isPracticeMeta(meta)).toBe(true)
    const item = {
      id: 'p1',
      name: 'pack',
      fileCount: 0,
      lastActiveAt: meta.updatedAt,
      meta,
    }
    expect(practiceMatchesFilter(item, { facetKey: 'client', facetValue: 'ABC' })).toBe(true)
    expect(practiceMatchesFilter(item, { query: 'thuê' })).toBe(true)
  })

  it('builds seeds and skill prompts', () => {
    const meta = createPracticeMeta({
      practiceId: 'construction',
      title: 'Đợt GS tuần 12',
      facets: { projectName: 'Chung cư A', phase: 'Thi công' },
    })
    expect(practiceMaterialSeedHtml('nhat-ky-gs', 'Nhật ký GS', meta)).toContain('Nhật ký GS')
    expect(practiceSkillPrompt('Nhật ký', 'Viết nhật ký', meta)).toContain('Chung cư A')
  })

  it('exposes workbench modules and role defaults', () => {
    const ids = WORKBENCH_MODULES.map((m) => m.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'desk',
        'calendar',
        'tasks',
        'notes',
        'assistant',
        'forms',
        'personal',
        'personal-finance',
        'events',
        'health',
        'self-growth',
        'family',
        'friends',
        'pets',
        'travel',
        'clients',
        'contracts',
        'matters',
      ]),
    )
    expect(defaultPinnedModules('principal')).toEqual(['desk'])
    expect(defaultPinnedModules('legal')).toEqual(['desk'])
    expect(defaultPinnedModules('teacher')).toEqual(['desk'])
    expect(defaultPinnedModules('construction')).toEqual(['desk'])
  })

  it('exposes skill domains with starter skills', () => {
    expect(SKILL_DOMAINS.map((d) => d.id)).toEqual(
      expect.arrayContaining([
        'education',
        'health',
        'legal',
        'design',
        'project-mgmt',
        'sales',
        'admin',
        'hr',
        'customer-care',
        'personal',
      ]),
    )
    expect(defaultPinnedSkillDomains()).toEqual(['education', 'personal', 'admin'])
    expect(isSkillDomainId('sales')).toBe(true)
    expect(skillsForDomain('legal').length).toBeGreaterThan(0)
    expect(skillsForDomain('personal').every((s) => s.domainId === 'personal')).toBe(true)
  })
})
