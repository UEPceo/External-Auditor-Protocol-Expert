import React, { useState } from 'react';
import { CompleteAuditResult } from '../types/audit';
import { Download, Copy, Check, X, FileText, Code2 } from 'lucide-react';

interface ReportExportModalProps {
  audit: CompleteAuditResult;
  onClose: () => void;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({ audit, onClose }) => {
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown');
  const [copied, setCopied] = useState(false);

  const generateMarkdownReport = (a: CompleteAuditResult): string => {
    const { forensics, flaws, overallAssessment } = a;

    return `# AUTONOMOUS PROTOCOL AUDIT & DESIGN-FLAW DIAGNOSTIC REPORT
Archive Target: ${a.archiveName}
Audit Timestamp: ${a.auditTimestamp}
Audit System: Aegis-Orbit Interplanetary Forensic Engine v2.4
Analysis Model: ${a.analyzedViaAI ? a.aiModel : 'Deterministic Forensic Rule Engine'}

---

## EXECUTIVE SUMMARY
- Total Diagnostic Flaws: ${flaws.length}
  - Critical: ${flaws.filter(f => f.severity === 'Critical').length}
  - Major: ${flaws.filter(f => f.severity === 'Major').length}
  - Minor: ${flaws.filter(f => f.severity === 'Minor').length}
- Archive Integrity: ${forensics.isTampered ? 'TAMPERING DETECTED' : 'PASSED'}
- Stated vs Actual Consistency: ${overallAssessment.consistencyJudgment.verdict}

---

## PHASE 1: ARCHIVE INTEGRITY FORENSICS (TECHNICAL LAYER)

### 1.1 Tamper Detection
- Total Declared Entries: ${forensics.totalEntriesDeclared}
- Central Directory Parsed Entries: ${forensics.totalEntriesFoundInCD}
- Local File Headers Scanned: ${forensics.totalLocalHeadersFound}
- Ghost Slack Entries: ${forensics.ghostEntriesInSlackSpace}
- Central Directory Offset: 0x${forensics.centralDirectoryOffset.toString(16).toUpperCase()}
- EOCD Offset: 0x${forensics.eocdOffset.toString(16).toUpperCase()}
${forensics.tamperFindings.length > 0 ? '\nFindings:\n' + forensics.tamperFindings.map(f => `- [TAMPER ALERT] ${f}`).join('\n') : '- No byte-level header tampering detected.'}

### 1.2 Malicious Construction Detection
- Path Traversal Exploits: ${forensics.maliciousConstructs.pathTraversalCount}
- Symlink Entities (S_IFLNK): ${forensics.maliciousConstructs.symlinkCount}
- Zip Bomb Ratio: ${forensics.maliciousConstructs.maxCompressionRatio.toFixed(1)}:1
- Cumulative Uncompressed Bytes: ${(forensics.maliciousConstructs.cumulativeUncompressedBytes / (1024 * 1024)).toFixed(2)} MB
${forensics.maliciousConstructs.details.length > 0 ? '\nConstruct Details:\n' + forensics.maliciousConstructs.details.map(d => `- [EXPLOIT RISK] ${d}`).join('\n') : '- No malicious construction vectors identified.'}

### 1.3 Structural Integrity & Cryptography
- Compression Algorithms: ${forensics.structuralIntegrity.compressionMethodsUsed.map(c => `${c.method} (${c.count})`).join(', ') || 'None'}
- Encryption Detection: ${forensics.structuralIntegrity.encryptedEntriesCount > 0 ? forensics.structuralIntegrity.encryptionTypes.join(', ') : 'None (Plaintext)'}

---

## PHASE 2 & 3: PROTOCOL DESIGN FLAW DIAGNOSIS & REMEDIATION

${flaws.map(f => `### [${f.flawId}] ${f.flawDescription.slice(0, 80)}...
- **Severity**: ${f.severity}
- **Dimension**: ${f.dimension}
- **Evidence Location**: \`${f.evidenceLocation}\`
- **Flaw Description**: ${f.flawDescription}
- **Potential Impact**: ${f.potentialImpact}
- **Remediation Recommendation**: ${f.remediationRecommendation}
- **Precedent**: ${f.precedent || 'N/A'}
`).join('\n---\n\n')}

---

## PHASE 4: OVERALL ASSESSMENT

### 1. Consistency Judgment
**Verdict**: ${overallAssessment.consistencyJudgment.verdict}
${overallAssessment.consistencyJudgment.analysis}

### 2. Undeclared Assumptions List
| Implicit Assumption | Specification Context | Catastrophic Risk |
|---|---|---|
${overallAssessment.undeclaredAssumptions.map(u => `| ${u.assumption} | ${u.context} | ${u.risk} |`).join('\n')}

### 3. Recommended Next Steps (Prioritized)
${overallAssessment.recommendedNextSteps.map(s => `- **[${s.priority}] ${s.action}**\n  - *Rationale*: ${s.rationale}`).join('\n')}
`;
  };

  const contentText =
    format === 'markdown'
      ? generateMarkdownReport(audit)
      : JSON.stringify(audit, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(contentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([contentText], {
      type: format === 'markdown' ? 'text/markdown;charset=utf-8;' : 'application/json;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AUDIT_REPORT_${audit.archiveName.replace(/[^a-zA-Z0-9_-]/g, '_')}.${format === 'markdown' ? 'md' : 'json'}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 px-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-semibold font-mono text-zinc-100">
                Export Protocol Diagnostic Audit Report
              </h3>
              <p className="text-xs text-zinc-400">
                Phase 1 to Phase 4 Structured Audit Deliverable
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 px-6 bg-zinc-950/60 border-b border-zinc-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormat('markdown')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                format === 'markdown'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Markdown (.md)
            </button>
            <button
              onClick={() => setFormat('json')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                format === 'json'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> Structured JSON (.json)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-mono font-semibold text-white flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.25)]"
            >
              <Download className="w-3.5 h-3.5" /> Download File
            </button>
          </div>
        </div>

        {/* Preview Code View */}
        <div className="p-4 px-6 overflow-y-auto flex-1 bg-zinc-950 font-mono text-xs text-zinc-300 whitespace-pre leading-relaxed select-all">
          {contentText}
        </div>
      </div>
    </div>
  );
};
