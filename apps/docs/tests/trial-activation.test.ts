import { describe, expect, it } from 'vitest'
import {
  hashActivationCode,
  hashActivationCodes,
  mapServerActivationError,
  normalizeActivationCode,
} from '../src/main/trial-activation'

describe('trial activation codes', () => {
  it('normalizes separators and case', () => {
    expect(normalizeActivationCode(' uw-trial-ab12 ')).toBe('UWTRIALAB12')
    expect(normalizeActivationCode('UW-TRIAL-AB12')).toBe('UWTRIALAB12')
  })

  it('hashes stably for packaging', () => {
    const a = hashActivationCode('UW-TRIAL-AB12')
    const b = hashActivationCode('uw trial ab12')
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{64}$/)
    expect(hashActivationCodes(['UW-TRIAL-AB12', 'uw-trial-ab12'])).toEqual([a])
  })

  it('maps server already_used for one-code-one-device', () => {
    expect(mapServerActivationError('already_used')).toMatch(/another device/i)
    expect(mapServerActivationError('invalid')).toMatch(/not recognized/i)
    expect(mapServerActivationError('rate_limited')).toMatch(/too many/i)
    expect(mapServerActivationError('bad_device')).toMatch(/device/i)
    expect(mapServerActivationError('seat_full')).toMatch(/device limit/i)
  })
})

describe('local activation disabled by default', () => {
  it('exports allowLocalActivation as false without env', async () => {
    const prev = process.env.UNIWORK_TRIAL_ALLOW_LOCAL_ACTIVATION
    delete process.env.UNIWORK_TRIAL_ALLOW_LOCAL_ACTIVATION
    const { allowLocalActivation } = await import('../src/main/trial-activation')
    expect(allowLocalActivation()).toBe(false)
    if (prev === undefined) delete process.env.UNIWORK_TRIAL_ALLOW_LOCAL_ACTIVATION
    else process.env.UNIWORK_TRIAL_ALLOW_LOCAL_ACTIVATION = prev
  })
})
