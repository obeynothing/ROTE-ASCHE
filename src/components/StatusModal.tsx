import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ControlLabels } from '../game/controls';
import { formatDeltaSeconds, saveLeaderboardRun } from '../game/leaderboard';
import { WEAPON_UPGRADES } from '../game/physics';
import type { GameScreenState } from '../game/types';
import { GAME_EDITION, GAME_VERSION } from '../game/version';
import { useMenuNavigation, type MenuInputSubscriber } from '../hooks/useMenuNavigation';
import { formatTime } from './HudOverlay';
import { InputPrompt } from './InputPrompt';

interface StatusModalProps {
  screen: GameScreenState;
  blocked: boolean;
  controls: ControlLabels;
  stageIndex: number;
  totalStages: number;
  stageElapsedSeconds: number;
  runElapsedSeconds: number;
  isPracticeRun: boolean;
  stageSplitDeltaMs: number | null;
  stageIsNewPb: boolean;
  stagePbMs: number | null;
  fullRunIsNewPb: boolean;
  fullRunPbMs: number | null;
  crystalsCollected: number;
  totalCrystals: number;
  runCrystals: number;
  availableShards: number;
  weaponLevel: 1 | 2 | 3 | 4;
  deaths: number;
  totalScore: number;
  subscribeMenuInput: MenuInputSubscriber;
  onUpgradeWeapon: () => void;
  onResume: () => void;
  onRestartStage: () => void;
  onNextStage: () => void;
  onRestartRun: () => void;
  onReturnTitle: () => void;
  onOpenGuide: () => void;
  onOpenLeaderboard: () => void;
}

export function StatusModal({
  screen,
  blocked,
  controls,
  stageIndex,
  totalStages,
  stageElapsedSeconds,
  runElapsedSeconds,
  isPracticeRun,
  stageSplitDeltaMs,
  stageIsNewPb,
  stagePbMs,
  fullRunIsNewPb,
  fullRunPbMs,
  crystalsCollected,
  totalCrystals,
  runCrystals,
  availableShards,
  weaponLevel,
  deaths,
  totalScore,
  subscribeMenuInput,
  onUpgradeWeapon,
  onResume,
  onRestartStage,
  onNextStage,
  onRestartRun,
  onReturnTitle,
  onOpenGuide,
  onOpenLeaderboard,
}: StatusModalProps) {
  const [playerName, setPlayerName] = useState('ASCHE');
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (screen === 'victory') {
      setSubmittedRank(null);
      setSubmitError(null);
    }
  }, [screen, totalScore]);

  const isVisible = (screen === 'paused' || screen === 'stage_clear' || screen === 'victory') && !blocked;

  const currentWeapon = WEAPON_UPGRADES.find((w) => w.level === weaponLevel) ?? WEAPON_UPGRADES[0];
  const nextWeapon = WEAPON_UPGRADES.find((w) => w.level === weaponLevel + 1);
  const canUpgrade = Boolean(nextWeapon && availableShards >= nextWeapon.cost);

  const actions = useMemo(() => {
    if (screen === 'paused') {
      const list = [{ id: 'resume', run: onResume }];
      if (canUpgrade) list.push({ id: 'upgrade', run: onUpgradeWeapon });
      list.push({ id: 'guide', run: onOpenGuide });
      list.push({ id: 'restart', run: onRestartStage });
      list.push({ id: 'title', run: onReturnTitle });
      return list;
    }
    if (screen === 'stage_clear') {
      const list = [{ id: 'next', run: onNextStage }];
      if (canUpgrade) list.push({ id: 'upgrade', run: onUpgradeWeapon });
      list.push({ id: 'retry', run: onRestartStage });
      return list;
    }
    if (screen === 'victory') {
      return [
        { id: 'replay', run: onRestartRun },
        { id: 'title', run: onReturnTitle },
      ];
    }
    return [];
  }, [
    screen,
    canUpgrade,
    onResume,
    onUpgradeWeapon,
    onOpenGuide,
    onRestartStage,
    onReturnTitle,
    onNextStage,
    onRestartRun,
  ]);

  const handleConfirm = useCallback(
    (idx: number) => {
      actions[idx]?.run();
    },
    [actions],
  );

  const handleBack = useCallback(() => {
    if (screen === 'paused') onResume();
  }, [screen, onResume]);

  const [selectedIndex, setSelectedIndex] = useMenuNavigation({
    active: isVisible,
    itemCount: actions.length,
    initialIndex: 0,
    subscribeMenuInput,
    onConfirm: handleConfirm,
    onBack: screen === 'paused' ? handleBack : undefined,
    resetKey: `${screen}-${stageIndex}-${canUpgrade ? 1 : 0}`,
  });

  if (screen !== 'paused' && screen !== 'stage_clear' && screen !== 'victory') {
    return null;
  }

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPracticeRun) {
      setSubmitError('Übungs- und Sprung-Läufe werden nicht in die Bestenliste eingetragen.');
      return;
    }
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
      isPracticeRun,
    });
    if (result) {
      setSubmittedRank(result.rank);
    }
  };

  const renderWeaponForge = (upgradeButtonIdx: number) => (
    <div className="mb-5 p-4 rounded-xl bg-[#050506] border border-zinc-800">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">
          Waffen-Schmiede (Alle 4 Waffen) · Vorrat:{' '}
          <strong className="text-[#EF4444] font-mono-num">{availableShards}</strong> Splitter
        </span>
        <span className="text-xs font-mono-num font-bold text-white whitespace-nowrap shrink-0">
          Stufe {weaponLevel}/4
        </span>
      </div>

      {/* 4-bar tier indicator */}
      <div className="grid grid-cols-4 gap-1.5 mb-2.5">
        {WEAPON_UPGRADES.map((w) => (
          <div
            key={w.level}
            className={`h-1.5 rounded-sm ${
              w.level <= weaponLevel ? 'bg-[#DC2626]' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>

      <div className="text-sm font-display font-bold uppercase tracking-wider text-white">
        {currentWeapon.name}
      </div>
      <div className="text-xs text-zinc-400 mb-3">
        {currentWeapon.desc} · Arsenal:{' '}
        {controls.mode === 'keyboard'
          ? 'Puls [1], Schrot [2], Harpune [3], Mörser [4]'
          : 'Puls, Schrot, Harpune, Mörser (LT)'}
      </div>

      {nextWeapon ? (
        <button
          type="button"
          disabled={!canUpgrade}
          onMouseEnter={() => {
            if (upgradeButtonIdx >= 0) setSelectedIndex(upgradeButtonIdx);
          }}
          onClick={onUpgradeWeapon}
          className={`w-full py-2 px-3 rounded-lg flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider transition-colors border ${
            canUpgrade
              ? selectedIndex === upgradeButtonIdx
                ? 'bg-[#DC2626] text-white border-white ring-1 ring-white cursor-pointer'
                : 'bg-[#180808] hover:bg-[#DC2626] text-[#EF4444] hover:text-white border-[#7F1D1D] cursor-pointer'
              : 'bg-[#09090B] text-zinc-500 border-zinc-800 cursor-not-allowed'
          }`}
        >
          <span>
            {canUpgrade && selectedIndex === upgradeButtonIdx ? '▸ ' : ''}
            Upgrade: {nextWeapon.name} ({nextWeapon.desc})
          </span>
          <span className="font-mono-num whitespace-nowrap ml-2">-{nextWeapon.cost} Splitter</span>
        </button>
      ) : (
        <div className="text-xs font-semibold uppercase tracking-wider text-[#EF4444]">
          Maximale Waffenstufe erreicht
        </div>
      )}
    </div>
  );

  const navFooter = (showBack: boolean) => (
    <div className="mt-4 pt-3 border-t border-zinc-800 space-y-2 text-[11px] uppercase tracking-wider text-zinc-400">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <InputPrompt label={controls.navDir} mode={controls.mode} />
            <span>Wählen</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <InputPrompt label={controls.confirm} mode={controls.mode} />
            <span>Bestätigen</span>
          </span>
        </div>
        {showBack && (
          <span className="inline-flex items-center gap-1.5">
            <InputPrompt label={controls.back} mode={controls.mode} />
            <span>Zurück</span>
          </span>
        )}
      </div>
      <div className="text-[10px] font-mono-num text-zinc-500 flex items-center justify-between">
        <span>ROTE ASCHE</span>
        <span>{GAME_VERSION} · {GAME_EDITION}</span>
      </div>
    </div>
  );

  const btnIdx = (id: string) => actions.findIndex((a) => a.id === id);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#030304]/85">
      <div
        role="dialog"
        aria-modal="true"
        className="rounded-2xl crimson-edge-glow w-full max-w-md bg-[#09090B] border border-zinc-700 p-6 sm:p-7 text-zinc-100"
      >
        {screen === 'paused' && (
          <>
            <h2 className="text-3xl font-display font-bold uppercase tracking-wider text-white mb-1">
              Spiel pausiert
            </h2>
            <p className="text-sm text-zinc-400 mb-4">
              Sektor {stageIndex + 1} von {totalStages} · {formatTime(stageElapsedSeconds)}
            </p>

            {renderWeaponForge(btnIdx('upgrade'))}

            <div className="space-y-2">
              <button
                type="button"
                onMouseEnter={() => setSelectedIndex(btnIdx('resume'))}
                onClick={onResume}
                className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between font-display font-bold text-base uppercase tracking-wider cursor-pointer transition-colors border ${
                  selectedIndex === btnIdx('resume')
                    ? 'bg-[#DC2626] text-white border-white ring-1 ring-white'
                    : 'bg-[#991B1B] hover:bg-[#DC2626] text-zinc-100 border-[#7F1D1D]'
                }`}
              >
                <span>{selectedIndex === btnIdx('resume') ? '▸ ' : ''}Weiterspielen</span>
                <InputPrompt label={controls.confirm} mode={controls.mode} tone="inverted" />
              </button>

              <button
                type="button"
                onMouseEnter={() => setSelectedIndex(btnIdx('guide'))}
                onClick={onOpenGuide}
                className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between font-semibold text-sm cursor-pointer transition-colors border ${
                  selectedIndex === btnIdx('guide')
                    ? 'bg-[#18181B] text-white border-white ring-1 ring-white'
                    : 'bg-[#18181B] hover:bg-zinc-800 text-zinc-200 border-zinc-700'
                }`}
              >
                <span>{selectedIndex === btnIdx('guide') ? '▸ ' : ''}Anleitung &amp; Gegner</span>
                <span className="text-[11px] font-mono-num text-[#EF4444]">Bestiarium</span>
              </button>

              <button
                type="button"
                onMouseEnter={() => setSelectedIndex(btnIdx('restart'))}
                onClick={onRestartStage}
                className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between font-semibold text-sm cursor-pointer transition-colors border ${
                  selectedIndex === btnIdx('restart')
                    ? 'bg-[#18181B] text-white border-white ring-1 ring-white'
                    : 'bg-[#18181B] hover:bg-zinc-800 text-zinc-200 border-zinc-700'
                }`}
              >
                <span>{selectedIndex === btnIdx('restart') ? '▸ ' : ''}Sektor neu starten</span>
                {controls.mode === 'keyboard' ? (
                  <InputPrompt label={controls.restart} mode="keyboard" />
                ) : (
                  selectedIndex === btnIdx('restart') && <InputPrompt label={controls.confirm} mode="xbox" />
                )}
              </button>

              <button
                type="button"
                onMouseEnter={() => setSelectedIndex(btnIdx('title'))}
                onClick={onReturnTitle}
                className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between font-semibold text-sm cursor-pointer transition-colors border ${
                  selectedIndex === btnIdx('title')
                    ? 'bg-[#18181B] text-white border-white ring-1 ring-white'
                    : 'bg-[#050506] hover:bg-[#18181B] text-zinc-400 hover:text-white border-zinc-800'
                }`}
              >
                <span>{selectedIndex === btnIdx('title') ? '▸ ' : ''}Zum Titelbildschirm</span>
              </button>
            </div>
            {navFooter(true)}
          </>
        )}

        {screen === 'stage_clear' && (
          <>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-3xl font-display font-bold uppercase tracking-wider text-white">
                Sektor {stageIndex + 1} durchbrochen
              </h2>
              {stageIsNewPb && (
                <span className="px-2 py-0.5 rounded-md bg-[#DC2626] text-white text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                  Neuer PB
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-400 mb-4">
              Monolith erreicht · Run-Gesamtzeit:{' '}
              <strong className="text-zinc-200 font-mono-num">{formatTime(runElapsedSeconds)}</strong>
            </p>

            <div className="grid grid-cols-3 gap-2.5 mb-4">
              <div className="p-3 rounded-xl bg-[#050506] border border-zinc-800">
                <div className="text-[11px] uppercase tracking-wider text-zinc-400">Sektor-Zeit</div>
                <div className="text-base font-mono-num font-bold text-white">
                  {formatTime(stageElapsedSeconds)}
                </div>
                {stageSplitDeltaMs !== null ? (
                  <div
                    className={`text-[10px] font-mono-num font-bold ${
                      stageSplitDeltaMs <= 0 ? 'text-white' : 'text-[#EF4444]'
                    }`}
                  >
                    Split {formatDeltaSeconds(stageSplitDeltaMs)}
                  </div>
                ) : stagePbMs !== null ? (
                  <div className="text-[10px] font-mono-num text-zinc-500">
                    PB {formatTime(stagePbMs / 1000)}
                  </div>
                ) : null}
              </div>
              <div className="p-3 rounded-xl bg-[#050506] border border-zinc-800">
                <div className="text-[11px] uppercase tracking-wider text-zinc-400">Splitter</div>
                <div className="text-base font-mono-num font-bold text-[#EF4444]">
                  {crystalsCollected}/{totalCrystals}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#050506] border border-zinc-800">
                <div className="text-[11px] uppercase tracking-wider text-zinc-400">Punkte</div>
                <div className="text-base font-mono-num font-bold text-zinc-100">
                  {Math.round(totalScore)}
                </div>
              </div>
            </div>

            {renderWeaponForge(btnIdx('upgrade'))}

            <div className="space-y-2">
              <button
                type="button"
                data-start="true"
                onMouseEnter={() => setSelectedIndex(btnIdx('next'))}
                onClick={onNextStage}
                className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between font-display font-bold text-base uppercase tracking-wider cursor-pointer transition-colors border ${
                  selectedIndex === btnIdx('next')
                    ? 'bg-[#DC2626] text-white border-white ring-1 ring-white'
                    : 'bg-[#991B1B] hover:bg-[#DC2626] text-zinc-100 border-[#7F1D1D]'
                }`}
              >
                <span>{selectedIndex === btnIdx('next') ? '▸ ' : ''}Nächster Sektor</span>
                <InputPrompt label={controls.confirm} mode={controls.mode} tone="inverted" />
              </button>

              <button
                type="button"
                onMouseEnter={() => setSelectedIndex(btnIdx('retry'))}
                onClick={onRestartStage}
                className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between font-semibold text-sm cursor-pointer transition-colors border ${
                  selectedIndex === btnIdx('retry')
                    ? 'bg-[#18181B] text-white border-white ring-1 ring-white'
                    : 'bg-[#18181B] hover:bg-zinc-800 text-zinc-200 border-zinc-700'
                }`}
              >
                <span>{selectedIndex === btnIdx('retry') ? '▸ ' : ''}Sektor wiederholen</span>
              </button>
            </div>
            {navFooter(false)}
          </>
        )}

        {screen === 'victory' && (
          <>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-3xl font-display font-bold uppercase tracking-wider text-[#EF4444]">
                Omega-Kolos bezwungen
              </h2>
              {fullRunIsNewPb && !isPracticeRun && (
                <span className="px-2 py-0.5 rounded-md bg-white text-black text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                  Run-Rekord
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-400 mb-5">
              {isPracticeRun
                ? 'Sektor-Sprung / Übungsmodus aktiv — offizieller Speedrun erfordert Start ab Sektor 01.'
                : `Der Fleischkern ist vernichtet — Gesamtergebnis über ${totalStages} Sektoren.`}
            </p>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="p-3 rounded-xl bg-[#050506] border border-zinc-800">
                <div className="text-[11px] uppercase tracking-wider text-zinc-400">Gesamtzeit</div>
                <div className="text-base font-mono-num font-bold text-white">
                  {formatTime(runElapsedSeconds)}
                </div>
                {fullRunPbMs !== null && !isPracticeRun && (
                  <div className="text-[10px] font-mono-num text-zinc-500">
                    PB {formatTime(fullRunPbMs / 1000)}
                  </div>
                )}
              </div>
              <div className="p-3 rounded-xl bg-[#050506] border border-zinc-800">
                <div className="text-[11px] uppercase tracking-wider text-zinc-400">Splitter</div>
                <div className="text-base font-mono-num font-bold text-[#EF4444]">
                  {runCrystals}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#050506] border border-zinc-800">
                <div className="text-[11px] uppercase tracking-wider text-zinc-400">Punkte</div>
                <div className="text-base font-mono-num font-bold text-white">
                  {Math.round(totalScore)}
                </div>
              </div>
            </div>

            {isPracticeRun ? (
              <div className="mb-5 p-3.5 rounded-xl bg-[#180808] border border-[#7F1D1D] text-xs text-zinc-300">
                Anti-Cheat-Schutz: Läufe mit Sektor-Sprung können keinen offiziellen Run-Eintrag speichern. Starte für einen gewerteten Speedrun regulär in Sektor 01.
              </div>
            ) : submittedRank === null ? (
              <form onSubmit={handleSubmitScore} className="mb-5 p-3.5 rounded-xl bg-[#050506] border border-zinc-800 space-y-2.5">
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
                    className="flex-1 px-3 py-2 rounded-lg bg-[#09090B] border border-zinc-700 text-sm text-white focus:outline-none focus:border-[#DC2626]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wider cursor-pointer whitespace-nowrap"
                  >
                    Eintragen
                  </button>
                </div>
                {submitError && <p className="text-xs text-[#EF4444]">{submitError}</p>}
              </form>
            ) : (
              <div className="mb-5 p-3.5 rounded-xl bg-[#180808] border border-[#7F1D1D] flex items-center justify-between">
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

            <div className="space-y-2">
              <button
                type="button"
                data-start="true"
                onMouseEnter={() => setSelectedIndex(0)}
                onClick={onRestartRun}
                className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between font-display font-bold text-base uppercase tracking-wider cursor-pointer transition-colors border ${
                  selectedIndex === 0
                    ? 'bg-[#DC2626] text-white border-white ring-1 ring-white'
                    : 'bg-[#991B1B] hover:bg-[#DC2626] text-zinc-100 border-[#7F1D1D]'
                }`}
              >
                <span>{selectedIndex === 0 ? '▸ ' : ''}Nochmal spielen</span>
                <InputPrompt label={controls.confirm} mode={controls.mode} tone="inverted" />
              </button>
              <button
                type="button"
                onMouseEnter={() => setSelectedIndex(1)}
                onClick={onReturnTitle}
                className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between font-semibold text-sm cursor-pointer transition-colors border ${
                  selectedIndex === 1
                    ? 'bg-[#18181B] text-white border-white ring-1 ring-white'
                    : 'bg-[#18181B] hover:bg-zinc-800 text-zinc-200 border-zinc-700'
                }`}
              >
                <span>{selectedIndex === 1 ? '▸ ' : ''}Zum Titelbildschirm</span>
              </button>
            </div>
            {navFooter(false)}
          </>
        )}
      </div>
    </div>
  );
}
