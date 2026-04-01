import { useState, useCallback, useRef } from 'react'

interface ShareData {
  type: 'pr' | 'workout' | 'weekly' | 'transformation' | 'streak'
  title: string
  stats: { label: string; value: string }[]
  accentColor?: string
  transformationName?: string
  powerLevel?: number
}

export function useShareCard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const generateCard = useCallback(async (data: ShareData): Promise<Blob | null> => {
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 400
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const accent = data.accentColor || '#FF8C00'

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 600, 400)
    bgGrad.addColorStop(0, '#0c0c14')
    bgGrad.addColorStop(1, '#16182a')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, 600, 400)

    // Top accent bar
    const topGrad = ctx.createLinearGradient(0, 0, 600, 0)
    topGrad.addColorStop(0, accent)
    topGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = topGrad
    ctx.fillRect(0, 0, 600, 4)

    // Title
    ctx.fillStyle = accent
    ctx.font = '700 12px Manrope, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('SAIYAN FITNESS', 32, 40)

    // Card type
    ctx.fillStyle = '#f0f0f5'
    ctx.font = '800 28px Manrope, sans-serif'
    ctx.fillText(data.title, 32, 80)

    // Stats
    const startY = 120
    data.stats.forEach((stat, i) => {
      const y = startY + i * 60
      ctx.fillStyle = '#a0a8c0'
      ctx.font = '500 13px Manrope, sans-serif'
      ctx.fillText(stat.label, 32, y)
      ctx.fillStyle = '#f0f0f5'
      ctx.font = '800 24px Manrope, sans-serif'
      ctx.fillText(stat.value, 32, y + 28)
    })

    // Power level (right side)
    if (data.powerLevel) {
      ctx.textAlign = 'right'
      ctx.fillStyle = accent
      ctx.font = '700 11px Manrope, sans-serif'
      ctx.fillText('POWER LEVEL', 568, 40)
      ctx.fillStyle = '#f0f0f5'
      ctx.font = '800 36px Manrope, sans-serif'
      ctx.fillText(data.powerLevel.toLocaleString('fr-FR'), 568, 78)
      if (data.transformationName) {
        ctx.fillStyle = '#a0a8c0'
        ctx.font = '500 14px Manrope, sans-serif'
        ctx.fillText(data.transformationName, 568, 100)
      }
    }

    // Bottom bar
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    ctx.fillRect(0, 360, 600, 40)
    ctx.fillStyle = '#a0a8c0'
    ctx.font = '500 11px Manrope, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`Saiyan Fitness — ${new Date().toLocaleDateString('fr-FR')}`, 300, 385)

    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  }, [])

  const share = useCallback(async (data: ShareData) => {
    const blob = await generateCard(data)
    if (!blob) return

    const file = new File([blob], 'saiyan-card.png', { type: 'image/png' })

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: data.title, text: 'Saiyan Fitness' })
        return
      } catch {}
    }

    // Fallback: download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `saiyan-${data.type}-${new Date().toISOString().slice(0, 10)}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, [generateCard])

  return { share, generateCard }
}

export function ShareButton({ data, label }: { data: ShareData; label?: string }) {
  const { share } = useShareCard()
  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    setSharing(true)
    await share(data)
    setSharing(false)
  }

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      type="button"
      style={{
        padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)',
        background: 'rgba(255,140,0,0.08)', color: 'var(--accent)',
        fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
      aria-label={label || 'Partager'}
    >
      {sharing ? '...' : (label || 'Partager')}
    </button>
  )
}
