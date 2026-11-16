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

export const STICK_MOVE_DEADZONE = 0.42;
export const STICK_VERTICAL_AIM_DEADZONE = 0.50;
export const STICK_SNAPBACK_PEAK = 0.60;
export const STICK_SNAPBACK_WINDOW_MS = 175;
export const STICK_SNAPBACK_OVERRIDE = 0.86;
export const STICK_NEUTRAL_ZONE = 0.24;

export interface StickFilterState {
  strongDirX: -1 | 0 | 1;
  strongAtMsX: number;
  calibratedNeutralX: boolean;
  initialAxisX: number | null;
}

export function createStickFilterState(): StickFilterState {
  return {
    strongDirX: 0,
    strongAtMsX: -10000,
    calibratedNeutralX: false,
    initialAxisX: null,
  };
}

export function evaluateLeftStickDirections(
  state: StickFilterState,
  rawX: number,
  rawY: number,
  nowMs: number,
  _anyButtonPressed: boolean,
  isStandardMapping = true,
): { left: boolean; right: boolean; up: boolean; down: boolean } {
  const axX = Number.isFinite(rawX) ? rawX : 0;
  const axY = Number.isFinite(rawY) ? rawY : 0;

  if (state.initialAxisX === null) {
    state.initialAxisX = axX;
  }
  if (!state.calibratedNeutralX) {
    const nearCenter = Math.abs(axX) <= STICK_NEUTRAL_ZONE;
    const movedSignificantly = Math.abs(axX - state.initialAxisX) >= 0.35;
    if (nearCenter || (isStandardMapping && movedSignificantly)) {
      state.calibratedNeutralX = true;
    }
  }

  // Reject uncalibrated phantom/drifting axis until genuinely centered or moved
  if (!state.calibratedNeutralX) {
    return {
      left: false,
      right: false,
      up: axY < -STICK_MOVE_DEADZONE,
      down: axY > STICK_MOVE_DEADZONE,
    };
  }

  // Record strong intentional push to arm snapback protection on release
  if (axX <= -STICK_SNAPBACK_PEAK) {
    state.strongDirX = -1;
    state.strongAtMsX = nowMs;
  } else if (axX >= STICK_SNAPBACK_PEAK) {
    state.strongDirX = 1;
    state.strongAtMsX = nowMs;
  } else if (state.strongDirX !== 0 && nowMs - state.strongAtMsX > STICK_SNAPBACK_WINDOW_MS) {
    state.strongDirX = 0;
  }

  // Higher horizontal threshold when pushing strongly Up/Down so aiming upward won't flip facing
  const xThresh = Math.abs(axY) > 0.65 ? STICK_VERTICAL_AIM_DEADZONE : STICK_MOVE_DEADZONE;
  const inSnapbackWindow = state.strongDirX !== 0 && nowMs - state.strongAtMsX <= STICK_SNAPBACK_WINDOW_MS;

  let left = axX < -xThresh;
  let right = axX > xThresh;

  // Suppress spring snapback overshoot in the opposite direction after releasing a strong stick push
  if (inSnapbackWindow && state.strongDirX === -1 && right && axX < STICK_SNAPBACK_OVERRIDE) {
    right = false;
  } else if (inSnapbackWindow && state.strongDirX === 1 && left && axX > -STICK_SNAPBACK_OVERRIDE) {
    left = false;
  }

  const up = axY < -STICK_MOVE_DEADZONE;
  const down = axY > STICK_MOVE_DEADZONE;

  return { left, right, up, down };
}

