import type { StepId } from '../domain/types';
import { useStore } from '../state/store';
import { FindingList } from '../ui/kit';

export function StepFindings({ step, title = 'Technik-Check' }: { step: StepId; title?: string }) {
  const findings = useStore((s) => s.derived.findings).filter((f) => f.step === step);
  if (!findings.length) return null;
  return (
    <section className="section">
      <div className="section-head"><h3 className="section-title">{title}</h3></div>
      <FindingList findings={findings} />
    </section>
  );
}
