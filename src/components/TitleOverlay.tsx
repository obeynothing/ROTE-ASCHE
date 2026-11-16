import { useCallback } from 'react';
import type { ControlLabels } from '../game/controls';
import { GAME_EDITION, GAME_VERSION } from '../game/version';
import { useMenuNavigation, type MenuInputSubscriber } from '../hooks/useMenuNavigation';
import { InputPrompt } from './InputPrompt';

interface TitleOverlayProps {
  active: boolean;
  controls: ControlLabels;
  onStart: () => void;
  onOpenGuide: () => void;
  onOpenLeaderboard: () => void;
  subscribeMenuInput: MenuInputSubscriber;
}

export function TitleOverlay({
  active,
  controls,
  onStart,
  onOpenGuide,
  onOpenLeaderboard,
  subscribeMenuInput,
}: TitleOverlayProps) {
  const handleConfirm = useCallback(
    (idx: number) => {
      if (idx === 0) onStart();
      else if (idx === 1) onOpenGuide();
      else if (idx === 2) onOpenLeaderboard();
    },
    [onStart, onOpenGuide, onOpenLeaderboard],
  );

  const [selectedIndex, setSelectedIndex] = useMenuNavigation({
    active,
    itemCount: 3,
    initialIndex: 0,
    subscribeMenuInput,
    onConfirm: handleConfirm,
  });

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-8 md:p-14 pointer-events-none">
      {/* Top row: title lockup (left) + release version notice (top-right) */}
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-2xl pt-2 md:pt-5 pointer-events-auto">
          <svg
            viewBox="0 0 470 122"
            className="w-80 sm:w-[440px] h-auto mb-4 overflow-visible"
            role="img"
            aria-label="ROTE ASCHE"
          >
            {/* Carrion-Inspired Containment Crest with rounded outer housing */}
            <g transform="translate(2, 10)">
              <rect
                x="0"
                y="0"
                width="86"
                height="86"
                rx="14"
                fill="#070709"
                stroke="#991B1B"
                strokeWidth="2.5"
              />
              <rect x="6" y="6" width="74" height="74" rx="10" fill="#030304" stroke="#27272A" strokeWidth="1" />
              <path d="M12 72 Q22 48 43 44 T74 22" fill="none" stroke="#991B1B" strokeWidth="3" />
              <path d="M14 20 Q28 42 43 44 T72 68" fill="none" stroke="#DC2626" strokeWidth="2" />
              <circle cx="43" cy="36" r="23" fill="#DC2626" />
              <circle cx="43" cy="36" r="23" fill="none" stroke="#F4F4F5" strokeWidth="1.5" opacity="0.75" />
              <circle cx="43" cy="34" r="15" fill="#030304" />
              <polygon points="37,80 43,19 49,80" fill="#F4F4F5" />
              <polygon points="39,80 43,26 47,80" fill="#09090B" />
              <rect x="12" y="76" width="62" height="4" rx="2" fill="#DC2626" />
            </g>

            <text
              x="106"
              y="60"
              fill="#F4F4F5"
              fontFamily="Antonio, sans-serif"
              fontWeight="700"
              fontSize="58"
              letterSpacing="4"
            >
              ROTE ASCHE
            </text>
            <text
              x="108"
              y="84"
              fill="#EF4444"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="700"
              fontSize="12.5"
              letterSpacing="2.2"
            >
              BIO-SEUCHEN-KAMMER · ASCHE &amp; KRON
            </text>
            <line x1="108" y1="95" x2="452" y2="95" stroke="#27272A" strokeWidth="1.5" />
            <line x1="108" y1="95" x2="245" y2="95" stroke="#DC2626" strokeWidth="2.5" />
          </svg>

          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-lg mb-6">
            14 eskalierende Sektoren durch 7 verseuchte Biome, 4 wechselbare Waffen und 7 Gegnerklassen bis zum{' '}
            <strong className="text-[#EF4444]">Karnifex-09 · Blut-Seraph</strong>.{' '}
            <strong className="text-white">Asche</strong> springt dreifach; <strong className="text-[#EF4444]">Kron</strong> gleitet, zerschmettert Feinde im Ramm-Dash und führt dich als Tag-Team-Extra-Leben.
          </p>

          {/* Primary CTA + Secondary Actions with device-specific button badges */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-start="true"
              onMouseEnter={() => setSelectedIndex(0)}
              onClick={(e) => {
                e.currentTarget.blur();
                onStart();
              }}
              className={`rounded-xl px-6 py-3 flex items-center gap-3 font-display font-bold text-lg uppercase tracking-widest transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                selectedIndex === 0
                  ? 'bg-[#DC2626] text-white border-white ring-1 ring-white'
                  : 'bg-[#991B1B] hover:bg-[#DC2626] text-zinc-100 border-[#7F1D1D]'
              }`}
            >
              {selectedIndex === 0 && <span aria-hidden="true" className="text-white">▸</span>}
              <span>Spiel starten</span>
              {selectedIndex === 0 && <InputPrompt label={controls.confirm} mode={controls.mode} tone="inverted" />}
            </button>

            <button
              type="button"
              data-testid="open-guide-btn"
              onMouseEnter={() => setSelectedIndex(1)}
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenGuide();
              }}
              className={`rounded-xl px-5 py-3 flex items-center gap-3 font-display font-semibold text-base uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                selectedIndex === 1
                  ? 'bg-[#18181B] text-white border-white ring-1 ring-white'
                  : 'bg-[#09090B] hover:bg-[#18181B] text-zinc-200 border-zinc-700'
              }`}
            >
              {selectedIndex === 1 && <span aria-hidden="true" className="text-[#EF4444]">▸</span>}
              <span>Anleitung &amp; Gegner</span>
              {selectedIndex === 1 && <InputPrompt label={controls.confirm} mode={controls.mode} />}
            </button>

            <button
              type="button"
              onMouseEnter={() => setSelectedIndex(2)}
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenLeaderboard();
              }}
              className={`rounded-xl px-5 py-3 flex items-center gap-3 font-display font-semibold text-base uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                selectedIndex === 2
                  ? 'bg-[#18181B] text-white border-white ring-1 ring-white'
                  : 'bg-[#09090B] hover:bg-[#18181B] text-zinc-200 border-zinc-700'
              }`}
            >
              {selectedIndex === 2 && <span aria-hidden="true" className="text-[#EF4444]">▸</span>}
              <span>Rangliste</span>
              {selectedIndex === 2 && <InputPrompt label={controls.confirm} mode={controls.mode} />}
            </button>
          </div>

          {/* Menu navigation prompt bar */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-wider text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <InputPrompt label={controls.navDir} mode={controls.mode} />
              <span>Wählen</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <InputPrompt label={controls.confirm} mode={controls.mode} />
              <span>Bestätigen</span>
            </span>
            {controls.controllerName && (
              <span
                data-testid="active-controller-badge"
                className="px-2.5 py-0.5 rounded-lg bg-[#180808] border border-[#DC2626] text-[#EF4444] font-semibold"
              >
                Controller: {controls.controllerName}
              </span>
            )}
          </div>
        </div>

        {/* Version Notice (Top-Right) */}
        <div
          data-testid="version-badge"
          className="mt-2 md:mt-5 px-3.5 py-2 rounded-xl bg-[#050506]/90 border border-[#7F1D1D] flex items-center gap-2 text-xs font-mono-num text-zinc-300 whitespace-nowrap shrink-0 pointer-events-auto"
        >
          <span className="w-2 h-2 rounded-sm bg-[#DC2626] inline-block" aria-hidden="true" />
          <span className="text-white font-bold">{GAME_VERSION}</span>
          <span className="text-zinc-500">·</span>
          <span className="text-[#EF4444] uppercase tracking-wider font-semibold">{GAME_EDITION}</span>
        </div>
      </div>

      {/* Bottom control-hint bar (strictly Keyboard OR Xbox based on active input device) */}
      <div className="flex items-center pointer-events-auto">
        <div
          data-testid="title-controls-bar"
          className="px-3.5 py-2 rounded-xl bg-[#050506]/90 border border-zinc-800 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-zinc-200 tracking-wide"
        >
          <span className="inline-flex items-center gap-1.5">
            <InputPrompt label={controls.move} mode={controls.mode} />
            <span>Bewegen</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <InputPrompt label={controls.jump} mode={controls.mode} />
            <span>Sprung &amp; Gleiten</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <InputPrompt label={controls.dash} mode={controls.mode} />
            <span>Dash / Ramm</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <InputPrompt label={controls.shoot} mode={controls.mode} />
            <span>Feuern</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <InputPrompt label={controls.weaponCycle} mode={controls.mode} tone="crimson" />
            <span>4 Waffen</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <InputPrompt label={controls.tagSwitch} mode={controls.mode} tone="crimson" />
            <span>Tag-Wechsel</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <InputPrompt label={controls.pause} mode={controls.mode} />
            <span>Schmiede</span>
          </span>
        </div>
      </div>
    </div>
  );
}
