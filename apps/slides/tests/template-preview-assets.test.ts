import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { DECK_TEMPLATES } from '../src/renderer/ai/deck-templates'
import {
  FEATURED_TEMPLATE_PREVIEW_IDS,
  getTemplatePreviewAssets,
  isFeaturedTemplatePreview,
} from '../src/renderer/ai/template-preview-assets'

describe('template-preview-assets (Phase B)', () => {
  it('covers the planned top-6 featured ids that exist in the catalog', () => {
    const catalogIds = new Set(DECK_TEMPLATES.map((t) => t.id))
    expect(FEATURED_TEMPLATE_PREVIEW_IDS).toHaveLength(6)
    for (const id of FEATURED_TEMPLATE_PREVIEW_IDS) {
      expect(catalogIds.has(id)).toBe(true)
      expect(isFeaturedTemplatePreview(id)).toBe(true)
      const assets = getTemplatePreviewAssets(id)
      expect(assets).not.toBeNull()
      expect(assets!.cover).toBeTruthy()
      expect(assets!.pages.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('falls back to null for non-featured templates', () => {
    expect(getTemplatePreviewAssets('meeting-brief')).toBeNull()
    expect(isFeaturedTemplatePreview('meeting-brief')).toBe(false)
    expect(getTemplatePreviewAssets('nope')).toBeNull()
  })

  it('ships cover + p01–p04 files on disk for each featured template', () => {
    const root = join(__dirname, '../src/renderer/ai/template-previews')
    for (const id of FEATURED_TEMPLATE_PREVIEW_IDS) {
      expect(existsSync(join(root, id, 'cover.svg'))).toBe(true)
      for (const n of [1, 2, 3, 4]) {
        expect(existsSync(join(root, id, `p${String(n).padStart(2, '0')}.svg`))).toBe(true)
      }
    }
  })
})
