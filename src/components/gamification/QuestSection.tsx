import React from 'react'
import type { AppState } from '../../types'
import { getCurrentTransformationFull, getDailyQuestStatus, todayIso } from '../../lib'
import { SectionTitle } from '../ui/Shared'

// ── QuestSection (transformation quests) ─────────────────────────────────────

interface QuestSectionProps {
  state: AppState
}

export const QuestSection: React.FC<QuestSectionProps> = React.memo(
  function QuestSection({ state }) {
    const tf = getCurrentTransformationFull(state)
    const next = tf.nextTransformation
    if (!next || next.quests.length === 0) return null
    const allDone = next.quests.every((q) => q.requirement(state) >= q.target)
    return (
      <section className="hevy-card stack-md">
        <div className="section-head">
          <div>
            <SectionTitle icon="⚔️" label={`Quêtes vers ${next.name}`} />
          </div>
          <img
            src={next.image}
            alt={next.name}
            className={`transformation-image ${allDone ? 'aura-glow' : ''}`}
            style={{
              width: 60,
              height: 60,
              filter: `drop-shadow(0 0 12px ${next.accent}88)`,
            }}
          />
        </div>
        <div className="stack-md">
          {next.quests.map((q) => {
            const current = q.requirement(state)
            const done = current >= q.target
            const pct = Math.min(
              100,
              Math.round((current / q.target) * 100)
            )
            return (
              <div
                key={q.id}
                className={`quest-card ${done ? 'completed' : ''}`}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 2,
                      }}
                    >
                      {done && (
                        <span style={{ color: '#ffd700' }}>
                          ✓
                        </span>
                      )}
                      <strong
                        style={{
                          fontSize: '0.88rem',
                          color: done ? '#ffd700' : 'var(--text)',
                        }}
                      >
                        {q.name}
                      </strong>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: 'var(--muted)',
                      }}
                    >
                      {q.description}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: done ? '#ffd700' : 'var(--muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {Math.min(current, q.target).toLocaleString()} /{' '}
                    {q.target.toLocaleString()}
                  </span>
                </div>
                <div className="quest-progress-bar">
                  <div
                    className="quest-progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: done
                        ? 'linear-gradient(90deg,#ffd700,#ffaa00)'
                        : `linear-gradient(90deg,${next.accent},${next.accent}88)`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {allDone && (
          <div
            className="transformation-available-banner"
            style={{
              borderColor: next.accent,
              color: next.accent,
              background: `${next.accent}12`,
            }}
          >
            TRANSFORMATION DISPONIBLE : {next.name.toUpperCase()}
          </div>
        )}
      </section>
    )
  }
)

// ── DailyQuestsPanel ─────────────────────────────────────────────────────────

interface DailyQuestsPanelProps {
  state: AppState
  onUpdateQuestProgress: (questId: string, delta: number) => void
  onCompleteQuest: (questId: string) => void
}

export const DailyQuestsPanel: React.FC<DailyQuestsPanelProps> = React.memo(
  function DailyQuestsPanel({ state, onUpdateQuestProgress, onCompleteQuest }) {
    const questStatuses = getDailyQuestStatus(state)
    const completedCount = questStatuses.filter((q) => q.isComplete).length
    const today = todayIso()
    const completedToday = (state.completedDailyQuests ?? {})[today] ?? []

    return (
      <section className="hevy-card stack-md">
        <div className="section-head">
          <SectionTitle icon="🗓️" label="Quêtes quotidiennes" />
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--accent-gold)',
            }}
          >
            {completedCount}/8
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {questStatuses.map((q) => (
            <div
              key={q.id}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: q.isComplete
                  ? 'var(--accent-gold)'
                  : 'rgba(255,255,255,0.08)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
        <div className="stack-md">
          {questStatuses.map((q) => {
            const isManual = [
              'steps',
              'water',
              'sleep',
              'stretch',
              'no_junk',
            ].includes(q.id)
            const isAutoCalc = ['protein', 'calories', 'training'].includes(
              q.id
            )
            const pct = Math.min(
              100,
              Math.round((q.current / q.target) * 100)
            )
            const alreadyCompleted = completedToday.includes(q.id)
            const categoryClass = `quest-card-${q.category ?? 'activity'}`
            return (
              <div
                key={q.id}
                className={`quest-card ${categoryClass} ${q.isComplete ? 'completed' : ''}`}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '1.1rem',
                        width: 24,
                        textAlign: 'center' as const,
                      }}
                    >
                      {q.icon}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {q.isComplete && (
                          <span
                            style={{
                              color: '#ffd700',
                              fontSize: '0.8rem',
                            }}
                          >
                            ✓
                          </span>
                        )}
                        <strong
                          style={{
                            fontSize: '0.85rem',
                            color: q.isComplete
                              ? '#ffd700'
                              : 'var(--text)',
                          }}
                        >
                          {q.name}
                        </strong>
                        {isAutoCalc && (
                          <span className="auto-badge">AUTO</span>
                        )}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.7rem',
                          color: 'var(--muted)',
                        }}
                      >
                        {q.description}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {isManual && !q.isComplete && !['steps', 'water', 'sleep'].includes(q.id) && q.id !== 'no_junk' && (
                      <>
                        <button
                          type="button"
                          className="ghost-btn"
                          style={{
                            minHeight: 30,
                            padding: '2px 10px',
                            borderRadius: 8,
                            fontSize: '1rem',
                          }}
                          onClick={() => onUpdateQuestProgress(q.id, -1)}
                        >
                          -
                        </button>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            minWidth: 44,
                            textAlign: 'center' as const,
                          }}
                        >
                          {q.current}/{q.target}
                        </span>
                        <button
                          type="button"
                          className="ghost-btn"
                          style={{
                            minHeight: 30,
                            padding: '2px 10px',
                            borderRadius: 8,
                            fontSize: '1rem',
                          }}
                          onClick={() => onUpdateQuestProgress(q.id, 1)}
                        >
                          +
                        </button>
                      </>
                    )}
                    {['steps', 'water', 'sleep'].includes(q.id) && !q.isComplete && (
                      <span style={{ fontSize: 'max(0.75rem, 0.6rem)', fontWeight: 700, color: 'var(--muted)', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--stroke)', borderRadius: 4, padding: '1px 5px', letterSpacing: '0.06em' }}>SYNC</span>
                    )}
                    {(q.id === 'no_junk' || isAutoCalc) &&
                      !q.isComplete &&
                      !alreadyCompleted && (
                        <button
                          type="button"
                          className="ghost-btn"
                          style={{
                            minHeight: 30,
                            padding: '2px 12px',
                            borderRadius: 8,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                          onClick={() => onCompleteQuest(q.id)}
                        >
                          OK
                        </button>
                      )}
                    {isAutoCalc && (
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: q.isComplete
                            ? '#ffd700'
                            : 'var(--muted)',
                          minWidth: 40,
                          textAlign: 'right' as const,
                        }}
                      >
                        {pct}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="quest-progress-bar">
                  <div
                    className="quest-progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: q.isComplete
                        ? 'linear-gradient(90deg,#ffd700,#ffaa00)'
                        : 'linear-gradient(90deg,#ff8c00,#ffd700)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    )
  }
)
