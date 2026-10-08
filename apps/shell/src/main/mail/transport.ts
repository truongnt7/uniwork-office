import { ImapFlow } from 'imapflow'
import nodemailer from 'nodemailer'
import { simpleParser } from 'mailparser'
import type { MailAccountPublic, MailRemoteMessage, MailSendInput } from '../../shared/mail-api'

function addrList(
  value: { text?: string; value?: Array<{ address?: string | null; name?: string | null }> } | undefined,
): string {
  if (!value) return ''
  if (value.text?.trim()) return value.text.trim()
  if (Array.isArray(value.value)) {
    return value.value
      .map((a) => {
        const address = a.address?.trim()
        const name = a.name?.trim()
        if (name && address) return `${name} <${address}>`
        return address || name || ''
      })
      .filter(Boolean)
      .join(', ')
  }
  return ''
}

function makeClient(account: MailAccountPublic, password: string): ImapFlow {
  return new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: account.imapTls,
    auth: { user: account.email, pass: password },
    logger: false,
  })
}

export async function testMailLogin(
  account: MailAccountPublic,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = makeClient(account, password)
  try {
    await client.connect()
    await client.mailboxOpen('INBOX')
    await client.logout()
    return { ok: true }
  } catch (err) {
    try {
      client.close()
    } catch {
      /* ignore */
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

async function fetchMailbox(
  client: ImapFlow,
  account: MailAccountPublic,
  mailbox: string,
  folder: 'inbox' | 'sent',
  limit: number,
): Promise<MailRemoteMessage[]> {
  const lock = await client.getMailboxLock(mailbox)
  const out: MailRemoteMessage[] = []
  try {
    const mailbox = client.mailbox
    const exists = mailbox && typeof mailbox === 'object' ? mailbox.exists : 0
    if (exists <= 0) return out
    const from = Math.max(1, exists - limit + 1)
    for await (const msg of client.fetch(`${from}:${exists}`, {
      uid: true,
      flags: true,
      envelope: true,
      source: true,
    })) {
      const uid = String(msg.uid)
      let subject = msg.envelope?.subject?.trim() || ''
      let fromAddr = addrList(msg.envelope?.from as never)
      let toAddr = addrList(msg.envelope?.to as never)
      let ccAddr = addrList(msg.envelope?.cc as never)
      let body = ''
      let date = msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : new Date().toISOString()
      if (msg.source) {
        try {
          const parsed = await simpleParser(msg.source)
          if (parsed.subject) subject = String(parsed.subject)
          if (parsed.from?.text) fromAddr = parsed.from.text
          if (parsed.to) {
            const t = Array.isArray(parsed.to) ? parsed.to.map((x) => x.text).join(', ') : parsed.to.text
            if (t) toAddr = t
          }
          if (parsed.cc) {
            const c = Array.isArray(parsed.cc) ? parsed.cc.map((x) => x.text).join(', ') : parsed.cc.text
            if (c) ccAddr = c
          }
          body = (parsed.text || parsed.html || '').toString()
          if (parsed.html && !parsed.text) {
            body = body
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
          }
          if (parsed.date) date = parsed.date.toISOString()
        } catch {
          body = msg.source.toString('utf8').slice(0, 4000)
        }
      }
      const unread = !(msg.flags && (msg.flags.has('\\Seen') || msg.flags.has('Seen')))
      out.push({
        id: `${account.id}:${folder}:${uid}`,
        accountId: account.id,
        remoteUid: uid,
        folder,
        from: fromAddr,
        to: toAddr,
        ...(ccAddr ? { cc: ccAddr } : {}),
        subject,
        body,
        unread,
        createdAt: date,
        updatedAt: date,
      })
    }
  } finally {
    lock.release()
  }
  return out
}

/** Common Sent folder names across providers */
const SENT_CANDIDATES = ['Sent', 'INBOX.Sent', '[Gmail]/Sent Mail', 'Sent Items', 'Sent Messages']

async function openFirstExisting(client: ImapFlow, names: string[]): Promise<string | null> {
  for (const name of names) {
    try {
      await client.mailboxOpen(name)
      return name
    } catch {
      /* try next */
    }
  }
  return null
}

export async function syncMailMessages(
  account: MailAccountPublic,
  password: string,
  limit = 40,
): Promise<{ ok: true; messages: MailRemoteMessage[] } | { ok: false; error: string }> {
  const client = makeClient(account, password)
  try {
    await client.connect()
    const inbox = await fetchMailbox(client, account, 'INBOX', 'inbox', limit)
    const sentName = await openFirstExisting(client, SENT_CANDIDATES)
    const sent = sentName
      ? await fetchMailbox(client, account, sentName, 'sent', Math.min(20, limit))
      : []
    await client.logout()
    return { ok: true, messages: [...inbox, ...sent] }
  } catch (err) {
    try {
      client.close()
    } catch {
      /* ignore */
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function sendMailMessage(
  account: MailAccountPublic,
  password: string,
  input: MailSendInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const to = input.to.trim()
  const subject = input.subject.trim()
  if (!to) return { ok: false, error: 'Recipient is required' }
  if (!subject) return { ok: false, error: 'Subject is required' }

  const transporter = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpSecure,
    auth: { user: account.email, pass: password },
  })

  try {
    await transporter.sendMail({
      from: account.displayName ? `"${account.displayName}" <${account.email}>` : account.email,
      to,
      ...(input.cc?.trim() ? { cc: input.cc.trim() } : {}),
      subject,
      text: input.body ?? '',
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  } finally {
    transporter.close()
  }
}
