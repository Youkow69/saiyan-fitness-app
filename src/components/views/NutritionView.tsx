import React, { useState, useMemo } from 'react'
import type { FoodEntry } from '../../types'
import { useAppState } from '../../context/AppContext'
import { foods } from '../../data'
import { getDailyNutrition, getRecommendedRecipes, makeId, todayIso } from '../../lib'
import { showToast } from '../ui/Toast'
import { AdaptiveTDEECard } from '../workout/AdaptiveTDEECard'
import { SectionTitle } from '../ui/Shared'
import SearchSelect from '../ui/SearchSelect'
import MacroBar from '../ui/MacroBar'
import { MealPlanner } from '../tools/MealPlanner'
import { MicronutrientEstimate } from '../tools/Micronutrients'
import { RecentFoods, QuickAddMacros, AdherenceScore, GroceryList } from '../tools/NutritionPremium'

const MEAL_CATEGORIES: Array<{ value: FoodEntry['category']; label: string }> = [
  { value: 'breakfast', label: 'Petit-d\u00E9jeuner' },
  { value: 'lunch', label: 'D\u00E9jeuner' },
  { value: 'dinner', label: 'D\u00EEner' },
  { value: 'snack', label: 'Collation' },
  { value: 'pre_workout', label: 'Pr\u00E9-s\u00E9ance' },
  { value: 'post_workout', label: 'Post-s\u00E9ance' },
]

const accordionStyle: React.CSSProperties = {
  padding: '10px 14px', cursor: 'pointer', fontWeight: 600,
  fontSize: '0.85rem', color: 'var(--text)', display: 'flex',
  alignItems: 'center', gap: 8, listStyle: 'none',
  background: 'var(--bg-card)', borderRadius: 12,
  border: '1px solid var(--border)', marginBottom: 6,
}

export const NutritionView: React.FC = React.memo(
  function NutritionView() {
    const { state, dispatch } = useAppState()
    const [selectedFood, setSelectedFood] = useState(foods[0])
    const [grams, setGrams] = useState('100')
    const [category, setCategory] = useState<FoodEntry['category']>('lunch')
    const [barcodeInput, setBarcodeInput] = useState('')
    const [lookingUp, setLookingUp] = useState(false)
    const totals = useMemo(() => getDailyNutrition(state.foodEntries), [state.foodEntries])
    const suggestions = useMemo(
      () => getRecommendedRecipes(state),
      [state.foodEntries, state.targets, state.profile],
    )
    const targets = state.targets ?? { calories: 2500, protein: 150, carbs: 300, fats: 70 }

    const addFood = (entry: FoodEntry) => {
      dispatch({ type: 'ADD_FOOD', payload: entry })
      showToast(`${entry.name} ajout\u00E9 (+${entry.calories} kcal)`, 'success')
    }

    const lookupBarcode = async (code: string) => {
      if (!code.trim()) return
      setLookingUp(true)
      try {
        const resp = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code.trim()}.json`)
        const data = await resp.json()
        if (data.status === 1 && data.product) {
          const p = data.product
          const n = p.nutriments || {}
          const name = p.product_name_fr || p.product_name || 'Produit inconnu'
          const cal = Math.round(n['energy-kcal_100g'] || 0)
          const prot = Math.round((n.proteins_100g || 0) * 10) / 10
          const carb = Math.round((n.carbohydrates_100g || 0) * 10) / 10
          const fat = Math.round((n.fat_100g || 0) * 10) / 10
          addFood({
            id: makeId('scan'), date: todayIso(), name, category,
            grams: 100, calories: cal, protein: prot, carbs: carb, fats: fat,
          })
          setBarcodeInput('')
        } else {
          showToast('Produit non trouv\u00E9', 'error')
        }
      } catch {
        showToast('Erreur de connexion', 'error')
      }
      setLookingUp(false)
    }

    return (
      <div className="page">
        <AdaptiveTDEECard state={state} />

        {/* Macro bars — always visible */}
        <section className="hevy-card stack-md" style={{ padding: '10px 14px' }}>
          <SectionTitle icon="" label="Nutrition aujourd'hui" />
          <MacroBar label="Calories" current={totals.calories} target={targets.calories} unit="kcal" color="calories" />
          <MacroBar label="Prot\u00E9ines" current={totals.protein} target={targets.protein} unit="g" color="protein" />
          <MacroBar label="Glucides" current={totals.carbs} target={targets.carbs} unit="g" color="carbs" />
          <MacroBar label="Lipides" current={totals.fats} target={targets.fats} unit="g" color="fat" />
        </section>

        {/* Add food form — always visible */}
        <section className="hevy-card stack-md">
          <SectionTitle icon="" label="Ajouter un aliment" />
          <div className="field-grid compact-grid">
            <label>
              <span>Aliment</span>
              <SearchSelect
                options={foods.map((f) => ({ value: f.id, label: f.name }))}
                value={selectedFood.id}
                onChange={(val: string) => setSelectedFood(foods.find((f) => f.id === val) ?? foods[0])}
                placeholder="Rechercher un aliment..."
              />
            </label>
            <label>
              <span>Grammes</span>
              <input value={grams} onChange={(e) => setGrams(e.target.value)} />
            </label>
          </div>
          <div className="chip-row" style={{ marginTop: 8 }}>
            {MEAL_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={`chip ${category === cat.value ? 'chip--active' : ''}`}
                onClick={() => setCategory(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <button
            className="secondary-btn"
            type="button"
            style={{ marginTop: 8 }}
            onClick={() => {
              const g = Number(grams || 0)
              if (isNaN(g) || g <= 0) return
              const ratio = g / selectedFood.servingGrams
              addFood({
                id: makeId('food'), date: todayIso(), name: selectedFood.name, category,
                grams: g, calories: Math.round(selectedFood.calories * ratio),
                protein: Number((selectedFood.protein * ratio).toFixed(1)),
                carbs: Number((selectedFood.carbs * ratio).toFixed(1)),
                fats: Number((selectedFood.fats * ratio).toFixed(1)),
              })
            }}
          >
            Ajouter
          </button>
          <QuickAddMacros onAdd={(entry) => addFood({ ...entry, id: makeId('quick'), date: todayIso(), category })} />
        </section>

        {/* Accordion sections */}
        <details>
          <summary style={accordionStyle}>{'\uD83D\uDCF7'} Scanner / Code-barres</summary>
          <section className="hevy-card stack-md" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <div className="inline-form">
              <input
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Code-barres (ex: 3017620422003)"
                onKeyDown={(e) => e.key === 'Enter' && lookupBarcode(barcodeInput)}
              />
              <button className="secondary-btn" onClick={() => lookupBarcode(barcodeInput)} type="button" disabled={lookingUp}>
                {lookingUp ? '...' : 'Chercher'}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--muted)' }}>
              Utilise OpenFoodFacts pour trouver les valeurs nutritionnelles automatiquement.
            </p>
          </section>
        </details>

        <details>
          <summary style={accordionStyle}>{'\u2B50'} Récents et favoris</summary>
          <div style={{ marginBottom: 6 }}>
            <RecentFoods
              foods={state.foodEntries}
              onSelect={(food: any) => addFood({
                ...food, id: makeId('recent'), date: todayIso(),
                category: food.category || 'snack', grams: food.grams || 100,
              })}
            />
          </div>
        </details>

        <details>
          <summary style={accordionStyle}>{'\uD83C\uDF73'} Recettes suggérées</summary>
          <section className="hevy-card stack-md" style={{ marginTop: 0 }}>
            <div className="card-list">
              {suggestions.map((recipe) => (
                <button
                  className="mini-card mini-card--button"
                  key={recipe.id}
                  type="button"
                  onClick={() => addFood({
                    id: makeId('recipe'), date: todayIso(), name: recipe.name,
                    category: recipe.category, grams: 1, calories: recipe.calories,
                    protein: recipe.protein, carbs: recipe.carbs, fats: recipe.fats,
                  })}
                >
                  <strong>{recipe.name}</strong>
                  <span>{recipe.prepMinutes} min — {recipe.calories} kcal — {recipe.protein}P</span>
                </button>
              ))}
            </div>
          </section>
        </details>

        <details>
          <summary style={accordionStyle}>{'\uD83E\uDD61'} Repas sauvegardés</summary>
          <section className="hevy-card stack-md" style={{ marginTop: 0 }}>
            {state.savedMeals.length === 0 ? (
              <div className="empty-state"><p>Aucun repas sauvegardé.</p></div>
            ) : (
              <div className="card-list">
                {state.savedMeals.map((meal) => (
                  <button
                    className="mini-card mini-card--button"
                    key={meal.id}
                    type="button"
                    onClick={() => addFood({
                      id: makeId('meal'), date: todayIso(), name: meal.name,
                      category: meal.category, grams: 1, calories: meal.calories,
                      protein: meal.protein, carbs: meal.carbs, fats: meal.fats,
                    })}
                  >
                    <strong>{meal.name}</strong>
                    <span>{meal.calories} kcal — {meal.protein}P</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </details>

        <details>
          <summary style={accordionStyle}>{'\uD83D\uDCCA'} Score adhérence</summary>
          <div style={{ marginBottom: 6 }}><AdherenceScore /></div>
        </details>

        <details>
          <summary style={accordionStyle}>{'\uD83E\uDD6C'} Micronutriments</summary>
          <div style={{ marginBottom: 6 }}><MicronutrientEstimate /></div>
        </details>

        <details>
          <summary style={accordionStyle}>{'\uD83D\uDED2'} Liste de courses</summary>
          <div style={{ marginBottom: 6 }}><GroceryList /></div>
        </details>

        <details>
          <summary style={accordionStyle}>{'\uD83C\uDF7D\uFE0F'} Planificateur de repas</summary>
          <div style={{ marginBottom: 6 }}><MealPlanner /></div>
        </details>
      </div>
    )
  },
)
