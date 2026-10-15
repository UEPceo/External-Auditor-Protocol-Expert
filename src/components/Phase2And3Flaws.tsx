import React, { useState } from 'react';
import { ProtocolFlaw, Severity, Dimension, ExtractedDocument } from '../types/audit';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Search,
  Filter,
  FileText,
  Shield,
  History,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface Phase2And3FlawsProps {
  flaws: ProtocolFlaw[];
  documents: ExtractedDocument[];
  onViewDocument?: (docName: string) => void;
}

export const Phase2And3Flaws: React.FC<Phase2And3FlawsProps> = ({
  flaws,
  documents,
  onViewDocument
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'All'>('All');
  const [selectedDimension, setSelectedDimension] = useState<Dimension | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const dimensions: Dimension[] = [
    'Settlement Architecture',
    'Governance',
    'Failure Handling',
    'Enforcement Asymmetry',
    'Incentives',
    'Technical Archive'
  ];

  const filteredFlaws = flaws.filter(flaw => {
    if (selectedSeverity !== 'All' && flaw.severity !== selectedSeverity) return false;
    if (selectedDimension !== 'All' && flaw.dimension !== selectedDimension) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        flaw.flawId.toLowerCase().includes(q) ||
        flaw.flawDescription.toLowerCase().includes(q) ||
        flaw.evidenceLocation.toLowerCase().includes(q) ||
        flaw.potentialImpact.toLowerCase().includes(q) ||
        flaw.remediationRecommendation.toLowerCase().includes(q) ||
        flaw.precedent.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-red-950/80 text-red-400 border border-red-700/60 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <AlertOctagon className="w-3.5 h-3.5" /> CRITICAL
          </span>
        );
      case 'Major':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-700/60 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            <AlertTriangle className="w-3.5 h-3.5" /> MAJOR
          </span>
        );
      case 'Minor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-blue-950/80 text-blue-400 border border-blue-700/60">
            <Info className="w-3.5 h-3.5" /> MINOR
          </span>
        );
    }
  };

  const getDimensionBadge = (dim: Dimension) => {
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
        {dim}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold font-mono text-zinc-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Phase 2 &amp; 3: Protocol Flaw Classification &amp; Remediation Matrix
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Structured diagnostic findings across settlement validity, governance, failure resilience, and game-theoretic incentives
            </p>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search flaws, evidence, precedents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 w-full md:w-72"
            />
          </div>
        </div>

        {/* Severity Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800">
          <span className="text-xs font-mono text-zinc-500 mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Severity:
          </span>
          {(['All', 'Critical', 'Major', 'Minor'] as const).map(sev => {
            const count = sev === 'All' ? flaws.length : flaws.filter(f => f.severity === sev).length;
            const active = selectedSeverity === sev;
            return (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <span>{sev}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    active ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-850 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dimension Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          <span className="text-xs font-mono text-zinc-500 mr-2">Dimension:</span>
          <button
            onClick={() => setSelectedDimension('All')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all ${
              selectedDimension === 'All'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-semibold'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            All Dimensions
          </button>
          {dimensions.map(dim => {
            const count = flaws.filter(f => f.dimension === dim).length;
            const active = selectedDimension === dim;
            return (
              <button
                key={dim}
                onClick={() => setSelectedDimension(dim)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all flex items-center gap-1 ${
                  active
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-semibold'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <span>{dim}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Flaws List */}
      <div className="space-y-4">
        {filteredFlaws.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 font-mono text-xs">
            No flaws found matching current filters.
          </div>
        ) : (
          filteredFlaws.map(flaw => {
            const isCrit = flaw.severity === 'Critical';
            const isMaj = flaw.severity === 'Major';

            return (
              <div
                key={flaw.flawId}
                className={`border rounded-xl p-5 transition-all shadow-md ${
                  isCrit
                    ? 'bg-red-950/10 border-red-500/40 hover:border-red-500/60'
                    : isMaj
                    ? 'bg-amber-950/10 border-amber-500/40 hover:border-amber-500/60'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Flaw Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold font-mono text-zinc-100 tracking-wider px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                      {flaw.flawId}
                    </span>
                    {getSeverityBadge(flaw.severity)}
                    {getDimensionBadge(flaw.dimension)}
                  </div>

                  {/* Evidence Location Link */}
                  <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-zinc-500">Evidence:</span>
                    <button
                      onClick={() => onViewDocument && onViewDocument(flaw.evidenceLocation)}
                      className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 flex items-center gap-1"
                      title="Inspect referenced document"
                    >
                      {flaw.evidenceLocation}
                      <ExternalLink className="w-3 h-3 inline" />
                    </button>
                  </div>
                </div>

                {/* Flaw Description */}
                <div className="mt-3.5">
                  <h4 className="text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1 font-semibold">
                    Flaw Description:
                  </h4>
                  <p className="text-sm text-zinc-200 leading-relaxed font-sans">
                    {flaw.flawDescription}
                  </p>
                </div>

                {/* Impact & Remediation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
                  {/* Potential Impact */}
                  <div className="bg-zinc-950/60 border border-zinc-800/90 rounded-lg p-3">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-red-400 font-semibold mb-1 flex items-center gap-1.5">
                      <AlertOctagon className="w-3 h-3 text-red-400" />
                      Potential Impact:
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {flaw.potentialImpact}
                    </p>
                  </div>

                  {/* Remediation Recommendation */}
                  <div className="bg-zinc-950/60 border border-zinc-800/90 rounded-lg p-3">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      Remediation Recommendation:
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {flaw.remediationRecommendation}
                    </p>
                  </div>
                </div>

                {/* Precedent Citation */}
                {flaw.precedent && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-start gap-2 text-xs font-mono text-zinc-400">
                    <History className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-amber-400 font-semibold">Historical Precedent:</span>{' '}
                      <span className="text-zinc-300">{flaw.precedent}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
