import { useState } from 'react'
import type { ReactElement } from 'react'
import {
  summaryToHtml,
  summaryToPlainText,
  summaryToSlideBrief,
  type MyAiSummaryArtifact,
  type MyAiSummaryChart,
} from './my-ai-summary'
import { DESK_CHART } from './workbench-desk'

const SERIES = DESK_CHART.series

function fmtValue(n: number): string {
  if (!Number.isFinite(n)) return '0'
  if (Number.isInteger(n)) return String(n)
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

function seriesColor(i: number): string {
  return SERIES[i % SERIES.length]!
}

function truncateLabel(s: string, max = 12): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, Math.max(1, max - 1))}…`
}

/** Column chart with grid, value labels, and rounded bars. */
function SummaryBarChart({
  chart,
  vi,
}: {
  chart: MyAiSummaryChart
  vi: boolean
}): ReactElement {
  const items = chart.items.slice(0, 8)
  const max = Math.max(1, ...items.map((i) => i.value))
  const w = 360
  const h = 200
  const padL = 12
  const padR = 12
  const padT = 28
  const padB = 40
  const plotW = w - padL - padR
  const plotH = h - padT - padB
  const gap = items.length <= 3 ? 18 : items.length <= 5 ? 12 : 8
  const slot = plotW / Math.max(1, items.length)
  const barW = Math.max(18, Math.min(48, slot - gap))
  const gridN = 4

  return (
    <div className="myai-sum-chart" aria-label={chart.title}>
      <div className="myai-sum-chart-head">
        <h4 className="myai-sum-chart-title">{chart.title}</h4>
        <span className="myai-sum-chart-badge">{vi ? 'Cột' : 'Bar'}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="myai-sum-svg" role="img">
        <defs>
          {items.map((_, i) => (
            <linearGradient
              key={`g-${i}`}
              id={`myai-bar-${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={seriesColor(i)} stopOpacity="1" />
              <stop offset="100%" stopColor={seriesColor(i)} stopOpacity="0.72" />
            </linearGradient>
          ))}
        </defs>
        {/* plot backdrop */}
        <rect
          x={padL}
          y={padT}
          width={plotW}
          height={plotH}
          rx={10}
          fill="color-mix(in srgb, var(--hover) 55%, transparent)"
        />
        {Array.from({ length: gridN + 1 }, (_, g) => {
          const y = padT + (plotH * g) / gridN
          return (
            <line
              key={`grid-${g}`}
              x1={padL + 4}
              x2={w - padR - 4}
              y1={y}
              y2={y}
              className="myai-sum-gridline"
            />
          )
        })}
        {items.map((it, i) => {
          const bh = Math.max(4, (it.value / max) * (plotH - 8))
          const x = padL + i * slot + (slot - barW) / 2
          const y = padT + plotH - bh
          const label = truncateLabel(it.label, items.length > 5 ? 8 : 11)
          return (
            <g key={`${it.label}-${i}`}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={bh}
                rx={Math.min(8, barW / 2)}
                fill={`url(#myai-bar-${i})`}
              />
              <text
                x={x + barW / 2}
                y={y - 8}
                textAnchor="middle"
                className="myai-sum-val"
              >
                {fmtValue(it.value)}
              </text>
              <title>{`${it.label}: ${fmtValue(it.value)}`}</title>
              <text
                x={x + barW / 2}
                y={h - 14}
                textAnchor="middle"
                className="myai-sum-axis"
              >
                {label}
              </text>
            </g>
          )
        })}
      </svg>
      <ul className="myai-sum-legend">
        {items.map((it, i) => (
          <li key={`leg-${it.label}-${i}`}>
            <i style={{ background: seriesColor(i) }} />
            <span title={it.label}>{it.label}</span>
            <em>{fmtValue(it.value)}</em>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Donut with track, center total, slice gaps, and rich legend. */
function SummaryDonutChart({
  chart,
  vi,
}: {
  chart: MyAiSummaryChart
  vi: boolean
}): ReactElement {
  const items = chart.items.slice(0, 8)
  const total = items.reduce((s, i) => s + i.value, 0) || 1
  const cx = 70
  const cy = 70
  const r = 48
  const stroke = 18
  const circ = 2 * Math.PI * r
  const gap = Math.min(4, circ / (items.length * 8))
  let offset = 0

  return (
    <div className="myai-sum-chart myai-sum-donut-wrap" aria-label={chart.title}>
      <div className="myai-sum-chart-head">
        <h4 className="myai-sum-chart-title">{chart.title}</h4>
        <span className="myai-sum-chart-badge">{vi ? 'Tròn' : 'Donut'}</span>
      </div>
      <div className="myai-sum-donut-row">
        <svg viewBox="0 0 140 140" className="myai-sum-donut" role="img">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={DESK_CHART.track}
            strokeWidth={stroke}
          />
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {items.map((it, i) => {
              const raw = (it.value / total) * circ
              const len = Math.max(0, raw - gap)
              const dash = `${len} ${circ - len}`
              const el = (
                <circle
                  key={`${it.label}-${i}`}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={seriesColor(i)}
                  strokeWidth={stroke}
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                >
                  <title>{`${it.label}: ${fmtValue(it.value)} (${Math.round((it.value / total) * 100)}%)`}</title>
                </circle>
              )
              offset += raw
              return el
            })}
          </g>
          <circle cx={cx} cy={cy} r={r - stroke / 2 - 2} className="myai-sum-donut-hole" />
          <text x={cx} y={cy - 6} textAnchor="middle" className="myai-sum-donut-label">
            {vi ? 'Tổng' : 'Total'}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" className="myai-sum-donut-value">
            {fmtValue(total)}
          </text>
        </svg>
        <ul className="myai-sum-donut-legend">
          {items.map((it, i) => (
            <li key={`${it.label}-${i}`}>
              <i style={{ background: seriesColor(i) }} />
              <span title={it.label}>{it.label}</span>
              <em>
                {fmtValue(it.value)}
                <small>{Math.round((it.value / total) * 100)}%</small>
              </em>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function MyAiSummaryCard({
  summary,
  vi,
  onExport,
  onShare,
  onSlides,
}: {
  summary: MyAiSummaryArtifact
  vi: boolean
  onExport: () => void | Promise<void>
  onShare: () => void | Promise<void>
  onSlides: () => void | Promise<void>
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [busy, setBusy] = useState<'export' | 'share' | 'slides' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const run = async (
    kind: 'export' | 'share' | 'slides',
    fn: () => void | Promise<void>,
  ) => {
    setBusy(kind)
    setNotice(null)
    try {
      await fn()
      setNotice(
        kind === 'export'
          ? label('Đã mở bản tóm tắt trong Docs.', 'Opened the summary in Docs.')
          : kind === 'slides'
            ? label(
                'Đã mở Slides — xem dàn bài rồi tạo slide.',
                'Opened Slides — review the outline, then generate.',
              )
            : label('Đã sao chép để chia sẻ.', 'Copied for sharing.'),
      )
      window.setTimeout(() => setNotice(null), 2800)
    } catch {
      setNotice(label('Không thực hiện được.', 'Couldn’t complete that.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="myai-sum">
      {summary.kicker ? <p className="myai-sum-kicker">{summary.kicker}</p> : null}
      <h3 className="myai-sum-title">{summary.title}</h3>

      <div className="myai-sum-grid">
        {summary.sections.map((sec) => (
          <section key={sec.heading} className="myai-sum-section">
            <h4>{sec.heading}</h4>
            <ul>
              {sec.bullets.map((b, i) => (
                <li key={`${sec.heading}-${i}`}>{b}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {summary.chart && summary.chart.items.length >= 2 ? (
        summary.chart.type === 'donut' ? (
          <SummaryDonutChart chart={summary.chart} vi={vi} />
        ) : (
          <SummaryBarChart chart={summary.chart} vi={vi} />
        )
      ) : null}

      {summary.nextActions.length > 0 ? (
        <section className="myai-sum-next">
          <h4>{label('Việc có thể làm tiếp', 'Next actions')}</h4>
          <ol>
            {summary.nextActions.map((a, i) => (
              <li key={`n-${i}`}>{a}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {summary.footnote ? <p className="myai-sum-foot">{summary.footnote}</p> : null}

      <div className="myai-sum-actions">
        <button
          type="button"
          className="myai-sum-action myai-sum-action-primary"
          disabled={busy !== null}
          title={label(
            'Mở AI Slides và tạo dàn bài từ báo cáo/tóm tắt này',
            'Open AI Slides and build an outline from this report/summary',
          )}
          onClick={() => void run('slides', onSlides)}
        >
          {busy === 'slides'
            ? label('Đang mở Slides…', 'Opening Slides…')
            : label('Tạo slide', 'Create slides')}
        </button>
        <button
          type="button"
          className="myai-sum-action"
          disabled={busy !== null}
          title={label('Mở AI Docs với nội dung tóm tắt', 'Open AI Docs with this summary')}
          onClick={() => void run('export', onExport)}
        >
          {busy === 'export'
            ? label('Đang xuất…', 'Exporting…')
            : label('Xuất Docs', 'Export Docs')}
        </button>
        <button
          type="button"
          className="myai-sum-action"
          disabled={busy !== null}
          onClick={() => void run('share', onShare)}
        >
          {busy === 'share'
            ? label('Đang chép…', 'Copying…')
            : label('Chia sẻ', 'Share')}
        </button>
        {notice ? <span className="myai-sum-notice">{notice}</span> : null}
      </div>
    </div>
  )
}

export async function exportSummaryArtifact(
  summary: MyAiSummaryArtifact,
  vi: boolean,
): Promise<void> {
  const title = summary.title.slice(0, 80) || (vi ? 'Tóm tắt' : 'Summary')
  const html = summaryToHtml(summary, vi)
  if (window.aiOffice?.newDoc) {
    await window.aiOffice.newDoc({
      aiContent: { title, html },
    })
    return
  }
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/[^\w.-]+/g, '_').slice(0, 40) || 'summary'}.html`
  a.click()
  URL.revokeObjectURL(url)
}

/** Open AI Slides with an auto-run preset built from the summary/report. */
export async function exportSummaryAsSlides(
  summary: MyAiSummaryArtifact,
  vi: boolean,
): Promise<void> {
  const brief = summaryToSlideBrief(summary, vi)
  const displayText = (
    vi ? `Tạo slide: ${summary.title}` : `Create slides: ${summary.title}`
  ).slice(0, 120)
  if (!window.aiOffice?.newSlide) {
    throw new Error(vi ? 'AI Slides không khả dụng.' : 'AI Slides unavailable.')
  }
  await window.aiOffice.newSlide({
    aiPreset: {
      text: brief,
      autoRun: true,
      displayText,
    },
  })
}

export async function shareSummaryArtifact(
  summary: MyAiSummaryArtifact,
  vi: boolean,
): Promise<void> {
  const plain = summaryToPlainText(summary)
  const title = summary.title
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: plain })
      return
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return
      /* fall through to clipboard */
    }
  }
  await navigator.clipboard.writeText(plain)
  void vi
}
