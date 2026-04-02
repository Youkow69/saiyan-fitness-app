import { useEffect, useState, useCallback, useRef } from 'react'
import { AppProvider, useAppState } from './context/AppContext'
import { saveState } from './storage'
import { ToastContainer, showToast } from './components/ui/Toast'
import { getExerciseById, getProgramById, makeId, todayIso } from './lib'
import { useAuth } from './hooks/useAuth'
import { useCloudSync } from './hooks/useCloudSync'
import { AuthScreen } from './components/views/AuthScreen'
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

// ── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_REST_SECONDS = 90
const SYNC_INTERVAL_MS = 30000
const CLOUD_SYNC_INTERVAL_MS = 60000

// ── Components ───────────────────────────────────────────────────────────────

import { BottomNav } from './components/layout/BottomNav'
import { FeedbackModal } from './components/workout/FeedbackModal'
import { HomeView } from './components/views/HomeView'
import { TrainView } from './components/views/TrainView'
import { OnboardingView } from './components/views/OnboardingView'
import { NutritionView } from './components/views/NutritionView'
import { CoachView } from './components/views/CoachView'
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

interface AppInnerProps {
  user: ReturnType<typeof useAuth>['user']
  pushToCloud: ReturnType<typeof useCloudSync>['pushToCloud']
  pullFromCloud: ReturnType<typeof useCloudSync>['pullFromCloud']
  syncSteps: ReturnType<typeof useCloudSync>['syncSteps']
  signOut: ReturnType<typeof useAuth>['signOut']
}

function AppInner({ user, pushToCloud, pullFromCloud, syncSteps, signOut }: AppInnerProps) {
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
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const hasPulledRef = useRef(false)

  // Ref to avoid stale closure in sync effects - prevents re-render loops
  const stateRef = useRef(state)
  stateRef.current = state

  // Track last synced values to prevent redundant dispatches
  const lastSyncedValues = useRef<{ steps: number; water: number; sleep: number }>({
    steps: 0,
    water: 0,
    sleep: 0,
  })

  // ── Tab change handler (workout-aware) ──────────────────────────────────────
  const handleTabChange = useCallback((newTab: TabId) => {
    setTab(newTab)
  }, [])

  // ── Cloud sync: pull on first login ────────────────────────────────────────
  useEffect(() => {
    if (!user || hasPulledRef.current) return
    hasPulledRef.current = true

    ;(async () => {
      try {
        setCloudStatus('syncing')
        const cloudState = await pullFromCloud()
        if (cloudState && (cloudState as any).profile) {
          // Cloud has data with a profile -> restore it
          dispatch({ type: 'SET_STATE', payload: cloudState })
          showToast('Données restaurées depuis le cloud', 'success')
          setCloudStatus('synced')
          setLastSyncedAt(new Date().toISOString())
        } else {
          // Cloud is empty (new user) -> reset local state to force onboarding
          // Use the display name from Supabase signup metadata
          const userName = (user as any)?.user_metadata?.display_name || ''
          if (userName && (!stateRef.current.profile || stateRef.current.profile.name === 'Guerrier')) {
            // New user just signed up - clear profile to trigger onboarding
            dispatch({ type: 'SET_STATE', payload: { ...stateRef.current, profile: null, targets: null } })
            showToast('Bienvenue ' + userName + ' ! Configure ton profil.', 'info')
          } else if (stateRef.current.profile) {
            // Existing local user linking to a new account - push their data
            await pushToCloud(stateRef.current)
            showToast('Données locales synchronisées', 'success')
          }
          setCloudStatus('synced')
          setLastSyncedAt(new Date().toISOString())
        }
      } catch {
        setCloudStatus('error')
      }
    })()
  }, [user, pullFromCloud, pushToCloud, dispatch])

  // ── Cloud sync: periodic push ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const interval = setInterval(async () => {
      try {
        setCloudStatus('syncing')
        await pushToCloud(stateRef.current)
        setCloudStatus('synced')
        setLastSyncedAt(new Date().toISOString())
      } catch {
        setCloudStatus('error')
      }
    }, CLOUD_SYNC_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [user, pushToCloud])

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
    const handleUnload = () => saveState(stateRef.current)
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  // Saiyan-steps sync: read tracker data from localStorage
  // FIX: Use stateRef to read current quest progress instead of state directly.
  // This prevents the effect from depending on `state`, which would cause
  // dispatch -> state change -> effect re-run -> dispatch loop.
  useEffect(() => {
    const checkSync = () => {
      try {
        const raw = localStorage.getItem('saiyan_tracker_sync')
        if (!raw) return
        const sync = JSON.parse(raw)
        const today = todayIso()
        if (sync.date !== today) return

        // Read current values from ref (not from state dependency)
        const current = stateRef.current
        const existing = (current.dailyQuestProgress ?? []).find(
          (d: { date: string }) => d.date === today
        )
        const currentSteps = existing?.quests['steps'] ?? 0
        const currentWater = existing?.quests['water'] ?? 0
        const currentSleep = existing?.quests['sleep'] ?? 0

        // Only dispatch if the incoming value actually exceeds the current value
        // AND differs from the last value we synced (prevents duplicate dispatches)
        if (
          sync.steps > 0 &&
          sync.steps > currentSteps &&
          sync.steps !== lastSyncedValues.current.steps
        ) {
          lastSyncedValues.current.steps = sync.steps
          dispatch({
            type: 'UPDATE_QUEST_PROGRESS',
            payload: { questId: 'steps', delta: sync.steps - currentSteps },
          })
        }

        if (
          sync.waterGlasses > 0 &&
          sync.waterGlasses > currentWater &&
          sync.waterGlasses !== lastSyncedValues.current.water
        ) {
          lastSyncedValues.current.water = sync.waterGlasses
          dispatch({
            type: 'UPDATE_QUEST_PROGRESS',
            payload: { questId: 'water', delta: sync.waterGlasses - currentWater },
          })
        }

        if (
          sync.sleepHours > 0 &&
          sync.sleepHours > currentSleep &&
          sync.sleepHours !== lastSyncedValues.current.sleep
        ) {
          lastSyncedValues.current.sleep = sync.sleepHours
          dispatch({
            type: 'UPDATE_QUEST_PROGRESS',
            payload: { questId: 'sleep', delta: sync.sleepHours - currentSleep },
          })
        }

        // Also sync steps to cloud if user is logged in
        if (user && (sync.steps > 0 || sync.sleepHours > 0 || sync.waterGlasses > 0)) {
          syncSteps(today, sync.steps ?? 0, sync.sleepHours ?? 0, sync.waterGlasses ?? 0)
        }
      } catch {
        /* ignore parse errors */
      }
    }
    checkSync()
    const interval = setInterval(checkSync, SYNC_INTERVAL_MS)
    return () => clearInterval(interval)
    // NOTE: dispatch and syncSteps are stable refs from context/hook,
    // user is needed to gate cloud sync. We intentionally do NOT include
    // state here - we read it via stateRef to avoid re-render loops.
  }, [dispatch, user, syncSteps])

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
      // Push to cloud immediately after onboarding
      setTimeout(() => {
        if (user) pushToCloud(stateRef.current)
      }, 500)
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
      if (!stateRef.current.activeWorkout || reps <= 0 || weightKg < 0) return
      const isPR = checkForPR(stateRef.current.workouts, exerciseId, weightKg, reps)
      dispatch({
        type: 'ADD_SET',
        payload: { exerciseId, weightKg, reps, rir, setType },
      })
      const exerciseTarget = stateRef.current.activeWorkout.exercises.find(
        (e) => e.exerciseId === exerciseId
      )?.target
      setRestTimer(exerciseTarget?.restSeconds ?? DEFAULT_REST_SECONDS)

      // Immediate cloud push after adding a set
      if (user) {
        setTimeout(() => pushToCloud(stateRef.current), 300)
      }

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
    [dispatch, user, pushToCloud]
  )

  const finishWorkout = useCallback(() => {
    const activeWorkout = stateRef.current.activeWorkout
    if (!activeWorkout) return

    // Empty workout check
    const validExercises = activeWorkout.exercises.filter((e) => e.sets.length > 0)
    if (validExercises.length === 0) {
      showToast('Aucun exercice enregistré', 'error')
      return
    }

    const isCustom = activeWorkout.programId === 'custom'
    let sessionName: string
    let programId: string

    if (isCustom) {
      const cr = stateRef.current.customRoutines.find(
        (r) => r.id === activeWorkout.sessionId
      )
      sessionName = cr?.name ?? activeWorkout.sessionName ?? 'Séance libre'
      programId = 'custom'
    } else {
      if (!selectedProgram) return
      const activeSession =
        selectedProgram.sessions.find(
          (s) => s.id === activeWorkout.sessionId
        ) ?? nextSession
      if (!activeSession) return
      sessionName = activeSession.name
      programId = selectedProgram.id
    }

    const musclesWorked = new Set<MuscleGroup>()
    activeWorkout.exercises.forEach((ex) => {
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
      sessionId: activeWorkout.sessionId,
      sessionName,
      exercises: activeWorkout.exercises.filter((e) => e.sets.length > 0),
      durationMinutes: Math.max(
        1,
        Math.round(
          (Date.now() - new Date(activeWorkout.startedAt).getTime()) / 60000
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

    // Push to cloud immediately after finishing a workout
    if (user) {
      setTimeout(() => pushToCloud(stateRef.current), 500)
    }

    if (musclesWorked.size > 0) {
      setPendingFeedback({
        workoutId: workout.id,
        muscles: Array.from(musclesWorked),
      })
    } else {
      setTab('home')
    }
  }, [selectedProgram, nextSession, dispatch, user, pushToCloud])

  const saveFeedback = useCallback(
    (feedback: SessionFeedback) => {
      dispatch({ type: 'SAVE_FEEDBACK', payload: feedback })
      setPendingFeedback(null)
      setTab('home')
      showToast('Feedback sauvegardé', 'success')
    },
    [dispatch]
  )

  const handleSignOut = useCallback(async () => {
    // Push final state before signing out
    if (user) {
      try {
        await pushToCloud(stateRef.current)
      } catch {
        /* ignore */
      }
    }
    await signOut()
    localStorage.removeItem('sf_local_mode')
    showToast('Déconnecté', 'success')
  }, [user, pushToCloud, signOut])

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!state.profile || !state.targets) {
    return <OnboardingView onComplete={completeOnboarding} />
  }

  return (
    <div className="app-shell">
      <ToastContainer />

      {/* Floating resume bar when active workout and not on train tab */}
      {state.activeWorkout && tab !== 'train' && (
        <div
          onClick={() => setTab('train')}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 90,
            background: 'linear-gradient(135deg, #FF8C00, #FF6B00)',
            color: '#000',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          <span>
            {'\uD83D\uDCAA'} Séance en cours —{' '}
            {state.activeWorkout.sessionName || 'Entraînement'}
          </span>
          <span style={{ fontSize: '0.75rem' }}>Reprendre {'→'}</span>
        </div>
      )}

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

      {tab === 'home' && <HomeView onStartWorkout={startWorkout} />}
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
        {tab === 'coach' && <CoachView />}
      {tab === 'profile' && (
        <ProfileView
          onToggleTheme={() =>
            setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
          }
          theme={theme}
          onNavigate={handleTabChange}
          cloudUser={user}
          cloudStatus={cloudStatus}
          lastSyncedAt={lastSyncedAt}
          onSignOut={handleSignOut}
          onSyncNow={async () => {
            if (!user) return
            setCloudStatus('syncing')
            try {
              await pushToCloud(stateRef.current)
              setCloudStatus('synced')
              setLastSyncedAt(new Date().toISOString())
              showToast('Synchronisé', 'success')
            } catch {
              setCloudStatus('error')
            }
          }}
        />
      )}

      <BottomNav tab={tab} onChange={handleTabChange} restTimer={restTimer} />
    </div>
  )
}

// ── App root (wrapped with provider + auth) ──────────────────────────────────

function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth()
  const [localMode, setLocalMode] = useState(() =>
    localStorage.getItem('sf_local_mode') === '1'
  )
  const { pushToCloud, pullFromCloud, syncSteps } = useCloudSync(user)

  // Show auth screen if not logged in and not in local mode
  if (!loading && !user && !localMode) {
    return (
      <AuthScreen
        onSignIn={async (email, password) => {
          await signIn(email, password)
        }}
        onSignUp={async (email, password, name) => {
          await signUp(email, password, name)
        }}
        onSkip={() => {
          setLocalMode(true)
          localStorage.setItem('sf_local_mode', '1')
        }}
        loading={loading}
      />
    )
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg, #0c0c14)',
          color: 'var(--text, #f0f0f5)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>{'\u26A1'}</div>
          <p
            style={{
              color: 'var(--text-secondary, #a0a8c0)',
              fontSize: '0.9rem',
            }}
          >
            Chargement...
          </p>
        </div>
      </div>
    )
  }

  return (
    <AppProvider>
      <AppInner
        user={user}
        pushToCloud={pushToCloud}
        pullFromCloud={pullFromCloud}
        syncSteps={syncSteps}
        signOut={signOut}
      />
    </AppProvider>
  )
}

export default App
