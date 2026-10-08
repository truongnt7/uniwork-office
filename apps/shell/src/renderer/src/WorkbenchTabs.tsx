import { useEffect, useRef, useState } from 'react'
import type {
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
  ReactElement,
} from 'react'
import {
  WORKBENCH_MODULES,
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
  readPinnedModules,
  reorderPinnedModules,
  unpinModule,
} from './workbench-pins'

export type WorkbenchTabId = string

interface WorkbenchTabsProps {
  practiceId: PracticeId
  pillars: readonly PracticePillarLabels[]
  active: WorkbenchTabId
  onSelect: (id: WorkbenchTabId) => void
  vi: boolean
  /** Called when pinned set changes (parent may clear active if unpinned). */
  onPinsChange?: (pins: WorkbenchModuleId[]) => void
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [dragId, setDragId] = useState<WorkbenchModuleId | null>(null)
  const [overId, setOverId] = useState<WorkbenchModuleId | null>(null)
  const dragMoved = useRef(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPins(readPinnedModules(practiceId))
    setMenuOpen(false)
    setDragId(null)
    setOverId(null)
  }, [practiceId])

  useEffect(() => {
    const refresh = () => setPins(readPinnedModules(practiceId))
    window.addEventListener('uniwork:wb-pins-changed', refresh)
    return () => window.removeEventListener('uniwork:wb-pins-changed', refresh)
  }, [practiceId])

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  const label = (a: string, b: string) => (vi ? a : b)
  const availableToAdd = WORKBENCH_MODULES.filter((m) => !pins.includes(m.id))

  const add = (id: WorkbenchModuleId) => {
    const next = pinModule(practiceId, id)
    setPins(next)
    onPinsChange?.(next)
    onSelect(id)
    setMenuOpen(false)
  }

  const remove = (id: WorkbenchModuleId, e: ReactMouseEvent) => {
    e.stopPropagation()
    if (isCorePinnedModule(id)) return
    const next = unpinModule(practiceId, id)
    setPins(next)
    onPinsChange?.(next)
    if (active === id) onSelect(next.includes('desk') ? 'desk' : (pillars[0]?.id ?? 'knowledge'))
  }

  const onDragStart = (id: WorkbenchModuleId, e: ReactDragEvent) => {
    dragMoved.current = false
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    // Improves drag ghost in some Electron builds
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
    setPins(next)
    onPinsChange?.(next)
    setDragId(null)
    setOverId(null)
  }

  const onDragEnd = () => {
    setDragId(null)
    setOverId(null)
  }

  return (
    <nav className="teacher-tabs" aria-label={label('Khu vực làm việc', 'Workbench areas')}>
      {pillars.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`teacher-tab${active === p.id ? ' active' : ''}`}
          onClick={() => onSelect(p.id)}
          title={vi ? p.hintVi : p.hintEn}
        >
          <span className="teacher-tab-icon">
            <WorkbenchIcon id={p.id as PracticePillarId} size={18} />
          </span>
          <span>{vi ? p.labelVi : p.labelEn}</span>
        </button>
      ))}

      {pins.map((id) => {
        const mod = getWorkbenchModule(id)
        if (!mod) return null
        const dragging = dragId === id
        const over = overId === id && dragId !== id
        return (
          <button
            key={id}
            type="button"
            draggable
            className={`teacher-tab teacher-tab-module${active === id ? ' active' : ''}${
              dragging ? ' is-dragging' : ''
            }${over ? ' is-drag-over' : ''}`}
            onClick={() => {
              // Avoid accidental select after a successful reorder drag
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
            <span className="teacher-tab-grip" aria-hidden="true" title={label('Kéo', 'Drag')}>
              ⋮⋮
            </span>
            <span className="teacher-tab-icon">
              <WorkbenchIcon id={id} size={18} />
            </span>
            <span>{vi ? mod.labelVi : mod.labelEn}</span>
            {isCorePinnedModule(id) ? null : (
              <span
                className="teacher-tab-unpin"
                role="button"
                tabIndex={0}
                draggable={false}
                aria-label={label('Bỏ tab', 'Unpin tab')}
                onClick={(e) => remove(id, e)}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    remove(id, e as unknown as ReactMouseEvent)
                  }
                }}
              >
                ×
              </span>
            )}
          </button>
        )
      })}

      <div className="teacher-tab-add-wrap" ref={wrapRef}>
        <button
          type="button"
          className={`teacher-tab teacher-tab-add${menuOpen ? ' active' : ''}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          title={label('Thêm tab', 'Add tab')}
        >
          <span className="teacher-tab-icon">
            <WorkbenchIcon id="add" size={18} />
          </span>
        </button>
        {menuOpen && (
          <div className="teacher-tab-menu" role="menu">
            <p className="teacher-tab-menu-title">{label('Thêm vào bàn làm việc', 'Add to Workbench')}</p>
            {availableToAdd.length === 0 ? (
              <p className="teacher-tab-menu-empty">
                {label('Đã thêm đủ module.', 'All modules are pinned.')}
              </p>
            ) : (
              <div className="teacher-tab-menu-grid">
                {availableToAdd.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="menuitem"
                    className="teacher-tab-menu-item"
                    onClick={() => add(m.id)}
                    title={vi ? m.hintVi : m.hintEn}
                  >
                    <span className="teacher-tab-menu-icon">
                      <WorkbenchIcon id={m.id} size={22} />
                    </span>
                    <strong>{vi ? m.labelVi : m.labelEn}</strong>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
