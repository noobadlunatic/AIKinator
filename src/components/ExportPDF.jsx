import { useRef, useState } from 'react';
import { formatIndustryLabel, getConfidenceColor, formatDate } from '../utils/formatting';

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
        margin: [15, 15, 15, 15],
        filename: `ai-ux-compass-${industry}-${date}.pdf`,
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
        <div ref={contentRef} style={{ width: '210mm', padding: '20mm', fontFamily: 'DM Sans, sans-serif', color: '#1a1a2e', fontSize: '12px', lineHeight: '1.6' }}>
          {/* Header */}
          <div style={{ borderBottom: '2px solid #d4764e', paddingBottom: '12px', marginBottom: '20px' }}>
            <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '24px', margin: '0 0 4px 0' }}>AI-UX Compass Report</h1>
            <p style={{ color: '#6b7280', fontSize: '11px' }}>
              {formatIndustryLabel(answers?.industry)} | {formatDate(new Date().toISOString())}
            </p>
          </div>

          {/* Problem */}
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '16px', marginBottom: '6px' }}>Business Problem</h2>
            <p style={{ color: '#374151' }}>{answers?.problemDescription}</p>
          </div>

          {/* Journey Title */}
          {journeyMap?.title && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '16px', marginBottom: '6px' }}>{journeyMap.title}</h2>
              {journeyMap.description && <p style={{ color: '#6b7280' }}>{journeyMap.description}</p>}
            </div>
          )}

          {/* Journey Nodes */}
          {journeyMap?.nodes?.map((node, i) => (
            <div key={node.id} style={{ marginBottom: '24px', padding: '16px', border: '1px solid #e5e5e5', borderRadius: '8px', pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#d4764e', color: '#fff', fontSize: '11px', fontWeight: '600' }}>
                  Stage {i + 1}
                </span>
                <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '16px', margin: 0 }}>{node.label}</h3>
                {node.confidenceScore != null && (
                  <span style={{ color: getConfidenceColor(node.confidenceScore), fontWeight: '600', fontSize: '13px' }}>
                    {node.confidenceScore}%
                  </span>
                )}
              </div>
              {node.summary && <p style={{ color: '#6b7280', marginBottom: '8px' }}>{node.summary}</p>}
              {node.description && <p style={{ color: '#374151', marginBottom: '8px' }}>{node.description}</p>}
              {node.contextFit && (
                <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#fdf8f4', borderRadius: '4px', border: '1px solid #f0e0d0' }}>
                  <p style={{ color: '#374151' }}>{node.contextFit}</p>
                </div>
              )}
              {node.pros?.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '11px', textTransform: 'uppercase', color: '#22c55e' }}>Pros</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                    {node.pros.map((p, j) => {
                      const point = typeof p === 'string' ? p : p.point;
                      const detail = typeof p === 'object' ? p.detail : null;
                      return <li key={j}>{point}{detail ? ` — ${detail}` : ''}</li>;
                    })}
                  </ul>
                </div>
              )}
              {node.cons?.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '11px', textTransform: 'uppercase', color: '#ef4444' }}>Cons</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                    {node.cons.map((c, j) => {
                      const point = typeof c === 'string' ? c : c.point;
                      const mitigation = typeof c === 'object' ? c.mitigation : null;
                      return <li key={j}>{point}{mitigation ? ` (Mitigation: ${mitigation})` : ''}</li>;
                    })}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {/* Why Not */}
          {whyNot?.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '16px', marginBottom: '8px' }}>Types Not Recommended</h2>
              {whyNot.map((item, i) => (
                <p key={i} style={{ color: '#6b7280', marginBottom: '4px' }}>
                  <strong>{item.interventionType}:</strong> {item.reason}
                </p>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '32px', paddingTop: '12px', borderTop: '1px solid #e5e5e5', color: '#9ca3af', fontSize: '10px' }}>
            Generated by AI-UX Compass | Results may vary as analysis is AI-powered
          </div>
        </div>
      </div>
    </>
  );
}
