import React from 'react'
import { createRoot } from 'react-dom/client'
import { htmlLang } from '@genoffice/i18n'
import { AppFrame } from './AppFrame'
import { LocaleProvider } from './locale'
import '@genoffice/ui/tokens.css'
import '@genoffice/ui/screentip.css'
import '@genoffice/ui/dropdown.css'
import './home.css'
import './tabbar.css'
import { installScreenTips } from '@genoffice/ui'

installScreenTips()

// macOS shell window is created with vibrancy; a transparent body lets the
// editor views' translucent regions (e.g. slides thumbnail pane) show it
const IS_MAC = navigator.platform.toLowerCase().includes('mac')
if (IS_MAC) document.body.classList.add('vib')
// non-mac: the tab strip doubles as the title bar (caption buttons overlay it)
document.body.classList.add(IS_MAC ? 'mac' : 'overlay-title-bar')

// resolve the persisted language, first-run flag, and theme before first paint
// so the UI never flashes (home showing briefly before the onboarding overlay).
// Always paint even if preload/IPC is briefly unavailable — otherwise #root stays blank.
function mountApp(
  lang: Awaited<ReturnType<typeof window.aiOffice.getLanguage>>,
  onboardingSeen: boolean,
  theme: Awaited<ReturnType<typeof window.aiOffice.getTheme>>,
): void {
  document.documentElement.lang = htmlLang(lang)
  if (theme !== 'system') {
    document.documentElement.setAttribute('data-theme', theme)
  }
  try {
    window.aiOffice?.onThemeChanged?.((next) => {
      if (next === 'system') document.documentElement.removeAttribute('data-theme')
      else document.documentElement.setAttribute('data-theme', next)
    })
  } catch {
    /* ignore */
  }
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <LocaleProvider initial={lang}>
        <AppFrame initialOnboardingSeen={onboardingSeen} />
      </LocaleProvider>
    </React.StrictMode>,
  )
}

const boot =
  typeof window.aiOffice?.getLanguage === 'function'
    ? Promise.all([
        window.aiOffice.getLanguage().catch(() => 'en' as const),
        window.aiOffice.onboardingSeen().catch(() => true),
        window.aiOffice.getTheme().catch(() => 'system' as const),
      ])
    : Promise.resolve(['en' as const, true, 'system' as const] as const)

void boot
  .then(([lang, onboardingSeen, theme]) => {
    mountApp(lang, onboardingSeen, theme)
  })
  .catch(() => {
    mountApp('en', true, 'system')
  })
