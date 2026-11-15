import type { InputSnapshot } from '../game/types';

export interface GamepadDeviceInfo {
  index: number;
  id: string;
  connected: boolean;
}

export interface PolledInputs {
  player: InputSnapshot;
  pauseJustPressed: boolean;
  restartJustPressed: boolean;
  muteJustPressed: boolean;
  gamepads: GamepadDeviceInfo[];
}

interface ButtonMemory {
  jump: boolean;
  dash: boolean;
  shoot: boolean;
  pause: boolean;
}

const DEADZONE = 0.2;

export class InputHub {
  private keys = new Set<string>();
  private prevKeys = new Set<string>();
  private latchedKeys = new Set<string>();
  private padMemory: ButtonMemory = { jump: false, dash: false, shoot: false, pause: false };
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
      e.code === 'ArrowRight'
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
      mem.pause = false;
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
        pauseJustPressed: false,
      };
    }

    const axX = pad.axes[0] ?? 0;
    const axY = pad.axes[1] ?? 0;
    const btn = (i: number): boolean => Boolean(pad.buttons[i]?.pressed);

    const left = axX < -DEADZONE || btn(14);
    const right = axX > DEADZONE || btn(15);
    const up = axY < -DEADZONE || btn(12);
    const down = axY > DEADZONE || btn(13);

    const jumpHeld = btn(0) || btn(1);
    const shootHeld = btn(2) || btn(4);
    const dashHeld = btn(3) || btn(5) || btn(7);
    const pauseHeld = btn(9);

    const jumpJustPressed = jumpHeld && !mem.jump;
    const jumpJustReleased = !jumpHeld && mem.jump;
    const dashJustPressed = dashHeld && !mem.dash;
    const shootJustPressed = shootHeld && !mem.shoot;
    const pauseJustPressed = pauseHeld && !mem.pause;

    mem.jump = jumpHeld;
    mem.dash = dashHeld;
    mem.shoot = shootHeld;
    mem.pause = pauseHeld;

    return {
      left,
      right,
      up,
      down,
      jumpHeld,
      jumpJustPressed,
      jumpJustReleased,
      dashJustPressed,
      shootHeld,
      shootJustPressed,
      pauseJustPressed,
    };
  }

  public poll(): PolledInputs {
    const rawPads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    const connectedPads: GamepadDeviceInfo[] = [];
    let activePad: Gamepad | null = null;

    for (let i = 0; i < rawPads.length; i++) {
      const gp = rawPads[i];
      if (gp && gp.connected) {
        connectedPads.push({ index: gp.index, id: gp.id, connected: true });
        if (!activePad) activePad = gp;
      }
    }

    const gp = this.readGamepad(activePad);
    const jumpCodes = ['Space', 'KeyW', 'ArrowUp'];
    const dashCodes = ['ShiftLeft', 'ShiftRight', 'KeyK', 'KeyL'];
    const shootCodes = ['KeyF', 'KeyJ', 'KeyC'];

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
    };

    const pauseJustPressed = gp.pauseJustPressed;
    const restartJustPressed = this.isJustPressed(['KeyR']);
    const muteJustPressed = this.isJustPressed(['KeyM']);

    this.prevKeys = new Set(this.keys);
    this.latchedKeys.clear();

    return {
      player,
      pauseJustPressed,
      restartJustPressed,
      muteJustPressed,
      gamepads: connectedPads,
    };
  }
}
