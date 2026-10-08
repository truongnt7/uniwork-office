/**
 * Lightweight ⌘K / Ctrl+K palette for Workbench Spaces + My AI prompts.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import {
  WORKBENCH_MODULES,
  type PracticeId,
  type WorkbenchModuleId,
} from '@uniwork/practice-core'
import { WorkbenchIcon } from './WorkbenchIcons'
import { pinModule } from './workbench-pins'

export interface WorkbenchCommandPaletteProps {
  open: boolean
  onClose: () => void
  vi: boolean
  practiceId: PracticeId
  onOpenModule: (id: WorkbenchModuleId | string) => void
}

type PaletteItem = {
  id: string
  label: string
  hint: string
  kind: 'module' | 'ai'
  moduleId?: WorkbenchModuleId
  prompt?: string
}

export function WorkbenchCommandPalette({
  open,
  onClose,
  vi,
  practiceId,
  onOpenModule,
}: WorkbenchCommandPaletteProps): ReactElement | null {
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const label = (a: string, b: string) => (vi ? a : b)

  useEffect(() => {
    if (!open) return
    setQ('')
    const t = window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const items = useMemo((): PaletteItem[] => {
    const modules: PaletteItem[] = WORKBENCH_MODULES.filter((m) => m.available).map((m) => ({
      id: `m:${m.id}`,
      label: vi ? m.labelVi : m.labelEn,
      hint: vi ? m.hintVi : m.hintEn,
      kind: 'module',
      moduleId: m.id,
    }))
    const ai: PaletteItem[] = [
      {
        id: 'ai:brief',
        label: label('Hôm nay của tôi', 'My day brief'),
        hint: label('My AI — tổng quan trên máy', 'My AI — on-device overview'),
        kind: 'ai',
        prompt: vi ? 'Hôm nay của tôi' : 'Morning brief for my day',
      },
      {
        id: 'ai:task',
        label: label('Thêm việc…', 'Add a task…'),
        hint: 'My AI',
        kind: 'ai',
        prompt: vi ? 'Thêm công việc ' : 'Add a task ',
      },
      {
        id: 'ai:remind',
        label: label('Nhắc việc…', 'Remind me…'),
        hint: 'My AI',
        kind: 'ai',
        prompt: vi ? 'Nhắc tôi ' : 'Remind me ',
      },
    ]
    const all = [...ai, ...modules]
    const needle = q.trim().toLowerCase()
    if (!needle) return all.slice(0, 12)
    return all
      .filter(
        (it) =>
          it.label.toLowerCase().includes(needle) ||
          it.hint.toLowerCase().includes(needle) ||
          it.id.toLowerCase().includes(needle),
      )
      .slice(0, 12)
  }, [q, vi])

  if (!open) return null

  const run = (it: PaletteItem) => {
    if (it.kind === 'module' && it.moduleId) {
      pinModule(practiceId, it.moduleId)
      window.dispatchEvent(new Event('uniwork:wb-pins-changed'))
      onOpenModule(it.moduleId)
      onClose()
      return
    }
    if (it.kind === 'ai' && it.prompt) {
      onClose()
      window.dispatchEvent(new Event('uniwork:open-my-ai'))
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('uniwork:my-ai-submit', { detail: { text: it.prompt } }),
        )
      }, 80)
    }
  }

  return (
    <div className="wb-cmdk-overlay" role="presentation" onClick={onClose}>
      <div
        className="wb-cmdk"
        role="dialog"
        aria-modal="true"
        aria-label={label('Lệnh nhanh', 'Quick commands')}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          className="wb-cmdk-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={label('Đi tới Space hoặc lệnh My AI…', 'Go to a Space or My AI command…')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && items[0]) {
              e.preventDefault()
              run(items[0])
            }
          }}
        />
        <ul className="wb-cmdk-list">
          {items.length === 0 ? (
            <li className="wb-cmdk-empty">{label('Không khớp.', 'No matches.')}</li>
          ) : (
            items.map((it) => (
              <li key={it.id}>
                <button type="button" className="wb-cmdk-item" onClick={() => run(it)}>
                  <span className="wb-cmdk-item-icon">
                    {it.moduleId ? (
                      <WorkbenchIcon id={it.moduleId} size={18} tone="quiet" />
                    ) : (
                      <WorkbenchIcon id="assistant" size={18} tone="quiet" />
                    )}
                  </span>
                  <span className="wb-cmdk-item-text">
                    <strong>{it.label}</strong>
                    <span>{it.hint}</span>
                  </span>
                  <span className="wb-cmdk-item-kind">
                    {it.kind === 'ai' ? 'AI' : label('Space', 'Space')}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
        <p className="wb-cmdk-foot">
          {label('Enter để chọn · Esc đóng · ⌘K / Ctrl+K mở', 'Enter to run · Esc closes · ⌘K / Ctrl+K')}
        </p>
      </div>
    </div>
  )
}

/** Global listener helper for Workbench hosts. */
export function useWorkbenchCommandPaletteHotkey(onOpen: () => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const t = e.target as HTMLElement | null
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
          // Allow ⌘K even in inputs inside Workbench — Notion-like
        }
        e.preventDefault()
        onOpen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onOpen])
}
