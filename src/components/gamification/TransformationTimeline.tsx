import React from 'react'
import type { AppState } from '../../types'
import { getCurrentTransformationFull } from '../../lib'

interface TransformationTimelineProps {
  state: AppState
}

export const TransformationTimeline: React.FC<TransformationTimelineProps> = React.memo(
  function TransformationTimeline({ state }) {
    const tf = getCurrentTransformationFull(state)
    return (
      <div className="transformation-timeline">
        {tf.allTransformations.map((t, i) => {
          const isActive = i === tf.currentIndex
          const isLocked = i > tf.currentIndex
          return (
            <div
              key={t.level}
              className={`timeline-node ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
              data-level={t.level}
            >
              <div className="timeline-img-wrap">
                <img
                  src={t.image}
                  alt={t.name}
                  className="transformation-icon"
                  style={{
                    filter: isActive
                      ? `drop-shadow(0 0 12px ${t.accent ?? 'var(--accent-gold)'})`
                      : undefined,
                  }}
                />
              </div>
              <span className="timeline-label">
                {t.name
                  .replace('Super Saiyan', 'SSJ')
                  .replace('Mastered Ultra Instinct', 'MUI')
                  .replace('Ultra Instinct Sign', 'UI Sign')}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
)
