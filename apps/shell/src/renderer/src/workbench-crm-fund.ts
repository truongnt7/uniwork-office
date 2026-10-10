/**
 * Local CRM (Quan hệ) + Fund/Wallet (Quỹ) — Workbench SQLite via wbStore.
 */
import type { PracticeId } from '@uniwork/practice-core'
import { wbStoreRead, wbStoreWrite } from './workbench-store-client'

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
function nowIso(): string {
  return new Date().toISOString()
}

// ---------- CRM ----------
export interface WbCrmContact {
  id: string
  name: string
  org?: string
  role?: string
  phone?: string
  email?: string
  tags?: string[]
  note?: string
  createdAt: string
  updatedAt: string
}

function crmKey(practiceId: PracticeId): string {
  return `uniwork.wb.crm.contacts.${practiceId}`
}

export function readCrmContacts(practiceId: PracticeId): WbCrmContact[] {
  const raw = wbStoreRead<WbCrmContact[]>(crmKey(practiceId), [])
  return Array.isArray(raw) ? raw.filter((c) => c && c.id && c.name) : []
}

export function writeCrmContacts(practiceId: PracticeId, items: WbCrmContact[]): void {
  wbStoreWrite(crmKey(practiceId), items)
}

export function upsertCrmContact(
  practiceId: PracticeId,
  input: Partial<WbCrmContact> & { name: string },
): WbCrmContact {
  const list = readCrmContacts(practiceId)
  const ts = nowIso()
  if (input.id) {
    const next = list.map((c) =>
      c.id === input.id ? { ...c, ...input, name: input.name.trim(), updatedAt: ts } : c,
    )
    writeCrmContacts(practiceId, next)
    return next.find((c) => c.id === input.id)!
  }
  const row: WbCrmContact = {
    id: newId(),
    name: input.name.trim(),
    ...(input.org?.trim() ? { org: input.org.trim() } : {}),
    ...(input.role?.trim() ? { role: input.role.trim() } : {}),
    ...(input.phone?.trim() ? { phone: input.phone.trim() } : {}),
    ...(input.email?.trim() ? { email: input.email.trim() } : {}),
    ...(input.tags?.length ? { tags: input.tags } : {}),
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    createdAt: ts,
    updatedAt: ts,
  }
  writeCrmContacts(practiceId, [row, ...list])
  return row
}

export function deleteCrmContact(practiceId: PracticeId, id: string): void {
  writeCrmContacts(
    practiceId,
    readCrmContacts(practiceId).filter((c) => c.id !== id),
  )
}

// ---------- Fund / wallet ----------
export type FundTxnType = 'in' | 'out'

export interface WbFundAccount {
  id: string
  name: string
  currency: string
  openingBalance: number
  note?: string
  createdAt: string
  updatedAt: string
}

export interface WbFundTxn {
  id: string
  accountId: string
  type: FundTxnType
  amount: number
  date: string
  category?: string
  counterparty?: string
  note?: string
  createdAt: string
  updatedAt: string
}

function fundAccountsKey(practiceId: PracticeId): string {
  return `uniwork.wb.fund.accounts.${practiceId}`
}
function fundTxnsKey(practiceId: PracticeId): string {
  return `uniwork.wb.fund.txns.${practiceId}`
}

export function readFundAccounts(practiceId: PracticeId): WbFundAccount[] {
  const raw = wbStoreRead<WbFundAccount[]>(fundAccountsKey(practiceId), [])
  return Array.isArray(raw) ? raw.filter((a) => a && a.id && a.name) : []
}

export function writeFundAccounts(practiceId: PracticeId, items: WbFundAccount[]): void {
  wbStoreWrite(fundAccountsKey(practiceId), items)
}

export function upsertFundAccount(
  practiceId: PracticeId,
  input: Partial<WbFundAccount> & { name: string },
): WbFundAccount {
  const list = readFundAccounts(practiceId)
  const ts = nowIso()
  if (input.id) {
    const next = list.map((a) =>
      a.id === input.id
        ? {
            ...a,
            ...input,
            name: input.name.trim(),
            currency: (input.currency ?? a.currency ?? 'VND').trim() || 'VND',
            openingBalance:
              typeof input.openingBalance === 'number' ? input.openingBalance : a.openingBalance,
            updatedAt: ts,
          }
        : a,
    )
    writeFundAccounts(practiceId, next)
    return next.find((a) => a.id === input.id)!
  }
  const row: WbFundAccount = {
    id: newId(),
    name: input.name.trim(),
    currency: input.currency?.trim() || 'VND',
    openingBalance: typeof input.openingBalance === 'number' ? input.openingBalance : 0,
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    createdAt: ts,
    updatedAt: ts,
  }
  writeFundAccounts(practiceId, [row, ...list])
  return row
}

export function deleteFundAccount(practiceId: PracticeId, id: string): void {
  writeFundAccounts(
    practiceId,
    readFundAccounts(practiceId).filter((a) => a.id !== id),
  )
  writeFundTxns(
    practiceId,
    readFundTxns(practiceId).filter((t) => t.accountId !== id),
  )
}

export function readFundTxns(practiceId: PracticeId): WbFundTxn[] {
  const raw = wbStoreRead<WbFundTxn[]>(fundTxnsKey(practiceId), [])
  return Array.isArray(raw)
    ? raw.filter((t) => t && t.id && t.accountId && typeof t.amount === 'number')
    : []
}

export function writeFundTxns(practiceId: PracticeId, items: WbFundTxn[]): void {
  wbStoreWrite(fundTxnsKey(practiceId), items)
}

export function upsertFundTxn(
  practiceId: PracticeId,
  input: Partial<WbFundTxn> & { accountId: string; type: FundTxnType; amount: number; date: string },
): WbFundTxn {
  const list = readFundTxns(practiceId)
  const ts = nowIso()
  if (input.id) {
    const next = list.map((t) =>
      t.id === input.id ? { ...t, ...input, amount: input.amount, updatedAt: ts } : t,
    )
    writeFundTxns(practiceId, next)
    return next.find((t) => t.id === input.id)!
  }
  const row: WbFundTxn = {
    id: newId(),
    accountId: input.accountId,
    type: input.type,
    amount: input.amount,
    date: input.date,
    ...(input.category?.trim() ? { category: input.category.trim() } : {}),
    ...(input.counterparty?.trim() ? { counterparty: input.counterparty.trim() } : {}),
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    createdAt: ts,
    updatedAt: ts,
  }
  writeFundTxns(practiceId, [row, ...list])
  return row
}

export function deleteFundTxn(practiceId: PracticeId, id: string): void {
  writeFundTxns(
    practiceId,
    readFundTxns(practiceId).filter((t) => t.id !== id),
  )
}

export function fundAccountBalance(
  account: WbFundAccount,
  txns: readonly WbFundTxn[],
): number {
  let bal = account.openingBalance
  for (const t of txns) {
    if (t.accountId !== account.id) continue
    bal += t.type === 'in' ? t.amount : -t.amount
  }
  return bal
}
