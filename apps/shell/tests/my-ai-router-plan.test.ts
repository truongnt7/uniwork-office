import { describe, expect, it } from 'vitest'
import {
  extractCompanionClauses,
  routeMyAiText,
  splitMyAiClauses,
} from '../src/renderer/src/my-ai-router'

describe('my-ai multi-tool plans (B4)', () => {
  it('splits Vietnamese conjunction + action comma', () => {
    expect(
      splitMyAiClauses(
        'Soạn báo giá Word và thêm công việc follow-up khách, mở tab Clients',
      ),
    ).toEqual([
      'Soạn báo giá Word',
      'thêm công việc follow-up khách',
      'mở tab Clients',
    ])
  })

  it('builds create + task + open Clients plan', () => {
    const r = routeMyAiText(
      'Soạn báo giá Word và thêm công việc follow-up khách, mở tab Clients',
    )
    expect(r.kind).toBe('plan')
    if (r.kind !== 'plan') return
    expect(r.steps).toHaveLength(3)
    expect(r.steps[0]).toMatchObject({ kind: 'create_file', app: 'docs' })
    expect(r.steps[1]).toMatchObject({ kind: 'workbench' })
    expect(r.steps[2]).toMatchObject({ kind: 'workbench' })
    if (r.steps[1]!.kind === 'workbench') {
      expect(r.steps[1].intent.action).toBe('add_item')
      expect(r.steps[1].intent.target).toEqual({ kind: 'module', id: 'tasks' })
    }
    if (r.steps[2]!.kind === 'workbench') {
      expect(r.steps[2].intent.action).toBe('open')
      expect(r.steps[2].intent.target).toEqual({ kind: 'module', id: 'clients' })
    }
  })

  it('keeps single create as a single step', () => {
    const r = routeMyAiText('Soạn văn bản Word: thư mời họp khách')
    expect(r.kind).toBe('create_file')
  })

  it('extracts trailing companions without conjunction split', () => {
    const { head, companions } = extractCompanionClauses(
      'Tạo slide kế hoạch quý rồi thêm công việc gửi slide',
    )
    expect(head.toLowerCase()).toContain('slide')
    expect(companions.some((c) => /công việc/i.test(c))).toBe(true)
  })

  it('routes continue / summarize active tab', () => {
    const cont = routeMyAiText('Tiếp tục trên file đang mở: làm rõ phần kết luận')
    expect(cont.kind).toBe('continue_active')
    if (cont.kind === 'continue_active') {
      expect(cont.brief?.toLowerCase()).toContain('kết luận')
    }
    expect(routeMyAiText('Tóm tắt file đang mở').kind).toBe('summarize_active')
  })

  it('creates Sheets/PDF with brief (B6)', () => {
    const sheet = routeMyAiText('Tạo bảng Excel theo dõi doanh số tháng này')
    expect(sheet).toMatchObject({ kind: 'create_file', app: 'sheets', blank: false })
    const pdf = routeMyAiText('Tạo file PDF: checklist onboarding nhân sự')
    expect(pdf).toMatchObject({ kind: 'create_file', app: 'pdf', blank: false })
  })
})
