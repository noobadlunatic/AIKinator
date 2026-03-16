import { useRef, useState } from 'react';
import { formatIndustryLabel, formatRiskLabel, formatGoalLabel, formatDate } from '../utils/formatting';
import { getTypeColor, getTypeName } from '../data/taxonomy';

const COLORS = {
  accent: '#d4764e',
  accentLight: '#fdf8f4',
  text: '#1a1a2e',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  border: '#e5e5e5',
  borderLight: '#f0f0f0',
  white: '#ffffff',
  confHigh: '#22c55e',
  confMid: '#f59e0b',
  confLow: '#ef4444',
};

function getConfColor(score) {
  if (score >= 80) return COLORS.confHigh;
  if (score >= 60) return COLORS.confMid;
  return COLORS.confLow;
}

function getConfLabel(score) {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  return 'Low';
}

function getAutonomy(node) {
  if (typeof node.autonomyLevel === 'object' && node.autonomyLevel) return node.autonomyLevel;
  return { level: node.autonomyLevel || 'L2', label: '', description: '', humanRole: '', aiRole: '' };
}

function getAutonomyNum(level) {
  const match = String(level).match(/(\d)/);
  return match ? parseInt(match[1]) : 2;
}

export default function ExportPDF({ answers, journeyMap, whyNot }) {
  const contentRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = contentRef.current;
      const date = new Date().toISOString().split('T')[0];
      const industry = answers?.industry || 'general';

      await html2pdf().from(element).set({
        margin: [12, 14, 12, 14],
        filename: `AIkinator-${industry}-${date}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }).save();
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  }

  const nodes = journeyMap?.nodes || [];
  const edges = journeyMap?.edges || [];
  const goals = Array.isArray(answers?.primaryGoals)
    ? answers.primaryGoals.map(formatGoalLabel).join(', ')
    : '';

  // Build text-based journey flow
  function buildJourneyFlow() {
    if (nodes.length === 0) return null;
    // Group edges by source
    const edgesBySource = {};
    edges.forEach(e => {
      if (!edgesBySource[e.from]) edgesBySource[e.from] = [];
      edgesBySource[e.from].push(e);
    });
    // Find root nodes (no incoming edges)
    const targets = new Set(edges.map(e => e.to));
    const roots = nodes.filter(n => !targets.has(n.id));
    if (roots.length === 0 && nodes.length > 0) roots.push(nodes[0]);

    const visited = new Set();
    const lines = [];

    function walk(nodeId, indent) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      const color = getTypeColor(node.interventionType);
      lines.push({ node, indent, color });
      const outEdges = edgesBySource[nodeId] || [];
      outEdges.forEach(e => walk(e.to, indent + 1));
    }

    roots.forEach(r => walk(r.id, 0));
    // Add any unvisited nodes
    nodes.forEach(n => { if (!visited.has(n.id)) { visited.add(n.id); lines.push({ node: n, indent: 0, color: getTypeColor(n.interventionType) }); } });
    return lines;
  }

  const flowLines = buildJourneyFlow();

  // Shared styles
  const s = {
    page: { width: '210mm', padding: '14mm 16mm', fontFamily: "'DM Sans', Arial, sans-serif", color: COLORS.text, fontSize: '11px', lineHeight: '1.6' },
    h1: { fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '26px', margin: '0 0 4px 0', color: COLORS.text },
    h2: { fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '17px', margin: '0 0 8px 0', color: COLORS.text },
    h3: { fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '14px', margin: '0', color: COLORS.text },
    muted: { color: COLORS.textMuted, fontSize: '10px' },
    sectionTitle: { fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: COLORS.textMuted, fontWeight: '600', margin: '0 0 6px 0' },
    card: { padding: '12px', border: `1px solid ${COLORS.border}`, borderRadius: '6px', marginBottom: '12px' },
    divider: { borderTop: `1px solid ${COLORS.borderLight}`, margin: '14px 0' },
    badge: (bg, color) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '600', backgroundColor: bg, color }),
  };

  return (
    <>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {exporting ? 'Exporting...' : 'Export PDF'}
      </button>

      {/* Hidden PDF content */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={contentRef} style={s.page}>

          {/* ===== COVER PAGE ===== */}
          <div style={{ borderBottom: `3px solid ${COLORS.accent}`, paddingBottom: '10px', marginBottom: '20px' }}>
            <h1 style={s.h1}>AI-UX Intervention Report</h1>
            <p style={s.muted}>Generated by AIkinator | {formatDate(new Date().toISOString())}</p>
          </div>

          {/* Context Summary */}
          <div style={{ ...s.card, backgroundColor: COLORS.accentLight, border: `1px solid #f0e0d0` }}>
            <p style={s.sectionTitle}>Assessment Context</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 0', width: '50%' }}><strong>Industry:</strong> {formatIndustryLabel(answers?.industry)}</td>
                  <td style={{ padding: '3px 0' }}><strong>Risk Level:</strong> {formatRiskLabel(answers?.riskLevel)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0' }}><strong>Task Type:</strong> {answers?.taskType || '—'}</td>
                  <td style={{ padding: '3px 0' }}><strong>Data Availability:</strong> {answers?.dataAvailability || '—'}</td>
                </tr>
                {goals && (
                  <tr>
                    <td colSpan={2} style={{ padding: '3px 0' }}><strong>Primary Goals:</strong> {goals}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Business Problem */}
          {answers?.problemDescription && (
            <div style={{ marginBottom: '16px' }}>
              <p style={s.sectionTitle}>Business Problem</p>
              <p style={{ margin: 0, color: COLORS.text }}>{answers.problemDescription}</p>
            </div>
          )}

          {/* Journey Overview */}
          {journeyMap?.title && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={s.h2}>{journeyMap.title}</h2>
              {journeyMap.description && <p style={{ margin: 0, color: COLORS.textMuted }}>{journeyMap.description}</p>}
            </div>
          )}

          {/* Journey Flow (text-based) */}
          {flowLines && flowLines.length > 0 && (
            <div style={{ ...s.card, marginBottom: '20px' }}>
              <p style={s.sectionTitle}>Journey Flow</p>
              {flowLines.map(({ node, indent, color }, i) => (
                <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', paddingLeft: `${indent * 24}px` }}>
                  {indent > 0 && <span style={{ color: COLORS.textLight, fontSize: '10px' }}>↳</span>}
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', fontWeight: '500' }}>{node.label}</span>
                  <span style={{ fontSize: '9px', color: COLORS.textMuted }}>({getTypeName(node.interventionType)})</span>
                  {node.confidenceScore != null && (
                    <span style={{ fontSize: '9px', fontWeight: '600', color: getConfColor(node.confidenceScore) }}>{node.confidenceScore}%</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={s.divider} />

          {/* ===== NODE DETAILS ===== */}
          {nodes.map((node, i) => {
            const color = getTypeColor(node.interventionType);
            const typeName = getTypeName(node.interventionType);
            const autonomy = getAutonomy(node);
            const autoNum = getAutonomyNum(autonomy.level);

            return (
              <div key={node.id} style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
                {/* Node Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={s.badge(COLORS.accent, COLORS.white)}>Stage {i + 1}</span>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
                  <h3 style={s.h3}>{node.label}</h3>
                  <span style={s.badge(`${color}20`, color)}>{typeName}</span>
                  {node.confidenceScore != null && (
                    <span style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: '700', color: getConfColor(node.confidenceScore) }}>
                      {node.confidenceScore}%
                      <span style={{ fontSize: '8px', fontWeight: '400', color: COLORS.textMuted, marginLeft: '2px' }}>
                        {getConfLabel(node.confidenceScore)} confidence
                      </span>
                    </span>
                  )}
                </div>

                {/* Summary */}
                {node.summary && (
                  <p style={{ fontSize: '12px', fontWeight: '500', color: COLORS.text, margin: '0 0 8px 0' }}>{node.summary}</p>
                )}

                {/* Description */}
                {node.description && (
                  <p style={{ color: COLORS.textMuted, margin: '0 0 10px 0', fontSize: '11px' }}>{node.description}</p>
                )}

                {/* Context Fit */}
                {node.contextFit && (
                  <div style={{ padding: '8px 10px', backgroundColor: COLORS.accentLight, borderRadius: '4px', border: '1px solid #f0e0d0', marginBottom: '10px' }}>
                    <p style={{ ...s.sectionTitle, marginBottom: '2px' }}>Why This Fits Your Context</p>
                    <p style={{ margin: 0, fontSize: '11px', color: COLORS.text }}>{node.contextFit}</p>
                  </div>
                )}

                {/* Autonomy Level */}
                {autonomy.level && (
                  <div style={{ marginBottom: '10px' }}>
                    <p style={s.sectionTitle}>Autonomy Level</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: COLORS.text }}>
                        {autonomy.level} — {autonomy.label || ''}
                      </span>
                    </div>
                    {/* 5-segment bar */}
                    <div style={{ display: 'flex', gap: '3px', marginBottom: '6px' }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <div key={n} style={{
                          width: '40px', height: '6px', borderRadius: '3px',
                          backgroundColor: n <= autoNum ? color : COLORS.borderLight,
                        }} />
                      ))}
                    </div>
                    {autonomy.humanRole && (
                      <p style={{ fontSize: '10px', color: COLORS.textMuted, margin: '0 0 2px 0' }}>
                        <strong>Human:</strong> {autonomy.humanRole}
                      </p>
                    )}
                    {autonomy.aiRole && (
                      <p style={{ fontSize: '10px', color: COLORS.textMuted, margin: 0 }}>
                        <strong>AI:</strong> {autonomy.aiRole}
                      </p>
                    )}
                  </div>
                )}

                {/* Pros & Cons — side by side */}
                {(node.pros?.length > 0 || node.cons?.length > 0) && (
                  <div style={{ marginBottom: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {node.pros?.length > 0 && (
                            <td style={{ padding: '0 8px 4px 0', verticalAlign: 'top', width: '50%' }}>
                              <p style={{ ...s.sectionTitle, color: COLORS.confHigh }}>Pros</p>
                            </td>
                          )}
                          {node.cons?.length > 0 && (
                            <td style={{ padding: '0 0 4px 8px', verticalAlign: 'top' }}>
                              <p style={{ ...s.sectionTitle, color: COLORS.confLow }}>Cons</p>
                            </td>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {node.pros?.length > 0 && (
                            <td style={{ padding: '0 8px 0 0', verticalAlign: 'top' }}>
                              {node.pros.map((p, j) => {
                                const point = typeof p === 'string' ? p : p.point;
                                const detail = typeof p === 'object' ? p.detail : null;
                                return (
                                  <div key={j} style={{ padding: '4px 6px', marginBottom: '4px', backgroundColor: `${COLORS.confHigh}08`, borderRadius: '3px', borderLeft: `2px solid ${COLORS.confHigh}` }}>
                                    <p style={{ margin: 0, fontSize: '10px', fontWeight: '500' }}>{point}</p>
                                    {detail && <p style={{ margin: '2px 0 0', fontSize: '9px', color: COLORS.textMuted }}>{detail}</p>}
                                  </div>
                                );
                              })}
                            </td>
                          )}
                          {node.cons?.length > 0 && (
                            <td style={{ padding: '0 0 0 8px', verticalAlign: 'top' }}>
                              {node.cons.map((c, j) => {
                                const point = typeof c === 'string' ? c : c.point;
                                const detail = typeof c === 'object' ? c.detail : null;
                                const mitigation = typeof c === 'object' ? c.mitigation : null;
                                return (
                                  <div key={j} style={{ padding: '4px 6px', marginBottom: '4px', backgroundColor: `${COLORS.confLow}08`, borderRadius: '3px', borderLeft: `2px solid ${COLORS.confLow}` }}>
                                    <p style={{ margin: 0, fontSize: '10px', fontWeight: '500' }}>{point}</p>
                                    {detail && <p style={{ margin: '2px 0 0', fontSize: '9px', color: COLORS.textMuted }}>{detail}</p>}
                                    {mitigation && (
                                      <p style={{ margin: '2px 0 0', fontSize: '9px', color: COLORS.confHigh }}>
                                        <strong>Mitigation:</strong> {mitigation}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </td>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Trust Considerations */}
                {node.trustConsiderations?.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <p style={s.sectionTitle}>Trust Considerations</p>
                    {node.trustConsiderations.map((tc, j) => (
                      <div key={j} style={{ display: 'flex', gap: '6px', marginBottom: '3px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#6366f1', fontSize: '10px', marginTop: '1px' }}>🛡</span>
                        <p style={{ margin: 0, fontSize: '10px', color: COLORS.textMuted }}>{tc}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Implementation */}
                {node.implementation && typeof node.implementation === 'object' && (
                  <div style={{ ...s.card, backgroundColor: '#fafafa' }}>
                    <p style={s.sectionTitle}>Implementation</p>
                    <div style={{ marginBottom: '6px' }}>
                      <span style={s.badge(
                        node.implementation.complexity === 'Low' ? `${COLORS.confHigh}15` :
                        node.implementation.complexity === 'High' ? `${COLORS.confLow}15` : `${COLORS.confMid}15`,
                        node.implementation.complexity === 'Low' ? COLORS.confHigh :
                        node.implementation.complexity === 'High' ? COLORS.confLow : COLORS.confMid
                      )}>
                        {node.implementation.complexity} Complexity
                      </span>
                    </div>
                    {node.implementation.requirements?.length > 0 && (
                      <div style={{ marginBottom: '6px' }}>
                        <p style={{ fontSize: '9px', fontWeight: '600', color: COLORS.textMuted, margin: '0 0 2px 0' }}>Requirements</p>
                        <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10px', color: COLORS.text }}>
                          {node.implementation.requirements.map((r, j) => <li key={j} style={{ marginBottom: '1px' }}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                      <tbody>
                        {node.implementation.dataNeeds && (
                          <tr>
                            <td style={{ padding: '2px 0', fontWeight: '600', color: COLORS.textMuted, width: '80px', verticalAlign: 'top' }}>Data Needs</td>
                            <td style={{ padding: '2px 0', color: COLORS.text }}>{node.implementation.dataNeeds}</td>
                          </tr>
                        )}
                        {node.implementation.teamNeeds && (
                          <tr>
                            <td style={{ padding: '2px 0', fontWeight: '600', color: COLORS.textMuted, verticalAlign: 'top' }}>Team Needs</td>
                            <td style={{ padding: '2px 0', color: COLORS.text }}>{node.implementation.teamNeeds}</td>
                          </tr>
                        )}
                        {node.implementation.timelineAlignment && (
                          <tr>
                            <td style={{ padding: '2px 0', fontWeight: '600', color: COLORS.textMuted, verticalAlign: 'top' }}>Timeline</td>
                            <td style={{ padding: '2px 0', color: COLORS.text }}>{node.implementation.timelineAlignment}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Examples */}
                {node.examples?.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <p style={s.sectionTitle}>Real-World Inspirations</p>
                    {node.examples.map((ex, j) => (
                      <div key={j} style={{ padding: '4px 6px', marginBottom: '4px', borderLeft: `2px solid ${color}`, backgroundColor: `${color}08`, borderRadius: '3px' }}>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '600', color: COLORS.text }}>{ex.product || ex.pattern}</p>
                        <p style={{ margin: '1px 0 0', fontSize: '9px', color: COLORS.textMuted }}>{ex.description || ex.howItWorks}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Divider between nodes */}
                {i < nodes.length - 1 && <div style={s.divider} />}
              </div>
            );
          })}

          {/* ===== WHY NOT ===== */}
          {whyNot?.length > 0 && (
            <div style={{ pageBreakInside: 'avoid', marginTop: '16px' }}>
              <h2 style={s.h2}>Types Not Recommended</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: COLORS.textMuted }}>Intervention Type</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: COLORS.textMuted }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {whyNot.map((item, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                      <td style={{ padding: '6px 8px', fontWeight: '500', whiteSpace: 'nowrap' }}>{item.interventionType || item.type}</td>
                      <td style={{ padding: '6px 8px', color: COLORS.textMuted }}>{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ===== FOOTER ===== */}
          <div style={{ marginTop: '32px', paddingTop: '10px', borderTop: `1px solid ${COLORS.border}`, color: COLORS.textLight, fontSize: '9px', textAlign: 'center' }}>
            Generated by AIkinator | AI-powered analysis — results may vary | {formatDate(new Date().toISOString())}
          </div>
        </div>
      </div>
    </>
  );
}
