import { useMemo, useState, useCallback } from 'react'
import { useAppState } from '../../context/AppContext'
import { getDailyNutrition, todayIso } from '../../lib'
import { foods } from '../../data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MealItem {
  food: string
  foodId: string
  grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface MealSuggestion {
  name: string
  description: string
  items: MealItem[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  category: 'rapide' | 'equilibre' | 'copieux'
}

interface RemainingMacros {
  calories: number
  protein: number
  carbs: number
  fats: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findFood(id: string) {
  return foods.find((f) => f.id === id)
}

function scaledItem(
  id: string,
  name: string,
  grams: number,
  per100: { calories: number; protein: number; carbs: number; fats: number },
): MealItem {
  const factor = grams / 100
  return {
    food: name,
    foodId: id,
    grams,
    calories: Math.round(per100.calories * factor),
    protein: Math.round(per100.protein * factor),
    carbs: Math.round(per100.carbs * factor),
    fat: Math.round(per100.fats * factor),
  }
}

function sumItems(items: MealItem[]) {
  return items.reduce(
    (acc, i) => ({
      calories: acc.calories + i.calories,
      protein: acc.protein + i.protein,
      carbs: acc.carbs + i.carbs,
      fat: acc.fat + i.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

// ---------------------------------------------------------------------------
// Suggestion engine
// ---------------------------------------------------------------------------

function generateSuggestions(remaining: RemainingMacros): MealSuggestion[] {
  const suggestions: MealSuggestion[] = []

  // --- Quick option: whey + banana (or oats if carbs needed) ---------------
  if (remaining.protein > 15) {
    const whey = findFood('whey')
    const banana = findFood('banana')
    if (whey && banana) {
      const wheyGrams = Math.min(40, Math.max(25, Math.round((remaining.protein * 0.4) / (whey.protein / 100))))
      const bananaGrams = 120
      const items = [
        scaledItem('whey', whey.name, wheyGrams, whey),
        scaledItem('banana', banana.name, bananaGrams, banana),
      ]
      const totals = sumItems(items)
      suggestions.push({
        name: 'Shaker express',
        description: 'Rapide et riche en proteines. Ideal entre deux repas.',
        category: 'rapide',
        items,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
      })
    }
  }

  // --- Balanced option: chicken + rice ------------------------------------
  const chicken = findFood('chicken')
  const rice = findFood('rice')
  if (chicken && rice && remaining.calories > 200) {
    const chickenGrams = Math.min(
      250,
      Math.max(100, Math.round((remaining.protein * 0.5) / (chicken.protein / 100))),
    )
    const riceGrams = Math.min(
      220,
      Math.max(80, Math.round((remaining.carbs * 0.4) / (rice.carbs / 100) * 100)),
    )
    const items = [
      scaledItem('chicken', chicken.name, chickenGrams, chicken),
      scaledItem('rice', rice.name, riceGrams, rice),
    ]
    const totals = sumItems(items)
    suggestions.push({
      name: 'Repas equilibre',
      description: 'Poulet et riz : la base de la nutrition sportive.',
      category: 'equilibre',
      items,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
    })
  }

  // --- Big option if large deficit ----------------------------------------
  if (remaining.calories > 600) {
    const salmon = findFood('salmon')
    const potato = findFood('potato')
    if (salmon && potato) {
      const salmonGrams = 200
      const potatoGrams = 300
      const items = [
        scaledItem('salmon', salmon.name, salmonGrams, salmon),
        scaledItem('potato', potato.name, potatoGrams, potato),
      ]
      const totals = sumItems(items)
      suggestions.push({
        name: 'Repas copieux',
        description: 'Gros deficit calorique ? Ce repas comble le manque.',
        category: 'copieux',
        items,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
      })
    }
  }

  // --- Pre-workout carb boost ---------------------------------------------
  if (remaining.carbs > 60) {
    const oats = findFood('oats')
    const honey = findFood('honey')
    const bananaAlt = findFood('banana')
    if (oats && bananaAlt) {
      const oatsGrams = 80
      const bananaGrams = 100
      const items = [
        scaledItem('oats', oats.name, oatsGrams, oats),
        scaledItem('banana', bananaAlt.name, bananaGrams, bananaAlt),
      ]
      if (honey) {
        items.push(scaledItem('honey', honey.name, 15, honey))
      }
      const totals = sumItems(items)
      suggestions.push({
        name: 'Boost pre-entrainement',
        description: 'Glucides rapides avant la seance pour la performance.',
        category: 'rapide',
        items,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
      })
    }
  }

  // --- Fat-focused if underfed on fats ------------------------------------
  if (remaining.fats > 25) {
    const eggs = findFood('eggs')
    const avocado = findFood('avocado')
    const cheese = findFood('cheese')
    if (eggs && avocado) {
      const items = [
        scaledItem('eggs', eggs.name, 150, eggs), // ~3 eggs
        scaledItem('avocado', avocado.name, 100, avocado),
      ]
      if (cheese) {
        items.push(scaledItem('cheese', cheese.name, 30, cheese))
      }
      const totals = sumItems(items)
      suggestions.push({
        name: 'Repas lipides sains',
        description: 'Oeufs et avocat pour combler le deficit en graisses.',
        category: 'equilibre',
        items,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
      })
    }
  }

  return suggestions
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    padding: 16,
  } as React.CSSProperties,
  title: {
    fontSize: '1.1rem',
    fontWeight: 700,
    marginBottom: 12,
    color: 'var(--text)',
  } as React.CSSProperties,
  macroBar: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  macroPill: {
    padding: '6px 14px',
    borderRadius: 10,
    fontSize: '0.78rem',
    fontWeight: 600,
    background: 'var(--card)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
  } as React.CSSProperties,
  grid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
  } as React.CSSProperties,
  card: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: 16,
    position: 'relative' as const,
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text)',
  } as React.CSSProperties,
  badge: (cat: string) =>
    ({
      fontSize: '0.65rem',
      fontWeight: 700,
      padding: '2px 10px',
      borderRadius: 20,
      textTransform: 'uppercase' as const,
      background:
        cat === 'rapide'
          ? 'rgba(59,130,246,0.15)'
          : cat === 'copieux'
            ? 'rgba(239,68,68,0.15)'
            : 'rgba(34,197,94,0.15)',
      color:
        cat === 'rapide' ? '#3b82f6' : cat === 'copieux' ? '#ef4444' : '#22c55e',
    }) as React.CSSProperties,
  desc: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: 10,
  } as React.CSSProperties,
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.78rem',
    padding: '3px 0',
    color: 'var(--text)',
    borderBottom: '1px solid var(--border)',
  } as React.CSSProperties,
  totalsRow: {
    display: 'flex',
    gap: 12,
    marginTop: 10,
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
  addBtn: {
    marginTop: 12,
    width: '100%',
    padding: '10px 0',
    border: 'none',
    borderRadius: 10,
    background: 'var(--accent, #6366f1)',
    color: '#fff',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer',
  } as React.CSSProperties,
  addBtnDisabled: {
    opacity: 0.5,
    cursor: 'default',
  } as React.CSSProperties,
  empty: {
    textAlign: 'center' as const,
    padding: 40,
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
  } as React.CSSProperties,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MealPlanner() {
  const { state, dispatch } = useAppState()
  const [addedIndex, setAddedIndex] = useState<number | null>(null)

  const today = todayIso()
  const dailyNutrition = useMemo(() => getDailyNutrition(state, today), [state, today])

  const targets = state.settings?.targets ?? {
    calories: 2500,
    protein: 180,
    carbs: 280,
    fats: 80,
  }

  const remaining: RemainingMacros = useMemo(
    () => ({
      calories: Math.max(0, targets.calories - dailyNutrition.calories),
      protein: Math.max(0, targets.protein - dailyNutrition.protein),
      carbs: Math.max(0, targets.carbs - dailyNutrition.carbs),
      fats: Math.max(0, targets.fats - dailyNutrition.fats),
    }),
    [targets, dailyNutrition],
  )

  const suggestions = useMemo(() => generateSuggestions(remaining), [remaining])

  const handleAdd = useCallback(
    (suggestion: MealSuggestion, index: number) => {
      suggestion.items.forEach((item) => {
        dispatch({
          type: 'ADD_FOOD',
          payload: {
            date: today,
            foodId: item.foodId,
            grams: item.grams,
          },
        })
      })
      setAddedIndex(index)
      setTimeout(() => setAddedIndex(null), 2000)
    },
    [dispatch, today],
  )

  const allMet =
    remaining.calories < 50 && remaining.protein < 10 && remaining.carbs < 15 && remaining.fats < 5

  return (
    <div style={styles.container}>
      <div style={styles.title}>Suggestions de repas</div>

      {/* Remaining macros bar */}
      <div style={styles.macroBar}>
        <span style={styles.macroPill}>{remaining.calories} kcal restantes</span>
        <span style={styles.macroPill}>P {remaining.protein}g</span>
        <span style={styles.macroPill}>G {remaining.carbs}g</span>
        <span style={styles.macroPill}>L {remaining.fats}g</span>
      </div>

      {allMet ? (
        <div style={styles.empty}>
          Objectifs atteints pour aujourd'hui. Bien joue !
        </div>
      ) : suggestions.length === 0 ? (
        <div style={styles.empty}>
          Aucune suggestion disponible. Verifie ta base d'aliments.
        </div>
      ) : (
        <div style={styles.grid}>
          {suggestions.map((s, idx) => (
            <div key={idx} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>{s.name}</span>
                <span style={styles.badge(s.category)}>{s.category}</span>
              </div>
              <div style={styles.desc}>{s.description}</div>

              {s.items.map((item, i) => (
                <div key={i} style={styles.itemRow}>
                  <span>
                    {item.food} ({item.grams}g)
                  </span>
                  <span>
                    {item.calories} kcal · {item.protein}g P
                  </span>
                </div>
              ))}

              <div style={styles.totalsRow}>
                <span>{s.totalCalories} kcal</span>
                <span>P {s.totalProtein}g</span>
                <span>G {s.totalCarbs}g</span>
                <span>L {s.totalFat}g</span>
              </div>

              <button
                style={{
                  ...styles.addBtn,
                  ...(addedIndex === idx ? styles.addBtnDisabled : {}),
                }}
                disabled={addedIndex === idx}
                onClick={() => handleAdd(s, idx)}
              >
                {addedIndex === idx ? 'Ajoute !' : 'Ajouter au journal'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
