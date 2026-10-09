import { describe, expect, it } from 'vitest'
import type { AiSettings } from '@genoffice/ai-provider'
import { defaultAiSettings } from '@genoffice/ai-provider'
import { withTrialAiAuth } from '../src/main/trial-ai'

/**
 * withTrialAiAuth only injects when the slot is empty; we cannot assert the
 * real key without Electron app + env, so this covers the BYOK passthrough.
 */
describe('withTrialAiAuth', () => {
  it('leaves an existing customer key untouched', () => {
    const settings = defaultAiSettings() as AiSettings
    settings.providers.genspark = {
      ...settings.providers.genspark!,
      apiKey: 'sk-or-customer',
      model: 'openrouter/auto',
    }
    const next = withTrialAiAuth(settings, 'genspark', settings.providers.genspark)
    expect(next?.apiKey).toBe('sk-or-customer')
  })

  it('does not rewrite non-hub providers', () => {
    const settings = defaultAiSettings() as AiSettings
    settings.providers.anthropic = {
      apiKey: '',
      model: 'claude-sonnet-5',
    }
    const next = withTrialAiAuth(settings, 'anthropic', settings.providers.anthropic)
    expect(next?.apiKey).toBe('')
  })
})
