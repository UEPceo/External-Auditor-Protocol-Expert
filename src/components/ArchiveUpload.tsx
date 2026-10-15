import React, { useRef, useState } from 'react';
import { UploadCloud, FileArchive, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { SAMPLE_ARCHIVES, SampleArchiveMeta } from '../services/sampleProtocols';

interface ArchiveUploadProps {
  onAnalyzeBuffer: (buffer: ArrayBuffer, fileName: string) => Promise<void>;
  isAnalyzing: boolean;
  analyzingStep?: string;
}

export const ArchiveUpload: React.FC<ArchiveUploadProps> = ({
  onAnalyzeBuffer,
  isAnalyzing,
  analyzingStep
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert('Forensic audit requires a ZIP archive (.zip) containing protocol specifications.');
      return;
    }
    const arrayBuffer = await file.arrayBuffer();
    await onAnalyzeBuffer(arrayBuffer, file.name);
  };

  const loadSample = async (sample: SampleArchiveMeta) => {
    const buf = sample.getZipBuffer();
    await onAnalyzeBuffer(buf, sample.name);
  };

  return (
    <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm shadow-xl">
      <div className="flex flex-col lg:flex-row items-stretch gap-6">
        {/* Upload Drop Zone */}
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-950/20 scale-[0.99]'
              : 'border-zinc-700/70 hover:border-cyan-500/50 hover:bg-zinc-800/40 bg-zinc-950/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".zip"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          {isAnalyzing ? (
            <div className="flex flex-col items-center py-4">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
              <p className="text-sm font-medium text-zinc-100 font-mono tracking-wide">
                {analyzingStep || 'EXECUTING FORENSIC DEEP AUDIT...'}
              </p>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                Dissecting binary headers, CRC32 records, light-cone constraints &amp; game-theoretic models
              </p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Upload Protocol Design Archive (.zip)
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Drag and drop your protocol ZIP package or click to browse. Performs byte-level tamper verification, zip bomb detection, and multi-dimensional semantic flaw audits.
              </p>
              <div className="flex items-center gap-3 mt-4 text-[11px] text-zinc-500 font-mono">
                <span>• CRC32 / Header Integrity</span>
                <span>• Path Traversal / Bombs</span>
                <span>• Relativistic Settlement Checks</span>
              </div>
            </>
          )}
        </div>

        {/* Pre-configured Test Protocol Suites */}
        <div className="lg:w-96 flex flex-col justify-between bg-zinc-950/60 border border-zinc-800 rounded-xl p-4">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Audit Benchmark Suites
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Click to test</span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">
              Load realistic interplanetary protocol design archives with deliberate binary and game-theoretic vulnerabilities:
            </p>

            <div className="space-y-2">
              {SAMPLE_ARCHIVES.map(sample => (
                <button
                  key={sample.id}
                  disabled={isAnalyzing}
                  onClick={() => loadSample(sample)}
                  className="w-full text-left p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all group flex flex-col gap-1 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold font-mono text-zinc-200 group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                      <FileArchive className="w-3.5 h-3.5 text-zinc-400 group-hover:text-cyan-400" />
                      {sample.name}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${sample.badgeColor}`}>
                      {sample.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-1">{sample.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>RFC 1951 / APPNOTE / OST Art. VI</span>
            <span className="text-cyan-400/80 flex items-center gap-1">
              Ready <CheckCircle2 className="w-3 h-3 text-cyan-400" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
