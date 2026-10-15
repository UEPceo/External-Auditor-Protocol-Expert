import React, { useState } from 'react';
import { ForensicReport, CentralDirectoryEntry } from '../types/audit';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Bomb,
  FolderTree,
  Lock,
  Search,
  CheckCircle2,
  XCircle,
  Binary
} from 'lucide-react';

interface Phase1ForensicsProps {
  forensics: ForensicReport;
}

export const Phase1Forensics: React.FC<Phase1ForensicsProps> = ({ forensics }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<CentralDirectoryEntry | null>(
    forensics.entries.length > 0 ? forensics.entries[0] : null
  );

  const filteredEntries = forensics.entries.filter(e =>
    e.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Forensic Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1.1 Tamper Detection */}
        <div className={`p-4 rounded-xl border ${
          forensics.isTampered
            ? 'bg-red-950/20 border-red-500/40'
            : 'bg-zinc-900/60 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold tracking-wide text-zinc-300">
              1.1 TAMPER DETECTION
            </span>
            {forensics.isTampered ? (
              <ShieldAlert className="w-4 h-4 text-red-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="text-sm font-semibold font-mono text-zinc-100">
            {forensics.isTampered ? (
              <span className="text-red-400">ANOMALIES CONFIRMED</span>
            ) : (
              <span className="text-emerald-400">HEADERS SYNCHRONIZED</span>
            )}
          </div>
          <div className="mt-3 space-y-1.5 text-xs font-mono text-zinc-400">
            <div className="flex justify-between">
              <span>CRC32 Header Matches:</span>
              <span className={forensics.entries.some(e => e.crcMismatch) ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {forensics.entries.filter(e => !e.crcMismatch).length} / {forensics.entries.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Size Declaration Conflicts:</span>
              <span className={forensics.entries.some(e => e.sizeMismatch) ? 'text-red-400 font-bold' : 'text-zinc-300'}>
                {forensics.entries.filter(e => e.sizeMismatch).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Slack Space Ghost Entries:</span>
              <span className={forensics.ghostEntriesInSlackSpace > 0 ? 'text-red-400 font-bold' : 'text-zinc-300'}>
                {forensics.ghostEntriesInSlackSpace}
              </span>
            </div>
          </div>
        </div>

        {/* 1.2 Malicious Construction */}
        <div className={`p-4 rounded-xl border ${
          forensics.maliciousConstructs.pathTraversalCount > 0 || forensics.maliciousConstructs.zipBombDetected
            ? 'bg-amber-950/20 border-amber-500/40'
            : 'bg-zinc-900/60 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold tracking-wide text-zinc-300">
              1.2 MALICIOUS CONSTRUCTION
            </span>
            <Bomb className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-semibold font-mono text-zinc-100">
            {forensics.maliciousConstructs.zipBombDetected ? (
              <span className="text-red-400">ZIP BOMB DETECTED</span>
            ) : forensics.maliciousConstructs.pathTraversalCount > 0 ? (
              <span className="text-amber-400">PATH TRAVERSAL DETECTED</span>
            ) : (
              <span className="text-emerald-400">NO EXPLOIT PAYLOADS</span>
            )}
          </div>
          <div className="mt-3 space-y-1.5 text-xs font-mono text-zinc-400">
            <div className="flex justify-between">
              <span>Max Compression Ratio:</span>
              <span className={forensics.maliciousConstructs.maxCompressionRatio > 50 ? 'text-red-400 font-bold' : 'text-zinc-300'}>
                {forensics.maliciousConstructs.maxCompressionRatio.toFixed(1)}:1
              </span>
            </div>
            <div className="flex justify-between">
              <span>Path Traversal (../) Attempts:</span>
              <span className={forensics.maliciousConstructs.pathTraversalCount > 0 ? 'text-red-400 font-bold' : 'text-zinc-300'}>
                {forensics.maliciousConstructs.pathTraversalCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Symlink Entries (S_IFLNK):</span>
              <span className={forensics.maliciousConstructs.symlinkCount > 0 ? 'text-amber-400 font-bold' : 'text-zinc-300'}>
                {forensics.maliciousConstructs.symlinkCount}
              </span>
            </div>
          </div>
        </div>

        {/* 1.3 Structural Integrity */}
        <div className="p-4 rounded-xl border bg-zinc-900/60 border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold tracking-wide text-zinc-300">
              1.3 STRUCTURAL INTEGRITY
            </span>
            <FolderTree className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-sm font-semibold font-mono text-zinc-100">
            <span>EOCD / CENTRAL DIR VALID</span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs font-mono text-zinc-400">
            <div className="flex justify-between">
              <span>Central Dir Offset:</span>
              <span className="text-zinc-300">0x{forensics.centralDirectoryOffset.toString(16).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>EOCD Offset:</span>
              <span className="text-zinc-300">0x{forensics.eocdOffset.toString(16).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>Encryption Ciphers:</span>
              <span className={forensics.structuralIntegrity.encryptedEntriesCount > 0 ? 'text-amber-300' : 'text-zinc-500'}>
                {forensics.structuralIntegrity.encryptedEntriesCount > 0
                  ? forensics.structuralIntegrity.encryptionTypes.join(', ')
                  : 'None (Plaintext)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Forensic Findings Log */}
      {forensics.tamperFindings.length > 0 && (
        <div className="border border-red-500/30 bg-red-950/20 rounded-xl p-4">
          <h4 className="text-xs font-mono font-semibold text-red-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Archive Tampering &amp; Header Discrepancies ({forensics.tamperFindings.length})
          </h4>
          <ul className="space-y-1.5 text-xs font-mono text-red-200/90 list-disc list-inside">
            {forensics.tamperFindings.map((finding, idx) => (
              <li key={idx} className="leading-relaxed">
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Malicious Construction Log */}
      {forensics.maliciousConstructs.details.length > 0 && (
        <div className="border border-amber-500/30 bg-amber-950/20 rounded-xl p-4">
          <h4 className="text-xs font-mono font-semibold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Bomb className="w-4 h-4 text-amber-400" />
            Malicious Construction &amp; Resource Exhaustion Signals ({forensics.maliciousConstructs.details.length})
          </h4>
          <ul className="space-y-1.5 text-xs font-mono text-amber-200/90 list-disc list-inside">
            {forensics.maliciousConstructs.details.map((detail, idx) => (
              <li key={idx} className="leading-relaxed">
                {detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Central Directory Entries Forensic Table & Hex Inspector */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold font-mono text-zinc-100 flex items-center gap-2">
              <Binary className="w-4 h-4 text-cyan-400" />
              ZIP Central Directory &amp; Local Header Forensics Inspector
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Compare declared Central Directory parameters against actual Local File Headers byte-for-byte
            </p>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search entry paths..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
          {/* Entries list */}
          <div className="lg:col-span-2 overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-950/80 text-zinc-400 sticky top-0 border-b border-zinc-800 z-10">
                <tr>
                  <th className="py-2.5 px-3">Entry Name</th>
                  <th className="py-2.5 px-3">Local Offset</th>
                  <th className="py-2.5 px-3">Declared CRC32</th>
                  <th className="py-2.5 px-3">Compression</th>
                  <th className="py-2.5 px-3">Ratio</th>
                  <th className="py-2.5 px-3">Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredEntries.map((entry, idx) => {
                  const isSelected = selectedEntry?.fileName === entry.fileName;
                  const hasIssue = entry.crcMismatch || entry.sizeMismatch || entry.offsetAnomaly || entry.traversalDetected;

                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedEntry(entry)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-950/30'
                          : hasIssue
                          ? 'bg-red-950/10 hover:bg-red-950/20'
                          : 'hover:bg-zinc-850/50'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-medium text-zinc-200 max-w-[220px] truncate">
                        <div className="flex items-center gap-1.5">
                          <FileCode className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className={entry.traversalDetected ? 'text-red-400 font-bold' : ''}>
                            {entry.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        0x{entry.relativeOffsetOfLocalHeader.toString(16).toUpperCase()}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300">
                        0x{entry.crc32.toString(16).toUpperCase().padStart(8, '0')}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        {entry.compressionMethodName.split(' ')[0]}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        {entry.compressionRatio.toFixed(1)}:1
                      </td>
                      <td className="py-2.5 px-3">
                        {entry.crcMismatch ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-950/80 text-red-400 border border-red-800/50 font-bold flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" /> CRC Mismatch
                          </span>
                        ) : entry.traversalDetected ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950/80 text-amber-400 border border-amber-800/50 font-bold flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Traversal
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detailed Entry Inspector Side Panel */}
          <div className="p-4 bg-zinc-950/40 text-xs font-mono space-y-4">
            {selectedEntry ? (
              <>
                <div className="pb-3 border-b border-zinc-800">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">Selected Entry</span>
                  <h4 className="text-sm font-semibold text-cyan-300 break-all mt-0.5">
                    {selectedEntry.fileName}
                  </h4>
                </div>

                {/* Local vs Central Directory Side-by-Side */}
                <div className="space-y-3">
                  <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
                      Central Directory Record
                    </span>
                    <div className="mt-1.5 space-y-1 text-zinc-300 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Declared CRC32:</span>
                        <span className="font-bold">0x{selectedEntry.crc32.toString(16).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Compressed Size:</span>
                        <span>{selectedEntry.compressedSize} B</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Uncompressed Size:</span>
                        <span>{selectedEntry.uncompressedSize} B</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Local Header Offset:</span>
                        <span>0x{selectedEntry.relativeOffsetOfLocalHeader.toString(16).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Bit Flag:</span>
                        <span>0x{selectedEntry.bitFlag.toString(16).padStart(4, '0')}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-lg border ${
                    selectedEntry.crcMismatch || selectedEntry.sizeMismatch
                      ? 'bg-red-950/20 border-red-500/40'
                      : 'bg-zinc-900/80 border-zinc-800'
                  }`}>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold flex items-center justify-between">
                      <span>Local File Header at 0x{selectedEntry.relativeOffsetOfLocalHeader.toString(16).toUpperCase()}</span>
                      {selectedEntry.crcMismatch && (
                        <span className="text-red-400 font-bold">Tampered</span>
                      )}
                    </span>
                    {selectedEntry.localHeaderParsed ? (
                      <div className="mt-1.5 space-y-1 text-zinc-300 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Local CRC32:</span>
                          <span className={selectedEntry.crcMismatch ? 'text-red-400 font-bold' : ''}>
                            0x{selectedEntry.localHeaderParsed.crc32.toString(16).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Local Comp Size:</span>
                          <span className={selectedEntry.sizeMismatch ? 'text-red-400 font-bold' : ''}>
                            {selectedEntry.localHeaderParsed.compressedSize} B
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Local Uncomp Size:</span>
                          <span>{selectedEntry.localHeaderParsed.uncompressedSize} B</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Data Offset:</span>
                          <span>0x{selectedEntry.localHeaderParsed.dataOffset.toString(16).toUpperCase()}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-red-400 mt-1">Failed to parse Local Header at specified offset.</p>
                    )}
                  </div>

                  {selectedEntry.notes.length > 0 && (
                    <div className="p-2 bg-red-950/30 border border-red-800/40 rounded text-red-300 text-[11px]">
                      <span className="font-semibold block mb-0.5">Forensic Notes:</span>
                      {selectedEntry.notes.join('; ')}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-zinc-500">Select an entry from the table to view header inspection.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
