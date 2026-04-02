// ── ThemeSwitcher.tsx ──────────────────────────────────────────────────────────
// Enhanced dark/light theme with proper DBZ colors for each mode.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

const THEME_KEY = 'saiyan-theme'

function getTheme(): Theme {
  try {
    return (localStorage.getItem(THEME_KEY) as Theme) || 'dark'
  } catch { return 'dark' }
}

const DARK_VARS = {
  '--bg': '#0d0d0d',
  '--bg-card': '#1a1a1a',
  '--bg-hover': '#222',
  '--text': '#f0f0f0',
  '--text-secondary': '#888',
  '--border': '#333',
  '--stroke': '#444',
  '--accent': '#ff8c00',
  '--accent-gold': '#ffd700',
  '--accent-red': '#ff4500',
  '--accent-green': '#22c55e',
  '--accent-blue': '#3b82f6',
  '--accent-purple': '#9b59b6',
  '--success': '#22c55e',
  '--danger': '#ef4444',
  '--shadow': '0 2px 8px rgba(0,0,0,0.4)',
}

const LIGHT_VARS = {
  '--bg': '#f8f6f2',
  '--bg-card': '#ffffff',
  '--bg-hover': '#f0ebe4',
  '--text': '#1a1a1a',
  '--text-secondary': '#666',
  '--border': '#e0d8cc',
  '--stroke': '#d4c9b8',
  '--accent': '#e07800',
  '--accent-gold': '#cc9900',
  '--accent-red': '#dc3500',
  '--accent-green': '#16a34a',
  '--accent-blue': '#2563eb',
  '--accent-purple': '#7c3aed',
  '--success': '#16a34a',
  '--danger': '#dc2626',
  '--shadow': '0 2px 8px rgba(0,0,0,0.08)',
}

function applyTheme(theme: Theme) {
  const vars = theme === 'dark' ? DARK_VARS : LIGHT_VARS
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  root.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_KEY, theme)
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(getTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  return (
    <button type="button" onClick={toggle} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '6px 12px', cursor: 'pointer',
      color: 'var(--text)', fontSize: '0.78rem', fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {theme === 'dark' ? '\u2600\ufe0f' : '\U0001f319'} {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
    </button>
  )
}

export function useThemeInit() {
  useEffect(() => {
    applyTheme(getTheme())
  }, [])
}
