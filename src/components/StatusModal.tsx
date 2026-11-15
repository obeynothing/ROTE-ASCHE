import { useEffect, useState } from 'react';
import { saveLeaderboardRun } from '../game/leaderboard';
import type { GameScreenState } from '../game/types';
import { formatTime } from './HudOverlay';

interface StatusModalProps {
  screen: GameScreenState;
  stageIndex: number;
  totalStages: number;
  stageElapsedSeconds: number;
  runElapsedSeconds: number;
  crystalsCollected: number;
  totalCrystals: number;
  runCrystals: number;
  deaths: number;
  totalScore: number;
  onResume: () => void;
  onRestartStage: () => void;
  onNextStage: () => void;
  onRestartRun: () => void;
  onReturnTitle: () => void;
  onOpenLeaderboard: () => void;
}

export function StatusModal({
  screen,
  stageIndex,
  totalStages,
  stageElapsedSeconds,
  runElapsedSeconds,
  crystalsCollected,
  totalCrystals,
  runCrystals,
  deaths,
  totalScore,
  onResume,
  onRestartStage,
  onNextStage,
  onRestartRun,
  onReturnTitle,
  onOpenLeaderboard,
}: StatusModalProps) {
  const [playerName, setPlayerName] = useState('SCHATTEN');
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (screen === 'victory') {
      setSubmittedRank(null);
      setSubmitError(null);
    }
  }, [screen, totalScore]);

  if (screen !== 'paused' && screen !== 'stage_clear' && screen !== 'victory') {
    return null;
  }

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = playerName.trim();
    if (!cleaned) {
      setSubmitError('Bitte einen Namen eingeben.');
      return;
    }
    setSubmitError(null);
    const result = saveLeaderboardRun({
      playerName: cleaned,
      score: Math.round(totalScore),
      totalTimeMs: Math.round(runElapsedSeconds * 1000),
      crystalsCollected: runCrystals,
      stagesCleared: totalStages,
      deaths,
    });
    setSubmittedRank(result.rank);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#050506]/85">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-[#09090B] border border-zinc-700 p-6 sm:p-7 text-zinc-100"
      >
        {screen === 'paused' && (
          <>
            <h2 className="text-3xl font-display font-bold uppercase tracking-wider text-white mb-1">
              Spiel pausiert
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              Sektor {stageIndex + 1} von {totalStages} · {formatTime(stageElapsedSeconds)}
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onResume}
                className="w-full py-2.5 bg-[#DC2626] hover:bg-[#EF4444] text-white font-display font-bold text-base uppercase tracking-wider cursor-pointer transition-colors"
              >
                Weiterspielen
              </button>
              <button
                type="button"
                onClick={onRestartStage}
                className="w-full py-2.5 bg-[#18181B] hover:bg-zinc-800 border border-zinc-700 text-zinc-100 font-semibold text-sm cursor-pointer transition-colors"
              >
                Sektor neu starten
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-2.5 bg-[#050506] hover:bg-[#18181B] border border-zinc-800 text-zinc-400 hover:text-white font-semibold text-sm cursor-pointer transition-colors"
              >
                Zum Titelbildschirm
              </button>
            </div>
          </>
        )}

        {screen === 'stage_clear' && (
          <>
            <h2 className="text-3xl font-display font-bold uppercase tracking-wider text-white mb-1">
              Sektor {stageIndex + 1} durchbrochen
            </h2>
            <p className="text-sm text-zinc-400 mb-5">Monolith erreicht.</p>

            <div className="grid grid-cols-3 gap-2.5 mb-6">
              <div className="p-3 bg-[#050506] border border-zinc-800">
                <div className="text-[11px] uppercase tracking-wider text-zinc-400">Zeit</div>
                <div className="text-base font-mono-num font-bold text-white">
                  {formatTime(stageElapsedSeconds)}
                </div>
              </div>
              <div className="p-3 bg-[#050506] border border-zinc-800">
                <div className="text-[11px] uppercase tracking-wider text-zinc-400">Splitter</div>
                <div className="text-base font-mono-num font-bold text-[#EF4444]">
                  {crystalsCollected}/{totalCrystals}
                </div>
              </div>
              <div className="p-3 bg-[#050506] border border-zinc-800">
                <div className="text-[11px] uppercase tracking-wider text-zinc-400">Punkte</div>
                <div className="text-base font-mono-num font-bold text-zinc-100">
                  {Math.round(totalScore)}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                data-start="true"
                onClick={onNextStage}
                className="w-full py-2.5 bg-[#DC2626] hover:bg-[#EF4444] text-white font-display font-bold text-base uppercase tracking-wider cursor-pointer transition-colors"
              >
                Nächster Sektor
              </button>
              <button
                type="button"
                onClick={onRestartStage}
                className="w-full py-2.5 bg-[#18181B] hover:bg-zinc-800 border border-zinc-700 text-zinc-100 font-semibold text-sm cursor-pointer transition-colors"
              >
                Sektor wiederholen
              </button>
            </div>
          </>
        )}

        {screen === 'victory' && (
          <>
            <h2 className="text-3xl font-display font-bold uppercase tracking-wider text-[#EF4444] mb-1">
              Roter Kern bezwungen
            </h2>
            <p className="text-sm text-zinc-400 mb-5">
              Gesamtergebnis über {totalStages} Sektoren.
            </p>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="p-3 bg-[#050506] border border-zinc-800">
                <div className="text-[11px] uppercase tracking-wider text-zinc-400">Gesamtzeit</div>
                <div className="text-base font-mono-num font-bold text-white">
                  {formatTime(runElapsedSeconds)}
                </div>
              </div>
              <div className="p-3 bg-[#050506] border border-zinc-800">
                <div className="text-[11px] uppercase tracking-wider text-zinc-400">Splitter</div>
                <div className="text-base font-mono-num font-bold text-[#EF4444]">
                  {runCrystals}
                </div>
              </div>
              <div className="p-3 bg-[#050506] border border-zinc-800">
                <div className="text-[11px] uppercase tracking-wider text-zinc-400">Punkte</div>
                <div className="text-base font-mono-num font-bold text-white">
                  {Math.round(totalScore)}
                </div>
              </div>
            </div>

            {submittedRank === null ? (
              <form onSubmit={handleSubmitScore} className="mb-5 p-3.5 bg-[#050506] border border-zinc-800 space-y-2.5">
                <label htmlFor="score-name-input" className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Name für die Rangliste
                </label>
                <div className="flex gap-2">
                  <input
                    id="score-name-input"
                    type="text"
                    maxLength={24}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#09090B] border border-zinc-700 text-sm text-white focus:outline-none focus:border-[#DC2626]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wider cursor-pointer whitespace-nowrap"
                  >
                    Eintragen
                  </button>
                </div>
                {submitError && <p className="text-xs text-[#EF4444]">{submitError}</p>}
              </form>
            ) : (
              <div className="mb-5 p-3.5 bg-[#180808] border border-[#7F1D1D] flex items-center justify-between">
                <span className="text-sm text-white font-semibold">
                  Gespeichert auf Platz #{submittedRank}
                </span>
                <button
                  type="button"
                  onClick={onOpenLeaderboard}
                  className="text-xs font-bold uppercase tracking-wider text-[#EF4444] underline cursor-pointer"
                >
                  Rangliste
                </button>
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="button"
                data-start="true"
                onClick={onRestartRun}
                className="w-full py-2.5 bg-[#DC2626] hover:bg-[#EF4444] text-white font-display font-bold text-base uppercase tracking-wider cursor-pointer transition-colors"
              >
                Nochmal spielen
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-2.5 bg-[#18181B] hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-sm cursor-pointer transition-colors"
              >
                Zum Titelbildschirm
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
