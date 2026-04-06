// ── EnhancedBarcodeResult.tsx ──────────────────────────────────────────────
// Displays food data from barcode scan with preview and edit capability.
// Shows recent scans and allows correcting nutritional data.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

interface NutritionData {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  barcode: string
  image?: string
}

interface Props {
  data: NutritionData
  onConfirm: (data: NutritionData, grams: number) => void
  onCancel: () => void
}

const RECENT_SCANS_KEY = 'sf_recent_scans'

function getRecentScans(): NutritionData[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SCANS_KEY) || '[]')
  } catch { return [] }
}

function saveRecentScan(data: NutritionData) {
  const scans = getRecentScans().filter(s => s.barcode !== data.barcode)
  scans.unshift(data)
  localStorage.setItem(RECENT_SCANS_KEY, JSON.stringify(scans.slice(0, 20)))
}

export function EnhancedBarcodeResult({ data, onConfirm, onCancel }: Props) {
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<NutritionData>({ ...data })
  const [grams, setGrams] = useState('100')

  useEffect(() => {
    saveRecentScan(data)
  }, [data.barcode])

  const g = parseFloat(grams) || 100
  const ratio = g / 100
  const display = editMode ? editData : data

  return (
    <div style={{
      background: 'var(--bg-card, #1a1a1a)', borderRadius: 16,
      border: '1px solid var(--border, #333)', padding: 16, marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          {editMode ? (
            <input
              value={editData.name}
              onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
              style={{
                width: '100%', padding: '6px 8px', borderRadius: 8,
                border: '1px solid var(--accent)', background: 'var(--bg)',
                color: 'var(--text)', fontSize: '0.9rem', fontWeight: 700,
              }}
            />
          ) : (
            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{display.name}</h3>
          )}
          <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'var(--text-secondary, #888)' }}>
            Code: {display.barcode}
          </p>
        </div>
        <button type="button" onClick={() => setEditMode(!editMode)} style={{
          background: editMode ? 'rgba(255,140,0,0.15)' : 'transparent',
          border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px',
          color: editMode ? 'var(--accent)' : 'var(--text-secondary)',
          fontSize: '0.75rem', cursor: 'pointer',
        }}>
          {editMode ? 'OK' : 'Corriger'}
        </button>
      </div>

      {/* Nutrition preview per 100g */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
        marginBottom: 12,
      }}>
        {[
          { label: 'Cal', key: 'calories' as const, color: '#ffd700', unit: '' },
          { label: 'Prot', key: 'protein' as const, color: '#22c55e', unit: 'g' },
          { label: 'Gluc', key: 'carbs' as const, color: '#3b82f6', unit: 'g' },
          { label: 'Lip', key: 'fat' as const, color: '#f97316', unit: 'g' },
        ].map(({ label, key, color, unit }) => (
          <div key={key} style={{
            background: `${color}11`, borderRadius: 10, padding: '8px 6px',
            textAlign: 'center', border: `1px solid ${color}22`,
          }}>
            <div style={{ fontSize: 'max(0.75rem, 0.6rem)', color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</div>
            {editMode ? (
              <input
                type="number"
                value={editData[key]}
                onChange={e => setEditData(d => ({ ...d, [key]: parseFloat(e.target.value) || 0 }))}
                style={{
                  width: '100%', padding: 2, borderRadius: 4, border: `1px solid ${color}44`,
                  background: 'var(--bg)', color, fontSize: '0.85rem', fontWeight: 700,
                  textAlign: 'center',
                }}
              />
            ) : (
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color }}>{display[key]}{unit}</div>
            )}
          </div>
        ))}
      </div>

      {/* Grams input */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
          Quantit\u00e9 (g)
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="number"
            value={grams}
            onChange={e => setGrams(e.target.value)}
            style={{
              flex: 1, padding: '8px 10px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--text)', fontSize: '0.9rem', fontWeight: 700,
            }}
          />
          {[50, 100, 150, 200].map(v => (
            <button key={v} type="button" onClick={() => setGrams(String(v))} style={{
              padding: '6px 10px', borderRadius: 8,
              border: `1px solid ${grams === String(v) ? 'var(--accent)' : 'var(--border)'}`,
              background: grams === String(v) ? 'rgba(255,140,0,0.1)' : 'transparent',
              color: grams === String(v) ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
            }}>
              {v}g
            </button>
          ))}
        </div>
      </div>

      {/* Calculated values */}
      <div style={{
        background: 'rgba(255,215,0,0.06)', borderRadius: 10, padding: '8px 12px',
        marginBottom: 12, fontSize: '0.8rem',
      }}>
        <strong>{Math.round(display.calories * ratio)} cal</strong>
        {' | '}{(display.protein * ratio).toFixed(1)}g prot
        {' | '}{(display.carbs * ratio).toFixed(1)}g gluc
        {' | '}{(display.fat * ratio).toFixed(1)}g lip
        <span style={{ color: 'var(--text-secondary)', marginLeft: 4 }}>pour {g}g</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel} style={{
          flex: 1, padding: 10, borderRadius: 10, border: '1px solid var(--border)',
          background: 'transparent', color: 'var(--text-secondary)',
          fontSize: '0.82rem', cursor: 'pointer',
        }}>
          Annuler
        </button>
        <button type="button" onClick={() => onConfirm(editMode ? editData : data, g)} style={{
          flex: 2, padding: 10, borderRadius: 10, border: 'none',
          background: 'var(--accent)', color: '#000',
          fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
        }}>
          Ajouter {Math.round(display.calories * ratio)} cal
        </button>
      </div>
    </div>
  )
}

export function RecentScans({ onSelect }: { onSelect: (data: NutritionData) => void }) {
  const [scans, setScans] = useState<NutritionData[]>([])

  useEffect(() => {
    setScans(getRecentScans())
  }, [])

  if (scans.length === 0) return null

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
        Scans r\u00e9cents
      </div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {scans.slice(0, 8).map((s, i) => (
          <button key={i} type="button" onClick={() => onSelect(s)} style={{
            flexShrink: 0, padding: '6px 10px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--bg-card)',
            color: 'var(--text)', fontSize: '0.72rem', cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            {s.name.slice(0, 20)}{s.name.length > 20 ? '...' : ''}
            <span style={{ color: 'var(--text-secondary)', marginLeft: 4 }}>{s.calories}cal</span>
          </button>
        ))}
      </div>
    </div>
  )
}
