import { useEffect, useState, type FormEvent, type ReactElement } from 'react'
import type { TrialActivationStatus } from '../../shared/home-api'
import { useI18n } from './locale'

interface Props {
  onActivated: () => void
}

/**
 * Full-screen gate for the single installer:
 * — Enter a paid license / activation code, or
 * — Start the free 7-day Office + AI trial (10k Credit).
 * Expired trial locks the entire app until a license is entered.
 */
export function TrialActivationGate({ onActivated }: Props): ReactElement {
  const { lang } = useI18n()
  const vi = lang === 'vi'
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<TrialActivationStatus | null>(null)

  useEffect(() => {
    let alive = true
    void window.aiOffice.getTrialActivationStatus?.().then((s) => {
      if (alive) setStatus(s ?? null)
    })
    return () => {
      alive = false
    }
  }, [])

  const expired = Boolean(status?.expired)

  const submitLicense = async (ev?: FormEvent) => {
    ev?.preventDefault()
    const trimmed = code.trim()
    if (!trimmed || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await window.aiOffice.redeemTrialActivationCode?.(trimmed)
      if (res?.ok) {
        onActivated()
        return
      }
      setError(
        res?.error ||
          (vi ? 'Mã không hợp lệ.' : 'Invalid activation code.'),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const startTrial = async () => {
    if (busy || expired) return
    setBusy(true)
    setError(null)
    try {
      const res = await window.aiOffice.startDeviceTrial?.()
      if (res?.ok) {
        onActivated()
        return
      }
      setError(
        res?.error ||
          (vi
            ? 'Không bắt đầu được dùng thử. Kiểm tra mạng và thử lại.'
            : 'Could not start the trial. Check your connection and try again.'),
      )
      if (res && !res.ok) {
        const again = await window.aiOffice.getTrialActivationStatus?.()
        if (again) setStatus(again)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="trial-activate" role="dialog" aria-labelledby="trial-activate-title">
      <div className="trial-activate-card">
        <p className="trial-activate-kicker">UniWork Office</p>
        <h1 id="trial-activate-title">
          {expired
            ? vi
              ? 'Hết hạn dùng thử'
              : 'Trial ended'
            : vi
              ? 'Kích hoạt UniWork'
              : 'Activate UniWork'}
        </h1>
        <p className="trial-activate-sub">
          {expired
            ? vi
              ? 'Bản dùng thử 7 ngày đã kết thúc — Office và AI đều bị khóa. Nhập license để tiếp tục (Credit còn dư không mở lại app).'
              : 'Your 7-day trial has ended — Office and AI are locked. Enter a license to continue (remaining Credit does not unlock the app).'
            : vi
              ? 'Một bản cài đặt. Nhập license đã mua, hoặc bắt đầu dùng thử miễn phí 7 ngày (10.000 Credit AI). Hết hạn sẽ khóa cả hệ thống.'
              : 'One installer. Enter a purchased license, or start a free 7-day trial (10,000 AI Credit). When it ends, the whole app locks.'}
        </p>

        <form className="trial-activate-form" onSubmit={(e) => void submitLicense(e)}>
          <label className="trial-activate-label" htmlFor="trial-activate-code">
            {vi ? 'Mã license / kích hoạt' : 'License / activation code'}
          </label>
          <input
            id="trial-activate-code"
            className="trial-activate-input"
            type="text"
            autoComplete="one-time-code"
            spellCheck={false}
            autoFocus
            placeholder={vi ? 'VD: UW-XXXX-XXXX' : 'e.g. UW-XXXX-XXXX'}
            value={code}
            disabled={busy}
            onChange={(e) => setCode(e.target.value)}
          />
          {error ? (
            <p className="trial-activate-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn primary trial-activate-btn" disabled={busy || !code.trim()}>
            {busy
              ? vi
                ? 'Đang kiểm tra…'
                : 'Checking…'
              : vi
                ? 'Kích hoạt license'
                : 'Activate license'}
          </button>
        </form>

        {!expired ? (
          <>
            <p className="trial-activate-or" aria-hidden>
              {vi ? '— hoặc —' : '— or —'}
            </p>
            <button
              type="button"
              className="btn trial-activate-btn trial-activate-btn-secondary"
              disabled={busy}
              onClick={() => void startTrial()}
            >
              {busy
                ? vi
                  ? 'Đang bắt đầu…'
                  : 'Starting…'
                : vi
                  ? 'Dùng thử 7 ngày miễn phí'
                  : 'Start free 7-day trial'}
            </button>
          </>
        ) : null}

        <p className="trial-activate-foot">
          {expired
            ? vi
              ? 'Mỗi máy chỉ được một lần dùng thử. Liên hệ UniWork để mua license.'
              : 'Each device gets one trial. Contact UniWork to purchase a license.'
            : vi
              ? 'Dùng thử: 1 máy · 7 ngày · 10.000 Credit. License: theo số ghế đã mua.'
              : 'Trial: 1 device · 7 days · 10,000 Credit. License: per purchased seats.'}
        </p>
      </div>
    </div>
  )
}
