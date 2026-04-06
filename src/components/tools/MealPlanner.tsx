import { useMemo, useState, useCallback } from 'react'
import { useAppState } from '../../context/AppContext'
import { getDailyNutrition, todayIso, makeId } from '../../lib'
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
  category: 'rapide' | 'équilibré' | 'copieux'
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
      name: 'Repas équilibré',
      description: 'Poulet et riz : la base de la nutrition sportive.',
      category: 'équilibré',
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

  // FEAT-F19: Extended meal combos
  const oats = findFood('oats')
  const eggs = findFood('eggs')
  const yogurt = findFood('yogurt')
  const turkey = findFood('turkey')
  const tofu = findFood('tofu')
  const cottage = findFood('cottage_cheese')
  const peanut_butter = findFood('peanut_butter')

  if (oats && remaining.calories > 150) {
    const g = 80
    const items = [scaledItem('oats', 'Flocons avoine', g, { calories: oats.calories, protein: oats.protein, carbs: oats.carbs, fats: oats.fats })]
    const totals = items.reduce((a, i) => ({ calories: a.calories + i.calories, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    suggestions.push({ name: 'Oats + Banana + Whey', items, totalCalories: totals.calories, totalProtein: totals.protein, totalCarbs: totals.carbs, totalFat: totals.fat, description: 'Suggestion auto', category: 'rapide' })
  }
  if (eggs && remaining.calories > 200) {
    const g = 150
    const items = [scaledItem('eggs', 'Oeufs', g, { calories: eggs.calories, protein: eggs.protein, carbs: eggs.carbs, fats: eggs.fats })]
    const totals = items.reduce((a, i) => ({ calories: a.calories + i.calories, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    suggestions.push({ name: 'Oeufs brouilles + Toast', items, totalCalories: totals.calories, totalProtein: totals.protein, totalCarbs: totals.carbs, totalFat: totals.fat, description: 'Suggestion auto', category: 'rapide' })
  }
  if (yogurt && remaining.calories > 100) {
    const g = 200
    const items = [scaledItem('yogurt', 'Yaourt grec', g, { calories: yogurt.calories, protein: yogurt.protein, carbs: yogurt.carbs, fats: yogurt.fats })]
    const totals = items.reduce((a, i) => ({ calories: a.calories + i.calories, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    suggestions.push({ name: 'Yaourt + Granola', items, totalCalories: totals.calories, totalProtein: totals.protein, totalCarbs: totals.carbs, totalFat: totals.fat, description: 'Suggestion auto', category: 'rapide' })
  }
  if (turkey && remaining.calories > 250) {
    const g = 180
    const items = [scaledItem('turkey', 'Dinde', g, { calories: turkey.calories, protein: turkey.protein, carbs: turkey.carbs, fats: turkey.fats })]
    const totals = items.reduce((a, i) => ({ calories: a.calories + i.calories, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    suggestions.push({ name: 'Dinde + Couscous', items, totalCalories: totals.calories, totalProtein: totals.protein, totalCarbs: totals.carbs, totalFat: totals.fat, description: 'Suggestion auto', category: 'rapide' })
  }
  if (tofu && remaining.calories > 200) {
    const g = 200
    const items = [scaledItem('tofu', 'Tofu', g, { calories: tofu.calories, protein: tofu.protein, carbs: tofu.carbs, fats: tofu.fats })]
    const totals = items.reduce((a, i) => ({ calories: a.calories + i.calories, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    suggestions.push({ name: 'Tofu + Nouilles', items, totalCalories: totals.calories, totalProtein: totals.protein, totalCarbs: totals.carbs, totalFat: totals.fat, description: 'Suggestion auto', category: 'rapide' })
  }
  if (cottage && remaining.calories > 100) {
    const g = 200
    const items = [scaledItem('cottage_cheese', 'Fromage blanc', g, { calories: cottage.calories, protein: cottage.protein, carbs: cottage.carbs, fats: cottage.fats })]
    const totals = items.reduce((a, i) => ({ calories: a.calories + i.calories, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    suggestions.push({ name: 'Cottage Cheese + Amandes', items, totalCalories: totals.calories, totalProtein: totals.protein, totalCarbs: totals.carbs, totalFat: totals.fat, description: 'Suggestion auto', category: 'rapide' })
  }
  if (peanut_butter && remaining.calories > 150) {
    const g = 30
    const items = [scaledItem('peanut_butter', 'Beurre cacahuete', g, { calories: peanut_butter.calories, protein: peanut_butter.protein, carbs: peanut_butter.carbs, fats: peanut_butter.fats })]
    const totals = items.reduce((a, i) => ({ calories: a.calories + i.calories, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    suggestions.push({ name: 'Pomme + Beurre de cacahuete', items, totalCalories: totals.calories + 80, totalProtein: totals.protein, totalCarbs: totals.carbs, totalFat: totals.fat, description: 'Suggestion auto', category: 'rapide' })
  }

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

export function MealPlanner() {
  const { state, dispatch } = useAppState()
  const [addedIndex, setAddedIndex] = useState<number | null>(null)

  const today = todayIso()
  const dailyNutrition = useMemo(() => getDailyNutrition(state.foodEntries, today), [state.foodEntries, today])

  const targets = state.targets ?? {
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
            id: makeId('meal'),
            date: today,
            name: item.food,
            category: 'snack' as const,
            grams: item.grams,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fats: item.fat,
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
