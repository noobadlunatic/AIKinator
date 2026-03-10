import { useState, useMemo, useRef, useEffect } from 'react';
import { computeLayout, getEdgePath } from '../utils/journeyLayout';
import { getTypeColor, getTypeName } from '../data/taxonomy';
import ConfidenceScore from './ConfidenceScore';
import AutonomyScale from './AutonomyScale';

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-2">{title}</h4>
      {children}
    </div>
  );
}

export default function JourneyMap({ journeyMap }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  const numNodes = journeyMap?.nodes?.length || 4;
  const NODE_SPACING = 220;
  const CONTAINER_HEIGHT = 160;
  const layoutWidth = Math.max(containerWidth, numNodes * NODE_SPACING);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const layout = useMemo(() => {
    if (!journeyMap?.nodes?.length) return null;
    return computeLayout(
      journeyMap.nodes,
      journeyMap.edges || [],
      layoutWidth,
      CONTAINER_HEIGHT,
      true,
    );
  }, [journeyMap, layoutWidth]);

  if (!journeyMap?.nodes?.length) return null;

  const selected = selectedNode ? layout?.nodes.find(n => n.id === selectedNode) : null;
  const nodeMap = {};
  layout?.nodes.forEach(n => { nodeMap[n.id] = n; });

  // Get autonomy level info — handles both string ("L2") and object formats
  const getAutonomyLevel = (node) => {
    if (typeof node.autonomyLevel === 'object' && node.autonomyLevel) {
      return node.autonomyLevel.level || 'L2';
    }
    return node.autonomyLevel || 'L2';
  };

  const getAutonomyHumanRole = (node) => {
    if (typeof node.autonomyLevel === 'object' && node.autonomyLevel) {
      return node.autonomyLevel.humanRole || '';
    }
    return '';
  };

  const getAutonomyAiRole = (node) => {
    if (typeof node.autonomyLevel === 'object' && node.autonomyLevel) {
      return node.autonomyLevel.aiRole || '';
    }
    return '';
  };

  return (
    <div>
      <h3 className="font-heading text-lg text-primary mb-1">{journeyMap.title || 'User Journey Map'}</h3>
      {journeyMap.description && (
        <p className="text-xs text-text-muted mb-4">{journeyMap.description}</p>
      )}

      <div ref={containerRef} className="relative bg-bg-card border border-border-light rounded-xl overflow-x-auto">
        {/* SVG layer for edges */}
        <svg
          width={layout?.width || layoutWidth}
          height={layout?.height || CONTAINER_HEIGHT}
          className="absolute top-0 left-0"
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--color-border)" />
            </marker>
          </defs>
          {layout?.edges.map((edge, i) => {
            const from = nodeMap[edge.from];
            const to = nodeMap[edge.to];
            if (!from || !to) return null;
            return (
              <g key={i}>
                <path
                  d={getEdgePath(from, to, true)}
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth={2}
                  markerEnd="url(#arrowhead)"
                />
                {edge.label && (
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 8}
                    textAnchor="middle"
                    className="text-[9px] fill-text-light"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* HTML overlay for nodes */}
        <div
          className="relative"
          style={{ width: layout?.width || layoutWidth, height: layout?.height || CONTAINER_HEIGHT }}
        >
          {layout?.nodes.map((node) => {
            const color = getTypeColor(node.interventionType);
            const isActive = selectedNode === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelectedNode(isActive ? null : node.id)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                  isActive ? 'z-20 scale-105' : 'z-10 hover:scale-105'
                }`}
                style={{ left: node.x, top: node.y }}
              >
                <div
                  className={`w-24 p-2.5 rounded-xl border-2 bg-bg-card text-center transition-all ${
                    isActive ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
                  }`}
                  style={{ borderColor: isActive ? color : 'var(--color-border-light)' }}
                >
                  <div className="w-3 h-3 rounded-full mx-auto mb-1.5" style={{ backgroundColor: color }} />
                  <p className="text-[10px] font-medium text-primary leading-tight">{node.label}</p>
                  <p className="text-[8px] text-text-muted mt-0.5">{getTypeName(node.interventionType)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected node rich detail panel */}
      {selected && (
        <div className="mt-4 p-5 rounded-xl border-2 bg-bg-card animate-scale-in" style={{ borderColor: getTypeColor(selected.interventionType) }}>
          {/* Header with confidence score */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getTypeColor(selected.interventionType) }} />
              <h4 className="font-heading text-lg text-primary">{selected.label}</h4>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                backgroundColor: `${getTypeColor(selected.interventionType)}15`,
                color: getTypeColor(selected.interventionType),
              }}>
                {getTypeName(selected.interventionType)}
              </span>
            </div>
            {selected.confidenceScore != null && (
              <ConfidenceScore score={selected.confidenceScore} size="sm" />
            )}
          </div>

          <div className="space-y-5">
            {/* Summary */}
            {selected.summary && (
              <p className="text-sm text-text font-medium leading-relaxed">{selected.summary}</p>
            )}

            {/* Description */}
            {selected.description && (
              <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">{selected.description}</p>
            )}

            {/* Context Fit */}
            {selected.contextFit && (
              <Section title="Fit for Your Context">
                <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
                  <p className="text-sm text-text leading-relaxed">{selected.contextFit}</p>
                </div>
              </Section>
            )}

            {/* Autonomy Scale */}
            <AutonomyScale
              level={getAutonomyLevel(selected)}
              humanRole={getAutonomyHumanRole(selected)}
              aiRole={getAutonomyAiRole(selected)}
            />

            {/* Examples */}
            {selected.examples?.length > 0 && (
              <Section title="Real-World Examples">
                <div className="space-y-3">
                  {selected.examples.map((ex, i) => (
                    <div key={i} className="p-3 rounded-lg bg-primary/[0.02] border border-border-light">
                      <p className="text-sm font-medium text-primary">{ex.product}</p>
                      <p className="text-xs text-text-muted mt-0.5">{ex.description}</p>
                      {ex.relevance && (
                        <p className="text-xs text-accent mt-1 italic">{ex.relevance}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Pros & Cons */}
            {(selected.pros?.length > 0 || selected.cons?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selected.pros?.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-confidence-high font-medium mb-2 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Pros
                    </h4>
                    <div className="space-y-2">
                      {selected.pros.map((pro, i) => {
                        // Handle both string and object formats
                        const point = typeof pro === 'string' ? pro : pro.point;
                        const detail = typeof pro === 'object' ? pro.detail : null;
                        return (
                          <div key={i} className="p-2.5 rounded-lg bg-confidence-high/5 border border-confidence-high/10">
                            <p className="text-xs font-medium text-text">{point}</p>
                            {detail && <p className="text-[11px] text-text-muted mt-0.5">{detail}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {selected.cons?.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-confidence-low font-medium mb-2 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Cons
                    </h4>
                    <div className="space-y-2">
                      {selected.cons.map((con, i) => {
                        const point = typeof con === 'string' ? con : con.point;
                        const detail = typeof con === 'object' ? con.detail : null;
                        const mitigation = typeof con === 'object' ? con.mitigation : null;
                        return (
                          <div key={i} className="p-2.5 rounded-lg bg-confidence-low/5 border border-confidence-low/10">
                            <p className="text-xs font-medium text-text">{point}</p>
                            {detail && <p className="text-[11px] text-text-muted mt-0.5">{detail}</p>}
                            {mitigation && (
                              <p className="text-[11px] text-confidence-high mt-1">
                                <span className="font-medium">Mitigation:</span> {mitigation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trust Considerations */}
            {selected.trustConsiderations?.length > 0 && (
              <Section title="Trust Considerations">
                <div className="space-y-1.5">
                  {selected.trustConsiderations.map((tc, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 text-type-monitoring mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <p className="text-xs text-text-muted leading-relaxed">{tc}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Implementation */}
            {selected.implementation && typeof selected.implementation === 'object' && (
              <Section title="Implementation">
                <div className="p-3 rounded-lg border border-border-light bg-primary/[0.02]">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      selected.implementation.complexity === 'Low' ? 'bg-confidence-high/10 text-confidence-high'
                      : selected.implementation.complexity === 'High' ? 'bg-confidence-low/10 text-confidence-low'
                      : 'bg-confidence-mid/10 text-confidence-mid'
                    }`}>
                      {selected.implementation.complexity} Complexity
                    </span>
                  </div>
                  {selected.implementation.requirements?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] uppercase tracking-wider text-text-light font-medium mb-1">Requirements</p>
                      <ul className="text-xs text-text-muted space-y-0.5">
                        {selected.implementation.requirements.map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-accent mt-1">&#8226;</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selected.implementation.dataNeeds && (
                    <div className="mb-2">
                      <p className="text-[10px] uppercase tracking-wider text-text-light font-medium mb-0.5">Data Needs</p>
                      <p className="text-xs text-text-muted">{selected.implementation.dataNeeds}</p>
                    </div>
                  )}
                  {selected.implementation.teamNeeds && (
                    <div className="mb-2">
                      <p className="text-[10px] uppercase tracking-wider text-text-light font-medium mb-0.5">Team Needs</p>
                      <p className="text-xs text-text-muted">{selected.implementation.teamNeeds}</p>
                    </div>
                  )}
                  {selected.implementation.timelineAlignment && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-light font-medium mb-0.5">Timeline</p>
                      <p className="text-xs text-text-muted">{selected.implementation.timelineAlignment}</p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Fallback: implementation as string (old format) */}
            {selected.implementation && typeof selected.implementation === 'string' && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-light font-medium mb-1">Implementation Approach</p>
                <p className="text-xs text-text-muted">{selected.implementation}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
