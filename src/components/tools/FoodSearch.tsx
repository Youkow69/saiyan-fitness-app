// ── FoodSearch.tsx ───────────────────────────────────────────────────────────
// Real-time OpenFoodFacts search with debounce + local food fallback.
// Mobile-first, French labels, fully self-contained component.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useAppState } from '../../context/AppContext'
import { makeId, todayIso } from '../../lib'
import { foods as localFoods } from '../../data'
import { showToast } from '../ui/Toast'
import type { FoodEntry, MealCategory } from '../../types'

// ── Types ────────────────────────────────────────────────────────────────────

interface OFFProduct {
  product_name: string
  product_name_fr?: string
  nutriments: {
    'energy-kcal_100g'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    fiber_100g?: number
  }
  code?: string
  image_small_url?: string
}

interface Props {
  category: MealCategory
  onAdd: (entry: FoodEntry) => void
}

// ── Styles (injected once) ───────────────────────────────────────────────────

const STYLE_ID = 'food-search-styles'

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes fs-fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fs-card {
      background: var(--bg-card, #1a1a1a);
      border-radius: 16px;
      border: 1px solid var(--border, #333);
      padding: 14px;
      margin-bottom: 12px;
    }
    .fs-input {
      width: 100%;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid var(--border, #333);
      background: var(--bg, #111);
      color: var(--text, #fff);
      font-size: 0.9rem;
      -webkit-appearance: none;
      appearance: none;
    }
    .fs-input:focus {
      outline: none;
      border-color: var(--accent, #ff8c00);
      box-shadow: 0 0 0 2px rgba(255,140,0,0.15);
    }
    .fs-result-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 8px;
      border-bottom: 1px solid var(--border, #333);
      cursor: pointer;
      min-height: 52px;
      transition: background 0.12s;
      animation: fs-fadeIn 0.2s ease-out;
    }
    .fs-result-item:hover, .fs-result-item:active {
      background: rgba(255,140,0,0.06);
    }
    .fs-result-item:last-child { border-bottom: none; }
    .fs-thumb {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      object-fit: cover;
      background: var(--border, #333);
      flex-shrink: 0;
    }
    .fs-macro-pills {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 4px;
    }
    .fs-pill {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 6px;
      font-size: 0.65rem;
      font-weight: 600;
    }
    .fs-selected-card {
      background: rgba(255,140,0,0.06);
      border: 1px solid var(--accent, #ff8c00);
      border-radius: 12px;
      padding: 14px;
      margin-top: 10px;
      animation: fs-fadeIn 0.2s ease-out;
    }
    .fs-mode-toggle {
      display: flex;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid var(--border, #333);
      margin-bottom: 10px;
    }
    .fs-mode-btn {
      flex: 1;
      padding: 8px 12px;
      border: none;
      background: transparent;
      color: var(--text-secondary, #888);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .fs-mode-btn--active {
      background: var(--accent, #ff8c00);
      color: #000;
    }
    .fs-add-btn {
      width: 100%;
      padding: 12px;
      border-radius: 10px;
      border: none;
      background: var(--accent, #ff8c00);
      color: #000;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      margin-top: 10px;
      transition: transform 0.1s, opacity 0.15s;
    }
    .fs-add-btn:active { transform: scale(0.97); }
    .fs-add-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none;
    }
    .fs-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid var(--border, #333);
      border-top-color: var(--accent, #ff8c00);
      border-radius: 50%;
      animation: fs-spin 0.6s linear infinite;
    }
    @keyframes fs-spin {
      to { transform: rotate(360deg); }
    }
    .fs-recent-label {
      font-size: 0.68rem;
      color: var(--text-secondary, #888);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .fs-gram-row {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: 8px;
    }
    .fs-gram-preset {
      padding: 5px 10px;
      border-radius: 8px;
      border: 1px solid var(--border, #333);
      background: transparent;
      color: var(--text-secondary, #888);
      font-size: 0.72rem;
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;
    }
    .fs-gram-preset--active {
      border-color: var(--accent, #ff8c00);
      color: var(--accent, #ff8c00);
    }
  `
  document.head.appendChild(style)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function macroPills(cal: number, p: number, c: number, f: number) {
  return (
    <div className="fs-macro-pills">
      <span className="fs-pill" style={{ background: 'rgba(255,140,0,0.12)', color: '#ff8c00' }}>{cal} kcal</span>
      <span className="fs-pill" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>{p}P</span>
      <span className="fs-pill" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>{c}G</span>
      <span className="fs-pill" style={{ background: 'rgba(236,72,153,0.12)', color: '#ec4899' }}>{f}L</span>
    </div>
  )
}

const GRAM_PRESETS = [50, 100, 150, 200, 250]

// ── Component ────────────────────────────────────────────────────────────────

export function FoodSearch({ category, onAdd }: Props) {
  const { state } = useAppState()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OFFProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<OFFProduct | null>(null)
  const [grams, setGrams] = useState('100')
  const [mode, setMode] = useState<'search' | 'local'>('search')
  const [recentSearches, setRecentSearches] = useState<OFFProduct[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  // Inject styles once
  useEffect(() => { injectStyles() }, [])

  // ── Debounced OpenFoodFacts search ─────────────────────────────────────────

  useEffect(() => {
    if (mode !== 'search' || query.length < 2) {
      setResults([])
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&lc=fr&fields=product_name,product_name_fr,nutriments,code,image_small_url`
        const resp = await fetch(url)
        const data = await resp.json()
        const products: OFFProduct[] = (data.products || []).filter(
          (p: OFFProduct) => p.product_name || p.product_name_fr,
        )
        setResults(products)
      } catch {
        showToast('Erreur de recherche', 'error')
        setResults([])
      }
      setLoading(false)
    }, 400)

    return () => clearTimeout(debounceRef.current)
  }, [query, mode])

  // ── Local food filtering ───────────────────────────────────────────────────

  const localResults = useMemo(() => {
    if (mode !== 'local' || query.length < 1) return localFoods.slice(0, 15)
    const q = query.toLowerCase()
    return localFoods.filter(f => f.name.toLowerCase().includes(q)).slice(0, 15)
  }, [query, mode])

  // ── Add selected product ───────────────────────────────────────────────────

  const addProduct = useCallback(() => {
    if (!selected) return
    const g = parseFloat(grams) || 100
    const n = selected.nutriments
    const ratio = g / 100

    const entry: FoodEntry = {
      id: makeId('off'),
      date: todayIso(),
      name: selected.product_name_fr || selected.product_name,
      category,
      grams: g,
      calories: Math.round((n['energy-kcal_100g'] || 0) * ratio),
      protein: Math.round((n.proteins_100g || 0) * ratio * 10) / 10,
      carbs: Math.round((n.carbohydrates_100g || 0) * ratio * 10) / 10,
      fats: Math.round((n.fat_100g || 0) * ratio * 10) / 10,
    }

    onAdd(entry)

    // Save to recent searches (max 5, deduplicated by barcode)
    setRecentSearches(prev =>
      [selected, ...prev.filter(p => p.code !== selected.code)].slice(0, 5),
    )

    setSelected(null)
    setQuery('')
    showToast(`${entry.name} ajout\u00e9 !`, 'success')
  }, [selected, grams, category, onAdd])

  // ── Add a local food ───────────────────────────────────────────────────────

  const addLocalFood = useCallback((food: typeof localFoods[0]) => {
    const g = parseFloat(grams) || 100
    const ratio = g / food.servingGrams

    const entry: FoodEntry = {
      id: makeId('local'),
      date: todayIso(),
      name: food.name,
      category,
      grams: g,
      calories: Math.round(food.calories * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fats: Math.round(food.fats * ratio * 10) / 10,
    }

    onAdd(entry)
    setQuery('')
    showToast(`${entry.name} ajout\u00e9 !`, 'success')
  }, [grams, category, onAdd])

  // ── Computed macros for selected product at given grams ─────────────────

  const selectedMacros = useMemo(() => {
    if (!selected) return null
    const g = parseFloat(grams) || 100
    const n = selected.nutriments
    const ratio = g / 100
    return {
      cal: Math.round((n['energy-kcal_100g'] || 0) * ratio),
      p: Math.round((n.proteins_100g || 0) * ratio * 10) / 10,
      c: Math.round((n.carbohydrates_100g || 0) * ratio * 10) / 10,
      f: Math.round((n.fat_100g || 0) * ratio * 10) / 10,
    }
  }, [selected, grams])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fs-card">
      {/* Title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
      }}>
        <span style={{ fontSize: '1.1rem' }}>🔍</span>
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Rechercher un aliment</span>
      </div>

      {/* Mode toggle */}
      <div className="fs-mode-toggle">
        <button
          className={`fs-mode-btn ${mode === 'search' ? 'fs-mode-btn--active' : ''}`}
          onClick={() => { setMode('search'); setResults([]); setSelected(null) }}
          type="button"
        >
          OpenFoodFacts
        </button>
        <button
          className={`fs-mode-btn ${mode === 'local' ? 'fs-mode-btn--active' : ''}`}
          onClick={() => { setMode('local'); setResults([]); setSelected(null) }}
          type="button"
        >
          Base locale
        </button>
      </div>

      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          className="fs-input"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null) }}
          placeholder={mode === 'search' ? 'Chercher sur OpenFoodFacts...' : 'Chercher dans la base locale...'}
          inputMode="search"
          autoComplete="off"
        />
        {loading && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <span className="fs-spinner" />
          </div>
        )}
        {query.length > 0 && !loading && (
          <button
            onClick={() => { setQuery(''); setSelected(null); inputRef.current?.focus() }}
            type="button"
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary, #888)',
              fontSize: '1rem',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Recent searches (shown when query is empty and mode is search) */}
      {mode === 'search' && query.length === 0 && recentSearches.length > 0 && !selected && (
        <div style={{ marginTop: 10 }}>
          <div className="fs-recent-label">Récents</div>
          {recentSearches.map((prod, i) => {
            const n = prod.nutriments
            return (
              <div
                key={prod.code || i}
                className="fs-result-item"
                onClick={() => { setSelected(prod); setGrams('100') }}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') { setSelected(prod); setGrams('100') } }}
              >
                {prod.image_small_url && (
                  <img className="fs-thumb" src={prod.image_small_url} alt="" loading="lazy" />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {prod.product_name_fr || prod.product_name}
                  </div>
                  {macroPills(
                    Math.round(n['energy-kcal_100g'] || 0),
                    Math.round(n.proteins_100g || 0),
                    Math.round(n.carbohydrates_100g || 0),
                    Math.round(n.fat_100g || 0),
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* OpenFoodFacts results */}
      {mode === 'search' && results.length > 0 && !selected && (
        <div style={{ marginTop: 8, maxHeight: 320, overflowY: 'auto' }}>
          {results.map((prod, i) => {
            const n = prod.nutriments
            return (
              <div
                key={prod.code || i}
                className="fs-result-item"
                onClick={() => { setSelected(prod); setGrams('100') }}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') { setSelected(prod); setGrams('100') } }}
              >
                {prod.image_small_url ? (
                  <img className="fs-thumb" src={prod.image_small_url} alt="" loading="lazy" />
                ) : (
                  <div className="fs-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                    🍕
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {prod.product_name_fr || prod.product_name}
                  </div>
                  {macroPills(
                    Math.round(n['energy-kcal_100g'] || 0),
                    Math.round(n.proteins_100g || 0),
                    Math.round(n.carbohydrates_100g || 0),
                    Math.round(n.fat_100g || 0),
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* No results */}
      {mode === 'search' && query.length >= 2 && !loading && results.length === 0 && !selected && (
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary, #888)', padding: '16px 0', margin: 0 }}>
          Aucun résultat pour «{query}»
        </p>
      )}

      {/* Local food results */}
      {mode === 'local' && !selected && (
        <div style={{ marginTop: 8, maxHeight: 320, overflowY: 'auto' }}>
          {localResults.map(food => (
            <div
              key={food.id}
              className="fs-result-item"
              onClick={() => addLocalFood(food)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') addLocalFood(food) }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{food.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #888)', marginTop: 2 }}>
                  Pour {food.servingGrams}g
                </div>
                {macroPills(food.calories, food.protein, food.carbs, food.fats)}
              </div>
            </div>
          ))}
          {localResults.length === 0 && (
            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary, #888)', padding: '16px 0', margin: 0 }}>
              Aucun aliment trouvé
            </p>
          )}
        </div>
      )}

      {/* Selected product detail */}
      {selected && selectedMacros && (
        <div className="fs-selected-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {selected.image_small_url && (
              <img className="fs-thumb" src={selected.image_small_url} alt="" style={{ width: 48, height: 48 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {selected.product_name_fr || selected.product_name}
              </div>
              {selected.code && (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary, #888)' }}>
                  Code: {selected.code}
                </div>
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #888)',
                fontSize: '1.1rem',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              ×
            </button>
          </div>

          {/* Gram presets */}
          <div className="fs-gram-row">
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #888)', fontWeight: 600 }}>
              Quantité:
            </span>
            {GRAM_PRESETS.map(g => (
              <button
                key={g}
                className={`fs-gram-preset ${grams === String(g) ? 'fs-gram-preset--active' : ''}`}
                onClick={() => setGrams(String(g))}
                type="button"
              >
                {g}g
              </button>
            ))}
          </div>

          {/* Custom grams input */}
          <div style={{ marginTop: 8 }}>
            <input
              className="fs-input"
              value={grams}
              onChange={e => setGrams(e.target.value)}
              inputMode="decimal"
              placeholder="Grammes"
              style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}
              aria-label="Quantit\u00e9 en grammes"
            />
          </div>

          {/* Computed macros for selected grams */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            marginTop: 10,
            textAlign: 'center',
          }}>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ff8c00' }}>{selectedMacros.cal}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary, #888)', textTransform: 'uppercase' }}>kcal</div>
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa' }}>{selectedMacros.p}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary, #888)', textTransform: 'uppercase' }}>prot</div>
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22c55e' }}>{selectedMacros.c}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary, #888)', textTransform: 'uppercase' }}>gluc</div>
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ec4899' }}>{selectedMacros.f}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary, #888)', textTransform: 'uppercase' }}>lip</div>
            </div>
          </div>

          {/* Add button */}
          <button
            className="fs-add-btn"
            onClick={addProduct}
            type="button"
            disabled={!selected}
          >
            + Ajouter {parseFloat(grams) || 100}g
          </button>
        </div>
      )}
    </div>
  )
}

export default FoodSearch
