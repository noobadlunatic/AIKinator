import { Handle, Position } from '@xyflow/react';

export default function JourneyMapNode({ data, selected }) {
  const { label, color, typeName, isActive } = data;

  return (
    <div
      className={`w-40 p-3 rounded-xl border-2 bg-bg-card text-center transition-all duration-200 cursor-pointer ${
        isActive ? 'shadow-lg scale-105' : 'shadow-sm hover:shadow-md hover:scale-105'
      }`}
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
  );
}
