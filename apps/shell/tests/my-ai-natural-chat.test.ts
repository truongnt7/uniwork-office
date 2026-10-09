import { describe, expect, it } from 'vitest'
import {
  NATURAL_CHAT_MODEL_OPTIONS,
  naturalChatSystemPrompt,
  naturalChatUserPayload,
  normalizeMyAiNaturalChatPref,
  normalizeNaturalChatModel,
  shouldAutoNaturalChat,
  shouldPromptNaturalChatOptIn,
  withNaturalChatModel,
} from '../src/renderer/src/my-ai-natural-chat'
import { routeMyAiText } from '../src/renderer/src/my-ai-router'
import { defaultAiSettings } from '@genoffice/ai-provider'

describe('My AI natural chat (Phase A)', () => {
  it('builds vi/en system prompts with context pack', () => {
    const vi = naturalChatSystemPrompt(true, 'Lịch: họp 10h')
    expect(vi).toMatch(/uniAI/)
    expect(vi).toMatch(/tiếng Việt/)
    expect(vi).toMatch(/Lịch: họp 10h/)
    expect(vi).toMatch(/không bịa/)

    const en = naturalChatSystemPrompt(false, 'Calendar: standup')
    expect(en).toMatch(/uniAI/)
    expect(en).toMatch(/English/)
    expect(en).toMatch(/Calendar: standup/)
  })

  it('appends attachment block to user payload', () => {
    expect(naturalChatUserPayload('Xin chào', null)).toBe('Xin chào')
    expect(naturalChatUserPayload('Tóm tắt', '--- a.docx ---\nhello')).toContain('Attachments:')
    expect(naturalChatUserPayload('Tóm tắt', '--- a.docx ---\nhello')).toContain('hello')
  })

  it('normalizes pref values', () => {
    expect(normalizeMyAiNaturalChatPref(true)).toBe('on')
    expect(normalizeMyAiNaturalChatPref('on')).toBe('on')
    expect(normalizeMyAiNaturalChatPref(false)).toBe('off')
    expect(normalizeMyAiNaturalChatPref(undefined)).toBe('unset')
    expect(normalizeMyAiNaturalChatPref('nope')).toBe('unset')
  })

  it('auto-chats unknown fallback only when opted in + AI ready', () => {
    expect(
      shouldAutoNaturalChat({
        aiReady: true,
        naturalChatPref: 'on',
        userText: 'Giúp mình lên kế hoạch tuần này',
        hasAttachments: false,
        localTopic: 'fallback',
        localContextUsed: false,
      }),
    ).toBe(true)
    expect(
      shouldAutoNaturalChat({
        aiReady: true,
        naturalChatPref: 'unset',
        userText: 'Giúp mình lên kế hoạch tuần này',
        hasAttachments: false,
        localTopic: 'fallback',
      }),
    ).toBe(false)
    expect(
      shouldAutoNaturalChat({
        aiReady: true,
        naturalChatPref: 'off',
        userText: 'Giúp mình lên kế hoạch tuần này',
        hasAttachments: false,
        localTopic: 'fallback',
      }),
    ).toBe(false)
  })

  it('prompts first-time opt-in when unset + AI ready', () => {
    expect(
      shouldPromptNaturalChatOptIn({
        aiReady: true,
        naturalChatPref: 'unset',
        userText: 'Giúp mình sắp xếp việc',
        hasAttachments: false,
        localTopic: 'fallback',
      }),
    ).toBe(true)
    expect(
      shouldPromptNaturalChatOptIn({
        aiReady: true,
        naturalChatPref: 'on',
        userText: 'Giúp mình sắp xếp việc',
        hasAttachments: false,
        localTopic: 'fallback',
      }),
    ).toBe(false)
  })

  it('skips auto-chat when local pulse already answered', () => {
    expect(
      shouldAutoNaturalChat({
        aiReady: true,
        naturalChatPref: 'on',
        userText: 'Hôm nay có gì?',
        hasAttachments: false,
        localTopic: 'pulse',
        localContextUsed: true,
      }),
    ).toBe(false)
    expect(
      shouldPromptNaturalChatOptIn({
        aiReady: true,
        naturalChatPref: 'unset',
        userText: 'Hôm nay có gì?',
        hasAttachments: false,
        localTopic: 'pulse',
        localContextUsed: true,
      }),
    ).toBe(false)
  })

  it('respects consent even when pref is off', () => {
    expect(
      shouldAutoNaturalChat({
        aiReady: true,
        naturalChatPref: 'off',
        userText: 'Hôm nay có gì?',
        hasAttachments: false,
        consentGranted: true,
        localTopic: 'pulse',
        localContextUsed: true,
      }),
    ).toBe(true)
  })

  it('does not auto-chat when AI is not ready', () => {
    expect(
      shouldAutoNaturalChat({
        aiReady: false,
        naturalChatPref: 'on',
        userText: 'Hello there friend',
        hasAttachments: false,
        localTopic: 'fallback',
      }),
    ).toBe(false)
  })

  it('normalizes natural-chat model override', () => {
    expect(normalizeNaturalChatModel('')).toBe('')
    expect(normalizeNaturalChatModel('  openrouter/auto  ')).toBe('openrouter/auto')
    expect(NATURAL_CHAT_MODEL_OPTIONS.length).toBeGreaterThan(0)
    const base = defaultAiSettings()
    const patched = withNaturalChatModel(base, 'anthropic/claude-sonnet-5')
    expect(patched.providers[patched.provider]?.model).toBe('anthropic/claude-sonnet-5')
    expect(withNaturalChatModel(base, '').providers[base.provider]?.model).toBe(
      base.providers[base.provider]?.model,
    )
  })

  it('never steals clear action routes from the existing router', () => {
    const clear = [
      'Mở tab lịch của tôi',
      'Tạo Word trống',
      'Tóm tắt file đang mở',
      'Soạn văn bản Word: thư mời họp khách',
    ]
    for (const text of clear) {
      const route = routeMyAiText(text)
      expect(route.kind).not.toBe('unknown')
      expect(
        shouldAutoNaturalChat({
          aiReady: true,
          routeKind: route.kind,
          naturalChatPref: 'on',
          userText: text,
          hasAttachments: false,
          localTopic: 'fallback',
        }),
      ).toBe(false)
      expect(
        shouldPromptNaturalChatOptIn({
          aiReady: true,
          routeKind: route.kind,
          naturalChatPref: 'unset',
          userText: text,
          hasAttachments: false,
          localTopic: 'fallback',
        }),
      ).toBe(false)
    }

    const vague = routeMyAiText('Giúp mình nghĩ ý tưởng hay')
    expect(vague.kind).toBe('unknown')
    expect(
      shouldAutoNaturalChat({
        aiReady: true,
        routeKind: vague.kind,
        naturalChatPref: 'on',
        userText: 'Giúp mình nghĩ ý tưởng hay',
        hasAttachments: false,
        localTopic: 'fallback',
      }),
    ).toBe(true)
  })
})
