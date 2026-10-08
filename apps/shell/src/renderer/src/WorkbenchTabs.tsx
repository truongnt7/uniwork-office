import { useEffect, useRef, useState } from 'react'
import type {
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
  ReactElement,
} from 'react'
import {
  WORKBENCH_MODULES,
  WORKBENCH_SPACE_GROUPS,
  getWorkbenchModule,
  isCorePinnedModule,
  type PracticeId,
  type PracticePillarId,
  type PracticePillarLabels,
  type WorkbenchModuleId,
} from '@uniwork/practice-core'
import { WorkbenchIcon } from './WorkbenchIcons'
import {
  pinModule,
  pinPillar,
  readPinnedModules,
  readPinnedPillars,
  reorderPinnedModules,
  unpinModule,
  unpinPillar,
} from './workbench-pins'

export type WorkbenchTabId = string

interface WorkbenchTabsProps {
  practiceId: PracticeId
  pillars: readonly PracticePillarLabels[]
  active: WorkbenchTabId
  onSelect: (id: WorkbenchTabId) => void
  vi: boolean
  /** Called when pinned modules or pillars change (parent may clear active if unpinned). */
  onPinsChange?: (pins: WorkbenchModuleId[], pillarPins: PracticePillarId[]) => void
}

function notifyPinsChanged(): void {
  window.dispatchEvent(new Event('uniwork:wb-pins-changed'))
}

export function WorkbenchTabs({
  practiceId,
  pillars,
  active,
  onSelect,
  vi,
  onPinsChange,
}: WorkbenchTabsProps): ReactElement {
  const [pins, setPins] = useState<WorkbenchModuleId[]>(() => readPinnedModules(practiceId))
  const [pillarPins, setPillarPins] = useState<PracticePillarId[]>(() =>
    readPinnedPillars(practiceId),
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const [dragId, setDragId] = useState<WorkbenchModuleId | null>(null)
  const [overId, setOverId] = useState<WorkbenchModuleId | null>(null)
  const dragMoved = useRef(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPins(readPinnedModules(practiceId))
    setPillarPins(readPinnedPillars(practiceId))
    setMenuOpen(false)
    setDragId(null)
    setOverId(null)
  }, [practiceId])

  useEffect(() => {
    const refresh = () => {
      setPins(readPinnedModules(practiceId))
      setPillarPins(readPinnedPillars(practiceId))
    }
    window.addEventListener('uniwork:wb-pins-changed', refresh)
    return () => window.removeEventListener('uniwork:wb-pins-changed', refresh)
  }, [practiceId])

  useEffect(() => {
    if (!menuOpen) return
    // Defer so the opening click does not immediately close the menu.
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const t = window.setTimeout(() => {
      document.addEventListener('mousedown', onDoc)
    }, 0)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('mousedown', onDoc)
    }
  }, [menuOpen])

  const label = (a: string, b: string) => (vi ? a : b)
  const pinnedPillarDefs = pillars.filter((p) => pillarPins.includes(p.id))
  const availablePillars = pillars.filter((p) => !pillarPins.includes(p.id))
  const availableModules = WORKBENCH_MODULES.filter((m) => !pins.includes(m.id))
  const nothingToAdd = availablePillars.length === 0 && availableModules.length === 0

  const emitChange = (nextPins: WorkbenchModuleId[], nextPillars: PracticePillarId[]) => {
    setPins(nextPins)
    setPillarPins(nextPillars)
    onPinsChange?.(nextPins, nextPillars)
    notifyPinsChanged()
  }

  const addModule = (id: WorkbenchModuleId) => {
    const next = pinModule(practiceId, id)
    emitChange(next, pillarPins)
    onSelect(id)
    setMenuOpen(false)
  }

  const addPillar = (id: PracticePillarId) => {
    const next = pinPillar(practiceId, id)
    emitChange(pins, next)
    onSelect(id)
    setMenuOpen(false)
  }

  const removeModule = (id: WorkbenchModuleId, e: ReactMouseEvent) => {
    e.stopPropagation()
    if (isCorePinnedModule(id)) return
    const next = unpinModule(practiceId, id)
    emitChange(next, pillarPins)
    if (active === id) onSelect('desk')
  }

  const removePillar = (id: PracticePillarId, e: ReactMouseEvent) => {
    e.stopPropagation()
    const next = unpinPillar(practiceId, id)
    emitChange(pins, next)
    if (active === id) onSelect('desk')
  }

  const onDragStart = (id: WorkbenchModuleId, e: ReactDragEvent) => {
    dragMoved.current = false
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 24, 16)
    }
  }

  const onDragOver = (id: WorkbenchModuleId, e: ReactDragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragId && dragId !== id) {
      dragMoved.current = true
      setOverId(id)
    }
  }

  const onDrop = (id: WorkbenchModuleId, e: ReactDragEvent) => {
    e.preventDefault()
    const from = (e.dataTransfer.getData('text/plain') as WorkbenchModuleId) || dragId
    if (!from || from === id) {
      setDragId(null)
      setOverId(null)
      return
    }
    const next = reorderPinnedModules(practiceId, from, id)
    emitChange(next, pillarPins)
    setDragId(null)
    setOverId(null)
  }

  const onDragEnd = () => {
    setDragId(null)
    setOverId(null)
  }

  const renderModuleBtn = (id: WorkbenchModuleId) => {
    const mod = getWorkbenchModule(id)
    if (!mod) return null
    const dragging = dragId === id
    const over = overId === id && dragId !== id
    return (
      <button
        key={id}
        type="button"
        draggable
        className={`wb-space-item${active === id ? ' active' : ''}${
          dragging ? ' is-dragging' : ''
        }${over ? ' is-drag-over' : ''}`}
        onClick={() => {
          if (dragMoved.current) {
            dragMoved.current = false
            return
          }
          onSelect(id)
        }}
        onDragStart={(e) => onDragStart(id, e)}
        onDragOver={(e) => onDragOver(id, e)}
        onDrop={(e) => onDrop(id, e)}
        onDragEnd={onDragEnd}
        title={`${vi ? mod.hintVi : mod.hintEn} · ${label('Kéo để sắp xếp', 'Drag to reorder')}`}
      >
        <span className="wb-space-grip" aria-hidden="true">
          ⋮⋮
        </span>
        <span className="wb-space-icon">
          <WorkbenchIcon id={id} size={18} tone="quiet" />
        </span>
        <span className="wb-space-label">{vi ? mod.labelVi : mod.labelEn}</span>
        {isCorePinnedModule(id) ? null : (
          <span
            className="wb-space-unpin"
            role="button"
            tabIndex={0}
            draggable={false}
            aria-label={label('Bỏ khỏi Spaces', 'Remove from Spaces')}
            onClick={(e) => removeModule(id, e)}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                removeModule(id, e as unknown as ReactMouseEvent)
              }
            }}
          >
            ×
          </span>
        )}
      </button>
    )
  }

  return (
    <nav className="wb-spaces" aria-label={label('Spaces', 'Spaces')}>
      <div className="wb-spaces-scroll">
        {WORKBENCH_SPACE_GROUPS.map((group) => {
          const ids = group.moduleIds.filter((id) => pins.includes(id))
          if (ids.length === 0) return null
          return (
            <div key={group.id} className="wb-spaces-group">
              <p className="wb-spaces-group-label">{vi ? group.labelVi : group.labelEn}</p>
              <div className="wb-spaces-group-items">{ids.map((id) => renderModuleBtn(id))}</div>
            </div>
          )
        })}

        {pinnedPillarDefs.length > 0 ? (
          <div className="wb-spaces-group">
            <p className="wb-spaces-group-label">{label('Tri thức', 'Knowledge')}</p>
            <div className="wb-spaces-group-items">
              {pinnedPillarDefs.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`wb-space-item${active === p.id ? ' active' : ''}`}
                  onClick={() => onSelect(p.id)}
                  title={vi ? p.hintVi : p.hintEn}
                >
                  <span className="wb-space-icon">
                    <WorkbenchIcon id={p.id as PracticePillarId} size={18} tone="quiet" />
                  </span>
                  <span className="wb-space-label">{vi ? p.labelVi : p.labelEn}</span>
                  <span
                    className="wb-space-unpin"
                    role="button"
                    tabIndex={0}
                    draggable={false}
                    aria-label={label('Bỏ khỏi Spaces', 'Remove from Spaces')}
                    onClick={(e) => removePillar(p.id, e)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        removePillar(p.id, e as unknown as ReactMouseEvent)
                      }
                    }}
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="wb-spaces-footer" ref={wrapRef}>
        <button
          type="button"
          className={`wb-space-item wb-space-add${menuOpen ? ' active' : ''}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          title={label('Thêm Space', 'Add Space')}
        >
          <span className="wb-space-icon">
            <WorkbenchIcon id="add" size={18} tone="quiet" />
          </span>
          <span className="wb-space-label">{label('Thêm Space', 'Add Space')}</span>
        </button>
        {menuOpen && (
          <div className="wb-spaces-menu teacher-tab-menu" role="menu">
            <p className="teacher-tab-menu-title">
              {label('Thêm vào bàn làm việc', 'Add to Workbench')}
            </p>
            {nothingToAdd ? (
              <p className="teacher-tab-menu-empty">
                {label('Đã thêm đủ khu vực.', 'All areas are pinned.')}
              </p>
            ) : (
              <>
                {availablePillars.length > 0 ? (
                  <>
                    <p className="teacher-tab-menu-section">{label('Tri thức', 'Knowledge')}</p>
                    <div className="teacher-tab-menu-grid">
                      {availablePillars.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          role="menuitem"
                          className="teacher-tab-menu-item"
                          onClick={() => addPillar(p.id)}
                          title={vi ? p.hintVi : p.hintEn}
                        >
                          <span className="teacher-tab-menu-icon">
                            <WorkbenchIcon id={p.id} size={22} />
                          </span>
                          <strong>{vi ? p.labelVi : p.labelEn}</strong>
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
                {availableModules.length > 0 ? (
                  <>
                    <p className="teacher-tab-menu-section">{label('Module', 'Modules')}</p>
                    <div className="teacher-tab-menu-grid">
                      {availableModules.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          role="menuitem"
                          className="teacher-tab-menu-item"
                          onClick={() => addModule(m.id)}
                          title={vi ? m.hintVi : m.hintEn}
                        >
                          <span className="teacher-tab-menu-icon">
                            <WorkbenchIcon id={m.id} size={22} />
                          </span>
                          <strong>{vi ? m.labelVi : m.labelEn}</strong>
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
