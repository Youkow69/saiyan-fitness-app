import React, { useCallback } from 'react'
import type { TabId } from '../../types'
import { IconHome, IconDumbbell, IconBowl, IconChart, IconCoach, IconUser } from '../ui/Icons'

interface BottomNavProps {
  tab: TabId
  onChange: (tab: TabId) => void
  restTimer: number
}

const TAB_IDS: TabId[] = ['home', 'train', 'nutrition', 'scouter', 'coach', 'profile']

const items: Array<{
  id: TabId
  icon: React.FC<{ size?: number }>
  label: string
  ariaLabel: string
}> = [
  { id: 'home', icon: IconHome, label: 'Accueil', ariaLabel: 'Accueil' },
  { id: 'train', icon: IconDumbbell, label: 'Training', ariaLabel: 'Entraînement' },
  { id: 'nutrition', icon: IconBowl, label: 'Nutrition', ariaLabel: 'Nutrition' },
  { id: 'scouter', icon: IconChart, label: 'Stats', ariaLabel: 'Statistiques' },
  { id: 'coach', label: 'Coach', icon: '\uD83E\uDD4A' },
    { id: 'profile', icon: IconUser, label: 'Profil', ariaLabel: 'Profil' },
]

export const BottomNav: React.FC<BottomNavProps> = React.memo(
  function BottomNav({ tab, onChange, restTimer }) {
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLElement>) => {
        const currentIndex = TAB_IDS.indexOf(tab)
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          const next = TAB_IDS[(currentIndex + 1) % TAB_IDS.length]
          onChange(next)
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          const prev = TAB_IDS[(currentIndex - 1 + TAB_IDS.length) % TAB_IDS.length]
          onChange(prev)
        }
      },
      [tab, onChange],
    )

    return (
      <nav
        className="bottom-nav"
        role="tablist"
        aria-label="Navigation principale"
        onKeyDown={handleKeyDown}
      >
        {items.map(({ id, icon: Icon, label, ariaLabel }) => (
          <button
            key={id}
            className={`nav-item ${tab === id ? 'nav-item--active' : ''}`}
            onClick={() => onChange(id)}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`tabpanel-${id}`}
            aria-label={ariaLabel}
            tabIndex={tab === id ? 0 : -1}
            style={{ position: 'relative' }}
          >
            <span className="nav-icon" aria-hidden="true">
              <Icon size={22} />
            </span>
            {id === 'train' && restTimer > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: '50%',
                  transform: 'translateX(14px)',
                  background: 'var(--accent-gold)',
                  color: '#000',
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  borderRadius: 8,
                  padding: '1px 5px',
                  minWidth: 20,
                  textAlign: 'center',
                  lineHeight: 1.4,
                  boxShadow: '0 2px 6px rgba(255,200,61,0.4)',
                  animation: 'pulse 1s ease-in-out infinite',
                }}
              >
                {restTimer}s
              </span>
            )}
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>
    )
  },
)
