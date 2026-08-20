interface ScoreBarProps {
  label: string;
  value: number | null;
  /** Minimum acceptable score from the threshold snapshot (null = no threshold). */
  min?: number;
  weight?: number;
}

export function ScoreBar({ label, value, min, weight }: ScoreBarProps) {
  if (value === null) {
    return (
      <div className="vp-score">
        <div className="vp-score-head">
          <span className="vp-score-label">{label}</span>
          <span className="vp-score-value vp-muted">—</span>
        </div>
        <div className="vp-score-track" />
        <div className="vp-score-foot">not measured</div>
      </div>
    );
  }
  const pass = min === undefined || value >= min;
  return (
    <div className="vp-score">
      <div className="vp-score-head">
        <span className="vp-score-label">{label}</span>
        <span className={`vp-score-value ${pass ? 'vp-score-value--pass' : 'vp-score-value--fail'}`}>
          {Math.round(value)}
        </span>
      </div>
      <div className="vp-score-track">
        <div
          className={`vp-score-fill ${pass ? 'vp-score-fill--pass' : 'vp-score-fill--fail'}`}
          style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
        />
        {min !== undefined ? (
          <div className="vp-score-min" style={{ left: `${Math.max(0, Math.min(100, min))}%` }} />
        ) : null}
      </div>
      <div className="vp-score-foot">
        <span>{min !== undefined ? `min ${min}` : 'score'}</span>
        {weight !== undefined ? <span>{Math.round(weight * 100)}% weight</span> : null}
      </div>
    </div>
  );
}
