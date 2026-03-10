import { useState } from 'react';
import { getTypeColor } from '../data/taxonomy';

export default function WhyNot({ items }) {
  const [expanded, setExpanded] = useState(null);

  if (!items || items.length === 0) return null;

  return (
    <div>
      <h3 className="font-heading text-lg text-primary mb-3">Why Not These?</h3>
      <p className="text-xs text-text-muted mb-4">
        These intervention types were considered but not recommended for your context.
      </p>
      <div className="space-y-2">
        {items.map((item, i) => {
          const typeId = item.interventionType?.toLowerCase().replace(/[\s\/]+/g, '-').replace('-ai', '').replace('sentinel', 'monitoring').replace('augmentation', 'assistive');
          const color = getTypeColor(typeId) || '#6b7280';
          const isExpanded = expanded === i;

          return (
            <button
              key={i}
              onClick={() => setExpanded(isExpanded ? null : i)}
              className="w-full text-left p-3 rounded-lg border border-border-light bg-bg-card hover:bg-bg-card-hover transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm font-medium text-text flex-1">{item.interventionType}</span>
                <svg
                  className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {isExpanded && (
                <p className="text-xs text-text-muted mt-2 pl-5 leading-relaxed">{item.reason}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
