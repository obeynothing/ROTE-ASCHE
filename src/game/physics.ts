import type {
  EnemyRuntime,
  GateRuntime,
  InputSnapshot,
  LevelDef,
  MovingPlatformRuntime,
  PlayerState,
  Rect,
  SwitchRuntime,
  WorldSimulation,
} from './types';

export const PHYSICS = {
  GRAVITY: 1580,
  FALL_GRAVITY_MULT: 1.18,
  FAST_FALL_MULT: 1.45,
  MAX_FALL_SPEED: 920,
  MAX_RUN_SPEED: 365,
  GROUND_ACCEL: 2900,
  GROUND_DECEL: 3000,
  AIR_ACCEL: 2400,
  AIR_DECEL: 1350,
  JUMP_VY: -615,
  DOUBLE_JUMP_VY: -575,
  MAX_AIR_JUMPS: 1,
  JUMP_CUT_MULT: 0.46,
  COYOTE_TIME: 0.12,
  JUMP_BUFFER_TIME: 0.12,
  WALL_SLIDE_SPEED: 115,
  WALL_JUMP_VX: 365,
  WALL_JUMP_VY: -580,
  DASH_SPEED: 760,
  DASH_DURATION: 0.14,
  DASH_COOLDOWN: 0.28,
  SHOOT_COOLDOWN: 0.21,
  PROJECTILE_SPEED: 940,
  PROJECTILE_LIFE: 0.62,
  PLAYER_W: 28,
  PLAYER_H: 38,
  TURRET_WINDUP_SEC: 0.55,
  TURRET_FIRE_SEC: 0.42,
} as const;

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
};

let projectileSeq = 0;

export function createPlayerState(x: number, y: number): PlayerState {
  const scarfTrail = Array.from({ length: 6 }, () => ({ x: x + 14, y: y + 14 }));
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    w: PHYSICS.PLAYER_W,
    h: PHYSICS.PLAYER_H,
    facing: 1,
    onGround: false,
    onWall: 0,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    airJumpsLeft: PHYSICS.MAX_AIR_JUMPS,
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

export function createWorldSimulation(level: LevelDef, previousScore = 0): WorldSimulation {
  const movingPlatforms: MovingPlatformRuntime[] = level.platforms
    .filter((p) => p.kind === 'moving')
    .map((p) => ({
      ...p,
      originX: p.x,
      originY: p.y,
      dx: 0,
      dy: 0,
    }));

  const switches: SwitchRuntime[] = level.switches.map((s) => ({
    ...s,
    pressed: false,
    timer: 0,
  }));

  const gates: GateRuntime[] = level.gates.map((g) => ({
    ...g,
    openProgress: 0,
  }));

  const enemies: EnemyRuntime[] = level.enemies.map((e) => {
    const maxHp = e.type === 'pulse_turret' ? 3 : e.type === 'patrol_drone' ? 2 : 99;
    return {
      ...e,
      dir: 1,
      phaseTimer: 0,
      state: 'idle',
      hp: maxHp,
      maxHp,
      hitFlashTimer: 0,
      alive: true,
    };
  });

  return {
    level,
    player: createPlayerState(level.spawn.x, level.spawn.y),
    movingPlatforms,
    switches,
    gates,
    enemies,
    projectiles: [],
    collectedCrystals: new Set<string>(),
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

function killPlayer(sim: WorldSimulation): void {
  const player = sim.player;
  if (!player.alive || player.invulnTimer > 0) return;
  player.alive = false;
  player.respawnTimer = 0.6;
  player.hitFlashTimer = 0.14;
  player.vx = 0;
  player.vy = 0;
  sim.deaths += 1;
  sim.hitstopTimer = Math.max(sim.hitstopTimer, 0.06);
  sim.trauma = Math.min(1, sim.trauma + 0.72);
  sim.events.push({
    type: 'hurt',
    x: player.x + player.w / 2,
    y: player.y + player.h / 2,
    color: '#DC2626',
  });
}

function respawnPlayer(sim: WorldSimulation): void {
  const player = sim.player;
  player.x = sim.level.spawn.x;
  player.y = sim.level.spawn.y;
  player.vx = 0;
  player.vy = 0;
  player.alive = true;
  player.onGround = false;
  player.airJumpsLeft = PHYSICS.MAX_AIR_JUMPS;
  player.canAirDash = true;
  player.dashTimer = 0;
  player.invulnTimer = 1.0;
  player.hitFlashTimer = 0;
  player.squashX = 0.8;
  player.squashY = 1.25;
  for (const node of player.scarfTrail) {
    node.x = player.x + player.w / 2;
    node.y = player.y + 14;
  }
}

function updateScarfTrail(player: PlayerState, elapsed: number, dt: number): void {
  const anchorX = player.x + player.w / 2 - player.facing * 4;
  const anchorY = player.y + 13;
  player.scarfTrail[0].x = anchorX;
  player.scarfTrail[0].y = anchorY;

  const follow = 1 - Math.exp(-26 * dt);
  for (let i = 1; i < player.scarfTrail.length; i++) {
    const prev = player.scarfTrail[i - 1];
    const curr = player.scarfTrail[i];
    const targetX = prev.x - player.facing * 4.5;
    const targetY = prev.y + 1.5 + Math.sin(elapsed * 13 + i * 0.9) * 1.2;
    curr.x += (targetX - curr.x) * follow;
    curr.y += (targetY - curr.y) * follow;
  }
}

function stepPlayer(
  sim: WorldSimulation,
  input: InputSnapshot,
  dt: number,
  solids: Rect[],
  oneWays: Rect[],
): void {
  const player = sim.player;
  if (!player.alive) {
    player.respawnTimer -= dt;
    if (player.respawnTimer <= 0) {
      respawnPlayer(sim);
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
    player.airJumpsLeft = PHYSICS.MAX_AIR_JUMPS;
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

  // Weapon: Asche-Pulsblaster (horizontal, diagonal-up, or straight-up aiming)
  if ((input.shootJustPressed || input.shootHeld) && player.shootCooldown <= 0) {
    player.shootCooldown = PHYSICS.SHOOT_COOLDOWN;
    player.recoilTimer = 0.09;

    let dirX = moveDir !== 0 ? moveDir : player.facing;
    let dirY = 0;
    if (input.up && moveDir === 0) {
      dirX = 0;
      dirY = -1;
    } else if (input.up && moveDir !== 0) {
      dirX = moveDir * 0.72;
      dirY = -0.69;
    }

    const muzzleX = player.x + player.w / 2 + dirX * 16;
    const muzzleY = player.y + 15 + dirY * 14;
    sim.projectiles.push({
      id: `p-${++projectileSeq}`,
      x: muzzleX,
      y: muzzleY,
      vx: dirX * PHYSICS.PROJECTILE_SPEED,
      vy: dirY * PHYSICS.PROJECTILE_SPEED,
      radius: 5,
      life: PHYSICS.PROJECTILE_LIFE,
      active: true,
    });
    sim.events.push({
      type: 'shoot',
      x: muzzleX,
      y: muzzleY,
      color: '#EF4444',
    });
  }

  // Agile Omnidirectional Dash (horizontal, upward, or diagonal-up)
  if (
    input.dashJustPressed &&
    player.dashTimer <= 0 &&
    player.dashCooldown <= 0 &&
    (player.onGround || player.canAirDash)
  ) {
    player.dashTimer = PHYSICS.DASH_DURATION;
    player.dashCooldown = PHYSICS.DASH_COOLDOWN;

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
      color: '#F4F4F5',
    });
  }

  if (player.dashTimer > 0) {
    player.dashTimer -= dt;
    player.vx = player.dashVx;
    player.vy = player.dashVy;
  } else {
    const accel = player.onGround ? PHYSICS.GROUND_ACCEL : PHYSICS.AIR_ACCEL;
    const decel = player.onGround ? PHYSICS.GROUND_DECEL : PHYSICS.AIR_DECEL;
    const targetVx = moveDir * PHYSICS.MAX_RUN_SPEED;

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
        player.airJumpsLeft = PHYSICS.MAX_AIR_JUMPS;
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
          color: '#EF4444',
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

    if (player.onWall !== 0 && !player.onGround && player.vy > PHYSICS.WALL_SLIDE_SPEED) {
      if ((player.onWall === -1 && input.left) || (player.onWall === 1 && input.right)) {
        player.vy = PHYSICS.WALL_SLIDE_SPEED;
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

  // Vertical integration
  const prevBottom = player.y + player.h;
  const wasOnGround = player.onGround;
  player.y += player.vy * dt;
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

  if (player.onGround && Math.abs(player.vx) > 20) {
    player.walkPhase += Math.abs(player.vx) * dt * 0.08;
  }

  for (const bp of sim.level.bouncePads) {
    if (rectsOverlap(player, bp) && player.vy >= -80) {
      player.vy = -bp.power;
      player.onGround = false;
      player.canAirDash = true;
      player.airJumpsLeft = PHYSICS.MAX_AIR_JUMPS;
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
    killPlayer(sim);
  }
}

function stepProjectiles(sim: WorldSimulation, dt: number, solids: Rect[]): void {
  for (const proj of sim.projectiles) {
    if (!proj.active) continue;
    proj.life -= dt;
    if (proj.life <= 0) {
      proj.active = false;
      continue;
    }

    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;

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

    // Check enemy hits first
    let hitHandled = false;
    for (const enemy of sim.enemies) {
      if (!enemy.alive) continue;
      if (rectsOverlap(pRect, enemy)) {
        proj.active = false;
        hitHandled = true;
        if (enemy.type === 'saw_slider') {
          sim.events.push({
            type: 'ricochet',
            x: proj.x,
            y: proj.y,
            color: '#FFFFFF',
          });
        } else {
          enemy.hp -= 1;
          enemy.hitFlashTimer = 0.1;
          if (enemy.hp <= 0) {
            enemy.alive = false;
            enemy.state = 'idle';
            const reward = enemy.type === 'pulse_turret' ? 150 : 100;
            sim.totalScore += reward;
            sim.hitstopTimer = Math.max(sim.hitstopTimer, 0.03);
            sim.trauma = Math.min(1, sim.trauma + 0.28);
            // Air-combo reward: destroying an enemy mid-air refreshes double-jump!
            if (!sim.player.onGround) {
              sim.player.airJumpsLeft = PHYSICS.MAX_AIR_JUMPS;
            }
            sim.events.push({
              type: 'enemy_kill',
              x: enemy.x + enemy.w / 2,
              y: enemy.y + enemy.h / 2,
              color: '#EF4444',
            });
          } else {
            sim.events.push({
              type: 'enemy_hit',
              x: proj.x,
              y: proj.y,
              color: '#F4F4F5',
            });
          }
        }
        break;
      }
    }
    if (hitHandled) continue;

    // Check solid obstacle collision
    for (const s of solids) {
      if (rectsOverlap(pRect, s)) {
        proj.active = false;
        sim.events.push({
          type: 'ricochet',
          x: proj.x,
          y: proj.y,
          color: '#A1A1AA',
        });
        break;
      }
    }
  }

  if (sim.projectiles.length > 48) {
    sim.projectiles = sim.projectiles.filter((p) => p.active);
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

  // 2. Switches & Blast Gates
  for (const sw of sim.switches) {
    const pressedNow = sim.player.alive && rectsOverlap(sim.player, sw);
    const wasPressed = sw.pressed;

    if (sw.mode === 'latch') {
      if (pressedNow) sw.pressed = true;
    } else if (sw.mode === 'timed') {
      if (pressedNow) {
        sw.pressed = true;
        sw.timer = sw.duration ?? 6.0;
      } else if (sw.timer > 0) {
        sw.timer = Math.max(0, sw.timer - dt);
        sw.pressed = sw.timer > 0;
      }
    }

    if (!wasPressed && sw.pressed) {
      sim.events.push({
        type: 'switch_on',
        x: sw.x + sw.w / 2,
        y: sw.y,
        color: '#EF4444',
      });
    }
  }

  for (const gate of sim.gates) {
    const anyPressed = sim.switches.some((s) => s.targetGateId === gate.id && s.pressed);
    const target = anyPressed ? 1 : 0;
    const rate = dt * 5.2;
    if (gate.openProgress < target) gate.openProgress = Math.min(target, gate.openProgress + rate);
    else if (gate.openProgress > target) gate.openProgress = Math.max(target, gate.openProgress - rate);
  }

  // 3. Player & Weapon Projectiles
  const solids = getSolidObstacles(sim);
  const oneWays = getOneWayPlatforms(sim);
  stepPlayer(sim, input, dt, solids, oneWays);
  stepProjectiles(sim, dt, solids);

  // 4. Blood Shards
  for (const crystal of sim.level.crystals) {
    if (sim.collectedCrystals.has(crystal.id)) continue;
    const cRect: Rect = {
      x: crystal.x - crystal.radius,
      y: crystal.y - crystal.radius,
      w: crystal.radius * 2,
      h: crystal.radius * 2,
    };
    if (sim.player.alive && rectsOverlap(sim.player, cRect)) {
      sim.collectedCrystals.add(crystal.id);
      sim.events.push({
        type: 'crystal',
        x: crystal.x,
        y: crystal.y,
        color: '#EF4444',
      });
    }
  }

  // 5. Enemies
  for (const enemy of sim.enemies) {
    if (!enemy.alive) continue;
    if (enemy.hitFlashTimer > 0) {
      enemy.hitFlashTimer = Math.max(0, enemy.hitFlashTimer - dt);
    }

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

      const hitbox: Rect = {
        x: enemy.x + 4,
        y: enemy.y + 4,
        w: enemy.w - 8,
        h: enemy.h - 8,
      };
      if (sim.player.alive && sim.player.dashTimer <= 0 && rectsOverlap(sim.player, hitbox)) {
        killPlayer(sim);
      }
    } else if (enemy.type === 'pulse_turret') {
      enemy.phaseTimer += dt;
      const cycle = enemy.fireInterval ?? 3.0;
      const idleWindow = Math.max(0.6, cycle - PHYSICS.TURRET_WINDUP_SEC - PHYSICS.TURRET_FIRE_SEC);

      if (enemy.state === 'idle' && enemy.phaseTimer >= idleWindow) {
        enemy.state = 'windup';
        enemy.phaseTimer = 0;
        sim.events.push({
          type: 'turret_windup',
          x: enemy.x + enemy.w / 2,
          y: enemy.y + enemy.h,
        });
      } else if (enemy.state === 'windup' && enemy.phaseTimer >= PHYSICS.TURRET_WINDUP_SEC) {
        enemy.state = 'firing';
        enemy.phaseTimer = 0;
        sim.events.push({
          type: 'turret_fire',
          x: enemy.x + enemy.w / 2,
          y: enemy.y + enemy.h,
        });
      } else if (enemy.state === 'firing' && enemy.phaseTimer >= PHYSICS.TURRET_FIRE_SEC) {
        enemy.state = 'idle';
        enemy.phaseTimer = 0;
      }

      if (enemy.state === 'firing') {
        const beamRect: Rect = {
          x: enemy.x + enemy.w / 2 - 5,
          y: enemy.y + enemy.h,
          w: 10,
          h: enemy.laserLength ?? 200,
        };
        if (sim.player.alive && sim.player.dashTimer <= 0 && rectsOverlap(sim.player, beamRect)) {
          killPlayer(sim);
        }
      }
    }
  }

  // 6. Goal Monolith
  sim.player.inGoal = sim.player.alive && rectsOverlap(sim.player, sim.level.goal);
  if (sim.player.inGoal) {
    sim.stageCompleted = true;
    const stageScore = calculateStageScore({
      parTimeSeconds: sim.level.parTimeSeconds,
      elapsedSeconds: sim.elapsedSeconds,
      crystalsCollected: sim.collectedCrystals.size,
      totalCrystals: sim.level.crystals.length,
      deaths: sim.deaths,
    });
    sim.totalScore += stageScore;
    sim.events.push({
      type: 'stage_clear',
      x: sim.level.goal.x + sim.level.goal.w / 2,
      y: sim.level.goal.y + sim.level.goal.h / 2,
      color: '#F4F4F5',
    });
  }
}
