import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ReactFlow, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getLayoutedElements } from '../utils/dagreLayout';
import JourneyMapNode from './JourneyMapNode';
import JourneyMapEdge from './JourneyMapEdge';
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

const nodeTypes = { journeyNode: JourneyMapNode };
const edgeTypes = { custom: JourneyMapEdge };

export default function JourneyMap({ journeyMap, answers }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [personalisedExamples, setPersonalisedExamples] = useState({});
  const [examplesLoading, setExamplesLoading] = useState(false);
  const detailPanelRef = useRef(null);

  // Convert journeyMap data to React Flow format and run dagre layout
  const { rfNodes, rfEdges, layoutHeight, layoutWidth } = useMemo(() => {
    if (!journeyMap?.nodes?.length) return { rfNodes: [], rfEdges: [], layoutHeight: 280, layoutWidth: 800 };

    const nodes = journeyMap.nodes.map(node => ({
      id: node.id,
      type: 'journeyNode',
      position: { x: 0, y: 0 },
      data: {
        ...node,
        color: getTypeColor(node.interventionType),
        typeName: getTypeName(node.interventionType),
        isActive: selectedNode === node.id,
      },
    }));

    const nodeIds = new Set(journeyMap.nodes.map(n => n.id));
    const edges = (journeyMap.edges || [])
      .filter(e => nodeIds.has(e.from) && nodeIds.has(e.to))
      .map((edge, i) => ({
        id: `e-${edge.from}-${edge.to}-${i}`,
        source: edge.from,
        target: edge.to,
        label: edge.label || '',
        type: 'custom',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#b0b0b0', width: 16, height: 16 },
        style: { stroke: '#b0b0b0', strokeWidth: 1.5 },
      }));

    const { nodes: layoutedNodes, edges: layoutedEdges, height, width } = getLayoutedElements(nodes, edges);
    return { rfNodes: layoutedNodes, rfEdges: layoutedEdges, layoutHeight: height, layoutWidth: width };
  }, [journeyMap, selectedNode]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(prev => {
      const newValue = prev === node.id ? null : node.id;
      if (newValue) {
        // Smooth scroll to detail panel after React renders it
        setTimeout(() => {
          detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      return newValue;
    });
  }, []);

  if (!journeyMap?.nodes?.length) return null;

  const selected = selectedNode ? journeyMap.nodes.find(n => n.id === selectedNode) : null;

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

  // Fallback UX pattern inspirations by intervention type
  const getContextualExamples = (interventionType) => {
    const typeExamples = {
      advisory: [
        {
          pattern: 'Confidence-scored suggestion cards',
          reference: 'Viz.ai',
          howItWorks: 'Each AI recommendation renders as a card with a color-coded confidence bar. Cards below the threshold collapse by default, requiring a tap to expand.',
          designTip: 'Place the confidence indicator on the left edge so users can scan a vertical list at a glance.'
        },
        {
          pattern: 'Side-by-side option comparison',
          reference: 'Google Maps',
          howItWorks: 'AI presents 2-3 options in columns with key trade-offs highlighted. The user taps to select and unchosen options animate away.',
          designTip: 'Limit comparisons to 3 options max — more triggers choice paralysis.'
        },
        {
          pattern: 'Explainability tooltip on hover',
          reference: 'Vanguard Digital Advisor',
          howItWorks: 'A small "why?" link next to each recommendation opens an inline tooltip showing the top 3 factors behind the suggestion.',
          designTip: 'Use progressive disclosure — show the explanation only on demand so the default view stays clean.'
        }
      ],
      suggestive: [
        {
          pattern: 'Dismissible suggestion chips',
          reference: 'Gmail Smart Compose',
          howItWorks: 'Small pill-shaped chips appear above the input area suggesting next actions. Tapping a chip auto-fills; swiping dismisses it.',
          designTip: 'Limit to 3 chips at a time — more than that makes the suggestions feel noisy rather than helpful.'
        },
        {
          pattern: 'Contextual nudge banner',
          reference: 'Spotify Discover Weekly',
          howItWorks: 'A subtle banner slides in at a natural pause point suggesting relevant content. It auto-dismisses after 5 seconds if ignored.',
          designTip: 'Trigger nudges at transition moments (page load, task completion), not mid-task where they disrupt flow.'
        }
      ],
      collaborative: [
        {
          pattern: 'Ghost-text inline completion',
          reference: 'GitHub Copilot',
          howItWorks: 'AI renders a suggestion in dimmed text ahead of the cursor. User presses Tab to accept or keeps typing to dismiss.',
          designTip: 'Use 40-50% opacity for ghost text — too faint is invisible, too strong looks committed.'
        },
        {
          pattern: 'AI-generated variant carousel',
          reference: 'Figma AI',
          howItWorks: 'After the user creates a design, AI generates 3 alternate variations in a horizontal carousel. User swipes to browse and taps to adopt.',
          designTip: 'Show the user\'s original alongside AI variants so they always have a clear baseline for comparison.'
        },
        {
          pattern: 'Accept/edit/reject action bar',
          reference: 'Grammarly',
          howItWorks: 'Each AI suggestion includes a mini toolbar with accept, edit, and dismiss buttons. Accepting applies the change inline with a brief highlight animation.',
          designTip: 'Make "dismiss" equally accessible as "accept" — asymmetric effort creates pressure to accept blindly.'
        }
      ],
      autonomous: [
        {
          pattern: 'Activity feed with undo rail',
          reference: 'Gmail spam filter',
          howItWorks: 'AI actions appear as timestamped entries in a scrollable feed. Each entry has an "Undo" button active for 30 seconds.',
          designTip: 'Time-limit the undo window and show a countdown bar so users feel urgency without panic.'
        },
        {
          pattern: 'Pre-action preview modal',
          reference: 'GitHub Copilot Coding Agent',
          howItWorks: 'Before executing a high-impact action, AI shows a diff-style preview of what will change. User confirms or cancels.',
          designTip: 'Highlight deletions in red and additions in green — leverage existing mental models from version control.'
        }
      ],
      creative: [
        {
          pattern: 'Prompt refinement sidebar',
          reference: 'Midjourney',
          howItWorks: 'As the user types a prompt, a sidebar suggests modifier keywords (style, mood, detail level) as clickable tags that append to the prompt.',
          designTip: 'Show suggestions as additive tags rather than replacement text — users feel more in control of the creative direction.'
        },
        {
          pattern: 'Regenerate with variation slider',
          reference: 'Adobe Firefly',
          howItWorks: 'After AI generates output, a slider lets the user control how different the next generation should be: "similar" on one end, "surprising" on the other.',
          designTip: 'Default the slider to the conservative end so first-time users get predictable results and build confidence.'
        }
      ],
      predictive: [
        {
          pattern: 'Forecast confidence band chart',
          reference: 'Salesforce Einstein',
          howItWorks: 'Predictions display as a line chart with shaded confidence bands. Hovering a point shows the probability range and key contributing factors.',
          designTip: 'Use gradient opacity for confidence bands — darker = more certain, helping users intuitively judge reliability.'
        },
        {
          pattern: 'Threshold alert configurator',
          reference: 'GE Digital',
          howItWorks: 'Users drag sliders to set alert thresholds on predicted values. A live preview shows how many alerts would have triggered historically.',
          designTip: 'Show historical context alongside threshold controls so users calibrate based on real data, not guesswork.'
        }
      ],
      conversational: [
        {
          pattern: 'Quick-reply button row',
          reference: 'Bank of America Erica',
          howItWorks: 'Below each AI message, 2-3 suggested replies appear as tappable buttons, letting users advance the conversation without typing.',
          designTip: 'Keep quick-reply text under 4 words — longer options slow decision-making and defeat the purpose.'
        },
        {
          pattern: 'Typing indicator with preview',
          reference: 'MakeMyTrip Myra',
          howItWorks: 'While AI processes, a typing indicator shows. For long responses, partial content streams in progressively so users can start reading immediately.',
          designTip: 'Stream responses token-by-token rather than showing a spinner — perceived wait time drops dramatically.'
        }
      ],
      assistive: [
        {
          pattern: 'Context menu AI actions',
          reference: 'Notion AI',
          howItWorks: 'User selects text and a context menu offers AI actions (summarize, rewrite, translate). Output replaces the selection inline with an undo option.',
          designTip: 'Keep the AI action list to max 5 items and sort by frequency of use, not alphabetically.'
        },
        {
          pattern: 'Inline smart formatting',
          reference: 'Adobe Photoshop',
          howItWorks: 'AI detects content type and offers one-click formatting (table, list, code block) via a floating toolbar that appears near the cursor.',
          designTip: 'Position the toolbar above the selection so it doesn\'t obscure the content being formatted.'
        }
      ],
      monitoring: [
        {
          pattern: 'Severity-tiered notification stack',
          reference: 'Microsoft Sentinel',
          howItWorks: 'Alerts stack in a sidebar sorted by severity. Critical alerts pulse with a red dot; low-priority ones batch into a daily digest.',
          designTip: 'Batch low-severity alerts to reduce notification fatigue — only interrupt for genuinely urgent items.'
        },
        {
          pattern: 'Ambient status dashboard',
          reference: 'Apple Watch health rings',
          howItWorks: 'A persistent, minimal status indicator (green/amber/red ring) shows system health at a glance. Tapping expands to a detailed breakdown.',
          designTip: 'Use ambient, peripheral indicators for "all-clear" states — only demand focal attention when something is wrong.'
        }
      ],
      personalization: [
        {
          pattern: 'Personalization transparency toggle',
          reference: 'TikTok For You Page',
          howItWorks: 'A small "Why this?" icon on each personalized item opens a popover listing the signals that influenced the recommendation.',
          designTip: 'Pair algorithmic personalization with manual controls (not interested / more like this) so users feel agency, not surveillance.'
        },
        {
          pattern: 'Preference onboarding carousel',
          reference: 'Spotify',
          howItWorks: 'On first use, a swipeable carousel asks users to pick preferences from visual cards. Selections immediately adjust the feed in real time.',
          designTip: 'Limit onboarding to 5-7 choices — enough to seed the algorithm without fatiguing the user.'
        }
      ],
      analytical: [
        {
          pattern: 'Natural language query bar',
          reference: 'ThoughtSpot',
          howItWorks: 'A search bar at the top of the dashboard accepts plain English questions. Autocomplete suggests column names and common queries as the user types.',
          designTip: 'Show 2-3 example queries as cycling placeholder text — users learn the syntax from examples, not documentation.'
        },
        {
          pattern: 'Auto-generated insight cards',
          reference: 'Google Analytics 4',
          howItWorks: 'AI surfaces notable changes as dismissible cards above the main dashboard. Each card shows the metric, the change, and a one-line explanation.',
          designTip: 'Lead with the delta ("+15% this week") not the absolute number — anomalies are what demand attention.'
        }
      ]
    };

    return (typeExamples[interventionType] || typeExamples.advisory).slice(0, 3);
  };

  // Fetch personalized examples when node is selected
  useEffect(() => {
    if (selected) {
      const nodeId = selected.id;

      // Check if we already have examples for this node
      if (personalisedExamples[nodeId]) {
        setExamplesLoading(false);
        return;
      }

      setExamplesLoading(true);
      const abortController = new AbortController();

      getPersonalisedExamples(selected.interventionType, selected.description || selected.summary, answers, { signal: abortController.signal })
        .then(examples => {
          if (examples && examples.length > 0) {
            setPersonalisedExamples(prev => ({
              ...prev,
              [nodeId]: examples
            }));
          } else {
            // Fallback to hardcoded examples if no examples returned
            setPersonalisedExamples(prev => ({
              ...prev,
              [nodeId]: getContextualExamples(selected.interventionType)
            }));
          }
          setExamplesLoading(false);
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            console.error('Failed to fetch personalized examples:', err);
            // Fallback to hardcoded examples on error
            setPersonalisedExamples(prev => ({
              ...prev,
              [nodeId]: getContextualExamples(selected.interventionType)
            }));
          }
          setExamplesLoading(false);
        });

      return () => abortController.abort();
    }
  }, [selected, answers]);

  return (
    <div>
      <h3 className="font-heading text-lg text-primary mb-1">{journeyMap.title || 'User Journey Map'}</h3>

      <div className="bg-bg-card border border-border-light rounded-xl overflow-hidden">
        {/* Hint text — fixed above scroll area */}
        <p className="text-xs font-semibold text-center py-2.5 px-4 border-b border-border-light animate-hint-shimmer">
          ✦ Click any of the below steps to explore AI recommendations &amp; AI-UX patterns ✦
        </p>

        {/* Scrollable journey map area */}
        <div className="overflow-auto">
          <div style={{ width: layoutWidth || 800, height: Math.max(280, layoutHeight || 280) }}>
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodeClick={onNodeClick}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              minZoom={1}
              maxZoom={1}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={false}
              zoomOnScroll={false}
              zoomOnPinch={false}
              preventScrolling={false}
              proOptions={{ hideAttribution: true }}
              style={{ background: 'transparent' }}
            />
          </div>
        </div>
      </div>

      {/* Selected node rich detail panel */}
      {selected && (
        <div ref={detailPanelRef} className="mt-4 p-5 rounded-xl border-2 bg-bg-card animate-scale-in" style={{ borderColor: getTypeColor(selected.interventionType) }}>
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

            {/* UX Pattern Inspirations */}
            <Section title="AI-UX Pattern Inspirations">
              <div className="space-y-3">
                {examplesLoading ? (
                  <div className="p-4 rounded-lg bg-primary/[0.02] border border-border-light flex items-center justify-center min-h-[100px]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-text-muted">Generating UX pattern inspirations...</p>
                    </div>
                  </div>
                ) : personalisedExamples[selected?.id] && personalisedExamples[selected?.id].length > 0 ? (
                  personalisedExamples[selected?.id].map((example, i) => {
                    const patternName = example.pattern || example.product;
                    const ref = example.reference || '';
                    const body = example.howItWorks || example.description;
                    const tip = example.designTip || example.relevance;
                    return (
                      <div key={i} className="p-3 rounded-lg bg-primary/[0.02] border border-border-light hover:border-accent/30 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-primary">{patternName}</p>
                          {ref && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent whitespace-nowrap">
                              {ref}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">{body}</p>
                        {tip && (
                          <p className="text-xs text-accent mt-1.5 flex items-start gap-1">
                            <span className="font-medium shrink-0">Tip:</span>
                            <span>{tip}</span>
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 rounded-lg bg-primary/[0.02] border border-border-light">
                    <p className="text-xs text-text-muted">No inspirations available</p>
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
