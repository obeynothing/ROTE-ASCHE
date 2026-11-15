import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from './levels';
import {
  calculateStageScore,
  createWorldSimulation,
  EMPTY_INPUT,
  PHYSICS,
  rectsOverlap,
  stepWorldSimulation,
} from './physics';

test('all 10 levels have valid unobstructed spawns, goals, valid switches, and solo-completable gates', () => {
  assert.equal(LEVELS.length, 10, 'campaign should contain 10 escalating levels');
  const seenThemes = new Set<string>();

  for (const level of LEVELS) {
    seenThemes.add(level.theme);
    assert.ok(level.width >= 1280, `${level.id} width >= 1280`);
    assert.ok(level.goal.x + level.goal.w <= level.width, `${level.id} goal inside width`);
    assert.ok(level.goal.y >= 0 && level.goal.y + level.goal.h <= level.height, `${level.id} goal inside height`);

    const playerRect = { x: level.spawn.x, y: level.spawn.y, w: PHYSICS.PLAYER_W, h: PHYSICS.PLAYER_H };
    for (const plat of level.platforms) {
      if (plat.kind === 'solid') {
        assert.equal(rectsOverlap(playerRect, plat), false, `${level.id} spawn must not overlap ${plat.id}`);
      }
    }

    const gateIds = new Set(level.gates.map((g) => g.id));
    for (const sw of level.switches) {
      assert.equal(gateIds.has(sw.targetGateId), true, `${level.id} switch ${sw.id} must target existing gate`);
      assert.ok(sw.mode === 'latch' || sw.mode === 'timed', `${level.id} switch ${sw.id} must be solo-solvable`);
    }
  }

  assert.equal(seenThemes.size, 5, 'levels should showcase all 5 distinct dystopian themes');
});

test('player lands on floor, jumps, and executes mid-air double jump', () => {
  const sim = createWorldSimulation(LEVELS[0]);
  for (let i = 0; i < 40; i++) {
    stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  }
  assert.equal(sim.player.onGround, true);
  assert.equal(sim.player.airJumpsLeft, PHYSICS.MAX_AIR_JUMPS);

  // First jump
  stepWorldSimulation(sim, 1 / 60, { ...EMPTY_INPUT, jumpHeld: true, jumpJustPressed: true });
  assert.equal(sim.player.onGround, false);
  assert.ok(sim.player.vy < -400);

  // Let player rise and slow slightly, then trigger double jump in mid-air
  for (let i = 0; i < 18; i++) {
    stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  }
  const vyBeforeDouble = sim.player.vy;
  stepWorldSimulation(sim, 1 / 60, { ...EMPTY_INPUT, jumpHeld: true, jumpJustPressed: true });
  assert.equal(sim.player.airJumpsLeft, 0);
  assert.ok(sim.player.vy < vyBeforeDouble, 'double jump gives sharp upward velocity boost in mid-air');
});

test('coyote time allows jumping shortly after walking off a ledge', () => {
  const sim = createWorldSimulation(LEVELS[0]);
  sim.player.x = 562;
  sim.player.y = 600 - PHYSICS.PLAYER_H;
  sim.player.onGround = false;
  sim.player.coyoteTimer = PHYSICS.COYOTE_TIME;

  stepWorldSimulation(sim, 1 / 60, { ...EMPTY_INPUT, jumpHeld: true, jumpJustPressed: true });
  assert.ok(sim.player.vy < -400, 'coyote jump fires while coyoteTimer > 0');
});

test('omnidirectional dash supports horizontal and upward-diagonal bursts', () => {
  const sim = createWorldSimulation(LEVELS[0]);
  const startX = sim.player.x;
  stepWorldSimulation(sim, 1 / 60, { ...EMPTY_INPUT, right: true, dashJustPressed: true });
  assert.ok(sim.player.dashTimer > 0);
  assert.ok(sim.player.dashCooldown > 0);
  assert.ok(sim.player.x > startX);

  // Upward-diagonal air dash in fresh simulation
  const simUp = createWorldSimulation(LEVELS[0]);
  const startY = simUp.player.y;
  stepWorldSimulation(simUp, 1 / 60, { ...EMPTY_INPUT, right: true, up: true, dashJustPressed: true });
  assert.ok(simUp.player.dashVy < -300, 'up + right dash provides upward diagonal thrust');
  assert.ok(simUp.player.y < startY);
});

test('weapon fires projectiles that damage and destroy patrol drones for bonus score', () => {
  const sim = createWorldSimulation(LEVELS[0]);
  const drone = sim.enemies.find((e) => e.type === 'patrol_drone')!;
  assert.ok(drone);
  assert.equal(drone.alive, true);

  // Position player in front of drone facing right
  sim.player.x = drone.x - 110;
  sim.player.y = drone.y - 6;
  sim.player.facing = 1;
  sim.player.onGround = true;

  // Fire shot 1
  stepWorldSimulation(sim, 1 / 60, { ...EMPTY_INPUT, shootJustPressed: true });
  assert.ok(sim.projectiles.some((p) => p.active), 'shoot spawns active projectile');

  for (let i = 0; i < 20; i++) {
    stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  }
  assert.equal(drone.hp, 1, 'first hit damages patrol drone to 1 HP');
  assert.equal(drone.alive, true);

  // Fire shot 2 after cooldown
  stepWorldSimulation(sim, 1 / 60, { ...EMPTY_INPUT, shootJustPressed: true });
  for (let i = 0; i < 20; i++) {
    stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  }
  assert.equal(drone.alive, false, 'second hit destroys patrol drone');
  assert.ok(sim.totalScore >= 100, 'destroying enemy awards score bonus');
});

test('latch switch opens linked blast gate when stepped on', () => {
  const sim = createWorldSimulation(LEVELS[0]);
  const sw = sim.switches[0];
  sim.player.x = sw.x + 4;
  sim.player.y = sw.y - PHYSICS.PLAYER_H + 4;

  for (let i = 0; i < 20; i++) {
    stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  }

  assert.equal(sim.switches[0].pressed, true);
  const gate = sim.gates.find((g) => g.id === sw.targetGateId)!;
  assert.ok(gate.openProgress > 0.5, 'linked gate opens when switch is pressed');
});

test('pulse turret transitions through idle -> windup -> firing telegraph cycle', () => {
  const sim = createWorldSimulation(LEVELS[2]);
  const turret = sim.enemies.find((e) => e.type === 'pulse_turret')!;
  assert.ok(turret);
  assert.equal(turret.state, 'idle');

  const statesSeen = new Set<string>();
  for (let i = 0; i < 240; i++) {
    stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
    statesSeen.add(turret.state);
  }
  assert.equal(statesSeen.has('windup'), true, 'turret shows windup telegraph before firing');
  assert.equal(statesSeen.has('firing'), true, 'turret transitions from windup to firing');
});

test('calculateStageScore rewards speed, crystals, and penalizes deaths fairly', () => {
  const fastRun = calculateStageScore({
    parTimeSeconds: 35,
    elapsedSeconds: 20,
    crystalsCollected: 4,
    totalCrystals: 4,
    deaths: 0,
  });
  const slowRun = calculateStageScore({
    parTimeSeconds: 35,
    elapsedSeconds: 45,
    crystalsCollected: 1,
    totalCrystals: 4,
    deaths: 2,
  });

  assert.ok(fastRun > slowRun);
  assert.equal(fastRun, 1000 + 15 * 25 + 4 * 150 + 250);
  assert.equal(slowRun, 1000 + 0 + 150 + 0 - 200);
});
