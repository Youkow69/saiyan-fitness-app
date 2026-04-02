import React, { useMemo, useState } from 'react'
import type { FoodEntry } from '../../types'
import { SectionTitle } from '../ui/Shared'

interface Props {
  entries: FoodEntry[]
}

type Range = '7' | '30' | '90'

function groupByDate(entries: FoodEntry[]): Record<string, { calories: number; protein: number; carbs: number; fats: number }> {
  const map: Record<string, { calories: number; protein: number; carbs: number; fats: number }> = {}
  for (const e of entries) {
    if (!map[e.date]) map[e.date] = { calories: 0, protein: 0, carbs: 0, fats: 0 }
    map[e.date].calories += e.calories
    map[e.date].protein += e.protein
    map[e.date].carbs += e.carbs
    map[e.date].fats += e.fats
  }
  return map
}

function getDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const NutritionCharts: React.FC<Props> = ({ entries }) => {
  const [range, setRange] = useState<Range>('7')
  const days = Number(range)

  const data = useMemo(() => {
    const grouped = groupByDate(entries)
    const result = []
    for (let i = days - 1; i >= 0; i--) {
      const date = getDaysAgo(i)
      const day = grouped[date] || { calories: 0, protein: 0, carbs: 0, fats: 0 }
      result.push({ date, ...day })
    }
    return result
  }, [entries, days])

  const maxCal = Math.max(...data.map(d => d.calories), 1)
  const avgCal = Math.round(data.reduce((s, d) => s + d.calories, 0) / days)
  const avgProt = Math.round(data.reduce((s, d) => s + d.protein, 0) / days)

  return (
    <div style={{ padding: 0 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['7', '30', '90'] as Range[]).map(r => (
          <button
            key={r}
            type="button"
            className={'chip' + (range === r ? ' chip--active' : '')}
            onClick={() => setRange(r)}
          >
            {r}j
          </button>
        ))}
      </div>

      {/* Stats summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--bg-elev)', borderRadius: 10, padding: '8px 14px', flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Moy. calories</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>{avgCal} kcal</div>
        </div>
        <div style={{ background: 'var(--bg-elev)', borderRadius: 10, padding: '8px 14px', flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Moy. prot</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-orange)' }}>{avgProt}g</div>
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: days > 14 ? 1 : 3, height: 120 }}>
        {data.map((d, i) => {
          const h = Math.max(2, (d.calories / maxCal) * 100)
          const color = d.calories === 0 ? 'var(--bg-elev)' : d.calories > 2800 ? 'var(--accent-red)' : 'var(--accent-orange)'
          return (
            <div
              key={i}
              title={d.date + ': ' + d.calories + ' kcal, ' + Math.round(d.protein) + 'g prot'}
              style={{
                flex: 1,
                height: h + '%',
                background: color,
                borderRadius: '3px 3px 0 0',
                minWidth: 2,
                cursor: 'pointer',
                transition: 'height 0.3s',
              }}
            />
          )
        })}
      </div>
      {days <= 14 && (
        <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
          {data.map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.55rem', color: 'var(--muted)' }}>
              {d.date.slice(8)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Export function ───────────────────────────────────────────────────
export function exportNutritionData(entries: FoodEntry[], format: 'csv' | 'json') {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))

  let content: string
  let mime: string
  let ext: string

  if (format === 'json') {
    content = JSON.stringify(sorted, null, 2)
    mime = 'application/json'
    ext = 'json'
  } else {
    const header = 'Date,Nom,Categorie,Grammes,Calories,Proteines,Glucides,Lipides'
    const rows = sorted.map(e =>
      [e.date, '"' + e.name.replace(/"/g, '""') + '"', e.category, e.grams, e.calories, e.protein, e.carbs, e.fats].join(',')
    )
    content = header + '\n' + rows.join('\n')
    mime = 'text/csv'
    ext = 'csv'
  }

  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nutrition_saiyan_' + new Date().toISOString().slice(0, 10) + '.' + ext
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
