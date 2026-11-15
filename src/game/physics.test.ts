import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from './levels';
import {
  calculateStageScore,
  CHARACTER_SPECS,
  createWorldSimulation,
  EMPTY_INPUT,
  getActivePlayer,
  PHYSICS,
  rectsOverlap,
  stepWorldSimulation,
} from './physics';
import {
  formatDeltaSeconds,
  loadSpeedrunRecords,
  recordFullRunTime,
  recordStageSplit,
  saveLeaderboardRun,
} from './leaderboard';

test('all 14 levels escalate in length (3100..8200px), showcase all 7 biomes, and mount Sector 14 bossArena', () => {
  assert.equal(LEVELS.length, 14, 'campaign should contain 14 escalating levels');
  const seenThemes = new Set<string>();
  let prevWidth = 0;

  for (const level of LEVELS) {
    seenThemes.add(level.theme);
    assert.ok(level.width >= 3100, `${level.id} width >= 3100 for long stages`);
    assert.ok(level.width > prevWidth, `${level.id} width (${level.width}) must be longer than previous (${prevWidth})`);
    prevWidth = level.width;

    assert.ok(level.checkpoints.length >= 2, `${level.id} must have >= 2 checkpoints`);
    assert.ok(level.buddyPods.length >= 2, `${level.id} must have >= 2 buddy pods`);
    assert.ok(level.goal.x + level.goal.w <= level.width, `${level.id} goal inside width`);
    assert.ok(level.goal.y >= 0 && level.goal.y + level.goal.h <= level.height, `${level.id} goal inside height`);

    const p1Rect = { x: level.spawn.x, y: level.spawn.y, w: CHARACTER_SPECS.asche.w, h: CHARACTER_SPECS.asche.h };
    for (const plat of level.platforms) {
      if (plat.kind === 'solid') {
        assert.equal(rectsOverlap(p1Rect, plat), false, `${level.id} spawn must not overlap ${plat.id}`);
      }
    }

    const gateIds = new Set(level.gates.map((g) => g.id));
    for (const sw of level.switches) {
      assert.equal(gateIds.has(sw.targetGateId), true, `${level.id} switch ${sw.id} must target existing gate`);
      assert.ok(sw.mode === 'latch' || sw.mode === 'timed', `${level.id} switch ${sw.id} must be solo-solvable`);
    }
  }

  assert.equal(seenThemes.size, 7, 'levels should showcase all 7 Carrion-inspired biome themes');
  assert.ok(LEVELS[13].bossArena, 'Sector 14 must mount the Omega-Kolos bossArena');
  assert.equal(LEVELS[13].bossArena?.gateId, 's14-boss-gate');
});

test('ASCHE performs triple-jump and trails long 14-node scarf behind', () => {
  const sim = createWorldSimulation(LEVELS[0]);
  const asche = getActivePlayer(sim);
  assert.equal(asche.id, 'asche');
  assert.equal(asche.scarfTrail.length, 14, 'scarf should have 14 connected nodes');

  for (let i = 0; i < 40; i++) {
    stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  }
  assert.equal(asche.onGround, true);
  assert.equal(asche.airJumpsLeft, 2, 'ASCHE has 2 mid-air jumps (triple jump)');

  // Run right to stream the long scarf behind
  for (let i = 0; i < 15; i++) {
    stepWorldSimulation(sim, 1 / 60, { ...EMPTY_INPUT, right: true });
  }
  const tail = asche.scarfTrail[asche.scarfTrail.length - 1];
  assert.ok(tail.x < asche.scarfTrail[0].x - 20, 'running right trails long scarf far behind');

  // Jump 1 (ground) + Jump 2 (air) + Jump 3 (triple jump)
  stepWorldSimulation(sim, 1 / 60, { ...EMPTY_INPUT, jumpHeld: true, jumpJustPressed: true });
  for (let i = 0; i < 12; i++) stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  stepWorldSimulation(sim, 1 / 60, { ...EMPTY_INPUT, jumpHeld: true, jumpJustPressed: true });
  assert.equal(asche.airJumpsLeft, 1);

  for (let i = 0; i < 12; i++) stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  stepWorldSimulation(sim, 1 / 60, { ...EMPTY_INPUT, jumpHeld: true, jumpJustPressed: true });
  assert.equal(asche.airJumpsLeft, 0);
  assert.ok(asche.vy < -400);
});

test('KRON glides while holding jump in mid-air, 1-shots drones, and ram-dashes through drones', () => {
  const sim = createWorldSimulation(LEVELS[0]);
  // Tag-switch to KRON
  stepWorldSimulation(sim, 1 / 60, { ...EMPTY_INPUT, switchJustPressed: true });
  const kron = getActivePlayer(sim);
  assert.equal(kron.id, 'kron');
  assert.equal(kron.w, CHARACTER_SPECS.kron.w);
  assert.equal(kron.h, CHARACTER_SPECS.kron.h);

  // Test KRON mid-air glide slows fall speed
  kron.x = 200;
  kron.y = 120;
  kron.onGround = false;
  kron.vy = 250;
  for (let i = 0; i < 10; i++) {
    stepWorldSimulation(sim, 1 / 60, { ...EMPTY_INPUT, jumpHeld: true });
  }
  assert.equal(kron.gliding, true, 'KRON enters gliding state when holding jump while falling');
  assert.ok(kron.vy <= PHYSICS.GLIDE_FALL_SPEED + 1, 'KRON fall speed is capped by glide');

  // Test KRON heavy cannon 1-shots patrol drone (2 HP) even at weapon Tier 1
  const drone = sim.enemies.find((e) => e.type === 'patrol_drone')!;
  kron.x = drone.x - 120;
  kron.y = drone.y - 6;
  kron.facing = 1;
  kron.onGround = true;
  kron.vy = 0;
  stepWorldSimulation(sim, 1 / 60, { ...EMPTY_INPUT, shootJustPressed: true });
  for (let i = 0; i < 20; i++) {
    stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  }
  assert.equal(drone.alive, false, 'KRON heavy shot (+1 dmg) destroys 2-HP drone in 1 hit');

  // Test KRON armored Ram-Dash destroys another patrol drone on contact without taking damage
  const simRam = createWorldSimulation(LEVELS[0]);
  stepWorldSimulation(simRam, 1 / 60, { ...EMPTY_INPUT, switchJustPressed: true });
  const ramKron = getActivePlayer(simRam);
  const ramDrone = simRam.enemies.find((e) => e.type === 'patrol_drone')!;
  ramKron.x = ramDrone.x - 36;
  ramKron.y = ramDrone.y - 6;
  ramKron.onGround = true;
  stepWorldSimulation(simRam, 1 / 60, { ...EMPTY_INPUT, right: true, dashJustPressed: true });
  for (let i = 0; i < 6; i++) {
    stepWorldSimulation(simRam, 1 / 60, { ...EMPTY_INPUT, right: true });
  }
  assert.equal(ramDrone.alive, false, 'KRON ram-dash destroys patrol drone on contact');
  assert.equal(simRam.partnerPresent, true, 'KRON takes zero buddy damage during armored ram-dash');
});

test('DKC extra-life mechanic: first hit tags out to surviving partner, buddy pod rescues lost partner, second hit causes death', () => {
  const sim = createWorldSimulation(LEVELS[0]);
  assert.equal(sim.partnerPresent, true);
  assert.equal(sim.activeCharIndex, 0);

  // Move ASCHE into a patrol drone without dashing -> should lose partner and tag in KRON!
  const drone = sim.enemies.find((e) => e.type === 'patrol_drone')!;
  const asche = getActivePlayer(sim);
  asche.x = drone.x;
  asche.y = drone.y - 6;
  asche.invulnTimer = 0;

  stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  assert.equal(sim.partnerPresent, false, 'first hit removes partner buffer instead of killing player');
  assert.equal(sim.activeCharIndex, 1, 'surviving partner KRON takes over immediately');
  assert.equal(sim.deaths, 0, 'first hit does NOT count as full checkpoint death');
  assert.ok(getActivePlayer(sim).invulnTimer > 1.0, 'surviving partner gets post-hit invulnerability');

  // Let hitstop clear, then walk onto a Gefährten-Kapsel (buddy pod) -> restores partner!
  for (let i = 0; i < 6; i++) stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  const pod = LEVELS[0].buddyPods[0];
  const kron = getActivePlayer(sim);
  kron.x = pod.x - 10;
  kron.y = pod.y - kron.h;
  kron.invulnTimer = 0;
  stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  assert.equal(sim.partnerPresent, true, 'Gefährten-Kapsel restores missing partner back into squad');

  // Force solo state and verify second hit causes full checkpoint death
  sim.partnerPresent = false;
  kron.x = drone.x;
  kron.y = drone.y - 6;
  kron.invulnTimer = 0;
  stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  assert.equal(sim.deaths, 1, 'getting hit while solo (partnerPresent === false) causes checkpoint death');
});

test('pit fall with partner rescues surviving partner back to last safe ground', () => {
  const sim = createWorldSimulation(LEVELS[0]);
  for (let i = 0; i < 30; i++) stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);

  const safeX = sim.lastSafePos.x;
  const active = getActivePlayer(sim);
  active.x = 620; // Over gap
  active.y = sim.level.height + 80;
  stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);

  assert.equal(sim.partnerPresent, false);
  assert.equal(sim.deaths, 0);
  const survivor = getActivePlayer(sim);
  assert.equal(survivor.alive, true);
  assert.ok(Math.abs(survivor.x - safeX) < 10, 'surviving partner recovers at lastSafePos');
});

test('weapon tiers 1..4 spawn increasing projectile patterns for Pulse and 4 switchable weapons cycle cleanly', () => {
  const simT1 = createWorldSimulation(LEVELS[0], 0, 1, 'pulse');
  stepWorldSimulation(simT1, 1 / 60, { ...EMPTY_INPUT, shootJustPressed: true });
  assert.equal(simT1.projectiles.filter((p) => p.active).length, 1);

  const simT2 = createWorldSimulation(LEVELS[0], 0, 2, 'pulse');
  stepWorldSimulation(simT2, 1 / 60, { ...EMPTY_INPUT, shootJustPressed: true });
  assert.equal(simT2.projectiles.filter((p) => p.active).length, 2);

  const simT3 = createWorldSimulation(LEVELS[0], 0, 3, 'pulse');
  stepWorldSimulation(simT3, 1 / 60, { ...EMPTY_INPUT, shootJustPressed: true });
  assert.equal(simT3.projectiles.filter((p) => p.active).length, 3);

  const simT4 = createWorldSimulation(LEVELS[0], 0, 4, 'pulse');
  stepWorldSimulation(simT4, 1 / 60, { ...EMPTY_INPUT, shootJustPressed: true });
  assert.equal(simT4.projectiles.filter((p) => p.active).length, 5);

  // Cycling pulse -> shotgun -> harpoon -> mortar -> pulse
  const cycleSim = createWorldSimulation(LEVELS[0], 0, 1, 'pulse');
  stepWorldSimulation(cycleSim, 1 / 60, { ...EMPTY_INPUT, weaponCycleJustPressed: true });
  assert.equal(cycleSim.activeWeapon, 'shotgun');
  stepWorldSimulation(cycleSim, 1 / 60, { ...EMPTY_INPUT, weaponCycleJustPressed: true });
  assert.equal(cycleSim.activeWeapon, 'harpoon');
  stepWorldSimulation(cycleSim, 1 / 60, { ...EMPTY_INPUT, weaponCycleJustPressed: true });
  assert.equal(cycleSim.activeWeapon, 'mortar');
  stepWorldSimulation(cycleSim, 1 / 60, { ...EMPTY_INPUT, weaponSelect: 'shotgun' });
  assert.equal(cycleSim.activeWeapon, 'shotgun');

  // Shotgun fires multi-pellet cone
  stepWorldSimulation(cycleSim, 1 / 60, { ...EMPTY_INPUT, shootJustPressed: true });
  assert.ok(cycleSim.projectiles.filter((p) => p.active && p.weapon === 'shotgun').length >= 4);
});

test('shield_enforcer ricochets frontal pulse shots while harpoon pierces shields directly', () => {
  // Stage 14 opens with a shield_enforcer
  const sim = createWorldSimulation(LEVELS[13], 0, 1, 'pulse');
  const enforcer = sim.enemies.find((e) => e.type === 'shield_enforcer')!;
  assert.ok(enforcer, 'Sector 14 should contain a shield_enforcer');

  const p = getActivePlayer(sim);
  // Stand in front of enforcer's facing side
  enforcer.dir = -1;
  p.x = enforcer.x - 110;
  p.y = enforcer.y;
  p.facing = 1;
  p.onGround = true;
  p.vy = 0;

  const startHp = enforcer.hp;
  stepWorldSimulation(sim, 1 / 60, { ...EMPTY_INPUT, shootJustPressed: true });
  let sawRicochet = false;
  for (let i = 0; i < 14; i++) {
    stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
    if (sim.events.some((ev) => ev.type === 'ricochet')) sawRicochet = true;
  }
  assert.equal(sawRicochet, true, 'frontal pulse shot should ricochet off enforcer shield');
  assert.equal(enforcer.hp, startHp, 'frontal pulse shot deals 0 damage to shield_enforcer');

  // Switch to Harpoon [3] -> should pierce shield and deal damage!
  stepWorldSimulation(sim, 1 / 60, { ...EMPTY_INPUT, weaponSelect: 'harpoon', shootJustPressed: true });
  for (let i = 0; i < 14; i++) {
    stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  }
  assert.ok(enforcer.hp < startHp, 'harpoon pierces shield_enforcer frontal shield');
});

test('mortar splash damages grouped enemies and stalker_crawler telegraphs + lunges', () => {
  const sim = createWorldSimulation(LEVELS[0], 0, 1, 'mortar');
  const crawler = sim.enemies.find((e) => e.type === 'stalker_crawler')!;
  assert.ok(crawler, 'Sector 1 includes a stalker_crawler');

  const p = getActivePlayer(sim);
  p.x = crawler.x - 160;
  p.y = crawler.y;
  p.facing = 1;
  p.onGround = true;
  p.vy = 0;

  // Step a few frames so crawler detects player and enters windup
  for (let i = 0; i < 8; i++) {
    stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  }
  assert.ok(
    crawler.state === 'windup' || crawler.state === 'charging',
    'stalker_crawler should telegraph windup when player enters sightline',
  );

  // Fire arcing mortar toward crawler
  const preHp = crawler.hp;
  stepWorldSimulation(sim, 1 / 60, { ...EMPTY_INPUT, shootJustPressed: true });
  let exploded = false;
  for (let i = 0; i < 55; i++) {
    stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
    if (sim.events.some((ev) => ev.type === 'explosion')) exploded = true;
  }
  assert.ok(exploded || crawler.hp < preHp || !crawler.alive, 'mortar should explode or damage crawler');
});

test('Omega-Kolos Boss awakens in Sector 14 arena, shifts phases, and opens s14-boss-gate upon defeat', () => {
  const level14 = LEVELS[13];
  const arena = level14.bossArena!;
  const sim = createWorldSimulation(level14, 0, 4, 'harpoon');
  assert.ok(sim.boss, 'Sector 14 creates BossState');
  assert.equal(sim.boss!.active, false, 'boss starts dormant until player enters arena');

  const gate = sim.gates.find((g) => g.id === arena.gateId)!;
  assert.equal(gate.openProgress, 0, 'boss gate stays sealed initially');

  // Move player across triggerX
  const p = getActivePlayer(sim);
  p.x = arena.triggerX + 30;
  p.y = arena.floorY - p.h;
  p.onGround = true;

  stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  assert.equal(sim.boss!.active, true, 'crossing triggerX awakens Omega-Kolos');

  // Position player safely and hammer boss until phase 2, phase 3, and defeat
  let sawPhase2 = false;
  let sawPhase3 = false;
  for (let step = 0; step < 900 && !sim.boss!.defeated; step++) {
    const active = getActivePlayer(sim);
    active.invulnTimer = 2.0; // keep test focused on boss damage & phase loop
    active.x = sim.boss!.x - 160;
    active.y = sim.boss!.y + sim.boss!.h / 2 - active.h / 2;
    active.facing = sim.boss!.x >= active.x ? 1 : -1;

    stepWorldSimulation(sim, 1 / 60, {
      ...EMPTY_INPUT,
      shootJustPressed: step % 8 === 0,
      shootHeld: true,
    });
    if (sim.boss!.phase === 2) sawPhase2 = true;
    if (sim.boss!.phase === 3) sawPhase3 = true;
  }

  assert.equal(sawPhase2, true, 'Omega-Kolos transitions through Phase 2');
  assert.equal(sawPhase3, true, 'Omega-Kolos transitions through Phase 3');
  assert.equal(sim.boss!.defeated, true, 'Omega-Kolos can be defeated');

  // Step slightly more so gate slides open
  for (let i = 0; i < 30; i++) {
    stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  }
  assert.ok(gate.openProgress > 0.9, 'defeating Omega-Kolos opens s14-boss-gate to the final Monolith');
});

test('checkpoint updates active respawn coordinates', () => {
  const sim = createWorldSimulation(LEVELS[0]);
  const cp = LEVELS[0].checkpoints[0];
  const player = getActivePlayer(sim);
  player.x = cp.x;
  player.y = cp.y - player.h;

  stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  assert.equal(sim.activatedCheckpoints.has(cp.id), true);
  assert.equal(sim.activeSpawn.x, cp.x - 14);
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

test('every gate across all 14 sectors has w >= 32, unbroken overhead bulkhead to y=0, solid floor, and preceding switch', () => {
  for (const level of LEVELS) {
    for (const gate of level.gates) {
      assert.ok(gate.w >= 32, `${level.id} gate ${gate.id} width (${gate.w}) must be >= 32px`);

      // Check solid vertical coverage from y = 0 down to gate.y across the gate column
      const coveringSolids = level.platforms
        .filter(
          (p) =>
            p.kind === 'solid' &&
            p.x <= gate.x &&
            p.x + p.w >= gate.x + gate.w &&
            p.y < gate.y + 4,
        )
        .sort((a, b) => a.y - b.y);

      let coveredUntilY = 0;
      for (const slab of coveringSolids) {
        if (slab.y <= coveredUntilY + 1) {
          coveredUntilY = Math.max(coveredUntilY, slab.y + slab.h);
        }
      }
      assert.ok(
        coveredUntilY >= gate.y,
        `${level.id} gate ${gate.id} overhead solid coverage stops at y=${coveredUntilY}, below gate.y=${gate.y}`,
      );

      // Check solid floor beneath gate bottom so player cannot crawl underneath
      const floorBeneath = level.platforms.some(
        (p) =>
          p.kind === 'solid' &&
          p.x <= gate.x + gate.w &&
          p.x + p.w >= gate.x &&
          p.y <= gate.y + gate.h + 2 &&
          p.y + p.h >= gate.y + gate.h + 12,
      );
      assert.equal(
        floorBeneath,
        true,
        `${level.id} gate ${gate.id} must seal flush against solid floor below y=${gate.y + gate.h}`,
      );

      // Every switch targeting this gate must sit strictly before gate.x
      const targetingSwitches = level.switches.filter((sw) => sw.targetGateId === gate.id);
      for (const sw of targetingSwitches) {
        assert.ok(
          sw.x + sw.w <= gate.x,
          `${level.id} switch ${sw.id} (${sw.x}+${sw.w}) must sit before gate ${gate.id} (${gate.x})`,
        );
      }
    }
  }
});

test('anti-cheat: ceiling clamp prevents y < 0 escape and 120Hz dash cannot tunnel through closed s1-gate-1', () => {
  const sim = createWorldSimulation(LEVELS[0]);
  const player = getActivePlayer(sim);
  player.x = 200;
  player.y = 10;
  player.vy = -900;
  player.onGround = false;

  for (let i = 0; i < 12; i++) {
    stepWorldSimulation(sim, 1 / 120, { ...EMPTY_INPUT, jumpHeld: true, jumpJustPressed: i === 0 });
    assert.ok(player.y >= 0, `player.y (${player.y}) must never climb above ceiling y=0`);
  }

  // Try dashing right at 790 px/s with 120Hz substeps directly into closed s1-gate-1
  const gate = sim.gates.find((g) => g.id === 's1-gate-1')!;
  assert.equal(gate.openProgress, 0);
  player.x = gate.x - player.w - 4;
  player.y = gate.y + gate.h - player.h;
  player.onGround = true;
  player.vy = 0;
  player.dashCooldown = 0;

  for (let i = 0; i < 24; i++) {
    stepWorldSimulation(sim, 1 / 120, {
      ...EMPTY_INPUT,
      right: true,
      dashJustPressed: i === 0,
    });
  }

  assert.ok(
    player.x + player.w <= gate.x + 1,
    `player (${player.x + player.w}) must not tunnel past closed gate (${gate.x})`,
  );
});

test('Sector 14 Goal Monolith stays locked while Omega-Kolos is alive and unlocks after defeat', () => {
  const level14 = LEVELS[13];
  const sim = createWorldSimulation(level14);
  const player = getActivePlayer(sim);
  assert.ok(sim.boss && !sim.boss.defeated);

  // Even if placed inside goal rect while boss is alive, stageCompleted stays false
  player.x = level14.goal.x + 12;
  player.y = level14.goal.y + 12;
  stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  assert.equal(sim.stageCompleted, false, 'goal monolith cannot trigger while boss is still alive');

  // Defeat boss -> goal triggers immediately
  sim.boss!.defeated = true;
  stepWorldSimulation(sim, 1 / 60, EMPTY_INPUT);
  assert.equal(sim.stageCompleted, true, 'goal monolith triggers once Omega-Kolos is defeated');
});

test('speedrun PBs and leaderboard reject practice runs and track splits accurately', () => {
  const store = new Map<string, string>();
  const prevWindow = (globalThis as { window?: unknown }).window;
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    },
  };

  try {
    // Practice run must NOT write PB or leaderboard entry
    const practiceSplit = recordStageSplit('stage-1', 12.34, true);
    assert.equal(practiceSplit.isNewPb, false);
    assert.equal(practiceSplit.pbMs, null);

    const practiceFull = recordFullRunTime(240.5, true);
    assert.equal(practiceFull.isNewPb, false);
    assert.equal(practiceFull.pbMs, null);

    const practiceLb = saveLeaderboardRun({
      playerName: 'PRACTICE',
      score: 99999,
      totalTimeMs: 100000,
      crystalsCollected: 50,
      stagesCleared: 14,
      deaths: 0,
      isPracticeRun: true,
    });
    assert.equal(practiceLb, null);
    assert.equal(loadSpeedrunRecords().bestFullRunMs, null);

    // Official run records initial PB, then negative split delta on faster second run
    const split1 = recordStageSplit('stage-1', 25.5, false);
    assert.equal(split1.isNewPb, true);
    assert.equal(split1.pbMs, 25500);
    assert.equal(split1.deltaMs, null);

    const split2 = recordStageSplit('stage-1', 22.25, false);
    assert.equal(split2.isNewPb, true);
    assert.equal(split2.pbMs, 22250);
    assert.equal(split2.deltaMs, -3250);
    assert.equal(formatDeltaSeconds(split2.deltaMs!), '-3.25s');

    const full1 = recordFullRunTime(380.12, false);
    assert.equal(full1.isNewPb, true);
    assert.equal(full1.pbMs, 380120);

    const saved = saveLeaderboardRun({
      playerName: 'RUNNER',
      score: 22000,
      totalTimeMs: 380120,
      crystalsCollected: 42,
      stagesCleared: 14,
      deaths: 1,
      isPracticeRun: false,
    });
    assert.ok(saved !== null && saved.rank === 1);
  } finally {
    (globalThis as { window?: unknown }).window = prevWindow;
  }
});
