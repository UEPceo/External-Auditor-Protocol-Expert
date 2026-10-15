import React, { useState, useEffect } from 'react';
import { ShieldAlert, Radio, Cpu, Sparkles, Orbit } from 'lucide-react';

interface HeaderProps {
  analyzedViaAI: boolean;
  aiModel?: string;
  hasGeminiKey: boolean;
  activeArchiveName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  analyzedViaAI,
  aiModel,
  hasGeminiKey,
  activeArchiveName
}) => {
  // Simulate live dynamic astronomical light delay (Earth-Mars ~3 to ~22 minutes one-way)
  const [lightDelaySeconds, setLightDelaySeconds] = useState(862); // ~14m 22s

  useEffect(() => {
    const timer = setInterval(() => {
      setLightDelaySeconds(prev => (prev >= 1320 ? 360 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const formatDelay = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const roundTrip = lightDelaySeconds * 2;

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Orbit className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-zinc-100 tracking-tight font-sans">
                AEGIS-ORBIT
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 rounded">
                Audit Core v2.4
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Autonomous ZIP Archive Forensics &amp; Interplanetary Economic Protocol Diagnostic System
            </p>
          </div>
        </div>

        {/* Telemetry & System Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Light Cone Latency Simulation */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900/80 border border-zinc-800 text-zinc-300">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-zinc-500 text-[11px]">Earth–Mars OWD:</span>
            <span className="text-amber-300 font-semibold">{formatDelay(lightDelaySeconds)}</span>
            <span className="text-zinc-600 text-[10px]">({formatDelay(roundTrip)} RTT)</span>
          </div>

          {/* AI Diagnostic Status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900/80 border border-zinc-800">
            {analyzedViaAI ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-medium">{aiModel || 'Gemini 3.8 Flash'}</span>
              </>
            ) : hasGeminiKey ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-zinc-300">Gemini Online</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-300">Deterministic Engine Active</span>
              </>
            )}
          </div>

          {/* Active target */}
          {activeArchiveName && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-950/40 border border-cyan-800/50 text-cyan-300">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate max-w-[140px] font-mono text-[11px]">{activeArchiveName}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
