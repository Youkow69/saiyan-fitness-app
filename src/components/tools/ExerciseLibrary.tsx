// src/components/tools/ExerciseLibrary.tsx
// Enhanced exercise library with filters and search

import { useState, useMemo } from 'react'
import { useAppState } from '../../context/AppContext'
import { allExercises } from '../../data/exercises'
import type { Exercise, MuscleGroup } from '../../types'

const EQUIPMENT_OPTIONS = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'EZ-bar', 'Kettlebell']
const MUSCLE_OPTIONS: MuscleGroup[] = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core']

interface Props {
  onSelect?: (exercise: Exercise) => void
  compact?: boolean
}

export function ExerciseLibrary({ onSelect, compact = false }: Props) {
  const { state } = useAppState()
  const [search, setSearch] = useState('')
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | ''>('')
  const [filterEquip, setFilterEquip] = useState('')
  const [filterDiff, setFilterDiff] = useState<number | 0>(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const customExercises = [] as any[]
  const allExs = [...allExercises, ...customExercises]

  const filtered = useMemo(() => {
    return allExs.filter(ex => {
      if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterMuscle && !ex.primaryMuscles.includes(filterMuscle) && !ex.secondaryMuscles.includes(filterMuscle)) return false
      if (filterEquip && ex.equipment !== filterEquip) return false
      if (filterDiff && ex.difficulty !== filterDiff) return false
      return true
    })
  }, [search, filterMuscle, filterEquip, filterDiff, allExs])

  return (
    <div style={{ padding: compact ? 0 : 8 }}>
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={'\U0001f50d Rechercher un exercice...'}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 10,
          border: '1px solid var(--border, #333)', background: 'var(--bg-card, #1a1a2e)',
          color: 'var(--text)', fontSize: '0.85rem', marginBottom: 8, outline: 'none',
        }}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        <select value={filterMuscle} onChange={e => setFilterMuscle(e.target.value as any)}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: '0.72rem' }}>
          <option value="">Tous muscles</option>
          {MUSCLE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterEquip} onChange={e => setFilterEquip(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: '0.72rem' }}>
          <option value="">{'\u00c9quipement'}</option>
          {EQUIPMENT_OPTIONS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
        </select>
        <select value={filterDiff || ''} onChange={e => setFilterDiff(Number(e.target.value) || 0)}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: '0.72rem' }}>
          <option value="0">Difficult\u00e9</option>
          <option value="1">D\u00e9butant</option>
          <option value="2">Interm\u00e9diaire</option>
          <option value="3">Avanc\u00e9</option>
        </select>
      </div>

      {/* Count */}
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
        {filtered.length} exercice{filtered.length !== 1 ? 's' : ''} trouv\u00e9{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: compact ? 300 : 500, overflowY: 'auto' }}>
        {filtered.slice(0, 50).map(ex => (
          <button
            key={ex.id}
            type="button"
            onClick={() => onSelect ? onSelect(ex) : setSelectedId(selectedId === ex.id ? null : ex.id)}
            style={{
              textAlign: 'left', padding: '8px 12px', borderRadius: 8,
              border: selectedId === ex.id ? '2px solid #FFD700' : '1px solid var(--border, #333)',
              background: selectedId === ex.id ? 'rgba(255,215,0,0.08)' : 'transparent',
              color: 'var(--text)', cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{ex.name}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', gap: 8, marginTop: 2 }}>
              <span>{ex.equipment}</span>
              <span>{ex.primaryMuscles.join(', ')}</span>
              <span>{'#'.repeat(ex.difficulty)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
