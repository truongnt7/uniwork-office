import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import type { PracticeId } from '@uniwork/practice-core'
import {
  deleteFundAccount,
  deleteFundTxn,
  fundAccountBalance,
  readFundAccounts,
  readFundTxns,
  upsertFundAccount,
  upsertFundTxn,
  type FundTxnType,
  type WbFundAccount,
  type WbFundTxn,
} from './workbench-crm-fund'
import { WbDeleteBtn, WbEditBtn, WbRowActions } from './WbRowActions'
import { WbExcelExportBtn } from './WbExcelExportBtn'
import { exportFundAccountsCsv, exportFundTxnsCsv } from './workbench-list-excel'

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtMoney(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
  } catch {
    return `${n.toLocaleString()} ${currency}`
  }
}

export function FundPane({ practiceId, vi }: { practiceId: PracticeId; vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [accounts, setAccounts] = useState<WbFundAccount[]>(() => readFundAccounts(practiceId))
  const [txns, setTxns] = useState<WbFundTxn[]>(() => readFundTxns(practiceId))
  const [accountId, setAccountId] = useState<string | null>(() => readFundAccounts(practiceId)[0]?.id ?? null)
  const [sub, setSub] = useState<'accounts' | 'txns'>('accounts')

  const [accName, setAccName] = useState('')
  const [accCurrency, setAccCurrency] = useState('VND')
  const [accOpen, setAccOpen] = useState('0')
  const [editingAccId, setEditingAccId] = useState<string | null>(null)

  const [txnType, setTxnType] = useState<FundTxnType>('out')
  const [txnAmount, setTxnAmount] = useState('')
  const [txnDate, setTxnDate] = useState(todayIso())
  const [txnCategory, setTxnCategory] = useState('')
  const [txnNote, setTxnNote] = useState('')

  const reload = () => {
    const a = readFundAccounts(practiceId)
    setAccounts(a)
    setTxns(readFundTxns(practiceId))
    if (accountId && !a.some((x) => x.id === accountId)) setAccountId(a[0]?.id ?? null)
  }

  useEffect(() => {
    const a = readFundAccounts(practiceId)
    setAccounts(a)
    setTxns(readFundTxns(practiceId))
    setAccountId(a[0]?.id ?? null)
    setEditingAccId(null)
    setAccName('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceId])

  const account = accounts.find((a) => a.id === accountId) ?? null
  const accountTxns = useMemo(
    () =>
      txns
        .filter((t) => t.accountId === accountId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [txns, accountId],
  )

  const saveAccount = () => {
    if (!accName.trim()) return
    const row = upsertFundAccount(practiceId, {
      id: editingAccId ?? undefined,
      name: accName,
      currency: accCurrency,
      openingBalance: Number(accOpen) || 0,
    })
    setEditingAccId(null)
    setAccName('')
    setAccOpen('0')
    reload()
    setAccountId(row.id)
  }

  const saveTxn = () => {
    if (!accountId || !txnAmount || Number(txnAmount) <= 0) return
    upsertFundTxn(practiceId, {
      accountId,
      type: txnType,
      amount: Number(txnAmount),
      date: txnDate,
      category: txnCategory,
      note: txnNote,
    })
    setTxnAmount('')
    setTxnCategory('')
    setTxnNote('')
    reload()
  }

  return (
    <div className="wb-fund">
      <header className="wb-tasks-hero">
        <div>
          <strong>{label('Quỹ / Ví', 'Fund / Wallet')}</strong>
          <p>
            {label(
              'Tài khoản ngân quỹ trên máy — thu/chi, số dư, xuất Excel.',
              'On-device fund accounts — in/out, balances, Excel export.',
            )}
          </p>
        </div>
        <div className="wb-pm-project-actions">
          <WbExcelExportBtn
            vi={vi}
            disabled={accounts.length === 0}
            csv={exportFundAccountsCsv(accounts, txns)}
            fileName="fund-accounts"
            sheetName={label('Quy', 'Fund')}
          />
          <WbExcelExportBtn
            vi={vi}
            disabled={txns.length === 0}
            csv={exportFundTxnsCsv(txns, accounts)}
            fileName="fund-transactions"
            sheetName={label('Giao dich', 'Txns')}
          />
        </div>
      </header>

      <nav className="wb-subtabs" aria-label={label('Tab Quỹ', 'Fund tabs')}>
        {(
          [
            ['accounts', 'Tài khoản', 'Accounts'],
            ['txns', 'Thu / Chi', 'In / Out'],
          ] as const
        ).map(([id, a, b]) => (
          <button
            key={id}
            type="button"
            className={`wb-subtab${sub === id ? ' active' : ''}`}
            onClick={() => setSub(id)}
          >
            {vi ? a : b}
          </button>
        ))}
      </nav>

      {sub === 'accounts' ? (
        <>
          <div className="wb-crm-form">
            <div className="wb-pm-grid2">
              <label className="wb-pm-field">
                <span>{label('Tên tài khoản *', 'Account name *')}</span>
                <input value={accName} onChange={(e) => setAccName(e.target.value)} />
              </label>
              <label className="wb-pm-field">
                <span>{label('Tiền tệ', 'Currency')}</span>
                <input value={accCurrency} onChange={(e) => setAccCurrency(e.target.value)} />
              </label>
            </div>
            <label className="wb-pm-field">
              <span>{label('Số dư đầu', 'Opening balance')}</span>
              <input type="number" value={accOpen} onChange={(e) => setAccOpen(e.target.value)} />
            </label>
            <div className="wb-pm-modal-actions">
              {editingAccId ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setEditingAccId(null)
                    setAccName('')
                    setAccOpen('0')
                  }}
                >
                  {label('Huỷ', 'Cancel')}
                </button>
              ) : null}
              <button type="button" className="btn btn-primary" disabled={!accName.trim()} onClick={saveAccount}>
                {editingAccId ? label('Cập nhật', 'Update') : label('Thêm tài khoản', 'Add account')}
              </button>
            </div>
          </div>
          <ul className="wb-tasks-list">
            {accounts.map((a) => {
              const bal = fundAccountBalance(a, txns)
              return (
                <li
                  key={a.id}
                  className={`wb-tasks-list-row${accountId === a.id ? ' is-selected' : ''}`}
                >
                  <button type="button" className="wb-tasks-list-main" onClick={() => setAccountId(a.id)}>
                    <strong>{a.name}</strong>
                    <span>
                      {fmtMoney(bal, a.currency)} · {label('đầu', 'open')} {fmtMoney(a.openingBalance, a.currency)}
                    </span>
                  </button>
                  <WbRowActions>
                    <WbEditBtn
                      label={label('Sửa', 'Edit')}
                      onClick={() => {
                        setEditingAccId(a.id)
                        setAccName(a.name)
                        setAccCurrency(a.currency)
                        setAccOpen(String(a.openingBalance))
                      }}
                    />
                    <WbDeleteBtn
                      label={label('Xóa', 'Delete')}
                      onClick={() => {
                        if (
                          !window.confirm(
                            label(`Xoá «${a.name}» và mọi giao dịch?`, `Delete “${a.name}” and its transactions?`),
                          )
                        )
                          return
                        deleteFundAccount(practiceId, a.id)
                        reload()
                      }}
                    />
                  </WbRowActions>
                </li>
              )
            })}
          </ul>
        </>
      ) : (
        <>
          <label className="wb-pm-field">
            <span>{label('Tài khoản', 'Account')}</span>
            <select value={accountId ?? ''} onChange={(e) => setAccountId(e.target.value || null)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          {!account ? (
            <div className="wb-tasks-empty">
              <p>{label('Tạo tài khoản trước.', 'Create an account first.')}</p>
            </div>
          ) : (
            <>
              <p className="wb-pm-project-meta">
                {label('Số dư', 'Balance')}: <strong>{fmtMoney(fundAccountBalance(account, txns), account.currency)}</strong>
              </p>
              <div className="wb-crm-form">
                <div className="wb-pm-grid2">
                  <label className="wb-pm-field">
                    <span>{label('Loại', 'Type')}</span>
                    <select value={txnType} onChange={(e) => setTxnType(e.target.value as FundTxnType)}>
                      <option value="in">{label('Thu', 'In')}</option>
                      <option value="out">{label('Chi', 'Out')}</option>
                    </select>
                  </label>
                  <label className="wb-pm-field">
                    <span>{label('Số tiền *', 'Amount *')}</span>
                    <input type="number" value={txnAmount} onChange={(e) => setTxnAmount(e.target.value)} />
                  </label>
                </div>
                <div className="wb-pm-grid2">
                  <label className="wb-pm-field">
                    <span>{label('Ngày', 'Date')}</span>
                    <input type="date" value={txnDate} onChange={(e) => setTxnDate(e.target.value)} />
                  </label>
                  <label className="wb-pm-field">
                    <span>{label('Hạng mục', 'Category')}</span>
                    <input value={txnCategory} onChange={(e) => setTxnCategory(e.target.value)} />
                  </label>
                </div>
                <label className="wb-pm-field">
                  <span>{label('Ghi chú', 'Note')}</span>
                  <input value={txnNote} onChange={(e) => setTxnNote(e.target.value)} />
                </label>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!txnAmount || Number(txnAmount) <= 0}
                  onClick={saveTxn}
                >
                  {label('Ghi giao dịch', 'Post transaction')}
                </button>
              </div>
              <ul className="wb-tasks-list">
                {accountTxns.map((t) => (
                  <li key={t.id} className="wb-tasks-list-row">
                    <div className="wb-tasks-list-main" style={{ cursor: 'default' }}>
                      <strong>
                        {t.type === 'in' ? '+' : '−'}
                        {fmtMoney(t.amount, account.currency)}
                      </strong>
                      <span>
                        {t.date}
                        {t.category ? ` · ${t.category}` : ''}
                        {t.note ? ` · ${t.note}` : ''}
                      </span>
                    </div>
                    <WbRowActions>
                      <WbDeleteBtn
                        label={label('Xóa', 'Delete')}
                        onClick={() => {
                          deleteFundTxn(practiceId, t.id)
                          reload()
                        }}
                      />
                    </WbRowActions>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  )
}
