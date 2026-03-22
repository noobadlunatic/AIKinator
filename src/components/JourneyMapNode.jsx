import { Handle, Position } from '@xyflow/react';

export default function JourneyMapNode({ data, selected }) {
  const { label, color, typeName, isActive, showHint, isFirstNode } = data;

  return (
    <div className="relative">
      {/* Hint tooltip — rendered above the first node */}
      {isFirstNode && showHint && (
        <div className="absolute bottom-full left-1/2 mb-1.5 z-10 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
          <div className="flex flex-col items-center animate-hint-float">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/90 text-white text-[11px] font-semibold shadow-lg backdrop-blur-sm whitespace-nowrap animate-hint-entry">
              <span className="animate-pulse-soft">✦</span>
              <span>Click any step to explore details</span>
              <span className="animate-pulse-soft">✦</span>
            </div>
            <svg className="w-4 h-4 text-primary/90 animate-hint-bounce" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      <div
        className={`w-40 p-3 rounded-xl border-2 bg-bg-card text-center transition-all duration-200 cursor-pointer ${
          isActive ? 'shadow-lg scale-105' : 'shadow-sm hover:shadow-md hover:scale-105'
        } ${showHint && !isActive ? 'animate-node-hint-glow' : ''}`}
        style={{ borderColor: isActive ? color : 'var(--color-border-light)' }}
      >
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: 'transparent', border: 'none', width: 1, height: 1 }}
        />
        <div
          className="w-3 h-3 rounded-full mx-auto mb-1.5"
          style={{ backgroundColor: color }}
        />
        <p className="text-[11px] font-medium text-primary leading-tight">{label}</p>
        <p className="text-[9px] text-text-muted mt-0.5">{typeName}</p>
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: 'transparent', border: 'none', width: 1, height: 1 }}
        />
      </div>
    </div>
  );
}
