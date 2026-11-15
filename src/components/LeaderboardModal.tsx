import { useCallback, useEffect, useState } from 'react';
import type { ControlLabels } from '../game/controls';
import { loadLeaderboard } from '../game/leaderboard';
import type { LeaderboardEntry } from '../game/types';
import { GAME_EDITION, GAME_VERSION } from '../game/version';
import { useMenuNavigation, type MenuInputSubscriber } from '../hooks/useMenuNavigation';
import { formatTime } from './HudOverlay';
import { InputPrompt } from './InputPrompt';

interface LeaderboardModalProps {
  open: boolean;
  controls: ControlLabels;
  onClose: () => void;
  subscribeMenuInput: MenuInputSubscriber;
}

export function LeaderboardModal({ open, controls, onClose, subscribeMenuInput }: LeaderboardModalProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    setEntries(loadLeaderboard());
  }, [open]);

  const handleConfirm = useCallback(() => {
    onClose();
  }, [onClose]);

  useMenuNavigation({
    active: open,
    itemCount: 1,
    initialIndex: 0,
    subscribeMenuInput,
    onConfirm: handleConfirm,
    onBack: onClose,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#030304]/85">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leaderboard-dialog-title"
        className="rounded-2xl crimson-edge-glow w-full max-w-2xl bg-[#09090B] border border-zinc-700 p-6 sm:p-8 text-zinc-100 max-h-[88vh] flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 mb-5 border-b border-zinc-800 pb-4">
          <div>
            <h2
              id="leaderboard-dialog-title"
              className="text-3xl font-display font-bold uppercase tracking-wider text-white"
            >
              Bestenliste &amp; Rekorde
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Schnellste Läufe durch alle vierzehn Sektoren von Rote Asche.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Rangliste schließen"
            className="px-4 py-2 rounded-xl flex items-center gap-2 bg-[#18181B] hover:bg-[#DC2626] border border-white text-xs font-bold uppercase tracking-wider text-white cursor-pointer transition-colors"
          >
            <span>Schließen</span>
            <InputPrompt label={controls.back} mode={controls.mode} tone="inverted" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {entries.length === 0 ? (
            <div className="py-10 text-center text-sm text-zinc-400">
              Noch keine Einträge gespeichert.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-widest text-zinc-400">
                  <th className="py-2.5 pr-3 font-semibold">Rang</th>
                  <th className="py-2.5 pr-3 font-semibold">Läufer</th>
                  <th className="py-2.5 pr-3 font-semibold text-right">Zeit</th>
                  <th className="py-2.5 pr-3 font-semibold text-right">Splitter</th>
                  <th className="py-2.5 font-semibold text-right">Punkte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-sm">
                {entries.map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-[#141418]">
                    <td
                      className={`py-3 pr-3 font-mono-num font-bold ${
                        idx === 0 ? 'text-[#EF4444]' : 'text-zinc-300'
                      }`}
                    >
                      #{idx + 1}
                    </td>
                    <td className="py-3 pr-3 font-semibold text-white">{entry.playerName}</td>
                    <td className="py-3 pr-3 font-mono-num text-right text-zinc-200">
                      {formatTime(entry.totalTimeMs / 1000)}
                    </td>
                    <td className="py-3 pr-3 font-mono-num text-right text-[#EF4444]">
                      {entry.crystalsCollected}
                    </td>
                    <td className="py-3 font-mono-num text-right font-bold text-white">
                      {entry.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-zinc-400">
          <span>Gespeichert im lokalen Browser-Profil · {GAME_VERSION} ({GAME_EDITION})</span>
          <span className="inline-flex items-center gap-1.5">
            <InputPrompt label={controls.back} mode={controls.mode} />
            <InputPrompt label={controls.confirm} mode={controls.mode} />
            <span>Schließen</span>
          </span>
        </div>
      </div>
    </div>
  );
}
