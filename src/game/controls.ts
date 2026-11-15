import type { GamepadDeviceInfo } from '../engine/input';

export type InputMode = 'keyboard' | 'xbox';

export interface ControlLabels {
  mode: InputMode;
  controllerName: string | null;
  confirm: string;
  back: string;
  navDir: string;
  navHorizontal: string;
  move: string;
  jump: string;
  dash: string;
  shoot: string;
  weaponCycle: string;
  weaponSelectShort: string;
  tagSwitch: string;
  pause: string;
  restart: string;
  mute: string;
  summon: string;
}

export function isXboxControllerId(id: string): boolean {
  const lower = id.toLowerCase();
  return (
    lower.includes('xbox') ||
    lower.includes('xinput') ||
    lower.includes('045e') ||
    lower.includes('microsoft') ||
    lower.includes('controller') ||
    lower.includes('gamepad')
  );
}

export function detectInputMode(gamepads: GamepadDeviceInfo[]): InputMode {
  for (const pad of gamepads) {
    if (pad.connected) {
      return 'xbox';
    }
  }
  return 'keyboard';
}

export function formatControllerShortName(id: string): string {
  const clean = id.replace(/\s*\([^)]*\)/g, '').trim();
  if (clean.length <= 26) return clean || 'Xbox Controller';
  return `${clean.slice(0, 24)}…`;
}

export function getControlLabels(gamepads: GamepadDeviceInfo[]): ControlLabels {
  const mode = detectInputMode(gamepads);
  const firstPad = gamepads.find((p) => p.connected);

  if (mode === 'xbox') {
    return {
      mode: 'xbox',
      controllerName: firstPad ? formatControllerShortName(firstPad.id) : 'Xbox Controller',
      confirm: 'A',
      back: 'B',
      navDir: 'D-PAD',
      navHorizontal: '← →',
      move: 'LS',
      jump: 'A',
      dash: 'B / RT',
      shoot: 'X',
      weaponCycle: 'LT',
      weaponSelectShort: 'LT',
      tagSwitch: 'Y / LB',
      pause: 'START',
      restart: 'R',
      mute: 'M',
      summon: 'VIEW',
    };
  }

  return {
    mode: 'keyboard',
    controllerName: null,
    confirm: 'ENTER',
    back: 'ESC',
    navDir: '↑↓←→',
    navHorizontal: '← →',
    move: 'WASD',
    jump: 'SPACE',
    dash: 'SHIFT',
    shoot: 'F',
    weaponCycle: '1–4 · C',
    weaponSelectShort: 'C',
    tagSwitch: 'TAB',
    pause: 'ESC',
    restart: 'R',
    mute: 'M',
    summon: 'E',
  };
}
