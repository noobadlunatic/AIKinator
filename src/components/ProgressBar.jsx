import { SECTIONS, TOTAL_QUESTIONS, getSectionProgress } from '../data/questions';

export default function ProgressBar({ currentIndex }) {
  const progress = ((currentIndex) / TOTAL_QUESTIONS) * 100;
  const { sectionIndex } = getSectionProgress(currentIndex);

  return (
    <div className="w-full mb-8">
      {/* Section labels */}
      <div className="flex items-center justify-between mb-3">
        {SECTIONS.map((section, i) => (
          <div key={section.id} className="flex items-center gap-1.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-500 ${
                i < sectionIndex
                  ? 'bg-accent text-white'
                  : i === sectionIndex
                  ? 'bg-primary text-white'
                  : 'bg-border text-text-muted'
              }`}
            >
              {i < sectionIndex ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline transition-colors duration-300 ${
                i === sectionIndex ? 'text-primary' : 'text-text-muted'
              }`}
            >
              {section.title}
            </span>
            {i < SECTIONS.length - 1 && (
              <div className={`hidden sm:block w-8 lg:w-16 h-px mx-1 transition-colors duration-500 ${
                i < sectionIndex ? 'bg-accent' : 'bg-border'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(progress, 2)}%` }}
        />
      </div>

      {/* Question counter */}
      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-text-muted">
          Question {currentIndex + 1} of {TOTAL_QUESTIONS}
        </p>
        <p className="text-xs text-text-muted">
          {Math.round(progress)}% complete
        </p>
      </div>
    </div>
  );
}
