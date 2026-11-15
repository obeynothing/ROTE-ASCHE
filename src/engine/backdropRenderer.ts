import type { BackdropTheme } from '../game/types';

// 4x4 Bayer threshold matrix for crisp indie pixel-art dithering
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export class BackdropRenderer {
  private skyCache: HTMLCanvasElement | null = null;
  private skyCacheKey = '';

  public drawBackdrop(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camPxX: number,
    t: number,
    isTitleBackdrop: boolean,
    theme: BackdropTheme,
  ): void {
    const cacheKey = `${w}x${h}:${theme}`;
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

    // Far Parallax Skyline Megastructures (0.07x)
    const farSpan = 128;
    const skyOff = -(Math.round(camPxX * 0.07) % farSpan);
    for (let x = skyOff - farSpan; x < w + farSpan; x += farSpan) {
      if (isTitleBackdrop && x < 210) continue;
      const seed = Math.abs(Math.round(x + Math.round(camPxX * 0.07) / farSpan) * 19);
      const h1 = 88 + (seed % 5) * 22;
      const h2 = 62 + ((seed + 3) % 4) * 20;

      ctx.fillStyle = '#060305';
      ctx.fillRect(x + 8, h - h1, 38, h1);
      ctx.fillRect(x + 58, h - h2, 32, h2);
      ctx.fillRect(x + 98, h - h1 + 24, 24, h1 - 24);

      // Spire antenna & tiny warning beacon
      ctx.fillStyle = '#180508';
      ctx.fillRect(x + 26, h - h1 - 18, 2, 18);
      ctx.fillRect(x + 12, h - h1, 2, h1);
      if (seed % 2 === 0 && Math.sin(t * 3.5 + x) > 0.2) {
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(x + 26, h - h1 - 20, 2, 2);
      }
      // Subtle lit facility slit windows
      ctx.fillStyle = '#450A0A';
      for (let wy = h - h1 + 16; wy < h - 24; wy += 18) {
        ctx.fillRect(x + 18, wy, 4, 2);
        ctx.fillRect(x + 30, wy + 6, 4, 2);
      }
    }

    // Subtle emergency pulse in deep abyssal biomes
    if (!isTitleBackdrop && (theme === 'nerve_cathedral' || theme === 'omega_sanctum' || theme === 'bioreactor_abyss')) {
      const stormCycle = t % 7.2;
      if (stormCycle > 6.95 && stormCycle < 7.08) {
        ctx.fillStyle = 'rgba(220, 38, 38, 0.09)';
        ctx.fillRect(0, 0, w, h);
      }
    }

    // Biome-specific Mid-Far & Mid-Near Parallax Architectural Layers
    switch (theme) {
      case 'containment_lab':
        this.drawContainmentLab(ctx, w, h, camPxX, t, isTitleBackdrop);
        break;
      case 'flesh_foundry':
        this.drawFleshFoundry(ctx, w, h, camPxX, t);
        break;
      case 'toxic_sewer':
        this.drawToxicSewer(ctx, w, h, camPxX, t);
        break;
      case 'nerve_cathedral':
        this.drawNerveCathedral(ctx, w, h, camPxX, t);
        break;
      case 'quarantine_vault':
        this.drawQuarantineVault(ctx, w, h, camPxX, t);
        break;
      case 'bioreactor_abyss':
        this.drawBioreactorAbyss(ctx, w, h, camPxX, t);
        break;
      case 'omega_sanctum':
        this.drawOmegaSanctum(ctx, w, h, camPxX, t);
        break;
    }
  }

  private bakeThemeSky(octx: CanvasRenderingContext2D, w: number, h: number, theme: BackdropTheme): void {
    octx.fillStyle = '#030304';
    octx.fillRect(0, 0, w, h);

    const horizonStart =
      theme === 'flesh_foundry' || theme === 'omega_sanctum' || theme === 'bioreactor_abyss' ? 68 : 96;

    const deepColor =
      theme === 'omega_sanctum' || theme === 'bioreactor_abyss'
        ? '#2B0408'
        : theme === 'nerve_cathedral'
          ? '#1E0407'
          : '#140406';

    for (let y = horizonStart; y < h; y++) {
      const norm = (y - horizonStart) / Math.max(1, h - horizonStart);
      const level = norm * 16;
      const row = BAYER_4X4[y & 3];
      for (let x = 0; x < w; x++) {
        const thresh = row[x & 3];
        if (level > thresh + 4) {
          octx.fillStyle = norm > 0.72 ? deepColor : '#0C0305';
          octx.fillRect(x, y, 1, 1);
        } else if (level > thresh - 2) {
          octx.fillStyle = '#070305';
          octx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Subtle distant stars / ash specks in upper void
    octx.fillStyle = '#3F3F46';
    for (let i = 0; i < 48; i++) {
      const sx = (i * 97 + 31) % w;
      const sy = (i * 43 + 11) % Math.max(20, horizonStart - 10);
      if (i % 7 === 0) octx.fillStyle = '#7F1D1D';
      else if (i % 5 === 0) octx.fillStyle = '#71717A';
      else octx.fillStyle = '#27272A';
      octx.fillRect(sx, sy, 1, 1);
    }

    if (theme === 'containment_lab') {
      // Monumental Blood-Eclipse with orbital shatter-ring
      const sunX = Math.round(w * 0.77);
      const sunY = Math.round(h * 0.28);
      const outerR = 58;
      const innerR = 47;
      for (let dy = -outerR; dy <= outerR; dy++) {
        for (let dx = -outerR; dx <= outerR; dx++) {
          const dist = Math.hypot(dx, dy);
          if (dist <= outerR) {
            if (dist <= innerR) {
              octx.fillStyle = '#030304';
              octx.fillRect(sunX + dx, sunY + dy, 1, 1);
            } else if (dist <= innerR + 2 && dx < 12) {
              octx.fillStyle = '#F4F4F5';
              octx.fillRect(sunX + dx, sunY + dy, 1, 1);
            } else if (dist <= outerR - 4 || ((dx + dy) & 1) === 0) {
              octx.fillStyle = dist <= innerR + 6 ? '#EF4444' : '#7F1D1D';
              octx.fillRect(sunX + dx, sunY + dy, 1, 1);
            }
          }
        }
      }
      // Tilted orbital debris ring crossing eclipse
      for (let i = -72; i <= 72; i++) {
        const rx = sunX + i;
        const ry = Math.round(sunY + i * 0.16);
        if (Math.hypot(rx - sunX, ry - sunY) > innerR || i > 0) {
          octx.fillStyle = Math.abs(i) % 5 === 0 ? '#FFFFFF' : '#991B1B';
          octx.fillRect(rx, ry, 2, 1);
        }
      }
    }
  }

  private drawContainmentLab(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camPxX: number,
    t: number,
    isTitleBackdrop: boolean,
  ): void {
    // Volumetric sweeping spotlight cone
    const sweep = Math.sin(t * 0.45) * 56;
    ctx.fillStyle = 'rgba(220, 38, 38, 0.065)';
    ctx.beginPath();
    ctx.moveTo(Math.round(w * 0.58), h);
    ctx.lineTo(Math.round(w * 0.58 - 36 + sweep), 0);
    ctx.lineTo(Math.round(w * 0.58 + 24 + sweep), 0);
    ctx.closePath();
    ctx.fill();

    const farSpan = 260;
    const worldCellOffset = Math.floor(Math.round(camPxX * 0.16) / farSpan);
    const farOff = -(Math.round(camPxX * 0.16) % farSpan);
    for (let x = farOff - farSpan, colIdx = worldCellOffset - 1; x < w + farSpan; x += farSpan, colIdx++) {
      if (isTitleBackdrop && x < 235) continue;

      // Fluted steel containment pillar + cable conduit
      ctx.fillStyle = '#08080C';
      ctx.fillRect(x + 12, 0, 36, h);
      ctx.fillStyle = '#18181F';
      ctx.fillRect(x + 12, 0, 2, h);
      ctx.fillRect(x + 46, 0, 2, h);
      for (let ry = 20; ry < h; ry += 32) {
        ctx.fillStyle = '#27272A';
        ctx.fillRect(x + 10, ry, 40, 4);
        ctx.fillStyle = '#050506';
        ctx.fillRect(x + 10, ry + 4, 40, 1);
      }

      // Secondary conduit pipe
      ctx.fillStyle = '#101016';
      ctx.fillRect(x + 186, 0, 16, h);
      ctx.fillStyle = '#3F3F46';
      ctx.fillRect(x + 186, 0, 1, h);

      if (Math.abs(colIdx) % 2 === 0) {
        // Pressurized Cryo-Specimen Cylinder (60x176)
        const vatX = x + 78;
        const vatY = 92;
        const vatW = 58;
        const vatH = 176;
        ctx.fillStyle = '#120306';
        ctx.fillRect(vatX, vatY, vatW, vatH);
        ctx.fillStyle = '#220509';
        ctx.fillRect(vatX + 4, vatY + 6, vatW - 8, vatH - 12);
        // Glass walls & specular vertical highlights
        ctx.fillStyle = '#F4F4F5';
        ctx.fillRect(vatX, vatY, 1, vatH);
        ctx.fillRect(vatX + vatW - 1, vatY, 1, vatH);
        ctx.fillStyle = 'rgba(244, 244, 245, 0.16)';
        ctx.fillRect(vatX + 5, vatY + 8, 3, vatH - 16);
        ctx.fillRect(vatX + 10, vatY + 14, 1, vatH - 28);
        // Armored tank caps + bolted status LEDs
        ctx.fillStyle = '#27272A';
        ctx.fillRect(vatX - 4, vatY - 10, vatW + 8, 10);
        ctx.fillRect(vatX - 4, vatY + vatH, vatW + 8, 12);
        ctx.fillStyle = '#52525B';
        ctx.fillRect(vatX - 4, vatY - 10, vatW + 8, 2);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(vatX + 6, vatY - 6, 8, 3);
        ctx.fillRect(vatX + vatW - 14, vatY - 6, 8, 3);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(vatX + 8, vatY - 5, 2, 1);

        // Suspended Biomechanical Specimen silhouette inside cylinder
        const floatY = Math.round(Math.sin(t * 1.6 + x * 0.03) * 5);
        const sx = vatX + 20;
        const sy = vatY + 56 + floatY;
        ctx.fillStyle = '#450A0A';
        ctx.fillRect(sx - 2, sy, 22, 42);
        ctx.fillStyle = '#7F1D1D';
        ctx.fillRect(sx + 1, sy + 4, 16, 32);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(sx + 4, sy + 10, 10, 14);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(sx + 6, sy + 13, 2, 2);
        ctx.fillRect(sx + 10, sy + 13, 2, 2);
        // Umbilical tentacles inside tank
        ctx.fillStyle = '#991B1B';
        ctx.fillRect(sx + 2, sy + 36, 2, 22);
        ctx.fillRect(sx + 8, sy + 38, 3, 26);
        ctx.fillRect(sx + 14, sy + 36, 2, 18);

        // Rising cryo bubbles
        for (let b = 0; b < 4; b++) {
          const by = vatY + vatH - 8 - (Math.round(t * (22 + b * 5) + x + b * 37) % (vatH - 18));
          const bx = vatX + 10 + ((b * 13) % (vatW - 20));
          ctx.fillStyle = b % 2 === 0 ? '#FFFFFF' : '#EF4444';
          ctx.fillRect(bx, by, b === 0 ? 2 : 1, b === 0 ? 2 : 1);
        }
      } else {
        // Alternate Architectural Bay: Industrial Telemetry Wall + Vent Turbine & Manifold Pipes
        const bayX = x + 72;
        const bayY = 82;
        ctx.fillStyle = '#09090D';
        ctx.fillRect(bayX, bayY, 90, h - bayY);
        ctx.fillStyle = '#18181F';
        ctx.fillRect(bayX, bayY, 90, 2);
        ctx.fillRect(bayX + 6, bayY + 8, 78, 52);
        // Horizontal vent slats
        ctx.fillStyle = '#050506';
        for (let vy = bayY + 14; vy < bayY + 56; vy += 7) {
          ctx.fillRect(bayX + 12, vy, 66, 3);
        }
        // Telemetry server strip LEDs
        for (let ly = bayY + 72; ly < h - 30; ly += 16) {
          ctx.fillStyle = '#14141A';
          ctx.fillRect(bayX + 8, ly, 74, 10);
          const ping = (Math.floor(t * 4) + ly + colIdx) % 4 === 0;
          ctx.fillStyle = ping ? '#FFFFFF' : '#DC2626';
          ctx.fillRect(bayX + 14, ly + 4, 4, 2);
          ctx.fillStyle = '#3F3F46';
          ctx.fillRect(bayX + 24, ly + 4, 48, 2);
        }
      }
    }

    // Near Overhead Gantry Trusses & Hanging Bio-Mass (0.30x)
    const midSpan = 160;
    const midOff = -(Math.round(camPxX * 0.30) % midSpan);
    for (let x = midOff - midSpan; x < w + midSpan; x += midSpan) {
      if (isTitleBackdrop && x < 220) continue;
      ctx.fillStyle = '#0D0D12';
      ctx.fillRect(x, 14, midSpan, 8);
      ctx.fillStyle = '#27272A';
      ctx.fillRect(x, 14, midSpan, 1);
      ctx.fillRect(x, 22, midSpan, 1);
      for (let gx = x + 6; gx < x + midSpan - 6; gx += 16) {
        ctx.fillStyle = '#18181F';
        ctx.fillRect(gx, 22, 3, 6);
      }
      const sway = Math.round(Math.sin(t * 2.1 + x * 0.04) * 3);
      ctx.fillStyle = '#450A0A';
      ctx.fillRect(x + 70, 23, 18, 18);
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(x + 73 + sway, 41, 12, 16);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(x + 76 + sway, 57, 6, 12);
    }
  }

  private drawFleshFoundry(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camPxX: number,
    t: number,
  ): void {
    const farSpan = 220;
    const farOff = -(Math.round(camPxX * 0.16) % farSpan);
    for (let x = farOff - farSpan; x < w + farSpan; x += farSpan) {
      // Heavy foundry chimney + blast furnace stack
      ctx.fillStyle = '#08080B';
      ctx.fillRect(x + 18, 42, 38, h - 42);
      ctx.fillRect(x + 104, 72, 64, h - 72);
      ctx.fillStyle = '#27272A';
      ctx.fillRect(x + 18, 42, 1, h - 42);
      ctx.fillRect(x + 104, 72, 64, 2);

      // Rotating exhaust fan inside furnace housing
      const fanCx = x + 136;
      const fanCy = 122;
      ctx.fillStyle = '#050506';
      ctx.fillRect(fanCx - 16, fanCy - 16, 32, 32);
      ctx.fillStyle = '#3F3F46';
      ctx.fillRect(fanCx - 17, fanCy - 17, 34, 1);
      ctx.fillRect(fanCx - 17, fanCy + 16, 34, 1);
      const phase = Math.floor(t * 8) % 2 === 0;
      ctx.fillStyle = '#52525B';
      if (phase) {
        ctx.fillRect(fanCx - 13, fanCy - 2, 26, 4);
        ctx.fillRect(fanCx - 2, fanCy - 13, 4, 26);
      } else {
        for (let d = -10; d <= 10; d += 2) {
          ctx.fillRect(fanCx + d - 1, fanCy + d - 1, 3, 3);
          ctx.fillRect(fanCx + d - 1, fanCy - d - 1, 3, 3);
        }
      }
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(fanCx - 3, fanCy - 3, 6, 6);

      // Glowing smelter grate with heat pulse
      const glow = Math.sin(t * 4.2 + x) > 0;
      ctx.fillStyle = glow ? '#EF4444' : '#991B1B';
      ctx.fillRect(x + 114, 200, 44, 38);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + 124, 210, 24, 12);
      ctx.fillStyle = '#18181D';
      for (let bar = x + 118; bar < x + 156; bar += 7) {
        ctx.fillRect(bar, 200, 3, 38);
      }

      // Rising smelter smoke puffs
      for (let s = 0; s < 5; s++) {
        const age = (t * 0.4 + s * 0.2 + x * 0.01) % 1;
        const sy = Math.round(42 - age * 42);
        const sx = Math.round(x + 26 + Math.sin(age * 6 + s) * 6);
        const sw = Math.max(4, Math.round(18 - age * 10));
        ctx.fillStyle = age < 0.4 ? '#27272A' : '#141418';
        ctx.fillRect(sx, sy, sw, 6);
      }
    }

    // Overhead Meathook Chain Conveyor (0.30x)
    const midSpan = 150;
    const midOff = -(Math.round(camPxX * 0.30) % midSpan);
    for (let x = midOff - midSpan; x < w + midSpan; x += midSpan) {
      ctx.fillStyle = '#141419';
      ctx.fillRect(x, 30, midSpan, 6);
      ctx.fillStyle = '#52525B';
      ctx.fillRect(x, 30, midSpan, 1);

      const swing = Math.round(Math.sin(t * 2.2 + x * 0.02) * 3);
      for (let cy = 36; cy < 78; cy += 5) {
        ctx.fillStyle = '#52525B';
        ctx.fillRect(x + 72 + Math.round((swing * (cy - 36)) / 42), cy, 2, 4);
      }
      const hx = x + 64 + swing;
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(hx + 7, 76, 5, 3);
      ctx.fillStyle = '#050506';
      ctx.fillRect(hx - 1, 79, 22, 30);
      ctx.fillStyle = '#450A0A';
      ctx.fillRect(hx, 80, 20, 28);
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(hx + 2, 82, 16, 22);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(hx + 6, 86, 8, 12);
    }
  }

  private drawToxicSewer(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camPxX: number,
    t: number,
  ): void {
    const farSpan = 192;
    const farOff = -(Math.round(camPxX * 0.18) % farSpan);
    for (let x = farOff - farSpan; x < w + farSpan; x += farSpan) {
      // Heavy brick aqueduct arch columns
      ctx.fillStyle = '#08080C';
      ctx.fillRect(x + 8, 0, 32, h);
      ctx.fillRect(x + 148, 0, 32, h);
      ctx.fillRect(x + 40, 32, 108, 22);
      ctx.fillRect(x + 62, 54, 64, 14);
      ctx.fillStyle = '#27272A';
      ctx.fillRect(x + 40, 32, 108, 1);
      ctx.fillRect(x + 86, 32, 16, 22);

      // Grated sluice pipe discharging crimson cascade
      ctx.fillStyle = '#3F3F46';
      ctx.fillRect(x + 80, 68, 28, 14);
      ctx.fillStyle = '#F4F4F5';
      ctx.fillRect(x + 80, 68, 28, 2);

      ctx.fillStyle = '#450A0A';
      ctx.fillRect(x + 86, 82, 16, h - 82);
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(x + 89, 82, 10, h - 82);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(x + 92, 82, 4, h - 82);

      // Animated falling droplets & splash streaks
      for (let d = 0; d < 4; d++) {
        const dropY = 84 + (Math.round(t * 95 + x + d * 68) % (h - 90));
        ctx.fillStyle = d === 0 ? '#FFFFFF' : '#EF4444';
        ctx.fillRect(x + 90 + (d % 3) * 3, dropY, 2, 9);
      }

      // Circular ventilation drain fan on left pier
      const fx = x + 24;
      const fy = 156;
      ctx.fillStyle = '#050506';
      ctx.fillRect(fx - 10, fy - 10, 20, 20);
      ctx.fillStyle = '#52525B';
      if (Math.floor(t * 7) % 2 === 0) {
        ctx.fillRect(fx - 8, fy - 1, 16, 2);
        ctx.fillRect(fx - 1, fy - 8, 2, 16);
      } else {
        ctx.fillRect(fx - 6, fy - 6, 4, 4);
        ctx.fillRect(fx + 2, fy + 2, 4, 4);
        ctx.fillRect(fx + 2, fy - 6, 4, 4);
        ctx.fillRect(fx - 6, fy + 2, 4, 4);
      }
    }
  }

  private drawNerveCathedral(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camPxX: number,
    t: number,
  ): void {
    const farSpan = 180;
    const farOff = -(Math.round(camPxX * 0.18) % farSpan);
    for (let x = farOff - farSpan; x < w + farSpan; x += farSpan) {
      // Diagonal volumetric stained-crimson cathedral light shaft
      ctx.fillStyle = 'rgba(220, 38, 38, 0.08)';
      ctx.beginPath();
      ctx.moveTo(x + 64, 18);
      ctx.lineTo(x + 114, 18);
      ctx.lineTo(x + 158, h);
      ctx.lineTo(x + 92, h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(244, 244, 245, 0.04)';
      ctx.beginPath();
      ctx.moveTo(x + 82, 18);
      ctx.lineTo(x + 96, 18);
      ctx.lineTo(x + 132, h);
      ctx.lineTo(x + 114, h);
      ctx.closePath();
      ctx.fill();

      // Gothic lancet arch pillars
      ctx.fillStyle = '#07070B';
      ctx.fillRect(x + 8, 0, 28, h);
      ctx.fillRect(x + 144, 0, 28, h);
      ctx.fillRect(x + 36, 22, 108, 18);
      ctx.fillRect(x + 56, 40, 68, 12);
      ctx.fillStyle = '#27272A';
      ctx.fillRect(x + 35, 0, 1, h);
      ctx.fillRect(x + 144, 0, 1, h);

      // Rose tracery bars behind window
      ctx.fillStyle = '#7F1D1D';
      ctx.fillRect(x + 89, 52, 2, 95);
      ctx.fillRect(x + 68, 92, 44, 2);

      // Sculpted Gothic Rib-Cage & Spine Candelabra
      const pulse = Math.round(Math.sin(t * 3.6 + x * 0.03) * 2);
      const cxSpine = x + 90;
      // Central Iron-Bone Spine Column + Hanging Chain
      ctx.fillStyle = '#27272A';
      ctx.fillRect(cxSpine - 1, 40, 2, 24);
      for (let sy = 64; sy <= 110; sy += 6) {
        ctx.fillStyle = '#D4D4D8';
        ctx.fillRect(cxSpine - 2, sy, 4, 3);
        ctx.fillStyle = '#7F1D1D';
        ctx.fillRect(cxSpine - 1, sy + 3, 2, 3);
      }
      // Curved Rib Arches + Bone Tips
      for (let r = 0; r < 3; r++) {
        const ry = 70 + r * 11;
        const rw = 14 - r * 2 + pulse;
        ctx.fillStyle = '#991B1B';
        ctx.fillRect(cxSpine - rw, ry, rw * 2, 3);
        ctx.fillStyle = '#F4F4F5';
        ctx.fillRect(cxSpine - rw, ry + 1, 3, 4);
        ctx.fillRect(cxSpine + rw - 3, ry + 1, 3, 4);
      }
      // Flickering Soul-Lantern Core inside rib cage
      const flicker = Math.floor(t * 14 + x) % 2 === 0;
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(cxSpine - 4, 77, 8, 12);
      ctx.fillStyle = flicker ? '#FFFFFF' : '#EF4444';
      ctx.fillRect(cxSpine - 2, 80, 4, 6);
    }
  }

  private drawQuarantineVault(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camPxX: number,
    t: number,
  ): void {
    const farSpan = 210;
    const farOff = -(Math.round(camPxX * 0.20) % farSpan);
    for (let x = farOff - farSpan; x < w + farSpan; x += farSpan) {
      // Blast bulkhead door recess
      ctx.fillStyle = '#08080C';
      ctx.fillRect(x + 14, 20, 72, h - 20);
      ctx.fillStyle = '#14141A';
      ctx.fillRect(x + 22, 34, 56, h - 48);
      ctx.fillStyle = '#27272A';
      ctx.fillRect(x + 22, 34, 56, 2);
      // Hazard diagonal markings on door frame
      ctx.fillStyle = '#7F1D1D';
      for (let hy = 46; hy < h - 30; hy += 28) {
        ctx.fillRect(x + 15, hy, 5, 10);
        ctx.fillRect(x + 80, hy, 5, 10);
      }

      // Server bank telemetry LEDs
      for (let ly = 54; ly < 248; ly += 18) {
        const on = ((Math.floor(t * 5) + ly + x) % 5) === 0;
        ctx.fillStyle = on ? '#FFFFFF' : '#7F1D1D';
        ctx.fillRect(x + 28, ly, 5, 3);
        ctx.fillStyle = on ? '#EF4444' : '#27272A';
        ctx.fillRect(x + 38, ly, 30, 3);
      }

      // Sweeping ceiling quarantine beacon + cone
      const alarmOn = Math.sin(t * 7 + x * 0.05) > 0;
      if (alarmOn) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.07)';
        ctx.beginPath();
        ctx.moveTo(x + 132, 48);
        ctx.lineTo(x + 98, h);
        ctx.lineTo(x + 168, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#27272A';
      ctx.fillRect(x + 122, 32, 20, 6);
      ctx.fillStyle = alarmOn ? '#EF4444' : '#450A0A';
      ctx.fillRect(x + 125, 38, 14, 12);
      ctx.fillStyle = alarmOn ? '#FFFFFF' : '#7F1D1D';
      ctx.fillRect(x + 129, 41, 6, 5);
    }
  }

  private drawBioreactorAbyss(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camPxX: number,
    t: number,
  ): void {
    const farSpan = 190;
    const farOff = -(Math.round(camPxX * 0.20) % farSpan);
    for (let x = farOff - farSpan; x < w + farSpan; x += farSpan) {
      // Giant organic vascular trunk
      ctx.fillStyle = '#160306';
      ctx.fillRect(x + 16, 0, 48, h);
      ctx.fillStyle = '#450A0A';
      ctx.fillRect(x + 24, 0, 26, h);
      ctx.fillStyle = '#7F1D1D';
      ctx.fillRect(x + 30, 0, 10, h);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(x + 34, 0, 3, h);

      // Embedded Carrion Eye Cluster
      const blink = Math.sin(t * 2.2 + x * 0.04) > -0.84;
      if (blink) {
        ctx.fillStyle = '#050506';
        ctx.fillRect(x + 25, 114, 24, 14);
        ctx.fillStyle = '#F4F4F5';
        ctx.fillRect(x + 28, 117, 18, 8);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(x + 34, 118, 6, 6);
        ctx.fillStyle = '#050506';
        ctx.fillRect(x + 36, 120, 2, 2);
      } else {
        ctx.fillStyle = '#7F1D1D';
        ctx.fillRect(x + 28, 120, 18, 3);
      }

      // Secondary hanging bio-umbilicals
      const sway = Math.round(Math.sin(t * 2.6 + x * 0.05) * 4);
      ctx.fillStyle = '#450A0A';
      ctx.fillRect(x + 114, 0, 14, 62);
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(x + 117 + sway, 62, 8, 42);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(x + 120 + sway, 104, 2, 10);
    }
  }

  private drawOmegaSanctum(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camPxX: number,
    t: number,
  ): void {
    const cx = Math.round(w * 0.54);
    const cy = Math.round(h * 0.39);
    const pulse = Math.round(Math.sin(t * 3.8) * 5);

    // Monumental concentric crimson sanctuary rings + rotating ticks
    for (const [rad, col, lw] of [
      [104 + pulse, '#7F1D1D', 2],
      [76 - pulse, '#DC2626', 2],
      [44, '#FFFFFF', 2],
    ] as Array<[number, string, number]>) {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = 0; i < 8; i++) {
      const ang = t * 0.35 + (i / 8) * Math.PI * 2;
      const rx = Math.round(cx + Math.cos(ang) * 90);
      const ry = Math.round(cy + Math.sin(ang) * 90);
      ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#EF4444';
      ctx.fillRect(rx - 2, ry - 2, 4, 4);
    }

    // Arterial Sanctuary Heart Pillar
    ctx.fillStyle = '#450A0A';
    ctx.fillRect(cx - 16, 0, 32, cy - 22);
    ctx.fillStyle = '#7F1D1D';
    ctx.fillRect(cx - 14, cy - 14, 28, 28);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(cx - 9, cy - 9, 18, 18);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 4, cy - 4, 8, 8);

    // Sweeping Gothic Rib Columns (0.22x)
    const farSpan = 175;
    const farOff = -(Math.round(camPxX * 0.22) % farSpan);
    for (let x = farOff - farSpan; x < w + farSpan; x += farSpan) {
      ctx.fillStyle = '#08080D';
      ctx.fillRect(x + 18, 0, 26, h);
      ctx.fillStyle = '#450A0A';
      ctx.fillRect(x + 23, 0, 16, h);
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(x + 28, 0, 6, h);
      ctx.fillStyle = '#E4E4E7';
      ctx.fillRect(x + 16, 54, 30, 3);
      ctx.fillRect(x + 16, 180, 30, 3);
    }
  }
}
