import { useState, useMemo, useCallback } from 'react'
import { useAppState } from '../../context/AppContext'
import { getDailyNutrition, todayIso, daysAgoIso, makeId } from '../../lib'
import type { FoodEntry } from '../../types'

// ─────────────────────────────────────────────
// LocalStorage keys & helpers
// ─────────────────────────────────────────────
const RECENT_KEY = 'sf_recent_foods'
const FAVORITES_KEY = 'sf_favorite_foods'

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}

function addRecent(foodId: string) {
  const recent = getRecent().filter(id => id !== foodId)
  recent.unshift(foodId)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 20)))
}

function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
  } catch {
    return []
  }
}

function toggleFavoriteStorage(foodId: string): string[] {
  const favs = getFavorites()
  const updated = favs.includes(foodId)
    ? favs.filter(id => id !== foodId)
    : [...favs, foodId]
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))
  return updated
}

// ─────────────────────────────────────────────
// Adhérence calculation
// ─────────────────────────────────────────────
interface MacroValues {
  calories: number
  protein: number
  carbs: number
  fats: number
}

function calculateAdhérence(nutrition: MacroValues, targets: MacroValues): number {
  if (!targets || targets.calories <= 0) return 0

  const calAccuracy = 100 - Math.min(
    100,
    (Math.abs(nutrition.calories - targets.calories) / targets.calories) * 100
  )
  const protHit =
    nutrition.protein >= targets.protein * 0.85
      ? 100
      : (nutrition.protein / targets.protein) * 100
  const carbsInRange =
    Math.abs(nutrition.carbs - targets.carbs) < targets.carbs * 0.2 ? 100 : 50
  const fatsInRange =
    Math.abs(nutrition.fats - targets.fats) < targets.fats * 0.2 ? 100 : 50

  return Math.round(
    calAccuracy * 0.4 + protHit * 0.3 + carbsInRange * 0.15 + fatsInRange * 0.15
  )
}

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

function scoreBg(score: number): string {
  if (score >= 80) return 'rgba(34,197,94,0.12)'
  if (score >= 60) return 'rgba(245,158,11,0.12)'
  if (score >= 40) return 'rgba(249,115,22,0.12)'
  return 'rgba(239,68,68,0.12)'
}

// ─────────────────────────────────────────────
// Component 1: Recent & Favorites
// ─────────────────────────────────────────────
interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
}

interface RecentFoodsProps {
  foods: FoodItem[]
  onSelect: (food: FoodItem) => void
}

export function RecentFoods({ foods, onSelect }: RecentFoodsProps) {
  const [favs, setFavs] = useState<string[]>(getFavorites)
  const [recentIds, setRecentIds] = useState<string[]>(getRecent)

  const handleToggleFav = useCallback((e: React.MouseEvent, foodId: string) => {
    e.stopPropagation()
    const updated = toggleFavoriteStorage(foodId)
    setFavs(updated)
  }, [])

  const handleSelect = useCallback(
    (food: FoodItem) => {
      addRecent(food.id)
      setRecentIds(getRecent())
      onSelect(food)
    },
    [onSelect]
  )

  const favFoods = useMemo(
    () => favs.map(id => foods.find(f => f.id === id)).filter(Boolean) as FoodItem[],
    [favs, foods]
  )

  const recentFoods = useMemo(
    () =>
      recentIds
        .map(id => foods.find(f => f.id === id))
        .filter(Boolean)
        .filter(f => !favs.includes(f!.id)) as FoodItem[],
    [recentIds, foods, favs]
  )

  if (favFoods.length === 0 && recentFoods.length === 0) {
    return (
      <div style={{ padding: 12, color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>
        Aucun aliment favori ou recent. Ajoutéz-en pour les retrouver ici.
      </div>
    )
  }

  const renderFoodRow = (food: FoodItem, isFav: boolean) => (
    <div
      key={food.id}
      onClick={() => handleSelect(food)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        cursor: 'pointer',
        marginBottom: 4,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {food.name}
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
          {food.calories} kcal | P {food.protein}g | G {food.carbs}g | L {food.fats}g
        </div>
      </div>
      <button
        onClick={e => handleToggleFav(e, food.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          padding: '4px 6px',
          color: isFav ? '#f59e0b' : '#6b7280',
          transition: 'color 0.15s',
        }}
        title={isFav ? 'Retirer des favoris' : 'Ajoutér aux favoris'}
      >
        {isFav ? '\u2605' : '\u2606'}
      </button>
    </div>
  )

  return (
    <div style={{ marginBottom: 16 }}>
      {favFoods.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, paddingLeft: 4 }}>
            Favoris
          </div>
          {favFoods.map(f => renderFoodRow(f, true))}
        </div>
      )}
      {recentFoods.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, paddingLeft: 4 }}>
            Récents
          </div>
          {recentFoods.slice(0, 10).map(f => renderFoodRow(f, false))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Component 2: Quick Add Macros
// ─────────────────────────────────────────────
interface QuickAddMacrosProps {
  onAdd: (entry: FoodEntry) => void
}

export function QuickAddMacros({ onAdd }: QuickAddMacrosProps) {
  const [cal, setCal] = useState('')
  const [prot, setProt] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [label, setLabel] = useState('')
  const [expanded, setExpanded] = useState(false)

  const handleAdd = useCallback(() => {
    const cVal = parseFloat(cal) || 0
    const pVal = parseFloat(prot) || 0
    const crbVal = parseFloat(carbs) || 0
    const fVal = parseFloat(fat) || 0

    if (cVal <= 0 && pVal <= 0 && crbVal <= 0 && fVal <= 0) return

    const computedCal = cVal > 0 ? cVal : pVal * 4 + crbVal * 4 + fVal * 9

    const entry: FoodEntry = {
      id: makeId(),
      date: todayIso(),
      name: label.trim() || 'Ajout rapide',
      category: 'snack',
      grams: 0,
      calories: Math.round(computedCal),
      protein: Math.round(pVal),
      carbs: Math.round(crbVal),
      fats: Math.round(fVal),
    }

    onAdd(entry)
    setCal('')
    setProt('')
    setCarbs('')
    setFat('')
    setLabel('')
    setExpanded(false)
  }, [cal, prot, carbs, fat, label, onAdd])

  const inputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 60,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: '#e5e7eb',
    fontSize: 14,
    outline: 'none',
    textAlign: 'center',
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          width: '100%',
          padding: '10px 16px',
          borderRadius: 10,
          border: '1px dashed rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.03)',
          color: '#9ca3af',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          transition: 'all 0.15s',
          marginBottom: 12,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'
          e.currentTarget.style.color = '#f59e0b'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
          e.currentTarget.style.color = '#9ca3af'
        }}
      >
        + Ajout rapide de macros
      </button>
    )
  }

  return (
    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', marginBottom: 10 }}>
        Ajout rapide
      </div>

      <input
        type="text"
        placeholder="Nom (optionnel)"
        value={label}
        onChange={e => setLabel(e.target.value)}
        style={{ ...inputStyle, width: '100%', marginBottom: 8, textAlign: 'left' }}
      />

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Calories</label>
          <input type="number" placeholder="kcal" value={cal} onChange={e => setCal(e.target.value)} style={inputStyle} min="0" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Prot.</label>
          <input type="number" placeholder="g" value={prot} onChange={e => setProt(e.target.value)} style={inputStyle} min="0" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Gluc.</label>
          <input type="number" placeholder="g" value={carbs} onChange={e => setCarbs(e.target.value)} style={inputStyle} min="0" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Lip.</label>
          <input type="number" placeholder="g" value={fat} onChange={e => setFat(e.target.value)} style={inputStyle} min="0" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleAdd}
          style={{
            flex: 1,
            padding: '9px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#f59e0b',
            color: '#000',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
        >
          Ajoutér
        </button>
        <button
          onClick={() => setExpanded(false)}
          style={{
            padding: '9px 14px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent',
            color: '#9ca3af',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Annuler
        </button>
      </div>

      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>
        Si les calories sont vides, elles seront calculees depuis les macros.
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Component 3: Adhérence Score
// ─────────────────────────────────────────────
export function AdhérenceScore() {
  const { state } = useAppState()

  const scores = useMemo(() => {
    const targets = state.targets
    if (!targets) return { today: 0, week: 0, details: [] as { date: string; score: number }[] }

    const todayNut = getDailyNutrition(state.foodEntries, todayIso())
    const todayScore = calculateAdhérence(todayNut, targets)

    let weekTotal = 0
    let daysWithData = 0
    const details: { date: string; score: number }[] = []

    for (let i = 0; i < 7; i++) {
      const date = daysAgoIso(i)
      const dayNut = getDailyNutrition(state.foodEntries, date)
      if (dayNut.calories > 0) {
        const score = calculateAdhérence(dayNut, targets)
        weekTotal += score
        daysWithData++
        details.push({ date, score })
      }
    }

    return {
      today: todayScore,
      week: daysWithData > 0 ? Math.round(weekTotal / daysWithData) : 0,
      details: details.reverse(),
    }
  }, [state.foodEntries, state.targets])

  const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  return (
    <div style={{ padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', marginBottom: 14 }}>
        Score d'adhérence
      </div>

      {/* Today's score circle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: scoreBg(scores.today),
            border: `2px solid ${scoreColor(scores.today)}`,
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: scoreColor(scores.today), lineHeight: 1 }}>
            {scores.today}
          </div>
          <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>
            /100
          </div>
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>
            Aujourd'hui
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
            Moyenne hebdo : <span style={{ color: scoreColor(scores.week), fontWeight: 600 }}>{scores.week}</span>/100
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
            {scores.today >= 80
              ? 'Excellent ! Tu es dans les clous.'
              : scores.today >= 60
              ? 'Pas mal, mais tu peux faire mieux.'
              : scores.today >= 40
              ? 'Effort a faire sur tes macros.'
              : scores.today > 0
              ? 'Loin des objectifs, recadre ton alimentation.'
              : 'Pas encore de donnees pour aujourd\'hui.'}
          </div>
        </div>
      </div>

      {/* Weekly bar chart */}
      {scores.details.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>
            7 derniers jours
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
            {scores.details.map((d) => {
              const dayDate = new Date(d.date)
              const dayName = dayLabels[dayDate.getDay()]
              const barH = Math.max(4, (d.score / 100) * 50)
              return (
                <div
                  key={d.date}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  title={`${dayName} : ${d.score}/100`}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 28,
                      height: barH,
                      borderRadius: 4,
                      background: scoreColor(d.score),
                      opacity: 0.85,
                      transition: 'height 0.3s ease',
                    }}
                  />
                  <div style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>
                    {dayName}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {scores.details.length === 0 && (
        <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', padding: 8 }}>
          Aucune donnee nutritionnelle cette semaine.
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Component 4: Grocery List
// ─────────────────────────────────────────────
interface GroceryItem {
  name: string
  totalGrams: number
  count: number
}

export function GroceryList() {
  const { state } = useAppState()
  const [copied, setCopied] = useState(false)

  const groceries = useMemo(() => {
    const weekEntries: FoodEntry[] = []

    for (let i = 0; i < 7; i++) {
      const date = daysAgoIso(i)
      const dayEntries = state.foodEntries.filter(e => e.date === date)
      weekEntries.push(...dayEntries)
    }

    const map = new Map<string, GroceryItem>()
    for (const entry of weekEntries) {
      const key = entry.name.toLowerCase().trim()
      if (!key || key === 'ajout rapide') continue
      const existing = map.get(key)
      if (existing) {
        existing.totalGrams += entry.grams
        existing.count++
      } else {
        map.set(key, {
          name: entry.name,
          totalGrams: entry.grams,
          count: 1,
        })
      }
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [state.foodEntries])

  const handleCopy = useCallback(() => {
    const text = groceries
      .map(g => {
        const qty = g.totalGrams > 0 ? ` - ${Math.round(g.totalGrams)}g` : ''
        return `- ${g.name}${qty} (x${g.count})`
      })
      .join('\n')

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [groceries])

  if (groceries.length === 0) {
    return (
      <div style={{ padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', marginBottom: 8 }}>
          Liste de courses
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', padding: 12 }}>
          Aucun aliment enregistre cette semaine. Ajouté des repas pour générer ta liste.
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>
          Liste de courses (7 jours)
        </div>
        <button
          onClick={handleCopy}
          style={{
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.12)',
            background: copied ? 'rgba(34,197,94,0.15)' : 'transparent',
            color: copied ? '#22c55e' : '#9ca3af',
            fontSize: 11,
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 0.2s',
          }}
        >
          {copied ? 'Copie !' : 'Copier'}
        </button>
      </div>

      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {groceries.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              borderRadius: 6,
              background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
            }}
          >
            <div style={{ fontSize: 13, color: '#d1d5db', fontWeight: 400 }}>
              {item.name}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
              {item.totalGrams > 0 && (
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  {Math.round(item.totalGrams)}g
                </span>
              )}
              <span style={{ fontSize: 11, color: '#6b7280', minWidth: 24, textAlign: 'right' }}>
                x{item.count}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 10, textAlign: 'center' }}>
        {groceries.length} aliment{groceries.length > 1 ? 's' : ''} differents cette semaine
      </div>
    </div>
  )
}
