/**
 * Gamma-style outline review: full-window modal (not the narrow AI chat dock).
 * User edits card titles / briefs, reorders, then confirms before slides generate.
 */
import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { useI18n } from '../i18n/locale'
import type { OutlineDraft, OutlinePageDraft } from './slides-skill'

interface Props {
  draft: OutlineDraft
  onConfirm: (draft: OutlineDraft) => void
  onCancel: () => void
}

export function OutlineEditorModal({ draft, onConfirm, onCancel }: Props): ReactElement {
  const { t } = useI18n()
  const [coreHook, setCoreHook] = useState(draft.coreHook)
  const [style, setStyle] = useState(draft.style)
  const [pages, setPages] = useState<OutlinePageDraft[]>(() =>
    draft.pages.map((p) => ({ ...p })),
  )
  const [focusIdx, setFocusIdx] = useState(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const updatePage = (index: number, patch: Partial<OutlinePageDraft>) => {
    setPages((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  const movePage = (index: number, dir: -1 | 1) => {
    setPages((prev) => {
      const next = [...prev]
      const j = index + dir
      if (j < 0 || j >= next.length) return prev
      const tmp = next[index]!
      next[index] = next[j]!
      next[j] = tmp
      return next
    })
    setFocusIdx((i) => {
      const j = i + dir
      if (i !== index) return i
      return Math.max(0, Math.min(pages.length - 1, j))
    })
  }

  const removePage = (index: number) => {
    setPages((prev) => {
      if (prev.length <= 1) return prev
      const next = prev.filter((_, i) => i !== index)
      setFocusIdx((f) => Math.min(f, next.length - 1))
      return next
    })
  }

  const addPage = () => {
    setPages((prev) => {
      const next = [
        ...prev,
        {
          title: t('aiOutlineNewPageTitle', { n: prev.length + 1 }),
          brief: '',
          layout: 'two_column',
          type: 'content',
        },
      ]
      setFocusIdx(next.length - 1)
      return next
    })
  }

  const canConfirm =
    pages.length > 0 &&
    pages.every((p) => p.title.trim().length > 0) &&
    (coreHook.trim().length > 0 || Boolean(draft.topic))

  const confirm = () => {
    if (!canConfirm) return
    onConfirm({
      coreHook: coreHook.trim(),
      style: style.trim(),
      pages: pages.map((p) => ({
        ...p,
        title: p.title.trim(),
        brief: p.brief.trim(),
      })),
      ...(draft.topic ? { topic: draft.topic } : {}),
    })
  }

  return (
    <div
      className="ai-outline-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className="ai-outline-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-outline-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ai-outline-modal-head">
          <div className="ai-outline-modal-head-text">
            <h2 id="ai-outline-modal-title">{t('aiOutlineTitle')}</h2>
            <p>
              {draft.topic
                ? `${t('aiOutlineTopic')}: ${draft.topic} · ${t('aiOutlinePageCount', { n: pages.length })}`
                : t('aiOutlinePageCount', { n: pages.length })}
            </p>
          </div>
          <button
            type="button"
            className="ai-outline-modal-close"
            onClick={onCancel}
            aria-label={t('aiOutlineCancel')}
          >
            ×
          </button>
        </header>

        <div className="ai-outline-modal-body">
          <aside className="ai-outline-modal-rail" aria-label={t('aiOutlinePageCount', { n: pages.length })}>
            {pages.map((p, i) => (
              <button
                key={i}
                type="button"
                className={`ai-outline-rail-item${focusIdx === i ? ' is-active' : ''}`}
                onClick={() => {
                  setFocusIdx(i)
                  document.getElementById(`ai-outline-card-${i}`)?.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth',
                  })
                }}
              >
                <span className="ai-outline-rail-num">{i + 1}</span>
                <span className="ai-outline-rail-title">{p.title.trim() || t('aiOutlinePage', { n: i + 1 })}</span>
              </button>
            ))}
            <button type="button" className="ai-outline-rail-add" onClick={addPage}>
              + {t('aiOutlineAddPage')}
            </button>
          </aside>

          <div className="ai-outline-modal-main">
            <section className="ai-outline-plan-strip">
              <label className="ai-outline-field">
                <span>{t('aiOutlineHook')}</span>
                <textarea
                  rows={2}
                  value={coreHook}
                  onChange={(e) => setCoreHook(e.target.value)}
                  placeholder={t('aiOutlineHookHint')}
                />
              </label>
              <label className="ai-outline-field">
                <span>{t('aiOutlineStyle')}</span>
                <textarea
                  rows={2}
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder={t('aiOutlineStyleHint')}
                />
              </label>
            </section>

            <ol className="ai-outline-card-list">
              {pages.map((p, i) => (
                <li
                  key={i}
                  id={`ai-outline-card-${i}`}
                  className={`ai-outline-card-item${focusIdx === i ? ' is-focused' : ''}`}
                  onFocusCapture={() => setFocusIdx(i)}
                >
                  <div className="ai-outline-card-item-top">
                    <span className="ai-outline-card-num" aria-hidden>
                      {i + 1}
                    </span>
                    <input
                      className="ai-outline-card-title"
                      value={p.title}
                      onChange={(e) => updatePage(i, { title: e.target.value })}
                      placeholder={t('aiOutlinePageTitle')}
                      aria-label={t('aiOutlinePage', { n: i + 1 })}
                    />
                    <div className="ai-outline-page-actions">
                      <button
                        type="button"
                        className="ai-outline-icon-btn"
                        disabled={i === 0}
                        onClick={() => movePage(i, -1)}
                        aria-label={t('aiOutlineMoveUp')}
                        title={t('aiOutlineMoveUp')}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="ai-outline-icon-btn"
                        disabled={i >= pages.length - 1}
                        onClick={() => movePage(i, 1)}
                        aria-label={t('aiOutlineMoveDown')}
                        title={t('aiOutlineMoveDown')}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="ai-outline-icon-btn danger"
                        disabled={pages.length <= 1}
                        onClick={() => removePage(i)}
                        aria-label={t('aiOutlineRemovePage')}
                        title={t('aiOutlineRemovePage')}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="ai-outline-card-brief"
                    rows={3}
                    value={p.brief}
                    onChange={(e) => updatePage(i, { brief: e.target.value })}
                    placeholder={t('aiOutlinePageBrief')}
                    aria-label={t('aiOutlinePageBrief')}
                  />
                </li>
              ))}
            </ol>
          </div>
        </div>

        <footer className="ai-outline-modal-foot">
          <button type="button" className="ai-outline-add" onClick={addPage}>
            {t('aiOutlineAddPage')}
          </button>
          <div className="ai-outline-actions-btns">
            <button type="button" className="ai-clarify-skip" onClick={onCancel}>
              {t('aiOutlineCancel')}
            </button>
            <button
              type="button"
              className="ai-clarify-submit"
              disabled={!canConfirm}
              onClick={confirm}
            >
              {t('aiOutlineConfirm')}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
