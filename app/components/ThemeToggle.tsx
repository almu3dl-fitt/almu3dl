'use client'

import { useEffect, useState } from 'react'
import { THEME_STORAGE_KEY, type SiteTheme } from '@/lib/theme'

function applyTheme(theme: SiteTheme) {
  document.documentElement.dataset.theme = theme
}

function getCurrentTheme(): SiteTheme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<SiteTheme | null>(null)

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setTheme(getCurrentTheme())
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  function handleToggle() {
    const currentTheme = theme ?? getCurrentTheme()
    const nextTheme: SiteTheme = currentTheme === 'light' ? 'dark' : 'light'

    applyTheme(nextTheme)
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    setTheme(nextTheme)
  }

  const nextModeLabel =
    theme === null ? 'تبديل المظهر' : theme === 'light' ? 'وضع الليل' : 'وضع النهار'
  const icon = theme === null ? '◐' : theme === 'light' ? '☾' : '☀'

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="storefront-action storefront-theme-toggle is-muted"
      aria-label={nextModeLabel}
      title={nextModeLabel}
    >
      <span className="storefront-theme-toggle-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{nextModeLabel}</span>
    </button>
  )
}
