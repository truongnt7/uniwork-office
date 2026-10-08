import { describe, expect, it } from 'vitest'
import { MAIL_PRESETS, resolveEndpoints, validateEndpoints } from '../src/main/mail/presets'
import { mergeSyncedEmails, normalizeEmailMessage } from '../src/renderer/src/workbench-pins'

describe('mail presets', () => {
  it('covers gmail, outlook, yahoo, and custom imap', () => {
    expect(MAIL_PRESETS.map((p) => p.kind)).toEqual(['gmail', 'outlook', 'yahoo', 'imap'])
  })

  it('resolves gmail endpoints and validates them', () => {
    const ep = resolveEndpoints('gmail')
    expect(ep.imapHost).toBe('imap.gmail.com')
    expect(ep.smtpHost).toBe('smtp.gmail.com')
    expect(validateEndpoints(ep)).toBeNull()
  })

  it('requires hosts for custom imap', () => {
    const ep = resolveEndpoints('imap')
    expect(validateEndpoints(ep)).toMatch(/IMAP host/i)
    expect(
      validateEndpoints(
        resolveEndpoints('imap', {
          imapHost: 'mail.example.com',
          smtpHost: 'mail.example.com',
        }),
      ),
    ).toBeNull()
  })
})

describe('mergeSyncedEmails', () => {
  it('keeps drafts/archive, drops demos, replaces inbox for the account', () => {
    const local = [
      normalizeEmailMessage({
        id: 'demo',
        folder: 'inbox',
        from: 'a',
        to: 'b',
        subject: 'demo',
        body: 'x',
        demo: true,
      }),
      normalizeEmailMessage({
        id: 'draft-1',
        folder: 'drafts',
        from: 'me',
        to: 'you',
        subject: 'Draft',
        body: 'hi',
      }),
      normalizeEmailMessage({
        id: 'old-remote',
        folder: 'inbox',
        from: 'old',
        to: 'me',
        subject: 'Old',
        body: 'gone',
        accountId: 'acc-1',
        remoteUid: '1',
      }),
    ]
    const remote = [
      {
        id: 'acc-1:inbox:9',
        accountId: 'acc-1',
        remoteUid: '9',
        folder: 'inbox' as const,
        from: 'boss@co',
        to: 'me@co',
        subject: 'Hello',
        body: 'World',
        unread: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]
    const merged = mergeSyncedEmails(local, remote, 'acc-1')
    expect(merged.some((m) => m.demo)).toBe(false)
    expect(merged.find((m) => m.id === 'draft-1')).toBeTruthy()
    expect(merged.find((m) => m.id === 'old-remote')).toBeUndefined()
    expect(merged.find((m) => m.id === 'acc-1:inbox:9')?.subject).toBe('Hello')
  })
})
