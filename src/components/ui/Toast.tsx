import { useEffect, useState } from 'react'

interface ToastMessage {
  id: string
  text: string
  type: 'success' | 'error' | 'info' | 'pr'
}

let toastListeners: ((msg: ToastMessage) => void)[] = []

export function showToast(text: string, type: ToastMessage['type'] = 'info') {
  const msg: ToastMessage = {
    id: Math.random().toString(36).slice(2),
    text,
    type,
  }
  toastListeners.forEach((fn) => fn(msg))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const listener = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg])
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== msg.id)),
        3500
      )
    }
    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  }, [])

  if (toasts.length === 0) return null

  const colorMap: Record<ToastMessage['type'], string> = {
    success: '#4fffb0',
    error: '#ff5f76',
    info: '#37b7ff',
    pr: '#ffd700',
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 360,
        width: '90%',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: 'rgba(15,22,35,0.95)',
            border: `1px solid ${colorMap[t.type]}44`,
            borderRadius: 14,
            padding: '12px 16px',
            color: colorMap[t.type],
            fontSize: '0.85rem',
            fontWeight: 700,
            textAlign: 'center',
            animation: 'slideDown 0.3s ease',
            backdropFilter: 'blur(12px)',
            boxShadow: `0 4px 20px ${colorMap[t.type]}22`,
            pointerEvents: 'auto',
          }}
        >
          {t.type === 'pr' && '\u{1F3C6} '}
          {t.text}
        </div>
      ))}
    </div>
  )
}
