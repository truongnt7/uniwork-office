import { describe, expect, it } from 'vitest'
import { defaultAiSettings, OPENROUTER_DEFAULT_MODEL } from '@genoffice/ai-provider'
import {
  clampModelToManagedAllowlist,
  clampSettingsToManagedHub,
} from '../src/main/managed-ai'

describe('managed AI hub clamp', () => {
  it('clamps unknown models to the default allowlisted id', () => {
    expect(clampModelToManagedAllowlist('not-a-real-model')).toBe(OPENROUTER_DEFAULT_MODEL)
    expect(clampModelToManagedAllowlist('anthropic/claude-sonnet-5.5')).toBe(
      'anthropic/claude-sonnet-5.5',
    )
  })

  it('forces UniAI provider and strips customer hub keys', () => {
    const s = defaultAiSettings()
    s.provider = 'anthropic'
    s.providers.genspark = {
      apiKey: 'sk-or-customer',
      model: 'openai/gpt-not-real',
    }
    s.providers.anthropic = { apiKey: 'sk-ant', model: 'claude' }
    const next = clampSettingsToManagedHub(s)
    expect(next.provider).toBe('genspark')
    expect(next.providers.genspark?.apiKey).toBe('')
    expect(next.providers.openrouter?.apiKey).toBe('')
    expect(next.providers.genspark?.model).toBe(OPENROUTER_DEFAULT_MODEL)
  })
})
