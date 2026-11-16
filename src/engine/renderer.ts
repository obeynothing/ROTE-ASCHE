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
import {
  createScreenShakeState,
  sampleScreenShakeOffset,
  type ScreenShakeState,
  stepScreenShakeState,
  triggerScreenShakeState,
} from './screenShake';

const MAX_PARTICLES = 560;
const MAX_SHOCKWAVES = 40;
const VIRTUAL_WORLD_H = 720;
const PIXEL_H = 540;
const WORLD_TO_PIXEL = PIXEL_H / VIRTUAL_WORLD_H; // Crisp 960x540 (0.75 scale) high-detail pixel grid

export class WorldRenderer {
  private particles: Particle[] = [];
  private particleCursor = 0;
  private shockwaves: ShockwaveRing[] = [];
  private shockwaveCursor = 0;
  private pixelBuffer: HTMLCanvasElement;
  private pctx: CanvasRenderingContext2D;
  private backdrop = new BackdropRenderer();
  private screenShake: ScreenShakeState = createScreenShakeState();
  private stepDustAccum = 0;
  private projTrailAccum = 0;

  constructor() {
    this.pixelBuffer = document.createElement('canvas');
    this.pixelBuffer.width = 960;
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

  public triggerScreenShake(intensity: number, duration: number): void {
    triggerScreenShakeState(this.screenShake, intensity, duration);
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
      let count = 7;
      let speed = 140;
      let gravity = 400;
      let color = ev.color ?? '#DC2626';

      if (ev.type === 'hurt' || ev.type === 'enemy_kill' || ev.type === 'buddy_loss') {
        count = ev.type === 'buddy_loss' ? 42 : 34;
        speed = 325;
        gravity = 560;
        color = '#DC2626';
        this.emitShockwave(ev.x, ev.y, ev.type === 'hurt' || ev.type === 'buddy_loss' ? 72 : 52, 0.32, '#EF4444');
        if (ev.type === 'hurt' || ev.type === 'buddy_loss') {
          this.triggerScreenShake(3.8, 0.24);
        }
      } else if (ev.type === 'explosion' || ev.type === 'boss_slam' || ev.type === 'boss_defeat') {
        count = ev.type === 'boss_defeat' ? 68 : 40;
        speed = ev.type === 'boss_defeat' ? 450 : 340;
        gravity = 420;
        color = '#EF4444';
        this.emitShockwave(ev.x, ev.y, ev.type === 'boss_defeat' ? 155 : 96, 0.44, '#FFFFFF');
        this.emitShockwave(ev.x, ev.y, ev.type === 'boss_defeat' ? 115 : 68, 0.32, '#EF4444');
        if (ev.type === 'boss_defeat') {
          this.triggerScreenShake(5.5, 0.42);
        } else if (ev.type === 'boss_slam') {
          this.triggerScreenShake(3.4, 0.22);
        }
      } else if (ev.type === 'boss_roar') {
        count = 30;
        speed = 290;
        gravity = 80;
        color = '#DC2626';
        this.emitShockwave(ev.x, ev.y, 134, 0.48, '#DC2626');
        this.triggerScreenShake(3.4, 0.24);
      } else if (ev.type === 'boss_hit') {
        count = 15;
        speed = 230;
        gravity = 380;
        color = '#EF4444';
        this.emitShockwave(ev.x, ev.y, 26, 0.16, '#FFFFFF');
        this.triggerScreenShake(2.1, 0.14);
      } else if (ev.type === 'ram_kill') {
        count = 34;
        speed = 335;
        gravity = 480;
        color = '#FFFFFF';
        this.emitShockwave(ev.x, ev.y, 64, 0.28, '#FFFFFF');
      } else if (ev.type === 'buddy_rescue') {
        count = 34;
        speed = 250;
        gravity = 110;
        color = '#FFFFFF';
        this.emitShockwave(ev.x, ev.y, 76, 0.38, '#EF4444');
      } else if (ev.type === 'stage_clear') {
        count = 40;
        speed = 275;
        gravity = 160;
        color = '#F4F4F5';
        this.emitShockwave(ev.x, ev.y, 98, 0.45, '#FFFFFF');
      } else if (ev.type === 'crystal') {
        count = 20;
        speed = 190;
        gravity = 80;
        color = '#EF4444';
        this.emitShockwave(ev.x, ev.y, 34, 0.24, '#EF4444');
      } else if (ev.type === 'dash') {
        count = 18;
        speed = 185;
        gravity = 30;
        color = ev.color ?? '#F4F4F5';
        this.emitShockwave(ev.x, ev.y, 38, 0.22, ev.color ?? '#FFFFFF');
      } else if (ev.type === 'double_jump') {
        count = 16;
        speed = 160;
        gravity = 60;
        color = ev.color ?? '#EF4444';
        this.emitShockwave(ev.x, ev.y, 34, 0.22, ev.color ?? '#EF4444');
      } else if (ev.type === 'switch_char' || ev.type === 'summon' || ev.type === 'weapon_switch') {
        count = ev.type === 'weapon_switch' ? 14 : 24;
        speed = 195;
        gravity = 40;
        color = ev.color ?? '#EF4444';
        this.emitShockwave(ev.x, ev.y, ev.type === 'weapon_switch' ? 32 : 48, 0.25, color);
      } else if (ev.type === 'checkpoint' || ev.type === 'upgrade') {
        count = 28;
        speed = 235;
        gravity = 120;
        color = '#FFFFFF';
        this.emitShockwave(ev.x, ev.y, 72, 0.36, '#EF4444');
      } else if (
        ev.type === 'shoot' ||
        ev.type === 'shoot_shotgun' ||
        ev.type === 'shoot_harpoon' ||
        ev.type === 'shoot_mortar'
      ) {
        count = ev.type === 'shoot_shotgun' ? 13 : 9;
        speed = 175;
        gravity = 40;
        color = ev.type === 'shoot_harpoon' ? '#EF4444' : '#FFFFFF';
      } else if (ev.type === 'ricochet' || ev.type === 'enemy_hit' || ev.type === 'enemy_telegraph') {
        count = 11;
        speed = 195;
        gravity = 260;
        color = ev.type === 'ricochet' ? '#FFFFFF' : '#EF4444';
      } else if (ev.type === 'bounce') {
        count = 16;
        speed = 225;
        gravity = 320;
        color = '#DC2626';
        this.emitShockwave(ev.x, ev.y, 36, 0.22, '#DC2626');
      } else if (ev.type === 'land') {
        count = 9;
        speed = 125;
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
          0.22 + Math.random() * 0.38,
          i % 3 === 0 ? 4 : 3,
          i % 3 === 0 &&
            (ev.type === 'hurt' ||
              ev.type === 'enemy_kill' ||
              ev.type === 'explosion' ||
              ev.type === 'boss_defeat' ||
              ev.type === 'boss_hit')
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

    if (active.gliding && Math.random() < 0.65) {
      this.emitParticle(
        active.x + Math.random() * active.w,
        active.y + 8,
        -active.facing * (45 + Math.random() * 45),
        -80 - Math.random() * 35,
        0.24,
        2,
        Math.random() > 0.35 ? '#F4F4F5' : '#EF4444',
        -40,
      );
    }

    // Projectile ember trails & Boss beam floor sparks for high-density illumination
    this.projTrailAccum += dt;
    if (this.projTrailAccum >= 0.028) {
      this.projTrailAccum = 0;
      for (const proj of sim.projectiles) {
        if (!proj.active) continue;
        if (proj.weapon === 'mortar' || proj.weapon === 'harpoon' || proj.heavy || Math.random() < 0.45) {
          this.emitParticle(
            proj.x,
            proj.y,
            -proj.vx * 0.08 + (Math.random() - 0.5) * 35,
            -proj.vy * 0.08 + (Math.random() - 0.5) * 35,
            0.18,
            proj.weapon === 'mortar' ? 3 : 2,
            proj.weapon === 'harpoon' ? '#FFFFFF' : '#EF4444',
            proj.weapon === 'mortar' ? 120 : 0,
          );
        }
      }
      for (const ep of sim.enemyProjectiles) {
        if (!ep.active) continue;
        if (Math.random() < 0.5) {
          this.emitParticle(
            ep.x,
            ep.y,
            (Math.random() - 0.5) * 28,
            -20 - Math.random() * 25,
            0.2,
            2,
            '#DC2626',
            0,
          );
        }
      }
      if (sim.boss?.active && sim.boss.state === 'beam') {
        this.emitParticle(
          sim.boss.beamX + (Math.random() - 0.5) * 18,
          sim.boss.floorY - 4,
          (Math.random() - 0.5) * 220,
          -140 - Math.random() * 140,
          0.26,
          3,
          Math.random() > 0.4 ? '#FFFFFF' : '#EF4444',
          420,
        );
      }
    }
  }

  public updateParticles(dt: number): void {
    stepScreenShakeState(this.screenShake, dt);

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

  private drawGlowHalo(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    radius: number,
    outerRgba: string,
    innerRgba: string,
  ): void {
    ctx.fillStyle = outerRgba;
    ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);
    const mid = Math.max(2, Math.round(radius * 0.58));
    ctx.fillStyle = innerRgba;
    ctx.fillRect(px - mid, py - mid, mid * 2, mid * 2);
  }

  public render(
    targetCtx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    sim: WorldSimulation,
    options: { isTitleBackdrop: boolean; freezeCamera?: boolean; timeSeconds: number },
  ): void {
    const aspect = canvasWidth / Math.max(1, canvasHeight);
    const pixelW = Math.max(540, Math.round(PIXEL_H * aspect));
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

    const worldShake = options.freezeCamera
      ? { x: 0, y: 0 }
      : sampleScreenShakeOffset(this.screenShake, options.timeSeconds);
    const traumaBoost = options.freezeCamera ? 0 : Math.min(2.2, sim.trauma * sim.trauma * 2.2);
    const shakePxX =
      worldShake.x + (traumaBoost > 0.15 ? Math.round(Math.sin(options.timeSeconds * 49) * traumaBoost) : 0);
    const shakePxY =
      worldShake.y + (traumaBoost > 0.15 ? Math.round(Math.cos(options.timeSeconds * 61) * traumaBoost) : 0);

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

    // 11. Karnifex-09 · Blut-Seraph Endboss (Sektor 14)
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
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.px(sw.x), this.px(sw.y), Math.max(4, Math.round(sw.radius * WORLD_TO_PIXEL)), 0, Math.PI * 2);
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
      const sz = Math.max(2, Math.round(p.size * WORLD_TO_PIXEL * 1.45));
      ctx.fillRect(this.px(p.x), this.px(p.y), sz, sz);
    }
    ctx.globalAlpha = 1;

    // 17b. Additive Illumination & Emissive Bloom Halos ('lighter')
    this.drawAdditiveLightingPass(ctx, sim, options.timeSeconds);

    ctx.restore();

    // 18. Biome Foreground Weather / Bio-Spores & Drifting Embers
    this.drawForegroundWeather(ctx, pixelW, PIXEL_H, camPxX, options.timeSeconds, sim.level.theme);

    // 19. Subtle Vignette & Scanline Film Grain
    this.drawAtmosphericPostFX(ctx, pixelW, PIXEL_H);

    targetCtx.imageSmoothingEnabled = false;
    targetCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    targetCtx.drawImage(this.pixelBuffer, 0, 0, canvasWidth, canvasHeight);
  }

  private drawAdditiveLightingPass(
    ctx: CanvasRenderingContext2D,
    sim: WorldSimulation,
    t: number,
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Crystals ruby halos
    for (const c of sim.level.crystals) {
      if (sim.collectedCrystals.has(c.id)) continue;
      const bob = Math.round(Math.sin(t * 4.2 + c.x * 0.03) * 3);
      this.drawGlowHalo(
        ctx,
        this.px(c.x),
        this.px(c.y) + bob,
        18,
        'rgba(220, 38, 38, 0.14)',
        'rgba(239, 68, 68, 0.18)',
      );
    }

    // Active Checkpoints beacon glow
    for (const cp of sim.level.checkpoints) {
      const cx = this.px(cp.x);
      const cy = this.px(cp.y);
      if (sim.activatedCheckpoints.has(cp.id)) {
        this.drawGlowHalo(ctx, cx, cy - 32, 24, 'rgba(239, 68, 68, 0.14)', 'rgba(255, 255, 255, 0.16)');
      } else {
        this.drawGlowHalo(ctx, cx, cy - 30, 12, 'rgba(127, 29, 29, 0.12)', 'rgba(220, 38, 38, 0.1)');
      }
    }

    // Buddy Rescue Pods cryogenic beacon column
    for (const pod of sim.level.buddyPods) {
      if (sim.collectedBuddyPods.has(pod.id)) continue;
      const px = this.px(pod.x);
      const py = this.px(pod.y);
      this.drawGlowHalo(ctx, px, py - 15, 22, 'rgba(220, 38, 38, 0.16)', 'rgba(244, 244, 245, 0.14)');
    }

    // Exit Monolith light column
    const g = sim.level.goal;
    const gx = this.px(g.x + g.w / 2);
    const gy = this.px(g.y + g.h / 2);
    const bossLocked = Boolean(sim.boss && !sim.boss.defeated);
    this.drawGlowHalo(
      ctx,
      gx,
      gy,
      bossLocked ? 22 : 42,
      bossLocked ? 'rgba(127, 29, 29, 0.12)' : 'rgba(220, 38, 38, 0.18)',
      bossLocked ? 'rgba(220, 38, 38, 0.08)' : 'rgba(255, 255, 255, 0.12)',
    );

    // Projectiles plasma bloom
    for (const proj of sim.projectiles) {
      if (!proj.active) continue;
      this.drawGlowHalo(
        ctx,
        this.px(proj.x),
        this.px(proj.y),
        proj.weapon === 'mortar' ? 16 : 11,
        'rgba(239, 68, 68, 0.18)',
        'rgba(255, 255, 255, 0.18)',
      );
    }

    for (const ep of sim.enemyProjectiles) {
      if (!ep.active) continue;
      this.drawGlowHalo(
        ctx,
        this.px(ep.x),
        this.px(ep.y),
        12,
        'rgba(220, 38, 38, 0.2)',
        'rgba(239, 68, 68, 0.16)',
      );
    }

    // Active Protagonist Visor / Reactor & Muzzle Light
    const active = getActivePlayer(sim);
    if (active.alive) {
      const ax = this.px(active.x + active.w / 2);
      const ay = this.px(active.y + active.h / 2);
      this.drawGlowHalo(
        ctx,
        ax,
        ay - 4,
        active.dashTimer > 0 ? 28 : 18,
        'rgba(220, 38, 38, 0.12)',
        'rgba(255, 255, 255, 0.08)',
      );
      if (active.recoilTimer > 0.04) {
        const mx = this.px(active.x + active.w / 2 + active.facing * 24);
        const my = this.px(active.y + 15);
        this.drawGlowHalo(ctx, mx, my, 22, 'rgba(239, 68, 68, 0.34)', 'rgba(255, 255, 255, 0.32)');
      }
    }

    // Karnifex-09 Reactor Core & Annihilation Beam Bloom
    if (sim.boss && !sim.boss.defeated && sim.boss.active) {
      const bcx = this.px(sim.boss.x + sim.boss.w / 2);
      const bcy = this.px(sim.boss.y + sim.boss.h / 2);
      this.drawGlowHalo(
        ctx,
        bcx,
        bcy,
        44,
        'rgba(220, 38, 38, 0.2)',
        'rgba(255, 255, 255, 0.14)',
      );
      if (sim.boss.state === 'beam') {
        const bx = this.px(sim.boss.beamX);
        const fy = this.px(sim.boss.floorY);
        this.drawGlowHalo(ctx, bx, fy - 4, 34, 'rgba(239, 68, 68, 0.35)', 'rgba(255, 255, 255, 0.35)');
      }
    }

    ctx.restore();
  }

  private drawAtmosphericPostFX(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.11)';
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }
    ctx.fillStyle = 'rgba(3, 3, 4, 0.44)';
    ctx.fillRect(0, 0, w, 9);
    ctx.fillRect(0, h - 9, w, 9);
    ctx.fillStyle = 'rgba(3, 3, 4, 0.2)';
    ctx.fillRect(0, 9, w, 9);
    ctx.fillRect(0, h - 18, w, 9);
  }

  private drawForegroundWeather(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camPxX: number,
    t: number,
    theme: BackdropTheme,
  ): void {
    const count = theme === 'omega_sanctum' || theme === 'bioreactor_abyss' ? 68 : 48;
    for (let i = 0; i < count; i++) {
      const speedX = theme === 'toxic_sewer' ? 38 + (i % 5) * 9 : 26 + (i % 5) * 8;
      const upFlow = theme === 'flesh_foundry' || theme === 'omega_sanctum' || theme === 'bioreactor_abyss';
      const speedY = upFlow ? -(26 + (i % 4) * 10) : 20 + (i % 4) * 8;
      const ax = (((i * 109 - t * speedX - camPxX * 0.48) % w) + w) % w;
      const ay = (((i * 67 + t * speedY) % h) + h) % h;
      ctx.fillStyle = i % 3 === 0 ? '#EF4444' : i % 4 === 0 ? '#F4F4F5' : '#52525B';
      const lenY = theme === 'toxic_sewer' && i % 4 === 0 ? 5 : 2;
      const sz = i % 7 === 0 ? 3 : 2;
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
      // Industrial suspended catwalk grating with cross-trusses & hanging anchor chains
      ctx.fillStyle = '#050506';
      ctx.fillRect(px, py - 1, pw, ph + 4);
      ctx.fillStyle = '#18181F';
      ctx.fillRect(px + 1, py + 2, pw - 2, ph);
      ctx.fillStyle = accent === 'crimson' ? '#DC2626' : '#E4E4E7';
      ctx.fillRect(px + 1, py, pw - 2, 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(px + 2, py, Math.max(2, pw - 4), 1);

      // End support shackles & riveted side caps
      ctx.fillStyle = '#52525B';
      ctx.fillRect(px + 1, py + 2, 4, ph + 2);
      ctx.fillRect(px + pw - 5, py + 2, 4, ph + 2);

      // Diagonal truss grating + under-slat struts
      for (let gx = px + 7; gx < px + pw - 7; gx += 11) {
        ctx.fillStyle = '#3F3F46';
        ctx.fillRect(gx, py + 3, 5, 2);
        ctx.fillRect(gx + 2, py + ph, 2, 5);
        ctx.fillStyle = '#27272A';
        ctx.fillRect(gx + 5, py + ph + 1, 3, 3);
        ctx.fillStyle = accent === 'crimson' ? '#991B1B' : '#52525B';
        ctx.fillRect(gx + 1, py + 6, 3, 2);
      }
      return;
    }

    // 1px dark silhouette frame + deep obsidian steel base
    ctx.fillStyle = '#050506';
    ctx.fillRect(px - 1, py - 1, pw + 2, ph + 2);
    ctx.fillStyle = '#0B0B10';
    ctx.fillRect(px, py, pw, ph);

    const isVerticalBulkhead = pw <= 28 && ph >= 48;

    if (isVerticalBulkhead) {
      // Heavy full-height steel containment bulkhead column with rebar & warning relay lights
      ctx.fillStyle = '#121218';
      ctx.fillRect(px + 2, py + 2, pw - 4, ph - 4);
      ctx.fillStyle = '#27272A';
      ctx.fillRect(px + 4, py, 3, ph);
      ctx.fillRect(px + pw - 7, py, 3, ph);
      for (let row = py + 12; row < py + ph - 6; row += 18) {
        ctx.fillStyle = '#050506';
        ctx.fillRect(px + 1, row, pw - 2, 2);
        ctx.fillStyle = '#3F3F46';
        ctx.fillRect(px + 2, row + 2, pw - 4, 1);
        ctx.fillStyle = row % 36 === 0 ? '#EF4444' : '#E4E4E7';
        ctx.fillRect(px + Math.floor(pw / 2) - 2, row - 6, 4, 2);
      }
      ctx.fillStyle = '#3F3F46';
      ctx.fillRect(px, py, 2, ph);
      ctx.fillRect(px + pw - 2, py, 2, ph);
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(px, py, 1, ph);
      return;
    }

    // Precision 16x10 staggered industrial masonry blocks + inner plate bevels & hairline fractures
    for (let row = py + 10; row < py + ph; row += 10) {
      ctx.fillStyle = '#050507';
      ctx.fillRect(px, row, pw, 1);
      const offset = ((row - py) / 10) % 2 === 0 ? 0 : 10;
      for (let col = px + offset; col < px + pw; col += 20) {
        ctx.fillStyle = '#050507';
        ctx.fillRect(col, row - 10, 1, 10);
        if (col + 10 < px + pw) {
          ctx.fillStyle = (col + row) % 40 === 0 ? '#171722' : '#111118';
          ctx.fillRect(col + 2, row - 8, 15, 6);
          ctx.fillStyle = '#22222E';
          ctx.fillRect(col + 2, row - 9, 13, 1);
          if ((col * 3 + row) % 70 === 0) {
            ctx.fillStyle = '#050506';
            ctx.fillRect(col + 8, row - 7, 1, 4);
            ctx.fillRect(col + 9, row - 5, 2, 1);
          }
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
      // Hazard chevrons + twin magnetic levitation thruster flares
      ctx.fillStyle = '#050506';
      for (let cx = px + 5; cx < px + pw - 5; cx += 10) {
        ctx.fillRect(cx, py + 1, 4, 2);
      }
      const flicker = Math.floor(t * 22) % 2 === 0;
      ctx.fillStyle = flicker ? '#FFFFFF' : '#EF4444';
      ctx.fillRect(px + 7, py + ph, 7, 2);
      ctx.fillRect(px + pw - 14, py + ph, 7, 2);
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(px + 9, py + ph + 2, 3, 2);
      ctx.fillRect(px + pw - 12, py + ph + 2, 3, 2);
    }

    // Corner Steel Gussets & Rivet Row
    ctx.fillStyle = '#52525B';
    ctx.fillRect(px, py + 3, 5, 6);
    ctx.fillRect(px + pw - 5, py + 3, 5, 6);
    ctx.fillStyle = '#F4F4F5';
    for (let rx = px + 10; rx < px + pw - 8; rx += 26) {
      ctx.fillRect(rx, py + 6, 2, 2);
    }

    // Organic Carrion creeping arterial tendrils on 'bio' platforms
    if (accent === 'bio') {
      for (let bx = px + 10; bx < px + pw - 12; bx += 26) {
        const drip = 6 + ((bx * 7) % 9) + Math.round(Math.sin(t * 2.8 + bx * 0.1) * 1.5);
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

    // Suspended structural chains & girders under thin decks
    if (ph <= 34 && pw >= 44 && kind !== 'moving') {
      ctx.fillStyle = '#18181F';
      ctx.fillRect(px + 8, py + ph, 4, 10);
      ctx.fillRect(px + pw - 12, py + ph, 4, 8);
      ctx.fillStyle = '#3F3F46';
      ctx.fillRect(px + 9, py + ph + 2, 2, 6);
      ctx.fillRect(px + pw - 11, py + ph + 2, 2, 5);
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
      // Sealed crimson barrier X while Karnifex-09 still lives
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
    const fy = this.px(boss.floorY);

    // 1. Multi-Target Floor Slams & Bone-Scythe Eruptions
    if (boss.state === 'telegraph_slam' || boss.state === 'slam') {
      const targets = boss.slamTargets.length > 0 ? boss.slamTargets : [boss.targetX];
      const blink = Math.floor(t * 24) % 2 === 0;
      for (const rawTx of targets) {
        const tx = this.px(rawTx);
        if (boss.state === 'telegraph_slam') {
          ctx.fillStyle = blink ? 'rgba(239, 68, 68, 0.32)' : 'rgba(127, 29, 29, 0.18)';
          ctx.fillRect(tx - 36, fy - 96, 72, 96);
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(tx - 36, fy - 4, 72, 4);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(tx - 26, fy - 3, 52, 2);
          ctx.fillRect(tx - 1, fy - 92, 2, 88);
        } else {
          // Erupting Bone-Scythe Spire
          ctx.fillStyle = '#050506';
          ctx.fillRect(tx - 26, fy - 98, 52, 98);
          ctx.fillStyle = '#7F1D1D';
          ctx.fillRect(tx - 23, fy - 94, 46, 94);
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(tx - 15, fy - 90, 30, 90);
          ctx.fillStyle = '#F4F4F5';
          ctx.fillRect(tx - 7, fy - 96, 14, 96);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(tx - 2, fy - 98, 4, 98);
          // Serrated side talons
          ctx.fillRect(tx - 31, fy - 62, 9, 5);
          ctx.fillRect(tx + 22, fy - 48, 9, 5);
          ctx.fillRect(tx - 28, fy - 24, 7, 5);
        }
      }
    }

    // 2. Sweeping Annihilation Beam (telegraph_beam / beam)
    if (boss.state === 'telegraph_beam' || boss.state === 'beam') {
      const aimX = this.px(boss.beamX);
      const originY = cy + 12;
      if (boss.state === 'telegraph_beam') {
        const pulse = Math.floor(t * 28) % 2 === 0;
        ctx.strokeStyle = pulse ? '#FFFFFF' : '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, originY);
        ctx.lineTo(aimX, fy);
        ctx.stroke();

        ctx.fillStyle = '#EF4444';
        ctx.fillRect(aimX - 18, fy - 4, 36, 4);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(aimX - 6, fy - 6, 12, 6);
      } else {
        // Multi-layered crimson & white plasma beam
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#7F1D1D';
        ctx.lineWidth = 22;
        ctx.beginPath();
        ctx.moveTo(cx, originY);
        ctx.lineTo(aimX, fy);
        ctx.stroke();

        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(cx, originY);
        ctx.lineTo(aimX, fy);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx, originY);
        ctx.lineTo(aimX, fy);
        ctx.stroke();

        // Floor impact flare crater
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(aimX - 22, fy - 8, 44, 8);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(aimX - 11, fy - 6, 22, 6);
      }
    }

    // 3. Dorsal Umbilical Conduit Cables to Ceiling
    for (const [anchorOff, thick] of [[-24, 6], [0, 8], [24, 6]] as Array<[number, number]>) {
      const ax = cx + anchorOff;
      for (let sy = Math.max(0, by - 96); sy < by + 10; sy += 4) {
        const sway = Math.round(Math.sin(t * 3.1 + sy * 0.08 + anchorOff) * 2.5);
        ctx.fillStyle = '#050506';
        ctx.fillRect(ax + sway - Math.floor(thick / 2) - 1, sy, thick + 2, 4);
        ctx.fillStyle = '#18181F';
        ctx.fillRect(ax + sway - Math.floor(thick / 2), sy, thick, 4);
        ctx.fillStyle = sy % 8 === 0 ? '#EF4444' : '#52525B';
        ctx.fillRect(ax + sway - 1, sy, 2, 4);
      }
    }

    // 4. Twin Unfolding Seraph Wing-Blades (expand wider in Phase 2 & 3)
    const wingSpread = boss.phase === 3 ? 1.28 : boss.phase === 2 ? 1.12 : 0.92;
    const wingFlap = Math.round(Math.sin(t * (3.6 + boss.phase * 1.1)) * 6);
    for (const side of [-1, 1] as const) {
      for (let tier = 0; tier < 3; tier++) {
        const span = Math.round((56 - tier * 11) * wingSpread);
        const wy = cy - 20 + tier * 15 + wingFlap * (tier === 0 ? 1 : -0.5);
        const wxBase = cx + side * 24;
        const wxTip = cx + side * (24 + span);

        // Dark outer strut
        ctx.strokeStyle = '#050506';
        ctx.lineWidth = 9 - tier;
        ctx.beginPath();
        ctx.moveTo(wxBase, wy);
        ctx.lineTo(wxTip, wy - 16 + tier * 10);
        ctx.stroke();

        // Armored obsidian-crimson blade body
        ctx.strokeStyle = tier === 0 ? '#E4E4E7' : '#991B1B';
        ctx.lineWidth = 6 - tier;
        ctx.beginPath();
        ctx.moveTo(wxBase, wy);
        ctx.lineTo(wxTip, wy - 16 + tier * 10);
        ctx.stroke();

        // Razor white leading edge + arterial vent
        ctx.strokeStyle = tier === 0 ? '#FFFFFF' : '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wxBase, wy - 2);
        ctx.lineTo(wxTip, wy - 18 + tier * 10);
        ctx.stroke();
      }
    }

    // 5. Six Articulated Biomechanical Scythe-Claws
    const drawScytheArm = (endX: number, endY: number, seed: number, striking: boolean) => {
      const dist = Math.hypot(endX - cx, endY - cy);
      const segs = Math.max(20, Math.round(dist * 0.9));
      for (let s = 0; s <= segs; s++) {
        const u = s / segs;
        const sway = Math.sin(t * 4.5 + seed + u * 4.4) * (striking ? 1.8 : 5 * u);
        const lift = Math.cos(t * 3.8 + seed + u * 3.2) * (striking ? 1.4 : 3.5 * u);
        const sx = Math.round(cx + (endX - cx) * u + sway);
        const sy = Math.round(cy + (endY - cy) * u + lift);
        const rad = Math.max(4, Math.round((1 - u * 0.48) * 9));

        ctx.fillStyle = '#050506';
        ctx.fillRect(sx - Math.floor(rad / 2) - 1, sy - Math.floor(rad / 2) - 1, rad + 2, rad + 2);
        ctx.fillStyle = s % 3 === 0 ? '#27272A' : '#7F1D1D';
        ctx.fillRect(sx - Math.floor(rad / 2), sy - Math.floor(rad / 2), rad, rad);
        ctx.fillStyle = s % 3 === 0 ? '#E4E4E7' : '#DC2626';
        ctx.fillRect(sx - 1, sy - 1, Math.max(2, rad - 3), Math.max(2, rad - 3));

        if (s === segs) {
          const dirX = endX >= cx ? 1 : -1;
          ctx.fillStyle = '#050506';
          ctx.fillRect(sx - 4, sy - 4, 8, 8);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(sx + dirX * 2, sy - 5, 6, 4);
          ctx.fillRect(sx + dirX * 7, sy - 2, 4, 4);
          ctx.fillRect(sx + dirX * 10, sy + 2, 3, 4);
        }
      }
    };

    for (let i = 0; i < boss.tentacles.length; i++) {
      const ten = boss.tentacles[i];
      drawScytheArm(this.px(ten.targetX), this.px(ten.targetY), i * 1.6, ten.striking);
    }
    drawScytheArm(cx - 58, cy + 34, 0.7, false);
    drawScytheArm(cx + 58, cy + 34, 2.3, false);

    // 6. Hit Flash Silhouette Override
    if (boss.hitFlashTimer > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx - 38, cy - 42, 76, 84);
      ctx.fillRect(cx - 48, cy - 22, 96, 42);
      return;
    }

    const hoverBob = Math.round(Math.sin(t * (3.5 + boss.phase)) * 2);
    const roarFlare =
      boss.state === 'telegraph_beam' ||
      boss.state === 'beam' ||
      boss.state === 'telegraph_volley' ||
      boss.state === 'telegraph_surge' ||
      boss.state === 'surge';
    const jawDrop = roarFlare ? 8 : Math.round(Math.abs(Math.sin(t * 4.2)) * 3);

    // 7. Armored Biomechanical Thorax & Rib-Shield Plates
    ctx.fillStyle = '#050506';
    ctx.fillRect(cx - 38, cy - 36 + hoverBob, 76, 76);
    ctx.fillStyle = '#18181F';
    ctx.fillRect(cx - 35, cy - 33 + hoverBob, 70, 70);

    // Pulsing Exposed Arterial Reactor Heart
    ctx.fillStyle = '#450A0A';
    ctx.fillRect(cx - 22, cy - 10 + hoverBob, 44, 40);
    ctx.fillStyle = '#991B1B';
    ctx.fillRect(cx - 18, cy - 6 + hoverBob, 36, 32);
    ctx.fillStyle = roarFlare ? '#FFFFFF' : '#EF4444';
    ctx.fillRect(cx - 11, cy + 1 + hoverBob, 22, 18);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 5, cy + 5 + hoverBob, 10, 10);

    // Phase-Reactive Rib-Shield Carapace (Shatters progressively in Phase 2/3)
    const ribWidth = boss.phase === 1 ? 16 : boss.phase === 2 ? 10 : 6;
    for (const ry of [-4, 10, 24]) {
      ctx.fillStyle = '#050506';
      ctx.fillRect(cx - 38, cy + ry + hoverBob - 1, ribWidth + 2, 8);
      ctx.fillRect(cx + 36 - ribWidth, cy + ry + hoverBob - 1, ribWidth + 2, 8);
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(cx - 37, cy + ry + hoverBob, ribWidth, 6);
      ctx.fillRect(cx + 37 - ribWidth, cy + ry + hoverBob, ribWidth, 6);
      ctx.fillStyle = '#71717A';
      ctx.fillRect(cx - 36, cy + ry + hoverBob + 4, ribWidth - 2, 2);
      ctx.fillRect(cx + 38 - ribWidth, cy + ry + hoverBob + 4, ribWidth - 2, 2);
    }

    // 8. Crowned Bone-Skull Head, Triad Predator Optics & Unhinging Mandible Jaw
    const skullY = cy - 42 + hoverBob;
    ctx.fillStyle = '#050506';
    ctx.fillRect(cx - 27, skullY - 2, 54, 34);
    ctx.fillStyle = '#E4E4E7';
    ctx.fillRect(cx - 25, skullY, 50, 28);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 21, skullY, 42, 10);
    // Bone Crown Spikes
    ctx.fillRect(cx - 25, skullY - 12, 7, 12);
    ctx.fillRect(cx - 10, skullY - 16, 6, 16);
    ctx.fillRect(cx + 4, skullY - 16, 6, 16);
    ctx.fillRect(cx + 18, skullY - 12, 7, 12);
    // Skull Cheek Shadows
    ctx.fillStyle = '#52525B';
    ctx.fillRect(cx - 23, skullY + 20, 12, 6);
    ctx.fillRect(cx + 11, skullY + 20, 12, 6);

    // Triad Predator Optic Eyes
    const opticPositions: Array<[number, number, number]> = [
      [-15, 9, 7],
      [-3, 6, 6],
      [8, 9, 7],
      [-19, 17, 4],
      [15, 17, 4],
    ];
    for (const [ox, oy, sz] of opticPositions) {
      ctx.fillStyle = '#050506';
      ctx.fillRect(cx + ox - 1, skullY + oy - 1, sz + 2, sz + 2);
      ctx.fillStyle = roarFlare ? '#FFFFFF' : '#EF4444';
      ctx.fillRect(cx + ox, skullY + oy, sz, sz);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx + ox + 1, skullY + oy + 1, Math.max(1, sz - 3), Math.max(1, sz - 3));
    }

    // Unhinging Serrated Mandible Jaw
    const jawY = skullY + 28 + jawDrop;
    ctx.fillStyle = '#050506';
    ctx.fillRect(cx - 22, skullY + 25, 44, 12 + jawDrop);
    ctx.fillStyle = roarFlare ? '#EF4444' : '#7F1D1D';
    ctx.fillRect(cx - 16, skullY + 27, 32, 6 + jawDrop);
    ctx.fillStyle = '#F4F4F5';
    ctx.fillRect(cx - 20, jawY, 40, 7);
    for (let tx = cx - 16; tx <= cx + 14; tx += 6) {
      ctx.fillRect(tx, skullY + 26, 3, 5);
      ctx.fillRect(tx + 1, jawY - 4, 3, 4);
    }

    // Phase 3 Overclock Halo Flicker
    if (boss.phase === 3 && Math.floor(t * 20) % 2 === 0) {
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(cx - 46, cy - 16 + hoverBob, 4, 12);
      ctx.fillRect(cx + 42, cy - 16 + hoverBob, 4, 12);
    }
  }

  private drawEnemies(ctx: CanvasRenderingContext2D, sim: WorldSimulation, t: number): void {
    for (const enemy of sim.enemies) {
      if (!enemy.alive) continue;

      if (enemy.type === 'patrol_drone') {
        const hover = Math.round(Math.sin(t * 6 + enemy.x * 0.05) * 2.5);
        const ex = this.px(enemy.x);
        const ey = this.px(enemy.y) + hover;
        const ew = this.px(enemy.w);
        const eh = this.px(enemy.h);

        if (enemy.hitFlashTimer > 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(ex - 1, ey, ew + 2, eh);
        } else {
          // Twin high-speed rotor blur & rotor masts
          const rotorW = Math.floor(t * 28) % 2 === 0 ? ew + 8 : Math.max(8, Math.floor(ew / 2));
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(ex + Math.floor((ew - rotorW) / 2), ey - 4, rotorW, 2);
          ctx.fillStyle = '#71717A';
          ctx.fillRect(ex + Math.floor(ew / 2) - 2, ey - 2, 4, 3);

          // Dark outline + sculpted titanium drone chassis
          ctx.fillStyle = '#050506';
          ctx.fillRect(ex - 1, ey + 1, ew + 2, eh - 1);
          ctx.fillStyle = '#27272A';
          ctx.fillRect(ex, ey + 2, ew, eh - 3);
          ctx.fillStyle = '#F4F4F5';
          ctx.fillRect(ex + 2, ey + 2, ew - 4, 3);
          ctx.fillStyle = '#0B0B10';
          ctx.fillRect(ex + 3, ey + 6, ew - 6, eh - 8);
          // Scanning crimson optic lens + specular highlight
          ctx.fillStyle = '#DC2626';
          const eyeX = enemy.dir > 0 ? ex + ew - 10 : ex + 3;
          ctx.fillRect(eyeX, ey + 7, 7, 5);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(eyeX + (enemy.dir > 0 ? 4 : 1), ey + 8, 2, 3);
          // Landing skids + twin plasma thruster jets
          ctx.fillStyle = '#52525B';
          ctx.fillRect(ex + 3, ey + eh - 1, 4, 3);
          ctx.fillRect(ex + ew - 7, ey + eh - 1, 4, 3);
          if (Math.floor(t * 20) % 2 === 0) {
            ctx.fillStyle = '#EF4444';
            ctx.fillRect(ex + Math.floor(ew / 2) - 3, ey + eh - 1, 6, 4);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(ex + Math.floor(ew / 2) - 1, ey + eh, 2, 2);
          }
        }
      } else if (enemy.type === 'saw_slider') {
        const cx = this.px(enemy.x + enemy.w / 2);
        const cy = this.px(enemy.y + enemy.h / 2);
        const minX = this.px(enemy.patrolMinX ?? enemy.x) + 10;
        const maxX = this.px(enemy.patrolMaxX ?? enemy.x) + 10;

        ctx.fillStyle = '#050506';
        ctx.fillRect(minX, cy - 3, maxX - minX, 6);
        ctx.fillStyle = '#3F3F46';
        ctx.fillRect(minX, cy - 1, maxX - minX, 3);
        ctx.fillStyle = '#E4E4E7';
        ctx.fillRect(minX, cy - 3, 4, 6);
        ctx.fillRect(maxX - 4, cy - 3, 4, 6);

        const flip = Math.floor(t * 22) % 2 === 0;
        ctx.fillStyle = '#050506';
        ctx.fillRect(cx - 11, cy - 11, 22, 22);
        ctx.fillStyle = '#F4F4F5';
        ctx.fillRect(cx - 10, cy - 10, 20, 20);
        ctx.fillStyle = '#DC2626';
        if (flip) {
          ctx.fillRect(cx - 14, cy - 3, 28, 6);
          ctx.fillRect(cx - 3, cy - 14, 6, 28);
        } else {
          ctx.fillRect(cx - 12, cy - 12, 5, 5);
          ctx.fillRect(cx + 7, cy - 12, 5, 5);
          ctx.fillRect(cx - 12, cy + 7, 5, 5);
          ctx.fillRect(cx + 7, cy + 7, 5, 5);
        }
        ctx.fillStyle = '#09090B';
        ctx.fillRect(cx - 5, cy - 5, 10, 10);
        ctx.fillStyle = '#FFFFFF';
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
          ctx.fillRect(ex - 1, ey, ew + 2, eh);
        } else {
          ctx.fillStyle = '#050506';
          ctx.fillRect(ex - 1, ey, ew + 2, eh);
          ctx.fillStyle = '#18181D';
          ctx.fillRect(ex, ey, ew, eh - 2);
          ctx.fillStyle = '#F4F4F5';
          ctx.fillRect(ex + 1, ey, ew - 2, 4);
          ctx.fillStyle = '#3F3F46';
          ctx.fillRect(ex + 3, ey + 5, ew - 6, 3);
          ctx.fillStyle = enemy.state === 'windup' ? '#FFFFFF' : '#DC2626';
          ctx.fillRect(ex + 5, ey + 10, ew - 10, 4);
          ctx.fillStyle = '#52525B';
          ctx.fillRect(cx - 5, muzzleY - 4, 10, 5);
        }

        if (enemy.state === 'windup') {
          const blink = Math.floor(t * 22) % 2 === 0;
          ctx.fillStyle = blink ? '#EF4444' : '#7F1D1D';
          ctx.fillRect(cx - 1, muzzleY, 2, len);
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(cx - 5, muzzleY - 1, 10, 6);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(cx - 3, muzzleY, 6, 4);
        } else if (enemy.state === 'firing') {
          ctx.fillStyle = '#7F1D1D';
          ctx.fillRect(cx - 7, muzzleY, 14, len);
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(cx - 4, muzzleY, 8, len);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(cx - 2, muzzleY, 4, len);
        } else {
          ctx.fillStyle = '#71717A';
          ctx.fillRect(cx - 2, muzzleY, 4, 4);
        }
      } else if (enemy.type === 'stalker_crawler') {
        const ex = this.px(enemy.x);
        const ey = this.px(enemy.y);
        const ew = this.px(enemy.w);
        const eh = this.px(enemy.h);
        const crouch = enemy.state === 'windup' ? 4 : 0;

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
          // Serrated white bone spine crest
          ctx.fillStyle = '#F4F4F5';
          ctx.fillRect(ex + 4, ey - 3 + crouch, 4, 5);
          ctx.fillRect(ex + 12, ey - 4 + crouch, 4, 6);
          ctx.fillRect(ex + 20, ey - 2 + crouch, 3, 4);
          // Predator eyes + fangs
          const headX = enemy.dir > 0 ? ex + ew - 7 : ex + 1;
          ctx.fillStyle = enemy.state === 'windup' || enemy.state === 'charging' ? '#FFFFFF' : '#EF4444';
          ctx.fillRect(headX, ey + 4 + crouch, 6, 4);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(headX + (enemy.dir > 0 ? 4 : 0), ey + 9 + crouch, 2, 4);
          // Articulated stride claws
          const stride = Math.round(Math.sin(t * 14 + enemy.x * 0.1) * 3);
          ctx.fillStyle = '#450A0A';
          ctx.fillRect(ex + 2 + stride, ey + eh - 4, 5, 4);
          ctx.fillRect(ex + ew - 7 - stride, ey + eh - 4, 5, 4);
        }
      } else if (enemy.type === 'mortar_spitter') {
        const ex = this.px(enemy.x);
        const ey = this.px(enemy.y);
        const ew = this.px(enemy.w);
        const eh = this.px(enemy.h);
        const swell = enemy.state === 'windup' ? 4 : Math.round(Math.sin(t * 5) * 1.5);

        if (enemy.hitFlashTimer > 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(ex - 1, ey, ew + 2, eh);
        } else {
          ctx.fillStyle = '#050506';
          ctx.fillRect(ex - 1, ey + 2, ew + 2, eh - 2);
          ctx.fillStyle = '#450A0A';
          ctx.fillRect(ex, ey + 6, ew, eh - 6);
          ctx.fillStyle = '#E4E4E7';
          ctx.fillRect(ex - 3, ey + eh - 5, 5, 5);
          ctx.fillRect(ex + ew - 2, ey + eh - 5, 5, 5);
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(ex + 2 - swell, ey + 3 - swell, ew - 4 + swell * 2, eh - 6);
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(ex + 5, ey + 7, ew - 10, 6);
          ctx.fillStyle = '#09090B';
          ctx.fillRect(ex + 6, ey + 1, ew - 12, 5);
          ctx.fillStyle = enemy.state === 'windup' ? '#FFFFFF' : '#EF4444';
          ctx.fillRect(ex + 8, ey, ew - 16, 3);
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
          ctx.fillRect(ex + 2, ey + 4, ew - 4, eh - 5);
          // Shoulder pauldrons & armored helm
          ctx.fillStyle = '#F4F4F5';
          ctx.fillRect(ex + 3, ey, ew - 6, 7);
          ctx.fillStyle = '#71717A';
          ctx.fillRect(ex + 4, ey + 8, ew - 8, 5);
          ctx.fillStyle = enemy.state === 'windup' ? '#FFFFFF' : '#EF4444';
          ctx.fillRect(enemy.dir > 0 ? ex + ew - 9 : ex + 2, ey + 3, 7, 3);

          // Tower Shield with crimson core insignia & steel rivets
          const shieldX = enemy.dir > 0 ? ex + ew - 4 : ex - 3;
          ctx.fillStyle = '#050506';
          ctx.fillRect(shieldX - 1, ey + 1, 9, eh - 1);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(shieldX, ey + 2, 7, eh - 3);
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(shieldX + 1, ey + 10, 5, 9);
          ctx.fillStyle = '#52525B';
          ctx.fillRect(shieldX + 2, ey + 4, 3, 2);
          ctx.fillRect(shieldX + 2, ey + eh - 5, 3, 2);

          if (enemy.state === 'windup') {
            ctx.fillStyle = Math.floor(t * 20) % 2 === 0 ? '#EF4444' : '#FFFFFF';
            ctx.fillRect(enemy.dir > 0 ? shieldX + 7 : shieldX - 40, ey + 12, 40, 2);
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
          ctx.fillRect(ex + 3, ey + (wingUp ? -5 : 0), ew - 6, 4);
          ctx.fillStyle = '#050506';
          ctx.fillRect(ex - 1, ey + 1, ew + 2, eh - 2);
          ctx.fillStyle = '#18181D';
          ctx.fillRect(ex, ey + 2, ew, eh - 4);
          ctx.fillStyle = enemy.state === 'windup' ? '#FFFFFF' : '#DC2626';
          ctx.fillRect(ex + 4, ey + 5, ew - 8, eh - 9);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(enemy.dir > 0 ? ex + ew - 6 : ex + 2, ey + 6, 4, 3);
          ctx.fillStyle = '#F4F4F5';
          ctx.fillRect(enemy.dir > 0 ? ex - 4 : ex + ew, ey + 8, 4, 3);
        }
      }

      if (enemy.hp < enemy.maxHp && enemy.type !== 'saw_slider') {
        const ex = this.px(enemy.x);
        const ey = this.px(enemy.y);
        for (let i = 0; i < enemy.maxHp; i++) {
          ctx.fillStyle = '#050506';
          ctx.fillRect(ex + i * 5 - 1, ey - 7, 5, 4);
          ctx.fillStyle = i < enemy.hp ? '#EF4444' : '#27272A';
          ctx.fillRect(ex + i * 5, ey - 6, 3, 2);
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
      const sz = (i < 4 ? 6 : i < 10 ? 5 : 3) + 2;
      const steps = Math.max(1, Math.max(Math.abs(bx - ax), Math.abs(by - ay)));
      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const sx = Math.round(ax + (bx - ax) * u);
        const sy = Math.round(ay + (by - ay) * u);
        ctx.fillRect(sx - Math.floor(sz / 2), sy - Math.floor(sz / 2), sz, sz);
      }
    }

    // Pass 2: Layered Crimson/Bone Flowing Ribbon + Top Rim Highlight
    for (let i = p.scarfTrail.length - 1; i >= 1; i--) {
      const a = p.scarfTrail[i - 1];
      const b = p.scarfTrail[i];
      const ax = this.px(a.x);
      const ay = this.px(a.y);
      const bx = this.px(b.x);
      const by = this.px(b.y);

      const sz = i < 4 ? 6 : i < 10 ? 5 : 3;
      let segColor = '#DC2626';
      if (isAsche) {
        segColor = i >= 11 ? '#FFFFFF' : i % 2 === 0 ? '#EF4444' : '#B91C1C';
      } else {
        segColor = i >= 11 ? '#DC2626' : i % 2 === 0 ? '#F4F4F5' : '#A1A1AA';
      }

      const steps = Math.max(1, Math.max(Math.abs(bx - ax), Math.abs(by - ay)));
      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const sx = Math.round(ax + (bx - ax) * u);
        const sy = Math.round(ay + (by - ay) * u);
        ctx.fillStyle = segColor;
        ctx.fillRect(sx - Math.floor(sz / 2), sy - Math.floor(sz / 2), sz, sz);
        if (sz >= 5 && s % 2 === 0) {
          ctx.fillStyle = isAsche ? '#FCA5A5' : '#FFFFFF';
          ctx.fillRect(sx - Math.floor(sz / 2), sy - Math.floor(sz / 2), sz, 1);
        }
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
      const dxOff = p.dashVx !== 0 ? Math.sign(p.dashVx) * 18 : 0;
      const dyOff = p.dashVy !== 0 ? Math.sign(p.dashVy) * 18 : 0;
      ctx.fillStyle = '#F4F4F5';
      ctx.globalAlpha = 0.48;
      ctx.fillRect(this.px(p.x - dxOff), this.px(p.y - dyOff + 2), this.px(p.w), this.px(p.h - 4));
      ctx.fillStyle = '#DC2626';
      ctx.globalAlpha = 0.36;
      ctx.fillRect(this.px(p.x - dxOff * 2), this.px(p.y - dyOff * 2 + 4), this.px(p.w), this.px(p.h - 8));
      ctx.globalAlpha = 1;
    }

    const footX = this.px(p.x + p.w / 2);
    const footY = this.px(p.y + p.h);
    const running = p.onGround && Math.abs(p.vx) > 20;
    const walkBob = running ? Math.round(Math.abs(Math.sin(p.walkPhase)) * 1.8) : 0;

    const pw = Math.max(15, Math.round(this.px(p.w) * p.squashX));
    const ph = Math.max(20, Math.round(this.px(p.h) * p.squashY));
    const bx = Math.round(footX - pw / 2);
    const by = Math.round(footY - ph - walkBob);

    if (p.hitFlashTimer > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(bx - 1, by - 1, pw + 2, ph + 2);
      return;
    }

    ctx.globalAlpha = isActive ? 1 : 0.88;
    const isAsche = p.id === 'asche';
    const stride = running ? Math.round(Math.sin(p.walkPhase) * 3) : 0;

    // 1px dark silhouette frame
    ctx.fillStyle = '#050506';
    ctx.fillRect(bx - 1, by - 1, pw + 2, ph + 1);

    if (isAsche) {
      // Dark obsidian cloak torso with armored belt, steel edge trim & crimson sash
      ctx.fillStyle = '#09090D';
      ctx.fillRect(bx, by + 9, pw, ph - 13);
      ctx.fillStyle = '#71717A';
      ctx.fillRect(bx, by + 9, 2, ph - 13);
      ctx.fillRect(bx + pw - 2, by + 9, 2, ph - 13);
      ctx.fillStyle = '#27272A';
      ctx.fillRect(bx + 3, by + 13, pw - 6, 5);
      ctx.fillStyle = '#E4E4E7';
      ctx.fillRect(bx + Math.floor(pw / 2) - 2, by + 15, 4, 2);

      // Crimson Scarf Collar & Flowing Mantle Hem
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(bx + 1, by + 8, pw - 2, 4);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(bx + 2, by + 8, pw - 4, 2);

      // Sculpted Bone-White Phantom Mask + Cheek Shadow + Crimson Visor Slit
      const headW = pw - 2;
      const headX = bx + 1;
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(headX, by, headW, 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(headX + 1, by, headW - 2, 4);
      ctx.fillStyle = '#A1A1AA';
      ctx.fillRect(headX + 1, by + 7, headW - 2, 2);

      ctx.fillStyle = '#050506';
      const eyeX = p.facing > 0 ? headX + headW - 7 : headX + 1;
      ctx.fillRect(eyeX, by + 4, 6, 3);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(p.facing > 0 ? eyeX + 1 : eyeX, by + 4, 4, 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(p.facing > 0 ? eyeX + 3 : eyeX + 1, by + 4, 1, 1);

      // Articulated Stride Boots with Shin Plates
      ctx.fillStyle = '#E4E4E7';
      ctx.fillRect(bx + 3 + stride, footY - 5, 4, 5);
      ctx.fillRect(bx + pw - 7 - stride, footY - 5, 4, 5);
      ctx.fillStyle = '#52525B';
      ctx.fillRect(bx + 3 + stride, footY - 2, 4, 2);
      ctx.fillRect(bx + pw - 7 - stride, footY - 2, 4, 2);
    } else {
      // KRON's Deployed Mechanical Wing Glider
      if (p.gliding) {
        ctx.fillStyle = '#050506';
        ctx.fillRect(bx - 12, by + 6, pw + 24, 9);
        ctx.fillStyle = '#7F1D1D';
        ctx.fillRect(bx - 11, by + 7, pw + 22, 6);
        ctx.fillStyle = '#F4F4F5';
        ctx.fillRect(bx - 11, by + 7, pw + 22, 2);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(bx - 9, by + 13, 5, 3);
        ctx.fillRect(bx + pw + 4, by + 13, 5, 3);
      }

      // Armored Titanium Exosuit Chest, Shoulder Pauldrons & Glowing Reactor Core
      ctx.fillStyle = '#18181E';
      ctx.fillRect(bx, by + 10, pw, ph - 16);
      ctx.fillStyle = '#E4E4E7';
      ctx.fillRect(bx - 2, by + 9, 6, 7);
      ctx.fillRect(bx + pw - 4, by + 9, 6, 7);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(bx + Math.floor(pw / 2) - 4, by + 14, 8, 6);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(bx + Math.floor(pw / 2) - 2, by + 16, 4, 2);
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(bx + 1, by + 10, pw - 2, 3);

      // Horned Obsidian Helmet + Crimson Visor
      const headW = pw - 2;
      const headX = bx + 1;
      ctx.fillStyle = '#09090D';
      ctx.fillRect(headX, by, headW, 11);
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(headX - 3, by - 4, 4, 6);
      ctx.fillRect(headX - 4, by - 7, 3, 4);
      ctx.fillRect(headX + headW - 1, by - 4, 4, 6);
      ctx.fillRect(headX + headW + 1, by - 7, 3, 4);
      ctx.fillStyle = '#D4D4D8';
      ctx.fillRect(headX + 1, by + 8, headW - 2, 3);

      ctx.fillStyle = '#EF4444';
      const eyeX = p.facing > 0 ? headX + headW - 9 : headX + 1;
      ctx.fillRect(eyeX, by + 4, 8, 3);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(p.facing > 0 ? eyeX + 4 : eyeX + 2, by + 4, 2, 2);

      // Heavy Crimson-Plated Greaves
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(bx + 3 + stride, footY - 6, 5, 6);
      ctx.fillRect(bx + pw - 8 - stride, footY - 6, 5, 6);
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(bx + 3 + stride, footY - 6, 5, 2);
      ctx.fillRect(bx + pw - 8 - stride, footY - 6, 5, 2);
    }

    // Distinct Weapon Barrel & Tiered Receiver + Crisp Muzzle Flare
    const gunY = by + 13;
    const baseLen = activeWeapon === 'harpoon' ? 16 : activeWeapon === 'shotgun' ? 11 : activeWeapon === 'mortar' ? 11 : 10;
    const barrelLen = baseLen + (weaponLevel >= 3 ? 3 : 0) + (isAsche ? 0 : 3);
    const gunThk = activeWeapon === 'mortar' ? 7 : activeWeapon === 'shotgun' ? 5 : weaponLevel >= 2 ? 5 : 4;
    const gunX = p.facing > 0 ? bx + pw - 1 : bx - barrelLen + 1;

    ctx.fillStyle = '#050506';
    ctx.fillRect(gunX - 1, gunY - 1, barrelLen + 2, gunThk + 2);
    ctx.fillStyle = weaponLevel >= 4 ? '#FFFFFF' : '#E4E4E7';
    ctx.fillRect(gunX, gunY, barrelLen, gunThk);
    ctx.fillStyle = activeWeapon === 'harpoon' ? '#FFFFFF' : '#DC2626';
    ctx.fillRect(p.facing > 0 ? gunX + barrelLen - 4 : gunX, gunY, 4, Math.max(2, gunThk - 1));
    if (p.recoilTimer > 0.04) {
      const flashX = p.facing > 0 ? gunX + barrelLen : gunX - 7;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(flashX, gunY - 3, 7, gunThk + 6);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(flashX + (p.facing > 0 ? 1 : 0), gunY, 5, gunThk);
    }

    ctx.globalAlpha = 1;

    // Active Player Marker Triangle
    if (isActive) {
      const bob = Math.round(Math.sin(t * 6) * 2);
      const my = by - (isAsche ? 12 : 16) + bob;
      ctx.fillStyle = isAsche ? '#EF4444' : '#FFFFFF';
      ctx.fillRect(footX - 4, my, 9, 1);
      ctx.fillRect(footX - 3, my + 1, 7, 1);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(footX - 1, my + 2, 3, 2);
    }
  }
}
