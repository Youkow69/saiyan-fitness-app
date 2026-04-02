import { useCallback, useRef, useState } from 'react'
import { useAppState } from '../../context/AppContext'
import {
  getPowerLevel,
  getCurrentTransformationFull,
  getTotalVolume,
  getStreak,
  estimate1Rm,
} from '../../lib'
import { showToast } from '../ui/Toast'

// ── Accent palette per transformation tier ──────────────────────────
const ACCENT_MAP: Record<string, string> = {
  Humain: '#6B7280',
  Guerrier: '#3B82F6',
  'Super Saiyan': '#FACC15',
  'Super Saiyan 2': '#F59E0B',
  'Super Saiyan 3': '#FF8C00',
  'Super Saiyan God': '#EF4444',
  'Super Saiyan Blue': '#06B6D4',
  'Ultra Instinct': '#A78BFA',
}

function getAccent(transformationName: string): string {
  return ACCENT_MAP[transformationName] ?? '#FF8C00'
}

// ── Helpers ─────────────────────────────────────────────────────────
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const LIFT_LABELS: Record<string, string> = {
  barbell_bench_press: 'Bench Press',
  back_squat: 'Back Squat',
  deadlift: 'Deadlift',
  overhead_press: 'Overhead Press',
}

// ── Component ───────────────────────────────────────────────────────
export function SagaCardGenerator() {
  const { state } = useAppState()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewRef = useRef<HTMLImageElement>(null)

  const generateCard = useCallback(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1350
    const ctx = canvas.getContext('2d')!

    const tf = getCurrentTransformationFull(state)
    const powerLevel = getPowerLevel(state)
    const volume = getTotalVolume(state.workouts)
    const streak = getStreak(state)
    const accent = getAccent(tf.current.name)

    // ── Background gradient ──
    const grad = ctx.createLinearGradient(0, 0, 0, 1350)
    grad.addColorStop(0, '#0a0a1a')
    grad.addColorStop(0.4, '#1a0a2e')
    grad.addColorStop(0.7, '#12082a')
    grad.addColorStop(1, '#0a0a1a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1080, 1350)

    // ── Subtle radial glow behind power level ──
    const radial = ctx.createRadialGradient(540, 400, 20, 540, 400, 360)
    radial.addColorStop(0, accent + '22')
    radial.addColorStop(1, 'transparent')
    ctx.fillStyle = radial
    ctx.fillRect(0, 100, 1080, 700)

    // ── Top accent line ──
    ctx.fillStyle = accent
    ctx.fillRect(0, 0, 1080, 5)

    // ── Logo ──
    ctx.fillStyle = accent
    ctx.font = 'bold 40px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('SAIYAN FITNESS', 540, 70)

    // ── Separator line ──
    ctx.strokeStyle = accent + '44'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(200, 110)
    ctx.lineTo(880, 110)
    ctx.stroke()

    // ── Program / Saga name ──
    const program = state.selectedProgramId ? 'Saga en cours' : 'Mode Libre'
    ctx.fillStyle = '#a0a8c0'
    ctx.font = '24px system-ui, sans-serif'
    ctx.fillText(program, 540, 155)

    // ── Transformation name ──
    ctx.fillStyle = '#f0f0f5'
    ctx.font = 'bold 54px system-ui, sans-serif'
    ctx.fillText(tf.current.name, 540, 260)

    // ── Next transformation hint ──
    if (tf.nextTransformation) {
      ctx.fillStyle = '#777'
      ctx.font = '18px system-ui, sans-serif'
      ctx.fillText(`Prochaine forme : ${tf.nextTransformation.name}`, 540, 300)
    }

    // ── Power level (large) ──
    ctx.save()
    ctx.shadowColor = accent
    ctx.shadowBlur = 40
    ctx.fillStyle = accent
    ctx.font = 'bold 108px system-ui, sans-serif'
    ctx.fillText(powerLevel.toLocaleString('fr-FR'), 540, 430)
    ctx.restore()

    ctx.fillStyle = '#a0a8c0'
    ctx.font = '22px system-ui, sans-serif'
    ctx.fillText('POWER LEVEL', 540, 475)

    // ── Stats grid (2x2) ──
    const stats = [
      { label: 'Seances', value: String(state.workouts.length) },
      { label: 'Volume total', value: volume.toLocaleString('fr-FR') + ' kg' },
      { label: 'Records', value: String(
        new Set(
          state.workouts.flatMap(w =>
            w.exercises.flatMap(ex =>
              ex.sets.map(s => `${ex.exerciseId}_${s.weightKg}_${s.reps}`)
            )
          )
        ).size
      ) },
      { label: 'Streak', value: streak + ' jours' },
    ]

    const gridStartY = 540
    const colW = 440
    const rowH = 120
    const gridLeft = 100

    stats.forEach((s, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = gridLeft + col * (colW + 40)
      const y = gridStartY + row * rowH

      // Card background
      ctx.fillStyle = '#ffffff08'
      drawRoundedRect(ctx, x, y, colW, rowH - 16, 16)
      ctx.fill()
      ctx.strokeStyle = '#ffffff12'
      ctx.lineWidth = 1
      drawRoundedRect(ctx, x, y, colW, rowH - 16, 16)
      ctx.stroke()

      // Label
      ctx.fillStyle = '#a0a8c0'
      ctx.font = '20px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(s.label, x + 20, y + 36)

      // Value
      ctx.fillStyle = '#f0f0f5'
      ctx.font = 'bold 30px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(s.value, x + 20, y + 76)
    })

    // ── Top performances ──
    const perfY = gridStartY + rowH * 2 + 40

    ctx.fillStyle = accent
    ctx.font = 'bold 26px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('TOP PERFORMANCES', 540, perfY)

    // Separator
    ctx.strokeStyle = accent + '44'
    ctx.beginPath()
    ctx.moveTo(300, perfY + 16)
    ctx.lineTo(780, perfY + 16)
    ctx.stroke()

    const mainLifts = ['barbell_bench_press', 'back_squat', 'deadlift', 'overhead_press']
    let liftIndex = 0

    mainLifts.forEach((liftId) => {
      let best = 0
      state.workouts.forEach((w) =>
        w.exercises
          .filter((e) => e.exerciseId === liftId)
          .forEach((e) =>
            e.sets.forEach((s) => {
              const e1rm = estimate1Rm(s.weightKg, s.reps)
              if (e1rm > best) best = e1rm
            }),
          ),
      )
      if (best > 0) {
        const y = perfY + 50 + liftIndex * 60
        const label = LIFT_LABELS[liftId] ?? liftId.replace(/_/g, ' ')

        ctx.fillStyle = '#f0f0f5'
        ctx.font = '22px system-ui, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(label, 140, y)

        ctx.fillStyle = accent
        ctx.font = 'bold 26px system-ui, sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(Math.round(best) + ' kg (e1RM)', 940, y)

        liftIndex++
      }
    })

    if (liftIndex === 0) {
      ctx.fillStyle = '#777'
      ctx.font = '20px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Ajoute des seances pour voir tes perfs ici', 540, perfY + 60)
    }

    // ── Bottom accent line ──
    ctx.fillStyle = accent
    ctx.fillRect(0, 1345, 1080, 5)

    // ── Watermark ──
    ctx.fillStyle = '#555'
    ctx.font = '18px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('saiyan.fitness', 540, 1320)

    // ── Date ──
    ctx.fillStyle = '#444'
    ctx.font = '16px system-ui, sans-serif'
    ctx.fillText(new Date().toLocaleDateString('fr-FR'), 540, 1295)

    // ── Generate preview ──
    const previewDataUrl = canvas.toDataURL('image/png')
    setPreviewUrl(previewDataUrl)

    // ── Convert to blob and share / download ──
    canvas.toBlob(
      async (blob) => {
        if (!blob) return
        const file = new File([blob], 'saga-card.png', { type: 'image/png' })

        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'Ma Saga Card' })
            return
          } catch {
            // user cancelled or share failed, fall through to download
          }
        }

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'saga-card.png'
        a.click()
        URL.revokeObjectURL(url)
        showToast('Saga Card telechargee !', 'success')
      },
      'image/png',
    )
  }, [state])

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <h3
        style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '1.1rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          margin: 0,
        }}
      >
        Saga Card
      </h3>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
        Genere une image de tes stats pour la partager sur Instagram, WhatsApp ou ailleurs.
      </p>

      {previewUrl && (
        <img
          ref={previewRef}
          src={previewUrl}
          alt="Saga Card preview"
          style={{
            width: '100%',
            borderRadius: 12,
            border: '1px solid var(--border)',
          }}
        />
      )}

      <button
        onClick={generateCard}
        type="button"
        style={{
          width: '100%',
          padding: 14,
          borderRadius: 12,
          border: 'none',
          background: 'linear-gradient(135deg, #FF8C00, #FF6B00)',
          color: '#000',
          fontWeight: 700,
          fontSize: '0.95rem',
          cursor: 'pointer',
          letterSpacing: '0.02em',
        }}
      >
        {previewUrl ? 'Regenerer ma Saga Card' : 'Generer ma Saga Card'}
      </button>
    </div>
  )
}
