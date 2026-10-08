import type { MailProviderKind, MailServerEndpoints } from '../../shared/mail-api'

export interface MailPreset {
  kind: MailProviderKind
  label: string
  hint: string
  endpoints: MailServerEndpoints
}

export const MAIL_PRESETS: readonly MailPreset[] = [
  {
    kind: 'gmail',
    label: 'Gmail',
    hint: 'Use a Google App Password (2FA required). IMAP must be enabled in Gmail settings.',
    endpoints: {
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      imapTls: true,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 465,
      smtpSecure: true,
    },
  },
  {
    kind: 'outlook',
    label: 'Outlook.com / Microsoft 365',
    hint: 'Use your Microsoft account password or an app password if your org requires it. No Outlook desktop install needed.',
    endpoints: {
      imapHost: 'outlook.office365.com',
      imapPort: 993,
      imapTls: true,
      smtpHost: 'smtp.office365.com',
      smtpPort: 587,
      smtpSecure: false,
    },
  },
  {
    kind: 'yahoo',
    label: 'Yahoo Mail',
    hint: 'Generate an app password in Yahoo Account Security, then paste it here.',
    endpoints: {
      imapHost: 'imap.mail.yahoo.com',
      imapPort: 993,
      imapTls: true,
      smtpHost: 'smtp.mail.yahoo.com',
      smtpPort: 465,
      smtpSecure: true,
    },
  },
  {
    kind: 'imap',
    label: 'Other IMAP / webmail',
    hint: 'Enter your provider’s IMAP and SMTP hosts (common for company webmail).',
    endpoints: {
      imapHost: '',
      imapPort: 993,
      imapTls: true,
      smtpHost: '',
      smtpPort: 587,
      smtpSecure: false,
    },
  },
] as const

export function resolveEndpoints(
  kind: MailProviderKind,
  override?: Partial<MailServerEndpoints>,
): MailServerEndpoints {
  const base = MAIL_PRESETS.find((p) => p.kind === kind)?.endpoints ?? MAIL_PRESETS[3]!.endpoints
  return {
    imapHost: (override?.imapHost ?? base.imapHost).trim(),
    imapPort: Number(override?.imapPort ?? base.imapPort) || base.imapPort,
    imapTls: override?.imapTls ?? base.imapTls,
    smtpHost: (override?.smtpHost ?? base.smtpHost).trim(),
    smtpPort: Number(override?.smtpPort ?? base.smtpPort) || base.smtpPort,
    smtpSecure: override?.smtpSecure ?? base.smtpSecure,
  }
}

export function validateEndpoints(ep: MailServerEndpoints): string | null {
  if (!ep.imapHost) return 'IMAP host is required'
  if (!ep.smtpHost) return 'SMTP host is required'
  if (ep.imapPort < 1 || ep.imapPort > 65535) return 'Invalid IMAP port'
  if (ep.smtpPort < 1 || ep.smtpPort > 65535) return 'Invalid SMTP port'
  return null
}
