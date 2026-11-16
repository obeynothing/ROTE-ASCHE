import type {
  BossState,
  CharacterId,
  EnemyRuntime,
  GateRuntime,
  InputSnapshot,
  LevelDef,
  MovingPlatformRuntime,
  PlayerState,
  Rect,
  WeaponId,
  WorldSimulation,
} from './types';

export const CHARACTER_SPECS: Record<
  CharacterId,
  {
    name: string;
    title: string;
    w: number;
    h: number;
    maxRunSpeed: number;
    airJumps: number;
    dashCooldown: number;
    bonusDamage: number;
    canGlide: boolean;
    canRamDrones: boolean;
  }
> = {
  asche: {
    name: 'ASCHE',
    title: '3x-Sprung · Agil · Schneller Dash',
    w: 26,
    h: 38,
    maxRunSpeed: 402,
    airJumps: 2,
    dashCooldown: 0.21,
    bonusDamage: 0,
    canGlide: false,
    canRamDrones: false,
  },
  kron: {
    name: 'KRON',
    title: 'Gleiter · +1 Schaden · Ramm-Dash',
    w: 32,
    h: 42,
    maxRunSpeed: 348,
    airJumps: 1,
    dashCooldown: 0.28,
    bonusDamage: 1,
    canGlide: true,
    canRamDrones: true,
  },
};

export interface WeaponSpec {
  id: WeaponId;
  slot: 1 | 2 | 3 | 4;
  name: string;
  shortName: string;
  role: string;
  cooldownByTier: Record<1 | 2 | 3 | 4, number>;
}

export const WEAPON_ORDER: WeaponId[] = ['pulse', 'shotgun', 'harpoon', 'mortar'];

export const WEAPONS: Record<WeaponId, WeaponSpec> = {
  pulse: {
    id: 'pulse',
    slot: 1,
    name: 'Puls-Gewehr',
    shortName: 'PULS',
    role: 'Schnelle Salven',
    cooldownByTier: { 1: 0.2, 2: 0.16, 3: 0.14, 4: 0.12 },
  },
  shotgun: {
    id: 'shotgun',
    slot: 2,
    name: 'Schrot-Reißer',
    shortName: 'SCHROT',
    role: 'Nahkampf-Streuung',
    cooldownByTier: { 1: 0.44, 2: 0.38, 3: 0.33, 4: 0.28 },
  },
  harpoon: {
    id: 'harpoon',
    slot: 3,
    name: 'Sehnen-Harpune',
    shortName: 'HARPUNE',
    role: 'Durchschlägt Schilde',
    cooldownByTier: { 1: 0.42, 2: 0.36, 3: 0.31, 4: 0.26 },
  },
  mortar: {
    id: 'mortar',
    slot: 4,
    name: 'Blut-Mörser',
    shortName: 'MÖRSER',
    role: 'Spreng-Bogen',
    cooldownByTier: { 1: 0.56, 2: 0.48, 3: 0.42, 4: 0.36 },
  },
};

export const PHYSICS = {
  GRAVITY: 1560,
  FALL_GRAVITY_MULT: 1.16,
  FAST_FALL_MULT: 1.48,
  GLIDE_FALL_SPEED: 115,
  MAX_FALL_SPEED: 920,
  MAX_RUN_SPEED: 380,
  GROUND_ACCEL: 3150,
  GROUND_DECEL: 3250,
  AIR_ACCEL: 2600,
  AIR_DECEL: 1350,
  JUMP_VY: -625,
  DOUBLE_JUMP_VY: -585,
  MAX_AIR_JUMPS: 2,
  JUMP_CUT_MULT: 0.46,
  COYOTE_TIME: 0.13,
  JUMP_BUFFER_TIME: 0.13,
  WALL_SLIDE_SPEED: 110,
  WALL_JUMP_VX: 375,
  WALL_JUMP_VY: -585,
  DASH_SPEED: 790,
  DASH_DURATION: 0.145,
  DASH_COOLDOWN: 0.24,
  SHOOT_COOLDOWN_BY_TIER: { 1: 0.2, 2: 0.16, 3: 0.14, 4: 0.12 } as const,
  PROJECTILE_SPEED: 960,
  PROJECTILE_LIFE: 0.72,
  PLAYER_W: 26,
  PLAYER_H: 38,
  SCARF_NODES: 14,
  TURRET_WINDUP_SEC: 0.55,
  TURRET_FIRE_SEC: 0.42,
} as const;

export const WEAPON_UPGRADES = [
  { level: 1 as const, name: 'Basis-Kaliber', cost: 0, desc: 'Standard-Salve aller 4 Waffen' },
  { level: 2 as const, name: 'Zwillings-Kern', cost: 3, desc: '+1 Projektil / Schrot & schnelleres Nachladen' },
  { level: 3 as const, name: 'Blut-Fächer', cost: 6, desc: '3-Wege-Streuung, mehr Durchschlag & Radius' },
  { level: 4 as const, name: 'Omega-Sturm', cost: 10, desc: 'Maximale Feuerkraft, Schaden & Flächenexplosion' },
] as const;

export const EMPTY_INPUT: InputSnapshot = {
  left: false,
  right: false,
  up: false,
  down: false,
  jumpHeld: false,
  jumpJustPressed: false,
  jumpJustReleased: false,
  dashJustPressed: false,
  shootJustPressed: false,
  shootHeld: false,
  switchJustPressed: false,
  summonJustPressed: false,
  weaponCycleJustPressed: false,
  weaponSelect: null,
};

let projectileSeq = 0;

export function createPlayerState(id: CharacterId, x: number, y: number): PlayerState {
  const spec = CHARACTER_SPECS[id];
  const scarfTrail = Array.from({ length: PHYSICS.SCARF_NODES }, (_, i) => ({
    x: x + spec.w / 2 - i * 4,
    y: y + 14,
  }));
  return {
    id,
    x,
    y,
    vx: 0,
    vy: 0,
    w: spec.w,
    h: spec.h,
    facing: 1,
    onGround: false,
    onWall: 0,
    gliding: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    airJumpsLeft: spec.airJumps,
    dashTimer: 0,
    dashCooldown: 0,
    dashVx: PHYSICS.DASH_SPEED,
    dashVy: 0,
    canAirDash: true,
    shootCooldown: 0,
    recoilTimer: 0,
    squashX: 1,
    squashY: 1,
    hitFlashTimer: 0,
    invulnTimer: 0,
    alive: true,
    respawnTimer: 0,
    inGoal: false,
    walkPhase: 0,
    scarfTrail,
  };
}

function getEnemyMaxHp(type: EnemyRuntime['type']): number {
  switch (type) {
    case 'saw_slider':
      return 99;
    case 'patrol_drone':
    case 'hunter_wasp':
      return 2;
    case 'pulse_turret':
    case 'stalker_crawler':
      return 3;
    case 'mortar_spitter':
    case 'shield_enforcer':
      return 4;
  }
}

function createInitialBoss(level: LevelDef): BossState | null {
  const arena = level.bossArena;
  if (!arena) return null;
  const w = 130;
  const h = 128;
  const tentacles = Array.from({ length: 6 }, (_, i) => ({
    angle: (i / 6) * Math.PI * 2,
    length: 76 + (i % 2) * 26,
    striking: false,
    targetX: arena.spawnX,
    targetY: arena.spawnY,
  }));
  return {
    name: 'KARNIFEX-09 · BLUT-SERAPH',
    active: false,
    defeated: false,
    x: arena.spawnX,
    y: arena.spawnY,
    w,
    h,
    anchorX: arena.spawnX,
    anchorY: arena.spawnY,
    hp: 105,
    maxHp: 105,
    phase: 1,
    state: 'dormant',
    stateTimer: 0,
    attackCycle: 0,
    targetX: arena.spawnX - 240,
    targetY: arena.floorY,
    beamX: arena.spawnX + w / 2,
    beamSweepDir: -1,
    slamTargets: [arena.spawnX - 180, arena.spawnX - 40],
    hitFlashTimer: 0,
    tentacles,
    arenaMinX: arena.arenaMinX,
    arenaMaxX: arena.arenaMaxX,
    floorY: arena.floorY,
    triggerX: arena.triggerX,
    gateId: arena.gateId,
  };
}

export function createWorldSimulation(
  level: LevelDef,
  previousScore = 0,
  weaponLevel: 1 | 2 | 3 | 4 = 1,
  activeWeapon: WeaponId = 'pulse',
): WorldSimulation {
  const movingPlatforms: MovingPlatformRuntime[] = level.platforms
    .filter((p) => p.kind === 'moving')
    .map((p) => ({
      ...p,
      originX: p.x,
      originY: p.y,
      dx: 0,
      dy: 0,
    }));

  const switches = level.switches.map((s) => ({
    ...s,
    pressed: false,
    timer: 0,
  }));

  const gates: GateRuntime[] = level.gates.map((g) => ({
    ...g,
    openProgress: 0,
  }));

  const enemies: EnemyRuntime[] = level.enemies.map((e, idx) => {
    const maxHp = getEnemyMaxHp(e.type);
    return {
      ...e,
      dir: idx % 2 === 0 ? 1 : -1,
      phaseTimer: (idx * 0.45) % 1.8,
      state: 'idle',
      hp: maxHp,
      maxHp,
      hitFlashTimer: 0,
      alive: true,
      originY: e.y,
      attackVx: 0,
      attackVy: 0,
    };
  });

  const p1 = createPlayerState('asche', level.spawn.x, level.spawn.y);
  const p2 = createPlayerState(
    'kron',
    Math.max(12, level.spawn.x - 38),
    level.spawn.y - (CHARACTER_SPECS.kron.h - CHARACTER_SPECS.asche.h),
  );

  return {
    level,
    players: [p1, p2],
    activeCharIndex: 0,
    partnerPresent: true,
    activeTrailHistory: [],
    lastSafePos: { x: level.spawn.x, y: level.spawn.y },
    activeSpawn: { x: level.spawn.x, y: level.spawn.y },
    activatedCheckpoints: new Set<string>(),
    collectedBuddyPods: new Set<string>(),
    activeWeapon,
    weaponLevel,
    movingPlatforms,
    switches,
    gates,
    enemies,
    projectiles: [],
    enemyProjectiles: [],
    boss: createInitialBoss(level),
    bloodDecals: [],
    collectedCrystals: new Set<string>(),
    shardsEarned: 0,
    elapsedSeconds: 0,
    deaths: 0,
    hitstopTimer: 0,
    cameraX: 0,
    cameraY: 0,
    trauma: 0,
    stageCompleted: false,
    totalScore: previousScore,
    events: [],
  };
}

export function getActivePlayer(sim: WorldSimulation): PlayerState {
  return sim.players[sim.activeCharIndex];
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function getGateRect(gate: GateRuntime): Rect {
  const ox = (gate.openOffsetX ?? 0) * gate.openProgress;
  const oy = (gate.openOffsetY ?? 0) * gate.openProgress;
  return {
    x: gate.x + ox,
    y: gate.y + oy,
    w: gate.w,
    h: gate.h,
  };
}

export function calculateStageScore(params: {
  parTimeSeconds: number;
  elapsedSeconds: number;
  crystalsCollected: number;
  totalCrystals: number;
  deaths: number;
}): number {
  const baseClear = 1000;
  const timeDelta = Math.max(0, params.parTimeSeconds - params.elapsedSeconds);
  const speedBonus = Math.round(timeDelta * 25);
  const crystalBonus = params.crystalsCollected * 150;
  const allCrystalsBonus =
    params.totalCrystals > 0 && params.crystalsCollected >= params.totalCrystals ? 250 : 0;
  const deathPenalty = params.deaths * 100;

  return Math.max(100, baseClear + speedBonus + crystalBonus + allCrystalsBonus - deathPenalty);
}

function getSolidObstacles(sim: WorldSimulation): Rect[] {
  const solids: Rect[] = [];
  for (const p of sim.level.platforms) {
    if (p.kind === 'solid') solids.push(p);
  }
  for (const mp of sim.movingPlatforms) {
    solids.push(mp);
  }
  for (const g of sim.gates) {
    solids.push(getGateRect(g));
  }
  return solids;
}

function getOneWayPlatforms(sim: WorldSimulation): Rect[] {
  return sim.level.platforms.filter((p) => p.kind === 'oneway');
}

function resetScarfAt(player: PlayerState): void {
  for (let i = 0; i < player.scarfTrail.length; i++) {
    player.scarfTrail[i].x = player.x + player.w / 2 - player.facing * (4 + i * 3.5);
    player.scarfTrail[i].y = player.y + 14;
  }
}

function addBloodDecalNear(sim: WorldSimulation, x: number, y: number, count: number): void {
  for (let c = 0; c < count; c++) {
    const sx = x + (c - (count - 1) / 2) * 18;
    let bestY = -1;
    for (const p of sim.level.platforms) {
      if (p.kind !== 'moving' && sx >= p.x + 6 && sx <= p.x + p.w - 14 && p.y >= y - 10) {
        if (bestY < 0 || p.y < bestY) {
          bestY = p.y;
        }
      }
    }
    if (bestY > 0) {
      sim.bloodDecals.push({
        x: sx - 8,
        y: bestY,
        w: 12 + ((Math.round(sx) + c * 7) % 14),
        h: 4,
        color: c % 2 === 0 ? '#991B1B' : '#DC2626',
      });
    }
  }
  if (sim.bloodDecals.length > 140) {
    sim.bloodDecals.splice(0, sim.bloodDecals.length - 140);
  }
}

function damageActivePlayer(sim: WorldSimulation, isPitFall: boolean): void {
  const active = getActivePlayer(sim);
  if (!active.alive) return;
  if (!isPitFall && active.invulnTimer > 0) return;

  // Donkey Kong Country Extra-Life Buddy Tag-Out!
  if (sim.partnerPresent) {
    const survivorIdx: 0 | 1 = sim.activeCharIndex === 0 ? 1 : 0;
    const survivor = sim.players[survivorIdx];

    sim.events.push({
      type: 'buddy_loss',
      x: active.x + active.w / 2,
      y: active.y + active.h / 2,
      color: active.id === 'asche' ? '#EF4444' : '#FFFFFF',
    });

    active.alive = false;
    active.gliding = false;
    active.vx = 0;
    active.vy = 0;
    sim.partnerPresent = false;
    sim.activeCharIndex = survivorIdx;

    survivor.alive = true;
    survivor.gliding = false;
    survivor.invulnTimer = 1.6;
    survivor.hitFlashTimer = 0.14;
    survivor.canAirDash = true;
    survivor.airJumpsLeft = CHARACTER_SPECS[survivor.id].airJumps;
    survivor.squashX = 0.8;
    survivor.squashY = 1.26;
    survivor.facing = active.facing;

    if (isPitFall) {
      survivor.x = sim.lastSafePos.x;
      survivor.y = Math.min(sim.lastSafePos.y, sim.level.height - survivor.h - 20) - (survivor.h - active.h);
      survivor.vx = 0;
      survivor.vy = -360;
    } else {
      survivor.x = active.x;
      survivor.y = active.y + active.h - survivor.h;
      survivor.vx = -active.facing * 120;
      survivor.vy = -260;
    }
    resetScarfAt(survivor);

    sim.hitstopTimer = Math.max(sim.hitstopTimer, 0.06);
    sim.trauma = Math.min(1, sim.trauma + 0.65);
    return;
  }

  // Only 1 character left -> full checkpoint death
  active.alive = false;
  active.gliding = false;
  active.respawnTimer = 0.55;
  active.hitFlashTimer = 0.14;
  active.vx = 0;
  active.vy = 0;
  sim.deaths += 1;
  sim.hitstopTimer = Math.max(sim.hitstopTimer, 0.06);
  sim.trauma = Math.min(1, sim.trauma + 0.82);
  sim.events.push({
    type: 'hurt',
    x: active.x + active.w / 2,
    y: active.y + active.h / 2,
    color: '#DC2626',
  });
}

function respawnSoloAtCheckpoint(sim: WorldSimulation, player: PlayerState): void {
  const spec = CHARACTER_SPECS[player.id];
  player.x = Math.max(10, sim.activeSpawn.x);
  player.y = sim.activeSpawn.y - (spec.h - CHARACTER_SPECS.asche.h);
  player.vx = 0;
  player.vy = 0;
  player.alive = true;
  player.gliding = false;
  player.onGround = false;
  player.airJumpsLeft = spec.airJumps;
  player.canAirDash = true;
  player.dashTimer = 0;
  player.invulnTimer = 1.25;
  player.hitFlashTimer = 0;
  player.squashX = 0.8;
  player.squashY = 1.25;
  sim.lastSafePos = { x: player.x, y: player.y };
  sim.activeTrailHistory = [];
  resetScarfAt(player);
}

export function updateScarfTrail(player: PlayerState, elapsed: number, dt: number): void {
  const anchorX = player.x + player.w / 2 - player.facing * 4;
  const anchorY = player.y + 13;
  player.scarfTrail[0].x = anchorX;
  player.scarfTrail[0].y = anchorY;

  const speedFactor = Math.min(1, Math.abs(player.vx) / 260);
  const segDist = 4.6 + speedFactor * 1.4;
  const gravityPull = player.onGround
    ? 1.8 - speedFactor * 1.2
    : player.gliding
      ? -1.6
      : player.vy < 0
        ? 2.4
        : -1.2;

  for (let i = 1; i < player.scarfTrail.length; i++) {
    const prev = player.scarfTrail[i - 1];
    const curr = player.scarfTrail[i];

    const windX = -player.facing * (1.2 + speedFactor * 3.8);
    const waveY = Math.sin(elapsed * (9 + speedFactor * 8) - i * 0.65) * (1.1 + speedFactor * 1.4);
    curr.x += windX * 14 * dt;
    curr.y += (gravityPull * 18 + waveY * 14) * dt;

    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const dist = Math.hypot(dx, dy) || 0.001;
    if (dist > segDist) {
      const ratio = segDist / dist;
      curr.x = prev.x + dx * ratio;
      curr.y = prev.y + dy * ratio;
    }
  }
}

function fireWeapon(sim: WorldSimulation, player: PlayerState, moveDir: number, upHeld: boolean): void {
  const spec = CHARACTER_SPECS[player.id];
  const weapon = sim.activeWeapon;
  const weaponSpec = WEAPONS[weapon];
  const baseCd = weaponSpec.cooldownByTier[sim.weaponLevel];
  player.shootCooldown = player.id === 'kron' ? baseCd + 0.04 : baseCd;
  player.recoilTimer = weapon === 'shotgun' || weapon === 'mortar' ? 0.16 : player.id === 'kron' ? 0.13 : 0.09;

  let baseDirX = moveDir !== 0 ? moveDir : player.facing;
  let baseDirY = 0;
  if (upHeld && moveDir === 0) {
    baseDirX = 0;
    baseDirY = -1;
  } else if (upHeld && moveDir !== 0) {
    baseDirX = moveDir * 0.72;
    baseDirY = -0.69;
  }

  const baseAngle = Math.atan2(baseDirY, baseDirX);
  const muzzleX = player.x + player.w / 2 + Math.cos(baseAngle) * 18;
  const muzzleY = player.y + 17 + Math.sin(baseAngle) * 14;
  const isHeavy = player.id === 'kron';

  const spawnBolt = (opts: {
    angle: number;
    speed: number;
    perpOffset: number;
    damage: number;
    pierce: number;
    life: number;
    radius: number;
    gravity?: number;
    splashRadius?: number;
  }) => {
    const ox = -Math.sin(opts.angle) * opts.perpOffset;
    const oy = Math.cos(opts.angle) * opts.perpOffset;
    sim.projectiles.push({
      id: `p-${++projectileSeq}`,
      weapon,
      x: muzzleX + ox,
      y: muzzleY + oy,
      vx: Math.cos(opts.angle) * opts.speed,
      vy: Math.sin(opts.angle) * opts.speed,
      gravity: opts.gravity ?? 0,
      radius: opts.radius + (isHeavy ? 1 : 0),
      splashRadius: opts.splashRadius ?? 0,
      damage: opts.damage + spec.bonusDamage,
      pierce: opts.pierce,
      life: opts.life,
      active: true,
      heavy: isHeavy,
      hitEnemyIds: [],
      trail: weapon === 'harpoon' ? [{ x: muzzleX + ox, y: muzzleY + oy }] : undefined,
    });
  };

  if (weapon === 'pulse') {
    if (sim.weaponLevel === 1) {
      spawnBolt({ angle: baseAngle, speed: 960, perpOffset: 0, damage: 1, pierce: 0, life: 0.72, radius: 5 });
    } else if (sim.weaponLevel === 2) {
      spawnBolt({ angle: baseAngle, speed: 980, perpOffset: -4, damage: 1, pierce: 0, life: 0.72, radius: 5 });
      spawnBolt({ angle: baseAngle, speed: 980, perpOffset: 4, damage: 1, pierce: 0, life: 0.72, radius: 5 });
    } else if (sim.weaponLevel === 3) {
      spawnBolt({ angle: baseAngle, speed: 1000, perpOffset: 0, damage: 1, pierce: 1, life: 0.75, radius: 6 });
      spawnBolt({ angle: baseAngle - 0.14, speed: 980, perpOffset: 0, damage: 1, pierce: 0, life: 0.72, radius: 5 });
      spawnBolt({ angle: baseAngle + 0.14, speed: 980, perpOffset: 0, damage: 1, pierce: 0, life: 0.72, radius: 5 });
    } else {
      spawnBolt({ angle: baseAngle, speed: 1040, perpOffset: 0, damage: 2, pierce: 1, life: 0.78, radius: 6 });
      spawnBolt({ angle: baseAngle - 0.1, speed: 1020, perpOffset: -3, damage: 1, pierce: 1, life: 0.74, radius: 5 });
      spawnBolt({ angle: baseAngle + 0.1, speed: 1020, perpOffset: 3, damage: 1, pierce: 1, life: 0.74, radius: 5 });
      spawnBolt({ angle: baseAngle - 0.22, speed: 980, perpOffset: 0, damage: 1, pierce: 0, life: 0.7, radius: 5 });
      spawnBolt({ angle: baseAngle + 0.22, speed: 980, perpOffset: 0, damage: 1, pierce: 0, life: 0.7, radius: 5 });
    }
    sim.events.push({ type: 'shoot', x: muzzleX, y: muzzleY, color: isHeavy ? '#FFFFFF' : '#EF4444' });
  } else if (weapon === 'shotgun') {
    const count = 3 + sim.weaponLevel; // Tier1: 4 pellets .. Tier4: 7 pellets
    const spread = 0.34;
    for (let i = 0; i < count; i++) {
      const frac = count === 1 ? 0 : i / (count - 1) - 0.5;
      spawnBolt({
        angle: baseAngle + frac * spread,
        speed: 860 - Math.abs(frac) * 90,
        perpOffset: 0,
        damage: sim.weaponLevel >= 4 ? 2 : 1,
        pierce: sim.weaponLevel >= 3 ? 1 : 0,
        life: 0.29,
        radius: 5,
      });
    }
    sim.trauma = Math.min(1, sim.trauma + 0.14);
    sim.events.push({ type: 'shoot_shotgun', x: muzzleX, y: muzzleY, color: '#FFFFFF' });
  } else if (weapon === 'harpoon') {
    const dmg = sim.weaponLevel >= 4 ? 4 : sim.weaponLevel >= 2 ? 3 : 2;
    const pierce = 3 + sim.weaponLevel;
    spawnBolt({
      angle: baseAngle,
      speed: 1280,
      perpOffset: 0,
      damage: dmg,
      pierce,
      life: 0.75,
      radius: 6,
    });
    if (sim.weaponLevel >= 3) {
      spawnBolt({
        angle: baseAngle - 0.08,
        speed: 1240,
        perpOffset: 0,
        damage: 2,
        pierce: 2,
        life: 0.65,
        radius: 5,
      });
      spawnBolt({
        angle: baseAngle + 0.08,
        speed: 1240,
        perpOffset: 0,
        damage: 2,
        pierce: 2,
        life: 0.65,
        radius: 5,
      });
    }
    sim.events.push({ type: 'shoot_harpoon', x: muzzleX, y: muzzleY, color: '#EF4444' });
  } else {
    // Blood Mortar — arcing explosive bio-shell
    const arcSpeed = 590;
    const launchAngle = Math.abs(baseDirY) > 0.5 ? baseAngle : baseAngle - player.facing * 0.42;
    const splash = 68 + sim.weaponLevel * 14;
    const dmg = 2 + Math.floor(sim.weaponLevel / 2);
    spawnBolt({
      angle: launchAngle,
      speed: arcSpeed,
      perpOffset: 0,
      damage: dmg,
      pierce: 0,
      life: 1.35,
      radius: 7,
      gravity: 960,
      splashRadius: splash,
    });
    if (sim.weaponLevel >= 4) {
      spawnBolt({
        angle: launchAngle - player.facing * 0.16,
        speed: arcSpeed * 0.92,
        perpOffset: 0,
        damage: 2,
        pierce: 0,
        life: 1.3,
        radius: 6,
        gravity: 960,
        splashRadius: splash * 0.8,
      });
    }
    sim.events.push({ type: 'shoot_mortar', x: muzzleX, y: muzzleY, color: '#DC2626' });
  }
}

function stepActivePlayer(
  sim: WorldSimulation,
  player: PlayerState,
  input: InputSnapshot,
  dt: number,
  solids: Rect[],
  oneWays: Rect[],
): void {
  const spec = CHARACTER_SPECS[player.id];

  if (!player.alive) {
    player.respawnTimer -= dt;
    if (player.respawnTimer <= 0) {
      respawnSoloAtCheckpoint(sim, player);
    }
    return;
  }

  if (player.invulnTimer > 0) player.invulnTimer = Math.max(0, player.invulnTimer - dt);
  if (player.hitFlashTimer > 0) player.hitFlashTimer = Math.max(0, player.hitFlashTimer - dt);
  if (player.dashCooldown > 0) player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  if (player.shootCooldown > 0) player.shootCooldown = Math.max(0, player.shootCooldown - dt);
  if (player.recoilTimer > 0) player.recoilTimer = Math.max(0, player.recoilTimer - dt);

  const damp = 1 - Math.exp(-18 * dt);
  player.squashX += (1 - player.squashX) * damp;
  player.squashY += (1 - player.squashY) * damp;

  if (player.onGround) {
    for (const mp of sim.movingPlatforms) {
      const feetRect: Rect = { x: player.x + 2, y: player.y + player.h, w: player.w - 4, h: 4 };
      if (rectsOverlap(feetRect, mp)) {
        player.x += mp.dx;
        player.y += mp.dy;
        break;
      }
    }
  }

  if (player.onGround) {
    player.coyoteTimer = PHYSICS.COYOTE_TIME;
    player.canAirDash = true;
    player.airJumpsLeft = spec.airJumps;
    player.gliding = false;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
  }

  if (input.jumpJustPressed) {
    player.jumpBufferTimer = PHYSICS.JUMP_BUFFER_TIME;
  } else {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
  }

  const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (moveDir !== 0 && player.dashTimer <= 0) {
    player.facing = moveDir > 0 ? 1 : -1;
  }

  if ((input.shootJustPressed || input.shootHeld) && player.shootCooldown <= 0) {
    fireWeapon(sim, player, moveDir, input.up);
  }

  // Agile Omnidirectional Dash
  if (
    input.dashJustPressed &&
    player.dashTimer <= 0 &&
    player.dashCooldown <= 0 &&
    (player.onGround || player.canAirDash)
  ) {
    player.dashTimer = PHYSICS.DASH_DURATION;
    player.dashCooldown = spec.dashCooldown;
    player.gliding = false;

    if (input.up && moveDir !== 0) {
      player.dashVx = moveDir * PHYSICS.DASH_SPEED * 0.74;
      player.dashVy = -PHYSICS.DASH_SPEED * 0.68;
    } else if (input.up && moveDir === 0) {
      player.dashVx = 0;
      player.dashVy = -PHYSICS.DASH_SPEED * 0.86;
    } else {
      const dashDir = moveDir !== 0 ? moveDir : player.facing;
      player.dashVx = dashDir * PHYSICS.DASH_SPEED;
      player.dashVy = 0;
    }

    if (!player.onGround) player.canAirDash = false;
    player.vx = player.dashVx;
    player.vy = player.dashVy;
    player.squashX = Math.abs(player.dashVx) > Math.abs(player.dashVy) ? 1.36 : 0.78;
    player.squashY = Math.abs(player.dashVx) > Math.abs(player.dashVy) ? 0.72 : 1.32;
    sim.events.push({
      type: 'dash',
      x: player.x + player.w / 2,
      y: player.y + player.h / 2,
      color: player.id === 'asche' ? '#EF4444' : '#F4F4F5',
    });
  }

  if (player.dashTimer > 0) {
    player.dashTimer -= dt;
    player.vx = player.dashVx;
    player.vy = player.dashVy;
  } else {
    const accel = player.onGround ? PHYSICS.GROUND_ACCEL : PHYSICS.AIR_ACCEL;
    const decel = player.onGround ? PHYSICS.GROUND_DECEL : PHYSICS.AIR_DECEL;
    const targetVx = moveDir * spec.maxRunSpeed;

    if (moveDir !== 0) {
      if (player.vx < targetVx) player.vx = Math.min(targetVx, player.vx + accel * dt);
      else if (player.vx > targetVx) player.vx = Math.max(targetVx, player.vx - accel * dt);
    } else {
      if (player.vx > 0) player.vx = Math.max(0, player.vx - decel * dt);
      else if (player.vx < 0) player.vx = Math.min(0, player.vx + decel * dt);
    }

    if (player.jumpBufferTimer > 0) {
      if (player.coyoteTimer > 0) {
        player.vy = PHYSICS.JUMP_VY;
        player.onGround = false;
        player.coyoteTimer = 0;
        player.jumpBufferTimer = 0;
        player.squashX = 0.82;
        player.squashY = 1.22;
        sim.events.push({
          type: 'jump',
          x: player.x + player.w / 2,
          y: player.y + player.h,
          color: '#E4E4E7',
        });
      } else if (player.onWall !== 0) {
        player.vy = PHYSICS.WALL_JUMP_VY;
        player.vx = -player.onWall * PHYSICS.WALL_JUMP_VX;
        player.facing = (-player.onWall) as 1 | -1;
        player.jumpBufferTimer = 0;
        player.airJumpsLeft = spec.airJumps;
        player.canAirDash = true;
        player.squashX = 0.8;
        player.squashY = 1.24;
        sim.events.push({
          type: 'jump',
          x: player.x + (player.onWall > 0 ? player.w : 0),
          y: player.y + player.h / 2,
          color: '#E4E4E7',
        });
      } else if (player.airJumpsLeft > 0) {
        player.airJumpsLeft -= 1;
        player.vy = PHYSICS.DOUBLE_JUMP_VY;
        player.jumpBufferTimer = 0;
        player.squashX = 0.78;
        player.squashY = 1.26;
        sim.events.push({
          type: 'double_jump',
          x: player.x + player.w / 2,
          y: player.y + player.h,
          color: player.id === 'asche' ? '#EF4444' : '#FFFFFF',
        });
      }
    }

    if (input.jumpJustReleased && player.vy < -120) {
      player.vy *= PHYSICS.JUMP_CUT_MULT;
    }

    let grav = player.vy > 0 ? PHYSICS.GRAVITY * PHYSICS.FALL_GRAVITY_MULT : PHYSICS.GRAVITY;
    if (input.down && !player.onGround && player.vy > 0) {
      grav = PHYSICS.GRAVITY * PHYSICS.FAST_FALL_MULT;
    }
    player.vy = Math.min(PHYSICS.MAX_FALL_SPEED, player.vy + grav * dt);

    // KRON's Unique Glide Ability: Hold Jump while falling in mid-air
    if (spec.canGlide && !player.onGround && input.jumpHeld && !input.down && player.vy > PHYSICS.GLIDE_FALL_SPEED) {
      player.vy = PHYSICS.GLIDE_FALL_SPEED;
      player.gliding = true;
    } else {
      player.gliding = false;
    }

    if (player.onWall !== 0 && !player.onGround && player.vy > PHYSICS.WALL_SLIDE_SPEED) {
      if ((player.onWall === -1 && input.left) || (player.onWall === 1 && input.right)) {
        player.vy = PHYSICS.WALL_SLIDE_SPEED;
        player.gliding = false;
      }
    }
  }

  // Horizontal integration
  player.x += player.vx * dt;
  player.onWall = 0;

  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  } else if (player.x + player.w > sim.level.width) {
    player.x = sim.level.width - player.w;
    player.vx = 0;
  }

  // Boss arena left boundary once boss awakens so player can't walk out mid-fight
  if (sim.boss && sim.boss.active && !sim.boss.defeated && player.x < sim.boss.arenaMinX) {
    player.x = sim.boss.arenaMinX;
    player.vx = 0;
  }

  for (const s of solids) {
    if (rectsOverlap(player, s)) {
      if (player.vx > 0) {
        player.x = s.x - player.w;
        player.vx = 0;
        player.onWall = 1;
      } else if (player.vx < 0) {
        player.x = s.x + s.w;
        player.vx = 0;
        player.onWall = -1;
      }
    }
  }

  if (player.onWall === 0 && !player.onGround) {
    const leftProbe: Rect = { x: player.x - 2, y: player.y + 4, w: 2, h: player.h - 8 };
    const rightProbe: Rect = { x: player.x + player.w, y: player.y + 4, w: 2, h: player.h - 8 };
    for (const s of solids) {
      if (rectsOverlap(leftProbe, s)) {
        player.onWall = -1;
        break;
      }
      if (rectsOverlap(rightProbe, s)) {
        player.onWall = 1;
        break;
      }
    }
  }

  // Vertical integration + strict anti-cheat ceiling boundary (y >= 0)
  const prevBottom = player.y + player.h;
  const wasOnGround = player.onGround;
  player.y += player.vy * dt;
  if (player.y < 0) {
    player.y = 0;
    if (player.vy < 0) player.vy = 0;
  }
  player.onGround = false;

  for (const s of solids) {
    if (rectsOverlap(player, s)) {
      if (player.vy >= 0) {
        player.y = s.y - player.h;
        if (!wasOnGround && player.vy > 220) {
          player.squashX = 1.24;
          player.squashY = 0.76;
          sim.events.push({
            type: 'land',
            x: player.x + player.w / 2,
            y: player.y + player.h,
            color: '#A1A1AA',
          });
        }
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0) {
        player.y = s.y + s.h;
        player.vy = 0;
      }
    }
  }

  if (player.vy >= 0 && !input.down) {
    for (const ow of oneWays) {
      if (
        prevBottom <= ow.y + 6 &&
        player.y + player.h >= ow.y &&
        player.x + player.w > ow.x &&
        player.x < ow.x + ow.w
      ) {
        player.y = ow.y - player.h;
        if (!wasOnGround && player.vy > 220) {
          player.squashX = 1.2;
          player.squashY = 0.8;
          sim.events.push({
            type: 'land',
            x: player.x + player.w / 2,
            y: player.y + player.h,
            color: '#A1A1AA',
          });
        }
        player.vy = 0;
        player.onGround = true;
      }
    }
  }

  if (player.onGround) {
    const footProbe: Rect = { x: player.x + 4, y: player.y + player.h, w: player.w - 8, h: 4 };
    const onStaticFloor = sim.level.platforms.some(
      (pl) => pl.kind === 'solid' && rectsOverlap(footProbe, pl),
    );
    if (onStaticFloor) {
      sim.lastSafePos = {
        x: Math.max(12, Math.min(sim.level.width - player.w - 12, player.x)),
        y: player.y,
      };
    }
  }

  if (player.onGround && Math.abs(player.vx) > 20) {
    player.walkPhase += Math.abs(player.vx) * dt * 0.08;
  }

  for (const bp of sim.level.bouncePads) {
    if (rectsOverlap(player, bp) && player.vy >= -80) {
      player.vy = -bp.power;
      player.onGround = false;
      player.canAirDash = true;
      player.airJumpsLeft = spec.airJumps;
      player.gliding = false;
      player.squashX = 0.76;
      player.squashY = 1.3;
      sim.events.push({
        type: 'bounce',
        x: bp.x + bp.w / 2,
        y: bp.y,
        color: '#EF4444',
      });
    }
  }

  updateScarfTrail(player, sim.elapsedSeconds, dt);

  if (player.y > sim.level.height + 60) {
    damageActivePlayer(sim, true);
  }
}

function updateBuddyFollower(sim: WorldSimulation, dt: number): void {
  const active = getActivePlayer(sim);
  const partner = sim.players[sim.activeCharIndex === 0 ? 1 : 0];
  if (!sim.partnerPresent || !active.alive) {
    partner.alive = false;
    return;
  }
  partner.alive = true;

  sim.activeTrailHistory.push({
    x: active.x,
    y: active.y + active.h - partner.h,
    facing: active.facing,
    onGround: active.onGround,
    vx: active.vx,
    vy: active.vy,
  });
  if (sim.activeTrailHistory.length > 18) {
    sim.activeTrailHistory.shift();
  }

  const sample = sim.activeTrailHistory[0];
  const targetX = Math.max(
    8,
    Math.min(sim.level.width - partner.w - 8, sample.x - sample.facing * 32),
  );
  const targetY = sample.y;

  const lerp = 1 - Math.exp(-16 * dt);
  const prevX = partner.x;
  partner.x += (targetX - partner.x) * lerp;
  partner.y += (targetY - partner.y) * lerp;
  partner.vx = (partner.x - prevX) / Math.max(0.001, dt);
  partner.vy = sample.vy;
  partner.facing = sample.facing;
  partner.onGround = sample.onGround;
  partner.gliding = false;
  if (partner.onGround && Math.abs(partner.vx) > 20) {
    partner.walkPhase += Math.abs(partner.vx) * dt * 0.08;
  }
  updateScarfTrail(partner, sim.elapsedSeconds + 0.35, dt);
}

function damageEnemy(sim: WorldSimulation, enemy: EnemyRuntime, dmg: number, activePlayer: PlayerState): void {
  enemy.hp -= dmg;
  enemy.hitFlashTimer = 0.11;
  if (enemy.hp <= 0) {
    enemy.alive = false;
    enemy.state = 'idle';
    const reward =
      enemy.type === 'shield_enforcer' || enemy.type === 'mortar_spitter'
        ? 200
        : enemy.type === 'pulse_turret' || enemy.type === 'stalker_crawler'
          ? 160
          : 120;
    sim.totalScore += reward;
    sim.hitstopTimer = Math.max(sim.hitstopTimer, 0.035);
    sim.trauma = Math.min(1, sim.trauma + 0.32);
    if (!activePlayer.onGround) {
      activePlayer.airJumpsLeft = Math.max(activePlayer.airJumpsLeft, 1);
    }
    addBloodDecalNear(sim, enemy.x + enemy.w / 2, enemy.y + enemy.h, 3);
    sim.events.push({
      type: 'enemy_kill',
      x: enemy.x + enemy.w / 2,
      y: enemy.y + enemy.h / 2,
      color: '#EF4444',
    });
  } else {
    addBloodDecalNear(sim, enemy.x + enemy.w / 2, enemy.y + enemy.h, 1);
    sim.events.push({
      type: 'enemy_hit',
      x: enemy.x + enemy.w / 2,
      y: enemy.y + enemy.h / 2,
      color: '#F4F4F5',
    });
  }
}

function damageBoss(sim: WorldSimulation, boss: BossState, dmg: number, hitX: number, hitY: number): void {
  if (!boss.active || boss.defeated || boss.state === 'dying') return;
  boss.hp = Math.max(0, boss.hp - dmg);
  boss.hitFlashTimer = 0.09;
  addBloodDecalNear(sim, hitX, hitY, 2);

  const ratio = boss.hp / boss.maxHp;
  const nextPhase: 1 | 2 | 3 = ratio <= 0.33 ? 3 : ratio <= 0.66 ? 2 : 1;
  if (nextPhase !== boss.phase) {
    boss.phase = nextPhase;
    sim.trauma = Math.min(1, sim.trauma + 0.55);
    sim.events.push({
      type: 'boss_roar',
      x: boss.x + boss.w / 2,
      y: boss.y + boss.h / 2,
      color: '#EF4444',
    });
  }

  if (boss.hp <= 0) {
    boss.state = 'dying';
    boss.stateTimer = 1.1;
    boss.hitFlashTimer = 0.3;
    sim.hitstopTimer = Math.max(sim.hitstopTimer, 0.075);
    sim.trauma = 1;
    sim.totalScore += 2500;
    addBloodDecalNear(sim, boss.x + boss.w / 2, boss.y + boss.h, 6);
    sim.events.push({
      type: 'boss_defeat',
      x: boss.x + boss.w / 2,
      y: boss.y + boss.h / 2,
      color: '#FFFFFF',
    });
  } else {
    sim.events.push({
      type: 'boss_hit',
      x: hitX,
      y: hitY,
      color: '#EF4444',
    });
  }
}

function triggerMortarExplosion(
  sim: WorldSimulation,
  cx: number,
  cy: number,
  radius: number,
  damage: number,
  activePlayer: PlayerState,
): void {
  sim.trauma = Math.min(1, sim.trauma + 0.36);
  sim.events.push({ type: 'explosion', x: cx, y: cy, color: '#EF4444' });

  for (const enemy of sim.enemies) {
    if (!enemy.alive || enemy.type === 'saw_slider') continue;
    const ex = enemy.x + enemy.w / 2;
    const ey = enemy.y + enemy.h / 2;
    if (Math.hypot(ex - cx, ey - cy) <= radius + Math.max(enemy.w, enemy.h) * 0.5) {
      damageEnemy(sim, enemy, damage, activePlayer);
    }
  }

  if (sim.boss && sim.boss.active && !sim.boss.defeated) {
    const bx = sim.boss.x + sim.boss.w / 2;
    const by = sim.boss.y + sim.boss.h / 2;
    if (Math.hypot(bx - cx, by - cy) <= radius + sim.boss.w * 0.55) {
      damageBoss(sim, sim.boss, damage, cx, cy);
    }
  }
}

function stepProjectiles(sim: WorldSimulation, dt: number, solids: Rect[]): void {
  const activePlayer = getActivePlayer(sim);

  for (const proj of sim.projectiles) {
    if (!proj.active) continue;
    proj.life -= dt;
    if (proj.life <= 0) {
      if (proj.splashRadius > 0) {
        triggerMortarExplosion(sim, proj.x, proj.y, proj.splashRadius, proj.damage, activePlayer);
      }
      proj.active = false;
      continue;
    }

    proj.vy += proj.gravity * dt;
    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;

    if (proj.trail) {
      proj.trail.push({ x: proj.x, y: proj.y });
      if (proj.trail.length > 6) proj.trail.shift();
    }

    if (proj.x < 0 || proj.x > sim.level.width || proj.y < -40 || proj.y > sim.level.height + 40) {
      proj.active = false;
      continue;
    }

    const pRect: Rect = {
      x: proj.x - proj.radius,
      y: proj.y - proj.radius,
      w: proj.radius * 2,
      h: proj.radius * 2,
    };

    let hitHandled = false;
    for (const enemy of sim.enemies) {
      if (!enemy.alive || proj.hitEnemyIds.includes(enemy.id)) continue;
      if (rectsOverlap(pRect, enemy)) {
        proj.hitEnemyIds.push(enemy.id);

        if (proj.splashRadius > 0) {
          proj.active = false;
          triggerMortarExplosion(sim, proj.x, proj.y, proj.splashRadius, proj.damage, activePlayer);
          hitHandled = true;
          break;
        }

        if (enemy.type === 'saw_slider') {
          proj.active = false;
          hitHandled = true;
          sim.events.push({ type: 'ricochet', x: proj.x, y: proj.y, color: '#FFFFFF' });
        } else if (
          enemy.type === 'shield_enforcer' &&
          proj.weapon !== 'harpoon' &&
          ((enemy.dir > 0 && proj.vx < 0) || (enemy.dir < 0 && proj.vx > 0))
        ) {
          // Shield blocks non-piercing frontal hits!
          proj.active = false;
          hitHandled = true;
          sim.events.push({ type: 'ricochet', x: proj.x, y: proj.y, color: '#FFFFFF' });
        } else {
          damageEnemy(sim, enemy, proj.damage, activePlayer);
          if (proj.pierce > 0) {
            proj.pierce -= 1;
          } else {
            proj.active = false;
            hitHandled = true;
          }
        }
        if (hitHandled) break;
      }
    }
    if (!proj.active) continue;

    // Boss collision
    if (sim.boss && sim.boss.active && !sim.boss.defeated && !proj.hitEnemyIds.includes('__boss__')) {
      if (rectsOverlap(pRect, sim.boss)) {
        proj.hitEnemyIds.push('__boss__');
        if (proj.splashRadius > 0) {
          proj.active = false;
          triggerMortarExplosion(sim, proj.x, proj.y, proj.splashRadius, proj.damage, activePlayer);
          continue;
        }
        damageBoss(sim, sim.boss, proj.damage, proj.x, proj.y);
        if (proj.pierce > 0) {
          proj.pierce -= 1;
        } else {
          proj.active = false;
          continue;
        }
      }
    }

    for (const s of solids) {
      if (rectsOverlap(pRect, s)) {
        proj.active = false;
        if (proj.splashRadius > 0) {
          triggerMortarExplosion(sim, proj.x, proj.y, proj.splashRadius, proj.damage, activePlayer);
        } else {
          sim.events.push({ type: 'ricochet', x: proj.x, y: proj.y, color: '#A1A1AA' });
        }
        break;
      }
    }
  }

  if (sim.projectiles.length > 72) {
    sim.projectiles = sim.projectiles.filter((p) => p.active);
  }
}

function stepEnemyProjectiles(sim: WorldSimulation, dt: number, solids: Rect[]): void {
  const activePlayer = getActivePlayer(sim);
  for (const ep of sim.enemyProjectiles) {
    if (!ep.active) continue;
    ep.life -= dt;
    if (ep.life <= 0) {
      ep.active = false;
      continue;
    }

    ep.vy += ep.gravity * dt;
    ep.x += ep.vx * dt;
    ep.y += ep.vy * dt;

    if (ep.x < 0 || ep.x > sim.level.width || ep.y < -60 || ep.y > sim.level.height + 60) {
      ep.active = false;
      continue;
    }

    const r: Rect = { x: ep.x - ep.radius, y: ep.y - ep.radius, w: ep.radius * 2, h: ep.radius * 2 };
    if (activePlayer.alive && activePlayer.dashTimer <= 0 && rectsOverlap(activePlayer, r)) {
      ep.active = false;
      damageActivePlayer(sim, false);
      continue;
    }

    for (const s of solids) {
      if (rectsOverlap(r, s)) {
        ep.active = false;
        if (ep.kind === 'bio_orb') {
          addBloodDecalNear(sim, ep.x, ep.y, 1);
        }
        break;
      }
    }
  }

  if (sim.enemyProjectiles.length > 48) {
    sim.enemyProjectiles = sim.enemyProjectiles.filter((p) => p.active);
  }
}

function stepBoss(sim: WorldSimulation, dt: number): void {
  const boss = sim.boss;
  if (!boss) return;

  const activePlayer = getActivePlayer(sim);
  const playerCx = activePlayer.x + activePlayer.w / 2;
  const playerCy = activePlayer.y + activePlayer.h / 2;

  if (boss.hitFlashTimer > 0) {
    boss.hitFlashTimer = Math.max(0, boss.hitFlashTimer - dt);
  }

  if (boss.defeated) {
    return;
  }

  // Dying dissolution sequence
  if (boss.state === 'dying') {
    boss.stateTimer -= dt;
    if (Math.random() < 0.5) {
      sim.events.push({
        type: 'explosion',
        x: boss.x + Math.random() * boss.w,
        y: boss.y + Math.random() * boss.h,
        color: '#EF4444',
      });
    }
    if (boss.stateTimer <= 0) {
      boss.defeated = true;
      boss.active = false;
    }
    return;
  }

  // Wake up when player enters Boss Arena
  if (!boss.active) {
    if (activePlayer.alive && activePlayer.x >= boss.triggerX) {
      boss.active = true;
      boss.state = 'idle';
      boss.stateTimer = 0.85;
      sim.trauma = Math.min(1, sim.trauma + 0.65);
      sim.events.push({
        type: 'boss_roar',
        x: boss.x + boss.w / 2,
        y: boss.y + boss.h / 2,
        color: '#EF4444',
      });
    }
    return;
  }

  const bossCx = boss.x + boss.w / 2;
  const bossCy = boss.y + boss.h / 2;

  // Animate articulated biomechanical scythe-claws
  for (let i = 0; i < boss.tentacles.length; i++) {
    const ten = boss.tentacles[i];
    ten.angle += dt * (2.0 + boss.phase * 0.65) * (i % 2 === 0 ? 1 : -1);
    ten.striking = boss.state === 'slam' || boss.state === 'telegraph_slam' || boss.state === 'beam';
    if (boss.state === 'telegraph_slam' || boss.state === 'slam') {
      const targetSlot = boss.slamTargets[i % Math.max(1, boss.slamTargets.length)] ?? boss.targetX;
      ten.targetX = targetSlot + ((i % 2 === 0 ? -1 : 1) * 14);
      ten.targetY = boss.floorY;
    } else if (boss.state === 'telegraph_beam' || boss.state === 'beam') {
      const side = i % 2 === 0 ? -1 : 1;
      ten.targetX = bossCx + side * 88;
      ten.targetY = bossCy + 28 + Math.sin(sim.elapsedSeconds * 8 + i) * 14;
    } else {
      ten.targetX = bossCx + Math.cos(ten.angle) * ten.length;
      ten.targetY = bossCy + Math.sin(ten.angle) * (ten.length * 0.72);
    }
  }

  boss.stateTimer -= dt;
  const phaseSpeed = boss.phase === 3 ? 1.48 : boss.phase === 2 ? 1.22 : 1.0;

  if (boss.state === 'idle') {
    const desiredX = Math.max(
      boss.arenaMinX + 150,
      Math.min(boss.arenaMaxX - boss.w - 40, boss.anchorX + Math.sin(sim.elapsedSeconds * 1.45) * 145),
    );
    const desiredY = boss.anchorY + Math.sin(sim.elapsedSeconds * 2.5) * 24;
    boss.x += (desiredX - boss.x) * Math.min(1, dt * 2.6 * phaseSpeed);
    boss.y += (desiredY - boss.y) * Math.min(1, dt * 3.1);

    if (boss.stateTimer <= 0) {
      boss.attackCycle = (boss.attackCycle + 1) % 4;
      if (boss.attackCycle === 0) {
        // 1. Multi-Claw Twin / Triple Floor Slam
        boss.state = 'telegraph_slam';
        boss.stateTimer = 0.66 / phaseSpeed;
        const primaryX = Math.max(boss.arenaMinX + 75, Math.min(boss.arenaMaxX - 75, playerCx));
        const secondaryX = Math.max(
          boss.arenaMinX + 75,
          Math.min(boss.arenaMaxX - 75, primaryX + (primaryX > (boss.arenaMinX + boss.arenaMaxX) / 2 ? -175 : 175)),
        );
        boss.targetX = primaryX;
        boss.targetY = boss.floorY;
        boss.slamTargets =
          boss.phase === 3
            ? [primaryX, secondaryX, Math.round((boss.arenaMinX + boss.arenaMaxX) / 2)]
            : [primaryX, secondaryX];
        for (const sx of boss.slamTargets) {
          sim.events.push({ type: 'enemy_telegraph', x: sx, y: boss.floorY - 24, color: '#EF4444' });
        }
      } else if (boss.attackCycle === 1) {
        // 2. Crimson Annihilation Beam Sweep
        boss.state = 'telegraph_beam';
        boss.stateTimer = 0.72 / phaseSpeed;
        boss.beamSweepDir = playerCx >= bossCx ? 1 : -1;
        boss.beamX = Math.max(boss.arenaMinX + 55, Math.min(boss.arenaMaxX - 55, playerCx - boss.beamSweepDir * 130));
        sim.events.push({ type: 'turret_windup', x: bossCx, y: bossCy + 20, color: '#FFFFFF' });
      } else if (boss.attackCycle === 2) {
        // 3. Plasma Bolt & Bio-Orb Fan Volley
        boss.state = 'telegraph_volley';
        boss.stateTimer = 0.54 / phaseSpeed;
        sim.events.push({ type: 'enemy_telegraph', x: bossCx, y: bossCy, color: '#FFFFFF' });
      } else {
        // 4. Serrated Wing-Blade Arena Surge
        boss.state = 'telegraph_surge';
        boss.stateTimer = 0.62 / phaseSpeed;
        boss.targetX = playerCx < bossCx ? boss.arenaMinX + 38 : boss.arenaMaxX - boss.w - 38;
        boss.targetY = boss.floorY - boss.h - 4;
        sim.events.push({ type: 'boss_roar', x: bossCx, y: bossCy, color: '#EF4444' });
      }
    }
  } else if (boss.state === 'telegraph_slam') {
    if (boss.stateTimer <= 0) {
      boss.state = 'slam';
      boss.stateTimer = 0.4;
      sim.trauma = Math.min(1, sim.trauma + 0.55);
      for (const sx of boss.slamTargets) {
        addBloodDecalNear(sim, sx, boss.floorY, 2);
        sim.events.push({ type: 'boss_slam', x: sx, y: boss.floorY, color: '#EF4444' });
      }
    }
  } else if (boss.state === 'slam') {
    for (const sx of boss.slamTargets) {
      const slamZone: Rect = {
        x: sx - 48,
        y: boss.floorY - 132,
        w: 96,
        h: 136,
      };
      if (activePlayer.alive && activePlayer.dashTimer <= 0 && rectsOverlap(activePlayer, slamZone)) {
        damageActivePlayer(sim, false);
        break;
      }
    }
    if (boss.stateTimer <= 0) {
      boss.state = 'idle';
      boss.stateTimer = 0.9 / phaseSpeed;
    }
  } else if (boss.state === 'telegraph_beam') {
    // Track boss gently above center during beam lock-on
    const midArenaX = (boss.arenaMinX + boss.arenaMaxX) / 2 - boss.w / 2;
    boss.x += (midArenaX - boss.x) * Math.min(1, dt * 3.5);
    boss.y += (boss.anchorY - 22 - boss.y) * Math.min(1, dt * 4);
    if (boss.stateTimer <= 0) {
      boss.state = 'beam';
      boss.stateTimer = 0.92;
      sim.events.push({ type: 'turret_fire', x: bossCx, y: bossCy + 20, color: '#EF4444' });
    }
  } else if (boss.state === 'beam') {
    boss.beamX += boss.beamSweepDir * (285 * phaseSpeed) * dt;
    if (boss.beamX <= boss.arenaMinX + 40) {
      boss.beamX = boss.arenaMinX + 40;
      boss.beamSweepDir = 1;
    } else if (boss.beamX >= boss.arenaMaxX - 40) {
      boss.beamX = boss.arenaMaxX - 40;
      boss.beamSweepDir = -1;
    }
    // Check player hit along angled beam from boss core down to floor (sampling 6 segments)
    const originX = bossCx;
    const originY = bossCy + 16;
    const endX = boss.beamX;
    const endY = boss.floorY;
    if (activePlayer.alive && activePlayer.dashTimer <= 0) {
      for (let s = 1; s <= 6; s++) {
        const u = s / 6;
        const px = originX + (endX - originX) * u;
        const py = originY + (endY - originY) * u;
        const segRect: Rect = { x: px - 14, y: py - 14, w: 28, h: 28 };
        if (rectsOverlap(activePlayer, segRect)) {
          damageActivePlayer(sim, false);
          break;
        }
      }
    }
    if (boss.stateTimer <= 0) {
      boss.state = 'idle';
      boss.stateTimer = 0.95 / phaseSpeed;
    }
  } else if (boss.state === 'telegraph_volley') {
    if (boss.stateTimer <= 0) {
      const boltCount = boss.phase === 3 ? 7 : boss.phase === 2 ? 5 : 4;
      const aimBase = Math.atan2(playerCy - bossCy, playerCx - bossCx);
      for (let i = 0; i < boltCount; i++) {
        const spread = (i / (boltCount - 1) - 0.5) * 0.95;
        const ang = aimBase + spread;
        sim.enemyProjectiles.push({
          id: `ep-boss-${++projectileSeq}`,
          x: bossCx,
          y: bossCy + 10,
          vx: Math.cos(ang) * (350 + boss.phase * 35),
          vy: Math.sin(ang) * (350 + boss.phase * 35),
          gravity: i % 2 === 0 ? 180 : 0,
          radius: i % 2 === 0 ? 8 : 6,
          life: 2.8,
          active: true,
          kind: i % 2 === 0 ? 'bio_orb' : 'bolt',
        });
      }
      if (boss.phase >= 2) {
        const activeMinions = sim.enemies.filter((e) => e.alive && e.x >= boss.arenaMinX).length;
        if (activeMinions < 2) {
          sim.enemies.push({
            id: `boss-minion-${++projectileSeq}`,
            type: boss.phase === 3 ? 'hunter_wasp' : 'stalker_crawler',
            x: bossCx - 16,
            y: boss.phase === 3 ? boss.y + 40 : boss.floorY - 28,
            w: 32,
            h: 26,
            patrolMinX: boss.arenaMinX + 30,
            patrolMaxX: boss.arenaMaxX - 50,
            speed: 150,
            dir: playerCx >= boss.x ? 1 : -1,
            phaseTimer: 0,
            state: 'idle',
            hp: 2,
            maxHp: 2,
            hitFlashTimer: 0,
            alive: true,
            originY: boss.y + 40,
            attackVx: 0,
            attackVy: 0,
          });
        }
      }
      boss.state = 'idle';
      boss.stateTimer = 0.95 / phaseSpeed;
    }
  } else if (boss.state === 'telegraph_surge') {
    boss.y += (boss.targetY - boss.y) * Math.min(1, dt * 6.2);
    if (boss.stateTimer <= 0) {
      boss.state = 'surge';
      boss.stateTimer = 0.85;
    }
  } else if (boss.state === 'surge') {
    const dir = boss.targetX >= boss.x ? 1 : -1;
    boss.x += dir * (435 * phaseSpeed) * dt;
    if (Math.abs(boss.x - boss.targetX) < 18 || boss.stateTimer <= 0) {
      boss.state = 'idle';
      boss.stateTimer = 1.0 / phaseSpeed;
    }
  }

  // Contact damage with Boss Armored Core
  const bossBody: Rect = { x: boss.x + 12, y: boss.y + 12, w: boss.w - 24, h: boss.h - 24 };
  if (activePlayer.alive && activePlayer.dashTimer <= 0 && rectsOverlap(activePlayer, bossBody)) {
    damageActivePlayer(sim, false);
  }
}

export function stepWorldSimulation(
  sim: WorldSimulation,
  rawDt: number,
  input: InputSnapshot,
): void {
  const dt = Math.min(rawDt, 0.05);
  sim.events = [];

  if (sim.stageCompleted) return;

  sim.trauma = Math.max(0, sim.trauma - dt * 1.9);

  if (sim.hitstopTimer > 0) {
    sim.hitstopTimer = Math.max(0, sim.hitstopTimer - dt);
    return;
  }

  sim.elapsedSeconds += dt;

  // Weapon Switch (1-4 or C/LT)
  if (input.weaponSelect && input.weaponSelect !== sim.activeWeapon) {
    sim.activeWeapon = input.weaponSelect;
    const ap = getActivePlayer(sim);
    sim.events.push({ type: 'weapon_switch', x: ap.x + ap.w / 2, y: ap.y, color: '#FFFFFF' });
  } else if (input.weaponCycleJustPressed) {
    const idx = WEAPON_ORDER.indexOf(sim.activeWeapon);
    sim.activeWeapon = WEAPON_ORDER[(idx + 1) % WEAPON_ORDER.length];
    const ap = getActivePlayer(sim);
    sim.events.push({ type: 'weapon_switch', x: ap.x + ap.w / 2, y: ap.y, color: '#FFFFFF' });
  }

  // DKC-Style Tag-Team Switch (Tab / Q / Y)
  if (input.switchJustPressed && sim.partnerPresent) {
    const oldActive = getActivePlayer(sim);
    const nextIdx: 0 | 1 = sim.activeCharIndex === 0 ? 1 : 0;
    const nextActive = sim.players[nextIdx];
    const nextSpec = CHARACTER_SPECS[nextActive.id];

    const oldBottom = oldActive.y + oldActive.h;
    const oldCenterX = oldActive.x + oldActive.w / 2;

    sim.activeCharIndex = nextIdx;
    nextActive.alive = true;
    nextActive.x = Math.max(0, Math.min(sim.level.width - nextActive.w, oldCenterX - nextActive.w / 2));
    nextActive.y = oldBottom - nextSpec.h;
    nextActive.vx = oldActive.vx;
    nextActive.vy = oldActive.vy;
    nextActive.facing = oldActive.facing;
    nextActive.onGround = oldActive.onGround;
    nextActive.canAirDash = oldActive.canAirDash;
    nextActive.airJumpsLeft = nextActive.onGround
      ? nextSpec.airJumps
      : Math.min(nextSpec.airJumps, Math.max(1, oldActive.airJumpsLeft));
    nextActive.invulnTimer = Math.max(nextActive.invulnTimer, 0.25);
    nextActive.squashX = 0.84;
    nextActive.squashY = 1.18;
    resetScarfAt(nextActive);

    sim.events.push({
      type: 'switch_char',
      x: nextActive.x + nextActive.w / 2,
      y: nextActive.y + nextActive.h / 2,
      color: nextActive.id === 'asche' ? '#EF4444' : '#FFFFFF',
    });
  }

  const activePlayer = getActivePlayer(sim);
  if (input.summonJustPressed && sim.partnerPresent && activePlayer.alive) {
    const partner = sim.players[sim.activeCharIndex === 0 ? 1 : 0];
    partner.x = Math.max(10, Math.min(sim.level.width - partner.w - 10, activePlayer.x - activePlayer.facing * 32));
    partner.y = activePlayer.y + activePlayer.h - partner.h;
    resetScarfAt(partner);
    sim.activeTrailHistory = [];
    sim.events.push({
      type: 'summon',
      x: partner.x + partner.w / 2,
      y: partner.y + partner.h / 2,
      color: '#F4F4F5',
    });
  }

  // 1. Moving platforms
  for (const mp of sim.movingPlatforms) {
    const prevX = mp.x;
    const prevY = mp.y;
    const speed = mp.moveSpeed ?? 1.5;
    const range = mp.moveRange ?? 120;
    const phase = mp.movePhase ?? 0;
    const offset = (Math.sin(sim.elapsedSeconds * speed + phase) * 0.5 + 0.5) * range;
    if (mp.moveAxis === 'x') mp.x = mp.originX + offset;
    else if (mp.moveAxis === 'y') mp.y = mp.originY - offset;
    mp.dx = mp.x - prevX;
    mp.dy = mp.y - prevY;
  }

  // 2. Switches & Blast Gates (including Boss Arena Gate unlock on Boss Defeat)
  for (const sw of sim.switches) {
    const triggerZone: Rect = { x: sw.x - 3, y: sw.y - 5, w: sw.w + 6, h: sw.h + 6 };
    const pressedNow = activePlayer.alive && rectsOverlap(activePlayer, triggerZone);
    const wasPressed = sw.pressed;

    if (sw.mode === 'latch' || sw.mode === 'hold') {
      if (pressedNow) sw.pressed = true;
    } else if (sw.mode === 'timed') {
      if (pressedNow) {
        sw.pressed = true;
        sw.timer = sw.duration ?? 6.5;
      } else if (sw.timer > 0) {
        sw.timer = Math.max(0, sw.timer - dt);
        sw.pressed = sw.timer > 0;
      }
    }

    if (!wasPressed && sw.pressed) {
      sim.events.push({ type: 'switch_on', x: sw.x + sw.w / 2, y: sw.y, color: '#EF4444' });
    }
  }

  for (const gate of sim.gates) {
    const isBossGate = sim.boss?.gateId === gate.id;
    const anyPressed = isBossGate
      ? Boolean(sim.boss?.defeated)
      : sim.switches.some((s) => s.targetGateId === gate.id && s.pressed);
    const target = anyPressed ? 1 : 0;
    const rate = dt * 9.0;
    if (gate.openProgress < target) gate.openProgress = Math.min(target, gate.openProgress + rate);
    else if (gate.openProgress > target) gate.openProgress = Math.max(target, gate.openProgress - rate);
  }

  // 3. Step Active Character, Trailing Buddy, Projectiles & Enemy Projectiles
  const solids = getSolidObstacles(sim);
  const oneWays = getOneWayPlatforms(sim);
  stepActivePlayer(sim, activePlayer, input, dt, solids, oneWays);
  updateBuddyFollower(sim, dt);
  stepProjectiles(sim, dt, solids);
  stepEnemyProjectiles(sim, dt, solids);

  const nowActive = getActivePlayer(sim);
  const nowSpec = CHARACTER_SPECS[nowActive.id];

  // 4. Checkpoints
  for (const cp of sim.level.checkpoints) {
    if (sim.activatedCheckpoints.has(cp.id)) continue;
    const cpRect: Rect = { x: cp.x - 20, y: cp.y - 68, w: 40, h: 72 };
    if (nowActive.alive && rectsOverlap(nowActive, cpRect)) {
      sim.activatedCheckpoints.add(cp.id);
      sim.activeSpawn = { x: cp.x - 14, y: cp.y - PHYSICS.PLAYER_H - 4 };
      sim.events.push({ type: 'checkpoint', x: cp.x, y: cp.y - 34, color: '#FFFFFF' });
    }
  }

  // 5. Gefährten-Kapseln (DKC Buddy Rescue Pods)
  for (const pod of sim.level.buddyPods) {
    if (sim.collectedBuddyPods.has(pod.id)) continue;
    const podRect: Rect = { x: pod.x - 16, y: pod.y - 34, w: 32, h: 36 };
    if (nowActive.alive && rectsOverlap(nowActive, podRect)) {
      sim.collectedBuddyPods.add(pod.id);
      if (!sim.partnerPresent) {
        sim.partnerPresent = true;
        const rescued = sim.players[sim.activeCharIndex === 0 ? 1 : 0];
        rescued.alive = true;
        rescued.x = Math.max(8, nowActive.x - nowActive.facing * 32);
        rescued.y = nowActive.y + nowActive.h - rescued.h;
        rescued.facing = nowActive.facing;
        resetScarfAt(rescued);
        sim.activeTrailHistory = [];
        sim.totalScore += 100;
        sim.events.push({
          type: 'buddy_rescue',
          x: pod.x,
          y: pod.y - 16,
          color: rescued.id === 'asche' ? '#EF4444' : '#FFFFFF',
        });
      } else {
        sim.shardsEarned += 1;
        sim.totalScore += 150;
        sim.events.push({ type: 'crystal', x: pod.x, y: pod.y - 16, color: '#FFFFFF' });
      }
    }
  }

  // 6. Blood Shards
  for (const crystal of sim.level.crystals) {
    if (sim.collectedCrystals.has(crystal.id)) continue;
    const cRect: Rect = {
      x: crystal.x - crystal.radius,
      y: crystal.y - crystal.radius,
      w: crystal.radius * 2,
      h: crystal.radius * 2,
    };
    if (nowActive.alive && rectsOverlap(nowActive, cRect)) {
      sim.collectedCrystals.add(crystal.id);
      sim.shardsEarned += 1;
      sim.events.push({ type: 'crystal', x: crystal.x, y: crystal.y, color: '#EF4444' });
    }
  }

  // 7. Step 7 Distinct Enemy Archetypes
  const pCx = nowActive.x + nowActive.w / 2;
  const pCy = nowActive.y + nowActive.h / 2;

  for (const enemy of sim.enemies) {
    if (!enemy.alive) continue;
    if (enemy.hitFlashTimer > 0) enemy.hitFlashTimer = Math.max(0, enemy.hitFlashTimer - dt);

    const eCx = enemy.x + enemy.w / 2;
    const eCy = enemy.y + enemy.h / 2;
    const distX = pCx - eCx;
    const distY = pCy - eCy;

    if (enemy.type === 'patrol_drone' || enemy.type === 'saw_slider') {
      const minX = enemy.patrolMinX ?? enemy.x - 60;
      const maxX = enemy.patrolMaxX ?? enemy.x + 60;
      enemy.x += enemy.dir * enemy.speed * dt;
      if (enemy.x <= minX) {
        enemy.x = minX;
        enemy.dir = 1;
      } else if (enemy.x >= maxX) {
        enemy.x = maxX;
        enemy.dir = -1;
      }
    } else if (enemy.type === 'pulse_turret') {
      enemy.phaseTimer += dt;
      const cycle = enemy.fireInterval ?? 3.0;
      const idleWindow = Math.max(0.6, cycle - PHYSICS.TURRET_WINDUP_SEC - PHYSICS.TURRET_FIRE_SEC);

      if (enemy.state === 'idle' && enemy.phaseTimer >= idleWindow) {
        enemy.state = 'windup';
        enemy.phaseTimer = 0;
        sim.events.push({ type: 'turret_windup', x: eCx, y: enemy.y + enemy.h });
      } else if (enemy.state === 'windup' && enemy.phaseTimer >= PHYSICS.TURRET_WINDUP_SEC) {
        enemy.state = 'firing';
        enemy.phaseTimer = 0;
        sim.events.push({ type: 'turret_fire', x: eCx, y: enemy.y + enemy.h });
      } else if (enemy.state === 'firing' && enemy.phaseTimer >= PHYSICS.TURRET_FIRE_SEC) {
        enemy.state = 'idle';
        enemy.phaseTimer = 0;
      }

      if (enemy.state === 'firing') {
        const beamRect: Rect = {
          x: eCx - 5,
          y: enemy.y + enemy.h,
          w: 10,
          h: enemy.laserLength ?? 200,
        };
        if (nowActive.alive && nowActive.dashTimer <= 0 && rectsOverlap(nowActive, beamRect)) {
          damageActivePlayer(sim, false);
        }
      }
      continue;
    } else if (enemy.type === 'stalker_crawler') {
      // Bio-hound: patrols, detects player, crouches/telegraphs, then lunges!
      const minX = enemy.patrolMinX ?? enemy.x - 80;
      const maxX = enemy.patrolMaxX ?? enemy.x + 80;
      if (enemy.state === 'idle') {
        enemy.x += enemy.dir * enemy.speed * dt;
        if (enemy.x <= minX) {
          enemy.x = minX;
          enemy.dir = 1;
        } else if (enemy.x >= maxX) {
          enemy.x = maxX;
          enemy.dir = -1;
        }
        if (nowActive.alive && Math.abs(distX) < 280 && Math.abs(distY) < 95) {
          enemy.dir = distX >= 0 ? 1 : -1;
          enemy.state = 'windup';
          enemy.phaseTimer = 0.36;
          sim.events.push({ type: 'enemy_telegraph', x: eCx, y: eCy, color: '#EF4444' });
        }
      } else if (enemy.state === 'windup') {
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.state = 'charging';
          enemy.phaseTimer = 0.42;
        }
      } else if (enemy.state === 'charging') {
        enemy.x += enemy.dir * 465 * dt;
        enemy.x = Math.max(minX - 24, Math.min(maxX + 24, enemy.x));
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.state = 'recover';
          enemy.phaseTimer = 0.55;
        }
      } else if (enemy.state === 'recover') {
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.state = 'idle';
        }
      }
    } else if (enemy.type === 'mortar_spitter') {
      // Stationary flesh mortar that lobs arcing bio-orbs toward player
      enemy.dir = distX >= 0 ? 1 : -1;
      enemy.phaseTimer += dt;
      const interval = enemy.fireInterval ?? 2.6;
      if (enemy.state === 'idle' && enemy.phaseTimer >= interval && nowActive.alive && Math.abs(distX) < 540) {
        enemy.state = 'windup';
        enemy.phaseTimer = 0;
        sim.events.push({ type: 'enemy_telegraph', x: eCx, y: enemy.y, color: '#DC2626' });
      } else if (enemy.state === 'windup' && enemy.phaseTimer >= 0.48) {
        enemy.state = 'idle';
        enemy.phaseTimer = 0;
        const clampedDist = Math.max(-360, Math.min(360, distX));
        sim.enemyProjectiles.push({
          id: `ep-spit-${++projectileSeq}`,
          x: eCx,
          y: enemy.y + 4,
          vx: clampedDist * 0.95,
          vy: -440,
          gravity: 820,
          radius: 7,
          life: 2.4,
          active: true,
          kind: 'bio_orb',
        });
      }
    } else if (enemy.type === 'shield_enforcer') {
      // Heavy armored guard with frontal riot shield + aimed rifle shot
      const minX = enemy.patrolMinX ?? enemy.x - 60;
      const maxX = enemy.patrolMaxX ?? enemy.x + 60;
      if (enemy.state === 'idle') {
        enemy.x += enemy.dir * enemy.speed * dt;
        if (enemy.x <= minX) {
          enemy.x = minX;
          enemy.dir = 1;
        } else if (enemy.x >= maxX) {
          enemy.x = maxX;
          enemy.dir = -1;
        }
        enemy.phaseTimer += dt;
        const facingPlayer = (enemy.dir > 0 && distX > 0) || (enemy.dir < 0 && distX < 0);
        if (facingPlayer && nowActive.alive && Math.abs(distX) < 420 && Math.abs(distY) < 75 && enemy.phaseTimer >= 1.7) {
          enemy.state = 'windup';
          enemy.phaseTimer = 0.45;
          sim.events.push({ type: 'enemy_telegraph', x: eCx, y: eCy, color: '#FFFFFF' });
        }
      } else if (enemy.state === 'windup') {
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          sim.enemyProjectiles.push({
            id: `ep-bolt-${++projectileSeq}`,
            x: eCx + enemy.dir * 16,
            y: eCy - 2,
            vx: enemy.dir * 520,
            vy: 0,
            gravity: 0,
            radius: 5,
            life: 1.5,
            active: true,
            kind: 'bolt',
          });
          enemy.state = 'recover';
          enemy.phaseTimer = 0.65;
        }
      } else if (enemy.state === 'recover') {
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.state = 'idle';
          enemy.phaseTimer = 0;
        }
      }
    } else if (enemy.type === 'hunter_wasp') {
      // Airborne swooper: figure-8 patrol -> lock-on windup -> diagonal dive!
      const minX = enemy.patrolMinX ?? enemy.x - 90;
      const maxX = enemy.patrolMaxX ?? enemy.x + 90;
      if (enemy.state === 'idle') {
        enemy.x += enemy.dir * enemy.speed * dt;
        if (enemy.x <= minX) {
          enemy.x = minX;
          enemy.dir = 1;
        } else if (enemy.x >= maxX) {
          enemy.x = maxX;
          enemy.dir = -1;
        }
        enemy.y = enemy.originY + Math.sin(sim.elapsedSeconds * 3.4 + enemy.x * 0.02) * 18;
        enemy.phaseTimer += dt;
        if (nowActive.alive && Math.hypot(distX, distY) < 330 && enemy.phaseTimer >= 1.4) {
          enemy.dir = distX >= 0 ? 1 : -1;
          enemy.state = 'windup';
          enemy.phaseTimer = 0.42;
          const mag = Math.hypot(distX, distY) || 1;
          enemy.attackVx = (distX / mag) * 440;
          enemy.attackVy = (distY / mag) * 440;
          sim.events.push({ type: 'enemy_telegraph', x: eCx, y: eCy, color: '#EF4444' });
        }
      } else if (enemy.state === 'windup') {
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.state = 'charging';
          enemy.phaseTimer = 0.5;
        }
      } else if (enemy.state === 'charging') {
        enemy.x += enemy.attackVx * dt;
        enemy.y += enemy.attackVy * dt;
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.state = 'recover';
          enemy.phaseTimer = 0.65;
        }
      } else if (enemy.state === 'recover') {
        enemy.y += (enemy.originY - enemy.y) * Math.min(1, dt * 4.5);
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.state = 'idle';
          enemy.phaseTimer = 0;
        }
      }
    }

    // Contact check with player (KRON Ram-Dash smashes drones, crawlers, wasps & hits shields!)
    const hitbox: Rect = {
      x: enemy.x + 4,
      y: enemy.y + 4,
      w: enemy.w - 8,
      h: enemy.h - 8,
    };
    if (nowActive.alive && rectsOverlap(nowActive, hitbox)) {
      const canRam =
        nowActive.dashTimer > 0 &&
        nowSpec.canRamDrones &&
        enemy.type !== 'saw_slider';
      if (canRam) {
        if (enemy.type === 'shield_enforcer' && enemy.hp > 2) {
          damageEnemy(sim, enemy, 2, nowActive);
          nowActive.dashTimer = 0;
          nowActive.vx = -nowActive.facing * 220;
        } else {
          enemy.alive = false;
          sim.totalScore += 130;
          sim.hitstopTimer = Math.max(sim.hitstopTimer, 0.04);
          sim.trauma = Math.min(1, sim.trauma + 0.35);
          addBloodDecalNear(sim, eCx, enemy.y + enemy.h, 3);
          sim.events.push({ type: 'ram_kill', x: eCx, y: eCy, color: '#FFFFFF' });
        }
      } else if (nowActive.dashTimer <= 0) {
        damageActivePlayer(sim, false);
      }
    }
  }

  // 7b. Step KARNIFEX-09 Blut-Seraph Endboss (Sektor 14)
  stepBoss(sim, dt);

  // 8. Goal Monolith (locked while Boss remains undefeated)
  const bossCleared = !sim.boss || sim.boss.defeated;
  const inGoal = bossCleared && nowActive.alive && rectsOverlap(nowActive, sim.level.goal);
  nowActive.inGoal = inGoal;

  if (inGoal) {
    sim.stageCompleted = true;
    const duoBonus = sim.partnerPresent ? 200 : 0;
    const stageScore =
      calculateStageScore({
        parTimeSeconds: sim.level.parTimeSeconds,
        elapsedSeconds: sim.elapsedSeconds,
        crystalsCollected: sim.collectedCrystals.size,
        totalCrystals: sim.level.crystals.length,
        deaths: sim.deaths,
      }) + duoBonus;
    sim.totalScore += stageScore;
    sim.events.push({
      type: 'stage_clear',
      x: sim.level.goal.x + sim.level.goal.w / 2,
      y: sim.level.goal.y + sim.level.goal.h / 2,
      color: '#F4F4F5',
    });
  }
}
