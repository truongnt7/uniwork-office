/**
 * Phase D / P0 — which My AI steps need inline consent vs auto-run.
 * Deep read / local mutate / Token AI → confirm; open tab / blank create → auto.
 */
import type { MyAiRoute, MyAiStep } from './my-ai-router'

export type ConsentReason = 'deep_read' | 'mutate' | 'ai_token'

export interface ConsentNeed {
  reason: ConsentReason
  labelVi: string
  labelEn: string
}

export function stepNeedsConsent(step: MyAiStep): ConsentNeed | null {
  if (step.kind === 'summarize_recents' || step.kind === 'summarize_active') {
    return {
      reason: 'deep_read',
      labelVi: 'Đọc excerpt nội dung file trên máy (có thể gọi Hub AI / Token)',
      labelEn: 'Read on-device file excerpts (may call AI Hub / Tokens)',
    }
  }
  if (step.kind === 'create_file' && !step.blank && step.brief?.trim()) {
    return {
      reason: 'ai_token',
      labelVi: `Tạo ${step.app} kèm brief AI (có thể trừ Token)`,
      labelEn: `Create ${step.app} with AI brief (may use Tokens)`,
    }
  }
  if (step.kind === 'continue_active') {
    return {
      reason: 'ai_token',
      labelVi: 'Gửi yêu cầu AI vào tab đang mở (có thể trừ Token)',
      labelEn: 'Queue AI on the open tab (may use Tokens)',
    }
  }
  if (step.kind === 'workbench' && step.intent.action === 'add_item') {
    return {
      reason: 'mutate',
      labelVi: `Thêm mục vào ${step.intent.target.kind === 'module' ? step.intent.target.id : 'Workbench'}`,
      labelEn: `Add item to ${step.intent.target.kind === 'module' ? step.intent.target.id : 'Workbench'}`,
    }
  }
  return null
}

export function routeNeedsConsent(route: MyAiRoute): ConsentNeed[] {
  if (route.kind === 'unknown') return []
  if (route.kind === 'plan') {
    const out: ConsentNeed[] = []
    const seen = new Set<string>()
    for (const step of route.steps) {
      const need = stepNeedsConsent(step)
      if (!need) continue
      const key = `${need.reason}:${need.labelEn}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(need)
    }
    return out
  }
  const one = stepNeedsConsent(route)
  return one ? [one] : []
}

export function describeConsent(route: MyAiRoute, vi: boolean): string {
  const needs = routeNeedsConsent(route)
  if (needs.length === 0) return ''
  const lines = needs.map((n) => `• ${vi ? n.labelVi : n.labelEn}`)
  const hasToken = needs.some((n) => n.reason === 'ai_token' || n.reason === 'deep_read')
  const tokenNote = hasToken
    ? vi
      ? '\n\nThao tác có thể gọi Hub AI và trừ credit/Token. Soạn tay / mở file trống thì không.'
      : '\n\nThis may call your AI Hub and spend credits/Tokens. Manual edits / blank files do not.'
    : ''
  if (route.kind === 'plan') {
    return (
      (vi
        ? `Plan này cần xác nhận trước khi chạy (${route.steps.length} bước):\n`
        : `This plan needs confirmation before running (${route.steps.length} steps):\n`) +
      lines.join('\n') +
      (vi ? `\n${route.summaryVi}` : `\n${route.summaryEn}`) +
      tokenNote
    )
  }
  return (
    (vi ? 'Thao tác cần xác nhận:\n' : 'Action needs confirmation:\n') +
    lines.join('\n') +
    tokenNote
  )
}
