import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAssessment } from '../hooks/useAssessment';
import { saveAssessment } from '../services/storage';
import { generateShareUrl, copyToClipboard } from '../services/sharing';
import { formatIndustryLabel, formatRiskLabel, formatGoalLabel } from '../utils/formatting';
import WhyNot from './WhyNot';
import JourneyMap from './JourneyMap';
import ExportPDF from './ExportPDF';
import TaxonomyModal from './TaxonomyModal';

export default function Results() {
  const { state, reset, goToQuestion, setAssessmentId } = useAssessment();
  const { answers, journeyMap, whyNot, assessmentId } = state;

  const [saved, setSaved] = useState(!!assessmentId);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showTaxonomy, setShowTaxonomy] = useState(false);
  const [taxonomyType, setTaxonomyType] = useState(null);
  const [showWhyNot, setShowWhyNot] = useState(false);

  const goals = Array.isArray(answers.primaryGoals)
    ? answers.primaryGoals.map(formatGoalLabel).join(' and ')
    : '';

  function handleSave() {
    const id = assessmentId || uuidv4();
    const assessment = {
      id,
      createdAt: new Date().toISOString(),
      answers,
      journeyMap,
      whyNot,
    };
    const result = saveAssessment(assessment);
    if (result.saved) {
      setAssessmentId(id);
      setSaved(true);
    }
  }

  async function handleShare() {
    const url = generateShareUrl(answers);
    if (url) {
      setShareUrl(url);
      const ok = await copyToClipboard(url);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-6 animate-fade-in-up">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-4 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            AIkinator
          </button>

          <h1 className="font-heading text-3xl md:text-4xl text-primary mb-2">Your AI Journey</h1>

          <p className="text-base text-text-muted leading-relaxed">
            Based on your <span className="font-medium text-text">{formatIndustryLabel(answers.industry)}</span> context
            with <span className="font-medium text-text">{formatRiskLabel(answers.riskLevel)}</span>
            {goals && <> and goals of <span className="font-medium text-text">{goals}</span></>}
          </p>

          {window.location.hash.includes('shared=') && (
            <div className="mt-3 p-3 rounded-lg bg-confidence-mid/10 border border-confidence-mid/20">
              <p className="text-xs text-confidence-mid">
                This assessment was shared with you. Results are generated fresh and may differ slightly from the original.
              </p>
            </div>
          )}
        </div>

        {/* Compact horizontal action bar */}
        <div className="flex flex-wrap items-center gap-2 mb-8 p-3 bg-bg-card border border-border-light rounded-xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <button
            onClick={handleSave}
            disabled={saved}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              saved
                ? 'bg-confidence-high/10 text-confidence-high'
                : 'bg-primary text-white hover:bg-primary-light'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {saved
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              }
            </svg>
            {saved ? 'Saved' : 'Save'}
          </button>

          <ExportPDF answers={answers} journeyMap={journeyMap} whyNot={whyNot} />

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {copied ? 'Copied!' : 'Share'}
          </button>

          {shareUrl && !copied && (
            <span className="text-[10px] text-text-muted truncate max-w-48">{shareUrl}</span>
          )}

          <div className="w-px h-5 bg-border-light mx-1 hidden sm:block" />

          <button
            onClick={() => goToQuestion(0)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Adjust
          </button>

          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>

          <button
            onClick={() => setShowTaxonomy(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-accent transition-colors cursor-pointer ml-auto"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Taxonomy
          </button>
        </div>

        {/* Journey Map — full width */}
        <JourneyMap journeyMap={journeyMap} answers={answers} />

        {/* Why Not section — collapsible */}
        {whyNot?.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowWhyNot(!showWhyNot)}
              className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors cursor-pointer"
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${showWhyNot ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              Why Not These? ({whyNot.length} types not recommended)
            </button>
            {showWhyNot && (
              <div className="mt-3 p-4 bg-bg-card border border-border-light rounded-xl animate-fade-in">
                <WhyNot items={whyNot} />
              </div>
            )}
          </div>
        )}
      </div>

      <TaxonomyModal isOpen={showTaxonomy} onClose={() => { setShowTaxonomy(false); setTaxonomyType(null); }} highlightType={taxonomyType} />
    </div>
  );
}
