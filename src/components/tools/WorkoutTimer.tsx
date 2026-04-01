import { useState, useEffect, useRef, useCallback } from 'react'

type TimerMode = 'stopwatch' | 'countdown' | 'emom' | 'tabata' | 'custom'

interface TimerPhase {
  label: string
  duration: number
  color: string
  isWork: boolean
}

const MODES: { id: TimerMode; label: string; icon: string }[] = [
  { id: 'stopwatch', label: 'Chronometre', icon: '⏱️' },
  { id: 'countdown', label: 'Decompte', icon: '⏳' },
  { id: 'emom', label: 'EMOM', icon: '🔁' },
  { id: 'tabata', label: 'Tabata', icon: '🔥' },
  { id: 'custom', label: 'Intervalles', icon: '⚡' },
]

const KI_FRAMES = ['◐', '◑', '◒', '◓']

function formatTime(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60)
  const s = Math.abs(seconds) % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function CountdownRing({
  progress,
  color,
  size = 240,
}: {
  progress: number
  color: string
  size?: number
}) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)))

  return (
    <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={8}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s' }}
      />
    </svg>
  )
}

function KiChargeAnimation({ active }: { active: boolean }) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!active) return
    const iv = setInterval(() => setFrame((f) => (f + 1) % KI_FRAMES.length), 200)
    return () => clearInterval(iv)
  }, [active])

  if (!active) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * 60 + frame * 30) % 360
        const rad = (angle * Math.PI) / 180
        const dist = 90 + Math.sin(frame * 0.5 + i) * 15
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: `hsl(${40 + i * 10}, 100%, ${60 + frame * 5}%)`,
              boxShadow: `0 0 10px hsl(${40 + i * 10}, 100%, 60%)`,
              left: `calc(50% + ${Math.cos(rad) * dist}px - 3px)`,
              top: `calc(50% + ${Math.sin(rad) * dist}px - 3px)`,
              opacity: 0.8,
              transition: 'all 0.2s',
            }}
          />
        )
      })}
    </div>
  )
}

function useAudioBeep() {
  const ctxRef = useRef<AudioContext | null>(null)

  const beep = useCallback((freq: number = 880, duration: number = 150) => {
    try {
      if (!ctxRef.current) ctxRef.current = new AudioContext()
      const ctx = ctxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration / 1000)
    } catch {
      // Audio not available
    }
  }, [])

  const beepCountdown = useCallback(() => beep(660, 100), [beep])
  const beepStart = useCallback(() => beep(1200, 300), [beep])
  const beepEnd = useCallback(() => {
    beep(440, 200)
    setTimeout(() => beep(440, 200), 250)
  }, [beep])

  return { beepCountdown, beepStart, beepEnd }
}

export function WorkoutTimer() {
  const [mode, setMode] = useState<TimerMode>('stopwatch')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [countdownSet, setCountdownSet] = useState(180)
  const [emomMinutes, setEmomMinutes] = useState(10)
  const [customWork, setCustomWork] = useState(40)
  const [customRest, setCustomRest] = useState(20)
  const [customRounds, setCustomRounds] = useState(8)
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0)
  const [phaseElapsed, setPhaseElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { beepCountdown, beepStart, beepEnd } = useAudioBeep()

  const getPhases = useCallback((): TimerPhase[] => {
    switch (mode) {
      case 'tabata': {
        const phases: TimerPhase[] = []
        for (let i = 0; i < 8; i++) {
          phases.push({
            label: `Travail ${i + 1}/8`,
            duration: 20,
            color: '#e53e3e',
            isWork: true,
          })
          phases.push({
            label: `Repos ${i + 1}/8`,
            duration: 10,
            color: '#38a169',
            isWork: false,
          })
        }
        return phases
      }
      case 'emom': {
        const phases: TimerPhase[] = []
        for (let i = 0; i < emomMinutes; i++) {
          phases.push({
            label: `Minute ${i + 1}/${emomMinutes}`,
            duration: 60,
            color: '#ed8936',
            isWork: true,
          })
        }
        return phases
      }
      case 'custom': {
        const phases: TimerPhase[] = []
        for (let i = 0; i < customRounds; i++) {
          phases.push({
            label: `Travail ${i + 1}/${customRounds}`,
            duration: customWork,
            color: '#e53e3e',
            isWork: true,
          })
          if (i < customRounds - 1 || customRest > 0) {
            phases.push({
              label: `Repos ${i + 1}/${customRounds}`,
              duration: customRest,
              color: '#38a169',
              isWork: false,
            })
          }
        }
        return phases
      }
      case 'countdown':
        return [
          {
            label: 'Decompte',
            duration: countdownSet,
            color: '#3182ce',
            isWork: true,
          },
        ]
      default:
        return []
    }
  }, [mode, countdownSet, emomMinutes, customWork, customRest, customRounds])

  const phases = getPhases()
  const currentPhase = phases[currentPhaseIdx] || null
  const totalDuration = phases.reduce((s, p) => s + p.duration, 0)

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      if (mode === 'stopwatch') {
        setElapsed((e) => e + 1)
      } else {
        setPhaseElapsed((pe) => {
          const newPe = pe + 1
          const phase = phases[currentPhaseIdx]
          if (!phase) {
            setRunning(false)
            return pe
          }
          if (phase.duration - newPe === 3) beepCountdown()
          if (phase.duration - newPe === 2) beepCountdown()
          if (phase.duration - newPe === 1) beepCountdown()

          if (newPe >= phase.duration) {
            const nextIdx = currentPhaseIdx + 1
            if (nextIdx >= phases.length) {
              beepEnd()
              setRunning(false)
              return pe
            }
            beepStart()
            setCurrentPhaseIdx(nextIdx)
            return 0
          }
          return newPe
        })
        setElapsed((e) => e + 1)
      }
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, mode, currentPhaseIdx, phases, beepCountdown, beepStart, beepEnd])

  const handleReset = () => {
    setRunning(false)
    setElapsed(0)
    setCurrentPhaseIdx(0)
    setPhaseElapsed(0)
  }

  const handleStartStop = () => {
    if (!running && elapsed === 0 && mode !== 'stopwatch') {
      setCurrentPhaseIdx(0)
      setPhaseElapsed(0)
      beepStart()
    }
    setRunning(!running)
  }

  const displayTime =
    mode === 'stopwatch'
      ? formatTime(elapsed)
      : currentPhase
        ? formatTime(currentPhase.duration - phaseElapsed)
        : formatTime(0)

  const ringProgress =
    mode === 'stopwatch'
      ? 0
      : currentPhase
        ? phaseElapsed / currentPhase.duration
        : 0

  const ringColor =
    mode === 'stopwatch' ? '#ed8936' : currentPhase ? currentPhase.color : '#ed8936'

  const isWorkPhase = currentPhase?.isWork ?? false
  const ringSize = 240

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: 10,
    border: active ? '2px solid #ed8936' : '2px solid transparent',
    background: active ? 'rgba(237,137,54,0.15)' : '#16213e',
    color: active ? '#ed8936' : '#a0aec0',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: active ? 700 : 400,
    transition: 'all 0.2s',
    textAlign: 'center' as const,
  })

  const inputStyle: React.CSSProperties = {
    width: 70,
    padding: '8px 10px',
    borderRadius: 8,
    border: '2px solid #2d3748',
    background: '#16213e',
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: 600,
    textAlign: 'center',
    outline: 'none',
  }

  return (
    <div
      style={{
        background: '#1a1a2e',
        borderRadius: 16,
        padding: 24,
        maxWidth: 500,
        margin: '0 auto',
        color: '#e2e8f0',
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          margin: '0 0 20px',
          fontSize: 22,
          background: 'linear-gradient(135deg, #f6ad55, #ed8936)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Minuteur d&apos;Entrainement
      </h2>

      {/* Mode selector */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 20,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              if (!running) {
                setMode(m.id)
                handleReset()
              }
            }}
            style={btnStyle(mode === m.id)}
          >
            {m.icon}
            <br />
            {m.label}
          </button>
        ))}
      </div>

      {/* Settings for specific modes */}
      {!running && elapsed === 0 && mode === 'countdown' && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20, alignItems: 'center' }}>
          <label style={{ fontSize: 13, color: '#a0aec0' }}>Duree (sec):</label>
          <input
            type="number"
            min={5}
            value={countdownSet}
            onChange={(e) => setCountdownSet(Number(e.target.value))}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            {[60, 90, 120, 180, 300].map((v) => (
              <button
                key={v}
                onClick={() => setCountdownSet(v)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: 'none',
                  background: countdownSet === v ? '#ed8936' : '#2d3748',
                  color: countdownSet === v ? '#1a202c' : '#a0aec0',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {v >= 60 ? `${v / 60}m` : `${v}s`}
              </button>
            ))}
          </div>
        </div>
      )}

      {!running && elapsed === 0 && mode === 'emom' && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20, alignItems: 'center' }}>
          <label style={{ fontSize: 13, color: '#a0aec0' }}>Minutes:</label>
          <input
            type="number"
            min={1}
            max={60}
            value={emomMinutes}
            onChange={(e) => setEmomMinutes(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
      )}

      {!running && elapsed === 0 && mode === 'custom' && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <label style={{ fontSize: 11, color: '#a0aec0', display: 'block', marginBottom: 4 }}>
              Travail (s)
            </label>
            <input
              type="number"
              min={5}
              value={customWork}
              onChange={(e) => setCustomWork(Number(e.target.value))}
              style={inputStyle}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <label style={{ fontSize: 11, color: '#a0aec0', display: 'block', marginBottom: 4 }}>
              Repos (s)
            </label>
            <input
              type="number"
              min={0}
              value={customRest}
              onChange={(e) => setCustomRest(Number(e.target.value))}
              style={inputStyle}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <label style={{ fontSize: 11, color: '#a0aec0', display: 'block', marginBottom: 4 }}>
              Rounds
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={customRounds}
              onChange={(e) => setCustomRounds(Number(e.target.value))}
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {/* Timer display */}
      <div
        style={{
          position: 'relative',
          width: ringSize,
          height: ringSize,
          margin: '0 auto 20px',
        }}
      >
        <CountdownRing progress={ringProgress} color={ringColor} size={ringSize} />
        <KiChargeAnimation active={running && isWorkPhase} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              color: ringColor,
              textShadow: running ? `0 0 20px ${ringColor}` : 'none',
              transition: 'color 0.3s, text-shadow 0.3s',
            }}
          >
            {displayTime}
          </div>
          {currentPhase && mode !== 'stopwatch' && (
            <div style={{ fontSize: 13, color: '#a0aec0', marginTop: 4 }}>
              {currentPhase.label}
            </div>
          )}
          {mode !== 'stopwatch' && totalDuration > 0 && (
            <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>
              Total: {formatTime(totalDuration)}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          onClick={handleStartStop}
          style={{
            padding: '14px 32px',
            borderRadius: 12,
            border: 'none',
            background: running
              ? 'linear-gradient(135deg, #e53e3e, #c53030)'
              : 'linear-gradient(135deg, #38a169, #2f855a)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            minWidth: 120,
            transition: 'all 0.2s',
            boxShadow: running ? '0 0 20px rgba(229,62,62,0.3)' : '0 0 20px rgba(56,161,105,0.3)',
          }}
        >
          {running ? 'Pause' : elapsed > 0 ? 'Reprendre' : 'Demarrer'}
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '14px 24px',
            borderRadius: 12,
            border: '2px solid #4a5568',
            background: 'transparent',
            color: '#a0aec0',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Reinitialiser
        </button>
      </div>

      {/* Phase progress bar for interval modes */}
      {mode !== 'stopwatch' && phases.length > 1 && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              display: 'flex',
              height: 8,
              borderRadius: 4,
              overflow: 'hidden',
              background: '#2d3748',
            }}
          >
            {phases.map((phase, i) => (
              <div
                key={i}
                style={{
                  flex: phase.duration,
                  background:
                    i < currentPhaseIdx
                      ? phase.color
                      : i === currentPhaseIdx
                        ? `linear-gradient(90deg, ${phase.color} ${(phaseElapsed / phase.duration) * 100}%, rgba(255,255,255,0.1) ${(phaseElapsed / phase.duration) * 100}%)`
                        : 'rgba(255,255,255,0.05)',
                  transition: 'background 0.3s',
                  borderRight: i < phases.length - 1 ? '1px solid #1a1a2e' : 'none',
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
              fontSize: 11,
              color: '#718096',
            }}
          >
            <span>
              Phase {currentPhaseIdx + 1}/{phases.length}
            </span>
            <span>
              Ecou: {formatTime(elapsed)} / {formatTime(totalDuration)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
