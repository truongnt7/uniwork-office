import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import {
  DECK_TEMPLATES,
  DECK_TEMPLATE_CATEGORIES,
  buildGalleryGenerateMessages,
  buildGalleryStyleTemplateMessages,
  buildGalleryUserDeckMessages,
  deckTemplateCategoryLabel,
  deckTemplateDesc,
  deckTemplateLabel,
  deckTemplateTags,
  filterDeckTemplates,
  templateMatchesQuery,
  type DeckTemplate,
  type DeckTemplateCoverLayout,
  type DeckTemplateGalleryFilter,
} from './deck-templates'
import { getTemplatePreviewAssets } from './template-preview-assets'

export interface UserStyleTemplateMeta {
  name: string
  topic: string
  createdAt: string
}

export interface UserDeckTemplateMeta {
  id: string
  name: string
  originalName: string
  createdAt: string
}

type MineItem =
  | { kind: 'deck'; deck: UserDeckTemplateMeta }
  | { kind: 'style'; style: UserStyleTemplateMeta }

interface Props {
  open: boolean
  lang: string
  labels: {
    title: string
    subtitle: string
    browseHeading: string
    trendingHeading: string
    creativeHeading: string
    mineHeading: string
    mineEmpty: string
    mineHint: string
    mineTopicFallback: string
    uploadBtn: string
    uploading: string
    deckBadge: string
    searchPlaceholder: string
    searchEmpty: string
    deleteStyle: string
    detailsTitle: string
    badge: string
    styleBadge: string
    back: string
    previewDisclaimer: string
    pages: (n: number) => string
    outline: string
    topicLabel: string
    topicPlaceholder: string
    generate: string
    cancel: string
  }
  listStyleTemplates: () => Promise<UserStyleTemplateMeta[]>
  deleteStyleTemplate?: (name: string) => Promise<{ ok: boolean; error?: string }>
  listUserDeckTemplates: () => Promise<UserDeckTemplateMeta[]>
  importUserDeckTemplate: () => Promise<{
    ok: boolean
    template?: UserDeckTemplateMeta
    error?: string
  }>
  deleteUserDeckTemplate?: (id: string) => Promise<{ ok: boolean; error?: string }>
  onClose: () => void
  onGenerate: (
    instruction: string,
    displayText: string,
    opts?: { openPath?: string },
  ) => void | Promise<void>
}

type Stage = 'browse' | 'detail' | 'mine-style' | 'mine-deck'
type CoverSize = 'card' | 'hero' | 'thumb'

function MockCover({
  tpl,
  layout,
  size = 'card',
}: {
  tpl: DeckTemplate
  layout?: DeckTemplateCoverLayout | string
  size?: CoverSize
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

function TemplateCover({
  tpl,
  src,
  layout,
  size = 'card',
}: {
  tpl: DeckTemplate
  src?: string | null
  layout?: DeckTemplateCoverLayout | string
  size?: CoverSize
}): ReactElement {
  const assets = getTemplatePreviewAssets(tpl.id)
  const resolved = src ?? assets?.cover ?? null
  if (resolved) {
    return (
      <div className={`ai-tpl-cover ai-tpl-cover--${size} ai-tpl-cover--photo`} data-tpl={tpl.id}>
        <img className="ai-tpl-cover-img" src={resolved} alt="" loading="lazy" draggable={false} />
      </div>
    )
  }
  return <MockCover tpl={tpl} layout={layout} size={size} />
}

function StyleCover({ name, size = 'card' }: { name: string; size?: CoverSize }): ReactElement {
  return (
    <div
      className={`ai-tpl-cover ai-tpl-cover--${size} ai-tpl-cover--style`}
      data-style={name}
      aria-hidden
    >
      <span className="ai-tpl-cover-glow" />
      <span className="ai-tpl-style-mark">★</span>
    </div>
  )
}

function DeckUploadCover({ size = 'card' }: { size?: CoverSize }): ReactElement {
  return (
    <div className={`ai-tpl-cover ai-tpl-cover--${size} ai-tpl-cover--deck`} aria-hidden>
      <span className="ai-tpl-cover-glow" />
      <span className="ai-tpl-style-mark">⬆</span>
    </div>
  )
}

function browseHeadingFor(
  category: DeckTemplateGalleryFilter,
  labels: Props['labels'],
): string {
  if (category === 'trending') return labels.trendingHeading
  if (category === 'creative') return labels.creativeHeading
  if (category === 'mine') return labels.mineHeading
  return labels.browseHeading
}

export function DeckTemplateGalleryModal({
  open,
  lang,
  labels,
  listStyleTemplates,
  deleteStyleTemplate,
  listUserDeckTemplates,
  importUserDeckTemplate,
  deleteUserDeckTemplate,
  onClose,
  onGenerate,
}: Props): ReactElement | null {
  const [stage, setStage] = useState<Stage>('browse')
  const [category, setCategory] = useState<DeckTemplateGalleryFilter>('all')
  const [query, setQuery] = useState('')
  const defaultSelectedId = DECK_TEMPLATES[0]!.id
  const [selectedId, setSelectedId] = useState<string>(defaultSelectedId)
  const [selectedStyle, setSelectedStyle] = useState<UserStyleTemplateMeta | null>(null)
  const [selectedDeck, setSelectedDeck] = useState<UserDeckTemplateMeta | null>(null)
  const [mineStyles, setMineStyles] = useState<UserStyleTemplateMeta[]>([])
  const [mineDecks, setMineDecks] = useState<UserDeckTemplateMeta[]>([])
  const [mineLoading, setMineLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewPage, setPreviewPage] = useState(0)
  const [topic, setTopic] = useState('')

  const refreshMine = async () => {
    setMineLoading(true)
    try {
      const [styles, decks] = await Promise.all([
        listStyleTemplates(),
        listUserDeckTemplates(),
      ])
      setMineStyles(Array.isArray(styles) ? styles : [])
      setMineDecks(Array.isArray(decks) ? decks : [])
    } catch {
      setMineStyles([])
      setMineDecks([])
    } finally {
      setMineLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    setStage('browse')
    setCategory('all')
    setQuery('')
    setSelectedId(defaultSelectedId)
    setSelectedStyle(null)
    setSelectedDeck(null)
    setPreviewPage(0)
    setTopic('')
    void refreshMine()
  }, [open, defaultSelectedId, listStyleTemplates, listUserDeckTemplates])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (stage !== 'browse') {
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
    const base = filterDeckTemplates(category)
    return base.filter((tpl) => templateMatchesQuery(tpl, query, lang))
  }, [category, query, lang])

  const mineItems = useMemo((): MineItem[] => {
    const decks: MineItem[] = mineDecks.map((deck) => ({ kind: 'deck', deck }))
    const styles: MineItem[] = mineStyles.map((style) => ({ kind: 'style', style }))
    return [...decks, ...styles]
  }, [mineDecks, mineStyles])

  const filteredMine = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return mineItems
    return mineItems.filter((item) => {
      if (item.kind === 'deck') {
        return `${item.deck.name} ${item.deck.originalName}`.toLowerCase().includes(q)
      }
      return `${item.style.name} ${item.style.topic}`.toLowerCase().includes(q)
    })
  }, [mineItems, query])

  const browseHeading = browseHeadingFor(category, labels)

  const selected: DeckTemplate =
    DECK_TEMPLATES.find((t) => t.id === selectedId) ?? DECK_TEMPLATES[0]!

  const openDetail = (id: string) => {
    setSelectedId(id)
    setSelectedStyle(null)
    setSelectedDeck(null)
    setPreviewPage(0)
    setTopic('')
    setStage('detail')
  }

  const openStyleDetail = (row: UserStyleTemplateMeta) => {
    setSelectedStyle(row)
    setSelectedDeck(null)
    setTopic(row.topic || '')
    setStage('mine-style')
  }

  const openDeckDetail = (row: UserDeckTemplateMeta) => {
    setSelectedDeck(row)
    setSelectedStyle(null)
    setTopic('')
    setStage('mine-deck')
  }

  const backToBrowse = () => setStage('browse')

  if (!open) return null

  const canGenerate = topic.trim().length > 0
  const previewLayout = selected.pages[previewPage]?.layout ?? selected.coverLayout
  const selectedPreview = getTemplatePreviewAssets(selected.id)
  const stripSrcs = selectedPreview
    ? [selectedPreview.cover, ...selectedPreview.pages].slice(0, 5)
    : null
  const stripCount = stripSrcs?.length ?? Math.min(5, selected.pages.length)
  const tags = deckTemplateTags(selected, lang)

  const submitBuiltin = () => {
    if (!canGenerate) return
    const msgs = buildGalleryGenerateMessages(selected.id, topic.trim(), lang)
    if (!msgs) return
    void onGenerate(msgs.instruction, msgs.displayText)
  }

  const submitStyle = () => {
    if (!canGenerate || !selectedStyle) return
    const msgs = buildGalleryStyleTemplateMessages(selectedStyle.name, topic.trim(), lang)
    void onGenerate(msgs.instruction, msgs.displayText)
  }

  const submitDeck = async () => {
    if (!canGenerate || !selectedDeck) return
    const prepared = await window.slidesApi.prepareUserDeckTemplate(selectedDeck.id)
    if (!prepared.ok || !prepared.path) return
    const msgs = buildGalleryUserDeckMessages(selectedDeck.name, topic.trim(), lang)
    await onGenerate(msgs.instruction, msgs.displayText, { openPath: prepared.path })
  }

  const onDeleteStyle = async () => {
    if (!selectedStyle || !deleteStyleTemplate) return
    const r = await deleteStyleTemplate(selectedStyle.name)
    if (!r.ok) return
    setSelectedStyle(null)
    setStage('browse')
    await refreshMine()
  }

  const onDeleteDeck = async () => {
    if (!selectedDeck || !deleteUserDeckTemplate) return
    const r = await deleteUserDeckTemplate(selectedDeck.id)
    if (!r.ok) return
    setSelectedDeck(null)
    setStage('browse')
    await refreshMine()
  }

  const onUpload = async () => {
    if (uploading) return
    setUploading(true)
    try {
      const r = await importUserDeckTemplate()
      if (r.ok) {
        setCategory('mine')
        await refreshMine()
        if (r.template) openDeckDetail(r.template)
      }
    } finally {
      setUploading(false)
    }
  }

  const showBuiltinGrid = category !== 'mine'

  return (
    <div className="ai-tpl-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`ai-tpl-modal ai-tpl-modal--${stage === 'browse' ? 'browse' : 'detail'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-tpl-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ai-tpl-modal-head">
          <div className="ai-tpl-modal-head-text">
            {stage !== 'browse' ? (
              <button type="button" className="ai-tpl-back" onClick={backToBrowse}>
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
              <div className="ai-tpl-browse-toolbar">
                <h3 className="ai-tpl-browse-heading">{browseHeading}</h3>
                <div className="ai-tpl-browse-toolbar-actions">
                  {category === 'mine' ? (
                    <button
                      type="button"
                      className="ai-tpl-upload-btn"
                      disabled={uploading}
                      onClick={() => void onUpload()}
                    >
                      {uploading ? labels.uploading : labels.uploadBtn}
                    </button>
                  ) : null}
                  <input
                    className="ai-tpl-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={labels.searchPlaceholder}
                    aria-label={labels.searchPlaceholder}
                  />
                </div>
              </div>
              <p className="ai-tpl-browse-disclaimer">
                {category === 'mine' ? labels.mineHint : labels.previewDisclaimer}
              </p>

              {showBuiltinGrid ? (
                filtered.length === 0 ? (
                  <p className="ai-tpl-empty">{labels.searchEmpty}</p>
                ) : (
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
                          <TemplateCover tpl={tpl} size="card" />
                          <span className="ai-tpl-card-badge">{labels.badge}</span>
                        </div>
                        <span className="ai-tpl-card-name">{deckTemplateLabel(tpl, lang)}</span>
                        <span className="ai-tpl-card-meta">{labels.pages(tpl.approxPages)}</span>
                      </button>
                    ))}
                  </div>
                )
              ) : mineLoading ? (
                <p className="ai-tpl-empty">…</p>
              ) : filteredMine.length === 0 ? (
                <div className="ai-tpl-empty-block">
                  <p className="ai-tpl-empty">
                    {query.trim() ? labels.searchEmpty : labels.mineEmpty}
                  </p>
                  {!query.trim() ? (
                    <button
                      type="button"
                      className="ai-tpl-upload-btn ai-tpl-upload-btn--empty"
                      disabled={uploading}
                      onClick={() => void onUpload()}
                    >
                      {uploading ? labels.uploading : labels.uploadBtn}
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="ai-tpl-browse-grid" role="list">
                  {filteredMine.map((item) =>
                    item.kind === 'deck' ? (
                      <button
                        key={`deck-${item.deck.id}`}
                        type="button"
                        role="listitem"
                        className="ai-tpl-card"
                        data-deck={item.deck.id}
                        onClick={() => openDeckDetail(item.deck)}
                      >
                        <div className="ai-tpl-card-media">
                          <DeckUploadCover size="card" />
                          <span className="ai-tpl-card-badge">{labels.deckBadge}</span>
                        </div>
                        <span className="ai-tpl-card-name">{item.deck.name}</span>
                        <span className="ai-tpl-card-meta">{item.deck.originalName}</span>
                      </button>
                    ) : (
                      <button
                        key={`style-${item.style.name}`}
                        type="button"
                        role="listitem"
                        className="ai-tpl-card"
                        data-style={item.style.name}
                        onClick={() => openStyleDetail(item.style)}
                      >
                        <div className="ai-tpl-card-media">
                          <StyleCover name={item.style.name} size="card" />
                          <span className="ai-tpl-card-badge">{labels.styleBadge}</span>
                        </div>
                        <span className="ai-tpl-card-name">{item.style.name}</span>
                        <span className="ai-tpl-card-meta">
                          {item.style.topic.trim() || labels.mineTopicFallback}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          </>
        ) : stage === 'mine-style' && selectedStyle ? (
          <div className="ai-tpl-detail ai-tpl-detail--mine">
            <div className="ai-tpl-detail-visual">
              <StyleCover name={selectedStyle.name} size="hero" />
            </div>
            <aside className="ai-tpl-detail-meta-col">
              <span className="ai-tpl-detail-badge">{labels.styleBadge}</span>
              <h3>{selectedStyle.name}</h3>
              <p className="ai-tpl-detail-desc">
                {selectedStyle.topic.trim() || labels.mineTopicFallback}
              </p>
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
                      submitStyle()
                    }
                  }}
                />
              </label>
              <div className="ai-tpl-detail-actions">
                <button type="button" className="btn-secondary" onClick={backToBrowse}>
                  {labels.back}
                </button>
                {deleteStyleTemplate ? (
                  <button type="button" className="btn-secondary" onClick={() => void onDeleteStyle()}>
                    {labels.deleteStyle}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn-primary ai-tpl-use-btn"
                  disabled={!canGenerate}
                  onClick={submitStyle}
                >
                  {labels.generate}
                </button>
              </div>
            </aside>
          </div>
        ) : stage === 'mine-deck' && selectedDeck ? (
          <div className="ai-tpl-detail ai-tpl-detail--mine">
            <div className="ai-tpl-detail-visual">
              <DeckUploadCover size="hero" />
            </div>
            <aside className="ai-tpl-detail-meta-col">
              <span className="ai-tpl-detail-badge">{labels.deckBadge}</span>
              <h3>{selectedDeck.name}</h3>
              <p className="ai-tpl-detail-desc">{selectedDeck.originalName}</p>
              <p className="ai-tpl-preview-disclaimer">{labels.mineHint}</p>
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
                      void submitDeck()
                    }
                  }}
                />
              </label>
              <div className="ai-tpl-detail-actions">
                <button type="button" className="btn-secondary" onClick={backToBrowse}>
                  {labels.back}
                </button>
                {deleteUserDeckTemplate ? (
                  <button type="button" className="btn-secondary" onClick={() => void onDeleteDeck()}>
                    {labels.deleteStyle}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn-primary ai-tpl-use-btn"
                  disabled={!canGenerate}
                  onClick={() => void submitDeck()}
                >
                  {labels.generate}
                </button>
              </div>
            </aside>
          </div>
        ) : (
          <div className="ai-tpl-detail">
            <div className="ai-tpl-detail-visual" data-tpl={selected.id}>
              <TemplateCover
                tpl={selected}
                src={stripSrcs?.[previewPage] ?? null}
                layout={previewLayout}
                size="hero"
              />
              <div className="ai-tpl-detail-strip" role="tablist" aria-label={labels.outline}>
                {Array.from({ length: stripCount }, (_, i) => (
                  <button
                    key={`${selected.id}-thumb-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={previewPage === i}
                    className={`ai-tpl-detail-thumb${previewPage === i ? ' is-active' : ''}`}
                    onClick={() => setPreviewPage(i)}
                  >
                    <TemplateCover
                      tpl={selected}
                      src={stripSrcs?.[i] ?? null}
                      layout={selected.pages[i]?.layout ?? selected.coverLayout}
                      size="thumb"
                    />
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
              <p className="ai-tpl-preview-disclaimer">{labels.previewDisclaimer}</p>
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
                      submitBuiltin()
                    }
                  }}
                />
              </label>
              <div className="ai-tpl-detail-actions">
                <button type="button" className="btn-secondary" onClick={backToBrowse}>
                  {labels.back}
                </button>
                <button
                  type="button"
                  className="btn-primary ai-tpl-use-btn"
                  disabled={!canGenerate}
                  onClick={submitBuiltin}
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
