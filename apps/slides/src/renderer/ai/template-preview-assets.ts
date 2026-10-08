/**
 * Phase B static gallery previews for featured builtin templates.
 * Missing ids fall back to Phase A CSS MockCover in the gallery modal.
 */

import pitchCover from './template-previews/pitch-deck/cover.svg?url'
import pitchP01 from './template-previews/pitch-deck/p01.svg?url'
import pitchP02 from './template-previews/pitch-deck/p02.svg?url'
import pitchP03 from './template-previews/pitch-deck/p03.svg?url'
import pitchP04 from './template-previews/pitch-deck/p04.svg?url'

import quarterlyCover from './template-previews/quarterly-report/cover.svg?url'
import quarterlyP01 from './template-previews/quarterly-report/p01.svg?url'
import quarterlyP02 from './template-previews/quarterly-report/p02.svg?url'
import quarterlyP03 from './template-previews/quarterly-report/p03.svg?url'
import quarterlyP04 from './template-previews/quarterly-report/p04.svg?url'

import launchCover from './template-previews/product-launch/cover.svg?url'
import launchP01 from './template-previews/product-launch/p01.svg?url'
import launchP02 from './template-previews/product-launch/p02.svg?url'
import launchP03 from './template-previews/product-launch/p03.svg?url'
import launchP04 from './template-previews/product-launch/p04.svg?url'

import trainingCover from './template-previews/training/cover.svg?url'
import trainingP01 from './template-previews/training/p01.svg?url'
import trainingP02 from './template-previews/training/p02.svg?url'
import trainingP03 from './template-previews/training/p03.svg?url'
import trainingP04 from './template-previews/training/p04.svg?url'

import salesCover from './template-previews/sales-proposal/cover.svg?url'
import salesP01 from './template-previews/sales-proposal/p01.svg?url'
import salesP02 from './template-previews/sales-proposal/p02.svg?url'
import salesP03 from './template-previews/sales-proposal/p03.svg?url'
import salesP04 from './template-previews/sales-proposal/p04.svg?url'

import companyCover from './template-previews/company-intro/cover.svg?url'
import companyP01 from './template-previews/company-intro/p01.svg?url'
import companyP02 from './template-previews/company-intro/p02.svg?url'
import companyP03 from './template-previews/company-intro/p03.svg?url'
import companyP04 from './template-previews/company-intro/p04.svg?url'

export interface TemplatePreviewAssets {
  readonly cover: string
  readonly pages: readonly string[]
}

/** Featured templates that ship Phase B artwork (plan: top 6). */
export const FEATURED_TEMPLATE_PREVIEW_IDS = [
  'pitch-deck',
  'quarterly-report',
  'product-launch',
  'training',
  'sales-proposal',
  'company-intro',
] as const

export type FeaturedTemplatePreviewId = (typeof FEATURED_TEMPLATE_PREVIEW_IDS)[number]

const PREVIEWS: Record<FeaturedTemplatePreviewId, TemplatePreviewAssets> = {
  'pitch-deck': {
    cover: pitchCover,
    pages: [pitchP01, pitchP02, pitchP03, pitchP04],
  },
  'quarterly-report': {
    cover: quarterlyCover,
    pages: [quarterlyP01, quarterlyP02, quarterlyP03, quarterlyP04],
  },
  'product-launch': {
    cover: launchCover,
    pages: [launchP01, launchP02, launchP03, launchP04],
  },
  training: {
    cover: trainingCover,
    pages: [trainingP01, trainingP02, trainingP03, trainingP04],
  },
  'sales-proposal': {
    cover: salesCover,
    pages: [salesP01, salesP02, salesP03, salesP04],
  },
  'company-intro': {
    cover: companyCover,
    pages: [companyP01, companyP02, companyP03, companyP04],
  },
}

export function getTemplatePreviewAssets(templateId: string): TemplatePreviewAssets | null {
  if ((FEATURED_TEMPLATE_PREVIEW_IDS as readonly string[]).includes(templateId)) {
    return PREVIEWS[templateId as FeaturedTemplatePreviewId] ?? null
  }
  return null
}

export function isFeaturedTemplatePreview(templateId: string): boolean {
  return (FEATURED_TEMPLATE_PREVIEW_IDS as readonly string[]).includes(templateId)
}
