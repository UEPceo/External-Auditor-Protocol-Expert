import React from 'react';
import { OverallAssessment } from '../types/audit';
import { Scale, AlertTriangle, ListChecks, CheckCircle2, ArrowRight } from 'lucide-react';

interface Phase4AssessmentProps {
  assessment: OverallAssessment;
}

export const Phase4Assessment: React.FC<Phase4AssessmentProps> = ({ assessment }) => {
  const { consistencyJudgment, undeclaredAssumptions, recommendedNextSteps } = assessment;

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'Consistent':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 shadow-[0_0_12px_rgba(16,185,129,0.15)]';
      case 'Partially Contradictory':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]';
      case 'Fundamentally Contradictory':
      default:
        return 'bg-red-950/80 text-red-300 border-red-700/60 shadow-[0_0_12px_rgba(239,68,68,0.15)]';
    }
  };

  const getPriorityBadge = (priority: 'P0' | 'P1' | 'P2') => {
    switch (priority) {
      case 'P0':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-red-950 text-red-400 border border-red-800">
            P0: BLOCKER
          </span>
        );
      case 'P1':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
            P1: CRITICAL
          </span>
        );
      case 'P2':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-blue-950 text-blue-400 border border-blue-800">
            P2: HIGH
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Consistency Judgment */}
      <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold font-mono text-zinc-100 uppercase tracking-wider">
              1. Consistency Judgment: Stated Goals vs Architectural Reality
            </h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border uppercase ${getVerdictStyle(consistencyJudgment.verdict)}`}>
            {consistencyJudgment.verdict}
          </span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-4">
          <h4 className="text-xs font-mono uppercase text-zinc-400 mb-2 font-semibold">
            Architectural Alignment &amp; Structural Contradiction Analysis:
          </h4>
          <p className="text-sm text-zinc-200 leading-relaxed font-sans whitespace-pre-line">
            {consistencyJudgment.analysis}
          </p>
        </div>
      </section>

      {/* 2. Undeclared Assumptions List */}
      <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold font-mono text-zinc-100 uppercase tracking-wider">
            2. Undeclared Assumptions List ({undeclaredAssumptions.length})
          </h3>
        </div>
        <p className="text-xs text-zinc-400 mb-4 font-mono">
          Implicit dependencies relied upon by the protocol but never declared or backed by formal cryptographic proofs:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border border-zinc-800 rounded-lg overflow-hidden">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-4 w-1/4">Implicit Assumption</th>
                <th className="py-2.5 px-4 w-1/4">Specification Context</th>
                <th className="py-2.5 px-4 w-1/2 text-red-300">Failure / Exploitation Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/30">
              {undeclaredAssumptions.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/50">
                  <td className="py-3 px-4 font-semibold text-zinc-200 align-top">
                    <span className="text-amber-400 mr-2">#{idx + 1}</span>
                    {item.assumption}
                  </td>
                  <td className="py-3 px-4 text-zinc-400 align-top">
                    {item.context}
                  </td>
                  <td className="py-3 px-4 text-red-300/90 leading-relaxed align-top">
                    {item.risk}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Recommended Next Steps */}
      <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold font-mono text-zinc-100 uppercase tracking-wider">
            3. Prioritized Remediation Roadmap &amp; Recommended Next Steps
          </h3>
        </div>
        <p className="text-xs text-zinc-400 mb-4 font-mono">
          Actionable engineering, formal verification, and game-theoretic countermeasures ordered by criticality:
        </p>

        <div className="space-y-3">
          {recommendedNextSteps.map((step, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getPriorityBadge(step.priority)}
                  <h4 className="text-sm font-semibold font-mono text-zinc-100">
                    {step.action}
                  </h4>
                </div>
                <p className="text-xs text-zinc-400 pl-0 sm:pl-24">
                  <span className="text-zinc-500 font-mono">Rationale:</span> {step.rationale}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
