import { useState } from 'react'
import type { ReactElement } from 'react'
import {
  readFamily,
  readFamilyMeds,
  readFamilyMilestones,
  readFamilyParenting,
  readFamilyShopping,
  readFamilySubTab,
  readFamilyTree,
  writeFamily,
  writeFamilyMeds,
  writeFamilyMilestones,
  writeFamilyParenting,
  writeFamilyShopping,
  writeFamilySubTab,
  writeFamilyTree,
  type FamilySubTabId,
  type WbFamilyMedItem,
  type WbFamilyMember,
  type WbFamilyMilestone,
  type WbFamilyParentingItem,
  type WbFamilyShopItem,
  type WbFamilyTreeNode,
} from './workbench-pins'

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

const SUB_TABS: {
  id: FamilySubTabId
  labelVi: string
  labelEn: string
}[] = [
  { id: 'members', labelVi: 'Thành viên', labelEn: 'Members' },
  { id: 'parenting', labelVi: 'Đồng hành cùng con', labelEn: 'With kids' },
  { id: 'meds', labelVi: 'Nhắc thuốc', labelEn: 'Meds' },
  { id: 'shopping', labelVi: 'Chi tiêu mua sắm', labelEn: 'Shopping' },
  { id: 'tree', labelVi: 'Gia phả', labelEn: 'Family tree' },
  { id: 'milestones', labelVi: 'Cột mốc kỷ niệm', labelEn: 'Milestones' },
]

export function FamilyPane({ vi }: { vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [sub, setSub] = useState<FamilySubTabId>(() => readFamilySubTab())

  const select = (id: FamilySubTabId) => {
    setSub(id)
    writeFamilySubTab(id)
  }

  return (
    <div className="wb-family">
      <p className="teacher-hint">
        {label(
          'Không gian gia đình trên máy — tab con riêng cho thành viên, đồng hành cùng con, thuốc, chi tiêu, gia phả và cột mốc.',
          'On-device family space — sub-tabs for members, parenting, meds, shopping, tree, and milestones.',
        )}
      </p>
      <nav className="wb-subtabs" aria-label={label('Tab con Gia đình', 'Family sub-tabs')}>
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`wb-subtab${sub === t.id ? ' active' : ''}`}
            onClick={() => select(t.id)}
          >
            {vi ? t.labelVi : t.labelEn}
          </button>
        ))}
      </nav>
      {sub === 'members' && <MembersSub vi={vi} />}
      {sub === 'parenting' && <ParentingSub vi={vi} />}
      {sub === 'meds' && <MedsSub vi={vi} />}
      {sub === 'shopping' && <ShoppingSub vi={vi} />}
      {sub === 'tree' && <TreeSub vi={vi} />}
      {sub === 'milestones' && <MilestonesSub vi={vi} />}
    </div>
  )
}

function MembersSub({ vi }: { vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbFamilyMember[]>(() => readFamily())
  const [name, setName] = useState('')
  const [relation, setRelation] = useState(vi ? 'Con' : 'Child')
  const [birthday, setBirthday] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')

  const persist = (next: WbFamilyMember[]) => {
    setItems(next)
    writeFamily(next)
  }

  const add = () => {
    const n = name.trim()
    const r = relation.trim()
    if (!n || !r) return
    persist([
      {
        id: newId(),
        name: n,
        relation: r,
        ...(birthday ? { birthday } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      },
      ...items,
    ])
    setName('')
    setBirthday('')
    setPhone('')
    setNote('')
  }

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Danh bạ thành viên — liên hệ khẩn, sinh nhật, ghi chú dị ứng / trường lớp.',
          'Member directory — emergency contacts, birthdays, allergy / school notes.',
        )}
      </p>
      <div className="wb-module-form">
        <label>
          <span>{label('Họ tên', 'Name')}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={label('VD: Nguyễn An', 'e.g. An Nguyen')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add()
            }}
          />
        </label>
        <label>
          <span>{label('Quan hệ', 'Relation')}</span>
          <select value={relation} onChange={(e) => setRelation(e.target.value)}>
            {(vi
              ? ['Bố', 'Mẹ', 'Vợ/Chồng', 'Con', 'Anh/Chị/Em', 'Ông/Bà', 'Khác']
              : ['Father', 'Mother', 'Spouse', 'Child', 'Sibling', 'Grandparent', 'Other']
            ).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{label('Sinh nhật', 'Birthday')}</span>
          <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
        </label>
        <label>
          <span>{label('Điện thoại', 'Phone')}</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="teacher-form-wide">
          <span>{label('Ghi chú', 'Note')}</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={label('VD: Trường / lớp / dị ứng…', 'e.g. School / grade / allergy…')}
          />
        </label>
        <button type="button" className="btn btn-primary" onClick={add}>
          {label('Thêm thành viên', 'Add member')}
        </button>
      </div>
      <ItemList
        empty={label('Chưa có thành viên.', 'No members yet.')}
        items={items.map((it) => ({
          id: it.id,
          title: `${it.name} · ${it.relation}`,
          meta: [it.birthday ? `${label('Sinh nhật', 'Birthday')}: ${it.birthday}` : null, it.phone]
            .filter(Boolean)
            .join(' · '),
          note: it.note,
        }))}
        onDelete={(id) => persist(items.filter((x) => x.id !== id))}
        vi={vi}
      />
    </>
  )
}

function ParentingSub({ vi }: { vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbFamilyParentingItem[]>(() => readFamilyParenting())
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [childName, setChildName] = useState('')
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<WbFamilyParentingItem['kind']>('study')
  const [note, setNote] = useState('')

  const persist = (next: WbFamilyParentingItem[]) => {
    setItems(next)
    writeFamilyParenting(next)
  }

  const kindLabel = (k: WbFamilyParentingItem['kind']) => {
    switch (k) {
      case 'study':
        return label('Học tập', 'Study')
      case 'health':
        return label('Sức khoẻ', 'Health')
      case 'activity':
        return label('Hoạt động', 'Activity')
      case 'talk':
        return label('Trò chuyện', 'Talk')
      default:
        return label('Khác', 'Other')
    }
  }

  const add = () => {
    const c = childName.trim()
    const t = title.trim()
    if (!c || !t || !date) return
    persist([
      {
        id: newId(),
        date,
        childName: c,
        title: t,
        kind,
        done: false,
        ...(note.trim() ? { note: note.trim() } : {}),
      },
      ...items,
    ].sort((a, b) => b.date.localeCompare(a.date)))
    setTitle('')
    setNote('')
  }

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Theo dõi việc đồng hành cùng con: học, sức khoẻ, hoạt động, trò chuyện.',
          'Track parenting moments: study, health, activities, talks.',
        )}
      </p>
      <div className="wb-module-form">
        <label>
          <span>{label('Ngày', 'Date')}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          <span>{label('Con', 'Child')}</span>
          <input
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder={label('VD: Bé An', 'e.g. An')}
          />
        </label>
        <label>
          <span>{label('Loại', 'Kind')}</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as WbFamilyParentingItem['kind'])}
          >
            <option value="study">{label('Học tập', 'Study')}</option>
            <option value="health">{label('Sức khoẻ', 'Health')}</option>
            <option value="activity">{label('Hoạt động', 'Activity')}</option>
            <option value="talk">{label('Trò chuyện', 'Talk')}</option>
            <option value="other">{label('Khác', 'Other')}</option>
          </select>
        </label>
        <label className="teacher-form-wide">
          <span>{label('Nội dung', 'Title')}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={label('VD: Ôn bài kiểm tra Toán', 'e.g. Math quiz review')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add()
            }}
          />
        </label>
        <label className="teacher-form-wide">
          <span>{label('Ghi chú', 'Note')}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="button" className="btn btn-primary" onClick={add}>
          {label('Thêm', 'Add')}
        </button>
      </div>
      <ul className="wb-module-list">
        {items.length === 0 ? (
          <li className="teacher-empty">{label('Chưa có mục đồng hành.', 'No parenting items yet.')}</li>
        ) : (
          items.map((it) => (
            <li key={it.id} className={`wb-module-row${it.done ? ' is-done' : ''}`}>
              <label className="wb-task-check">
                <input
                  type="checkbox"
                  checked={it.done}
                  onChange={() =>
                    persist(items.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)))
                  }
                />
                <div>
                  <strong>
                    {it.date} · {it.childName} · {kindLabel(it.kind)}
                  </strong>
                  <span>{it.title}</span>
                  {it.note ? <span>{it.note}</span> : null}
                </div>
              </label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => persist(items.filter((x) => x.id !== it.id))}
              >
                {label('Xóa', 'Delete')}
              </button>
            </li>
          ))
        )}
      </ul>
    </>
  )
}

function MedsSub({ vi }: { vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbFamilyMedItem[]>(() => readFamilyMeds())
  const [person, setPerson] = useState('')
  const [medicine, setMedicine] = useState('')
  const [dose, setDose] = useState('')
  const [schedule, setSchedule] = useState(vi ? 'Sáng · Tối' : 'Morning · Evening')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')

  const persist = (next: WbFamilyMedItem[]) => {
    setItems(next)
    writeFamilyMeds(next)
  }

  const add = () => {
    const p = person.trim()
    const m = medicine.trim()
    const s = schedule.trim()
    if (!p || !m || !s) return
    persist([
      {
        id: newId(),
        person: p,
        medicine: m,
        schedule: s,
        active: true,
        ...(dose.trim() ? { dose: dose.trim() } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      },
      ...items,
    ])
    setMedicine('')
    setDose('')
    setNote('')
  }

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Nhắc thuốc cho người thân — chỉ lưu trên máy, không thay lời bác sĩ.',
          'Family medication reminders — on-device only, not medical advice.',
        )}
      </p>
      <div className="wb-module-form">
        <label>
          <span>{label('Người uống', 'Person')}</span>
          <input
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            placeholder={label('VD: Bà / Bé An', 'e.g. Grandma / An')}
          />
        </label>
        <label>
          <span>{label('Thuốc', 'Medicine')}</span>
          <input value={medicine} onChange={(e) => setMedicine(e.target.value)} />
        </label>
        <label>
          <span>{label('Liều', 'Dose')}</span>
          <input
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            placeholder={label('VD: 1 viên', 'e.g. 1 tablet')}
          />
        </label>
        <label>
          <span>{label('Lịch uống', 'Schedule')}</span>
          <input value={schedule} onChange={(e) => setSchedule(e.target.value)} />
        </label>
        <label>
          <span>{label('Từ ngày', 'From')}</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          <span>{label('Đến ngày', 'Until')}</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <label className="teacher-form-wide">
          <span>{label('Ghi chú', 'Note')}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="button" className="btn btn-primary" onClick={add}>
          {label('Thêm nhắc thuốc', 'Add reminder')}
        </button>
      </div>
      <ul className="wb-module-list">
        {items.length === 0 ? (
          <li className="teacher-empty">{label('Chưa có nhắc thuốc.', 'No med reminders yet.')}</li>
        ) : (
          items.map((it) => (
            <li key={it.id} className={`wb-module-row${!it.active ? ' is-done' : ''}`}>
              <div>
                <strong>
                  {it.person} · {it.medicine}
                  {it.dose ? ` (${it.dose})` : ''}
                </strong>
                <span>
                  {[
                    it.schedule,
                    it.startDate || it.endDate
                      ? `${it.startDate ?? '…'} → ${it.endDate ?? '…'}`
                      : null,
                    it.active ? label('Đang dùng', 'Active') : label('Tạm dừng', 'Paused'),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                {it.note ? <span>{it.note}</span> : null}
              </div>
              <div className="teacher-chip-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    persist(items.map((x) => (x.id === it.id ? { ...x, active: !x.active } : x)))
                  }
                >
                  {it.active ? label('Tạm dừng', 'Pause') : label('Bật lại', 'Resume')}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => persist(items.filter((x) => x.id !== it.id))}
                >
                  {label('Xóa', 'Delete')}
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </>
  )
}

function ShoppingSub({ vi }: { vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbFamilyShopItem[]>(() => readFamilyShopping())
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<WbFamilyShopItem['category']>('food')
  const [note, setNote] = useState('')

  const persist = (next: WbFamilyShopItem[]) => {
    setItems(next)
    writeFamilyShopping(next)
  }

  const catLabel = (c: WbFamilyShopItem['category']) => {
    switch (c) {
      case 'food':
        return label('Thực phẩm', 'Food')
      case 'kids':
        return label('Cho con', 'Kids')
      case 'home':
        return label('Nhà cửa', 'Home')
      case 'health':
        return label('Sức khoẻ', 'Health')
      case 'gift':
        return label('Quà', 'Gift')
      default:
        return label('Khác', 'Other')
    }
  }

  const month = new Date().toISOString().slice(0, 7)
  const monthTotal = items
    .filter((i) => i.date.startsWith(month))
    .reduce((s, i) => s + i.amount, 0)

  const add = () => {
    const t = title.trim()
    const n = Number(amount)
    if (!t || !date || !Number.isFinite(n) || n <= 0) return
    persist(
      [
        {
          id: newId(),
          date,
          title: t,
          amount: n,
          category,
          ...(note.trim() ? { note: note.trim() } : {}),
        },
        ...items,
      ].sort((a, b) => b.date.localeCompare(a.date)),
    )
    setTitle('')
    setAmount('')
    setNote('')
  }

  const money = (n: number) =>
    n.toLocaleString(vi ? 'vi-VN' : 'en-US', { maximumFractionDigits: 0 })

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Chi tiêu / mua sắm gia đình — tách với tài chính cá nhân.',
          'Family shopping spend — separate from personal finance.',
        )}
      </p>
      <div className="wb-finance-summary">
        <span>
          {label('Tháng này:', 'This month:')} <strong>{money(monthTotal)}</strong>
        </span>
      </div>
      <div className="wb-module-form">
        <label>
          <span>{label('Ngày', 'Date')}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          <span>{label('Danh mục', 'Category')}</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as WbFamilyShopItem['category'])}
          >
            <option value="food">{label('Thực phẩm', 'Food')}</option>
            <option value="kids">{label('Cho con', 'Kids')}</option>
            <option value="home">{label('Nhà cửa', 'Home')}</option>
            <option value="health">{label('Sức khoẻ', 'Health')}</option>
            <option value="gift">{label('Quà', 'Gift')}</option>
            <option value="other">{label('Khác', 'Other')}</option>
          </select>
        </label>
        <label>
          <span>{label('Số tiền', 'Amount')}</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </label>
        <label className="teacher-form-wide">
          <span>{label('Mục', 'Item')}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={label('VD: Đi chợ cuối tuần', 'e.g. Weekend groceries')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add()
            }}
          />
        </label>
        <label className="teacher-form-wide">
          <span>{label('Ghi chú', 'Note')}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="button" className="btn btn-primary" onClick={add}>
          {label('Thêm chi tiêu', 'Add expense')}
        </button>
      </div>
      <ItemList
        empty={label('Chưa có chi tiêu.', 'No shopping entries yet.')}
        items={items.map((it) => ({
          id: it.id,
          title: `${it.title} · ${money(it.amount)}`,
          meta: `${it.date} · ${catLabel(it.category)}`,
          note: it.note,
        }))}
        onDelete={(id) => persist(items.filter((x) => x.id !== id))}
        vi={vi}
      />
    </>
  )
}

function TreeSub({ vi }: { vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbFamilyTreeNode[]>(() => readFamilyTree())
  const [name, setName] = useState('')
  const [generation, setGeneration] = useState('0')
  const [side, setSide] = useState<WbFamilyTreeNode['side']>('self')
  const [parentNames, setParentNames] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [note, setNote] = useState('')

  const persist = (next: WbFamilyTreeNode[]) => {
    setItems(next)
    writeFamilyTree(next)
  }

  const sideLabel = (s: WbFamilyTreeNode['side']) => {
    switch (s) {
      case 'paternal':
        return label('Nội', 'Paternal')
      case 'maternal':
        return label('Ngoại', 'Maternal')
      case 'self':
        return label('Bản thân / hộ', 'Self / household')
      case 'spouse':
        return label('Vợ/Chồng', 'Spouse')
      default:
        return label('Khác', 'Other')
    }
  }

  const add = () => {
    const n = name.trim()
    const g = Number(generation)
    if (!n || !Number.isFinite(g)) return
    persist(
      [
        {
          id: newId(),
          name: n,
          generation: g,
          side,
          ...(parentNames.trim() ? { parentNames: parentNames.trim() } : {}),
          ...(birthYear.trim() ? { birthYear: birthYear.trim() } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        },
        ...items,
      ].sort((a, b) => b.generation - a.generation || a.name.localeCompare(b.name)),
    )
    setName('')
    setParentNames('')
    setBirthYear('')
    setNote('')
  }

  const gens = [...new Set(items.map((i) => i.generation))].sort((a, b) => b - a)

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Ghi gia phả theo thế hệ (0 = bạn, +1 ông bà, −1 con…). Có thể bổ sung dần.',
          'Record family tree by generation (0 = you, +1 grandparents, −1 children…).',
        )}
      </p>
      <div className="wb-module-form">
        <label>
          <span>{label('Họ tên', 'Name')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          <span>{label('Thế hệ', 'Generation')}</span>
          <input
            inputMode="numeric"
            value={generation}
            onChange={(e) => setGeneration(e.target.value)}
            placeholder="0"
          />
        </label>
        <label>
          <span>{label('Nhánh', 'Side')}</span>
          <select value={side} onChange={(e) => setSide(e.target.value as WbFamilyTreeNode['side'])}>
            <option value="self">{label('Bản thân / hộ', 'Self / household')}</option>
            <option value="spouse">{label('Vợ/Chồng', 'Spouse')}</option>
            <option value="paternal">{label('Nội', 'Paternal')}</option>
            <option value="maternal">{label('Ngoại', 'Maternal')}</option>
            <option value="other">{label('Khác', 'Other')}</option>
          </select>
        </label>
        <label>
          <span>{label('Năm sinh', 'Birth year')}</span>
          <input value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="19xx" />
        </label>
        <label className="teacher-form-wide">
          <span>{label('Cha/Mẹ (ghi chú)', 'Parents (note)')}</span>
          <input value={parentNames} onChange={(e) => setParentNames(e.target.value)} />
        </label>
        <label className="teacher-form-wide">
          <span>{label('Ghi chú', 'Note')}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="button" className="btn btn-primary" onClick={add}>
          {label('Thêm vào gia phả', 'Add to tree')}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="teacher-empty">{label('Chưa có mục gia phả.', 'No tree entries yet.')}</p>
      ) : (
        <div className="wb-family-tree">
          {gens.map((g) => (
            <section key={g} className="wb-family-gen">
              <h4>
                {label('Thế hệ', 'Generation')} {g > 0 ? `+${g}` : g}
              </h4>
              <ul className="wb-module-list">
                {items
                  .filter((i) => i.generation === g)
                  .map((it) => (
                    <li key={it.id} className="wb-module-row">
                      <div>
                        <strong>
                          {it.name} · {sideLabel(it.side)}
                        </strong>
                        <span>
                          {[
                            it.birthYear ? `${label('Sinh', 'Born')} ${it.birthYear}` : null,
                            it.parentNames,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                        {it.note ? <span>{it.note}</span> : null}
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => persist(items.filter((x) => x.id !== it.id))}
                      >
                        {label('Xóa', 'Delete')}
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}

function MilestonesSub({ vi }: { vi: boolean }): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbFamilyMilestone[]>(() => readFamilyMilestones())
  const [date, setDate] = useState('')
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<WbFamilyMilestone['kind']>('birthday')
  const [people, setPeople] = useState('')
  const [note, setNote] = useState('')
  const [recurYearly, setRecurYearly] = useState(true)

  const persist = (next: WbFamilyMilestone[]) => {
    setItems(next)
    writeFamilyMilestones(next)
  }

  const kindLabel = (k: WbFamilyMilestone['kind']) => {
    switch (k) {
      case 'birthday':
        return label('Sinh nhật', 'Birthday')
      case 'wedding':
        return label('Ngày cưới', 'Wedding')
      case 'memorial':
        return label('Giỗ / tưởng niệm', 'Memorial')
      case 'achievement':
        return label('Thành tựu', 'Achievement')
      default:
        return label('Khác', 'Other')
    }
  }

  const add = () => {
    const t = title.trim()
    if (!t || !date) return
    persist(
      [
        {
          id: newId(),
          date,
          title: t,
          kind,
          recurYearly,
          ...(people.trim() ? { people: people.trim() } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        },
        ...items,
      ].sort((a, b) => a.date.slice(5).localeCompare(b.date.slice(5)) || a.date.localeCompare(b.date)),
    )
    setTitle('')
    setPeople('')
    setNote('')
  }

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Cột mốc kỷ niệm: sinh nhật, ngày cưới, giỗ, thành tựu — có thể lặp hàng năm.',
          'Milestones: birthdays, weddings, memorials, achievements — optional yearly repeat.',
        )}
      </p>
      <div className="wb-module-form">
        <label>
          <span>{label('Ngày', 'Date')}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          <span>{label('Loại', 'Kind')}</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as WbFamilyMilestone['kind'])}
          >
            <option value="birthday">{label('Sinh nhật', 'Birthday')}</option>
            <option value="wedding">{label('Ngày cưới', 'Wedding')}</option>
            <option value="memorial">{label('Giỗ / tưởng niệm', 'Memorial')}</option>
            <option value="achievement">{label('Thành tựu', 'Achievement')}</option>
            <option value="other">{label('Khác', 'Other')}</option>
          </select>
        </label>
        <label className="teacher-form-wide">
          <span>{label('Tiêu đề', 'Title')}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={label('VD: Sinh nhật ông Nội', 'e.g. Grandpa’s birthday')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add()
            }}
          />
        </label>
        <label>
          <span>{label('Người liên quan', 'People')}</span>
          <input value={people} onChange={(e) => setPeople(e.target.value)} />
        </label>
        <label className="wb-family-check">
          <input
            type="checkbox"
            checked={recurYearly}
            onChange={(e) => setRecurYearly(e.target.checked)}
          />
          <span>{label('Lặp hàng năm', 'Repeat yearly')}</span>
        </label>
        <label className="teacher-form-wide">
          <span>{label('Ghi chú', 'Note')}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="button" className="btn btn-primary" onClick={add}>
          {label('Thêm cột mốc', 'Add milestone')}
        </button>
      </div>
      <ItemList
        empty={label('Chưa có cột mốc.', 'No milestones yet.')}
        items={items.map((it) => ({
          id: it.id,
          title: `${it.title} · ${kindLabel(it.kind)}`,
          meta: [
            it.date,
            it.people,
            it.recurYearly ? label('Hàng năm', 'Yearly') : label('Một lần', 'Once'),
          ]
            .filter(Boolean)
            .join(' · '),
          note: it.note,
        }))}
        onDelete={(id) => persist(items.filter((x) => x.id !== id))}
        vi={vi}
      />
    </>
  )
}

function ItemList({
  items,
  empty,
  onDelete,
  vi,
}: {
  items: { id: string; title: string; meta?: string; note?: string }[]
  empty: string
  onDelete: (id: string) => void
  vi: boolean
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  return (
    <ul className="wb-module-list">
      {items.length === 0 ? (
        <li className="teacher-empty">{empty}</li>
      ) : (
        items.map((it) => (
          <li key={it.id} className="wb-module-row">
            <div>
              <strong>{it.title}</strong>
              {it.meta ? <span>{it.meta}</span> : null}
              {it.note ? <span>{it.note}</span> : null}
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => onDelete(it.id)}>
              {label('Xóa', 'Delete')}
            </button>
          </li>
        ))
      )}
    </ul>
  )
}
