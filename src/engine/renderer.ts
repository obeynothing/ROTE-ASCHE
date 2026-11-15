import { getGateRect } from '../game/physics';
import type { BackdropTheme, GameEvent, Particle, PlayerState, WorldSimulation } from '../game/types';

const MAX_PARTICLES = 180;
const VIRTUAL_WORLD_H = 720;
const PIXEL_H = 270;
const WORLD_TO_PIXEL = PIXEL_H / VIRTUAL_WORLD_H;

export class WorldRenderer {
  private particles: Particle[] = [];
  private particleCursor = 0;
  private pixelBuffer: HTMLCanvasElement;
  private pctx: CanvasRenderingContext2D;
  private skyCache: HTMLCanvasElement | null = null;
  private skyCacheKey = '';

  constructor() {
    this.pixelBuffer = document.createElement('canvas');
    this.pixelBuffer.width = 480;
    this.pixelBuffer.height = PIXEL_H;
    const pctx = this.pixelBuffer.getContext('2d');
    if (!pctx) throw new Error('2D pixel buffer context unavailable');
    pctx.imageSmoothingEnabled = false;
    this.pctx = pctx;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 2,
        color: '#DC2626',
        gravity: 300,
      });
    }
  }

  public spawnParticlesFromEvents(events: GameEvent[]): void {
    for (const ev of events) {
      let count = 5;
      let speed = 135;
      let gravity = 400;
      let color = ev.color ?? '#DC2626';

      if (ev.type === 'hurt' || ev.type === 'enemy_kill') {
        count = 24;
        speed = 270;
        gravity = 550;
        color = '#DC2626';
      } else if (ev.type === 'stage_clear') {
        count = 28;
        speed = 230;
        gravity = 190;
        color = '#F4F4F5';
      } else if (ev.type === 'crystal') {
        count = 14;
        speed = 160;
        gravity = 90;
        color = '#EF4444';
      } else if (ev.type === 'dash' || ev.type === 'double_jump') {
        count = 10;
        speed = 130;
        gravity = 40;
        color = ev.type === 'double_jump' ? '#EF4444' : '#F4F4F5';
      } else if (ev.type === 'shoot') {
        count = 4;
        speed = 110;
        gravity = 0;
        color = '#FFFFFF';
      } else if (ev.type === 'ricochet' || ev.type === 'enemy_hit') {
        count = 7;
        speed = 165;
        gravity = 300;
        color = ev.type === 'ricochet' ? '#FFFFFF' : '#EF4444';
      } else if (ev.type === 'bounce') {
        count = 10;
        speed = 190;
        gravity = 320;
        color = '#DC2626';
      }

      for (let i = 0; i < count; i++) {
        const p = this.particles[this.particleCursor];
        this.particleCursor = (this.particleCursor + 1) % MAX_PARTICLES;

        const angle = Math.random() * Math.PI * 2;
        const mag = speed * (0.35 + Math.random() * 0.65);
        p.active = true;
        p.x = ev.x + (Math.random() - 0.5) * 8;
        p.y = ev.y + (Math.random() - 0.5) * 8;
        p.vx = Math.cos(angle) * mag;
        p.vy = Math.sin(angle) * mag - 35;
        p.maxLife = 0.22 + Math.random() * 0.34;
        p.life = p.maxLife;
        p.size = i % 3 === 0 ? 4 : 3;
        p.color = i % 3 === 0 && (ev.type === 'hurt' || ev.type === 'enemy_kill') ? '#F4F4F5' : color;
        p.gravity = gravity;
      }
    }
  }

  public updateParticles(dt: number): void {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  private px(v: number): number {
    return Math.round(v * WORLD_TO_PIXEL);
  }

  public render(
    targetCtx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    sim: WorldSimulation,
    options: { isTitleBackdrop: boolean; timeSeconds: number },
  ): void {
    const aspect = canvasWidth / Math.max(1, canvasHeight);
    const pixelW = Math.max(320, Math.round(PIXEL_H * aspect));
    if (this.pixelBuffer.width !== pixelW) {
      this.pixelBuffer.width = pixelW;
      this.pctx.imageSmoothingEnabled = false;
    }

    const viewWorldW = VIRTUAL_WORLD_H * aspect;

    let targetCamX = 0;
    if (options.isTitleBackdrop) {
      targetCamX = 0;
    } else {
      const focusX = sim.player.x + sim.player.w / 2;
      targetCamX = Math.max(0, Math.min(sim.level.width - viewWorldW, focusX - viewWorldW * 0.4));
    }
    sim.cameraX += (targetCamX - sim.cameraX) * 0.16;

    const shakeMag = sim.trauma * sim.trauma * 5;
    const shakePxX = shakeMag > 0.1 ? Math.round((Math.random() * 2 - 1) * shakeMag) : 0;
    const shakePxY = shakeMag > 0.1 ? Math.round((Math.random() * 2 - 1) * shakeMag) : 0;

    const ctx = this.pctx;
    const camPxX = Math.round(sim.cameraX * WORLD_TO_PIXEL);

    // 1. Sector-Specific Dystopian Red/Black/White Backdrop
    this.drawDystopianBackdrop(
      ctx,
      pixelW,
      PIXEL_H,
      camPxX,
      options.timeSeconds,
      options.isTitleBackdrop,
      sim.level.theme,
    );

    ctx.save();
    ctx.translate(-camPxX + shakePxX, shakePxY);

    // 2. Clean Solid Orthogonal Floor/Wall Power Conduits (never confused with lasers)
    this.drawPowerPipes(ctx, sim, options.timeSeconds);

    // 3. Moving Platform Rails
    for (const mp of sim.movingPlatforms) {
      const range = mp.moveRange ?? 120;
      const rx = this.px(mp.originX);
      const ry = this.px(mp.originY + mp.h / 2);
      ctx.fillStyle = '#27272A';
      if (mp.moveAxis === 'x') {
        ctx.fillRect(rx + 4, ry, this.px(range + mp.w) - 8, 2);
      } else {
        const topY = this.px(mp.originY - range + mp.h / 2);
        ctx.fillRect(this.px(mp.originX + mp.w / 2) - 1, topY, 2, ry - topY);
      }
    }

    // 4. Platforms
    for (const plat of sim.level.platforms) {
      if (plat.kind === 'moving') continue;
      this.drawBrickPlatform(ctx, plat.x, plat.y, plat.w, plat.h, plat.kind, plat.accent ?? 'none');
    }
    for (const mp of sim.movingPlatforms) {
      this.drawBrickPlatform(ctx, mp.x, mp.y, mp.w, mp.h, 'moving', mp.accent ?? 'crimson');
    }

    // 5. Iron Blast Gates (with pairing notch badge)
    for (let gi = 0; gi < sim.gates.length; gi++) {
      const gate = sim.gates[gi];
      const r = getGateRect(gate);
      const gx = this.px(r.x);
      const gy = this.px(r.y);
      const gw = Math.max(6, this.px(r.w));
      const gh = Math.max(4, this.px(r.h));

      ctx.fillStyle = '#09090B';
      ctx.fillRect(gx, gy, gw, gh);
      ctx.fillStyle = '#27272A';
      ctx.fillRect(gx + 1, gy + 1, gw - 2, gh - 2);

      ctx.fillStyle = '#DC2626';
      for (let sy = gy + 3; sy < gy + gh - 3; sy += 6) {
        ctx.fillRect(gx + 2, sy, gw - 4, 2);
      }
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(gx, gy, 1, gh);
      ctx.fillRect(gx + gw - 1, gy, 1, gh);

      // Channel notch pips at gate top
      for (let p = 0; p <= gi; p++) {
        ctx.fillStyle = gate.openProgress > 0.3 ? '#FFFFFF' : '#EF4444';
        ctx.fillRect(gx + 1 + p * 3, gy - 3, 2, 2);
      }
    }

    // 6. Pressure Plates / Switches (with matching channel notch pips)
    for (const sw of sim.switches) {
      const sx = this.px(sw.x);
      const sy = this.px(sw.y);
      const swW = Math.max(12, this.px(sw.w));
      const swH = Math.max(5, this.px(sw.h));
      const sink = sw.pressed ? 2 : 0;
      const gateIndex = Math.max(0, sim.gates.findIndex((g) => g.id === sw.targetGateId));

      ctx.fillStyle = '#27272A';
      ctx.fillRect(sx - 1, sy + swH - 2, swW + 2, 2);
      ctx.fillStyle = sw.pressed ? '#F4F4F5' : '#DC2626';
      ctx.fillRect(sx + 1, sy + sink, swW - 2, swH - 2 - sink);

      // Channel notch pips on pedestal base
      for (let p = 0; p <= gateIndex; p++) {
        ctx.fillStyle = sw.pressed ? '#FFFFFF' : '#EF4444';
        ctx.fillRect(sx + 2 + p * 3, sy + swH, 2, 2);
      }

      if (sw.mode === 'timed' && sw.pressed && sw.duration) {
        const ratio = Math.max(0, sw.timer / sw.duration);
        ctx.fillStyle = '#18181B';
        ctx.fillRect(sx, sy - 4, swW, 2);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(sx, sy - 4, Math.round(swW * ratio), 2);
      }
    }

    // 7. Bounce Pads
    for (const bp of sim.level.bouncePads) {
      const bx = this.px(bp.x);
      const by = this.px(bp.y);
      const bw = this.px(bp.w);
      const bh = Math.max(4, this.px(bp.h));
      ctx.fillStyle = '#18181B';
      ctx.fillRect(bx, by + 2, bw, bh - 2);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(bx + 1, by, bw - 2, 2);
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(bx + 4, by, bw - 8, 1);
    }

    // 8. Exit Monolith
    this.drawGoalMonolith(ctx, sim, options.timeSeconds);

    // 9. Crimson Relics (Blood Shards)
    for (const crystal of sim.level.crystals) {
      if (sim.collectedCrystals.has(crystal.id)) continue;
      const bob = Math.round(Math.sin(options.timeSeconds * 4 + crystal.x * 0.03) * 2);
      const cx = this.px(crystal.x);
      const cy = this.px(crystal.y) + bob;

      ctx.fillStyle = '#991B1B';
      ctx.fillRect(cx - 4, cy - 2, 8, 4);
      ctx.fillRect(cx - 2, cy - 5, 4, 10);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(cx - 3, cy - 2, 6, 4);
      ctx.fillRect(cx - 1, cy - 4, 2, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx - 1, cy - 1, 2, 2);
    }

    // 10. Dystopian Enemies & Laser Telegraphs
    this.drawEnemies(ctx, sim, options.timeSeconds);

    // 11. Weapon Projectiles
    for (const proj of sim.projectiles) {
      if (!proj.active) continue;
      const px = this.px(proj.x);
      const py = this.px(proj.y);
      const horiz = Math.abs(proj.vx) >= Math.abs(proj.vy);
      ctx.fillStyle = '#DC2626';
      if (horiz) {
        ctx.fillRect(px - 3, py - 1, 6, 3);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py, 3, 1);
      } else {
        ctx.fillRect(px - 1, py - 3, 3, 6);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px, py - 1, 1, 3);
      }
    }

    // 12. Protagonist Pixel Sprite + Crimson Scarf + Weapon
    this.drawProtagonist(ctx, sim.player, options.timeSeconds);

    // 13. Pooled Pixel Particles
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha > 0.5 ? 1 : 0.55;
      ctx.fillStyle = p.color;
      const sz = Math.max(1, Math.round(p.size * WORLD_TO_PIXEL * 1.4));
      ctx.fillRect(this.px(p.x), this.px(p.y), sz, sz);
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // 14. Biome Foreground Weather / Ash
    this.drawForegroundWeather(ctx, pixelW, PIXEL_H, camPxX, options.timeSeconds, sim.level.theme);

    targetCtx.imageSmoothingEnabled = false;
    targetCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    targetCtx.drawImage(this.pixelBuffer, 0, 0, canvasWidth, canvasHeight);
  }

  private drawDystopianBackdrop(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camPxX: number,
    t: number,
    isTitleBackdrop: boolean,
    theme: BackdropTheme,
  ): void {
    const cacheKey = `${w}:${theme}`;
    if (!this.skyCache || this.skyCacheKey !== cacheKey) {
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const octx = off.getContext('2d');
      if (octx) {
        this.bakeThemeSky(octx, w, h, theme);
      }
      this.skyCache = off;
      this.skyCacheKey = cacheKey;
    }

    ctx.drawImage(this.skyCache, 0, 0);

    if (theme === 'eclipse_citadel') {
      const sweep = Math.sin(t * 0.35) * 45;
      ctx.fillStyle = 'rgba(220, 38, 38, 0.06)';
      ctx.beginPath();
      ctx.moveTo(Math.round(w * 0.52), h);
      ctx.lineTo(Math.round(w * 0.52 - 28 + sweep), 0);
      ctx.lineTo(Math.round(w * 0.52 + 14 + sweep), 0);
      ctx.closePath();
      ctx.fill();

      const farOff = -(Math.round(camPxX * 0.14) % 160);
      ctx.fillStyle = '#0B0B0E';
      for (let x = farOff - 160; x < w + 160; x += 160) {
        if (isTitleBackdrop && x < 175) continue;
        ctx.fillRect(x + 12, 82, 34, h - 82);
        ctx.fillRect(x + 6, 76, 46, 6);
        ctx.fillRect(x + 27, 46, 3, 30);
        if (Math.sin(t * 2.5 + x) > 0.2) {
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(x + 27, 44, 3, 2);
          ctx.fillStyle = '#0B0B0E';
        }
        ctx.fillRect(x + 76, 128, 22, h - 128);
        ctx.fillRect(x + 98, 128, 40, 14);
        ctx.fillRect(x + 132, 114, 18, h - 114);
        ctx.fillStyle = '#7F1D1D';
        ctx.fillRect(x + 21, 98, 2, 7);
        ctx.fillRect(x + 32, 98, 2, 7);
        ctx.fillRect(x + 21, 116, 2, 7);
        ctx.fillStyle = '#0B0B0E';
      }

      const midOff = -(Math.round(camPxX * 0.28) % 140);
      for (let x = midOff - 140; x < w + 140; x += 140) {
        if (isTitleBackdrop && x < 165) continue;
        ctx.fillStyle = '#121216';
        ctx.fillRect(x, 12, 140, 3);
        for (let cy = 15; cy < 88; cy += 4) {
          ctx.fillRect(x + 34, cy, 1, 2);
          ctx.fillRect(x + 108, cy, 1, 2);
        }
        const sway = Math.round(Math.sin(t * 2.1 + x * 0.05) * 2);
        ctx.fillStyle = '#450A0A';
        ctx.fillRect(x + 64, 15, 10, 16);
        ctx.fillRect(x + 64 + sway, 31, 9, 14);
        ctx.fillRect(x + 65 + sway, 45, 5, 10);
      }
    } else if (theme === 'ash_foundry') {
      // Twin blast-furnace chimneys & overhead gantry cranes
      const farOff = -(Math.round(camPxX * 0.16) % 180);
      for (let x = farOff - 180; x < w + 180; x += 180) {
        ctx.fillStyle = '#0D0D11';
        // Smokestack 1 & 2
        ctx.fillRect(x + 18, 42, 26, h - 42);
        ctx.fillRect(x + 14, 38, 34, 4);
        ctx.fillRect(x + 88, 64, 30, h - 64);
        ctx.fillRect(x + 84, 60, 38, 4);

        // Glowing crimson furnace mouth
        ctx.fillStyle = Math.sin(t * 4 + x) > 0 ? '#EF4444' : '#991B1B';
        ctx.fillRect(x + 96, 170, 14, 18);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 100, 174, 6, 4);

        // Rising pixel smoke plumes from smokestack 1
        ctx.fillStyle = '#27272A';
        for (let s = 0; s < 3; s++) {
          const drift = Math.round(Math.sin(t * 1.4 + s) * 4 + s * 3);
          const sy = ((34 - Math.round((t * 12 + s * 14) % 34)) + 34) % 34;
          ctx.fillRect(x + 24 + drift, sy, 10 - s * 2, 5);
        }
      }

      // Mid gantry trusses
      const midOff = -(Math.round(camPxX * 0.3) % 120);
      ctx.fillStyle = '#15151B';
      for (let x = midOff - 120; x < w + 120; x += 120) {
        ctx.fillRect(x, 28, 120, 4);
        ctx.fillRect(x + 14, 32, 3, h - 32);
        for (let d = 0; d < 120; d += 20) {
          ctx.fillRect(x + d, 24, 6, 4);
        }
      }
    } else if (theme === 'obelisk_wasteland') {
      // Fractured jagged mountain silhouettes & shattered white-rimmed obelisks
      const farOff = -(Math.round(camPxX * 0.12) % 200);
      for (let x = farOff - 200; x < w + 200; x += 200) {
        ctx.fillStyle = '#0B0B0E';
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(x + 48, 118);
        ctx.lineTo(x + 95, 165);
        ctx.lineTo(x + 146, 96);
        ctx.lineTo(x + 200, h);
        ctx.closePath();
        ctx.fill();

        // Shattered tilted obelisk
        ctx.fillStyle = '#141419';
        ctx.fillRect(x + 108, 104, 18, h - 104);
        ctx.fillStyle = '#E4E4E7';
        ctx.fillRect(x + 108, 104, 1, h - 104);
        // Floating severed capstone
        const bob = Math.round(Math.sin(t * 1.8 + x * 0.04) * 2);
        ctx.fillStyle = '#141419';
        ctx.fillRect(x + 110, 82 + bob, 14, 12);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(x + 114, 96 + bob, 6, 2);
      }
    } else if (theme === 'cathedral_void') {
      // Towering gothic ribs & pointed arches + vertical crimson light shafts
      const farOff = -(Math.round(camPxX * 0.18) % 130);
      for (let x = farOff - 130; x < w + 130; x += 130) {
        // Subtle crimson light shaft pouring from top
        ctx.fillStyle = 'rgba(220, 38, 38, 0.065)';
        ctx.fillRect(x + 50, 0, 26, h);

        // Gothic rib pillars
        ctx.fillStyle = '#0C0C10';
        ctx.fillRect(x + 10, 0, 18, h);
        ctx.fillRect(x + 96, 0, 18, h);
        // Pointed arch lintel
        ctx.fillRect(x + 28, 22, 68, 12);
        ctx.fillRect(x + 38, 34, 48, 10);
        ctx.fillRect(x + 52, 44, 20, 8);

        // Rose window slits in crimson & white
        ctx.fillStyle = '#7F1D1D';
        ctx.fillRect(x + 58, 10, 8, 10);
        ctx.fillStyle = '#F4F4F5';
        ctx.fillRect(x + 61, 12, 2, 6);
      }
    } else {
      // red_core: Pulsing concentric Reactor Halo + jagged lattice pylons
      const cx = Math.round(w * 0.56);
      const cy = Math.round(h * 0.42);
      const pulse = Math.round(Math.sin(t * 3.2) * 3);

      // Outer white & crimson reactor rings
      for (const rad of [66 + pulse, 48 - pulse, 28]) {
        ctx.strokeStyle = rad === 28 ? '#FFFFFF' : '#DC2626';
        ctx.lineWidth = rad === 28 ? 2 : 1;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(cx - 5, cy - 5, 10, 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx - 2, cy - 2, 4, 4);

      const farOff = -(Math.round(camPxX * 0.22) % 140);
      ctx.fillStyle = '#0D0D12';
      for (let x = farOff - 140; x < w + 140; x += 140) {
        ctx.fillRect(x + 18, 0, 10, h);
        ctx.fillStyle = '#450A0A';
        ctx.fillRect(x + 21, 0, 2, h);
        ctx.fillStyle = '#0D0D12';
      }
    }
  }

  private bakeThemeSky(octx: CanvasRenderingContext2D, w: number, h: number, theme: BackdropTheme): void {
    octx.fillStyle = '#050506';
    octx.fillRect(0, 0, w, h);

    // Ordered pixel dither horizon gradient (varies intensity by biome)
    const horizonStart = theme === 'ash_foundry' || theme === 'red_core' ? 68 : 95;
    for (let y = horizonStart; y < h; y++) {
      const band = (y - horizonStart) / (h - horizonStart);
      if (band > 0.72) octx.fillStyle = theme === 'ash_foundry' ? '#240608' : '#160507';
      else if (band > 0.44) octx.fillStyle = '#0E0406';
      else octx.fillStyle = '#080507';

      for (let x = 0; x < w; x++) {
        const checker = (x + y) % 2 === 0;
        if (band > 0.86 || (band > 0.32 && checker) || (band > 0.14 && x % 4 === 0 && y % 2 === 0)) {
          octx.fillRect(x, y, 1, 1);
        }
      }
    }

    if (theme === 'eclipse_citadel') {
      const sunX = Math.round(w * 0.76);
      const sunY = Math.round(h * 0.34);
      const outerR = 54;
      const innerR = 44;
      for (let dy = -outerR; dy <= outerR; dy++) {
        for (let dx = -outerR; dx <= outerR; dx++) {
          const dist = Math.hypot(dx, dy);
          if (dist <= outerR) {
            if (dist <= innerR) {
              octx.fillStyle = '#050506';
              octx.fillRect(sunX + dx, sunY + dy, 1, 1);
            } else if (dist <= innerR + 2 && dx < 8) {
              octx.fillStyle = '#F4F4F5';
              octx.fillRect(sunX + dx, sunY + dy, 1, 1);
            } else if (dist <= outerR - 4 || (dx + dy) % 2 === 0) {
              octx.fillStyle = dist <= innerR + 5 ? '#EF4444' : '#991B1B';
              octx.fillRect(sunX + dx, sunY + dy, 1, 1);
            }
          }
        }
      }
    } else if (theme === 'obelisk_wasteland') {
      // Razor white/crimson crescent moon
      const mx = Math.round(w * 0.24);
      const my = Math.round(h * 0.24);
      for (let dy = -22; dy <= 22; dy++) {
        for (let dx = -22; dx <= 22; dx++) {
          const d1 = Math.hypot(dx, dy);
          const d2 = Math.hypot(dx - 8, dy + 4);
          if (d1 <= 21 && d2 > 18) {
            octx.fillStyle = d1 > 19 ? '#F4F4F5' : '#DC2626';
            octx.fillRect(mx + dx, my + dy, 1, 1);
          }
        }
      }
    }
  }

  private drawForegroundWeather(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camPxX: number,
    t: number,
    theme: BackdropTheme,
  ): void {
    const count = theme === 'red_core' || theme === 'ash_foundry' ? 36 : 26;
    for (let i = 0; i < count; i++) {
      const speedX = theme === 'obelisk_wasteland' ? 34 + (i % 5) * 9 : 16 + (i % 5) * 6;
      const upFlow = theme === 'ash_foundry' || theme === 'red_core';
      const speedY = upFlow ? -(18 + (i % 4) * 8) : 12 + (i % 4) * 6;
      const ax = (((i * 73 - t * speedX - camPxX * 0.45) % w) + w) % w;
      const ay = (((i * 41 + t * speedY) % h) + h) % h;
      ctx.fillStyle = i % 3 === 0 ? '#EF4444' : i % 4 === 0 ? '#F4F4F5' : '#71717A';
      const lenY = theme === 'obelisk_wasteland' && i % 5 === 0 ? 3 : 1;
      ctx.fillRect(Math.round(ax), Math.round(ay), 1, lenY);
    }
  }

  // Clean orthogonal solid iron power pipes (NEVER dashed like lasers)
  private drawPowerPipes(ctx: CanvasRenderingContext2D, sim: WorldSimulation, t: number): void {
    for (const sw of sim.switches) {
      const gate = sim.gates.find((g) => g.id === sw.targetGateId);
      if (!gate) continue;
      const x1 = this.px(sw.x + sw.w / 2);
      const y1 = this.px(sw.y + sw.h);
      const x2 = this.px(gate.x + gate.w / 2);
      const y2 = this.px(gate.y + gate.h);
      const elbowY = Math.max(y1, y2) + 8;

      ctx.fillStyle = sw.pressed ? '#52525B' : '#1E1E24';
      // Vertical drop from switch
      ctx.fillRect(x1, y1, 2, Math.max(2, elbowY - y1));
      // Horizontal floor pipe
      const minX = Math.min(x1, x2);
      ctx.fillRect(minX, elbowY, Math.abs(x2 - x1) + 2, 2);
      // Vertical rise into gate
      ctx.fillRect(x2, y2, 2, Math.max(2, elbowY - y2 + 2));

      // Solid junction rivets
      ctx.fillStyle = '#3F3F46';
      ctx.fillRect(x1 - 1, elbowY - 1, 4, 4);
      ctx.fillRect(x2 - 1, elbowY - 1, 4, 4);

      // Single solid traveling energy pulse when switch is active
      if (sw.pressed) {
        const prog = (t * 0.9) % 1;
        const pulseX = Math.round(x1 + (x2 - x1) * prog);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(pulseX - 1, elbowY - 1, 4, 4);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(pulseX, elbowY, 2, 2);
      }
    }
  }

  private drawBrickPlatform(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    kind: string,
    accent: string,
  ): void {
    const px = this.px(x);
    const py = this.px(y);
    const pw = Math.max(4, this.px(w));
    const ph = Math.max(4, this.px(h));

    if (kind === 'oneway') {
      ctx.fillStyle = '#18181B';
      ctx.fillRect(px, py, pw, ph);
      ctx.fillStyle = accent === 'crimson' ? '#DC2626' : '#E4E4E7';
      ctx.fillRect(px, py, pw, 2);
      ctx.fillStyle = '#27272A';
      for (let bx = px + 4; bx < px + pw - 4; bx += 12) {
        ctx.fillRect(bx, py + ph, 2, 3);
      }
      return;
    }

    ctx.fillStyle = '#0C0C10';
    ctx.fillRect(px, py, pw, ph);

    ctx.fillStyle = '#060608';
    for (let row = py + 8; row < py + ph; row += 8) {
      ctx.fillRect(px, row, pw, 1);
      const offset = ((row - py) / 8) % 2 === 0 ? 0 : 8;
      for (let col = px + offset; col < px + pw; col += 16) {
        ctx.fillRect(col, row - 8, 1, 8);
      }
    }

    ctx.fillStyle = kind === 'moving' || accent === 'crimson' ? '#DC2626' : '#E4E4E7';
    ctx.fillRect(px, py, pw, 2);
    ctx.fillStyle = '#27272A';
    ctx.fillRect(px, py + 2, pw, 1);

    ctx.fillStyle = '#27272A';
    ctx.fillRect(px, py, 1, ph);
    ctx.fillRect(px + pw - 1, py, 1, ph);

    if (ph <= 24 && pw >= 36) {
      ctx.fillStyle = '#1F1F26';
      ctx.fillRect(px + 6, py + ph, 1, 7);
      ctx.fillRect(px + pw - 7, py + ph, 1, 5);
    }
  }

  private drawGoalMonolith(ctx: CanvasRenderingContext2D, sim: WorldSimulation, t: number): void {
    const g = sim.level.goal;
    const gx = this.px(g.x);
    const gy = this.px(g.y);
    const gw = this.px(g.w);
    const gh = this.px(g.h);
    const cx = Math.round(gx + gw / 2);

    ctx.fillStyle = '#09090B';
    ctx.fillRect(gx, gy, gw, gh);
    ctx.fillStyle = '#F4F4F5';
    ctx.fillRect(gx, gy, gw, 2);
    ctx.fillRect(gx, gy, 2, gh);
    ctx.fillRect(gx + gw - 2, gy, 2, gh);

    ctx.fillStyle = '#7F1D1D';
    ctx.fillRect(gx + 4, gy + 4, gw - 8, gh - 4);
    ctx.fillStyle = '#DC2626';
    const band = Math.round(Math.sin(t * 6) * 2);
    ctx.fillRect(gx + 6, gy + 8 + band, gw - 12, gh - 12);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 1, gy + 7, 2, gh - 10);
  }

  private drawEnemies(ctx: CanvasRenderingContext2D, sim: WorldSimulation, t: number): void {
    for (const enemy of sim.enemies) {
      if (!enemy.alive) continue;

      if (enemy.type === 'patrol_drone') {
        const hover = Math.round(Math.sin(t * 6 + enemy.x * 0.05) * 1.5);
        const ex = this.px(enemy.x);
        const ey = this.px(enemy.y) + hover;
        const ew = this.px(enemy.w);
        const eh = this.px(enemy.h);

        if (enemy.hitFlashTimer > 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(ex, ey + 1, ew, eh - 2);
        } else {
          ctx.fillStyle = '#27272A';
          ctx.fillRect(ex, ey + 2, ew, eh - 3);
          ctx.fillStyle = '#09090B';
          ctx.fillRect(ex + 2, ey + 4, ew - 4, eh - 6);
          ctx.fillStyle = '#E4E4E7';
          ctx.fillRect(ex + 1, ey + 1, ew - 2, 1);
          ctx.fillStyle = '#EF4444';
          const eyeX = enemy.dir > 0 ? ex + ew - 5 : ex + 2;
          ctx.fillRect(eyeX, ey + 5, 3, 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(eyeX + 1, ey + 5, 1, 1);
        }

        // HP pips when damaged
        if (enemy.hp < enemy.maxHp) {
          for (let i = 0; i < enemy.maxHp; i++) {
            ctx.fillStyle = i < enemy.hp ? '#EF4444' : '#27272A';
            ctx.fillRect(ex + 2 + i * 4, ey - 3, 3, 2);
          }
        }
      } else if (enemy.type === 'saw_slider') {
        const cx = this.px(enemy.x + enemy.w / 2);
        const cy = this.px(enemy.y + enemy.h / 2);
        const minX = this.px(enemy.patrolMinX ?? enemy.x) + 6;
        const maxX = this.px(enemy.patrolMaxX ?? enemy.x) + 6;

        ctx.fillStyle = '#3F3F46';
        ctx.fillRect(minX, cy, maxX - minX, 2);

        const flip = Math.floor(t * 16) % 2 === 0;
        ctx.fillStyle = '#F4F4F5';
        ctx.fillRect(cx - 5, cy - 5, 10, 10);
        ctx.fillStyle = '#DC2626';
        if (flip) {
          ctx.fillRect(cx - 7, cy - 1, 14, 2);
          ctx.fillRect(cx - 1, cy - 7, 2, 14);
        } else {
          ctx.fillRect(cx - 6, cy - 6, 3, 3);
          ctx.fillRect(cx + 3, cy - 6, 3, 3);
          ctx.fillRect(cx - 6, cy + 3, 3, 3);
          ctx.fillRect(cx + 3, cy + 3, 3, 3);
        }
        ctx.fillStyle = '#09090B';
        ctx.fillRect(cx - 2, cy - 2, 4, 4);
      } else if (enemy.type === 'pulse_turret') {
        const ex = this.px(enemy.x);
        const ey = this.px(enemy.y);
        const ew = this.px(enemy.w);
        const eh = this.px(enemy.h);
        const cx = Math.round(ex + ew / 2);
        const muzzleY = ey + eh;
        const len = this.px(enemy.laserLength ?? 200);

        if (enemy.hitFlashTimer > 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(ex, ey, ew, eh);
        } else {
          ctx.fillStyle = '#18181B';
          ctx.fillRect(ex, ey, ew, eh - 1);
          ctx.fillStyle = '#E4E4E7';
          ctx.fillRect(ex + 1, ey, ew - 2, 1);
          ctx.fillStyle = '#52525B';
          ctx.fillRect(cx - 3, muzzleY - 2, 6, 3);
        }

        if (enemy.hp < enemy.maxHp) {
          for (let i = 0; i < enemy.maxHp; i++) {
            ctx.fillStyle = i < enemy.hp ? '#EF4444' : '#27272A';
            ctx.fillRect(ex + 1 + i * 4, ey - 3, 3, 2);
          }
        }

        if (enemy.state === 'windup') {
          // Solid thin targeting laser + pulsing crimson emitter ring
          const blink = Math.floor(t * 22) % 2 === 0;
          ctx.fillStyle = blink ? '#EF4444' : '#7F1D1D';
          ctx.fillRect(cx, muzzleY, 1, len);
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(cx - 3, muzzleY - 1, 6, 4);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(cx - 1, muzzleY, 2, 2);
        } else if (enemy.state === 'firing') {
          ctx.fillStyle = '#991B1B';
          ctx.fillRect(cx - 4, muzzleY, 8, len);
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(cx - 2, muzzleY, 4, len);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(cx - 1, muzzleY, 2, len);
        } else {
          ctx.fillStyle = '#71717A';
          ctx.fillRect(cx - 1, muzzleY, 2, 2);
        }
      }
    }
  }

  private drawProtagonist(ctx: CanvasRenderingContext2D, p: PlayerState, t: number): void {
    if (!p.alive) return;
    if (p.invulnTimer > 0 && Math.floor(p.invulnTimer * 18) % 2 === 0) return;

    // 1. Flowing Crimson Scarf Trail
    for (let i = p.scarfTrail.length - 1; i >= 1; i--) {
      const node = p.scarfTrail[i];
      const sz = i < 3 ? 3 : 2;
      ctx.fillStyle = i % 2 === 0 ? '#DC2626' : '#991B1B';
      ctx.fillRect(this.px(node.x) - 1, this.px(node.y) - 1, sz, sz);
    }

    // 2. Dash White/Crimson Afterimages
    if (p.dashTimer > 0) {
      const dxOff = p.dashVx !== 0 ? Math.sign(p.dashVx) * 14 : 0;
      const dyOff = p.dashVy !== 0 ? Math.sign(p.dashVy) * 14 : 0;
      ctx.fillStyle = '#F4F4F5';
      ctx.globalAlpha = 0.45;
      ctx.fillRect(this.px(p.x - dxOff), this.px(p.y - dyOff + 2), this.px(p.w), this.px(p.h - 4));
      ctx.fillStyle = '#DC2626';
      ctx.globalAlpha = 0.3;
      ctx.fillRect(this.px(p.x - dxOff * 2), this.px(p.y - dyOff * 2 + 4), this.px(p.w), this.px(p.h - 8));
      ctx.globalAlpha = 1;
    }

    const footX = this.px(p.x + p.w / 2);
    const footY = this.px(p.y + p.h);
    const walkBob = p.onGround && Math.abs(p.vx) > 20 ? Math.round(Math.abs(Math.sin(p.walkPhase))) : 0;

    const pw = Math.max(8, Math.round(this.px(p.w) * p.squashX));
    const ph = Math.max(10, Math.round(this.px(p.h) * p.squashY));
    const bx = Math.round(footX - pw / 2);
    const by = Math.round(footY - ph - walkBob);

    if (p.hitFlashTimer > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(bx, by, pw, ph);
      return;
    }

    // Obsidian Cloak Body
    ctx.fillStyle = '#09090B';
    ctx.fillRect(bx, by + 4, pw, ph - 6);
    ctx.fillStyle = '#52525B';
    ctx.fillRect(bx, by + 4, 1, ph - 6);
    ctx.fillRect(bx + pw - 1, by + 4, 1, ph - 6);

    // Crimson Scarf Collar
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(bx + 1, by + 5, pw - 2, 2);

    // Stark White Porcelain Mask
    const headW = pw - 2;
    const headX = bx + 1;
    ctx.fillStyle = '#F4F4F5';
    ctx.fillRect(headX, by, headW, 5);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(headX + 1, by, headW - 2, 2);

    // Piercing Red Visor Eye Slit
    ctx.fillStyle = '#050506';
    const eyeX = p.facing > 0 ? headX + headW - 4 : headX + 1;
    ctx.fillRect(eyeX, by + 2, 3, 2);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(p.facing > 0 ? eyeX + 1 : eyeX, by + 2, 2, 1);

    // Asche-Blaster Weapon Barrel & Muzzle Flash
    const gunY = by + 7;
    const gunX = p.facing > 0 ? bx + pw - 1 : bx - 4;
    ctx.fillStyle = '#E4E4E7';
    ctx.fillRect(gunX, gunY, 5, 2);
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(p.facing > 0 ? gunX + 3 : gunX, gunY, 2, 1);
    if (p.recoilTimer > 0.04) {
      const flashX = p.facing > 0 ? gunX + 5 : gunX - 3;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(flashX, gunY - 1, 3, 4);
    }

    // Animated Stride Boots
    const stride = p.onGround && Math.abs(p.vx) > 20 ? Math.round(Math.sin(p.walkPhase) * 1.5) : 0;
    ctx.fillStyle = '#E4E4E7';
    ctx.fillRect(bx + 2 + stride, footY - 2, 2, 2);
    ctx.fillRect(bx + pw - 4 - stride, footY - 2, 2, 2);

    // Subtle idle breathing glint
    if (Math.abs(p.vx) < 10 && Math.sin(t * 3) > 0.7) {
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(bx + Math.floor(pw / 2), by + 5, 1, 1);
    }
  }
}
