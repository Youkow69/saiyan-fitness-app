import React, { useState, useMemo } from 'react'
import type { Food, FoodEntry } from '../../types'
import { useAppState } from '../../context/AppContext'
import { foods } from '../../data'
import { getDailyNutrition, getRecommendedRecipes, makeId, todayIso } from '../../lib'
import { showToast } from '../ui/Toast'
import { AdaptiveTDEECard } from '../workout/AdaptiveTDEECard'
import { SectionTitle } from '../ui/Shared'
import SearchSelect from '../ui/SearchSelect'
import MacroBar from '../ui/MacroBar'
import { MealPlanner } from '../tools/MealPlanner'
import { BarcodeScanner } from '../tools/BarcodeScanner'
import { MicronutrientEstimate } from '../tools/Micronutrients'
import { RecentFoods, QuickAddMacros, AdherenceScore, GroceryList } from '../tools/NutritionPremium'
import { NutritionCharts, exportNutritionData } from '../tools/NutritionCharts'

const MEAL_CATEGORIES: Array<{ value: FoodEntry['category']; label: string }> = [
  { value: 'breakfast', label: 'Petit-déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'dinner', label: 'Dîner' },
  { value: 'snack', label: 'Collation' },
  { value: 'pre_workout', label: 'Pré-séance' },
  { value: 'post_workout', label: 'Post-séance' },
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
    const [showScanner, setShowScanner] = useState(false)
    const [showCustomForm, setShowCustomForm] = useState(false)
    const [customName, setCustomName] = useState('')
    const [customCal, setCustomCal] = useState('')
    const [customProt, setCustomProt] = useState('')
    const [customCarbs, setCustomCarbs] = useState('')
    const [customFats, setCustomFats] = useState('')
    const totals = useMemo(() => getDailyNutrition(state.foodEntries), [state.foodEntries])
    const suggestions = useMemo(
      () => getRecommendedRecipes(state),
      [state.foodEntries, state.targets, state.profile],
    )
    const allFoodsList = useMemo(() => {
      const custom: Food[] = (state.customFoods || []).map(f => ({ ...f, isCustom: true as const }))
      return [...custom, ...foods]
    }, [state.customFoods])
    const targets = state.targets ?? { calories: 2500, protein: 150, carbs: 300, fats: 70 }

    const addFood = (entry: FoodEntry) => {
      dispatch({ type: 'ADD_FOOD', payload: entry })
      showToast(`${entry.name} ajouté (+${entry.calories} kcal)`, 'success')
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
          showToast('Produit non trouvé', 'error')
        }
      } catch {
        showToast('Erreur de connexion', 'error')
      }
      setLookingUp(false)
    }

    return (
      <div className="page">
        {/* Macro bars - always visible */}
        <section className="hevy-card stack-md" style={{ padding: '10px 14px' }}>
          <SectionTitle icon="📊" label="Nutrition aujourd'hui" />
          <MacroBar label="Calories" current={totals.calories} target={targets.calories} unit="kcal" color="calories" />
          <MacroBar label="Protéines" current={totals.protein} target={targets.protein} unit="g" color="protein" />
          <MacroBar label="Glucides" current={totals.carbs} target={targets.carbs} unit="g" color="carbs" />
          <MacroBar label="Lipides" current={totals.fats} target={targets.fats} unit="g" color="fat" />
        </section>

        {/* Add food form - always visible */}
        <section className="hevy-card stack-md">
          <SectionTitle icon="➕" label="Ajouter un aliment" />
          <div className="field-grid compact-grid">
            <label>
              <span>Aliment</span>
              <SearchSelect
                options={allFoodsList.map((f) => ({ value: f.id, label: f.name + (f.isCustom ? ' (perso)' : '') }))}
                value={selectedFood.id}
                onChange={(val: string) => setSelectedFood(allFoodsList.find((f) => f.id === val) ?? allFoodsList[0])}
                placeholder="Rechercher un aliment......"
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
          {/* Portion presets */}
          {selectedFood.servings && selectedFood.servings.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {selectedFood.servings.map((s: { name: string; grams: number }, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  className="chip"
                  onClick={() => setGrams(String(s.grams))}
                  style={{ fontSize: '0.72rem' }}
                >
                  {s.name} ({s.grams}g)
                </button>
              ))}
            </div>
          )}
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
        </section>

        {/* Custom food creation */}
        <details style={{ marginBottom: 8 }} open={showCustomForm}>
          <summary style={accordionStyle} onClick={(e) => { e.preventDefault(); setShowCustomForm(!showCustomForm) }}>
            {'➕'} Créer un aliment perso
          </summary>
          {showCustomForm && (
            <section className="hevy-card stack-md" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
              <div className="field-grid compact-grid">
                <label>
                  <span>Nom</span>
                  <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Ex: Mon granola maison" />
                </label>
                <label>
                  <span>Calories /100g</span>
                  <input type="number" value={customCal} onChange={(e) => setCustomCal(e.target.value)} placeholder="0" />
                </label>
                <label>
                  <span>Protéines /100g</span>
                  <input type="number" value={customProt} onChange={(e) => setCustomProt(e.target.value)} placeholder="0" />
                </label>
                <label>
                  <span>Glucides /100g</span>
                  <input type="number" value={customCarbs} onChange={(e) => setCustomCarbs(e.target.value)} placeholder="0" />
                </label>
                <label>
                  <span>Lipides /100g</span>
                  <input type="number" value={customFats} onChange={(e) => setCustomFats(e.target.value)} placeholder="0" />
                </label>
              </div>
              <button
                className="cta-button"
                type="button"
                style={{ marginTop: 10, width: '100%' }}
                onClick={() => {
                  if (!customName.trim()) { showToast('Donne un nom \u00e0 ton aliment', 'error'); return }
                  const newFood: Food = {
                    id: makeId('custom'),
                    name: customName.trim(),
                    servingGrams: 100,
                    calories: Number(customCal) || 0,
                    protein: Number(customProt) || 0,
                    carbs: Number(customCarbs) || 0,
                    fats: Number(customFats) || 0,
                    tags: ['custom'],
                    isCustom: true,
                  }
                  dispatch({ type: 'ADD_CUSTOM_FOOD', payload: newFood })
                  showToast(customName.trim() + ' créé !', 'success')
                  setCustomName(''); setCustomCal(''); setCustomProt(''); setCustomCarbs(''); setCustomFats('')
                  setShowCustomForm(false)
                }}
              >
                Sauvegarder l'aliment
              </button>
            </section>
          )}
        </details>

        {/* Accordion: Scanner */}
        <details style={{ marginBottom: 8 }}>
          <summary style={accordionStyle}>{'📷'} Scanner / Code-barres</summary>
          <div style={{ padding: '12px 0' }}>
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
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  className="secondary-btn"
                  onClick={() => setShowScanner(true)}
                  type="button"
                  style={{ flex: 1 }}
                >
                  Scanner avec la caméra
                </button>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--muted)' }}>
                Utilise OpenFoodFacts pour trouver les valeurs nutritionnelles automatiquement.
              </p>
            </section>
          </div>
        </details>

        {/* Accordion: Recent foods */}
        <details style={{ marginBottom: 8 }}>
          <summary style={accordionStyle}>{'⭐'} Récents et favoris</summary>
          <div style={{ padding: '12px 0' }}>
            <RecentFoods
              foods={state.foodEntries}
              onSelect={(food: any) => addFood({
                ...food, id: makeId('recent'), date: todayIso(),
                category: food.category || 'snack', grams: food.grams || 100,
              })}
            />
          </div>
        </details>

        {/* Accordion: Recipes */}
        <details style={{ marginBottom: 8 }}>
          <summary style={accordionStyle}>{'🍳'} Recettes suggérées</summary>
          <div style={{ padding: '12px 0' }}>
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
          </div>
        </details>

        {/* Accordion: Saved meals */}
        <details style={{ marginBottom: 8 }}>
          <summary style={accordionStyle}>{'📦'} Repas sauvegardés</summary>
          <div style={{ padding: '12px 0' }}>
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
          </div>
        </details>

        {/* Accordion: Adherence score */}
        <details style={{ marginBottom: 8 }}>
          <summary style={accordionStyle}>{'📈'} Score adhérence</summary>
          <div style={{ padding: '12px 0' }}>
            <AdherenceScore />
          </div>
        </details>

        {/* Accordion: Micronutrients */}
        <details style={{ marginBottom: 8 }}>
          <summary style={accordionStyle}>{'🧪'} Micronutriments</summary>
          <div style={{ padding: '12px 0' }}>
            <MicronutrientEstimate />
          </div>
        </details>

        {/* Accordion: Grocery list */}
        <details style={{ marginBottom: 8 }}>
          <summary style={accordionStyle}>{'🛒'} Liste de courses</summary>
          <div style={{ padding: '12px 0' }}>
            <GroceryList />
          </div>
        </details>

        {/* Accordion: Meal planner */}
        <details style={{ marginBottom: 8 }}>
          <summary style={accordionStyle}>{'🗓'} Planificateur de repas</summary>
          <div style={{ padding: '12px 0' }}>
            <MealPlanner />
          </div>
        </details>

        {/* Accordion: Quick add macros */}
        <details style={{ marginBottom: 8 }}>
          <summary style={accordionStyle}>{'⚡'} Ajout rapide macros</summary>
          <div style={{ padding: '12px 0' }}>
            <QuickAddMacros onAdd={(entry) => addFood({ ...entry, id: makeId('quick'), date: todayIso(), category })} />
          </div>
        </details>

        {/* Accordion: Nutrition charts + export */}
        <details style={{ marginBottom: 8 }}>
          <summary style={accordionStyle}>{'📊'} Historique & export</summary>
          <div style={{ padding: '12px 0' }}>
            <section className="hevy-card stack-md" style={{ marginTop: 0 }}>
              <NutritionCharts entries={state.foodEntries} />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  className="secondary-btn"
                  type="button"
                  style={{ flex: 1, fontSize: '0.8rem' }}
                  onClick={() => exportNutritionData(state.foodEntries, 'csv')}
                >
                  Export CSV
                </button>
                <button
                  className="secondary-btn"
                  type="button"
                  style={{ flex: 1, fontSize: '0.8rem' }}
                  onClick={() => exportNutritionData(state.foodEntries, 'json')}
                >
                  Export JSON
                </button>
              </div>
            </section>
          </div>
        </details>

        {/* Accordion: TDEE */}
        <details style={{ marginBottom: 8 }}>
          <summary style={accordionStyle}>{'🔥'} TDEE adaptatif</summary>
          <div style={{ padding: '12px 0' }}>
            <AdaptiveTDEECard state={state} />
          </div>
        </details>

        {showScanner && (
          <BarcodeScanner
            onDetected={(code) => {
              setShowScanner(false)
              setBarcodeInput(code)
              lookupBarcode(code)
            }}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>
    )
  },
)
