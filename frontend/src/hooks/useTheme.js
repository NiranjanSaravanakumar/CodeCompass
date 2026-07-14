/**
 * useTheme — CodeCompass theme management hook
 *
 * Reads preference from localStorage, falls back to system prefers-color-scheme,
 * writes the `data-theme` attribute to <html> so CSS variables auto-switch.
 */
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'cc-theme'

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch (_) {}
  return 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.setProperty('color-scheme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch (_) {}
  }, [theme])

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
