import React, { useState, useMemo } from 'react'
import type { FoodEntry } from '../../types'
import { useAppState } from '../../context/AppContext'
import { foods } from '../../data'
import { getDailyNutrition, getRecommendedRecipes, makeId, todayIso } from '../../lib'
import { showToast } from '../ui/Toast'
import { AdaptiveTDEECard } from '../workout/AdaptiveTDEECard'
import { ProgressBar, SectionTitle } from '../ui/Shared'

export const NutritionView: React.FC = React.memo(
  function NutritionView() {
    const { state, dispatch } = useAppState()
    const [selectedFood, setSelectedFood] = useState(foods[0])
    const [grams, setGrams] = useState('100')
    const [category, setCategory] = useState<FoodEntry['category']>('lunch')
    const [barcodeInput, setBarcodeInput] = useState('')
    const [lookingUp, setLookingUp] = useState(false)
    const totals = useMemo(() => getDailyNutrition(state.foodEntries), [state.foodEntries])
    const suggestions = useMemo(() => getRecommendedRecipes(state), [state.foodEntries, state.targets, state.profile])

    const addFood = (entry: FoodEntry) => {
      dispatch({ type: 'ADD_FOOD', payload: entry })
      showToast(`${entry.name} ajoute (+${entry.calories} kcal)`, 'success')
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
            id: makeId('scan'),
            date: todayIso(),
            name,
            category,
            grams: 100,
            calories: cal,
            protein: prot,
            carbs: carb,
            fats: fat,
          })
          setBarcodeInput('')
        } else {
          showToast('Produit non trouve', 'error')
        }
      } catch {
        showToast('Erreur de connexion', 'error')
      }
      setLookingUp(false)
    }

    return (
      <div className="page">
        <AdaptiveTDEECard state={state} />
        <section className="hevy-card stack-md">
          <SectionTitle icon="📷" label="Scanner / Code-barres" />
          <div className="inline-form">
            <input value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} placeholder="Code-barres (ex: 3017620422003)" onKeyDown={e => e.key === 'Enter' && lookupBarcode(barcodeInput)} />
            <button className="secondary-btn" onClick={() => lookupBarcode(barcodeInput)} type="button" disabled={lookingUp}>
              {lookingUp ? '...' : 'Chercher'}
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--muted)' }}>Utilise OpenFoodFacts pour trouver les valeurs nutritionnelles automatiquement.</p>
        </section>
        <section className="hevy-card stack-md">
          <SectionTitle icon="🍽️" label="Nutrition aujourd'hui" />
          <ProgressBar label="Calories" value={totals.calories} target={state.targets?.calories ?? 1} accent="linear-gradient(90deg,#ffb400,#ff6a00)" />
          <ProgressBar label="Proteines" value={totals.protein} target={state.targets?.protein ?? 1} accent="linear-gradient(90deg,#00d4ff,#4fffb0)" />
          <ProgressBar label="Glucides" value={totals.carbs} target={state.targets?.carbs ?? 1} accent="linear-gradient(90deg,#a855f7,#6366f1)" />
          <ProgressBar label="Lipides" value={totals.fats} target={state.targets?.fats ?? 1} accent="linear-gradient(90deg,#f59e0b,#ef4444)" />
        </section>
        <section className="hevy-card stack-md">
          <SectionTitle icon="➕" label="Ajouter un aliment" />
          <div className="field-grid compact-grid">
            <label>
              <span>Aliment</span>
              <select value={selectedFood.id} onChange={(e) => setSelectedFood(foods.find((f) => f.id === e.target.value) ?? foods[0])}>
                {foods.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </label>
            <label><span>Grammes</span><input value={grams} onChange={(e) => setGrams(e.target.value)} /></label>
            <label>
              <span>Categorie</span>
              <select value={category} onChange={(e) => setCategory(e.target.value as FoodEntry['category'])}>
                <option value="breakfast">Petit-dejeuner</option>
                <option value="lunch">Dejeuner</option>
                <option value="dinner">Diner</option>
                <option value="snack">Collation</option>
                <option value="pre_workout">Pre-seance</option>
                <option value="post_workout">Post-seance</option>
              </select>
            </label>
          </div>
          <button className="secondary-btn" type="button" onClick={() => {
            const g = Number(grams || 0)
            if (isNaN(g) || g <= 0) return
            const ratio = g / selectedFood.servingGrams
            addFood({ id: makeId('food'), date: todayIso(), name: selectedFood.name, category, grams: g, calories: Math.round(selectedFood.calories * ratio), protein: Number((selectedFood.protein * ratio).toFixed(1)), carbs: Number((selectedFood.carbs * ratio).toFixed(1)), fats: Number((selectedFood.fats * ratio).toFixed(1)) })
          }}>Ajouter</button>
        </section>
        <section className="hevy-card stack-md">
          <SectionTitle icon="🥡" label="Repas sauvegardes" />
          {state.savedMeals.length === 0
            ? <div className="empty-state"><div className="empty-icon">🥡</div><p>Aucun repas sauvegarde.</p></div>
            : <div className="card-list">
                {state.savedMeals.map((meal) => (
                  <button className="mini-card mini-card--button" key={meal.id} type="button" onClick={() => addFood({ id: makeId('meal'), date: todayIso(), name: meal.name, category: meal.category, grams: 1, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fats: meal.fats })}>
                    <strong>{meal.name}</strong>
                    <span>{meal.calories} kcal — {meal.protein}P</span>
                  </button>
                ))}
              </div>
          }
        </section>
        <section className="hevy-card stack-md">
          <SectionTitle icon="🍳" label="Recettes suggerees" />
          <div className="card-list">
            {suggestions.map((recipe) => (
              <button className="mini-card mini-card--button" key={recipe.id} type="button" onClick={() => addFood({ id: makeId('recipe'), date: todayIso(), name: recipe.name, category: recipe.category, grams: 1, calories: recipe.calories, protein: recipe.protein, carbs: recipe.carbs, fats: recipe.fats })}>
                <strong>{recipe.name}</strong>
                <span>{recipe.prepMinutes} min — {recipe.calories} kcal — {recipe.protein}P</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    )
  }
)
