import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import type { PracticeId } from '@uniwork/practice-core'
import { EDU_GRADES, EDU_SUBJECTS } from '@uniwork/edu-core'
import {
  WbDeleteBtn,
  WbDraftBtn,
  WbEditBtn,
  WbRowActions,
} from './WbRowActions'
import {
  exportQuestionsCsv,
  importQuestionsFromRows,
  readQuestions,
  writeQuestions,
  type QuestionDifficulty,
  type WbQuestionItem,
} from './workbench-pins'
import { exportCsvAsXlsx, pickSpreadsheetRows } from './workbench-excel-io'

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function QuestionBankPane({
  practiceId,
  vi,
  packId = null,
  onPackLinked,
}: {
  practiceId: PracticeId
  vi: boolean
  packId?: string | null
  onPackLinked?: () => void
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [items, setItems] = useState<WbQuestionItem[]>(() => readQuestions(practiceId))
  const [filterSubject, setFilterSubject] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [q, setQ] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)
  const [stem, setStem] = useState('')
  const [answer, setAnswer] = useState('')
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [tags, setTags] = useState('')
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | ''>('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setItems(readQuestions(practiceId))
    setEditingId(null)
    setComposing(false)
  }, [practiceId])

  const persist = (next: WbQuestionItem[]) => {
    setItems(next)
    writeQuestions(practiceId, next)
  }

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const it of items) for (const t of it.tags ?? []) if (t.trim()) set.add(t.trim())
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'))
  }, [items])

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return items.filter((it) => {
      if (filterSubject && (it.subject ?? '') !== filterSubject) return false
      if (filterTag && !(it.tags ?? []).includes(filterTag)) return false
      if (!qq) return true
      const hay = `${it.stem} ${it.answer ?? ''} ${(it.tags ?? []).join(' ')}`.toLowerCase()
      return hay.includes(qq)
    })
  }, [items, filterSubject, filterTag, q])

  const clearForm = () => {
    setEditingId(null)
    setComposing(false)
    setStem('')
    setAnswer('')
    setSubject('')
    setGrade('')
    setTags('')
    setDifficulty('')
  }

  const startEdit = (it: WbQuestionItem) => {
    setEditingId(it.id)
    setComposing(true)
    setStem(it.stem)
    setAnswer(it.answer ?? '')
    setSubject(it.subject ?? '')
    setGrade(it.grade ?? '')
    setTags((it.tags ?? []).join(', '))
    setDifficulty(it.difficulty ?? '')
  }

  const save = () => {
    const s = stem.trim()
    if (!s) return
    const tagList = tags
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean)
    const row: WbQuestionItem = {
      id: editingId ?? newId(),
      stem: s,
      createdAt: editingId
        ? (items.find((x) => x.id === editingId)?.createdAt ?? new Date().toISOString())
        : new Date().toISOString(),
      ...(answer.trim() ? { answer: answer.trim() } : {}),
      ...(subject.trim() ? { subject: subject.trim() } : {}),
      ...(grade.trim() ? { grade: grade.trim() } : {}),
      ...(tagList.length ? { tags: tagList } : {}),
      ...(difficulty ? { difficulty } : {}),
    }
    if (editingId) persist(items.map((x) => (x.id === editingId ? row : x)))
    else persist([row, ...items])
    clearForm()
  }

  const copyItem = async (it: WbQuestionItem) => {
    const text = [
      it.stem,
      it.answer ? `${vi ? 'Đáp án' : 'Answer'}: ${it.answer}` : '',
    ]
      .filter(Boolean)
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(it.id)
      window.setTimeout(() => setCopiedId(null), 1500)
    } catch {
      /* ignore */
    }
  }

  const draftDoc = async (it: WbQuestionItem) => {
    if (!packId || !window.aiOffice?.newDoc) return
    const html = `
      <h1>${escapeHtml(label('Câu hỏi', 'Question'))}</h1>
      <p>${escapeHtml(it.stem)}</p>
      ${it.answer ? `<h2>${escapeHtml(label('Đáp án', 'Answer'))}</h2><p>${escapeHtml(it.answer)}</p>` : ''}
      <p><em>${[it.subject, it.grade, (it.tags ?? []).join(', ')].filter(Boolean).map(escapeHtml).join(' · ')}</em></p>
    `.trim()
    await window.aiOffice.newDoc({
      projectId: packId,
      aiContent: { title: it.stem.slice(0, 60), html },
    })
    onPackLinked?.()
  }

  const showForm = composing || Boolean(editingId)

  return (
    <>
      <p className="teacher-hint">
        {label(
          'Ngân hàng câu hỏi dùng lại — lọc môn/tag, sao chép hoặc Soạn vào gói Tri thức.',
          'Reusable question bank — filter, copy, or draft into the Knowledge pack.',
        )}
      </p>
      <div className="wb-db-toolbar">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            clearForm()
            setComposing(true)
          }}
        >
          {label('Thêm câu hỏi', 'Add question')}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy}
          onClick={() => {
            void (async () => {
              setBusy(true)
              setNotice(null)
              try {
                const picked = await pickSpreadsheetRows()
                if (!picked.ok) {
                  if (!picked.canceled) {
                    setNotice(
                      label(picked.error || 'Không đọc được file.', picked.error || 'Could not read file.'),
                    )
                  }
                  return
                }
                const result = importQuestionsFromRows(items, picked.rows)
                persist(result.items)
                setNotice(
                  label(
                    `Đã nhập ${result.added} câu hỏi từ ${picked.name}.`,
                    `Imported ${result.added} questions from ${picked.name}.`,
                  ),
                )
              } finally {
                setBusy(false)
              }
            })()
          }}
        >
          {label('Nhập Excel', 'Import Excel')}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={filtered.length === 0 || busy}
          onClick={() => {
            void (async () => {
              setBusy(true)
              setNotice(null)
              try {
                const res = await exportCsvAsXlsx({
                  csv: exportQuestionsCsv(filtered),
                  fileName: 'ngan-hang-cau-hoi.xlsx',
                  sheetName: 'Questions',
                  openInSheets: true,
                })
                setNotice(
                  res.ok
                    ? label(
                        `Đã xuất và mở trong Sheets: ${res.path}`,
                        `Exported and opened in Sheets: ${res.path}`,
                      )
                    : label(res.error || 'Không xuất được.', res.error || 'Export failed.'),
                )
              } finally {
                setBusy(false)
              }
            })()
          }}
        >
          {label('Xuất Excel', 'Export Excel')}
        </button>
      </div>
      {notice ? <p className="new-chat-attach-notice">{notice}</p> : null}
      <div className="wb-db-toolbar">
        <label className="wb-roster-filter">
          <span className="sr-only">{label('Môn', 'Subject')}</span>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
            <option value="">{label('Tất cả môn', 'All subjects')}</option>
            {EDU_SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {allTags.length > 0 ? (
          <label className="wb-roster-filter">
            <span className="sr-only">Tag</span>
            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
              <option value="">{label('Tất cả tag', 'All tags')}</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <input
          className="wb-qbank-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={label('Tìm…', 'Search…')}
        />
        <span className="teacher-count">{filtered.length}</span>
      </div>

      {showForm ? (
        <div className="wb-module-form wb-composer-panel">
          <label className="teacher-form-wide">
            <span>{label('Câu hỏi', 'Stem')}</span>
            <textarea
              rows={3}
              value={stem}
              onChange={(e) => setStem(e.target.value)}
              placeholder={label('Nội dung câu hỏi…', 'Question text…')}
              autoFocus
            />
          </label>
          <label className="teacher-form-wide">
            <span>{label('Đáp án / gợi ý', 'Answer / hint')}</span>
            <textarea rows={2} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          </label>
          <label>
            <span>{label('Môn', 'Subject')}</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              list="wb-qbank-subjects"
            />
            <datalist id="wb-qbank-subjects">
              {EDU_SUBJECTS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label>
            <span>{label('Lớp', 'Grade')}</span>
            <input value={grade} onChange={(e) => setGrade(e.target.value)} list="wb-qbank-grades" />
            <datalist id="wb-qbank-grades">
              {EDU_GRADES.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </label>
          <label>
            <span>Tags</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={label('VD: đại số, ôn tập', 'e.g. algebra, review')}
            />
          </label>
          <label>
            <span>{label('Độ khó', 'Difficulty')}</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty | '')}
            >
              <option value="">—</option>
              <option value="easy">{label('Dễ', 'Easy')}</option>
              <option value="medium">{label('TB', 'Medium')}</option>
              <option value="hard">{label('Khó', 'Hard')}</option>
            </select>
          </label>
          <div className="teacher-chip-row">
            <button type="button" className="btn btn-primary" onClick={save}>
              {editingId ? label('Lưu', 'Save') : label('Thêm', 'Add')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={clearForm}>
              {label('Huỷ', 'Cancel')}
            </button>
          </div>
        </div>
      ) : null}

      <ul className="wb-module-list">
        {filtered.length === 0 ? (
          <li className="teacher-empty">
            {items.length === 0
              ? label('Chưa có câu hỏi.', 'No questions yet.')
              : label('Không khớp bộ lọc.', 'No matches.')}
          </li>
        ) : (
          filtered.map((it) => (
            <li key={it.id} className="wb-module-row">
              <div className="wb-module-meta">
                <strong>{it.stem}</strong>
                <span>
                  {[
                    it.subject,
                    it.grade,
                    it.difficulty
                      ? it.difficulty === 'easy'
                        ? label('Dễ', 'Easy')
                        : it.difficulty === 'hard'
                          ? label('Khó', 'Hard')
                          : label('TB', 'Med')
                      : null,
                    (it.tags ?? []).join(', ') || null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                {it.answer ? (
                  <span className="teacher-hint">
                    {label('Đáp án:', 'Answer:')} {it.answer}
                  </span>
                ) : null}
              </div>
              <WbRowActions>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void copyItem(it)}
                >
                  {copiedId === it.id ? label('Đã chép', 'Copied') : label('Chép', 'Copy')}
                </button>
                <WbDraftBtn
                  label={label('Soạn', 'Draft')}
                  disabled={!packId}
                  title={
                    packId
                      ? undefined
                      : label('Chọn gói Tri thức trước', 'Select a Knowledge pack first')
                  }
                  onClick={() => void draftDoc(it)}
                />
                <WbEditBtn label={label('Sửa', 'Edit')} onClick={() => startEdit(it)} />
                <WbDeleteBtn
                  label={label('Xóa', 'Delete')}
                  onClick={() => persist(items.filter((x) => x.id !== it.id))}
                />
              </WbRowActions>
            </li>
          ))
        )}
      </ul>
    </>
  )
}
