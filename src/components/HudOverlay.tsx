import type { RefObject } from 'react';

export interface HudSnapshot {
  stageIndex: number;
  totalStages: number;
  stageName: string;
  elapsedSeconds: number;
  crystalsCollected: number;
  totalCrystals: number;
  totalScore: number;
}

interface HudOverlayProps {
  hud: HudSnapshot;
  timerRef?: RefObject<HTMLDivElement | null>;
  muted: boolean;
  hasGamepad: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
  onPause: () => void;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds * 10) % 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

export function HudOverlay({
  hud,
  timerRef,
  muted,
  hasGamepad,
  onToggleMute,
  onRestart,
  onPause,
}: HudOverlayProps) {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
      {/* Top Perimeter Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-left compact Red/Black/White HUD bar */}
        <div
          className="px-4 py-2.5 bg-[#050506]/95 border border-zinc-700 flex items-center gap-5"
          aria-live="off"
        >
          <div>
            <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">
              Sektor {hud.stageIndex + 1}/{hud.totalStages}
            </div>
            <div className="text-sm font-display font-bold uppercase tracking-wider text-white whitespace-nowrap">
              {hud.stageName}
            </div>
          </div>

          <div className="h-7 w-px bg-zinc-800" aria-hidden="true" />

          <div>
            <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">Zeit</div>
            <div
              ref={timerRef}
              className="text-lg font-mono-num font-bold text-white leading-tight"
              data-testid="hud-timer"
            >
              {formatTime(hud.elapsedSeconds)}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">Splitter</div>
            <div className="text-lg font-mono-num font-bold text-[#EF4444] leading-tight">
              {hud.crystalsCollected}/{hud.totalCrystals}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">Punkte</div>
            <div className="text-lg font-mono-num font-bold text-zinc-100 leading-tight" data-testid="hud-score">
              {Math.round(hud.totalScore)}
            </div>
          </div>
        </div>

        {/* Top-right square icon utility buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={muted ? 'Ton einschalten [M]' : 'Ton stummschalten [M]'}
            title={muted ? 'Ton einschalten (M)' : 'Ton stummschalten (M)'}
            className="w-10 h-10 bg-[#050506]/95 hover:bg-[#18181B] border border-zinc-700 hover:border-white flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              {muted ? (
                <path d="M22 9l-6 6M16 9l6 6" stroke="#EF4444" />
              ) : (
                <path d="M15.5 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" />
              )}
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onRestart();
            }}
            aria-label="Sektor neu starten [R]"
            title="Sektor neu starten (R)"
            className="w-10 h-10 bg-[#050506]/95 hover:bg-[#18181B] border border-zinc-700 hover:border-white flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 103-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            aria-label="Pause [Esc]"
            title="Pause (Esc / P)"
            className="w-10 h-10 bg-[#050506]/95 hover:bg-[#18181B] border border-zinc-700 hover:border-[#DC2626] flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" />
              <rect x="14" y="5" width="4" height="14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom-left Gamepad cue only when connected */}
      {hasGamepad && (
        <div className="flex items-center text-xs text-zinc-300">
          <div className="px-3 py-1.5 bg-[#050506]/90 border border-zinc-800 uppercase tracking-wider font-semibold text-red-400">
            Gamepad aktiv
          </div>
        </div>
      )}
    </div>
  );
}
