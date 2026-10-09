import { describe, expect, it } from 'vitest'
import {
  exportClientsCsv,
  exportEventsCsv,
  exportFriendsCsv,
  exportGrowthCsv,
  exportHealthRunsCsv,
  exportTasksCsv,
  exportTravelCsv,
} from '../src/renderer/src/workbench-list-excel'

describe('workbench-list-excel CSV builders', () => {
  it('exports tasks with status and priority', () => {
    const csv = exportTasksCsv([
      {
        id: '1',
        title: 'Chấm bài',
        status: 'todo',
        priority: 'high',
        done: false,
        tags: ['lớp 10'],
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
    ])
    expect(csv).toContain('Chấm bài')
    expect(csv).toContain('todo')
    expect(csv).toContain('high')
    expect(csv).toContain('lớp 10')
  })

  it('exports travel checklist progress', () => {
    const csv = exportTravelCsv([
      {
        id: 't1',
        title: 'Đà Lạt',
        destination: 'Lâm Đồng',
        status: 'planning',
        checklist: [
          { id: 'c1', text: 'Vé', done: true },
          { id: 'c2', text: 'Khách sạn', done: false },
        ],
      },
    ])
    expect(csv).toContain('Đà Lạt')
    expect(csv).toContain('1/2')
  })

  it('exports friends / events / clients / growth / health runs', () => {
    expect(exportFriendsCsv([{ id: '1', name: 'An' }])).toContain('An')
    expect(
      exportEventsCsv([{ id: '1', date: '2026-10-01', title: 'Họp' }]),
    ).toContain('Họp')
    expect(exportClientsCsv([{ id: '1', name: 'KH A' }])).toContain('KH A')
    expect(
      exportGrowthCsv([{ id: '1', title: 'B1', progress: 40, done: false }]),
    ).toContain('40')
    expect(
      exportHealthRunsCsv([
        { id: '1', date: '2026-10-01', distanceKm: 5, durationMin: 30 },
      ]),
    ).toContain('5')
  })
})
