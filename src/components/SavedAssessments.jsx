import { useState } from 'react';
import { getAssessments, deleteAssessment } from '../services/storage';
import { useAssessment } from '../hooks/useAssessment';
import { formatDateShort, truncateText, formatIndustryLabel } from '../utils/formatting';

export default function SavedAssessments() {
  const { loadAssessment } = useAssessment();
  const [assessments, setAssessments] = useState(() => getAssessments());
  const [deleteId, setDeleteId] = useState(null);

  if (assessments.length === 0) return null;

  function handleDelete(id) {
    deleteAssessment(id);
    setAssessments(getAssessments());
    setDeleteId(null);
  }

  function handleLoad(assessment) {
    loadAssessment(assessment);
  }

  return (
    <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
      <h2 className="font-heading text-xl text-primary mb-4">Recent Assessments</h2>
      <div className="grid gap-3">
        {assessments.slice().reverse().map((assessment) => {
          const topNode = assessment.journeyMap?.nodes?.[0];
          return (
            <div
              key={assessment.id}
              className="group bg-bg-card border border-border-light rounded-xl p-4 hover:border-border hover:shadow-sm transition-all cursor-pointer"
              onClick={() => handleLoad(assessment)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/5 text-primary">
                      {formatIndustryLabel(assessment.answers?.industry)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatDateShort(assessment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-text truncate">
                    {truncateText(assessment.answers?.problemDescription, 80)}
                  </p>
                  {topNode && (
                    <p className="text-xs text-accent mt-1 font-medium">
                      Start: {topNode.label}{topNode.confidenceScore != null ? ` (${topNode.confidenceScore}%)` : ''}
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(assessment.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text-muted hover:text-confidence-low hover:bg-confidence-low/10 transition-all cursor-pointer"
                  title="Delete assessment"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Delete confirmation */}
              {deleteId === assessment.id && (
                <div className="mt-3 pt-3 border-t border-border-light flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <p className="text-xs text-text-muted flex-1">Delete this assessment?</p>
                  <button
                    onClick={() => setDeleteId(null)}
                    className="text-xs px-3 py-1 rounded-md text-text-muted hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(assessment.id)}
                    className="text-xs px-3 py-1 rounded-md bg-confidence-low text-white hover:bg-confidence-low/90 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
