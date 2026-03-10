import { useState } from 'react';

export default function QuestionStep({ question, value, onChange, direction }) {
  const animClass = direction === 'back' ? 'animate-slide-in-left' : 'animate-slide-in-right';

  return (
    <div key={question.id} className={animClass}>
      <h2 className="font-heading text-2xl md:text-3xl text-primary mb-2">
        {question.text}
      </h2>
      {question.subtitle && (
        <p className="text-sm text-accent font-medium mb-4">{question.subtitle}</p>
      )}
      {question.helperText && (
        <p className="text-sm text-text-muted mb-6">{question.helperText}</p>
      )}

      {question.type === 'single-select' && (
        <SingleSelect question={question} value={value} onChange={onChange} />
      )}
      {question.type === 'multi-select' && (
        <MultiSelect question={question} value={value || []} onChange={onChange} />
      )}
      {question.type === 'textarea' && (
        <TextArea question={question} value={value || ''} onChange={onChange} />
      )}
    </div>
  );
}

function SingleSelect({ question, value, onChange }) {
  const [otherText, setOtherText] = useState('');
  const isScale = question.displayAs === 'scale';

  return (
    <div className={`grid gap-3 ${isScale ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
      {question.options.map((option) => {
        const isSelected = option.hasTextField
          ? typeof value === 'string' && value.startsWith('other:')
          : value === option.value;

        return (
          <div key={option.value}>
            <button
              onClick={() => {
                if (option.hasTextField) {
                  onChange(otherText ? `other:${otherText}` : 'other:');
                } else {
                  onChange(option.value);
                }
              }}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                isSelected
                  ? 'border-accent bg-accent/5 shadow-sm'
                  : 'border-border-light bg-bg-card hover:border-border hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  isSelected ? 'border-accent bg-accent' : 'border-border group-hover:border-text-muted'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <span className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-text'}`}>
                    {option.label}
                  </span>
                  {option.description && (
                    <p className="text-xs text-text-muted mt-0.5">{option.description}</p>
                  )}
                </div>
              </div>
            </button>

            {option.hasTextField && isSelected && (
              <input
                type="text"
                value={otherText}
                onChange={(e) => {
                  setOtherText(e.target.value);
                  onChange(`other:${e.target.value}`);
                }}
                placeholder="Please specify..."
                autoFocus
                className="mt-2 w-full px-4 py-2.5 rounded-lg border-2 border-border-light bg-bg-card text-sm text-text focus:border-accent focus:outline-none transition-colors"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MultiSelect({ question, value, onChange }) {
  const maxSelections = question.maxSelections || Infinity;
  const isMaxReached = value.length >= maxSelections;

  const toggle = (optionValue) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else if (!isMaxReached) {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
      {question.options.map((option) => {
        const isSelected = value.includes(option.value);
        const isDisabled = !isSelected && isMaxReached;

        return (
          <button
            key={option.value}
            onClick={() => toggle(option.value)}
            disabled={isDisabled}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
              isSelected
                ? 'border-accent bg-accent/5 shadow-sm cursor-pointer'
                : isDisabled
                ? 'border-border-light bg-bg-card opacity-40 cursor-not-allowed'
                : 'border-border-light bg-bg-card hover:border-border hover:shadow-sm cursor-pointer'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all duration-200 ${
                isSelected ? 'border-accent bg-accent' : 'border-border'
              }`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-text'}`}>
                {option.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TextArea({ question, value, onChange }) {
  const charCount = value.length;
  const minLength = question.minLength || 0;
  const maxLength = question.maxLength || 2000;
  const isShort = question.required && charCount > 0 && charCount < minLength;
  const isNearMax = charCount > maxLength * 0.9;

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={question.placeholder}
        rows={5}
        className={`w-full px-4 py-3 rounded-xl border-2 bg-bg-card text-sm text-text resize-none transition-colors focus:outline-none ${
          isShort ? 'border-confidence-low/40 focus:border-confidence-low' : 'border-border-light focus:border-accent'
        }`}
      />
      <div className="flex justify-between items-center mt-2">
        {isShort ? (
          <p className="text-xs text-confidence-low">
            Please write at least {minLength} characters ({minLength - charCount} more needed)
          </p>
        ) : (
          <div />
        )}
        <p className={`text-xs ${isNearMax ? 'text-confidence-low' : 'text-text-muted'}`}>
          {charCount} / {maxLength}
        </p>
      </div>
    </div>
  );
}
