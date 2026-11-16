import { createStickFilterState, evaluateLeftStickDirections, type StickFilterState } from '../game/controls';
import type { InputSnapshot, MenuInputSnapshot, WeaponId } from '../game/types';

export interface GamepadDeviceInfo {
  index: number;
  id: string;
  connected: boolean;
}

export interface PolledInputs {
  player: InputSnapshot;
  menu: MenuInputSnapshot;
  pauseJustPressed: boolean;
  restartJustPressed: boolean;
  muteJustPressed: boolean;
  gamepads: GamepadDeviceInfo[];
}

interface ButtonMemory {
  jump: boolean;
  dash: boolean;
  shoot: boolean;
  switchChar: boolean;
  summon: boolean;
  weaponCycle: boolean;
  pause: boolean;
  menuUp: boolean;
  menuDown: boolean;
  menuLeft: boolean;
  menuRight: boolean;
  menuConfirm: boolean;
  menuBack: boolean;
}

export class InputHub {
  private keys = new Set<string>();
  private prevKeys = new Set<string>();
  private latchedKeys = new Set<string>();
  private stickFilters = new Map<number, StickFilterState>();
  private padMemory: ButtonMemory = {
    jump: false,
    dash: false,
    shoot: false,
    switchChar: false,
    summon: false,
    weaponCycle: false,
    pause: false,
    menuUp: false,
    menuDown: false,
    menuLeft: false,
    menuRight: false,
    menuConfirm: false,
    menuBack: false,
  };
  private onGamepadChangeCb?: (pads: GamepadDeviceInfo[]) => void;

  constructor(onGamepadChange?: (pads: GamepadDeviceInfo[]) => void) {
    this.onGamepadChangeCb = onGamepadChange;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibility);
    window.addEventListener('gamepadconnected', this.handleGamepadEvent);
    window.addEventListener('gamepaddisconnected', this.handleGamepadEvent);
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    window.removeEventListener('gamepadconnected', this.handleGamepadEvent);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadEvent);
  }

  public clearHeld(): void {
    this.keys.clear();
    this.prevKeys.clear();
    this.latchedKeys.clear();
  }

  public getConnectedGamepads(): GamepadDeviceInfo[] {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return [];
    const raw = navigator.getGamepads();
    const list: GamepadDeviceInfo[] = [];
    for (let i = 0; i < raw.length; i++) {
      const gp = raw[i];
      if (gp && gp.connected) {
        list.push({ index: gp.index, id: gp.id, connected: true });
      }
    }
    return list;
  }

  private handleGamepadEvent = (): void => {
    this.onGamepadChangeCb?.(this.getConnectedGamepads());
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (
      e.code === 'Space' ||
      e.code === 'ArrowUp' ||
      e.code === 'ArrowDown' ||
      e.code === 'ArrowLeft' ||
      e.code === 'ArrowRight' ||
      e.code === 'Tab'
    ) {
      e.preventDefault();
    }
    if (!e.repeat && !this.keys.has(e.code)) {
      this.latchedKeys.add(e.code);
    }
    this.keys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private handleBlur = (): void => {
    this.keys.clear();
    this.latchedKeys.clear();
  };

  private handleVisibility = (): void => {
    if (document.hidden) {
      this.keys.clear();
      this.latchedKeys.clear();
    }
  };

  private isDown(codes: string[]): boolean {
    for (const c of codes) {
      if (this.keys.has(c)) return true;
    }
    return false;
  }

  private isJustPressed(codes: string[]): boolean {
    for (const c of codes) {
      if (this.latchedKeys.has(c) || (this.keys.has(c) && !this.prevKeys.has(c))) return true;
    }
    return false;
  }

  private isJustReleased(codes: string[]): boolean {
    let anyWasDown = false;
    let anyNowDown = false;
    for (const c of codes) {
      if (this.prevKeys.has(c)) anyWasDown = true;
      if (this.keys.has(c)) anyNowDown = true;
    }
    return anyWasDown && !anyNowDown;
  }

  private readGamepad(pad: Gamepad | null) {
    const mem = this.padMemory;
    if (!pad || !pad.connected) {
      mem.jump = false;
      mem.dash = false;
      mem.shoot = false;
      mem.switchChar = false;
      mem.summon = false;
      mem.weaponCycle = false;
      mem.pause = false;
      mem.menuUp = false;
      mem.menuDown = false;
      mem.menuLeft = false;
      mem.menuRight = false;
      mem.menuConfirm = false;
      mem.menuBack = false;
      return {
        left: false,
        right: false,
        up: false,
        down: false,
        jumpHeld: false,
        jumpJustPressed: false,
        jumpJustReleased: false,
        dashJustPressed: false,
        shootHeld: false,
        shootJustPressed: false,
        switchJustPressed: false,
        summonJustPressed: false,
        weaponCycleJustPressed: false,
        pauseJustPressed: false,
        menu: { up: false, down: false, left: false, right: false, confirm: false, back: false },
      };
    }

    const axX = pad.axes[0] ?? 0;
    const axY = pad.axes[1] ?? 0;
    const btn = (i: number): boolean => Boolean(pad.buttons[i]?.pressed);
    const anyBtn = pad.buttons.some((b) => b?.pressed);

    let filter = this.stickFilters.get(pad.index);
    if (!filter) {
      filter = createStickFilterState();
      this.stickFilters.set(pad.index, filter);
    }
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const stick = evaluateLeftStickDirections(
      filter,
      axX,
      axY,
      nowMs,
      anyBtn,
      pad.mapping === 'standard',
    );

    const left = stick.left || btn(14);
    const right = stick.right || btn(15);
    const up = stick.up || btn(12);
    const down = stick.down || btn(13);

    const jumpHeld = btn(0); // A
    const dashHeld = btn(1) || btn(5) || btn(7); // B / RB / RT
    const shootHeld = btn(2); // X
    const switchHeld = btn(3) || btn(4); // Y / LB
    const weaponCycleHeld = btn(6); // LT
    const summonHeld = btn(8); // Back
    const pauseHeld = btn(9); // Start

    const menuConfirmHeld = btn(0); // A
    const menuBackHeld = btn(1); // B

    const res = {
      left,
      right,
      up,
      down,
      jumpHeld,
      jumpJustPressed: jumpHeld && !mem.jump,
      jumpJustReleased: !jumpHeld && mem.jump,
      dashJustPressed: dashHeld && !mem.dash,
      shootHeld,
      shootJustPressed: shootHeld && !mem.shoot,
      switchJustPressed: switchHeld && !mem.switchChar,
      summonJustPressed: summonHeld && !mem.summon,
      weaponCycleJustPressed: weaponCycleHeld && !mem.weaponCycle,
      pauseJustPressed: pauseHeld && !mem.pause,
      menu: {
        up: up && !mem.menuUp,
        down: down && !mem.menuDown,
        left: left && !mem.menuLeft,
        right: right && !mem.menuRight,
        confirm: menuConfirmHeld && !mem.menuConfirm,
        back: menuBackHeld && !mem.menuBack,
      },
    };

    mem.jump = jumpHeld;
    mem.dash = dashHeld;
    mem.shoot = shootHeld;
    mem.switchChar = switchHeld;
    mem.summon = summonHeld;
    mem.weaponCycle = weaponCycleHeld;
    mem.pause = pauseHeld;
    mem.menuUp = up;
    mem.menuDown = down;
    mem.menuLeft = left;
    mem.menuRight = right;
    mem.menuConfirm = menuConfirmHeld;
    mem.menuBack = menuBackHeld;

    return res;
  }

  public poll(): PolledInputs {
    const rawPads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    const connectedPads: GamepadDeviceInfo[] = [];
    let activePad: Gamepad | null = null;
    let firstStandardPad: Gamepad | null = null;
    let firstConnectedPad: Gamepad | null = null;

    for (let i = 0; i < rawPads.length; i++) {
      const gp = rawPads[i];
      if (gp && gp.connected) {
        connectedPads.push({ index: gp.index, id: gp.id, connected: true });
        if (!firstConnectedPad) firstConnectedPad = gp;
        if (gp.mapping === 'standard') {
          if (!firstStandardPad) firstStandardPad = gp;
          const hasActivity =
            gp.buttons.some((b) => b?.pressed) ||
            Math.abs(gp.axes[0] ?? 0) > 0.42 ||
            Math.abs(gp.axes[1] ?? 0) > 0.42;
          if (!activePad && hasActivity) {
            activePad = gp;
          }
        }
      }
    }
    activePad = activePad ?? firstStandardPad ?? firstConnectedPad;

    const gp = this.readGamepad(activePad);
    const jumpCodes = ['Space', 'KeyW', 'ArrowUp'];
    const dashCodes = ['ShiftLeft', 'ShiftRight', 'KeyK', 'KeyL'];
    const shootCodes = ['KeyF', 'KeyJ'];
    const switchCodes = ['Tab', 'KeyQ'];
    const summonCodes = ['KeyE'];
    const weaponCycleCodes = ['KeyC', 'KeyV'];

    let weaponSelect: WeaponId | null = null;
    if (this.isJustPressed(['Digit1', 'Numpad1'])) weaponSelect = 'pulse';
    else if (this.isJustPressed(['Digit2', 'Numpad2'])) weaponSelect = 'shotgun';
    else if (this.isJustPressed(['Digit3', 'Numpad3'])) weaponSelect = 'harpoon';
    else if (this.isJustPressed(['Digit4', 'Numpad4'])) weaponSelect = 'mortar';

    const player: InputSnapshot = {
      left: this.isDown(['KeyA', 'ArrowLeft']) || gp.left,
      right: this.isDown(['KeyD', 'ArrowRight']) || gp.right,
      up: this.isDown(['KeyW', 'ArrowUp']) || gp.up,
      down: this.isDown(['KeyS', 'ArrowDown']) || gp.down,
      jumpHeld: this.isDown(jumpCodes) || gp.jumpHeld,
      jumpJustPressed: this.isJustPressed(jumpCodes) || gp.jumpJustPressed,
      jumpJustReleased: this.isJustReleased(jumpCodes) || gp.jumpJustReleased,
      dashJustPressed: this.isJustPressed(dashCodes) || gp.dashJustPressed,
      shootJustPressed: this.isJustPressed(shootCodes) || gp.shootJustPressed,
      shootHeld: this.isDown(shootCodes) || gp.shootHeld,
      switchJustPressed: this.isJustPressed(switchCodes) || gp.switchJustPressed,
      summonJustPressed: this.isJustPressed(summonCodes) || gp.summonJustPressed,
      weaponCycleJustPressed: this.isJustPressed(weaponCycleCodes) || gp.weaponCycleJustPressed,
      weaponSelect,
    };

    const menu: MenuInputSnapshot = {
      up: this.isJustPressed(['ArrowUp', 'KeyW']) || gp.menu.up,
      down: this.isJustPressed(['ArrowDown', 'KeyS']) || gp.menu.down,
      left: this.isJustPressed(['ArrowLeft', 'KeyA']) || gp.menu.left,
      right: this.isJustPressed(['ArrowRight', 'KeyD']) || gp.menu.right,
      confirm: this.isJustPressed(['Enter', 'Space']) || gp.menu.confirm,
      back: this.isJustPressed(['Escape', 'Backspace']) || gp.menu.back,
    };

    const pauseJustPressed = gp.pauseJustPressed;
    const restartJustPressed = this.isJustPressed(['KeyR']);
    const muteJustPressed = this.isJustPressed(['KeyM']);

    this.prevKeys = new Set(this.keys);
    this.latchedKeys.clear();

    return {
      player,
      menu,
      pauseJustPressed,
      restartJustPressed,
      muteJustPressed,
      gamepads: connectedPads,
    };
  }
}
