import React from 'react'

// ── MetricCard ───────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: string
  accent: string
}

export const MetricCard: React.FC<MetricCardProps> = React.memo(
  function MetricCard({ label, value, accent }) {
    return (
      <article className="metric-card">
        <span className="eyebrow">{label}</span>
        <strong style={{ color: accent }}>{value}</strong>
      </article>
    )
  }
)

// ── ProgressBar ──────────────────────────────────────────────────────────────

interface ProgressBarProps {
  label: string
  value: number
  target: number
  accent: string
}

export const ProgressBar: React.FC<ProgressBarProps> = React.memo(
  function ProgressBar({ label, value, target, accent }) {
    const pct = Math.max(0, Math.min(100, (value / target) * 100))
    return (
      <div className="progress-block">
        <div className="progress-meta">
          <span>{label}</span>
          <strong>
            {Math.round(value)} / {Math.round(target)}
          </strong>
        </div>
        <div className="progress-shell">
          <div
            className="progress-fill"
            style={{ width: `${pct}%`, background: accent }}
          />
        </div>
      </div>
    )
  }
)

// ── SectionTitle ─────────────────────────────────────────────────────────────

interface SectionTitleProps {
  icon: string
  label: string
}

export const SectionTitle: React.FC<SectionTitleProps> = React.memo(
  function SectionTitle({ icon, label }) {
    return (
      <div className="section-title-row">
        <span className="section-title-icon">{icon}</span>
        <h3 className="section-title-text">{label}</h3>
      </div>
    )
  }
)
