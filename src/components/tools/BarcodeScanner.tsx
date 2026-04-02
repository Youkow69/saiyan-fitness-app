import { useState, useRef, useCallback, useEffect } from 'react'

interface BarcodeScannerProps {
  onDetected: (code: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(true)
  const detectedRef = useRef(false)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        // Use BarcodeDetector if available (Chrome mobile)
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
          })
          intervalId = setInterval(async () => {
            if (!videoRef.current || detectedRef.current || !scanning) return
            try {
              const barcodes = await detector.detect(videoRef.current)
              if (barcodes.length > 0 && !detectedRef.current) {
                detectedRef.current = true
                setScanning(false)
                stopCamera()
                onDetected(barcodes[0].rawValue)
              }
            } catch {}
          }, 300)
        } else {
          setError('Ton navigateur ne supporte pas le scan. Utilise Chrome sur mobile.')
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.name === 'NotAllowedError'
            ? "Autorise l'acc\u00e8s \u00e0 la cam\u00e9ra dans les param\u00e8tres."
            : "Impossible d'acc\u00e9der \u00e0 la cam\u00e9ra.")
        }
      }
    }

    startCamera()

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
      stopCamera()
    }
  }, [onDetected, stopCamera, scanning])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
      zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        position: 'relative', width: '100%', maxWidth: 400,
        borderRadius: 16, overflow: 'hidden', background: '#000',
      }}>
        <video
          ref={videoRef}
          style={{ width: '100%', display: 'block' }}
          playsInline
          muted
        />
        {/* Scan overlay */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: '70%', height: 120, border: '2px solid var(--accent-orange)',
            borderRadius: 8, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
          }} />
        </div>
        {scanning && !error && (
          <div style={{
            position: 'absolute', bottom: 16, left: 0, right: 0,
            textAlign: 'center', color: '#fff', fontSize: '0.82rem',
          }}>
            Scanne un code-barres...
          </div>
        )}
      </div>

      {error && (
        <p style={{ color: 'var(--accent-red)', marginTop: 16, fontSize: '0.85rem', textAlign: 'center' }}>
          {error}
        </p>
      )}

      <button
        onClick={() => { stopCamera(); onClose() }}
        type="button"
        style={{
          marginTop: 20, padding: '12px 32px', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
          color: '#fff', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
        }}
      >
        Fermer
      </button>
    </div>
  )
}
