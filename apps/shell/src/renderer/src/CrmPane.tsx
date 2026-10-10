import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import type { PracticeId } from '@uniwork/practice-core'
import {
  deleteCrmContact,
  readCrmContacts,
  upsertCrmContact,
  type WbCrmContact,
} from './workbench-crm-fund'
import { WbDeleteBtn, WbEditBtn, WbRowActions } from './WbRowActions'
import { WbExcelExportBtn } from './WbExcelExportBtn'
import { exportCrmContactsCsv } from './workbench-list-excel'

export function CrmPane({ practiceId, vi }: { practiceId: PracticeId; vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbCrmContact[]>(() => readCrmContacts(practiceId))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [org, setOrg] = useState('')
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    setItems(readCrmContacts(practiceId))
    setEditingId(null)
    resetForm()
  }, [practiceId])

  const resetForm = () => {
    setName('')
    setOrg('')
    setRole('')
    setPhone('')
    setEmail('')
    setNote('')
  }

  const reload = () => setItems(readCrmContacts(practiceId))

  const startEdit = (c: WbCrmContact) => {
    setEditingId(c.id)
    setName(c.name)
    setOrg(c.org ?? '')
    setRole(c.role ?? '')
    setPhone(c.phone ?? '')
    setEmail(c.email ?? '')
    setNote(c.note ?? '')
  }

  const save = () => {
    if (!name.trim()) return
    upsertCrmContact(practiceId, {
      id: editingId ?? undefined,
      name,
      org,
      role,
      phone,
      email,
      note,
    })
    setEditingId(null)
    resetForm()
    reload()
  }

  return (
    <div className="wb-crm">
      <header className="wb-tasks-hero">
        <div>
          <strong>{label('Quan hệ (CRM)', 'Relationships (CRM)')}</strong>
          <p>
            {label(
              'Danh bạ đối tác / khách hàng trên máy local — xuất Excel khi cần.',
              'Local contacts directory — export to Excel anytime.',
            )}
          </p>
        </div>
        <WbExcelExportBtn
          vi={vi}
          disabled={items.length === 0}
          csv={exportCrmContactsCsv(items)}
          fileName="crm-contacts"
          sheetName={label('Quan he', 'CRM')}
        />
      </header>

      <div className="wb-crm-form teacher-form">
        <div className="wb-pm-grid2">
          <label className="wb-pm-field">
            <span>{label('Tên *', 'Name *')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="wb-pm-field">
            <span>{label('Tổ chức', 'Org')}</span>
            <input value={org} onChange={(e) => setOrg(e.target.value)} />
          </label>
        </div>
        <div className="wb-pm-grid2">
          <label className="wb-pm-field">
            <span>{label('Vai trò', 'Role')}</span>
            <input value={role} onChange={(e) => setRole(e.target.value)} />
          </label>
          <label className="wb-pm-field">
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>
        <div className="wb-pm-grid2">
          <label className="wb-pm-field">
            <span>{label('Điện thoại', 'Phone')}</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="wb-pm-field">
            <span>{label('Ghi chú', 'Note')}</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>
        <div className="wb-pm-modal-actions">
          {editingId ? (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setEditingId(null)
                resetForm()
              }}
            >
              {label('Huỷ', 'Cancel')}
            </button>
          ) : null}
          <button type="button" className="btn btn-primary" disabled={!name.trim()} onClick={save}>
            {editingId ? label('Cập nhật', 'Update') : label('Thêm liên hệ', 'Add contact')}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="wb-tasks-empty">
          <span aria-hidden="true">◎</span>
          <p>{label('Chưa có liên hệ.', 'No contacts yet.')}</p>
        </div>
      ) : (
        <ul className="wb-tasks-list">
          {items.map((c) => (
            <li key={c.id} className="wb-tasks-list-row">
              <div className="wb-tasks-list-main" style={{ cursor: 'default' }}>
                <strong>{c.name}</strong>
                <span>
                  {[c.org, c.role, c.phone, c.email].filter(Boolean).join(' · ') || '—'}
                </span>
              </div>
              <WbRowActions>
                <WbEditBtn label={label('Sửa', 'Edit')} onClick={() => startEdit(c)} />
                <WbDeleteBtn
                  label={label('Xóa', 'Delete')}
                  onClick={() => {
                    if (!window.confirm(label(`Xoá «${c.name}»?`, `Delete “${c.name}”?`))) return
                    deleteCrmContact(practiceId, c.id)
                    reload()
                  }}
                />
              </WbRowActions>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
