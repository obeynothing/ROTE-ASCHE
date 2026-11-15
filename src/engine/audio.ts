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
      case 'turret_windup':
        this.playTone(240, 620, 0.35, 'sawtooth', 0.045);
        break;
      case 'turret_fire':
        this.playTone(580, 140, 0.22, 'sawtooth', 0.09);
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
