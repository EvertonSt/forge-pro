import type { ChipSpec } from '@/lib/vendor/status';

export function StatusChip({ spec }: { spec: ChipSpec }) {
  return (
    <span className={`vp-chip vp-chip--${spec.tone}${spec.pulse ? ' vp-chip--pulse' : ''}`}>
      {spec.label}
    </span>
  );
}
