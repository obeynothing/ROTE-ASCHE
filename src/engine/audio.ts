import type { GameEventType } from '../game/types';

class SynthAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  public unlock(): void {
    if (this.muted || typeof window === 'undefined') return;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
    } catch {
      // Ignore audio block in restricted environments
    }
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    gainPeak: number,
    delay = 0,
  ): void {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    try {
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const jitter = 0.92 + Math.random() * 0.16;
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart * jitter, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd * jitter), now + duration);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gainPeak, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // Ignore transient audio scheduling errors
    }
  }

  public playEvent(type: GameEventType): void {
    if (this.muted) return;
    this.unlock();

    switch (type) {
      case 'jump':
        this.playTone(260, 520, 0.11, 'triangle', 0.11);
        break;
      case 'double_jump':
        this.playTone(420, 780, 0.12, 'triangle', 0.11);
        this.playTone(620, 920, 0.08, 'sine', 0.06, 0.03);
        break;
      case 'land':
        this.playTone(130, 62, 0.06, 'sine', 0.08);
        break;
      case 'dash':
        this.playTone(480, 175, 0.12, 'sawtooth', 0.075);
        break;
      case 'shoot':
        this.playTone(760, 210, 0.09, 'sawtooth', 0.07);
        break;
      case 'shoot_shotgun':
        this.playTone(260, 55, 0.16, 'sawtooth', 0.12);
        this.playTone(540, 120, 0.09, 'square', 0.07);
        break;
      case 'shoot_harpoon':
        this.playTone(980, 140, 0.16, 'sawtooth', 0.095);
        this.playTone(1420, 480, 0.08, 'triangle', 0.06);
        break;
      case 'shoot_mortar':
        this.playTone(210, 95, 0.15, 'triangle', 0.11);
        break;
      case 'explosion':
        this.playTone(160, 32, 0.28, 'sawtooth', 0.14);
        this.playTone(95, 28, 0.25, 'square', 0.09, 0.02);
        break;
      case 'weapon_switch':
        this.playTone(420, 680, 0.07, 'square', 0.06);
        break;
      case 'enemy_hit':
        this.playTone(300, 110, 0.08, 'square', 0.08);
        break;
      case 'enemy_kill':
        this.playTone(220, 48, 0.22, 'sawtooth', 0.12);
        this.playTone(540, 140, 0.14, 'square', 0.07, 0.02);
        break;
      case 'ricochet':
        this.playTone(1180, 820, 0.06, 'triangle', 0.06);
        break;
      case 'bounce':
        this.playTone(220, 740, 0.18, 'triangle', 0.13);
        break;
      case 'crystal':
        this.playTone(660, 990, 0.12, 'sine', 0.11);
        this.playTone(990, 1320, 0.14, 'sine', 0.08, 0.05);
        break;
      case 'switch_on':
        this.playTone(340, 510, 0.1, 'square', 0.07);
        break;
      case 'switch_char':
        this.playTone(380, 580, 0.09, 'triangle', 0.08);
        break;
      case 'summon':
        this.playTone(280, 720, 0.16, 'sine', 0.1);
        break;
      case 'buddy_loss':
        this.playTone(320, 90, 0.28, 'sawtooth', 0.14);
        this.playTone(220, 70, 0.22, 'square', 0.09, 0.04);
        break;
      case 'buddy_rescue':
        this.playTone(392, 587, 0.12, 'triangle', 0.11, 0);
        this.playTone(587, 880, 0.18, 'triangle', 0.12, 0.08);
        break;
      case 'ram_kill':
        this.playTone(160, 420, 0.12, 'sawtooth', 0.12);
        this.playTone(240, 60, 0.18, 'square', 0.09, 0.03);
        break;
      case 'checkpoint':
        this.playTone(440, 880, 0.16, 'triangle', 0.1);
        this.playTone(880, 1180, 0.16, 'sine', 0.08, 0.08);
        break;
      case 'upgrade':
        this.playTone(440, 660, 0.12, 'triangle', 0.11, 0);
        this.playTone(660, 880, 0.14, 'triangle', 0.11, 0.08);
        this.playTone(880, 1320, 0.2, 'triangle', 0.12, 0.16);
        break;
      case 'turret_windup':
        this.playTone(240, 620, 0.35, 'sawtooth', 0.045);
        break;
      case 'turret_fire':
        this.playTone(580, 140, 0.22, 'sawtooth', 0.09);
        break;
      case 'enemy_telegraph':
        this.playTone(320, 720, 0.18, 'square', 0.06);
        break;
      case 'boss_roar':
        this.playTone(140, 38, 0.52, 'sawtooth', 0.16);
        this.playTone(95, 32, 0.55, 'square', 0.12, 0.05);
        break;
      case 'boss_hit':
        this.playTone(190, 75, 0.11, 'sawtooth', 0.1);
        break;
      case 'boss_slam':
        this.playTone(130, 34, 0.34, 'sawtooth', 0.15);
        break;
      case 'boss_defeat':
        this.playTone(220, 42, 0.45, 'sawtooth', 0.16, 0);
        this.playTone(340, 60, 0.48, 'square', 0.14, 0.12);
        this.playTone(523.25, 1046.5, 0.4, 'triangle', 0.13, 0.28);
        break;
      case 'hurt':
        this.playTone(180, 55, 0.24, 'sawtooth', 0.14);
        break;
      case 'stage_clear':
        this.playTone(523.25, 523.25, 0.14, 'triangle', 0.11, 0);
        this.playTone(659.25, 659.25, 0.14, 'triangle', 0.11, 0.09);
        this.playTone(783.99, 783.99, 0.16, 'triangle', 0.12, 0.18);
        this.playTone(1046.5, 1046.5, 0.32, 'triangle', 0.13, 0.27);
        break;
    }
  }
}

export const soundFX = new SynthAudioEngine();
