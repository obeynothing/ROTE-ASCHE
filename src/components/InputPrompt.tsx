import type { InputMode } from '../game/controls';

interface InputPromptProps {
  label: string;
  mode: InputMode;
  tone?: 'default' | 'crimson' | 'inverted';
  className?: string;
}

const CIRCULAR_XBOX_BUTTONS = new Set(['A', 'B', 'X', 'Y']);

export function InputPrompt({ label, mode, tone = 'default', className = '' }: InputPromptProps) {
  if (mode === 'xbox') {
    const isCircle = CIRCULAR_XBOX_BUTTONS.has(label);

    let palette = 'bg-[#09090B] border-zinc-400 text-white';
    if (tone === 'inverted') {
      palette = 'bg-[#050506]/90 border-white/60 text-white';
    } else if (tone === 'crimson' || label === 'B' || label === 'B / RT') {
      palette = 'bg-[#180808] border-[#DC2626] text-[#EF4444]';
    } else if (label === 'A') {
      palette = 'bg-[#09090B] border-white text-white';
    } else if (label === 'X' || label === 'Y') {
      palette = 'bg-[#141418] border-zinc-300 text-zinc-100';
    }

    return (
      <kbd
        data-input-mode="xbox"
        className={`inline-flex items-center justify-center font-mono-num font-bold leading-none border select-none ${
          isCircle ? 'w-5 h-5 rounded-full text-[10px]' : 'px-1.5 py-0.5 rounded-md text-[10px] tracking-wider'
        } ${palette} ${className}`}
      >
        {label}
      </kbd>
    );
  }

  let kbPalette = 'bg-[#09090B] border-zinc-700 text-white';
  if (tone === 'inverted') {
    kbPalette = 'bg-[#050506]/90 border-white/40 text-white';
  } else if (tone === 'crimson') {
    kbPalette = 'bg-[#09090B] border-zinc-700 text-[#EF4444]';
  }

  return (
    <kbd
      data-input-mode="keyboard"
      className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md border font-mono-num text-[11px] leading-none select-none ${kbPalette} ${className}`}
    >
      {label}
    </kbd>
  );
}
