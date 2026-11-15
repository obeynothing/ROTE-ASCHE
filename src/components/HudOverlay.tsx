import type { RefObject } from 'react';
import type { ControlLabels } from '../game/controls';
import { CHARACTER_SPECS, WEAPON_ORDER, WEAPONS, WEAPON_UPGRADES } from '../game/physics';
import type { CharacterId, WeaponId } from '../game/types';
import { InputPrompt } from './InputPrompt';

export interface HudSnapshot {
  stageIndex: number;
  totalStages: number;
  stageName: string;
  elapsedSeconds: number;
  runElapsedSeconds: number;
  stageBestMs: number | null;
  isPracticeRun: boolean;
  crystalsCollected: number;
  totalCrystals: number;
  availableShards: number;
  activeCharacter: CharacterId;
  partnerPresent: boolean;
  activeWeapon: WeaponId;
  weaponLevel: 1 | 2 | 3 | 4;
  totalScore: number;
  bossActive: boolean;
  bossDefeated: boolean;
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  bossPhase: 1 | 2 | 3;
}

interface HudOverlayProps {
  hud: HudSnapshot;
  timerRef?: RefObject<HTMLDivElement | null>;
  runTimerRef?: RefObject<HTMLDivElement | null>;
  muted: boolean;
  controls: ControlLabels;
  onSelectWeapon: (weapon: WeaponId) => void;
  onToggleMute: () => void;
  onRestart: () => void;
  onPause: () => void;
}

export function formatTime(seconds: number): string {
  const totalCs = Math.max(0, Math.floor(seconds * 100));
  const mins = Math.floor(totalCs / 6000);
  const secs = Math.floor((totalCs % 6000) / 100);
  const cs = totalCs % 100;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function SquadMaskIcon({ character }: { character: CharacterId }) {
  if (character === 'asche') {
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#09090B" stroke="#DC2626" strokeWidth="1.5" />
        <polygon points="7,6 17,6 19,11 16,18 8,18 5,11" fill="#F4F4F5" />
        <rect x="8" y="10" width="3" height="2.5" fill="#DC2626" />
        <rect x="13" y="10" width="3" height="2.5" fill="#DC2626" />
        <path d="M5 17H19V20H5Z" fill="#DC2626" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#180808" stroke="#F4F4F5" strokeWidth="1.5" />
      <rect x="5" y="5" width="14" height="12" rx="2" fill="#27272A" stroke="#F4F4F5" strokeWidth="1.2" />
      <rect x="7" y="9" width="10" height="3.5" fill="#EF4444" />
      <rect x="4" y="17" width="16" height="3" rx="1" fill="#F4F4F5" />
    </svg>
  );
}

function WeaponGlyph({ weapon }: { weapon: WeaponId }) {
  switch (weapon) {
    case 'pulse':
      return (
        <svg viewBox="0 0 18 12" className="w-4 h-3 shrink-0" aria-hidden="true">
          <rect x="1" y="4" width="11" height="4" fill="currentColor" />
          <rect x="13" y="5" width="4" height="2" fill="#EF4444" />
        </svg>
      );
    case 'shotgun':
      return (
        <svg viewBox="0 0 18 12" className="w-4 h-3 shrink-0" aria-hidden="true">
          <rect x="1" y="4" width="8" height="4" fill="currentColor" />
          <polygon points="10,6 17,1 17,4 13,6 17,8 17,11" fill="#EF4444" />
        </svg>
      );
    case 'harpoon':
      return (
        <svg viewBox="0 0 18 12" className="w-4 h-3 shrink-0" aria-hidden="true">
          <rect x="1" y="5" width="10" height="2" fill="currentColor" />
          <polygon points="11,2 17,6 11,10" fill="#EF4444" />
        </svg>
      );
    case 'mortar':
      return (
        <svg viewBox="0 0 18 12" className="w-4 h-3 shrink-0" aria-hidden="true">
          <path d="M2 10L6 3H11L13 6L9 10Z" fill="currentColor" />
          <circle cx="14.5" cy="4.5" r="2.5" fill="#EF4444" />
        </svg>
      );
  }
}

export function HudOverlay({
  hud,
  timerRef,
  runTimerRef,
  muted,
  controls,
  onSelectWeapon,
  onToggleMute,
  onRestart,
  onPause,
}: HudOverlayProps) {
  const currentUpgrade = WEAPON_UPGRADES.find((w) => w.level === hud.weaponLevel) ?? WEAPON_UPGRADES[0];
  const nextUpgrade = WEAPON_UPGRADES.find((w) => w.level === hud.weaponLevel + 1);
  const canUpgrade = Boolean(nextUpgrade && hud.availableShards >= nextUpgrade.cost);
  const isAsche = hud.activeCharacter === 'asche';
  const charSpec = CHARACTER_SPECS[hud.activeCharacter];
  const partnerName = isAsche ? 'KRON' : 'ASCHE';
  const bossPct = hud.bossMaxHp > 0 ? Math.max(0, Math.min(100, (hud.bossHp / hud.bossMaxHp) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* Top Perimeter Stack (HUD Bar + Utility Buttons + Top-Center Boss Health Bar) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          {/* Top-left compact Red/Black/White industrial HUD bar */}
          <div
            className="px-4 py-2 rounded-xl bg-[#050506]/95 border border-zinc-700 crimson-edge-glow flex flex-wrap items-center gap-3.5 sm:gap-4"
            aria-live="off"
          >
            {/* Active Character + DKC Buddy Extra-Life Buffer */}
            <div className="flex items-center gap-2.5">
              <SquadMaskIcon character={hud.activeCharacter} />
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold flex items-center gap-1.5">
                  <span>Squad</span>
                  {hud.partnerPresent ? (
                    <InputPrompt label={controls.tagSwitch} mode={controls.mode} />
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    data-testid="hud-character"
                    className={`text-sm font-display font-bold uppercase tracking-wider whitespace-nowrap ${
                      isAsche ? 'text-[#EF4444]' : 'text-white'
                    }`}
                  >
                    {charSpec.name}
                  </span>
                  {hud.partnerPresent ? (
                    <span
                      data-testid="hud-partner"
                      className="px-1.5 py-0.5 rounded-md bg-[#18181B] border border-zinc-600 text-[10px] font-mono-num font-bold text-zinc-200 uppercase"
                    >
                      +{partnerName}
                    </span>
                  ) : (
                    <span
                      data-testid="hud-partner"
                      className="px-1.5 py-0.5 rounded-md bg-[#180808] border border-[#7F1D1D] text-[10px] font-mono-num font-bold text-[#EF4444] uppercase"
                    >
                      ALLEIN
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="h-7 w-px bg-zinc-800" aria-hidden="true" />

            {/* Sector */}
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
                Sektor {hud.stageIndex + 1}/{hud.totalStages}
              </div>
              <div className="text-sm font-display font-bold uppercase tracking-wider text-white whitespace-nowrap">
                {hud.stageName}
              </div>
            </div>

            <div className="h-7 w-px bg-zinc-800" aria-hidden="true" />

            {/* Speedrun Timer: Sektor + Gesamt-Run + PB */}
            <div className="flex items-center gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold flex items-center gap-1.5">
                  <span>Sektor</span>
                  {hud.stageBestMs !== null && (
                    <span className="text-[9px] font-mono-num text-zinc-500">
                      PB {formatTime(hud.stageBestMs / 1000)}
                    </span>
                  )}
                </div>
                <div
                  ref={timerRef}
                  className="text-base font-mono-num font-bold text-white leading-tight min-w-[4.75rem]"
                  data-testid="hud-timer"
                >
                  {formatTime(hud.elapsedSeconds)}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold flex items-center gap-1">
                  <span>Run</span>
                  {hud.isPracticeRun && (
                    <span className="text-[9px] font-bold text-[#EF4444]">ÜBUNG</span>
                  )}
                </div>
                <div
                  ref={runTimerRef}
                  className="text-base font-mono-num font-bold text-[#EF4444] leading-tight min-w-[4.75rem]"
                  data-testid="hud-run-timer"
                >
                  {formatTime(hud.runElapsedSeconds)}
                </div>
              </div>
            </div>

            {/* Weapon Forge Tier */}
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Schmiede</div>
              <div className="text-sm font-mono-num font-bold leading-tight flex items-center gap-1.5">
                <span className="text-white">St.{hud.weaponLevel}</span>
                <span className="text-zinc-400 text-xs font-sans hidden lg:inline">{currentUpgrade.name}</span>
                {canUpgrade && (
                  <span className="px-1.5 py-0.5 rounded bg-[#DC2626] text-white text-[10px] font-bold uppercase tracking-wider">
                    UPGRADE
                  </span>
                )}
              </div>
            </div>

            {/* Blood Shards */}
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Splitter</div>
              <div className="text-base font-mono-num font-bold text-[#EF4444] leading-tight">
                {hud.crystalsCollected}/{hud.totalCrystals}
                <span className="text-xs text-zinc-400 ml-1.5">({hud.availableShards})</span>
              </div>
            </div>

            {/* Score */}
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Punkte</div>
              <div className="text-base font-mono-num font-bold text-zinc-100 leading-tight" data-testid="hud-score">
                {Math.round(hud.totalScore)}
              </div>
            </div>
          </div>

          {/* Top-right rounded icon utility buttons with hotkeys */}
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
              className="w-10 h-10 rounded-xl bg-[#050506]/95 hover:bg-[#18181B] border border-zinc-700 hover:border-white flex items-center justify-center text-white transition-colors cursor-pointer"
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
              className="w-10 h-10 rounded-xl bg-[#050506]/95 hover:bg-[#18181B] border border-zinc-700 hover:border-white flex items-center justify-center text-white transition-colors cursor-pointer"
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
              aria-label={`Pause & Schmiede (${controls.pause})`}
              title={`Pause & Waffen-Upgrade (${controls.pause})`}
              className="w-10 h-10 rounded-xl bg-[#050506]/95 hover:bg-[#18181B] border border-zinc-700 hover:border-[#DC2626] flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Omega-Kolos Boss Health Bar pinned neatly at top center */}
        {hud.bossActive && !hud.bossDefeated && (
          <div className="mx-auto w-full max-w-xl px-4 py-2.5 rounded-xl bg-[#050506]/95 border border-[#7F1D1D] crimson-edge-glow pointer-events-none">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm bg-[#EF4444] inline-block" aria-hidden="true" />
                <span
                  data-testid="boss-name"
                  className="text-xs sm:text-sm font-display font-bold uppercase tracking-widest text-white"
                >
                  {hud.bossName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono-num">
                <span className="text-[#EF4444] font-bold uppercase">Phase {hud.bossPhase}/3</span>
                <span className="text-zinc-300" data-testid="boss-hp">
                  {Math.max(0, Math.ceil(hud.bossHp))}/{hud.bossMaxHp}
                </span>
              </div>
            </div>
            <div className="w-full h-2.5 rounded-md bg-[#140708] border border-zinc-700 relative overflow-hidden">
              <div
                className="h-full bg-[#DC2626] transition-[width] duration-75"
                style={{ width: `${bossPct}%` }}
              />
              <div className="absolute inset-y-0 left-1/3 w-0.5 bg-[#050506]" aria-hidden="true" />
              <div className="absolute inset-y-0 left-2/3 w-0.5 bg-[#050506]" aria-hidden="true" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Perimeter: 4-Weapon Arsenal Selector + Compact Control Prompts */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        {/* Switchable 4-Weapon Arsenal Strip */}
        <div
          className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-xl bg-[#050506]/95 border border-zinc-800 p-1.5"
          aria-label="Waffenauswahl"
        >
          {WEAPON_ORDER.map((wId) => {
            const spec = WEAPONS[wId];
            const active = hud.activeWeapon === wId;
            return (
              <button
                key={wId}
                type="button"
                tabIndex={-1}
                data-testid={`weapon-slot-${wId}`}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onSelectWeapon(wId);
                }}
                title={`${spec.name}: ${spec.role}${controls.mode === 'keyboard' ? ` (Taste ${spec.slot})` : ''}`}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-mono-num uppercase tracking-wider border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#180808] border-[#DC2626] text-white'
                    : 'bg-[#09090B] border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                {controls.mode === 'keyboard' && (
                  <span className={active ? 'text-[#EF4444] font-bold' : 'text-zinc-500'}>[{spec.slot}]</span>
                )}
                <WeaponGlyph weapon={wId} />
                <span className="font-display font-bold tracking-wider">{spec.shortName}</span>
              </button>
            );
          })}
          <span className="hidden xl:inline-flex items-center gap-1 px-1.5 text-[10px] text-zinc-400 font-mono-num">
            <InputPrompt label={controls.weaponSelectShort} mode={controls.mode} />
            <span>Wechsel</span>
          </span>
        </div>

        {/* Device-specific action cues */}
        <div
          data-testid="hud-controls-bar"
          className="px-3.5 py-1.5 rounded-xl bg-[#050506]/90 border border-zinc-800 flex flex-wrap items-center gap-3 text-[11px] text-zinc-300"
        >
          <span className="text-zinc-200 font-semibold hidden md:inline">
            {charSpec.name}: <span className="text-[#EF4444]">{charSpec.title}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <InputPrompt label={controls.tagSwitch} mode={controls.mode} tone="crimson" />
            <span>Tag</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <InputPrompt label={controls.shoot} mode={controls.mode} />
            <span>Feuern</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <InputPrompt label={controls.dash} mode={controls.mode} />
            <span>Dash</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <InputPrompt label={controls.pause} mode={controls.mode} />
            <span>Schmiede</span>
          </span>
          {controls.controllerName && (
            <span className="text-[#EF4444] font-semibold uppercase tracking-wider">· Xbox</span>
          )}
        </div>
      </div>
    </div>
  );
}
