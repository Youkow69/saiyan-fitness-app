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
    >
      <div
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
          style={{
            margin: '0 0 8px',
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '1.4rem',
          }}
        >
          {title}
        </h3>
        <p
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
            onClick={onCancel}
            type="button"
            className="ghost-btn"
            style={{ flex: 1, minHeight: 44 }}
          >
            Annuler
          </button>
          <button
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
