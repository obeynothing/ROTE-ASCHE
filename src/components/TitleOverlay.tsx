import type { GamepadDeviceInfo } from '../engine/input';

interface TitleOverlayProps {
  onStart: () => void;
  onOpenLeaderboard: () => void;
  gamepads: GamepadDeviceInfo[];
}

export function TitleOverlay({
  onStart,
  onOpenLeaderboard,
  gamepads,
}: TitleOverlayProps) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-8 md:p-14 pointer-events-none">
      {/* Top-left title lockup over crimson-black horizon negative space */}
      <div className="max-w-xl pt-3 md:pt-6 pointer-events-auto">
        <svg
          viewBox="0 0 460 118"
          className="w-76 sm:w-[420px] h-auto mb-5 overflow-visible"
          role="img"
          aria-label="ROTE ASCHE"
        >
          {/* Blood Eclipse & Obsidian Monolith Crest */}
          <g transform="translate(2, 12)">
            <rect x="0" y="0" width="84" height="84" fill="#09090B" stroke="#7F1D1D" strokeWidth="2.5" />
            <circle cx="42" cy="36" r="24" fill="#DC2626" />
            <circle cx="42" cy="36" r="24" fill="none" stroke="#F4F4F5" strokeWidth="1.5" opacity="0.7" />
            <circle cx="42" cy="34" r="16" fill="#050506" />
            <polygon points="36,78 42,20 48,78" fill="#F4F4F5" />
            <polygon points="38,78 42,26 46,78" fill="#09090B" />
            <rect x="10" y="74" width="64" height="4" fill="#DC2626" />
          </g>

          <text
            x="104"
            y="62"
            fill="#F4F4F5"
            fontFamily="Antonio, sans-serif"
            fontWeight="700"
            fontSize="56"
            letterSpacing="4"
          >
            ROTE ASCHE
          </text>
          <text
            x="106"
            y="88"
            fill="#DC2626"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="700"
            fontSize="13"
            letterSpacing="2.2"
          >
            DYSTOPISCHER PIXEL-PLATFORMER · GAMEPAD
          </text>
        </svg>

        <p className="text-zinc-300 text-base leading-relaxed max-w-md mb-8">
          Durchquere zehn immer härtere Sektoren aus Ruß, Stahl und roter Finsternis. Nutze Doppelsprung, omnidirektionalen Dash und deine Asche-Waffe gegen Drohnen und Geschütze.
        </p>

        {/* Primary CTA + Secondary Action */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onStart();
            }}
            className="px-7 py-3 bg-[#DC2626] hover:bg-[#EF4444] text-white font-display font-bold text-lg uppercase tracking-widest transition-colors cursor-pointer whitespace-nowrap shrink-0 border border-[#FCA5A5]/40"
          >
            Spiel starten
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenLeaderboard();
            }}
            className="px-6 py-3 bg-[#09090B] hover:bg-[#18181B] border border-zinc-700 hover:border-white text-zinc-100 font-display font-semibold text-base uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Rangliste
          </button>
        </div>

        {gamepads.length > 0 && (
          <p className="mt-4 text-xs text-red-400 font-semibold uppercase tracking-wider">
            Gamepad erkannt: {gamepads[0].id.slice(0, 42)}
          </p>
        )}
      </div>

      {/* Single flat control-hint line */}
      <div className="text-xs sm:text-sm text-zinc-200 tracking-wide">
        WASD / Pfeiltasten Bewegen · Leertaste Doppelsprung · Shift Dash · F / J Waffe · Gamepad · Esc Pause
      </div>
    </div>
  );
}
