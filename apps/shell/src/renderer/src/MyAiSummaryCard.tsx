import { useState } from 'react'
import type { ReactElement } from 'react'
import {
  summaryToHtml,
  summaryToPlainText,
  type MyAiSummaryArtifact,
  type MyAiSummaryChart,
} from './my-ai-summary'

const CHART_COLORS = [
  'var(--accent)',
  'color-mix(in srgb, var(--accent) 65%, var(--text))',
  'color-mix(in srgb, var(--success) 80%, var(--accent))',
  'color-mix(in srgb, var(--accent) 40%, var(--text-secondary))',
  'color-mix(in srgb, var(--danger) 55%, var(--accent))',
  'var(--text-secondary)',
] as const

function SummaryBarChart({ chart }: { chart: MyAiSummaryChart }): ReactElement {
  const max = Math.max(1, ...chart.items.map((i) => i.value))
  return (
    <div className="myai-sum-chart" aria-label={chart.title}>
      <h4 className="myai-sum-chart-title">{chart.title}</h4>
      <ul className="myai-sum-bars">
        {chart.items.map((it, i) => (
          <li key={`${it.label}-${i}`}>
            <div className="myai-sum-bar-meta">
              <span>{it.label}</span>
              <em>{it.value}</em>
            </div>
            <div className="myai-sum-bar-track">
              <div
                className="myai-sum-bar-fill"
                style={{
                  width: `${Math.min(100, (it.value / max) * 100)}%`,
                  background: CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SummaryDonutChart({ chart }: { chart: MyAiSummaryChart }): ReactElement {
  const total = chart.items.reduce((s, i) => s + i.value, 0) || 1
  const r = 36
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="myai-sum-chart myai-sum-donut-wrap" aria-label={chart.title}>
      <h4 className="myai-sum-chart-title">{chart.title}</h4>
      <div className="myai-sum-donut-row">
        <svg viewBox="0 0 100 100" className="myai-sum-donut" role="img">
          <g transform="rotate(-90 50 50)">
            {chart.items.map((it, i) => {
              const len = (it.value / total) * c
              const dash = `${len} ${c - len}`
              const el = (
                <circle
                  key={`${it.label}-${i}`}
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth="14"
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              )
              offset += len
              return el
            })}
          </g>
        </svg>
        <ul className="myai-sum-donut-legend">
          {chart.items.map((it, i) => (
            <li key={`${it.label}-${i}`}>
              <i style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span>{it.label}</span>
              <em>{Math.round((it.value / total) * 100)}%</em>
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
}: {
  summary: MyAiSummaryArtifact
  vi: boolean
  onExport: () => void | Promise<void>
  onShare: () => void | Promise<void>
}): ReactElement {
  const label = (a: string, b: string) => (vi ? a : b)
  const [busy, setBusy] = useState<'export' | 'share' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const run = async (kind: 'export' | 'share', fn: () => void | Promise<void>) => {
    setBusy(kind)
    setNotice(null)
    try {
      await fn()
      setNotice(
        kind === 'export'
          ? label('Đã xuất / mở bản tóm tắt.', 'Exported / opened the summary.')
          : label('Đã sao chép để chia sẻ.', 'Copied for sharing.'),
      )
      window.setTimeout(() => setNotice(null), 2500)
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
          <SummaryDonutChart chart={summary.chart} />
        ) : (
          <SummaryBarChart chart={summary.chart} />
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
          className="myai-sum-action"
          disabled={busy !== null}
          onClick={() => void run('export', onExport)}
        >
          {busy === 'export'
            ? label('Đang xuất…', 'Exporting…')
            : label('Xuất file', 'Export')}
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
