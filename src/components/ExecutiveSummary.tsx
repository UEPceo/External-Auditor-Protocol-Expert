import React from 'react';
import { CompleteAuditResult } from '../types/audit';
import {
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  Radio,
  Scale,
  Zap,
  ArrowUpRight,
  Clock,
  Layers
} from 'lucide-react';

interface ExecutiveSummaryProps {
  audit: CompleteAuditResult;
  onNavigateTab: (tabId: string) => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ audit, onNavigateTab }) => {
  const { forensics, flaws, overallAssessment } = audit;

  const criticalCount = flaws.filter(f => f.severity === 'Critical').length;
  const majorCount = flaws.filter(f => f.severity === 'Major').length;
  const minorCount = flaws.filter(f => f.severity === 'Minor').length;

  const isTampered = forensics.isTampered;
  const isBomb = forensics.maliciousConstructs.zipBombDetected;
  const hasTraversal = forensics.maliciousConstructs.pathTraversalCount > 0;

  return (
    <div className="space-y-6">
      {/* Critical Alert Banner if critical vulnerabilities exist */}
      {criticalCount > 0 && (
        <div className="border border-red-500/50 bg-red-950/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-200 tracking-wide font-mono uppercase">
                {criticalCount} Critical Protocol / Archive Flaw(s) Identified
              </h3>
              <p className="text-xs text-red-300/80 mt-0.5">
                Core guarantees compromised: Deterministic finality, relativistic latency tolerance, or physical custody security broken.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('flaws')}
            className="px-3.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap"
          >
            Inspect Flaws <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Flaw Severity Breakdown */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>FLAW SEVERITY MATRIX</span>
            <Layers className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-zinc-100">{flaws.length}</span>
            <span className="text-xs text-zinc-500 font-mono">total diagnostic findings</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono pt-2 border-t border-zinc-800/80">
            <span className="px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/50">
              {criticalCount} Critical
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/50">
              {majorCount} Major
            </span>
            <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/50">
              {minorCount} Minor
            </span>
          </div>
        </div>

        {/* Card 2: Archive Forensic Status */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>ARCHIVE INTEGRITY (PHASE 1)</span>
            {isTampered ? (
              <ShieldAlert className="w-4 h-4 text-red-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="my-3">
            <div
              className={`text-base font-semibold font-mono tracking-tight ${
                isTampered ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {isTampered ? 'TAMPERING DETECTED' : 'STRUCTURE INTACT'}
            </div>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
              {isTampered
                ? forensics.tamperFindings[0] || 'CRC32 or header conflict found'
                : 'Central directory & local headers match'}
            </p>
          </div>
          <div className="text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <span>Entries: {forensics.totalEntriesFoundInCD}</span>
            <span>Slack Ghosts: {forensics.ghostEntriesInSlackSpace}</span>
          </div>
        </div>

        {/* Card 3: Consistency Judgment */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>GOALS VS ARCHITECTURE</span>
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-3">
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase ${
                overallAssessment.consistencyJudgment.verdict === 'Consistent'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
              }`}
            >
              {overallAssessment.consistencyJudgment.verdict}
            </span>
            <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2">
              {overallAssessment.consistencyJudgment.analysis}
            </p>
          </div>
          <div className="text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/80">
            <span>{overallAssessment.undeclaredAssumptions.length} undeclared assumptions</span>
          </div>
        </div>

        {/* Card 4: Light Cone & Relativistic Readiness */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>INTERPLANETARY LATENCY</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-3">
            <div className="text-base font-semibold font-mono text-cyan-300">
              6m – 44m RTT Delay
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Synchronous swaps: {flaws.some(f => f.flawId.includes('SETTLE')) ? 'Vulnerable' : 'Hardened'}
            </p>
          </div>
          <div className="text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <span>PoTT Verification</span>
            <span className={flaws.some(f => f.flawDescription.includes('PoTT')) ? 'text-amber-400' : 'text-emerald-400'}>
              {flaws.some(f => f.flawDescription.includes('PoTT')) ? 'Non-deterministic' : 'Protected'}
            </span>
          </div>
        </div>
      </div>

      {/* Domain Vulnerability Matrix */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono mb-4 flex items-center justify-between">
          <span>Protocol Audit Domain Matrix</span>
          <span className="text-[11px] text-zinc-500 font-normal">Across 5 Semantic Dimensions + Binary Layer</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              dim: 'Technical Archive',
              count: flaws.filter(f => f.dimension === 'Technical Archive').length,
              status: isTampered || isBomb || hasTraversal ? 'Vulnerabilities Detected' : 'Verified Secure',
              color: isTampered || isBomb || hasTraversal ? 'text-red-400 border-red-500/30 bg-red-950/20' : 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20'
            },
            {
              dim: 'Settlement Architecture',
              count: flaws.filter(f => f.dimension === 'Settlement Architecture').length,
              status: flaws.some(f => f.dimension === 'Settlement Architecture' && f.severity === 'Critical') ? 'Critical Flaws (Latency/Custody)' : 'Acceptable',
              color: flaws.some(f => f.dimension === 'Settlement Architecture' && f.severity === 'Critical') ? 'text-red-400 border-red-500/30 bg-red-950/20' : 'text-zinc-300 border-zinc-800 bg-zinc-950/40'
            },
            {
              dim: 'Governance',
              count: flaws.filter(f => f.dimension === 'Governance').length,
              status: flaws.some(f => f.dimension === 'Governance') ? 'Centralization / Replay Risks' : 'Replayable Evidence Chain',
              color: flaws.some(f => f.dimension === 'Governance' && f.severity === 'Critical') ? 'text-red-400 border-red-500/30 bg-red-950/20' : 'text-amber-400 border-amber-500/30 bg-amber-950/20'
            },
            {
              dim: 'Failure Handling',
              count: flaws.filter(f => f.dimension === 'Failure Handling').length,
              status: flaws.some(f => f.dimension === 'Failure Handling') ? 'Solar Conjunction Outage Gap' : 'Partition Resilient',
              color: flaws.some(f => f.dimension === 'Failure Handling') ? 'text-red-400 border-red-500/30 bg-red-950/20' : 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20'
            },
            {
              dim: 'Enforcement Asymmetry',
              count: flaws.filter(f => f.dimension === 'Enforcement Asymmetry').length,
              status: flaws.some(f => f.dimension === 'Enforcement Asymmetry') ? 'Physical Kinetic Gap' : 'Degraded Mode Present',
              color: flaws.some(f => f.dimension === 'Enforcement Asymmetry') ? 'text-amber-400 border-amber-500/30 bg-amber-950/20' : 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20'
            },
            {
              dim: 'Incentives & Game Theory',
              count: flaws.filter(f => f.dimension === 'Incentives').length,
              status: flaws.some(f => f.dimension === 'Incentives' && f.flawDescription.includes('κ-Trap')) ? 'κ-Trap Vulnerable (Monopsony)' : 'Symmetric Incentives',
              color: flaws.some(f => f.dimension === 'Incentives') ? 'text-red-400 border-red-500/30 bg-red-950/20' : 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20'
            }
          ].map(item => (
            <div key={item.dim} className={`p-3 rounded-lg border flex flex-col justify-between ${item.color}`}>
              <div className="flex items-center justify-between text-xs font-mono font-medium">
                <span>{item.dim}</span>
                <span className="font-bold">{item.count} Finding(s)</span>
              </div>
              <p className="text-[11px] mt-1.5 opacity-90 font-mono">{item.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
