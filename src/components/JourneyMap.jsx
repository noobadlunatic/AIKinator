import { useState, useMemo, useRef, useEffect } from 'react';
import { computeLayout, getEdgePath } from '../utils/journeyLayout';
import { getTypeColor, getTypeName } from '../data/taxonomy';
import { getPersonalisedExamples } from '../services/ai';
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

export default function JourneyMap({ journeyMap, answers }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [personalisedExamples, setPersonalisedExamples] = useState(null);
  const [examplesLoading, setExamplesLoading] = useState(false);
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

  // Generate contextual real-world examples based on intervention type and business context
  const getContextualExamples = (interventionType, answers) => {
    const industry = answers?.industry || 'general';
    const riskLevel = answers?.riskLevel || 'medium';
    const examples = [];

    // Base examples by intervention type
    const typeExamples = {
      advisory: [
        {
          product: 'IBM Watson Health Advisor',
          description: 'AI analyzes patient symptoms and medical history to provide diagnostic suggestions that physicians review and validate.',
          relevance: 'Perfect for healthcare applications where human expertise must always have final authority.'
        },
        {
          product: 'JPMorgan Contract Analysis',
          description: 'AI reviews legal contracts and flags potential risks or unusual terms for human lawyers to review.',
          relevance: 'Ideal for legal and compliance-heavy industries requiring expert oversight.'
        },
        {
          product: 'Khan Academy Personalized Learning',
          description: 'AI assesses student performance and recommends specific exercises, while teachers guide the overall learning strategy.',
          relevance: 'Excellent for educational platforms balancing AI recommendations with human mentorship.'
        }
      ],
      collaborative: [
        {
          product: 'Figma AI Design Assistant',
          description: 'AI suggests design improvements and alternatives while designers make final creative decisions.',
          relevance: 'Great for creative industries where AI enhances but doesn\'t replace human creativity.'
        },
        {
          product: 'GitHub Copilot',
          description: 'AI provides code suggestions and autocompletion while developers maintain control over architecture and logic.',
          relevance: 'Essential for software development teams looking to accelerate coding without compromising quality.'
        },
        {
          product: 'Grammarly Business',
          description: 'AI flags writing issues and suggests improvements, with human writers making final editorial decisions.',
          relevance: 'Perfect for content creation where maintaining brand voice is crucial.'
        }
      ],
      autonomous: [
        {
          product: 'Tesla Autopilot',
          description: 'AI handles routine driving tasks with constant human monitoring and intervention capability.',
          relevance: 'Suitable for high-stakes environments where AI efficiency meets human safety oversight.'
        },
        {
          product: 'Amazon Warehouse Robots',
          description: 'AI-powered robots handle inventory movement while human workers manage complex tasks and oversight.',
          relevance: 'Ideal for logistics operations requiring speed and precision with human supervision.'
        }
      ],
      monitoring: [
        {
          product: 'Darktrace Network Security',
          description: 'AI continuously monitors network traffic and alerts human security teams to potential threats.',
          relevance: 'Critical for cybersecurity where AI detects anomalies but humans handle investigation and response.'
        },
        {
          product: 'Splunk IT Monitoring',
          description: 'AI analyzes system logs and performance metrics, alerting human IT teams to potential issues.',
          relevance: 'Essential for IT operations requiring 24/7 monitoring with human problem-solving.'
        }
      ]
    };

    // Get examples for the specific intervention type
    const baseExamples = typeExamples[interventionType] || typeExamples.advisory;

    // Filter or prioritize examples based on industry
    const industryExamples = baseExamples.filter(example => {
      if (industry === 'healthcare' && example.product.includes('Health')) return true;
      if (industry === 'finance' && example.product.includes('JPMorgan')) return true;
      if (industry === 'education' && example.product.includes('Khan')) return true;
      if (industry === 'technology' && (example.product.includes('GitHub') || example.product.includes('Figma'))) return true;
      if (industry === 'retail' && example.product.includes('Amazon')) return true;
      return true; // Include all if no specific match
    });

    // Return up to 3 most relevant examples
    return industryExamples.slice(0, 3);
  };

  // Fetch personalized examples when node is selected
  useEffect(() => {
    if (selected && !personalisedExamples && !examplesLoading) {
      setExamplesLoading(true);
      getPersonalisedExamples(selected.interventionType, selected.description || selected.summary, answers)
        .then(examples => {
          setPersonalisedExamples(examples);
          setExamplesLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch personalized examples:', err);
          // Fallback to hardcoded examples
          setPersonalisedExamples(getContextualExamples(selected.interventionType, answers));
          setExamplesLoading(false);
        });
    } else if (!selected) {
      setPersonalisedExamples(null);
      setExamplesLoading(false);
    }
  }, [selected, answers]);

  return (
    <div>
      <h3 className="font-heading text-lg text-primary mb-1">{journeyMap.title || 'User Journey Map'}</h3>
      <p className="text-sm text-accent font-semibold mb-6 p-3 bg-accent/10 rounded-lg border border-accent/20">✨ Click on any node to explore detailed recommendations and personalised AI-UX inspirations tailored to your use case</p>

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

            {/* Personalised AI-UX Inspirations */}
            <Section title="Personalised AI-UX Inspirations for You">
              <div className="space-y-3">
                {examplesLoading ? (
                  <div className="p-4 rounded-lg bg-primary/[0.02] border border-border-light flex items-center justify-center min-h-[100px]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-text-muted">Generating personalized examples...</p>
                    </div>
                  </div>
                ) : personalisedExamples && personalisedExamples.length > 0 ? (
                  personalisedExamples.map((example, i) => (
                    <div key={i} className="p-3 rounded-lg bg-primary/[0.02] border border-border-light hover:border-accent/30 transition-colors">
                      <p className="text-sm font-medium text-primary">{example.product}</p>
                      <p className="text-xs text-text-muted mt-0.5">{example.description}</p>
                      <p className="text-xs text-accent mt-1 italic">{example.relevance}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-lg bg-primary/[0.02] border border-border-light">
                    <p className="text-xs text-text-muted">No examples available</p>
                  </div>
                )}
              </div>
            </Section>

            {/* Autonomy Scale */}
            <AutonomyScale
              level={getAutonomyLevel(selected)}
              humanRole={getAutonomyHumanRole(selected)}
              aiRole={getAutonomyAiRole(selected)}
            />

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
