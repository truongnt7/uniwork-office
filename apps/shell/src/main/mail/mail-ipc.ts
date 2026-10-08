import { app, ipcMain } from 'electron'
import {
  MAIL_CHANNELS,
  type MailConnectInput,
  type MailSendInput,
} from '../../shared/mail-api'
import {
  clearMailAccount,
  getMailAccount,
  getMailCredentials,
  saveMailAccount,
  touchMailSync,
} from './account-store'
import { MAIL_PRESETS } from './presets'
import { sendMailMessage, syncMailMessages, testMailLogin } from './transport'

function userData(): string {
  return app.getPath('userData')
}

function asConnectInput(raw: unknown): MailConnectInput | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const kind = o.kind
  if (kind !== 'gmail' && kind !== 'outlook' && kind !== 'yahoo' && kind !== 'imap') return null
  if (typeof o.email !== 'string' || typeof o.password !== 'string') return null
  return {
    kind,
    email: o.email,
    password: o.password,
    ...(typeof o.displayName === 'string' ? { displayName: o.displayName } : {}),
    ...(typeof o.imapHost === 'string' ? { imapHost: o.imapHost } : {}),
    ...(typeof o.imapPort === 'number' ? { imapPort: o.imapPort } : {}),
    ...(typeof o.imapTls === 'boolean' ? { imapTls: o.imapTls } : {}),
    ...(typeof o.smtpHost === 'string' ? { smtpHost: o.smtpHost } : {}),
    ...(typeof o.smtpPort === 'number' ? { smtpPort: o.smtpPort } : {}),
    ...(typeof o.smtpSecure === 'boolean' ? { smtpSecure: o.smtpSecure } : {}),
  }
}

/** Workbench Email: connect personal IMAP/SMTP mailboxes (Gmail / Outlook / Yahoo / custom). */
export function registerMailIpc(): void {
  ipcMain.handle(MAIL_CHANNELS.getAccount, () => getMailAccount(userData()))

  ipcMain.handle(MAIL_CHANNELS.listPresets, () =>
    MAIL_PRESETS.map((p) => ({
      kind: p.kind,
      label: p.label,
      hint: p.hint,
      endpoints: p.endpoints,
    })),
  )

  ipcMain.handle(MAIL_CHANNELS.connect, async (_e, raw: unknown) => {
    const input = asConnectInput(raw)
    if (!input) return { ok: false as const, error: 'Invalid mailbox settings' }

    const saved = saveMailAccount(userData(), input)
    if (!saved.ok) return saved

    const creds = getMailCredentials(userData())
    if (!creds) return { ok: false as const, error: 'Could not read saved credentials' }

    const test = await testMailLogin(creds.account, creds.password)
    if (!test.ok) {
      clearMailAccount(userData())
      return { ok: false as const, error: test.error }
    }
    return { ok: true as const, account: saved.account }
  })

  ipcMain.handle(MAIL_CHANNELS.disconnect, () => {
    clearMailAccount(userData())
    return { ok: true as const }
  })

  ipcMain.handle(MAIL_CHANNELS.test, async () => {
    const creds = getMailCredentials(userData())
    if (!creds) return { ok: false as const, error: 'No mailbox connected' }
    return testMailLogin(creds.account, creds.password)
  })

  ipcMain.handle(MAIL_CHANNELS.sync, async (_e, opts: unknown) => {
    const creds = getMailCredentials(userData())
    if (!creds) return { ok: false as const, error: 'No mailbox connected' }
    const limit =
      opts && typeof opts === 'object' && typeof (opts as { limit?: unknown }).limit === 'number'
        ? Math.min(100, Math.max(5, (opts as { limit: number }).limit))
        : 40
    const result = await syncMailMessages(creds.account, creds.password, limit)
    if (!result.ok) return result
    const account = touchMailSync(userData()) ?? creds.account
    return { ok: true as const, account, messages: result.messages }
  })

  ipcMain.handle(MAIL_CHANNELS.send, async (_e, raw: unknown) => {
    const creds = getMailCredentials(userData())
    if (!creds) return { ok: false as const, error: 'No mailbox connected' }
    if (!raw || typeof raw !== 'object') return { ok: false as const, error: 'Invalid message' }
    const o = raw as Record<string, unknown>
    const input: MailSendInput = {
      to: typeof o.to === 'string' ? o.to : '',
      subject: typeof o.subject === 'string' ? o.subject : '',
      body: typeof o.body === 'string' ? o.body : '',
      ...(typeof o.cc === 'string' ? { cc: o.cc } : {}),
    }
    return sendMailMessage(creds.account, creds.password, input)
  })
}
