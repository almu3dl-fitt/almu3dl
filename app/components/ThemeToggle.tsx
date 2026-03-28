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
  const iconPath =
    theme === 'light'
      ? 'M14.8 3.3a1 1 0 0 1 .9 1.5 8 8 0 1 0 3.5 10.7 1 1 0 0 1 1.7 1A10 10 0 1 1 13.4 3.4a1 1 0 0 1 1.4-.1Z'
      : 'M12 2.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3.5a.75.75 0 0 1 .75-.75Zm0 14a4.75 4.75 0 1 0 0-9.5 4.75 4.75 0 0 0 0 9.5Zm0 1.5a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5Zm7.25-7a.75.75 0 0 1 .75.75.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5ZM6.25 12a.75.75 0 0 1-.75.75H4a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Zm9.64-5.39a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 1 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06Zm-9.9 9.9a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 1 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06Zm11.96 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 1 1 1.06-1.06l1.06 1.06ZM8.11 7.67a.75.75 0 0 1-1.06 1.06L5.99 7.67a.75.75 0 0 1 1.06-1.06l1.06 1.06Z'

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="theme-pill storefront-theme-pill storefront-theme-toggle"
      aria-label={nextModeLabel}
      title={nextModeLabel}
    >
      <span className="storefront-theme-toggle-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="storefront-theme-toggle-svg">
          <path d={iconPath} fill="currentColor" />
        </svg>
      </span>
      <span className="storefront-theme-toggle-label">{nextModeLabel}</span>
    </button>
  )
}
