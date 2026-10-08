import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import {
  DECK_TEMPLATES,
  DECK_TEMPLATE_CATEGORIES,
  buildGalleryGenerateMessages,
  deckTemplateCategoryLabel,
  deckTemplateDesc,
  deckTemplateLabel,
  deckTemplateTags,
  type DeckTemplate,
  type DeckTemplateCategory,
  type DeckTemplateCoverLayout,
} from './deck-templates'

interface Props {
  open: boolean
  lang: string
  labels: {
    title: string
    subtitle: string
    browseHeading: string
    detailsTitle: string
    badge: string
    back: string
    pages: (n: number) => string
    outline: string
    topicLabel: string
    topicPlaceholder: string
    generate: string
    cancel: string
  }
  onClose: () => void
  onGenerate: (instruction: string, displayText: string) => void
}

type Stage = 'browse' | 'detail'

/** Phase A mock cover — CSS mood + layout, not real slide art. */
function MockCover({
  tpl,
  layout,
  size = 'card',
}: {
  tpl: DeckTemplate
  layout?: DeckTemplateCoverLayout | string
  size?: 'card' | 'hero' | 'thumb'
}): ReactElement {
  const cover = (layout as DeckTemplateCoverLayout | undefined) ?? tpl.coverLayout
  return (
    <div
      className={`ai-tpl-cover ai-tpl-cover--${size}`}
      data-tpl={tpl.id}
      data-mood={tpl.mood}
      data-layout={cover}
      aria-hidden
    >
      <span className="ai-tpl-cover-glow" />
      <span className="ai-tpl-cover-panel ai-tpl-cover-panel--a" />
      <span className="ai-tpl-cover-panel ai-tpl-cover-panel--b" />
      <span className="ai-tpl-cover-line ai-tpl-cover-line--1" />
      <span className="ai-tpl-cover-line ai-tpl-cover-line--2" />
      <span className="ai-tpl-cover-line ai-tpl-cover-line--3" />
      <span className="ai-tpl-cover-chip" />
    </div>
  )
}

export function DeckTemplateGalleryModal({
  open,
  lang,
  labels,
  onClose,
  onGenerate,
}: Props): ReactElement | null {
  const [stage, setStage] = useState<Stage>('browse')
  const [category, setCategory] = useState<DeckTemplateCategory | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string>(DECK_TEMPLATES[0]!.id)
  const [previewPage, setPreviewPage] = useState(0)
  const [topic, setTopic] = useState('')

  useEffect(() => {
    if (!open) return
    setStage('browse')
    setCategory('all')
    setSelectedId(DECK_TEMPLATES[0]!.id)
    setPreviewPage(0)
    setTopic('')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (stage === 'detail') {
        e.preventDefault()
        setStage('browse')
        return
      }
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, stage])

  const filtered = useMemo(() => {
    if (category === 'all') return [...DECK_TEMPLATES]
    return DECK_TEMPLATES.filter((t) => t.category === category)
  }, [category])

  const selected: DeckTemplate =
    DECK_TEMPLATES.find((t) => t.id === selectedId) ?? DECK_TEMPLATES[0]!

  const openDetail = (id: string) => {
    setSelectedId(id)
    setPreviewPage(0)
    setTopic('')
    setStage('detail')
  }

  if (!open) return null

  const canGenerate = topic.trim().length > 0
  const previewLayout =
    selected.pages[previewPage]?.layout ?? selected.coverLayout
  const tags = deckTemplateTags(selected, lang)

  const submit = () => {
    if (!canGenerate) return
    const msgs = buildGalleryGenerateMessages(selected.id, topic.trim(), lang)
    if (!msgs) return
    onGenerate(msgs.instruction, msgs.displayText)
  }

  return (
    <div className="ai-tpl-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`ai-tpl-modal ai-tpl-modal--${stage}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-tpl-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ai-tpl-modal-head">
          <div className="ai-tpl-modal-head-text">
            {stage === 'detail' ? (
              <button type="button" className="ai-tpl-back" onClick={() => setStage('browse')}>
                ← {labels.back}
              </button>
            ) : null}
            <h2 id="ai-tpl-modal-title">
              {stage === 'browse' ? labels.title : labels.detailsTitle}
            </h2>
            {stage === 'browse' ? <p>{labels.subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="ai-tpl-modal-close"
            onClick={onClose}
            aria-label={labels.cancel}
          >
            ×
          </button>
        </header>

        {stage === 'browse' ? (
          <>
            <div className="ai-tpl-modal-cats" role="tablist">
              {DECK_TEMPLATE_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={category === c.id}
                  className={`ai-tpl-cat${category === c.id ? ' is-active' : ''}`}
                  onClick={() => setCategory(c.id)}
                >
                  {deckTemplateCategoryLabel(c.id, lang)}
                </button>
              ))}
            </div>
            <div className="ai-tpl-browse">
              <h3 className="ai-tpl-browse-heading">{labels.browseHeading}</h3>
              <div className="ai-tpl-browse-grid" role="list">
                {filtered.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    role="listitem"
                    className="ai-tpl-card"
                    data-tpl={tpl.id}
                    onClick={() => openDetail(tpl.id)}
                  >
                    <div className="ai-tpl-card-media">
                      <MockCover tpl={tpl} size="card" />
                      <span className="ai-tpl-card-badge">{labels.badge}</span>
                    </div>
                    <span className="ai-tpl-card-name">{deckTemplateLabel(tpl, lang)}</span>
                    <span className="ai-tpl-card-meta">{labels.pages(tpl.approxPages)}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="ai-tpl-detail">
            <div className="ai-tpl-detail-visual" data-tpl={selected.id}>
              <MockCover tpl={selected} layout={previewLayout} size="hero" />
              <div className="ai-tpl-detail-strip" role="tablist" aria-label={labels.outline}>
                {selected.pages.slice(0, 5).map((p, i) => (
                  <button
                    key={`${selected.id}-thumb-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={previewPage === i}
                    className={`ai-tpl-detail-thumb${previewPage === i ? ' is-active' : ''}`}
                    onClick={() => setPreviewPage(i)}
                  >
                    <MockCover tpl={selected} layout={p.layout} size="thumb" />
                  </button>
                ))}
              </div>
            </div>

            <aside className="ai-tpl-detail-meta-col">
              <span className="ai-tpl-detail-badge">{labels.badge}</span>
              <h3>{deckTemplateLabel(selected, lang)}</h3>
              <div className="ai-tpl-detail-tags">
                {tags.map((tag) => (
                  <span key={tag} className="ai-tpl-tag">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="ai-tpl-detail-desc">{deckTemplateDesc(selected, lang)}</p>
              <p className="ai-tpl-detail-meta">
                {labels.pages(selected.approxPages)} ·{' '}
                {deckTemplateCategoryLabel(selected.category, lang)}
              </p>
              <div className="ai-tpl-detail-outline">
                <div className="ai-tpl-detail-outline-title">{labels.outline}</div>
                <ol>
                  {selected.pages.map((p, i) => (
                    <li key={`${selected.id}-o-${i}`}>
                      <span className="ai-tpl-detail-pg">{i + 1}</span>
                      <span>{p.title.replace('{topic}', '…')}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <label className="ai-tpl-detail-topic">
                <span>{labels.topicLabel}</span>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={labels.topicPlaceholder}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      submit()
                    }
                  }}
                />
              </label>
              <div className="ai-tpl-detail-actions">
                <button type="button" className="btn-secondary" onClick={() => setStage('browse')}>
                  {labels.back}
                </button>
                <button
                  type="button"
                  className="btn-primary ai-tpl-use-btn"
                  disabled={!canGenerate}
                  onClick={submit}
                >
                  {labels.generate}
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
