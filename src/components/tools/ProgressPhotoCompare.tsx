// src/components/tools/ProgressPhotoCompare.tsx
// Side-by-side comparison of progress photos

import { useState } from 'react'
import { useAppState } from '../../context/AppContext'

interface Photo {
  date: string
  url: string
  category: 'front' | 'back' | 'side_left' | 'side_right'
  weightKg?: number
}

const CATEGORIES = [
  { id: 'front', label: 'Face', emoji: '\U0001f9cd' },
  { id: 'back', label: 'Dos', emoji: '\U0001f9cd\u200d\u2642\ufe0f' },
  { id: 'side_left', label: 'Gauche', emoji: '\u2b05' },
  { id: 'side_right', label: 'Droite', emoji: '\u27a1' },
]

export function ProgressPhotoCompare() {
  const { state } = useAppState()
  const [selectedCategory, setSelectedCategory] = useState<string>('front')
  const [beforeIdx, setBeforeIdx] = useState(0)
  const [afterIdx, setAfterIdx] = useState(-1)

  // Get photos from state (stored as base64 or URLs)
  const photos: Photo[] = ((state as any).progressPhotos || [])
    .filter((p: Photo) => p.category === selectedCategory)
    .sort((a: Photo, b: Photo) => a.date.localeCompare(b.date))

  if (photos.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>{'\U0001f4f8'}</div>
        <p style={{ fontSize: '0.82rem' }}>Ajoute au moins 2 photos pour comparer ta progression</p>
      </div>
    )
  }

  const beforePhoto = photos[beforeIdx] || photos[0]
  const afterPhoto = afterIdx < 0 ? photos[photos.length - 1] : photos[afterIdx]

  return (
    <div>
      {/* Category selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, justifyContent: 'center' }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} type="button"
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '6px 12px', borderRadius: 8,
              border: selectedCategory === cat.id ? '2px solid #FFD700' : '1px solid var(--border)',
              background: selectedCategory === cat.id ? 'rgba(255,215,0,0.1)' : 'transparent',
              color: selectedCategory === cat.id ? '#FFD700' : 'var(--text-secondary)',
              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
            }}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 4 }}>AVANT</div>
          <div style={{
            aspectRatio: '3/4', borderRadius: 12, overflow: 'hidden',
            background: 'var(--bg-card)', border: '2px solid rgba(255,68,68,0.3)',
          }}>
            {beforePhoto.url && <img src={beforePhoto.url} alt="Avant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            {beforePhoto.date} {beforePhoto.weightKg ? '| ' + beforePhoto.weightKg + 'kg' : ''}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 4 }}>APR\u00c8S</div>
          <div style={{
            aspectRatio: '3/4', borderRadius: 12, overflow: 'hidden',
            background: 'var(--bg-card)', border: '2px solid rgba(57,255,20,0.3)',
          }}>
            {afterPhoto.url && <img src={afterPhoto.url} alt="Apr\u00e8s" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            {afterPhoto.date} {afterPhoto.weightKg ? '| ' + afterPhoto.weightKg + 'kg' : ''}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginTop: 12, padding: '4px 0' }}>
        {photos.map((p, i) => (
          <button key={i} type="button"
            onClick={() => i < photos.length / 2 ? setBeforeIdx(i) : setAfterIdx(i)}
            style={{
              minWidth: 40, height: 40, borderRadius: 6, overflow: 'hidden',
              border: (i === beforeIdx || i === (afterIdx < 0 ? photos.length - 1 : afterIdx))
                ? '2px solid #FFD700' : '1px solid var(--border)',
              cursor: 'pointer', padding: 0, background: 'var(--bg-card)',
            }}>
            {p.url ? <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
              <span style={{ fontSize: '0.6rem' }}>{p.date.slice(5)}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
