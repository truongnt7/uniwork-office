import { describe, expect, it } from 'vitest'
import {
  classifyMyAiRoute,
  extractClassifyJson,
  routeFromClassifyJson,
  shouldAttemptLlmClassify,
  shouldSkipClassifyForLocalTopic,
} from '../src/renderer/src/my-ai-classify'
import { routeMyAiText } from '../src/renderer/src/my-ai-router'

describe('my-ai LLM classify', () => {
  it('attempts classify for unknown and ask_create only', () => {
    expect(shouldAttemptLlmClassify(routeMyAiText('xin chào bạn khỏe không'))).toBe(true)
    expect(shouldAttemptLlmClassify(routeMyAiText('Tạo Word'))).toBe(true)
    expect(shouldAttemptLlmClassify(routeMyAiText('Tạo Word trống'))).toBe(false)
    expect(
      shouldAttemptLlmClassify(routeMyAiText('Soạn văn bản Word: thư mời họp khách')),
    ).toBe(false)
    expect(shouldAttemptLlmClassify(routeMyAiText('Mở file báo cáo'))).toBe(false)
  })

  it('skips classify for strong local topics', () => {
    expect(shouldSkipClassifyForLocalTopic('brief')).toBe(true)
    expect(shouldSkipClassifyForLocalTopic('calendar')).toBe(true)
    expect(shouldSkipClassifyForLocalTopic('fallback')).toBe(false)
  })

  it('parses fenced JSON and builds create_file', () => {
    const json = extractClassifyJson(
      '```json\n{"kind":"create_file","app":"docs","blank":false,"brief":"báo giá tháng 10"}\n```',
    )
    expect(json?.kind).toBe('create_file')
    const route = routeFromClassifyJson(json!, 'Soạn giúp báo giá')
    expect(route).toMatchObject({
      kind: 'create_file',
      app: 'docs',
      blank: false,
      brief: 'báo giá tháng 10',
    })
  })

  it('downgrades empty brief create to ask_create', () => {
    const route = routeFromClassifyJson(
      { kind: 'create_file', app: 'docs', blank: false, brief: 'giúp tôi' },
      'Tạo Word',
    )
    expect(route).toMatchObject({ kind: 'ask_create', app: 'docs' })
  })

  it('builds a plan with goals', () => {
    const route = routeFromClassifyJson(
      {
        kind: 'plan',
        goalVi: 'Báo giá và follow-up',
        goalEn: 'Quote and follow-up',
        steps: [
          { kind: 'create_file', app: 'docs', blank: false, brief: 'báo giá ABC' },
          { kind: 'workbench', workbenchModule: 'tasks', workbenchAction: 'add_item' },
        ],
      },
      'Soạn báo giá và thêm việc',
    )
    expect(route?.kind).toBe('plan')
    if (route?.kind !== 'plan') return
    expect(route.steps).toHaveLength(2)
    expect(route.goalVi).toBe('Báo giá và follow-up')
  })

  it('classifyMyAiRoute uses chat and returns null on bad payload', async () => {
    const ok = await classifyMyAiRoute({
      userText: 'Soạn Word báo cáo tuần',
      contextPlain: 'Recent: a.docx',
      vi: true,
      hasAttachments: false,
      chat: async () => ({
        ok: true,
        content: '{"kind":"create_file","app":"docs","blank":false,"brief":"báo cáo tuần"}',
      }),
    })
    expect(ok).toMatchObject({ kind: 'create_file', app: 'docs' })

    const bad = await classifyMyAiRoute({
      userText: 'hello',
      contextPlain: '',
      vi: false,
      hasAttachments: false,
      chat: async () => ({ ok: true, content: 'not json' }),
    })
    expect(bad).toBeNull()

    const fail = await classifyMyAiRoute({
      userText: 'hello',
      contextPlain: '',
      vi: false,
      hasAttachments: false,
      chat: async () => ({ ok: false, error: 'network' }),
    })
    expect(fail).toBeNull()
  })

  it('rejects invalid workbench module', () => {
    expect(
      routeFromClassifyJson(
        { kind: 'workbench', workbenchModule: 'not-a-module', workbenchAction: 'open' },
        'mở gì đó',
      ),
    ).toBeNull()
  })
})
