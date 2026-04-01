import { useEffect, useRef, useCallback } from 'react'

interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  confirmColor?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  confirmColor = 'var(--accent-red)',
  onConfirm,
  onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelBtnRef = useRef<HTMLButtonElement>(null)
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  // Auto-focus first button on open
  useEffect(() => {
    if (isOpen && cancelBtnRef.current) {
      cancelBtnRef.current.focus()
    }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  // Focus trap on Tab key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (!focusable || focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-elev)',
          border: '1px solid var(--stroke)',
          borderRadius: 20,
          padding: '24px 20px',
          maxWidth: 340,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <h3
          id="confirm-title"
          style={{
            margin: '0 0 8px',
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '1.4rem',
          }}
        >
          {title}
        </h3>
        <p
          id="confirm-desc"
          style={{
            margin: '0 0 20px',
            color: 'var(--muted)',
            fontSize: '0.85rem',
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            ref={cancelBtnRef}
            onClick={onCancel}
            type="button"
            className="ghost-btn"
            style={{ flex: 1, minHeight: 44 }}
          >
            Annuler
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            type="button"
            style={{
              flex: 1,
              minHeight: 44,
              border: 'none',
              borderRadius: 12,
              background: confirmColor,
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
