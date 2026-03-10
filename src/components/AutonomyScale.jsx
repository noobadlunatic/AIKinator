const LEVELS = [
  { id: 'L1', label: 'Operator', desc: 'User drives, AI supports' },
  { id: 'L2', label: 'Collaborator', desc: 'User and AI take turns' },
  { id: 'L3', label: 'Consultant', desc: 'AI drives, user inputs' },
  { id: 'L4', label: 'Approver', desc: 'AI acts, user reviews' },
  { id: 'L5', label: 'Observer', desc: 'AI autonomous, user monitors' },
];

export default function AutonomyScale({ level, humanRole, aiRole, compact = false }) {
  const levelNum = parseInt(level?.replace('L', '') || '2');
  const activeIndex = Math.max(0, Math.min(4, levelNum - 1));

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {LEVELS.map((l, i) => (
            <div
              key={l.id}
              className={`h-2 rounded-full transition-all duration-500 ${
                i <= activeIndex ? 'bg-accent' : 'bg-border-light'
              }`}
              style={{ width: i === activeIndex ? 16 : 8 }}
            />
          ))}
        </div>
        <span className="text-xs text-text-muted font-medium">{level}</span>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border-light rounded-xl p-4">
      <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-3">Autonomy Level</h4>

      {/* Scale visualization */}
      <div className="relative mb-4">
        <div className="flex items-center justify-between">
          {LEVELS.map((l, i) => (
            <div key={l.id} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-500 ${
                  i === activeIndex
                    ? 'bg-accent text-white scale-110 shadow-md'
                    : i < activeIndex
                    ? 'bg-accent/20 text-accent'
                    : 'bg-border-light text-text-muted'
                }`}
              >
                {l.id}
              </div>
              <span className={`text-[10px] mt-1.5 text-center leading-tight ${
                i === activeIndex ? 'text-accent font-medium' : 'text-text-light'
              }`}>
                {l.label}
              </span>
            </div>
          ))}
        </div>
        {/* Connector line */}
        <div className="absolute top-4 left-4 right-4 h-px bg-border -z-0" />
        <div
          className="absolute top-4 left-4 h-px bg-accent transition-all duration-500"
          style={{ width: `${(activeIndex / 4) * (100 - 10)}%` }}
        />
      </div>

      {/* Role description */}
      {(humanRole || aiRole) && (
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border-light">
          {humanRole && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-light font-medium mb-0.5">Human Role</p>
              <p className="text-xs text-text-muted">{humanRole}</p>
            </div>
          )}
          {aiRole && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-light font-medium mb-0.5">AI Role</p>
              <p className="text-xs text-text-muted">{aiRole}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
