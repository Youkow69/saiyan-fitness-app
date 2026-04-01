/**
 * Micronutrients.tsx
 *
 * Rough micronutrient estimation based on food categories consumed today.
 * Not Cronometer-level accuracy -- this provides directional guidance so
 * users know whether they should eat more vegetables, dairy, etc.
 */

import { useMemo } from 'react'
import { useAppState } from '../../context/AppContext'
import { todayIso } from '../../lib'
import { foods } from '../../data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MicroEstimate {
  name: string
  icon: string
  estimated: number
  target: number
  unit: string
  status: 'low' | 'ok' | 'good'
  tip: string
}

type FoodTag = 'protein' | 'dairy' | 'fruit' | 'vegetable' | 'grain' | 'fat' | 'other'

// ---------------------------------------------------------------------------
// Tag inference -- derive a rough category from the food's macro profile
// ---------------------------------------------------------------------------

function inferTag(food: { protein: number; carbs: number; fats: number; id: string }): FoodTag {
  const id = food.id.toLowerCase()

  // Keyword-based heuristics
  if (['milk', 'yogurt', 'cheese', 'fromage', 'yaourt', 'lait', 'cottage'].some((k) => id.includes(k)))
    return 'dairy'
  if (['apple', 'banana', 'orange', 'berry', 'fruit', 'pomme', 'fraise', 'mangue', 'kiwi', 'pear', 'grape', 'melon', 'peach'].some((k) => id.includes(k)))
    return 'fruit'
  if (['salad', 'spinach', 'broccoli', 'carrot', 'tomato', 'pepper', 'zucchini', 'legume', 'vegetable', 'lettuce', 'kale', 'cabbage', 'onion', 'cucumber'].some((k) => id.includes(k)))
    return 'vegetable'
  if (['rice', 'oats', 'bread', 'pasta', 'cereal', 'wheat', 'quinoa', 'couscous', 'potato', 'patate'].some((k) => id.includes(k)))
    return 'grain'
  if (['oil', 'butter', 'avocado', 'nut', 'almond', 'peanut', 'walnut', 'huile', 'beurre', 'olive'].some((k) => id.includes(k)))
    return 'fat'
  if (['chicken', 'beef', 'salmon', 'tuna', 'egg', 'whey', 'turkey', 'pork', 'fish', 'shrimp', 'poulet', 'boeuf', 'oeuf', 'dinde', 'porc'].some((k) => id.includes(k)))
    return 'protein'

  // Fallback to macro ratios
  if (food.protein > 15) return 'protein'
  if (food.carbs > 40 && food.fats < 5) return 'grain'
  if (food.fats > 30) return 'fat'

  return 'other'
}

// ---------------------------------------------------------------------------
// Estimation logic
// ---------------------------------------------------------------------------

function estimateMicros(totalGrams: Record<FoodTag, number>): MicroEstimate[] {
  const g = totalGrams

  // Rough estimations per 100g of category
  const ironFromProtein = (g.protein / 100) * 2.5
  const b12FromProtein = (g.protein / 100) * 1.8
  const zincFromProtein = (g.protein / 100) * 3.0

  const vitCFromFruit = (g.fruit / 100) * 35
  const potassiumFromFruit = (g.fruit / 100) * 200

  const calciumFromDairy = (g.dairy / 100) * 120

  const fiberFromVeg = (g.vegetable / 100) * 3.5

  const magnesiumFromGrain = (g.grain / 100) * 30
  const fiberFromGrain = (g.grain / 100) * 2.0

  const totalFiber = fiberFromVeg + fiberFromGrain
  const totalIron = ironFromProtein
  const totalCalcium = calciumFromDairy
  const totalVitC = vitCFromFruit + (g.vegetable / 100) * 15

  const status = (val: number, target: number): 'low' | 'ok' | 'good' => {
    const ratio = val / target
    if (ratio >= 0.8) return 'good'
    if (ratio >= 0.5) return 'ok'
    return 'low'
  }

  return [
    {
      name: 'Fibres',
      icon: '\uD83C\uDF3E',
      estimated: Math.round(totalFiber),
      target: 30,
      unit: 'g',
      status: status(totalFiber, 30),
      tip: totalFiber < 15 ? 'Mange plus de legumes et cereales completes.' : 'Bon apport en fibres.',
    },
    {
      name: 'Fer',
      icon: '\uD83E\uDE78',
      estimated: Math.round(totalIron * 10) / 10,
      target: 14,
      unit: 'mg',
      status: status(totalIron, 14),
      tip: totalIron < 7 ? 'Ajoute de la viande rouge ou des lentilles.' : 'Bon apport en fer (proteines animales).',
    },
    {
      name: 'Calcium',
      icon: '\uD83E\uDDB4',
      estimated: Math.round(totalCalcium),
      target: 1000,
      unit: 'mg',
      status: status(totalCalcium, 1000),
      tip: totalCalcium < 500 ? 'Pense aux produits laitiers ou au lait vegetal enrichi.' : 'Bon apport en calcium.',
    },
    {
      name: 'Vitamine C',
      icon: '\uD83C\uDF4A',
      estimated: Math.round(totalVitC),
      target: 90,
      unit: 'mg',
      status: status(totalVitC, 90),
      tip: totalVitC < 45 ? 'Ajoute des fruits ou des poivrons.' : 'Bon apport en vitamine C.',
    },
    {
      name: 'Vitamine B12',
      icon: '\uD83E\uDDEC',
      estimated: Math.round(b12FromProtein * 10) / 10,
      target: 2.4,
      unit: 'ug',
      status: status(b12FromProtein, 2.4),
      tip: b12FromProtein < 1.2 ? 'Les proteines animales sont la principale source de B12.' : 'Bon apport en B12.',
    },
    {
      name: 'Zinc',
      icon: '\u26A1',
      estimated: Math.round(zincFromProtein * 10) / 10,
      target: 11,
      unit: 'mg',
      status: status(zincFromProtein, 11),
      tip: zincFromProtein < 5 ? 'La viande et les fruits de mer sont riches en zinc.' : 'Apport en zinc correct.',
    },
    {
      name: 'Potassium',
      icon: '\uD83C\uDF4C',
      estimated: Math.round(potassiumFromFruit + (g.vegetable / 100) * 250),
      target: 3500,
      unit: 'mg',
      status: status(potassiumFromFruit + (g.vegetable / 100) * 250, 3500),
      tip: potassiumFromFruit < 500 ? 'Les bananes et epinards sont riches en potassium.' : 'Bon apport en potassium.',
    },
    {
      name: 'Magnesium',
      icon: '\uD83E\uDDC2',
      estimated: Math.round(magnesiumFromGrain + (g.fat / 100) * 50),
      target: 400,
      unit: 'mg',
      status: status(magnesiumFromGrain + (g.fat / 100) * 50, 400),
      tip: magnesiumFromGrain < 100 ? 'Noix, graines et cereales completes pour le magnesium.' : 'Apport en magnesium correct.',
    },
  ]
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const statusColor: Record<string, string> = {
  low: '#ef4444',
  ok: '#f59e0b',
  good: '#22c55e',
}

const s = {
  container: {
    padding: 16,
  } as React.CSSProperties,
  title: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: 6,
  } as React.CSSProperties,
  subtitle: {
    fontSize: '0.72rem',
    color: 'var(--text-secondary)',
    marginBottom: 16,
  } as React.CSSProperties,
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
  } as React.CSSProperties,
  icon: {
    fontSize: '1rem',
    width: 24,
    textAlign: 'center' as const,
  } as React.CSSProperties,
  name: {
    flex: 1,
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text)',
  } as React.CSSProperties,
  bar: {
    width: 80,
    height: 6,
    borderRadius: 3,
    background: 'var(--border)',
    overflow: 'hidden' as const,
  } as React.CSSProperties,
  barFill: (pct: number, color: string) =>
    ({
      width: `${Math.min(100, pct)}%`,
      height: '100%',
      borderRadius: 3,
      background: color,
      transition: 'width 0.3s',
    }) as React.CSSProperties,
  value: {
    fontSize: '0.7rem',
    fontWeight: 600,
    width: 70,
    textAlign: 'right' as const,
  } as React.CSSProperties,
  tip: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    marginTop: 4,
    paddingLeft: 34,
    paddingBottom: 4,
  } as React.CSSProperties,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MicronutrientEstimate() {
  const { state } = useAppState()
  const today = todayIso()

  const estimates = useMemo(() => {
    const todayEntries = (state.foodEntries ?? []).filter((e: any) => e.date === today)

    const totalGrams: Record<FoodTag, number> = {
      protein: 0, dairy: 0, fruit: 0, vegetable: 0, grain: 0, fat: 0, other: 0,
    }

    todayEntries.forEach((entry: any) => {
      const food = foods.find((f) => f.name === entry.name)
      if (!food) return
      const tag = inferTag(food)
      totalGrams[tag] += entry.grams ?? 100
    })

    return estimateMicros(totalGrams)
  }, [state.foodEntries, today])

  return (
    <div style={s.container}>
      <div style={s.title}>Micronutriments (estimation)</div>
      <div style={s.subtitle}>
        Estimation basee sur les categories d'aliments consommes aujourd'hui.
      </div>

      {estimates.map((micro) => {
        const pct = (micro.estimated / micro.target) * 100
        const color = statusColor[micro.status]
        return (
          <div key={micro.name}>
            <div style={s.row}>
              <span style={s.icon}>{micro.icon}</span>
              <span style={s.name}>{micro.name}</span>
              <div style={s.bar}>
                <div style={s.barFill(pct, color)} />
              </div>
              <span style={{ ...s.value, color }}>
                {micro.estimated} / {micro.target} {micro.unit}
              </span>
            </div>
            {micro.status === 'low' && <div style={s.tip}>{micro.tip}</div>}
          </div>
        )
      })}
    </div>
  )
}

export default MicronutrientEstimate
