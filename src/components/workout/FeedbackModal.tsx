import React, { useState } from 'react'
import type { MuscleGroup, SessionFeedback } from '../../types'
import { todayIso } from '../../lib'

type FeedbackEntry = {
  pump: 1 | 2 | 3 | 4 | 5
  soreness: 1 | 2 | 3 | 4 | 5
  performance: 'worse' | 'same' | 'better'
  jointPain: boolean
}

interface FeedbackModalProps {
  muscles: MuscleGroup[]
  workoutId: string
  onSave: (feedback: SessionFeedback) => void
  onSkip: () => void
}

export const FeedbackModal: React.FC<FeedbackModalProps> = React.memo(
  function FeedbackModal({ muscles, workoutId, onSave, onSkip }) {
    const initEntries: Record<string, FeedbackEntry> = {}
    muscles.forEach((m) => {
      initEntries[m] = {
        pump: 3,
        soreness: 2,
        performance: 'same',
        jointPain: false,
      }
    })
    const [entries, setEntries] =
      useState<Record<string, FeedbackEntry>>(initEntries)

    const set = (muscle: string, key: keyof FeedbackEntry, val: unknown) => {
      setEntries((prev) => ({
        ...prev,
        [muscle]: { ...prev[muscle], [key]: val },
      }))
    }

    const ratingCircles = (muscle: string, key: 'pump' | 'soreness') => (
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => set(muscle, key, n as 1 | 2 | 3 | 4 | 5)}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid',
              borderColor:
                entries[muscle][key] >= n
                  ? 'var(--accent-gold)'
                  : 'var(--stroke)',
              background:
                entries[muscle][key] >= n
                  ? 'rgba(255,200,61,0.2)'
                  : 'transparent',
              color:
                entries[muscle][key] >= n
                  ? 'var(--accent-gold)'
                  : 'var(--muted)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {n}
          </button>
        ))}
      </div>
    )

    const handleSave = () => {
      const feedback: SessionFeedback = {
        date: todayIso(),
        workoutId,
        muscleGroups: muscles.map((m) => ({ muscle: m, ...entries[m] })),
      }
      onSave(feedback)
    }

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-end',
          padding: 0,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 480,
            margin: '0 auto',
            background: 'var(--bg-elev)',
            borderRadius: '20px 20px 0 0',
            border: '1px solid var(--stroke)',
            borderBottom: 'none',
            maxHeight: '80vh',
            overflow: 'auto',
            padding: '20px 16px 32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <div>
              <span className="eyebrow">Feedback post-seance</span>
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '1.6rem',
                }}
              >
                Ressenti RP
              </h3>
            </div>
            <button
              className="ghost-btn"
              style={{ minHeight: 36, padding: '4px 12px' }}
              onClick={onSkip}
              type="button"
            >
              Passer
            </button>
          </div>
          <div className="stack-md">
            {muscles.map((muscle) => (
              <div
                key={muscle}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 14,
                  padding: '14px',
                  border: '1px solid var(--stroke)',
                }}
              >
                <strong
                  style={{
                    fontSize: '0.9rem',
                    display: 'block',
                    marginBottom: 10,
                  }}
                >
                  {muscle}
                </strong>
                <div className="stack-md" style={{ gap: 10 }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--muted)',
                        display: 'block',
                        marginBottom: 6,
                      }}
                    >
                      PUMP (1=aucun, 5=extreme)
                    </span>
                    {ratingCircles(muscle, 'pump')}
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--muted)',
                        display: 'block',
                        marginBottom: 6,
                      }}
                    >
                      COURBATURES (1=aucune, 5=intense)
                    </span>
                    {ratingCircles(muscle, 'soreness')}
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--muted)',
                        display: 'block',
                        marginBottom: 8,
                      }}
                    >
                      PERFORMANCE VS DERNIERE FOIS
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['worse', 'same', 'better'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => set(muscle, 'performance', p)}
                          style={{
                            flex: 1,
                            padding: '8px 4px',
                            borderRadius: 10,
                            border: '1px solid',
                            borderColor:
                              entries[muscle].performance === p
                                ? 'var(--accent-gold)'
                                : 'var(--stroke)',
                            background:
                              entries[muscle].performance === p
                                ? 'rgba(255,200,61,0.15)'
                                : 'transparent',
                            color:
                              entries[muscle].performance === p
                                ? 'var(--accent-gold)'
                                : 'var(--muted)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {p === 'worse'
                            ? 'Moins bien'
                            : p === 'same'
                              ? 'Pareil'
                              : 'Mieux'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--muted)',
                        flex: 1,
                      }}
                    >
                      Douleur articulaire ?
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        set(muscle, 'jointPain', !entries[muscle].jointPain)
                      }
                      style={{
                        padding: '6px 14px',
                        borderRadius: 10,
                        border: '1px solid',
                        borderColor: entries[muscle].jointPain
                          ? 'var(--accent-red)'
                          : 'var(--stroke)',
                        background: entries[muscle].jointPain
                          ? 'rgba(255,95,118,0.15)'
                          : 'transparent',
                        color: entries[muscle].jointPain
                          ? 'var(--accent-red)'
                          : 'var(--muted)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {entries[muscle].jointPain ? 'Oui' : 'Non'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="primary-btn"
            style={{ width: '100%', marginTop: 16 }}
            onClick={handleSave}
            type="button"
          >
            Sauvegarder le feedback
          </button>
        </div>
      </div>
    )
  }
)
