import { describe, expect, it } from 'vitest'
import { extractLaunchUrlFromArgv, parseOfficeLaunchUrl } from '../src/protocol'
import { assertSafeApiOrigin } from '../src/origin'

describe('parseOfficeLaunchUrl', () => {
  it('accepts opaque token deep links', () => {
    const token = 'olt_' + 'a'.repeat(40)
    expect(parseOfficeLaunchUrl(`uniwork://office/open?token=${token}`)).toEqual({
      ok: true,
      token,
    })
  })

  it('rejects jwt query params', () => {
    expect(parseOfficeLaunchUrl('uniwork://office/open?jwt=aaa.bbb.ccc').ok).toBe(false)
  })

  it('rejects jwt-shaped tokens', () => {
    expect(parseOfficeLaunchUrl('uniwork://office/open?token=aaa.bbb.ccc').ok).toBe(false)
  })

  it('rejects file path params', () => {
    expect(parseOfficeLaunchUrl('uniwork://office/open?token=olt_abcdefghijklmnop&file=/tmp/x.docx').ok).toBe(
      false,
    )
  })

  it('rejects other schemes', () => {
    expect(parseOfficeLaunchUrl('https://evil.example/office/open?token=olt_abcdefghijklmnop').ok).toBe(
      false,
    )
  })
})

describe('extractLaunchUrlFromArgv', () => {
  it('finds the protocol URL among argv', () => {
    expect(
      extractLaunchUrlFromArgv(['Electron', 'uniwork://office/open?token=olt_abcdefghijklmnop']),
    ).toMatch(/^uniwork:/)
  })
})

describe('assertSafeApiOrigin', () => {
  it('allows https and loopback http', () => {
    expect(assertSafeApiOrigin('https://uniwork.example')).toBe('https://uniwork.example')
    expect(assertSafeApiOrigin('http://127.0.0.1:9')).toBe('http://127.0.0.1:9')
  })

  it('rejects remote http and credentials in URL', () => {
    expect(() => assertSafeApiOrigin('http://example.com')).toThrow()
    expect(() => assertSafeApiOrigin('https://user:pass@example.com')).toThrow()
  })
})
