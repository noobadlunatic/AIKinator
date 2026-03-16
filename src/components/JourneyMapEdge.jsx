import { getSmoothStepPath, BaseEdge, EdgeLabelRenderer } from '@xyflow/react';

export default function JourneyMapEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  markerEnd,
  style,
}) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 10,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            title={label}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px,${labelY - 8}px)`,
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '2px 6px',
              borderRadius: 3,
              fontSize: 9,
              color: '#888',
              whiteSpace: 'nowrap',
              pointerEvents: 'auto',
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'default',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
