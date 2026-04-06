import { useState, useCallback, useRef } from 'react'
import { todayIso, makeId } from '../../lib'

interface ProgressPhoto {
  id: string
  date: string
  dataUrl: string // compressed base64
  note?: string
}

const PHOTOS_KEY = 'saiyan-progrèss-photos'
const MAX_PHOTOS = 52 // ~1 per week for a year
const TARGET_WIDTH = 400 // compress to this width

function loadPhotos(): ProgressPhoto[] {
  try {
    const raw = localStorage.getItem(PHOTOS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function savePhotos(photos: ProgressPhoto[]) {
  try {
    localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos))
  } catch (e) {
    console.warn('[Saiyan] Photos storage error:', e)
  }
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = TARGET_WIDTH / img.width
      canvas.width = TARGET_WIDTH
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export function ProgressPhotos() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>(loadPhotos)
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareIdx, setCompareIdx] = useState<[number, number]>([0, 0])
  const inputRef = useRef<HTMLInputElement>(null)

  const addPhoto = useCallback(async (file: File) => {
    const dataUrl = await compressImage(file)
    const photo: ProgressPhoto = {
      id: makeId(),
      date: todayIso(),
      dataUrl,
    }
    const updated = [photo, ...photos].slice(0, MAX_PHOTOS)
    setPhotos(updated)
    savePhotos(updated)
  }, [photos])

  const deletePhoto = useCallback((id: string) => {
    const updated = photos.filter(p => p.id !== id)
    setPhotos(updated)
    savePhotos(updated)
    setSelectedPhoto(null)
  }, [photos])

    const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const filteredPhotos = categoryFilter === 'all' ? photos : photos.filter(p => (p as any).category === categoryFilter)

return (
    <>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {['all', 'front', 'back', 'side_left', 'side_right'].map(cat => (
            <button key={cat} type="button" onClick={() => setCategoryFilter(cat)}
              style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: categoryFilter === cat ? 'var(--accent)' : 'transparent', color: categoryFilter === cat ? '#000' : 'var(--text-secondary)', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer' }}>
              {cat === 'all' ? 'Tous' : cat === 'front' ? 'Face' : cat === 'back' ? 'Dos' : cat === 'side_left' ? 'Gauche' : 'Droite'}
            </button>
          ))}
        </div>
        <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--accent)' }}>
          Photos de progression
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          {photos.length >= 2 && (
            <button onClick={() => setCompareMode(!compareMode)} type="button" style={{
              padding: '4px 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: compareMode ? 'var(--accent)' : 'transparent',
              color: compareMode ? '#000' : 'var(--text-secondary)',
              fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
            }}>
              {compareMode ? 'Fermer' : 'Comparer'}
            </button>
          )}
          <button onClick={() => inputRef.current?.click()} type="button" style={{
            padding: '4px 12px', borderRadius: 8, border: '1px solid var(--accent)',
            background: 'rgba(255,140,0,0.1)', color: 'var(--accent)',
            fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
          }}>
            + Photo
          </button>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) addPhoto(f); e.target.value = '' }} />

      {compareMode && photos.length >= 2 ? (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <select value={compareIdx[0]} onChange={e => setCompareIdx([Number(e.target.value), compareIdx[1]])}
              style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: '0.8rem' }}>
              {photos.map((p, i) => <option key={p.id} value={i}>{p.date}</option>)}
            </select>
            <select value={compareIdx[1]} onChange={e => setCompareIdx([compareIdx[0], Number(e.target.value)])}
              style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: '0.8rem' }}>
              {photos.map((p, i) => <option key={p.id} value={i}>{p.date}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <img src={photos[compareIdx[0]]?.dataUrl} alt="Avant" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', aspectRatio: '3/4' }} />
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>{photos[compareIdx[0]]?.date}</div>
            </div>
            <div>
              <img src={photos[compareIdx[1]]?.dataUrl} alt="Après" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', aspectRatio: '3/4' }} />
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>{photos[compareIdx[1]]?.date}</div>
            </div>
          </div>
        </div>
      ) : photos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Prends ta premiere photo pour suivre ta transformation !
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {photos.map(p => (
            <div key={p.id} onClick={() => setSelectedPhoto(p)} style={{ cursor: 'pointer', position: 'relative' }}>
              <img src={p.dataUrl} alt={p.date} style={{ width: '100%', borderRadius: 10, objectFit: 'cover', aspectRatio: '3/4' }} />
              <div style={{ position: 'absolute', bottom: 4, left: 4, right: 4, textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                {p.date}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPhoto && !compareMode && (
        <div onClick={() => setSelectedPhoto(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <img src={selectedPhoto.dataUrl} alt={selectedPhoto.date} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 16 }} />
          <div style={{ color: '#fff', marginTop: 12, fontSize: '0.9rem', fontWeight: 600 }}>{selectedPhoto.date}</div>
          <button onClick={e => { e.stopPropagation(); deletePhoto(selectedPhoto.id) }} type="button" style={{
            marginTop: 12, padding: '8px 20px', borderRadius: 10, border: '1px solid #ef4444',
            background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700, cursor: 'pointer',
          }}>
            Supprimer
          </button>
        </div>
      )}
    </div>
    </>
  )
}
