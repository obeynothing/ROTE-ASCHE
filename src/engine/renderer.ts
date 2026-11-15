import { getActivePlayer, getGateRect } from '../game/physics';
import type {
  BackdropTheme,
  BossState,
  GameEvent,
  Particle,
  PlayerState,
  ShockwaveRing,
  WorldSimulation,
} from '../game/types';
import { BackdropRenderer } from './backdropRenderer';

const MAX_PARTICLES = 360;
const MAX_SHOCKWAVES = 32;
const VIRTUAL_WORLD_H = 720;
const PIXEL_H = 360;
const WORLD_TO_PIXEL = PIXEL_H / VIRTUAL_WORLD_H; // Exact 0.5 divisor -> ultra-crisp 640x360 pixel grid

export class WorldRenderer {
  private particles: Particle[] = [];
  private particleCursor = 0;
  private shockwaves: ShockwaveRing[] = [];
  private shockwaveCursor = 0;
  private pixelBuffer: HTMLCanvasElement;
  private pctx: CanvasRenderingContext2D;
  private backdrop = new BackdropRenderer();
  private stepDustAccum = 0;

  constructor() {
    this.pixelBuffer = document.createElement('canvas');
    this.pixelBuffer.width = 640;
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

    for (let i = 0; i < MAX_SHOCKWAVES; i++) {
      this.shockwaves.push({
        active: false,
        x: 0,
        y: 0,
        radius: 2,
        maxRadius: 32,
        life: 0,
        maxLife: 0.3,
        color: '#EF4444',
      });
    }
  }

  private emitShockwave(x: number, y: number, maxRadius: number, maxLife: number, color: string): void {
    const sw = this.shockwaves[this.shockwaveCursor];
    this.shockwaveCursor = (this.shockwaveCursor + 1) % MAX_SHOCKWAVES;
    sw.active = true;
    sw.x = x;
    sw.y = y;
    sw.radius = 4;
    sw.maxRadius = maxRadius;
    sw.maxLife = maxLife;
    sw.life = maxLife;
    sw.color = color;
  }

  private emitParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    maxLife: number,
    size: number,
    color: string,
    gravity: number,
  ): void {
    const p = this.particles[this.particleCursor];
    this.particleCursor = (this.particleCursor + 1) % MAX_PARTICLES;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.maxLife = maxLife;
    p.life = maxLife;
    p.size = size;
    p.color = color;
    p.gravity = gravity;
  }

  public spawnParticlesFromEvents(events: GameEvent[]): void {
    for (const ev of events) {
      let count = 6;
      let speed = 135;
      let gravity = 400;
      let color = ev.color ?? '#DC2626';

      if (ev.type === 'hurt' || ev.type === 'enemy_kill' || ev.type === 'buddy_loss') {
        count = ev.type === 'buddy_loss' ? 38 : 32;
        speed = 310;
        gravity = 560;
        color = '#DC2626';
        this.emitShockwave(ev.x, ev.y, ev.type === 'hurt' || ev.type === 'buddy_loss' ? 68 : 48, 0.32, '#EF4444');
      } else if (ev.type === 'explosion' || ev.type === 'boss_slam' || ev.type === 'boss_defeat') {
        count = ev.type === 'boss_defeat' ? 58 : 36;
        speed = ev.type === 'boss_defeat' ? 430 : 325;
        gravity = 420;
        color = '#EF4444';
        this.emitShockwave(ev.x, ev.y, ev.type === 'boss_defeat' ? 145 : 90, 0.42, '#FFFFFF');
        this.emitShockwave(ev.x, ev.y, ev.type === 'boss_defeat' ? 110 : 66, 0.32, '#EF4444');
      } else if (ev.type === 'boss_roar') {
        count = 26;
        speed = 270;
        gravity = 80;
        color = '#DC2626';
        this.emitShockwave(ev.x, ev.y, 128, 0.48, '#DC2626');
      } else if (ev.type === 'boss_hit') {
        count = 12;
        speed = 215;
        gravity = 380;
        color = '#EF4444';
      } else if (ev.type === 'ram_kill') {
        count = 32;
        speed = 320;
        gravity = 480;
        color = '#FFFFFF';
        this.emitShockwave(ev.x, ev.y, 60, 0.28, '#FFFFFF');
      } else if (ev.type === 'buddy_rescue') {
        count = 30;
        speed = 235;
        gravity = 110;
        color = '#FFFFFF';
        this.emitShockwave(ev.x, ev.y, 70, 0.36, '#EF4444');
      } else if (ev.type === 'stage_clear') {
        count = 36;
        speed = 265;
        gravity = 160;
        color = '#F4F4F5';
        this.emitShockwave(ev.x, ev.y, 94, 0.45, '#FFFFFF');
      } else if (ev.type === 'crystal') {
        count = 18;
        speed = 180;
        gravity = 80;
        color = '#EF4444';
        this.emitShockwave(ev.x, ev.y, 32, 0.24, '#EF4444');
      } else if (ev.type === 'dash') {
        count = 15;
        speed = 170;
        gravity = 30;
        color = ev.color ?? '#F4F4F5';
        this.emitShockwave(ev.x, ev.y, 36, 0.2, ev.color ?? '#FFFFFF');
      } else if (ev.type === 'double_jump') {
        count = 14;
        speed = 150;
        gravity = 60;
        color = ev.color ?? '#EF4444';
        this.emitShockwave(ev.x, ev.y, 32, 0.22, ev.color ?? '#EF4444');
      } else if (ev.type === 'switch_char' || ev.type === 'summon' || ev.type === 'weapon_switch') {
        count = ev.type === 'weapon_switch' ? 12 : 20;
        speed = 185;
        gravity = 40;
        color = ev.color ?? '#EF4444';
        this.emitShockwave(ev.x, ev.y, ev.type === 'weapon_switch' ? 30 : 44, 0.24, color);
      } else if (ev.type === 'checkpoint' || ev.type === 'upgrade') {
        count = 26;
        speed = 225;
        gravity = 120;
        color = '#FFFFFF';
        this.emitShockwave(ev.x, ev.y, 68, 0.36, '#EF4444');
      } else if (
        ev.type === 'shoot' ||
        ev.type === 'shoot_shotgun' ||
        ev.type === 'shoot_harpoon' ||
        ev.type === 'shoot_mortar'
      ) {
        count = ev.type === 'shoot_shotgun' ? 11 : 7;
        speed = 160;
        gravity = 40;
        color = ev.type === 'shoot_harpoon' ? '#EF4444' : '#FFFFFF';
      } else if (ev.type === 'ricochet' || ev.type === 'enemy_hit' || ev.type === 'enemy_telegraph') {
        count = 9;
        speed = 180;
        gravity = 260;
        color = ev.type === 'ricochet' ? '#FFFFFF' : '#EF4444';
      } else if (ev.type === 'bounce') {
        count = 14;
        speed = 210;
        gravity = 320;
        color = '#DC2626';
        this.emitShockwave(ev.x, ev.y, 34, 0.22, '#DC2626');
      } else if (ev.type === 'land') {
        count = 8;
        speed = 115;
        gravity = 220;
        color = '#A1A1AA';
      }

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const mag = speed * (0.35 + Math.random() * 0.65);
        this.emitParticle(
          ev.x + (Math.random() - 0.5) * 8,
          ev.y + (Math.random() - 0.5) * 8,
          Math.cos(angle) * mag,
          Math.sin(angle) * mag - 35,
          0.22 + Math.random() * 0.36,
          i % 3 === 0 ? 4 : 3,
          i % 3 === 0 &&
            (ev.type === 'hurt' ||
              ev.type === 'enemy_kill' ||
              ev.type === 'explosion' ||
              ev.type === 'boss_defeat')
            ? '#F4F4F5'
            : color,
          gravity,
        );
      }
    }
  }

  public updateAmbientPlayerEffects(sim: WorldSimulation, dt: number): void {
    const active = getActivePlayer(sim);
    if (!active.alive) return;

    if (active.onGround && Math.abs(active.vx) > 150) {
      this.stepDustAccum += dt;
      if (this.stepDustAccum >= 0.08) {
        this.stepDustAccum = 0;
        this.emitParticle(
          active.x + active.w / 2 - active.facing * 6,
          active.y + active.h - 2,
          -active.facing * (35 + Math.random() * 45),
          -(20 + Math.random() * 35),
          0.24,
          2,
          active.id === 'asche' ? '#71717A' : '#D4D4D8',
          140,
        );
      }
    } else {
      this.stepDustAccum = 0;
    }

    if (active.onWall !== 0 && !active.onGround && active.vy > 25 && Math.random() < 0.45) {
      const wallX = active.onWall > 0 ? active.x + active.w : active.x;
      this.emitParticle(
        wallX,
        active.y + 8 + Math.random() * 20,
        -active.onWall * (30 + Math.random() * 55),
        -(20 + Math.random() * 45),
        0.18,
        2,
        Math.random() > 0.35 ? '#EF4444' : '#FFFFFF',
        260,
      );
    }

    if (active.gliding && Math.random() < 0.55) {
      this.emitParticle(
        active.x + Math.random() * active.w,
        active.y + 8,
        -active.facing * (45 + Math.random() * 40),
        -75 - Math.random() * 35,
        0.22,
        2,
        Math.random() > 0.4 ? '#F4F4F5' : '#DC2626',
        -40,
      );
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

    for (let i = 0; i < MAX_SHOCKWAVES; i++) {
      const sw = this.shockwaves[i];
      if (!sw.active) continue;
      sw.life -= dt;
      if (sw.life <= 0) {
        sw.active = false;
        continue;
      }
      const prog = 1 - sw.life / sw.maxLife;
      sw.radius = 4 + (sw.maxRadius - 4) * prog;
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
    options: { isTitleBackdrop: boolean; freezeCamera?: boolean; timeSeconds: number },
  ): void {
    const aspect = canvasWidth / Math.max(1, canvasHeight);
    const pixelW = Math.max(420, Math.round(PIXEL_H * aspect));
    if (this.pixelBuffer.width !== pixelW) {
      this.pixelBuffer.width = pixelW;
      this.pctx.imageSmoothingEnabled = false;
    }

    const viewWorldW = VIRTUAL_WORLD_H * aspect;

    if (options.isTitleBackdrop) {
      sim.cameraX = 0;
    } else if (!options.freezeCamera) {
      const active = getActivePlayer(sim);
      const focusX = active.x + active.w / 2;
      const targetCamX = Math.max(0, Math.min(sim.level.width - viewWorldW, focusX - viewWorldW * 0.4));
      sim.cameraX += (targetCamX - sim.cameraX) * 0.16;
    }

    const shakeMag = options.freezeCamera ? 0 : sim.trauma * sim.trauma * 6.5;
    const shakePxX = shakeMag > 0.1 ? Math.round((Math.random() * 2 - 1) * shakeMag) : 0;
    const shakePxY = shakeMag > 0.1 ? Math.round((Math.random() * 2 - 1) * shakeMag) : 0;

    const ctx = this.pctx;
    const camPxX = Math.round(sim.cameraX * WORLD_TO_PIXEL);

    // 1. Multi-Plane Parallax Biome Backdrop
    this.backdrop.drawBackdrop(
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

    // 2. Insulated Power Conduits connecting switches to blast gates
    this.drawPowerPipes(ctx, sim, options.timeSeconds);

    // 3. Moving Platform Guide Rails & End Bumpers
    for (const mp of sim.movingPlatforms) {
      const range = mp.moveRange ?? 120;
      const rx = this.px(mp.originX);
      const ry = this.px(mp.originY + mp.h / 2);
      ctx.fillStyle = '#050506';
      if (mp.moveAxis === 'x') {
        const trackW = this.px(range + mp.w) - 8;
        ctx.fillRect(rx + 4, ry - 1, trackW, 4);
        ctx.fillStyle = '#3F3F46';
        ctx.fillRect(rx + 4, ry, trackW, 2);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(rx + 4, ry - 2, 3, 6);
        ctx.fillRect(rx + 4 + trackW - 3, ry - 2, 3, 6);
      } else {
        const topY = this.px(mp.originY - range + mp.h / 2);
        const cx = this.px(mp.originX + mp.w / 2);
        ctx.fillRect(cx - 2, topY, 4, ry - topY);
        ctx.fillStyle = '#3F3F46';
        ctx.fillRect(cx - 1, topY, 2, ry - topY);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(cx - 3, topY, 6, 3);
        ctx.fillRect(cx - 3, ry - 2, 6, 3);
      }
    }

    // 4. Platforms, Catwalks & Full-Height Bulkheads
    for (const plat of sim.level.platforms) {
      if (plat.kind === 'moving') continue;
      this.drawBrickPlatform(
        ctx,
        plat.x,
        plat.y,
        plat.w,
        plat.h,
        plat.kind,
        plat.accent ?? 'none',
        options.timeSeconds,
      );
    }
    for (const mp of sim.movingPlatforms) {
      this.drawBrickPlatform(ctx, mp.x, mp.y, mp.w, mp.h, 'moving', mp.accent ?? 'crimson', options.timeSeconds);
    }

    // 4b. Persistent Blood / Ichor Decals
    for (const dec of sim.bloodDecals) {
      const dx = this.px(dec.x);
      const dy = this.px(dec.y);
      const dw = Math.max(4, this.px(dec.w));
      ctx.fillStyle = dec.color;
      ctx.fillRect(dx, dy, dw, 2);
      ctx.fillRect(dx + 1, dy + 2, Math.max(2, dw - 4), 2);
      ctx.fillStyle = '#450A0A';
      ctx.fillRect(dx + Math.floor(dw / 2), dy + 4, 2, 2);
    }

    // 5. Checkpoints (Industrial Beacon Obelisks)
    for (const cp of sim.level.checkpoints) {
      const activated = sim.activatedCheckpoints.has(cp.id);
      const cx = this.px(cp.x);
      const cy = this.px(cp.y);

      ctx.fillStyle = '#050506';
      ctx.fillRect(cx - 7, cy - 30, 14, 30);
      ctx.fillStyle = '#18181F';
      ctx.fillRect(cx - 6, cy - 29, 12, 28);
      ctx.fillStyle = activated ? '#F4F4F5' : '#52525B';
      ctx.fillRect(cx - 6, cy - 29, 2, 28);
      ctx.fillRect(cx + 4, cy - 29, 2, 28);
      ctx.fillRect(cx - 8, cy - 3, 16, 3);
      ctx.fillRect(cx - 4, cy - 32, 8, 2);

      // Holographic diamond core
      const bob = activated ? Math.round(Math.sin(options.timeSeconds * 5) * 2) : 0;
      const coreY = cy - 21 + bob;
      ctx.fillStyle = activated ? '#EF4444' : '#7F1D1D';
      ctx.fillRect(cx - 3, coreY - 2, 6, 6);
      ctx.fillRect(cx - 1, coreY - 4, 2, 10);
      if (activated) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cx - 1, coreY, 2, 2);
      }
    }

    // 5b. Cryo Buddy Rescue Pods (Visible miniature captive comrade inside glass cylinder!)
    for (const pod of sim.level.buddyPods) {
      if (sim.collectedBuddyPods.has(pod.id)) continue;
      const px = this.px(pod.x);
      const py = this.px(pod.y);
      const bob = Math.round(Math.sin(options.timeSeconds * 3.5 + pod.x * 0.02) * 1.5);
      const baseY = py - 20 + bob;

      // Pedestal + glass capsule
      ctx.fillStyle = '#050506';
      ctx.fillRect(px - 8, baseY, 16, 20);
      ctx.fillStyle = '#27272A';
      ctx.fillRect(px - 7, baseY, 14, 3);
      ctx.fillRect(px - 8, baseY + 17, 16, 3);
      ctx.fillStyle = '#1C0508';
      ctx.fillRect(px - 6, baseY + 3, 12, 14);
      // Side steel pillars + glass reflection
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(px - 7, baseY + 1, 1, 17);
      ctx.fillRect(px + 6, baseY + 1, 1, 17);
      ctx.fillStyle = 'rgba(244, 244, 245, 0.35)';
      ctx.fillRect(px - 4, baseY + 4, 1, 11);

      // Miniature comrade silhouette inside pod
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(px - 2, baseY + 8, 5, 7);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(px - 2, baseY + 5, 5, 3);
      ctx.fillStyle = Math.sin(options.timeSeconds * 8) > 0 ? '#FFFFFF' : '#EF4444';
      ctx.fillRect(px - 1, baseY + 6, 3, 1);
      // Status indicator dot on cap
      ctx.fillStyle = Math.sin(options.timeSeconds * 6) > 0 ? '#EF4444' : '#7F1D1D';
      ctx.fillRect(px - 1, baseY + 1, 3, 1);
    }

    // 6. Armored Airlock Blast Gates
    for (let gi = 0; gi < sim.gates.length; gi++) {
      const gate = sim.gates[gi];
      const r = getGateRect(gate);
      const gx = this.px(r.x);
      const gy = this.px(r.y);
      const gw = Math.max(10, this.px(r.w));
      const gh = Math.max(6, this.px(r.h));

      // Recessed gate frame
      ctx.fillStyle = '#050506';
      ctx.fillRect(gx, gy, gw, gh);
      ctx.fillStyle = '#18181F';
      ctx.fillRect(gx + 2, gy + 1, gw - 4, gh - 2);

      // Hydraulic center seam + chevron lock plates
      ctx.fillStyle = '#09090D';
      ctx.fillRect(gx + Math.floor(gw / 2) - 1, gy + 2, 2, gh - 4);
      ctx.fillStyle = '#DC2626';
      for (let sy = gy + 5; sy < gy + gh - 5; sy += 8) {
        ctx.fillRect(gx + 3, sy, gw - 6, 3);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(gx + 4, sy + 1, 2, 1);
        ctx.fillRect(gx + gw - 6, sy + 1, 2, 1);
        ctx.fillStyle = '#DC2626';
      }
      // Crisp bright steel door edges
      ctx.fillStyle = '#E4E4E7';
      ctx.fillRect(gx, gy, 2, gh);
      ctx.fillRect(gx + gw - 2, gy, 2, gh);
      ctx.fillStyle = '#52525B';
      ctx.fillRect(gx + 1, gy, 1, gh);
      ctx.fillRect(gx + gw - 2, gy, 1, gh);

      // Gate linkage indicator lights at door header
      for (let p = 0; p <= gi; p++) {
        ctx.fillStyle = gate.openProgress > 0.35 ? '#FFFFFF' : '#EF4444';
        ctx.fillRect(gx + 2 + p * 4, gy - 4, 3, 3);
      }
    }

    // 7. Floor-Bolted Laser Pressure Switches
    for (const sw of sim.switches) {
      const sx = this.px(sw.x);
      const sy = this.px(sw.y);
      const swW = Math.max(16, this.px(sw.w));
      const swH = Math.max(7, this.px(sw.h));
      const sink = sw.pressed ? 3 : 0;
      const gateIndex = Math.max(0, sim.gates.findIndex((g) => g.id === sw.targetGateId));

      // Heavy bolted pedestal
      ctx.fillStyle = '#050506';
      ctx.fillRect(sx - 2, sy + swH - 4, swW + 4, 4);
      ctx.fillStyle = '#3F3F46';
      ctx.fillRect(sx - 1, sy + swH - 3, swW + 2, 3);

      // Vertical holo signal beam so switches read clearly mid-run
      if (!sw.pressed) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
        ctx.fillRect(sx + 3, sy - 10, swW - 6, 10);
      }

      // Active trigger plate
      ctx.fillStyle = sw.pressed ? '#F4F4F5' : '#DC2626';
      ctx.fillRect(sx + 1, sy + sink, swW - 2, swH - 3 - sink);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 3, sy + sink, swW - 6, 1);

      for (let p = 0; p <= gateIndex; p++) {
        ctx.fillStyle = sw.pressed ? '#FFFFFF' : '#EF4444';
        ctx.fillRect(sx + 3 + p * 4, sy + swH - 1, 3, 2);
      }

      if (sw.mode === 'timed' && sw.pressed && sw.duration) {
        const ratio = Math.max(0, sw.timer / sw.duration);
        ctx.fillStyle = '#050506';
        ctx.fillRect(sx - 1, sy - 7, swW + 2, 4);
        ctx.fillStyle = '#18181F';
        ctx.fillRect(sx, sy - 6, swW, 2);
        ctx.fillStyle = ratio < 0.28 && Math.floor(options.timeSeconds * 16) % 2 === 0 ? '#FFFFFF' : '#EF4444';
        ctx.fillRect(sx, sy - 6, Math.round(swW * ratio), 2);
      }
    }

    // 8. Hydraulic Bounce Pads
    for (const bp of sim.level.bouncePads) {
      const bx = this.px(bp.x);
      const by = this.px(bp.y);
      const bw = this.px(bp.w);
      const bh = Math.max(6, this.px(bp.h));
      const pulse = Math.floor(options.timeSeconds * 6) % 2 === 0;

      ctx.fillStyle = '#050506';
      ctx.fillRect(bx - 1, by, bw + 2, bh);
      ctx.fillStyle = '#27272A';
      ctx.fillRect(bx + 2, by + 3, 4, bh - 3);
      ctx.fillRect(bx + bw - 6, by + 3, 4, bh - 3);
      ctx.fillStyle = '#52525B';
      ctx.fillRect(bx + Math.floor(bw / 2) - 4, by + 3, 8, bh - 3);
      ctx.fillStyle = pulse ? '#EF4444' : '#DC2626';
      ctx.fillRect(bx, by, bw, 3);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(bx + 4, by, bw - 8, 1);

      // Subtle rising chevron cue above pad
      const chevY = by - 5 - (Math.floor(options.timeSeconds * 8) % 3);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.fillRect(bx + Math.floor(bw / 2) - 3, chevY + 1, 6, 1);
      ctx.fillRect(bx + Math.floor(bw / 2) - 1, chevY, 2, 1);
    }

    // 9. Exit Monolith Portal
    this.drawGoalMonolith(ctx, sim, options.timeSeconds);

    // 10. Faceted Blood Shards with crisp crimson glow halo
    for (const crystal of sim.level.crystals) {
      if (sim.collectedCrystals.has(crystal.id)) continue;
      const bob = Math.round(Math.sin(options.timeSeconds * 4.2 + crystal.x * 0.03) * 2.5);
      const cx = this.px(crystal.x);
      const cy = this.px(crystal.y) + bob;

      // Subtle red halo
      ctx.fillStyle = 'rgba(220, 38, 38, 0.16)';
      ctx.fillRect(cx - 7, cy - 7, 14, 14);

      // Dark 1px diamond crystal border
      ctx.fillStyle = '#050506';
      ctx.fillRect(cx - 5, cy - 3, 10, 6);
      ctx.fillRect(cx - 3, cy - 7, 6, 14);
      ctx.fillRect(cx - 1, cy - 9, 2, 18);
      // Outer deep red bevel
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(cx - 4, cy - 2, 8, 4);
      ctx.fillRect(cx - 2, cy - 6, 4, 12);
      // Inner bright crimson facet
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(cx - 3, cy - 2, 6, 4);
      ctx.fillRect(cx - 1, cy - 5, 2, 10);
      // Specular white highlight
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx - 1, cy - 3, 2, 3);
      ctx.fillRect(cx - 2, cy - 1, 1, 2);
    }

    // 11. Omega-Kolos Endboss (Sektor 14)
    if (sim.boss) {
      this.drawBoss(ctx, sim.boss, options.timeSeconds);
    }

    // 12. 7 Detailed Enemy Archetypes & Telegraphs
    this.drawEnemies(ctx, sim, options.timeSeconds);

    // 13. Enemy Projectiles
    for (const ep of sim.enemyProjectiles) {
      if (!ep.active) continue;
      const ex = this.px(ep.x);
      const ey = this.px(ep.y);
      if (ep.kind === 'bio_orb') {
        ctx.fillStyle = '#050506';
        ctx.fillRect(ex - 5, ey - 5, 10, 10);
        ctx.fillStyle = '#7F1D1D';
        ctx.fillRect(ex - 4, ey - 4, 8, 8);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(ex - 3, ey - 3, 6, 6);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(ex - 1, ey - 1, 3, 3);
      } else {
        ctx.fillStyle = '#050506';
        ctx.fillRect(ex - 6, ey - 2, 12, 5);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(ex - 5, ey - 1, 10, 3);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(ex - 3, ey, 6, 1);
      }
    }

    // 14. Player Weapon Projectiles
    for (const proj of sim.projectiles) {
      if (!proj.active) continue;
      const px = this.px(proj.x);
      const py = this.px(proj.y);

      if (proj.weapon === 'harpoon' && proj.trail && proj.trail.length > 1) {
        const start = proj.trail[0];
        const sx = this.px(start.x);
        const sy = this.px(start.y);
        ctx.strokeStyle = '#7F1D1D';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(px, py);
        ctx.stroke();

        ctx.fillStyle = '#050506';
        ctx.fillRect(px - 6, py - 3, 12, 6);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 5, py - 1, 10, 2);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(px - 3, py - 2, 5, 4);
      } else if (proj.weapon === 'mortar') {
        ctx.fillStyle = '#050506';
        ctx.fillRect(px - 6, py - 6, 12, 12);
        ctx.fillStyle = '#7F1D1D';
        ctx.fillRect(px - 5, py - 5, 10, 10);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(px - 4, py - 4, 8, 8);
        ctx.fillStyle = Math.floor(options.timeSeconds * 18) % 2 === 0 ? '#FFFFFF' : '#DC2626';
        ctx.fillRect(px - 2, py - 2, 4, 4);
      } else if (proj.weapon === 'shotgun') {
        ctx.fillStyle = '#050506';
        ctx.fillRect(px - 4, py - 3, 8, 6);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(px - 3, py - 2, 6, 4);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py - 1, 3, 2);
      } else {
        const horiz = Math.abs(proj.vx) >= Math.abs(proj.vy);
        const heavy = proj.heavy || proj.damage > 1 || proj.pierce > 0;
        const len = heavy ? 12 : 8;
        const thk = proj.heavy || proj.damage > 1 ? 5 : 4;
        ctx.fillStyle = '#050506';
        if (horiz) {
          ctx.fillRect(px - Math.floor(len / 2) - 1, py - Math.floor(thk / 2) - 1, len + 2, thk + 2);
          ctx.fillStyle = proj.heavy ? '#FFFFFF' : heavy ? '#EF4444' : '#DC2626';
          ctx.fillRect(px - Math.floor(len / 2), py - Math.floor(thk / 2), len, thk);
          ctx.fillStyle = proj.heavy ? '#EF4444' : '#FFFFFF';
          ctx.fillRect(px - 3, py - 1, heavy ? 7 : 5, 2);
        } else {
          ctx.fillRect(px - Math.floor(thk / 2) - 1, py - Math.floor(len / 2) - 1, thk + 2, len + 2);
          ctx.fillStyle = proj.heavy ? '#FFFFFF' : heavy ? '#EF4444' : '#DC2626';
          ctx.fillRect(px - Math.floor(thk / 2), py - Math.floor(len / 2), thk, len);
          ctx.fillStyle = proj.heavy ? '#EF4444' : '#FFFFFF';
          ctx.fillRect(px - 1, py - 3, 2, heavy ? 7 : 5);
        }
      }
    }

    // 15. Both Squad Protagonists (ASCHE & KRON)
    const inactiveIdx: 0 | 1 = sim.activeCharIndex === 0 ? 1 : 0;
    this.drawProtagonist(ctx, sim.players[inactiveIdx], false, options.timeSeconds, sim.weaponLevel, sim.activeWeapon);
    this.drawProtagonist(ctx, sim.players[sim.activeCharIndex], true, options.timeSeconds, sim.weaponLevel, sim.activeWeapon);

    // 16. Expanding Shockwave Rings
    for (let i = 0; i < MAX_SHOCKWAVES; i++) {
      const sw = this.shockwaves[i];
      if (!sw.active) continue;
      const alpha = Math.max(0, sw.life / sw.maxLife);
      ctx.globalAlpha = alpha * 0.88;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.px(sw.x), this.px(sw.y), Math.max(3, Math.round(sw.radius * WORLD_TO_PIXEL)), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 17. Pooled Pixel Particles
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha > 0.5 ? 1 : 0.58;
      ctx.fillStyle = p.color;
      const sz = Math.max(1, Math.round(p.size * WORLD_TO_PIXEL * 1.45));
      ctx.fillRect(this.px(p.x), this.px(p.y), sz, sz);
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // 18. Biome Foreground Weather / Bio-Spores
    this.drawForegroundWeather(ctx, pixelW, PIXEL_H, camPxX, options.timeSeconds, sim.level.theme);

    // 19. Subtle Vignette & Scanline Film Grain
    this.drawAtmosphericPostFX(ctx, pixelW, PIXEL_H);

    targetCtx.imageSmoothingEnabled = false;
    targetCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    targetCtx.drawImage(this.pixelBuffer, 0, 0, canvasWidth, canvasHeight);
  }

  private drawAtmosphericPostFX(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.13)';
    for (let y = 0; y < h; y += 2) {
      ctx.fillRect(0, y, w, 1);
    }
    ctx.fillStyle = 'rgba(3, 3, 4, 0.44)';
    ctx.fillRect(0, 0, w, 7);
    ctx.fillRect(0, h - 7, w, 7);
    ctx.fillStyle = 'rgba(3, 3, 4, 0.22)';
    ctx.fillRect(0, 7, w, 7);
    ctx.fillRect(0, h - 14, w, 7);
  }

  private drawForegroundWeather(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camPxX: number,
    t: number,
    theme: BackdropTheme,
  ): void {
    const count = theme === 'omega_sanctum' || theme === 'bioreactor_abyss' ? 48 : 32;
    for (let i = 0; i < count; i++) {
      const speedX = theme === 'toxic_sewer' ? 32 + (i % 5) * 8 : 22 + (i % 5) * 7;
      const upFlow = theme === 'flesh_foundry' || theme === 'omega_sanctum' || theme === 'bioreactor_abyss';
      const speedY = upFlow ? -(22 + (i % 4) * 9) : 18 + (i % 4) * 7;
      const ax = (((i * 89 - t * speedX - camPxX * 0.48) % w) + w) % w;
      const ay = (((i * 53 + t * speedY) % h) + h) % h;
      ctx.fillStyle = i % 3 === 0 ? '#EF4444' : i % 4 === 0 ? '#F4F4F5' : '#52525B';
      const lenY = theme === 'toxic_sewer' && i % 4 === 0 ? 4 : 1;
      const sz = i % 7 === 0 ? 2 : 1;
      ctx.fillRect(Math.round(ax), Math.round(ay), sz, Math.max(sz, lenY));
    }
  }

  private drawPowerPipes(ctx: CanvasRenderingContext2D, sim: WorldSimulation, t: number): void {
    for (const sw of sim.switches) {
      const gate = sim.gates.find((g) => g.id === sw.targetGateId);
      if (!gate) continue;
      const x1 = this.px(sw.x + sw.w / 2);
      const y1 = this.px(sw.y + sw.h);
      const x2 = this.px(gate.x + gate.w / 2);
      const y2 = this.px(gate.y + gate.h);
      const elbowY = Math.max(y1, y2) + 10;

      // Dark outer casing + inner copper/steel conduit
      ctx.fillStyle = '#050506';
      ctx.fillRect(x1 - 2, y1, 5, Math.max(3, elbowY - y1));
      const minX = Math.min(x1, x2);
      ctx.fillRect(minX, elbowY - 1, Math.abs(x2 - x1) + 4, 5);
      ctx.fillRect(x2 - 2, y2, 5, Math.max(3, elbowY - y2 + 2));

      ctx.fillStyle = sw.pressed ? '#71717A' : '#1E1E26';
      ctx.fillRect(x1 - 1, y1, 3, Math.max(2, elbowY - y1));
      ctx.fillRect(minX, elbowY, Math.abs(x2 - x1) + 2, 3);
      ctx.fillRect(x2 - 1, y2, 3, Math.max(2, elbowY - y2 + 2));

      // Corner junction clamps
      ctx.fillStyle = '#3F3F46';
      ctx.fillRect(x1 - 3, elbowY - 2, 7, 7);
      ctx.fillRect(x2 - 3, elbowY - 2, 7, 7);
      ctx.fillStyle = sw.pressed ? '#EF4444' : '#7F1D1D';
      ctx.fillRect(x1 - 1, elbowY, 3, 3);
      ctx.fillRect(x2 - 1, elbowY, 3, 3);

      if (sw.pressed) {
        const prog = (t * 1.1) % 1;
        const pulseX = Math.round(x1 + (x2 - x1) * prog);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(pulseX - 2, elbowY - 1, 5, 5);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(pulseX - 1, elbowY, 3, 3);
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
    t: number,
  ): void {
    const px = this.px(x);
    const py = this.px(y);
    const pw = Math.max(6, this.px(w));
    const ph = Math.max(6, this.px(h));

    if (kind === 'oneway') {
      // Industrial suspended catwalk grating with cross-trusses
      ctx.fillStyle = '#050506';
      ctx.fillRect(px, py - 1, pw, ph + 3);
      ctx.fillStyle = '#18181F';
      ctx.fillRect(px + 1, py + 2, pw - 2, ph - 1);
      ctx.fillStyle = accent === 'crimson' ? '#DC2626' : '#F4F4F5';
      ctx.fillRect(px + 1, py, pw - 2, 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(px + 2, py, Math.max(2, pw - 4), 1);

      // Diagonal grate slots & support brackets beneath
      ctx.fillStyle = '#3F3F46';
      for (let gx = px + 6; gx < px + pw - 6; gx += 10) {
        ctx.fillRect(gx, py + 3, 4, 2);
        ctx.fillRect(gx + 1, py + ph, 3, 5);
        ctx.fillStyle = '#27272A';
        ctx.fillRect(gx + 4, py + ph + 1, 2, 3);
        ctx.fillStyle = '#3F3F46';
      }
      return;
    }

    // 1px dark silhouette frame + deep obsidian steel base
    ctx.fillStyle = '#050506';
    ctx.fillRect(px - 1, py - 1, pw + 2, ph + 2);
    ctx.fillStyle = '#0B0B10';
    ctx.fillRect(px, py, pw, ph);

    const isVerticalBulkhead = pw <= 22 && ph >= 48;

    if (isVerticalBulkhead) {
      // Heavy full-height steel containment bulkhead column with rebar & warning stripes
      ctx.fillStyle = '#121218';
      ctx.fillRect(px + 2, py + 2, pw - 4, ph - 4);
      ctx.fillStyle = '#27272A';
      ctx.fillRect(px + 4, py, 2, ph);
      ctx.fillRect(px + pw - 6, py, 2, ph);
      for (let row = py + 12; row < py + ph - 6; row += 18) {
        ctx.fillStyle = '#050506';
        ctx.fillRect(px + 1, row, pw - 2, 2);
        ctx.fillStyle = '#3F3F46';
        ctx.fillRect(px + 2, row + 2, pw - 4, 1);
        ctx.fillStyle = row % 36 === 0 ? '#7F1D1D' : '#E4E4E7';
        ctx.fillRect(px + Math.floor(pw / 2) - 2, row - 6, 4, 2);
      }
      // Armored bulkhead side rims
      ctx.fillStyle = '#3F3F46';
      ctx.fillRect(px, py, 2, ph);
      ctx.fillRect(px + pw - 2, py, 2, ph);
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(px, py, 1, ph);
      return;
    }

    // Precision 16x10 staggered industrial masonry blocks + subtle bevels
    for (let row = py + 10; row < py + ph; row += 10) {
      ctx.fillStyle = '#050507';
      ctx.fillRect(px, row, pw, 1);
      const offset = ((row - py) / 10) % 2 === 0 ? 0 : 10;
      for (let col = px + offset; col < px + pw; col += 20) {
        ctx.fillStyle = '#050507';
        ctx.fillRect(col, row - 10, 1, 10);
        // Inner stone/steel plate sheen
        if (col + 8 < px + pw) {
          ctx.fillStyle = (col + row) % 40 === 0 ? '#16161F' : '#111118';
          ctx.fillRect(col + 2, row - 8, 12, 5);
          ctx.fillStyle = '#22222C';
          ctx.fillRect(col + 2, row - 9, 10, 1);
        }
      }
    }

    // Beveled Top Deck Armor Plate
    const isCrimsonTrim = kind === 'moving' || accent === 'crimson' || accent === 'bio';
    ctx.fillStyle = isCrimsonTrim ? '#DC2626' : '#E4E4E7';
    ctx.fillRect(px, py, pw, 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(px + 1, py, Math.max(2, pw - 2), 1);
    ctx.fillStyle = '#27272A';
    ctx.fillRect(px, py + 3, pw, 2);

    if (kind === 'moving') {
      // Hazard chevrons + magnetic thruster glow beneath sled
      ctx.fillStyle = '#050506';
      for (let cx = px + 5; cx < px + pw - 5; cx += 10) {
        ctx.fillRect(cx, py + 1, 4, 2);
      }
      if (Math.floor(t * 20) % 2 === 0) {
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(px + 6, py + ph, 6, 2);
        ctx.fillRect(px + pw - 12, py + ph, 6, 2);
      }
    }

    // Corner Gussets & Rivet Bolts
    ctx.fillStyle = '#52525B';
    ctx.fillRect(px, py + 3, 4, 5);
    ctx.fillRect(px + pw - 4, py + 3, 4, 5);
    ctx.fillStyle = '#F4F4F5';
    for (let rx = px + 8; rx < px + pw - 8; rx += 24) {
      ctx.fillRect(rx, py + 6, 2, 2);
    }

    // Organic Carrion creeping biomass tendrils on 'bio' platforms
    if (accent === 'bio') {
      for (let bx = px + 10; bx < px + pw - 12; bx += 26) {
        const drip = 5 + ((bx * 7) % 8) + Math.round(Math.sin(t * 2.6 + bx * 0.1) * 1.5);
        ctx.fillStyle = '#450A0A';
        ctx.fillRect(bx - 2, py + 3, 10, 4);
        ctx.fillStyle = '#991B1B';
        ctx.fillRect(bx, py + 4, 6, 4);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(bx + 2, py + 4, 2, drip);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(bx + 2, py + 4 + drip - 2, 2, 2);
      }
    }

    ctx.fillStyle = '#27272A';
    ctx.fillRect(px, py + 3, 1, Math.max(0, ph - 3));
    ctx.fillRect(px + pw - 1, py + 3, 1, Math.max(0, ph - 3));

    if (ph <= 30 && pw >= 44) {
      ctx.fillStyle = '#18181F';
      ctx.fillRect(px + 8, py + ph, 3, 8);
      ctx.fillRect(px + pw - 11, py + ph, 3, 6);
    }
  }

  private drawGoalMonolith(ctx: CanvasRenderingContext2D, sim: WorldSimulation, t: number): void {
    const g = sim.level.goal;
    const gx = this.px(g.x);
    const gy = this.px(g.y);
    const gw = this.px(g.w);
    const gh = this.px(g.h);
    const cx = Math.round(gx + gw / 2);
    const bossLocked = Boolean(sim.boss && !sim.boss.defeated);

    // Stepped stone altar plinth
    ctx.fillStyle = '#050506';
    ctx.fillRect(gx - 4, gy + gh - 5, gw + 8, 5);
    ctx.fillStyle = '#3F3F46';
    ctx.fillRect(gx - 3, gy + gh - 4, gw + 6, 3);

    // Outer Obsidian Arch Frame & Steel Flutes
    ctx.fillStyle = '#050506';
    ctx.fillRect(gx - 1, gy - 2, gw + 2, gh);
    ctx.fillStyle = '#18181F';
    ctx.fillRect(gx + 1, gy, gw - 2, gh - 4);
    ctx.fillStyle = '#F4F4F5';
    ctx.fillRect(gx, gy, gw, 3);
    ctx.fillRect(gx, gy, 3, gh - 4);
    ctx.fillRect(gx + gw - 3, gy, 3, gh - 4);

    // Carved Rune Notches on Pillars
    ctx.fillStyle = bossLocked ? '#450A0A' : '#EF4444';
    for (let ry = gy + 7; ry < gy + gh - 10; ry += 7) {
      ctx.fillRect(gx + 1, ry, 1, 3);
      ctx.fillRect(gx + gw - 2, ry, 1, 3);
    }

    // Inner Vortex Core
    const innerX = gx + 5;
    const innerW = gw - 10;
    const innerY = gy + 6;
    const innerH = gh - 11;

    ctx.fillStyle = bossLocked ? '#140406' : '#450A0A';
    ctx.fillRect(innerX, innerY, innerW, innerH);

    if (!bossLocked) {
      const band = Math.round(Math.sin(t * 6.5) * 3);
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(innerX + 2, innerY + 3, innerW - 4, innerH - 6);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(innerX + 4, innerY + 6 + band, innerW - 8, innerH - 12);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx - 2, innerY + 5, 4, innerH - 10);
      ctx.fillStyle = '#EF4444';
      const scanY = innerY + 4 + (Math.round(t * 28) % Math.max(4, innerH - 8));
      ctx.fillRect(innerX + 2, scanY, innerW - 4, 2);
    } else {
      // Sealed crimson barrier X while Omega-Kolos still lives
      ctx.fillStyle = '#7F1D1D';
      ctx.fillRect(cx - 1, innerY + 6, 2, innerH - 12);
    }
  }

  private drawBoss(ctx: CanvasRenderingContext2D, boss: BossState, t: number): void {
    if (boss.defeated) return;
    const bx = this.px(boss.x);
    const by = this.px(boss.y);
    const bw = this.px(boss.w);
    const bh = this.px(boss.h);
    const cx = Math.round(bx + bw / 2);
    const cy = Math.round(by + bh / 2);

    const fillBlob = (ox: number, oy: number, rx: number, ry: number, color: string) => {
      ctx.fillStyle = color;
      for (let dy = -ry; dy <= ry; dy++) {
        const ny = dy / Math.max(1, ry);
        const span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - ny * ny)));
        if (span > 0) {
          ctx.fillRect(Math.round(ox - span), Math.round(oy + dy), span * 2, 1);
        }
      }
    };

    // 1. Slam danger telegraph zone & barbed tendril spire eruption
    if (boss.state === 'telegraph_slam' || boss.state === 'slam') {
      const tx = this.px(boss.targetX);
      const fy = this.px(boss.floorY);
      const blink = Math.floor(t * 24) % 2 === 0;
      if (boss.state === 'telegraph_slam') {
        ctx.fillStyle = blink ? 'rgba(239, 68, 68, 0.34)' : 'rgba(127, 29, 29, 0.2)';
        ctx.fillRect(tx - 32, fy - 76, 64, 76);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(tx - 32, fy - 4, 64, 4);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(tx - 24, fy - 3, 48, 2);
      } else {
        ctx.fillStyle = '#050506';
        ctx.fillRect(tx - 22, fy - 68, 44, 68);
        ctx.fillStyle = '#7F1D1D';
        ctx.fillRect(tx - 19, fy - 66, 38, 66);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(tx - 13, fy - 63, 26, 63);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(tx - 5, fy - 58, 10, 58);
        // Bone spire barbs
        ctx.fillRect(tx - 26, fy - 45, 7, 4);
        ctx.fillRect(tx + 19, fy - 36, 7, 4);
        ctx.fillRect(tx - 24, fy - 18, 6, 4);
      }
    }

    // 2. Suspension Umbilical Stalks anchoring Omega-Kolos to ceiling
    for (const [anchorOff, thick] of [[-22, 7], [0, 4], [21, 7]] as Array<[number, number]>) {
      const ax = cx + anchorOff;
      for (let sy = Math.max(0, by - 88); sy < by + 8; sy += 3) {
        const sway = Math.round(Math.sin(t * 3.2 + sy * 0.1 + anchorOff) * 3);
        ctx.fillStyle = '#050506';
        ctx.fillRect(ax + sway - Math.floor(thick / 2) - 1, sy, thick + 2, 3);
        ctx.fillStyle = '#450A0A';
        ctx.fillRect(ax + sway - Math.floor(thick / 2), sy, thick, 3);
        ctx.fillStyle = sy % 6 === 0 ? '#EF4444' : '#991B1B';
        ctx.fillRect(ax + sway - 1, sy, Math.max(2, thick - 3), 3);
      }
    }

    // 3. Sweeping Writhing Carrion Tentacles with muscle striations & scythe bone claws
    const renderTentacle = (endX: number, endY: number, seed: number, baseRad: number, striking: boolean) => {
      const dist = Math.hypot(endX - cx, endY - cy);
      const segs = Math.max(26, Math.round(dist * 1.15));
      for (let s = 0; s <= segs; s++) {
        const u = s / segs;
        const arcWave = Math.sin(t * (5.6 + boss.phase * 1.1) + seed + u * 5.2) * (striking ? 2.2 : 6.8 * u);
        const arcLift = Math.cos(t * 4.7 + seed * 0.8 + u * 3.6) * (striking ? 1.5 : 4.2 * u);
        const sx = Math.round(cx + (endX - cx) * u + arcWave);
        const sy = Math.round(cy + (endY - cy) * u + arcLift);
        const rad = Math.max(4, Math.round((1 - u * 0.45) * baseRad));

        ctx.fillStyle = '#050506';
        ctx.fillRect(sx - Math.floor(rad / 2) - 1, sy - Math.floor(rad / 2) - 1, rad + 2, rad + 2);
        ctx.fillStyle = '#991B1B';
        ctx.fillRect(sx - Math.floor(rad / 2), sy - Math.floor(rad / 2), rad, rad);
        ctx.fillStyle = s % 2 === 0 ? '#EF4444' : '#DC2626';
        const inner = Math.max(2, rad - 2);
        ctx.fillRect(
          sx - Math.floor(inner / 2),
          sy - Math.floor(inner / 2),
          inner,
          inner,
        );
        if (s % 4 === 0 && rad >= 5) {
          ctx.fillStyle = '#F4F4F5';
          ctx.fillRect(sx, sy - 1, 2, 1);
        }
        if (s === segs) {
          const dirX = endX >= cx ? 1 : -1;
          ctx.fillStyle = '#050506';
          ctx.fillRect(sx - 3, sy - 3, 7, 7);
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(sx - 2, sy - 2, 5, 5);
          // Curved Bone Scythe Talon
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(sx + dirX * 2, sy - 3, 4, 3);
          ctx.fillRect(sx + dirX * 5, sy - 1, 3, 3);
          ctx.fillRect(sx + dirX * 7, sy + 2, 2, 2);
        }
      }
    };

    const outerReach: Array<[number, number, number]> = [
      [-54, -18, 0.2],
      [56, -16, 1.7],
      [-58, 22, 3.1],
      [58, 24, 4.5],
    ];
    for (const [ox, oy, seed] of outerReach) {
      const swayX = Math.round(Math.sin(t * 2.8 + seed) * 9);
      const swayY = Math.round(Math.cos(t * 3.4 + seed) * 8);
      renderTentacle(cx + ox + swayX, cy + oy + swayY, seed, 8, false);
    }

    for (let i = 0; i < boss.tentacles.length; i++) {
      const ten = boss.tentacles[i];
      const reachBoostX = Math.sign(ten.targetX - boss.x - boss.w / 2 || (i % 2 === 0 ? -1 : 1)) * 14;
      renderTentacle(this.px(ten.targetX) + reachBoostX, this.px(ten.targetY), i * 1.4, 10, ten.striking);
    }

    // Dangling visceral root-tendrils beneath the core
    for (let vi = -4; vi <= 4; vi++) {
      const vx = cx + vi * 6;
      const len = 13 + ((Math.abs(vi) * 5) % 12);
      const sway = Math.round(Math.sin(t * 4.5 + vi * 1.2) * 3);
      ctx.fillStyle = '#050506';
      ctx.fillRect(vx - 1, by + bh - 5, 5, len + 2);
      ctx.fillStyle = vi % 2 === 0 ? '#7F1D1D' : '#991B1B';
      ctx.fillRect(vx, by + bh - 5, 3, len);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(vx + sway, by + bh - 5 + len - 2, 2, 3);
    }

    // 4. Monumental Multi-Lobed Carrion Flesh Mass
    const breathe = Math.round(Math.sin(t * (3.8 + boss.phase * 1.6)) * 2.5);
    const roarOpen =
      boss.state === 'telegraph_volley' || boss.state === 'telegraph_surge' || boss.state === 'surge'
        ? 5
        : Math.round(Math.abs(Math.sin(t * 5.2)) * 2.5);

    if (boss.hitFlashTimer > 0) {
      fillBlob(cx, cy, Math.round(bw * 0.56), Math.round(bh * 0.54), '#FFFFFF');
      fillBlob(cx - 19, cy - 5, 18, 20, '#FFFFFF');
      fillBlob(cx + 20, cy + 4, 17, 18, '#FFFFFF');
      return;
    }

    // Silhouette Frame
    fillBlob(cx, cy, Math.round(bw * 0.48) + breathe, Math.round(bh * 0.52), '#050506');
    fillBlob(cx - 20 - breathe, cy - 5, 18, 21, '#050506');
    fillBlob(cx + 21 + breathe, cy + 5, 18, 19, '#050506');
    fillBlob(cx - 8, cy - 22, 17, 14, '#050506');
    fillBlob(cx + 13, cy - 20, 15, 13, '#050506');

    // Deep Muscle Mass
    fillBlob(cx, cy, Math.round(bw * 0.45) + breathe, Math.round(bh * 0.48), '#450A0A');
    fillBlob(cx - 19 - breathe, cy - 5, 16, 18, '#450A0A');
    fillBlob(cx + 20 + breathe, cy + 5, 16, 17, '#450A0A');
    fillBlob(cx - 8, cy - 21, 15, 12, '#450A0A');
    fillBlob(cx + 13, cy - 19, 12, 11, '#450A0A');

    // Mid-tone Pulsing Tumors & Arterial Ridges
    fillBlob(cx, cy - 2, Math.round(bw * 0.39) + breathe, Math.round(bh * 0.42), '#991B1B');
    fillBlob(cx - 16 - breathe, cy - 4, 12, 14, '#991B1B');
    fillBlob(cx + 17 + breathe, cy + 4, 12, 13, '#991B1B');
    fillBlob(cx - 7, cy - 19, 10, 9, '#DC2626');

    // Bright Arterial Folds & Specular Wet Tissue Glints
    fillBlob(cx + 1, cy - 3, Math.round(bw * 0.28), Math.round(bh * 0.32), '#DC2626');
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(cx - 13, cy - 20, 11, 4);
    ctx.fillRect(cx + 5, cy - 17, 9, 4);
    ctx.fillRect(cx - 25, cy - 7, 7, 8);
    ctx.fillRect(cx + 19, cy + 1, 7, 8);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 12, cy - 20, 3, 1);
    ctx.fillRect(cx + 8, cy - 17, 3, 1);
    ctx.fillRect(cx - 24, cy - 6, 2, 2);

    // Phase-Dependent Chitinous Bone Rib Armor / Crown Horns
    if (boss.phase === 1) {
      for (const ribY of [-16, -4, 8]) {
        const inset = Math.abs(ribY) * 0.24;
        ctx.fillStyle = '#050506';
        ctx.fillRect(Math.round(bx + inset - 2), cy + ribY - 1, 10, 6);
        ctx.fillRect(Math.round(bx + bw - inset - 8), cy + ribY - 1, 10, 6);
        ctx.fillStyle = '#F4F4F5';
        ctx.fillRect(Math.round(bx + inset - 1), cy + ribY, 8, 4);
        ctx.fillRect(Math.round(bx + bw - inset - 7), cy + ribY, 8, 4);
        ctx.fillStyle = '#71717A';
        ctx.fillRect(Math.round(bx + inset), cy + ribY + 3, 6, 1);
        ctx.fillRect(Math.round(bx + bw - inset - 6), cy + ribY + 3, 6, 1);
      }
    } else {
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(bx - 5, cy - 15, 7, 4);
      ctx.fillRect(bx + bw - 2, cy - 12, 7, 4);
      ctx.fillRect(bx - 6, cy + 7, 8, 4);
      ctx.fillRect(bx + bw - 2, cy + 9, 8, 4);
      ctx.fillRect(cx - 17, by - 9, 4, 9);
      ctx.fillRect(cx - 14, by - 12, 3, 5);
      ctx.fillRect(cx + 13, by - 9, 4, 9);
      ctx.fillRect(cx + 11, by - 12, 3, 5);
      ctx.fillRect(cx - 2, by - 11, 4, 8);
      if (boss.phase === 3) {
        ctx.fillStyle = Math.floor(t * 24) % 2 === 0 ? '#FFFFFF' : '#EF4444';
        ctx.fillRect(bx - 9, cy - 5, 4, 3);
        ctx.fillRect(bx + bw + 5, cy + 3, 4, 3);
      }
    }

    // 8 Blinking Predator Cluster Eyes
    const eyeSpec: Array<[number, number, number]> = [
      [-19, -13, 4],
      [-10, -19, 5],
      [-3, -12, 4],
      [6, -20, 5],
      [15, -15, 4],
      [21, -8, 3],
      [-15, -5, 3],
      [10, -8, 4],
    ];
    const flare = boss.state === 'telegraph_surge' || boss.state === 'telegraph_volley';
    for (let ei = 0; ei < eyeSpec.length; ei++) {
      const [ox, oy, sz] = eyeSpec[ei];
      const blink = Math.sin(t * 3.1 + ei * 1.9) > -0.88;
      ctx.fillStyle = '#050506';
      ctx.fillRect(cx + ox - 1, cy + oy - 1, sz + 2, sz + 2);
      if (blink) {
        ctx.fillStyle = flare ? '#FFFFFF' : '#EF4444';
        ctx.fillRect(cx + ox, cy + oy, sz, sz);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cx + ox + 1, cy + oy + 1, Math.max(1, sz - 2), Math.max(1, sz - 2));
      } else {
        ctx.fillStyle = '#7F1D1D';
        ctx.fillRect(cx + ox, cy + oy + 1, sz, 2);
      }
    }

    // Cavernous Jagged Maw & Pulsing Reactor Organ
    const mawW = 28 + roarOpen * 2;
    const mawH = 12 + roarOpen * 2;
    const mawX = Math.round(cx - mawW / 2);
    const mawY = cy + 4;

    fillBlob(cx, mawY + Math.floor(mawH / 2), Math.floor(mawW / 2) + 3, Math.floor(mawH / 2) + 3, '#450A0A');
    fillBlob(cx, mawY + Math.floor(mawH / 2), Math.floor(mawW / 2), Math.floor(mawH / 2), '#050506');

    fillBlob(
      cx,
      mawY + Math.floor(mawH / 2),
      6,
      Math.max(3, Math.floor(mawH / 2) - 3),
      flare || roarOpen >= 3 ? '#FFFFFF' : '#EF4444',
    );
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(cx - 3, mawY + Math.floor(mawH / 2) - 1, 6, 3);

    ctx.fillStyle = '#F4F4F5';
    for (let tx = mawX + 2; tx <= mawX + mawW - 5; tx += 5) {
      const fangLen = Math.abs(tx - cx) < 5 ? 5 : 4;
      ctx.fillRect(tx, mawY, 2, fangLen);
      ctx.fillRect(tx + 1, mawY + mawH - fangLen, 2, fangLen);
    }
  }

  private drawEnemies(ctx: CanvasRenderingContext2D, sim: WorldSimulation, t: number): void {
    for (const enemy of sim.enemies) {
      if (!enemy.alive) continue;

      if (enemy.type === 'patrol_drone') {
        const hover = Math.round(Math.sin(t * 6 + enemy.x * 0.05) * 2);
        const ex = this.px(enemy.x);
        const ey = this.px(enemy.y) + hover;
        const ew = this.px(enemy.w);
        const eh = this.px(enemy.h);

        if (enemy.hitFlashTimer > 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(ex - 1, ey, ew + 2, eh);
        } else {
          // Twin high-speed rotor blur
          const rotorW = Math.floor(t * 28) % 2 === 0 ? ew + 6 : Math.max(6, Math.floor(ew / 2));
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(ex + Math.floor((ew - rotorW) / 2), ey - 3, rotorW, 1);
          ctx.fillStyle = '#71717A';
          ctx.fillRect(ex + Math.floor(ew / 2) - 1, ey - 2, 2, 3);

          // Dark outline + sculpted titanium drone chassis
          ctx.fillStyle = '#050506';
          ctx.fillRect(ex - 1, ey + 1, ew + 2, eh - 1);
          ctx.fillStyle = '#27272A';
          ctx.fillRect(ex, ey + 2, ew, eh - 3);
          ctx.fillStyle = '#F4F4F5';
          ctx.fillRect(ex + 2, ey + 2, ew - 4, 2);
          ctx.fillStyle = '#0B0B10';
          ctx.fillRect(ex + 2, ey + 5, ew - 4, eh - 7);
          // Scanning crimson optic lens
          ctx.fillStyle = '#DC2626';
          const eyeX = enemy.dir > 0 ? ex + ew - 8 : ex + 2;
          ctx.fillRect(eyeX, ey + 6, 6, 4);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(eyeX + (enemy.dir > 0 ? 3 : 1), ey + 7, 2, 2);
          // Landing skids + thruster jet
          ctx.fillStyle = '#52525B';
          ctx.fillRect(ex + 2, ey + eh - 1, 3, 2);
          ctx.fillRect(ex + ew - 5, ey + eh - 1, 3, 2);
          if (Math.floor(t * 18) % 2 === 0) {
            ctx.fillStyle = '#EF4444';
            ctx.fillRect(ex + Math.floor(ew / 2) - 2, ey + eh - 1, 4, 3);
          }
        }
      } else if (enemy.type === 'saw_slider') {
        const cx = this.px(enemy.x + enemy.w / 2);
        const cy = this.px(enemy.y + enemy.h / 2);
        const minX = this.px(enemy.patrolMinX ?? enemy.x) + 8;
        const maxX = this.px(enemy.patrolMaxX ?? enemy.x) + 8;

        ctx.fillStyle = '#050506';
        ctx.fillRect(minX, cy - 2, maxX - minX, 5);
        ctx.fillStyle = '#3F3F46';
        ctx.fillRect(minX, cy - 1, maxX - minX, 3);
        ctx.fillStyle = '#71717A';
        ctx.fillRect(minX, cy - 2, 3, 5);
        ctx.fillRect(maxX - 3, cy - 2, 3, 5);

        const flip = Math.floor(t * 20) % 2 === 0;
        ctx.fillStyle = '#050506';
        ctx.fillRect(cx - 8, cy - 8, 16, 16);
        ctx.fillStyle = '#F4F4F5';
        ctx.fillRect(cx - 7, cy - 7, 14, 14);
        ctx.fillStyle = '#DC2626';
        if (flip) {
          ctx.fillRect(cx - 10, cy - 2, 20, 4);
          ctx.fillRect(cx - 2, cy - 10, 4, 20);
        } else {
          ctx.fillRect(cx - 9, cy - 9, 4, 4);
          ctx.fillRect(cx + 5, cy - 9, 4, 4);
          ctx.fillRect(cx - 9, cy + 5, 4, 4);
          ctx.fillRect(cx + 5, cy + 5, 4, 4);
        }
        ctx.fillStyle = '#09090B';
        ctx.fillRect(cx - 3, cy - 3, 6, 6);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cx - 1, cy - 1, 2, 2);
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
          ctx.fillRect(ex - 1, ey, ew + 2, eh);
        } else {
          ctx.fillStyle = '#050506';
          ctx.fillRect(ex - 1, ey, ew + 2, eh);
          ctx.fillStyle = '#18181D';
          ctx.fillRect(ex, ey, ew, eh - 2);
          ctx.fillStyle = '#F4F4F5';
          ctx.fillRect(ex + 1, ey, ew - 2, 3);
          ctx.fillStyle = enemy.state === 'windup' ? '#FFFFFF' : '#DC2626';
          ctx.fillRect(ex + 4, ey + 5, ew - 8, 3);
          ctx.fillStyle = '#52525B';
          ctx.fillRect(cx - 4, muzzleY - 3, 8, 4);
        }

        if (enemy.state === 'windup') {
          const blink = Math.floor(t * 22) % 2 === 0;
          ctx.fillStyle = blink ? '#EF4444' : '#7F1D1D';
          ctx.fillRect(cx, muzzleY, 1, len);
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(cx - 4, muzzleY - 1, 8, 5);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(cx - 2, muzzleY, 4, 3);
        } else if (enemy.state === 'firing') {
          ctx.fillStyle = '#991B1B';
          ctx.fillRect(cx - 5, muzzleY, 10, len);
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(cx - 3, muzzleY, 6, len);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(cx - 1, muzzleY, 2, len);
        } else {
          ctx.fillStyle = '#71717A';
          ctx.fillRect(cx - 1, muzzleY, 2, 3);
        }
      } else if (enemy.type === 'stalker_crawler') {
        const ex = this.px(enemy.x);
        const ey = this.px(enemy.y);
        const ew = this.px(enemy.w);
        const eh = this.px(enemy.h);
        const crouch = enemy.state === 'windup' ? 3 : 0;

        if (enemy.hitFlashTimer > 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(ex - 1, ey + crouch, ew + 2, eh - crouch);
        } else {
          ctx.fillStyle = '#050506';
          ctx.fillRect(ex - 1, ey + 1 + crouch, ew + 2, eh - 2 - crouch);
          ctx.fillStyle = '#7F1D1D';
          ctx.fillRect(ex, ey + 2 + crouch, ew, eh - 5 - crouch);
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(ex + 2, ey + 1 + crouch, ew - 4, eh - 6 - crouch);
          // Serrated white bone spine plates
          ctx.fillStyle = '#F4F4F5';
          ctx.fillRect(ex + 3, ey - 2 + crouch, 3, 4);
          ctx.fillRect(ex + 9, ey - 2 + crouch, 3, 4);
          // Predator eyes + fangs
          const headX = enemy.dir > 0 ? ex + ew - 5 : ex;
          ctx.fillStyle = enemy.state === 'windup' || enemy.state === 'charging' ? '#FFFFFF' : '#EF4444';
          ctx.fillRect(headX, ey + 3 + crouch, 5, 3);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(headX + (enemy.dir > 0 ? 3 : 0), ey + 7 + crouch, 2, 3);
          // Articulated stride legs
          const stride = Math.round(Math.sin(t * 14 + enemy.x * 0.1) * 2);
          ctx.fillStyle = '#450A0A';
          ctx.fillRect(ex + 1 + stride, ey + eh - 3, 4, 3);
          ctx.fillRect(ex + ew - 5 - stride, ey + eh - 3, 4, 3);
        }
      } else if (enemy.type === 'mortar_spitter') {
        const ex = this.px(enemy.x);
        const ey = this.px(enemy.y);
        const ew = this.px(enemy.w);
        const eh = this.px(enemy.h);
        const swell = enemy.state === 'windup' ? 3 : Math.round(Math.sin(t * 5) * 1.5);

        if (enemy.hitFlashTimer > 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(ex - 1, ey, ew + 2, eh);
        } else {
          ctx.fillStyle = '#050506';
          ctx.fillRect(ex - 1, ey + 2, ew + 2, eh - 2);
          ctx.fillStyle = '#450A0A';
          ctx.fillRect(ex, ey + 5, ew, eh - 5);
          ctx.fillStyle = '#E4E4E7';
          ctx.fillRect(ex - 2, ey + eh - 4, 4, 4);
          ctx.fillRect(ex + ew - 2, ey + eh - 4, 4, 4);
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(ex + 2 - swell, ey + 2 - swell, ew - 4 + swell * 2, eh - 4);
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(ex + 4, ey + 5, ew - 8, 5);
          ctx.fillStyle = '#09090B';
          ctx.fillRect(ex + 5, ey + 1, ew - 10, 4);
          ctx.fillStyle = enemy.state === 'windup' ? '#FFFFFF' : '#EF4444';
          ctx.fillRect(ex + 6, ey, ew - 12, 2);
        }
      } else if (enemy.type === 'shield_enforcer') {
        const ex = this.px(enemy.x);
        const ey = this.px(enemy.y);
        const ew = this.px(enemy.w);
        const eh = this.px(enemy.h);

        if (enemy.hitFlashTimer > 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(ex - 1, ey, ew + 2, eh);
        } else {
          ctx.fillStyle = '#050506';
          ctx.fillRect(ex + 1, ey, ew - 2, eh);
          ctx.fillStyle = '#18181F';
          ctx.fillRect(ex + 2, ey + 3, ew - 4, eh - 4);
          // Shoulder pauldrons & helm
          ctx.fillStyle = '#F4F4F5';
          ctx.fillRect(ex + 3, ey, ew - 6, 5);
          ctx.fillStyle = '#71717A';
          ctx.fillRect(ex + 4, ey + 6, ew - 8, 4);
          ctx.fillStyle = enemy.state === 'windup' ? '#FFFFFF' : '#EF4444';
          ctx.fillRect(enemy.dir > 0 ? ex + ew - 7 : ex + 2, ey + 2, 5, 2);

          // Tower Shield
          const shieldX = enemy.dir > 0 ? ex + ew - 3 : ex - 2;
          ctx.fillStyle = '#050506';
          ctx.fillRect(shieldX - 1, ey + 1, 7, eh - 1);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(shieldX, ey + 2, 5, eh - 3);
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(shieldX + 1, ey + 8, 3, 6);

          if (enemy.state === 'windup') {
            ctx.fillStyle = Math.floor(t * 20) % 2 === 0 ? '#EF4444' : '#FFFFFF';
            ctx.fillRect(enemy.dir > 0 ? shieldX + 5 : shieldX - 32, ey + 9, 32, 1);
          }
        }
      } else if (enemy.type === 'hunter_wasp') {
        const ex = this.px(enemy.x);
        const ey = this.px(enemy.y);
        const ew = this.px(enemy.w);
        const eh = this.px(enemy.h);

        if (enemy.hitFlashTimer > 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(ex - 1, ey, ew + 2, eh);
        } else {
          const wingUp = Math.floor(t * 24) % 2 === 0;
          ctx.fillStyle = '#F4F4F5';
          ctx.fillRect(ex + 2, ey + (wingUp ? -4 : 0), ew - 4, 3);
          ctx.fillStyle = '#050506';
          ctx.fillRect(ex - 1, ey + 1, ew + 2, eh - 2);
          ctx.fillStyle = '#18181D';
          ctx.fillRect(ex, ey + 2, ew, eh - 4);
          ctx.fillStyle = enemy.state === 'windup' ? '#FFFFFF' : '#DC2626';
          ctx.fillRect(ex + 3, ey + 4, ew - 6, eh - 7);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(enemy.dir > 0 ? ex + ew - 4 : ex + 1, ey + 5, 3, 2);
          ctx.fillStyle = '#F4F4F5';
          ctx.fillRect(enemy.dir > 0 ? ex - 3 : ex + ew, ey + 6, 3, 2);
        }
      }

      if (enemy.hp < enemy.maxHp && enemy.type !== 'saw_slider') {
        const ex = this.px(enemy.x);
        const ey = this.px(enemy.y);
        for (let i = 0; i < enemy.maxHp; i++) {
          ctx.fillStyle = '#050506';
          ctx.fillRect(ex + i * 4 - 1, ey - 6, 4, 4);
          ctx.fillStyle = i < enemy.hp ? '#EF4444' : '#27272A';
          ctx.fillRect(ex + i * 4, ey - 5, 2, 2);
        }
      }
    }
  }

  private drawFlowingScarf(ctx: CanvasRenderingContext2D, p: PlayerState, isActive: boolean): void {
    const isAsche = p.id === 'asche';
    ctx.globalAlpha = isActive ? 1 : 0.78;

    // Pass 1: 1px Dark Outline for crisp readability over every background
    ctx.fillStyle = '#050506';
    for (let i = p.scarfTrail.length - 1; i >= 1; i--) {
      const a = p.scarfTrail[i - 1];
      const b = p.scarfTrail[i];
      const ax = this.px(a.x);
      const ay = this.px(a.y);
      const bx = this.px(b.x);
      const by = this.px(b.y);
      const sz = (i < 4 ? 4 : i < 10 ? 3 : 2) + 2;
      const steps = Math.max(1, Math.max(Math.abs(bx - ax), Math.abs(by - ay)));
      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const sx = Math.round(ax + (bx - ax) * u);
        const sy = Math.round(ay + (by - ay) * u);
        ctx.fillRect(sx - Math.floor(sz / 2), sy - Math.floor(sz / 2), sz, sz);
      }
    }

    // Pass 2: Layered Crimson/Bone Flowing Ribbon
    for (let i = p.scarfTrail.length - 1; i >= 1; i--) {
      const a = p.scarfTrail[i - 1];
      const b = p.scarfTrail[i];
      const ax = this.px(a.x);
      const ay = this.px(a.y);
      const bx = this.px(b.x);
      const by = this.px(b.y);

      const sz = i < 4 ? 4 : i < 10 ? 3 : 2;
      let segColor = '#DC2626';
      if (isAsche) {
        segColor = i >= 11 ? '#FFFFFF' : i % 2 === 0 ? '#EF4444' : '#B91C1C';
      } else {
        segColor = i >= 11 ? '#DC2626' : i % 2 === 0 ? '#F4F4F5' : '#A1A1AA';
      }
      ctx.fillStyle = segColor;

      const steps = Math.max(1, Math.max(Math.abs(bx - ax), Math.abs(by - ay)));
      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const sx = Math.round(ax + (bx - ax) * u);
        const sy = Math.round(ay + (by - ay) * u);
        ctx.fillRect(sx - Math.floor(sz / 2), sy - Math.floor(sz / 2), sz, sz);
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawProtagonist(
    ctx: CanvasRenderingContext2D,
    p: PlayerState,
    isActive: boolean,
    t: number,
    weaponLevel: number,
    activeWeapon: WorldSimulation['activeWeapon'],
  ): void {
    if (!p.alive) return;
    if (isActive && p.invulnTimer > 0 && Math.floor(p.invulnTimer * 18) % 2 === 0) return;

    this.drawFlowingScarf(ctx, p, isActive);

    if (p.dashTimer > 0) {
      const dxOff = p.dashVx !== 0 ? Math.sign(p.dashVx) * 16 : 0;
      const dyOff = p.dashVy !== 0 ? Math.sign(p.dashVy) * 16 : 0;
      ctx.fillStyle = '#F4F4F5';
      ctx.globalAlpha = 0.45;
      ctx.fillRect(this.px(p.x - dxOff), this.px(p.y - dyOff + 2), this.px(p.w), this.px(p.h - 4));
      ctx.fillStyle = '#DC2626';
      ctx.globalAlpha = 0.35;
      ctx.fillRect(this.px(p.x - dxOff * 2), this.px(p.y - dyOff * 2 + 4), this.px(p.w), this.px(p.h - 8));
      ctx.globalAlpha = 1;
    }

    const footX = this.px(p.x + p.w / 2);
    const footY = this.px(p.y + p.h);
    const running = p.onGround && Math.abs(p.vx) > 20;
    const walkBob = running ? Math.round(Math.abs(Math.sin(p.walkPhase)) * 1.2) : 0;

    const pw = Math.max(11, Math.round(this.px(p.w) * p.squashX));
    const ph = Math.max(14, Math.round(this.px(p.h) * p.squashY));
    const bx = Math.round(footX - pw / 2);
    const by = Math.round(footY - ph - walkBob);

    if (p.hitFlashTimer > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(bx - 1, by - 1, pw + 2, ph + 2);
      return;
    }

    ctx.globalAlpha = isActive ? 1 : 0.86;
    const isAsche = p.id === 'asche';
    const stride = running ? Math.round(Math.sin(p.walkPhase) * 2) : 0;

    // 1px dark silhouette frame
    ctx.fillStyle = '#050506';
    ctx.fillRect(bx - 1, by - 1, pw + 2, ph + 1);

    if (isAsche) {
      // Dark obsidian cloak torso with steel edge highlights + crimson sash
      ctx.fillStyle = '#09090D';
      ctx.fillRect(bx, by + 6, pw, ph - 9);
      ctx.fillStyle = '#71717A';
      ctx.fillRect(bx, by + 6, 1, ph - 9);
      ctx.fillRect(bx + pw - 1, by + 6, 1, ph - 9);
      ctx.fillStyle = '#27272A';
      ctx.fillRect(bx + 2, by + 9, pw - 4, 4);

      // Crimson Scarf Collar & Flowing Coat Hem
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(bx + 1, by + 6, pw - 2, 3);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(bx + 2, by + 6, pw - 4, 1);

      // Bone-white Phantom Mask + Glowing Crimson Visor Slit
      const headW = pw - 2;
      const headX = bx + 1;
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(headX, by, headW, 7);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(headX + 1, by, headW - 2, 3);
      ctx.fillStyle = '#A1A1AA';
      ctx.fillRect(headX + 1, by + 5, headW - 2, 1);

      ctx.fillStyle = '#050506';
      const eyeX = p.facing > 0 ? headX + headW - 5 : headX + 1;
      ctx.fillRect(eyeX, by + 3, 4, 2);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(p.facing > 0 ? eyeX + 1 : eyeX, by + 3, 3, 1);

      // Articulated Stride Boots
      ctx.fillStyle = '#E4E4E7';
      ctx.fillRect(bx + 2 + stride, footY - 3, 3, 3);
      ctx.fillRect(bx + pw - 5 - stride, footY - 3, 3, 3);
    } else {
      // KRON's Deployed Mechanical Wing Glider
      if (p.gliding) {
        ctx.fillStyle = '#050506';
        ctx.fillRect(bx - 8, by + 4, pw + 16, 6);
        ctx.fillStyle = '#7F1D1D';
        ctx.fillRect(bx - 7, by + 5, pw + 14, 4);
        ctx.fillStyle = '#F4F4F5';
        ctx.fillRect(bx - 7, by + 5, pw + 14, 1);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(bx - 6, by + 9, 4, 2);
        ctx.fillRect(bx + pw + 2, by + 9, 4, 2);
      }

      // Armored Titanium Exosuit Chest & Glowing Reactor Core
      ctx.fillStyle = '#18181E';
      ctx.fillRect(bx, by + 7, pw, ph - 11);
      ctx.fillStyle = '#E4E4E7';
      ctx.fillRect(bx - 1, by + 6, 4, 5);
      ctx.fillRect(bx + pw - 3, by + 6, 4, 5);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(bx + Math.floor(pw / 2) - 3, by + 10, 6, 4);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(bx + Math.floor(pw / 2) - 1, by + 11, 2, 2);
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(bx + 1, by + 7, pw - 2, 2);

      // Horned Obsidian Helmet + Crimson Visor
      const headW = pw - 2;
      const headX = bx + 1;
      ctx.fillStyle = '#09090D';
      ctx.fillRect(headX, by, headW, 8);
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(headX - 2, by - 3, 3, 4);
      ctx.fillRect(headX - 3, by - 5, 2, 3);
      ctx.fillRect(headX + headW - 1, by - 3, 3, 4);
      ctx.fillRect(headX + headW + 1, by - 5, 2, 3);
      ctx.fillStyle = '#D4D4D8';
      ctx.fillRect(headX + 1, by + 6, headW - 2, 2);

      ctx.fillStyle = '#EF4444';
      const eyeX = p.facing > 0 ? headX + headW - 7 : headX + 1;
      ctx.fillRect(eyeX, by + 3, 6, 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(p.facing > 0 ? eyeX + 3 : eyeX + 1, by + 3, 2, 1);

      // Heavy Crimson-Plated Greaves
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(bx + 2 + stride, footY - 4, 4, 4);
      ctx.fillRect(bx + pw - 6 - stride, footY - 4, 4, 4);
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(bx + 2 + stride, footY - 4, 4, 1);
      ctx.fillRect(bx + pw - 6 - stride, footY - 4, 4, 1);
    }

    // Distinct Weapon Barrel & Tiered Receiver + Crisp Muzzle Flare
    const gunY = by + 9;
    const baseLen = activeWeapon === 'harpoon' ? 12 : activeWeapon === 'shotgun' ? 8 : activeWeapon === 'mortar' ? 8 : 7;
    const barrelLen = baseLen + (weaponLevel >= 3 ? 2 : 0) + (isAsche ? 0 : 2);
    const gunThk = activeWeapon === 'mortar' ? 5 : activeWeapon === 'shotgun' ? 4 : weaponLevel >= 2 ? 4 : 3;
    const gunX = p.facing > 0 ? bx + pw - 1 : bx - barrelLen + 1;

    ctx.fillStyle = '#050506';
    ctx.fillRect(gunX - 1, gunY - 1, barrelLen + 2, gunThk + 2);
    ctx.fillStyle = weaponLevel >= 4 ? '#FFFFFF' : '#E4E4E7';
    ctx.fillRect(gunX, gunY, barrelLen, gunThk);
    ctx.fillStyle = activeWeapon === 'harpoon' ? '#FFFFFF' : '#DC2626';
    ctx.fillRect(p.facing > 0 ? gunX + barrelLen - 3 : gunX, gunY, 3, Math.max(2, gunThk - 1));
    if (p.recoilTimer > 0.04) {
      const flashX = p.facing > 0 ? gunX + barrelLen : gunX - 5;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(flashX, gunY - 2, 5, gunThk + 4);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(flashX, gunY, 4, gunThk);
    }

    ctx.globalAlpha = 1;

    // Active Player Marker Triangle
    if (isActive) {
      const bob = Math.round(Math.sin(t * 6) * 1.5);
      const my = by - (isAsche ? 9 : 13) + bob;
      ctx.fillStyle = isAsche ? '#EF4444' : '#FFFFFF';
      ctx.fillRect(footX - 3, my, 7, 1);
      ctx.fillRect(footX - 2, my + 1, 5, 1);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(footX - 1, my + 2, 3, 1);
    }
  }
}
