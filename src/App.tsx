import { useEffect, useState, useCallback } from 'react'
import { AppProvider, useAppState } from './context/AppContext'
import { saveState } from './storage'
import { ToastContainer, showToast } from './components/ui/Toast'
import { getExerciseById, getProgramById, makeId, todayIso } from './lib'
import type {
  CustomRoutine,
  MuscleGroup,
  OnboardingAnswers,
  SessionFeedback,
  SetType,
  TabId,
  UserProfile,
  WorkoutDraft,
} from './types'

// ── Components ───────────────────────────────────────────────────────────────

import { BottomNav } from './components/layout/BottomNav'
import { FeedbackModal } from './components/workout/FeedbackModal'
import { HomeView } from './components/views/HomeView'
import { TrainView } from './components/views/TrainView'
import { OnboardingView } from './components/views/OnboardingView'
import { NutritionView } from './components/views/NutritionView'
import { ScouterView } from './components/views/ScouterView'
import { ProfileView } from './components/views/ProfileView'

// ── Helpers ──────────────────────────────────────────────────────────────────

function checkForPR(
  workouts: ReturnType<typeof useAppState>['state']['workouts'],
  exerciseId: string,
  weightKg: number,
  reps: number
): boolean {
  const newE1rm = weightKg * (1 + reps / 30)
  let bestE1rm = 0
  workouts.forEach((w) => {
    w.exercises
      .filter((e) => e.exerciseId === exerciseId)
      .forEach((e) => {
        e.sets.forEach((s) => {
          const e1rm = s.weightKg * (1 + s.reps / 30)
          if (e1rm > bestE1rm) bestE1rm = e1rm
        })
      })
  })
  return bestE1rm > 0 && newE1rm > bestE1rm
}

// ── AppInner (uses context) ──────────────────────────────────────────────────

function AppInner() {
  const { state, dispatch } = useAppState()
  const [tab, setTab] = useState<TabId>('home')
  const [restTimer, setRestTimer] = useState(0)
  const [pendingFeedback, setPendingFeedback] = useState<{
    workoutId: string
    muscles: MuscleGroup[]
  } | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('sf_theme') as 'dark' | 'light') || 'dark'
  )

  // Rest timer effect
  useEffect(() => {
    if (restTimer <= 0) return
    if (restTimer === 3) {
      try {
        navigator.vibrate?.(100)
      } catch {}
    }
    const timer = window.setTimeout(() => {
      if (restTimer === 1) {
        try {
          navigator.vibrate?.([200, 100, 200, 100, 200])
          const ctx = new AudioContext()
          const osc = ctx.createOscillator()
          osc.type = 'sine'
          osc.frequency.value = 880
          osc.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.5)
        } catch {}
      }
      setRestTimer((c) => c - 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [restTimer])

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sf_theme', theme)
  }, [theme])

  // Persist state on page unload
  useEffect(() => {
    const handleUnload = () => saveState(state)
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [state])

  // Saiyan-steps sync: read tracker data from localStorage
  useEffect(() => {
    const checkSync = () => {
      try {
        const raw = localStorage.getItem('saiyan_tracker_sync')
        if (!raw) return
        const sync = JSON.parse(raw)
        if (sync.date !== todayIso()) return
        const today = todayIso()
        const existing = (state.dailyQuestProgress ?? []).find((d: { date: string }) => d.date === today)
        if (sync.steps > 0) {
          const currentSteps = existing?.quests['steps'] ?? 0
          if (sync.steps > currentSteps) {
            dispatch({ type: 'UPDATE_QUEST_PROGRESS', payload: { questId: 'steps', delta: sync.steps - currentSteps } })
          }
        }
        if (sync.waterGlasses > 0) {
          const currentWater = existing?.quests['water'] ?? 0
          if (sync.waterGlasses > currentWater) {
            dispatch({ type: 'UPDATE_QUEST_PROGRESS', payload: { questId: 'water', delta: sync.waterGlasses - currentWater } })
          }
        }
        if (sync.sleepHours > 0) {
          const currentSleep = existing?.quests['sleep'] ?? 0
          if (sync.sleepHours > currentSleep) {
            dispatch({ type: 'UPDATE_QUEST_PROGRESS', payload: { questId: 'sleep', delta: sync.sleepHours - currentSleep } })
          }
        }
      } catch { /* ignore parse errors */ }
    }
    checkSync()
    const interval = setInterval(checkSync, 30000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedProgram = getProgramById(state.selectedProgramId)
  const nextIndex = state.programCursor[selectedProgram?.id ?? ''] ?? 0
  const nextSession =
    selectedProgram?.sessions[
      nextIndex % (selectedProgram?.sessions.length ?? 1)
    ] ?? null

  // ── Action handlers ────────────────────────────────────────────────────────

  const completeOnboarding = useCallback(
    (profile: UserProfile, answers: OnboardingAnswers) => {
      dispatch({
        type: 'COMPLETE_ONBOARDING',
        payload: { profile, answers },
      })
    },
    [dispatch]
  )

  const startWorkout = useCallback(() => {
    if (!selectedProgram || !nextSession) return
    const draft: WorkoutDraft = {
      programId: selectedProgram.id,
      sessionId: nextSession.id,
      startedAt: new Date().toISOString(),
      exercises: nextSession.exercises.map((entry) => ({
        exerciseId: entry.exerciseId,
        target: entry,
        sets: [],
      })),
    }
    dispatch({ type: 'START_WORKOUT', payload: draft })
    setTab('train')
  }, [dispatch, selectedProgram, nextSession])

  const startSession = useCallback(
    (sessionIndex: number) => {
      if (!selectedProgram) return
      const session = selectedProgram.sessions[sessionIndex]
      if (!session) return
      const draft: WorkoutDraft = {
        programId: selectedProgram.id,
        sessionId: session.id,
        startedAt: new Date().toISOString(),
        exercises: session.exercises.map((entry) => ({
          exerciseId: entry.exerciseId,
          target: entry,
          sets: [],
        })),
      }
      dispatch({ type: 'START_WORKOUT', payload: draft })
    },
    [dispatch, selectedProgram]
  )

  const startCustomRoutine = useCallback(
    (routine: CustomRoutine) => {
      const draft: WorkoutDraft = {
        programId: 'custom',
        sessionId: routine.id,
        sessionName: routine.name,
        startedAt: new Date().toISOString(),
        exercises: routine.exercises.map((entry) => ({
          exerciseId: entry.exerciseId,
          target: {
            exerciseId: entry.exerciseId,
            sets: entry.sets,
            repMin: entry.repMin,
            repMax: entry.repMax,
            targetRir: 2,
            restSeconds: entry.restSeconds,
          },
          sets: [],
        })),
      }
      dispatch({ type: 'START_WORKOUT', payload: draft })
      setTab('train')
    },
    [dispatch]
  )

  const addSet = useCallback(
    (
      exerciseId: string,
      weightKg: number,
      reps: number,
      rir: number,
      setType: SetType
    ) => {
      if (!state.activeWorkout || reps <= 0 || weightKg < 0) return
      const isPR = checkForPR(state.workouts, exerciseId, weightKg, reps)
      dispatch({
        type: 'ADD_SET',
        payload: { exerciseId, weightKg, reps, rir, setType },
      })
      const exerciseTarget = state.activeWorkout.exercises.find(
        (e) => e.exerciseId === exerciseId
      )?.target
      setRestTimer(exerciseTarget?.restSeconds ?? 90)
      if (isPR) {
        const exName = getExerciseById(exerciseId)?.name ?? exerciseId.replace(/_/g, ' ')
        showToast(
          `NOUVEAU RECORD sur ${exName} ! ${weightKg}kg x ${reps}`,
          'pr'
        )
      } else {
        showToast(`Série ajoutée: ${weightKg}kg x ${reps}`, 'success')
      }
    },
    [dispatch, state.activeWorkout, state.workouts]
  )

  const finishWorkout = useCallback(() => {
    if (!state.activeWorkout) return
    const isCustom = state.activeWorkout.programId === 'custom'
    let sessionName: string
    let programId: string

    if (isCustom) {
      const cr = state.customRoutines.find(
        (r) => r.id === state.activeWorkout!.sessionId
      )
      sessionName =
        cr?.name ?? state.activeWorkout.sessionName ?? 'Séance libre'
      programId = 'custom'
    } else {
      if (!selectedProgram) return
      const activeSession =
        selectedProgram.sessions.find(
          (s) => s.id === state.activeWorkout!.sessionId
        ) ?? nextSession
      if (!activeSession) return
      sessionName = activeSession.name
      programId = selectedProgram.id
    }

    const musclesWorked = new Set<MuscleGroup>()
    state.activeWorkout.exercises.forEach((ex) => {
      if (ex.sets.filter((s) => s.setType !== 'warmup').length > 0) {
        const exData = getExerciseById(ex.exerciseId)
        if (exData) {
          exData.primaryMuscles.forEach((m) => musclesWorked.add(m))
        }
      }
    })

    const workout = {
      id: makeId('workout'),
      date: todayIso(),
      programId,
      sessionId: state.activeWorkout.sessionId,
      sessionName,
      exercises: state.activeWorkout.exercises.filter(
        (e) => e.sets.length > 0
      ),
      durationMinutes: Math.max(
        25,
        Math.round(
          (Date.now() -
            new Date(state.activeWorkout.startedAt).getTime()) /
            60000
        )
      ),
    }

    dispatch({
      type: 'FINISH_WORKOUT',
      payload: { workout, isCustom },
    })
    setRestTimer(0)
    showToast(
      `Séance terminée ! ${workout.durationMinutes} min`,
      'success'
    )

    if (musclesWorked.size > 0) {
      setPendingFeedback({
        workoutId: workout.id,
        muscles: Array.from(musclesWorked),
      })
    } else {
      setTab('home')
    }
  }, [
    state.activeWorkout,
    state.customRoutines,
    selectedProgram,
    nextSession,
    dispatch,
  ])

  const saveFeedback = useCallback(
    (feedback: SessionFeedback) => {
      dispatch({ type: 'SAVE_FEEDBACK', payload: feedback })
      setPendingFeedback(null)
      setTab('home')
      showToast('Feedback sauvegardé', 'success')
    },
    [dispatch]
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!state.profile || !state.targets) {
    return <OnboardingView onComplete={completeOnboarding} />
  }

  return (
    <div className="app-shell">
      <ToastContainer />

      {pendingFeedback && (
        <FeedbackModal
          muscles={pendingFeedback.muscles}
          workoutId={pendingFeedback.workoutId}
          onSave={saveFeedback}
          onSkip={() => {
            setPendingFeedback(null)
            setTab('home')
          }}
        />
      )}

      {tab === 'home' && (
        <HomeView onStartWorkout={startWorkout} />
      )}
      {tab === 'train' && (
        <TrainView
          onStartWorkout={startWorkout}
          onStartSession={startSession}
          onStartCustomRoutine={startCustomRoutine}
          onAddSet={addSet}
          onFinishWorkout={finishWorkout}
          restTimer={restTimer}
          onSkipTimer={() => setRestTimer(0)}
        />
      )}
      {tab === 'nutrition' && <NutritionView />}
      {tab === 'scouter' && <ScouterView />}
      {tab === 'profile' && (
        <ProfileView
          onToggleTheme={() =>
            setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
          }
          theme={theme}
          onNavigate={setTab}
        />
      )}

      <BottomNav tab={tab} onChange={setTab} restTimer={restTimer} />
    </div>
  )
}

// ── App root (wrapped with provider) ─────────────────────────────────────────

function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}

export default App
