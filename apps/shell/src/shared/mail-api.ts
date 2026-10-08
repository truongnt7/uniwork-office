/** Personal mailbox connect (IMAP/SMTP) — Gmail / Outlook.com / Yahoo / custom. */

export type MailProviderKind = 'gmail' | 'outlook' | 'yahoo' | 'imap'

export interface MailServerEndpoints {
  imapHost: string
  imapPort: number
  /** true = implicit TLS (usually 993) */
  imapTls: boolean
  smtpHost: string
  smtpPort: number
  /** true = SMTP over TLS (465); false = STARTTLS (587) */
  smtpSecure: boolean
}

export interface MailAccountPublic extends MailServerEndpoints {
  id: string
  kind: MailProviderKind
  email: string
  displayName?: string
  connectedAt: string
  lastSyncAt?: string
}

export interface MailConnectInput extends Partial<MailServerEndpoints> {
  kind: MailProviderKind
  email: string
  /** App password or mailbox password — never returned to the renderer after save */
  password: string
  displayName?: string
}

export interface MailRemoteMessage {
  /** Stable id: accountId:folder:uid */
  id: string
  accountId: string
  remoteUid: string
  folder: 'inbox' | 'sent'
  from: string
  to: string
  cc?: string
  subject: string
  body: string
  unread: boolean
  createdAt: string
  updatedAt: string
}

export interface MailSyncResult {
  ok: boolean
  account?: MailAccountPublic
  messages?: MailRemoteMessage[]
  error?: string
}

export interface MailSendInput {
  to: string
  cc?: string
  subject: string
  body: string
  /** Reply-To / In-Reply-To reserved for later */
}

export interface MailSendResult {
  ok: boolean
  error?: string
}

export interface MailApi {
  getAccount(): Promise<MailAccountPublic | null>
  listPresets(): Promise<
    Array<{ kind: MailProviderKind; label: string; hint: string; endpoints: MailServerEndpoints }>
  >
  connect(input: MailConnectInput): Promise<{ ok: boolean; account?: MailAccountPublic; error?: string }>
  disconnect(): Promise<{ ok: boolean }>
  testConnection(): Promise<{ ok: boolean; error?: string }>
  sync(opts?: { limit?: number }): Promise<MailSyncResult>
  send(input: MailSendInput): Promise<MailSendResult>
}

export const MAIL_CHANNELS = {
  getAccount: 'mail:get-account',
  listPresets: 'mail:list-presets',
  connect: 'mail:connect',
  disconnect: 'mail:disconnect',
  test: 'mail:test',
  sync: 'mail:sync',
  send: 'mail:send',
} as const
