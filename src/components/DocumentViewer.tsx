import React, { useState } from 'react';
import { ExtractedDocument } from '../types/audit';
import { FileText, Copy, Check, AlertTriangle, FileCode } from 'lucide-react';

interface DocumentViewerProps {
  documents: ExtractedDocument[];
  activeDocumentName?: string;
  onSelectDocument: (name: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documents,
  activeDocumentName,
  onSelectDocument
}) => {
  const [copied, setCopied] = useState(false);

  const activeDoc =
    documents.find(d => d.name === activeDocumentName) ||
    (documents.length > 0 ? documents[0] : null);

  const handleCopy = () => {
    if (activeDoc) {
      navigator.clipboard.writeText(activeDoc.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 font-mono text-xs">
        No text/markdown protocol documents were extracted from this archive.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
      {/* File Sidebar */}
      <div className="p-3 bg-zinc-950/60 space-y-1 max-h-[600px] overflow-y-auto">
        <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-500 px-2 py-1 block">
          Extracted Protocol Specs ({documents.length})
        </span>
        {documents.map(doc => {
          const isSelected = activeDoc?.name === doc.name;
          return (
            <button
              key={doc.name}
              onClick={() => onSelectDocument(doc.name)}
              className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-between gap-2 ${
                isSelected
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{doc.name}</span>
              </div>
              {doc.isSuspicious && (
                <span title="Tampered or traversal path">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* File Content Preview */}
      <div className="md:col-span-3 flex flex-col bg-zinc-950/80">
        {activeDoc ? (
          <>
            <div className="p-3 px-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-semibold text-zinc-200">
                  {activeDoc.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  ({(activeDoc.sizeBytes / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="p-4 max-h-[550px] overflow-y-auto font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap selection:bg-cyan-500/30">
              {activeDoc.content}
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-zinc-500 font-mono text-xs">
            Select a document to inspect contents.
          </div>
        )}
      </div>
    </div>
  );
};
