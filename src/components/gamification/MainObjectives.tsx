import React, { useMemo } from 'react'
import type { AppState } from '../../types'
import { generateMainObjectives } from '../../lib'
import { SectionTitle } from '../ui/Shared'

interface MainObjectivesPanelProps {
  state: AppState
}

export const MainObjectivesPanel: React.FC<MainObjectivesPanelProps> = React.memo(
  function MainObjectivesPanel({ state }) {
    const objectives = useMemo(
      () => generateMainObjectives(state),
      [state.workouts, state.bodyweightEntries, state.targets, state.foodEntries, state.profile]
    )
    if (objectives.length === 0) return null
    return (
      <section className="hevy-card stack-md">
        <SectionTitle icon="🎯" label="Objectifs principaux" />
        <div className="stack-md">
          {objectives.map((obj) => {
            const totalM = obj.milestones.length
            const doneM = obj.milestones.filter(
              (m) => m.check(state) >= m.target
            ).length
            const pct = Math.round((doneM / totalM) * 100)
            return (
              <div
                key={obj.id}
                className={`quest-card ${obj.completed ? 'completed' : ''}`}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>{obj.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <strong
                        style={{
                          fontSize: '0.9rem',
                          color: obj.completed
                            ? '#ffd700'
                            : 'var(--text)',
                        }}
                      >
                        {obj.name}
                      </strong>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--muted)',
                        }}
                      >
                        {doneM}/{totalM}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: '0.75rem',
                        color: 'var(--muted)',
                      }}
                    >
                      {obj.description}
                    </p>
                  </div>
                </div>
                <div
                  className="quest-progress-bar"
                  style={{ marginBottom: 8 }}
                >
                  <div
                    className="quest-progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: obj.completed
                        ? 'linear-gradient(90deg,#ffd700,#ffaa00)'
                        : 'linear-gradient(90deg,#37b7ff,#4fffb0)',
                    }}
                  />
                </div>
                <div className="stack-md" style={{ gap: 5 }}>
                  {obj.milestones.map((m, idx) => {
                    const cur = m.check(state)
                    const done = cur >= m.target
                    const mp = Math.min(
                      100,
                      Math.round((cur / m.target) * 100)
                    )
                    return (
                      <div key={idx} style={{ opacity: done ? 1 : 0.65 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 2,
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: done
                                ? '#ffd700'
                                : 'var(--muted)',
                            }}
                          >
                            {done ? '✓ ' : ''}
                            {m.description}
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--muted)',
                            }}
                          >
                            {Math.min(
                              cur,
                              m.target
                            ).toLocaleString()}
                            /{m.target.toLocaleString()} {m.unit}
                          </span>
                        </div>
                        <div
                          style={{
                            height: 3,
                            borderRadius: 2,
                            background: 'rgba(255,255,255,0.06)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${mp}%`,
                              background: done
                                ? '#ffd700'
                                : 'rgba(55,183,255,0.6)',
                              transition: 'width 0.6s ease',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    )
  }
)
