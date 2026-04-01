import { Component, StrictMode } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  state = { hasError: false, error: undefined as Error | undefined }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#fff', background: '#0a0a0f', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem' }}>Oups ! Erreur critique</h1>
          <p style={{ color: '#98a7c2', maxWidth: 360 }}>L'app a rencontre un probleme. Tes donnees sont sauvegardees.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#06090f', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
              Recharger l'app
            </button>
            <button onClick={() => {
              const input = window.prompt('ATTENTION : Ceci supprimera TOUTES tes donn\u00e9es. Tape SUPPRIMER pour confirmer :')
              if (input === 'SUPPRIMER') {
                localStorage.removeItem('saiyan-fitness-v1')
                window.location.reload()
              }
            }} style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(255,95,118,0.4)', background: 'rgba(255,95,118,0.1)', color: '#ff5f76', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
              Reset complet
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
