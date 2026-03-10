import { useEffect, useState } from 'react';
import { getConfidenceColor, getConfidenceLabel } from '../utils/formatting';

export default function ConfidenceScore({ score, size = 'md' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const color = getConfidenceColor(score);
  const label = getConfidenceLabel(score);

  const sizes = {
    sm: { width: 44, stroke: 3, fontSize: 'text-xs', labelSize: 'text-[8px]' },
    md: { width: 64, stroke: 4, fontSize: 'text-sm', labelSize: 'text-[9px]' },
    lg: { width: 80, stroke: 5, fontSize: 'text-lg', labelSize: 'text-xs' },
  };

  const s = sizes[size] || sizes.md;
  const radius = (s.width - s.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (displayValue / 100) * circumference;

  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 800;

    function animate(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: s.width, height: s.width }}>
      <svg width={s.width} height={s.width} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={s.width / 2}
          cy={s.width / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border-light)"
          strokeWidth={s.stroke}
        />
        {/* Progress circle */}
        <circle
          cx={s.width / 2}
          cy={s.width / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={s.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.33, 1, 0.68, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-medium ${s.fontSize}`} style={{ color }}>
          {displayValue}%
        </span>
        {size !== 'sm' && (
          <span className={`${s.labelSize} text-text-muted uppercase tracking-wide`}>{label}</span>
        )}
      </div>
    </div>
  );
}
