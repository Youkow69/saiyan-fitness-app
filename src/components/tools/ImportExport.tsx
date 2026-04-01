import { useState, useCallback, useRef } from 'react'
import { useAppState } from '../../context/AppContext'
import { makeId, todayIso } from '../../lib'
import type { WorkoutLog } from '../../types'
import { showToast } from '../ui/Toast'

// ─────────────────────────────────────────────
// CSV line parser (handles quoted fields)
// ─────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  result.push(current.trim())
  return result
}

// ─────────────────────────────────────────────
// Parse Strong CSV
// Date,Workout Name,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE
// ─────────────────────────────────────────────
function parseStrongCSV(csv: string): WorkoutLog[] {
  const lines = csv.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  const workouts = new Map<string, WorkoutLog>()

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    if (cols.length < 6) continue

    const rawDate = cols[0] || ''
    const date = rawDate.slice(0, 10)
    const workoutName = cols[1] || 'Imported'
    const exerciseName = cols[2] || ''
    const weight = parseFloat(cols[4]) || 0
    const reps = parseInt(cols[5]) || 0
    const rpe = cols.length >= 11 ? parseFloat(cols[10]) || 0 : 0

    if (!exerciseName) continue

    const key = `${date}_${workoutName}`
    if (!workouts.has(key)) {
      workouts.set(key, {
        id: makeId(),
        date,
        programId: 'import_strong',
        sessionId: 'imported',
        sessionName: workoutName,
        exercises: [],
        durationMinutes: 60,
      })
    }

    const workout = workouts.get(key)!
    const exerciseId = exerciseName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')

    let exerciseLog = workout.exercises.find(e => e.exerciseId === exerciseId)
    if (!exerciseLog) {
      exerciseLog = {
        exerciseId,
        target: {
          exerciseId,
          sets: 0,
          repMin: 0,
          repMax: 0,
          targetRir: 2,
          restSeconds: 90,
        },
        sets: [],
      }
      workout.exercises.push(exerciseLog)
    }

    const rirFromRpe = rpe > 0 ? Math.max(0, 10 - rpe) : 2

    exerciseLog.sets.push({
      id: makeId(),
      exerciseId,
      setIndex: exerciseLog.sets.length + 1,
      setType: 'normal',
      weightKg: weight,
      reps,
      rir: rirFromRpe,
      timestamp: new Date(date).toISOString(),
    })
  }

  // Update target set counts
  for (const workout of workouts.values()) {
    for (const ex of workout.exercises) {
      ex.target.sets = ex.sets.length
      if (ex.sets.length > 0) {
        const repsArr = ex.sets.map(s => s.reps)
        ex.target.repMin = Math.min(...repsArr)
        ex.target.repMax = Math.max(...repsArr)
      }
    }
  }

  return Array.from(workouts.values())
}

// ─────────────────────────────────────────────
// Parse Hevy CSV
// title,start_time,end_time,description,exercise_title,superset_id,
// set_index,set_type,weight_kg,reps,distance_km,duration_seconds,rpe
// ─────────────────────────────────────────────
function parseHevyCSV(csv: string): WorkoutLog[] {
  const lines = csv.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  const workouts = new Map<string, WorkoutLog>()

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    if (cols.length < 10) continue

    const title = cols[0] || 'Imported'
    const startTime = cols[1] || ''
    const endTime = cols[2] || ''
    const exerciseTitle = cols[4] || ''
    const setType = cols[7] || 'normal'
    const weightKg = parseFloat(cols[8]) || 0
    const reps = parseInt(cols[9]) || 0
    const rpe = cols.length >= 13 ? parseFloat(cols[12]) || 0 : 0

    if (!exerciseTitle) continue

    const date = startTime.slice(0, 10)
    const key = `${date}_${title}`

    if (!workouts.has(key)) {
      let duration = 60
      if (startTime && endTime) {
        const start = new Date(startTime)
        const end = new Date(endTime)
        const diffMs = end.getTime() - start.getTime()
        if (diffMs > 0) {
          duration = Math.round(diffMs / 60000)
        }
      }

      workouts.set(key, {
        id: makeId(),
        date,
        programId: 'import_hevy',
        sessionId: 'imported',
        sessionName: title,
        exercises: [],
        durationMinutes: duration,
      })
    }

    const workout = workouts.get(key)!
    const exerciseId = exerciseTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')

    let exerciseLog = workout.exercises.find(e => e.exerciseId === exerciseId)
    if (!exerciseLog) {
      exerciseLog = {
        exerciseId,
        target: {
          exerciseId,
          sets: 0,
          repMin: 0,
          repMax: 0,
          targetRir: 2,
          restSeconds: 90,
        },
        sets: [],
      }
      workout.exercises.push(exerciseLog)
    }

    const mappedSetType =
      setType === 'warmup'
        ? 'warmup'
        : setType === 'dropset'
        ? 'drop'
        : setType === 'failure'
        ? 'amrap'
        : 'normal'

    const rirFromRpe = rpe > 0 ? Math.max(0, 10 - rpe) : 2

    exerciseLog.sets.push({
      id: makeId(),
      exerciseId,
      setIndex: exerciseLog.sets.length + 1,
      setType: mappedSetType,
      weightKg,
      reps,
      rir: rirFromRpe,
      timestamp: startTime || new Date(date).toISOString(),
    })
  }

  // Update target set counts
  for (const workout of workouts.values()) {
    for (const ex of workout.exercises) {
      ex.target.sets = ex.sets.length
      if (ex.sets.length > 0) {
        const repsArr = ex.sets.map(s => s.reps)
        ex.target.repMin = Math.min(...repsArr)
        ex.target.repMax = Math.max(...repsArr)
      }
    }
  }

  return Array.from(workouts.values())
}

// ─────────────────────────────────────────────
// Validation for JSON import
// ─────────────────────────────────────────────
function validateAppState(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return (
    Array.isArray(obj.foodEntries) ||
    Array.isArray(obj.workoutLogs) ||
    Array.isArray(obj.programs) ||
    typeof obj.targets === 'object'
  )
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export function ImportExport() {
  const { state, dispatch } = useAppState()
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeImport, setActiveImport] = useState<'json' | 'strong' | 'hevy' | null>(null)

  // ── Export JSON ──
  const exportJSON = useCallback(() => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: 'application/json',
      })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `saiyan-fitness-${todayIso()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
      showToast('Donnees exportees avec succes', 'success')
    } catch {
      showToast('Erreur lors de l\'export', 'error')
    }
  }, [state])

  // ── Import JSON ──
  const importJSON = useCallback(
    (file: File) => {
      setImporting(true)
      setImportResult(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const data = JSON.parse(text)

          if (!validateAppState(data)) {
            setImportResult({ message: 'Fichier invalide : structure non reconnue.', type: 'error' })
            setImporting(false)
            return
          }

          if (mode === 'replace') {
            dispatch({ type: 'SET_STATE', payload: data })
            setImportResult({
              message: 'Donnees importees (remplacement complet).',
              type: 'success',
            })
          } else {
            const mergedState = {
              ...state,
              foodEntries: [
                ...state.foodEntries,
                ...(data.foodEntries || []).filter(
                  (e: { id: string }) => !state.foodEntries.some((s: { id: string }) => s.id === e.id)
                ),
              ],
              workoutLogs: [
                ...state.workoutLogs,
                ...(data.workoutLogs || []).filter(
                  (e: { id: string }) => !state.workoutLogs.some((s: { id: string }) => s.id === e.id)
                ),
              ],
              programs: [
                ...state.programs,
                ...(data.programs || []).filter(
                  (e: { id: string }) => !state.programs.some((s: { id: string }) => s.id === e.id)
                ),
              ],
            }
            dispatch({ type: 'SET_STATE', payload: mergedState })
            const counts = []
            if (data.foodEntries) counts.push(`${data.foodEntries.length} repas`)
            if (data.workoutLogs) counts.push(`${data.workoutLogs.length} seances`)
            setImportResult({
              message: `Donnees fusionnees : ${counts.join(', ') || 'aucune donnee'}.`,
              type: 'success',
            })
          }

          showToast('Import JSON reussi', 'success')
        } catch {
          setImportResult({ message: 'Erreur de parsing JSON. Verifiez le fichier.', type: 'error' })
          showToast('Erreur d\'import', 'error')
        }
        setImporting(false)
      }

      reader.onerror = () => {
        setImportResult({ message: 'Impossible de lire le fichier.', type: 'error' })
        setImporting(false)
      }

      reader.readAsText(file)
    },
    [dispatch, mode, state]
  )

  // ── Import Strong CSV ──
  const importStrongCSV = useCallback(
    (file: File) => {
      setImporting(true)
      setImportResult(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string
          const workouts = parseStrongCSV(csv)

          if (workouts.length === 0) {
            setImportResult({
              message: 'Aucune seance trouvee dans le CSV Strong.',
              type: 'error',
            })
            setImporting(false)
            return
          }

          const mergedWorkouts = [
            ...state.workoutLogs,
            ...workouts.filter(
              (w: { id: string }) => !state.workoutLogs.some((s: { id: string }) => s.id === w.id)
            ),
          ]
          dispatch({ type: 'SET_STATE', payload: { ...state, workoutLogs: mergedWorkouts } })
          const totalSets = workouts.reduce(
            (sum, w) => sum + w.exercises.reduce((s, ex) => s + ex.sets.length, 0),
            0
          )
          setImportResult({
            message: `Import Strong : ${workouts.length} seance(s), ${totalSets} serie(s) importees.`,
            type: 'success',
          })
          showToast(`${workouts.length} seance(s) importees depuis Strong`, 'success')
        } catch {
          setImportResult({ message: 'Erreur de parsing du CSV Strong.', type: 'error' })
          showToast('Erreur d\'import Strong', 'error')
        }
        setImporting(false)
      }

      reader.readAsText(file)
    },
    [dispatch, state]
  )

  // ── Import Hevy CSV ──
  const importHevyCSV = useCallback(
    (file: File) => {
      setImporting(true)
      setImportResult(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string
          const workouts = parseHevyCSV(csv)

          if (workouts.length === 0) {
            setImportResult({
              message: 'Aucune seance trouvee dans le CSV Hevy.',
              type: 'error',
            })
            setImporting(false)
            return
          }

          const mergedWorkouts = [
            ...state.workoutLogs,
            ...workouts.filter(
              (w: { id: string }) => !state.workoutLogs.some((s: { id: string }) => s.id === w.id)
            ),
          ]
          dispatch({ type: 'SET_STATE', payload: { ...state, workoutLogs: mergedWorkouts } })
          const totalSets = workouts.reduce(
            (sum, w) => sum + w.exercises.reduce((s, ex) => s + ex.sets.length, 0),
            0
          )
          setImportResult({
            message: `Import Hevy : ${workouts.length} seance(s), ${totalSets} serie(s) importees.`,
            type: 'success',
          })
          showToast(`${workouts.length} seance(s) importees depuis Hevy`, 'success')
        } catch {
          setImportResult({ message: 'Erreur de parsing du CSV Hevy.', type: 'error' })
          showToast('Erreur d\'import Hevy', 'error')
        }
        setImporting(false)
      }

      reader.readAsText(file)
    },
    [dispatch, state]
  )

  // ── File handler ──
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !activeImport) return

      if (activeImport === 'json') importJSON(file)
      else if (activeImport === 'strong') importStrongCSV(file)
      else if (activeImport === 'hevy') importHevyCSV(file)

      setActiveImport(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [activeImport, importJSON, importStrongCSV, importHevyCSV]
  )

  const triggerFileInput = useCallback((type: 'json' | 'strong' | 'hevy') => {
    setActiveImport(type)
    setTimeout(() => fileInputRef.current?.click(), 50)
  }, [])

  const btnStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'center',
  }

  return (
    <div style={{ padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#e5e7eb', marginBottom: 16 }}>
        Import / Export
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={activeImport === 'json' ? '.json' : '.csv'}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Export */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Exporter
        </div>
        <button
          onClick={exportJSON}
          style={{ ...btnStyle, width: '100%', background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.1)')}
        >
          Exporter toutes les donnees (JSON)
        </button>
      </div>

      {/* Import mode toggle */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Mode d'import JSON
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setMode('merge')}
            style={{
              ...btnStyle,
              background: mode === 'merge' ? 'rgba(99,102,241,0.15)' : 'transparent',
              borderColor: mode === 'merge' ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)',
              color: mode === 'merge' ? '#818cf8' : '#9ca3af',
              fontSize: 12,
            }}
          >
            Fusionner
          </button>
          <button
            onClick={() => setMode('replace')}
            style={{
              ...btnStyle,
              background: mode === 'replace' ? 'rgba(239,68,68,0.12)' : 'transparent',
              borderColor: mode === 'replace' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)',
              color: mode === 'replace' ? '#ef4444' : '#9ca3af',
              fontSize: 12,
            }}
          >
            Remplacer tout
          </button>
        </div>
      </div>

      {/* Import buttons */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Importer
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            onClick={() => triggerFileInput('json')}
            disabled={importing}
            style={{ ...btnStyle, width: '100%' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            Importer un fichier JSON
          </button>
          <button
            onClick={() => triggerFileInput('strong')}
            disabled={importing}
            style={{ ...btnStyle, width: '100%' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            Importer depuis Strong (CSV)
          </button>
          <button
            onClick={() => triggerFileInput('hevy')}
            disabled={importing}
            style={{ ...btnStyle, width: '100%' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            Importer depuis Hevy (CSV)
          </button>
        </div>
      </div>

      {/* Loading state */}
      {importing && (
        <div style={{ padding: 12, textAlign: 'center', color: '#f59e0b', fontSize: 13 }}>
          Import en cours...
        </div>
      )}

      {/* Result message */}
      {importResult && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: importResult.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${importResult.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: importResult.type === 'success' ? '#22c55e' : '#ef4444',
            fontSize: 13,
            marginTop: 8,
          }}
        >
          {importResult.message}
        </div>
      )}

      {/* Warning for replace mode */}
      {mode === 'replace' && (
        <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', fontSize: 11, color: '#f87171' }}>
          Attention : le mode "Remplacer tout" ecrasera toutes vos donnees actuelles.
        </div>
      )}
    </div>
  )
}
