import React, { useState, useEffect } from 'react';
import { CompleteAuditResult } from './types/audit';
import { ZipForensicsEngine } from './services/zipForensics';
import { ProtocolAnalyzer } from './services/protocolAnalyzer';
import { SAMPLE_ARCHIVES } from './services/sampleProtocols';
import { Header } from './components/Header';
import { ArchiveUpload } from './components/ArchiveUpload';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { Phase1Forensics } from './components/Phase1Forensics';
import { Phase2And3Flaws } from './components/Phase2And3Flaws';
import { Phase4Assessment } from './components/Phase4Assessment';
import { DocumentViewer } from './components/DocumentViewer';
import { ReportExportModal } from './components/ReportExportModal';
import {
  LayoutDashboard,
  Binary,
  ShieldAlert,
  Scale,
  FileCode2,
  Download,
  Orbit,
  Radio,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [auditResult, setAuditResult] = useState<CompleteAuditResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [activeDocName, setActiveDocName] = useState<string | undefined>(undefined);

  // Check health and server config on mount
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.hasGeminiKey) setHasGeminiKey(true);
      })
      .catch(() => {
        // Dev or client-only mode
      });

    // Auto-load Ares-Nexus v0.9 as initial benchmark demonstration
    const initialSample = SAMPLE_ARCHIVES[0];
    const initialBuf = initialSample.getZipBuffer();
    handleAnalyzeBuffer(initialBuf, initialSample.name);
  }, []);

  const handleAnalyzeBuffer = async (buffer: ArrayBuffer, fileName: string) => {
    setIsAnalyzing(true);
    setAnalyzingStep('STAGE 1: BINARY FORENSICS & HEADER VERIFICATION...');

    try {
      // Small tick for smooth UI transition
      await new Promise(r => setTimeout(r, 120));

      // Phase 1: Parse binary structures, verify CRC32, local headers, traversal, zip bomb
      const { forensics, documents } = ZipForensicsEngine.analyzeZip(buffer, fileName);

      setAnalyzingStep('STAGE 2: PROTOCOL REASONING & SEMANTIC DIAGNOSTICS...');
      await new Promise(r => setTimeout(r, 150));

      // Phase 2, 3, 4: Semantic analysis & flaw synthesis
      const fullAudit = await ProtocolAnalyzer.analyze(fileName, forensics, documents);

      setAuditResult(fullAudit);
      if (documents.length > 0) {
        setActiveDocName(documents[0].name);
      }
    } catch (err: any) {
      console.error('Audit failed:', err);
      alert(`Audit process failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
      setAnalyzingStep('');
    }
  };

  const handleJumpToDocument = (evidenceLocation: string) => {
    if (!auditResult) return;
    // Look for matching document name in evidenceLocation
    const match = auditResult.documents.find(d =>
      evidenceLocation.toLowerCase().includes(d.name.toLowerCase())
    );
    if (match) {
      setActiveDocName(match.name);
      setActiveTab('docs');
    } else {
      setActiveTab('docs');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Telemetry Header */}
      <Header
        analyzedViaAI={auditResult?.analyzedViaAI || false}
        aiModel={auditResult?.aiModel}
        hasGeminiKey={hasGeminiKey}
        activeArchiveName={auditResult?.archiveName}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Upload & Benchmark Archive Selector */}
        <ArchiveUpload
          onAnalyzeBuffer={handleAnalyzeBuffer}
          isAnalyzing={isAnalyzing}
          analyzingStep={analyzingStep}
        />

        {/* Audit Results Dashboard */}
        {auditResult && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Primary Navigation Bar & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              {/* Tab buttons */}
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                {[
                  { id: 'summary', label: 'Executive Summary', icon: LayoutDashboard },
                  {
                    id: 'phase1',
                    label: 'Phase 1: Archive Forensics',
                    icon: Binary,
                    badge: auditResult.forensics.isTampered ? 'Tampered' : 'Valid',
                    badgeColor: auditResult.forensics.isTampered ? 'text-red-400 bg-red-950 border-red-800' : 'text-emerald-400 bg-emerald-950 border-emerald-800'
                  },
                  {
                    id: 'flaws',
                    label: 'Phase 2 & 3: Flaw Diagnostic',
                    icon: ShieldAlert,
                    badge: `${auditResult.flaws.length}`,
                    badgeColor: 'text-zinc-200 bg-zinc-800 border-zinc-700'
                  },
                  {
                    id: 'phase4',
                    label: 'Phase 4: Assessment',
                    icon: Scale,
                    badge: auditResult.overallAssessment.consistencyJudgment.verdict.split(' ')[0],
                    badgeColor: 'text-amber-300 bg-amber-950 border-amber-800'
                  },
                  {
                    id: 'docs',
                    label: 'Extracted Specs',
                    icon: FileCode2,
                    badge: `${auditResult.documents.length}`,
                    badgeColor: 'text-zinc-400 bg-zinc-900 border-zinc-800'
                  }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 border ${
                        isActive
                          ? 'bg-zinc-850 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                          : 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border-zinc-800'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`} />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className={`px-1.5 py-0.2 rounded text-[10px] border ${tab.badgeColor}`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Export Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-cyan-600/90 hover:bg-cyan-500 text-white border border-cyan-400/50 text-xs font-mono font-medium flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                >
                  <Download className="w-3.5 h-3.5" /> Export Diagnostic Report
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="transition-all">
              {activeTab === 'summary' && (
                <ExecutiveSummary audit={auditResult} onNavigateTab={setActiveTab} />
              )}

              {activeTab === 'phase1' && (
                <Phase1Forensics forensics={auditResult.forensics} />
              )}

              {activeTab === 'flaws' && (
                <Phase2And3Flaws
                  flaws={auditResult.flaws}
                  documents={auditResult.documents}
                  onViewDocument={handleJumpToDocument}
                />
              )}

              {activeTab === 'phase4' && (
                <Phase4Assessment assessment={auditResult.overallAssessment} />
              )}

              {activeTab === 'docs' && (
                <DocumentViewer
                  documents={auditResult.documents}
                  activeDocumentName={activeDocName}
                  onSelectDocument={setActiveDocName}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Report Export Modal */}
      {showExportModal && auditResult && (
        <ReportExportModal
          audit={auditResult}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
