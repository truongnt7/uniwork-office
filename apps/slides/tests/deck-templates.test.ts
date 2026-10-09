import { describe, expect, it } from 'vitest'
import {
  CREATIVE_TEMPLATE_IDS,
  DECK_TEMPLATES,
  TRENDING_TEMPLATE_IDS,
  buildGalleryGenerateMessages,
  buildGalleryStyleTemplateMessages,
  buildGalleryUserDeckMessages,
  fillBuiltinTemplate,
  filterDeckTemplates,
  getDeckTemplate,
  templateMatchesQuery,
} from '../src/renderer/ai/deck-templates'

describe('deck-templates', () => {
  it('lists unique gallery templates with pages', () => {
    const ids = new Set(DECK_TEMPLATES.map((t) => t.id))
    expect(ids.size).toBe(DECK_TEMPLATES.length)
    for (const tpl of DECK_TEMPLATES) {
      expect(tpl.pages.length).toBeGreaterThanOrEqual(4)
      expect(tpl.approxPages).toBe(tpl.pages.length)
      expect(tpl.mood).toBeTruthy()
      expect(tpl.coverLayout).toBeTruthy()
      expect(tpl.tagsEn.length).toBeGreaterThan(0)
      expect(tpl.tagsVi.length).toBe(tpl.tagsEn.length)
      expect(tpl.tagsZh.length).toBe(tpl.tagsEn.length)
    }
  })

  it('orders Trending filter by curated ids', () => {
    const trending = filterDeckTemplates('trending')
    expect(trending.map((t) => t.id)).toEqual([...TRENDING_TEMPLATE_IDS])
    expect(trending.length).toBe(16)
  })

  it('orders Creative filter by curated ids', () => {
    const creative = filterDeckTemplates('creative')
    expect(creative.map((t) => t.id)).toEqual([...CREATIVE_TEMPLATE_IDS])
  })

  it('matches search queries on label/tags', () => {
    const pitch = getDeckTemplate('pitch-deck')!
    expect(templateMatchesQuery(pitch, 'pitch', 'en')).toBe(true)
    expect(templateMatchesQuery(pitch, 'zzzz-nope', 'en')).toBe(false)
  })

  it('builds style-template gallery messages for Mine tab', () => {
    const msgs = buildGalleryStyleTemplateMessages('My Brand', 'Q4 review', 'vi')
    expect(msgs.displayText).toContain('My Brand')
    expect(msgs.instruction).toContain('style_template: "My Brand"')
    expect(msgs.instruction).toContain('Do NOT pass builtin_template')
  })

  it('builds user-uploaded PPTX gallery messages', () => {
    const msgs = buildGalleryUserDeckMessages('Sales Kit', 'Acme Q1', 'en')
    expect(msgs.displayText).toContain('Sales Kit')
    expect(msgs.instruction).toContain('user-uploaded PowerPoint template')
    expect(msgs.instruction).toContain('Acme Q1')
  })

  it('fills topic into titles and briefs', () => {
    const filled = fillBuiltinTemplate('pitch-deck', 'Acme AI')
    expect(filled).not.toBeNull()
    expect(filled!.topic).toBe('Acme AI')
    expect(filled!.pages[0]!.title).toContain('Acme AI')
    expect(filled!.pages.every((p) => p.brief.includes('Acme AI') || p.title.includes('Acme AI'))).toBe(
      true,
    )
    expect(filled!.style.length).toBeGreaterThan(20)
  })

  it('rejects unknown ids', () => {
    expect(getDeckTemplate('nope')).toBeUndefined()
    expect(fillBuiltinTemplate('nope', 'x')).toBeNull()
    expect(buildGalleryGenerateMessages('nope', 'x', 'en')).toBeNull()
  })

  it('builds display + instruction for gallery send', () => {
    const msgs = buildGalleryGenerateMessages('quarterly-report', 'Sales Q3', 'vi')
    expect(msgs).not.toBeNull()
    expect(msgs!.displayText).toContain('Sales Q3')
    expect(msgs!.instruction).toContain('builtin_template: "quarterly-report"')
    expect(msgs!.instruction).toContain('generate_deck')
  })
})
