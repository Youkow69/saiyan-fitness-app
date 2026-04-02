import React, { useMemo } from 'react'
import type { AppState } from '../../types'
import { getWeeklySetsByMuscle, getVolumeStatus } from '../../lib'
import { SectionTitle } from '../ui/Shared'

interface VolumeDashboardProps {
  state: AppState
}

const statusColors: Record<string, string> = {
  none: 'var(--muted)',
  below_mev: 'var(--accent-red)',
  productive: '#4fffb0',
  high: 'var(--accent-gold)',
  above_mrv: 'var(--accent-red)',
}

const statusLabels: Record<string, string> = {
  none: 'Aucun',
  below_mev: 'Sous MEV',
  productive: 'Productif',
  high: 'Eleve',
  above_mrv: 'Au-dessus MRV',
}

export const VolumeDashboard: React.FC<VolumeDashboardProps> = React.memo(
  function VolumeDashboard({ state }) {
    const volumeTargets = useMemo(
      () => getWeeklySetsByMuscle(state),
      [state.workouts]
    )
    return (
      <section className="hevy-card stack-md">
        <div>
          <SectionTitle icon="📈" label="Volume RP — Landmarks" />
          <p
            style={{
              margin: '2px 0 0',
              fontSize: '0.72rem',
              color: 'var(--muted)',
            }}
          >
            MEV · MAV · MRV
          </p>
        </div>
        <div className="stack-md">
          {volumeTargets.map((vt) => {
            const status = getVolumeStatus(
              vt.currentSets,
              vt.mev,
              vt.mav,
              vt.mrv
            )
            const color = statusColors[status]
            const mrvPct = Math.min(
              100,
              Math.round((vt.currentSets / vt.mrv) * 100)
            )
            return (
              <div
                key={vt.muscle}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  border: `1px solid ${color}22`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <strong style={{ fontSize: '0.82rem' }}>
                      {vt.muscle}
                    </strong>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color,
                        background: `${color}18`,
                        padding: '1px 6px',
                        borderRadius: 5,
                        textTransform: 'uppercase' as const,
                      }}
                    >
                      {statusLabels[status]}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color,
                    }}
                  >
                    {vt.currentSets} séries
                  </span>
                </div>
                <div
                  style={{
                    position: 'relative',
                    height: 8,
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'visible',
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: `${Math.round((vt.mev / vt.mrv) * 100)}%`,
                      top: -2,
                      bottom: -2,
                      width: 2,
                      background: 'rgba(255,95,118,0.6)',
                      borderRadius: 1,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: `${Math.round((vt.mav / vt.mrv) * 100)}%`,
                      top: -2,
                      bottom: -2,
                      width: 2,
                      background: 'rgba(255,200,61,0.6)',
                      borderRadius: 1,
                    }}
                  />
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 4,
                      width: `${mrvPct}%`,
                      background: color,
                      transition: 'width 0.5s ease',
                      opacity: 0.85,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.62rem',
                    color: 'var(--muted)',
                  }}
                >
                  <span>MEV {vt.mev}</span>
                  <span>MAV {vt.mav}</span>
                  <span>MRV {vt.mrv}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    )
  }
)
