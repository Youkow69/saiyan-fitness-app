import React from 'react';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: 'calories' | 'protein' | 'carbs' | 'fat';
  unit?: string;
}

const MacroBar: React.FC<MacroBarProps> = React.memo(({
  label,
  current,
  target,
  color,
  unit = 'g',
}) => {
  const percentage = target > 0 ? (current / target) * 100 : 0;
  const isOverflow = percentage > 100;
  const clampedWidth = Math.min(percentage, 100);

  const colorMap: Record<string, string> = {
    calories: 'var(--calories)',
    protein: 'var(--protein)',
    carbs: 'var(--carbs)',
    fat: 'var(--fat)',
  };

  const fillColor = isOverflow ? 'var(--danger)' : colorMap[color];

  return (
    <div className="macro-bar">
      <div className="macro-bar-header">
        <span className="macro-bar-label">{label}</span>
        <span className="macro-bar-values">
          {current}{unit} <span>/ {target}{unit}</span>
        </span>
      </div>
      <div
        className="macro-bar-track"
        role="progressbar"
        aria-label={`${label} progress`}
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={target}
      >
        <div
          className={`macro-bar-fill macro-bar-fill--${color}${isOverflow ? ' macro-bar-fill--overflow' : ''}`}
          style={{
            width: `${clampedWidth}%`,
            background: fillColor,
          }}
        />
      </div>
    </div>
  );
});

MacroBar.displayName = 'MacroBar';

export default MacroBar;
