import { useState, type FormEvent, type ReactElement } from 'react'
import { useI18n } from './locale'

interface Props {
  onActivated: () => void
}

/** Full-screen gate: trial install cannot be used until a code is redeemed. */
export function TrialActivationGate({ onActivated }: Props): ReactElement {
  const { lang } = useI18n()
  const vi = lang === 'vi'
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (ev?: FormEvent) => {
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

  return (
    <div className="trial-activate" role="dialog" aria-labelledby="trial-activate-title">
      <div className="trial-activate-card">
        <p className="trial-activate-kicker">UniWork Office · Trial</p>
        <h1 id="trial-activate-title">
          {vi ? 'Nhập mã kích hoạt' : 'Enter activation code'}
        </h1>
        <p className="trial-activate-sub">
          {vi
            ? 'Bản dùng thử đã có AI sẵn. Nhập mã anh gửi kèm để mở app trên máy này.'
            : 'This trial build includes AI. Enter the code you received to unlock this install.'}
        </p>
        <form className="trial-activate-form" onSubmit={(e) => void submit(e)}>
          <label className="trial-activate-label" htmlFor="trial-activate-code">
            {vi ? 'Mã kích hoạt' : 'Activation code'}
          </label>
          <input
            id="trial-activate-code"
            className="trial-activate-input"
            type="text"
            autoComplete="one-time-code"
            spellCheck={false}
            autoFocus
            placeholder={vi ? 'VD: UW-TRIAL-XXXX' : 'e.g. UW-TRIAL-XXXX'}
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
                ? 'Kích hoạt'
                : 'Activate'}
          </button>
        </form>
        <p className="trial-activate-foot">
          {vi
            ? 'Mỗi mã chỉ dùng được trên một máy. Không chia sẻ công khai.'
            : 'Each code works on one device only. Do not share publicly.'}
        </p>
      </div>
    </div>
  )
}
