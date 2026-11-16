import type { BuddyPodDef, CheckpointDef, CrystalDef, EnemyDef, GateDef, LevelDef, PlatformDef, SwitchDef } from './types';

type BaseLevelDef = Omit<LevelDef, 'buddyPods'> & { buddyPods?: BuddyPodDef[] };

const BASE_LEVELS: BaseLevelDef[] = [
  // =========================================================================
  // SEKTOR 01 · ASCHENBRÜCKE (2200 px) — Einführung: Steuerung, Doppelsprung, Dash & Waffe
  // =========================================================================
  {
    index: 0,
    id: 'stage-1',
    name: '01 · Aschenbrücke',
    subtitle: 'Schleusen entriegeln, Drohnen ausschalten und den ersten Monolithen erreichen',
    theme: 'containment_lab',
    width: 2200,
    height: 720,
    spawn: { x: 110, y: 520 },
    checkpoints: [{ id: 's1-cp1', x: 1140, y: 540 }],
    goal: { x: 2050, y: 316, w: 64, h: 84 },
    parTimeSeconds: 34,
    platforms: [
      { id: 's1-floor-1', kind: 'solid', x: 0, y: 600, w: 560, h: 120 },
      { id: 's1-step-1', kind: 'solid', x: 320, y: 515, w: 150, h: 24, accent: 'bone' },
      { id: 's1-floor-2', kind: 'solid', x: 680, y: 540, w: 540, h: 180 },
      { id: 's1-ledge-sw1', kind: 'oneway', x: 740, y: 440, w: 180, h: 18, accent: 'crimson' },
      {
        id: 's1-mov-1',
        kind: 'moving',
        x: 1290,
        y: 515,
        w: 145,
        h: 22,
        accent: 'crimson',
        moveAxis: 'x',
        moveRange: 185,
        moveSpeed: 1.35,
        movePhase: 0,
      },
      { id: 's1-floor-3', kind: 'solid', x: 1640, y: 510, w: 560, h: 210 },
      { id: 's1-goal-deck', kind: 'solid', x: 1970, y: 400, w: 230, h: 110, accent: 'bone' },
      { id: 's1-wall-1', kind: 'solid', x: 1175, y: 0, w: 32, h: 420, accent: 'bone' },
      { id: 's1-wall-guard', kind: 'solid', x: 1970, y: 0, w: 32, h: 290, accent: 'bone' },
    ],
    switches: [
      { id: 's1-sw-1', x: 805, y: 422, w: 44, h: 18, targetGateId: 's1-gate-1', mode: 'latch' },
      { id: 's1-sw-2', x: 1710, y: 492, w: 44, h: 18, targetGateId: 's1-gate-2', mode: 'latch' },
    ],
    gates: [
      { id: 's1-gate-1', x: 1175, y: 420, w: 32, h: 120, openOffsetY: -120 },
      { id: 's1-gate-2', x: 1970, y: 290, w: 32, h: 110, openOffsetY: -115 },
    ],
    bouncePads: [
      { id: 's1-bp-1', x: 1875, y: 494, w: 56, h: 16, power: 780 },
    ],
    crystals: [
      { id: 's1-c1', x: 395, y: 472, radius: 13 },
      { id: 's1-c2', x: 830, y: 385, radius: 13 },
      { id: 's1-c3', x: 1380, y: 445, radius: 13 },
      { id: 's1-c4', x: 2015, y: 345, radius: 13 },
    ],
    enemies: [
      {
        id: 's1-e1',
        type: 'patrol_drone',
        x: 920,
        y: 500,
        w: 32,
        h: 26,
        patrolMinX: 720,
        patrolMaxX: 1120,
        speed: 95,
      },
      {
        id: 's1-e2',
        type: 'stalker_crawler',
        x: 1780,
        y: 484,
        w: 34,
        h: 26,
        patrolMinX: 1665,
        patrolMaxX: 1935,
        speed: 105,
      },
    ],
  },

  // =========================================================================
  // SEKTOR 02 · SCHLACKENWERK (2550 px) — Duo-Schalter (Hold), Aufzüge & Öfen
  // =========================================================================
  {
    index: 1,
    id: 'stage-2',
    name: '02 · Schlackenwerk',
    subtitle: 'Halte Druckplatten gemeinsam offen [Tab/Q] und durchquere die Hochöfen',
    theme: 'flesh_foundry',
    width: 2550,
    height: 720,
    spawn: { x: 106, y: 520 },
    checkpoints: [{ id: 's2-cp1', x: 1340, y: 460 }],
    goal: { x: 2395, y: 256, w: 64, h: 84 },
    parTimeSeconds: 42,
    platforms: [
      { id: 's2-floor-1', kind: 'solid', x: 0, y: 600, w: 460, h: 120 },
      { id: 's2-step-1', kind: 'oneway', x: 520, y: 510, w: 160, h: 18, accent: 'bone' },
      { id: 's2-floor-2', kind: 'solid', x: 740, y: 530, w: 440, h: 190 },
      { id: 's2-high-sw', kind: 'oneway', x: 790, y: 405, w: 180, h: 18, accent: 'crimson' },
      { id: 's2-floor-3', kind: 'solid', x: 1270, y: 460, w: 450, h: 260 },
      {
        id: 's2-mov-1',
        kind: 'moving',
        x: 1790,
        y: 490,
        w: 135,
        h: 22,
        accent: 'crimson',
        moveAxis: 'y',
        moveRange: 145,
        moveSpeed: 1.55,
        movePhase: 0,
      },
      { id: 's2-floor-end', kind: 'solid', x: 2010, y: 340, w: 540, h: 380 },
      { id: 's2-wall-1', kind: 'solid', x: 1125, y: 0, w: 32, h: 410, accent: 'bone' },
      { id: 's2-wall-end', kind: 'solid', x: 2260, y: 0, w: 32, h: 220, accent: 'bone' },
    ],
    switches: [
      { id: 's2-sw-1', x: 860, y: 387, w: 44, h: 18, targetGateId: 's2-gate-1', mode: 'hold' },
      { id: 's2-sw-2', x: 1560, y: 442, w: 44, h: 18, targetGateId: 's2-gate-2', mode: 'timed', duration: 10.0 },
    ],
    gates: [
      { id: 's2-gate-1', x: 1125, y: 410, w: 32, h: 120, openOffsetY: -120 },
      { id: 's2-gate-2', x: 2260, y: 220, w: 32, h: 120, openOffsetY: -120 },
    ],
    bouncePads: [
      { id: 's2-bp-1', x: 1640, y: 444, w: 56, h: 16, power: 800 },
    ],
    crystals: [
      { id: 's2-c1', x: 600, y: 455, radius: 13 },
      { id: 's2-c2', x: 880, y: 345, radius: 13 },
      { id: 's2-c3', x: 1440, y: 390, radius: 13 },
      { id: 's2-c4', x: 1860, y: 300, radius: 13 },
      { id: 's2-c5', x: 2150, y: 280, radius: 13 },
    ],
    enemies: [
      {
        id: 's2-d1',
        type: 'patrol_drone',
        x: 880,
        y: 490,
        w: 32,
        h: 26,
        patrolMinX: 760,
        patrolMaxX: 1085,
        speed: 115,
      },
      {
        id: 's2-saw-1',
        type: 'saw_slider',
        x: 1380,
        y: 432,
        w: 34,
        h: 34,
        patrolMinX: 1300,
        patrolMaxX: 1520,
        speed: 150,
      },
      {
        id: 's2-d2',
        type: 'patrol_drone',
        x: 2090,
        y: 300,
        w: 32,
        h: 26,
        patrolMinX: 2030,
        patrolMaxX: 2225,
        speed: 130,
      },
    ],
  },

  // =========================================================================
  // SEKTOR 03 · EISENKLINGEN (2900 px) — Wandsprung-Kamine, Kreissägen & Geschütz
  // =========================================================================
  {
    index: 2,
    id: 'stage-3',
    name: '03 · Eisenklingen',
    subtitle: 'Schacht-Wandsprünge, rotierende Kreissägen und erster Laser-Wächter',
    theme: 'toxic_sewer',
    width: 2900,
    height: 720,
    spawn: { x: 106, y: 520 },
    checkpoints: [{ id: 's3-cp1', x: 1320, y: 310 }],
    goal: { x: 2735, y: 236, w: 64, h: 84 },
    parTimeSeconds: 48,
    platforms: [
      { id: 's3-floor-1', kind: 'solid', x: 0, y: 600, w: 460, h: 120 },
      { id: 's3-plat-1', kind: 'solid', x: 560, y: 540, w: 360, h: 180 },
      { id: 's3-plat-high-1', kind: 'oneway', x: 615, y: 430, w: 180, h: 18, accent: 'crimson' },
      { id: 's3-chimney-l', kind: 'solid', x: 1000, y: 270, w: 32, h: 310 },
      { id: 's3-chimney-r', kind: 'solid', x: 1145, y: 220, w: 28, h: 400 },
      { id: 's3-chimney-base', kind: 'solid', x: 980, y: 580, w: 193, h: 140 },
      { id: 's3-upper-1', kind: 'solid', x: 1145, y: 310, w: 560, h: 28, accent: 'bone' },
      {
        id: 's3-mov-x',
        kind: 'moving',
        x: 1785,
        y: 360,
        w: 140,
        h: 22,
        accent: 'crimson',
        moveAxis: 'x',
        moveRange: 170,
        moveSpeed: 1.65,
        movePhase: 0,
      },
      { id: 's3-mid-2', kind: 'solid', x: 2150, y: 400, w: 340, h: 320 },
      { id: 's3-floor-end', kind: 'solid', x: 2560, y: 320, w: 340, h: 400 },
      { id: 's3-wall-1', kind: 'solid', x: 1000, y: 0, w: 32, h: 160, accent: 'bone' },
      { id: 's3-upper-guard', kind: 'solid', x: 2645, y: 0, w: 32, h: 200, accent: 'bone' },
    ],
    switches: [
      { id: 's3-sw-1', x: 685, y: 412, w: 44, h: 18, targetGateId: 's3-gate-1', mode: 'timed', duration: 9.0 },
      { id: 's3-sw-2', x: 2300, y: 382, w: 44, h: 18, targetGateId: 's3-gate-2', mode: 'latch' },
    ],
    gates: [
      { id: 's3-gate-1', x: 1000, y: 160, w: 32, h: 110, openOffsetY: -115 },
      { id: 's3-gate-2', x: 2645, y: 200, w: 32, h: 120, openOffsetY: -120 },
    ],
    bouncePads: [
      { id: 's3-bp-1', x: 350, y: 584, w: 56, h: 16, power: 780 },
      { id: 's3-bp-mid', x: 855, y: 524, w: 52, h: 16, power: 810 },
      { id: 's3-bp-2', x: 2410, y: 384, w: 56, h: 16, power: 780 },
    ],
    crystals: [
      { id: 's3-c1', x: 485, y: 410, radius: 13 },
      { id: 's3-c2', x: 705, y: 370, radius: 13 },
      { id: 's3-c3', x: 1074, y: 355, radius: 13 },
      { id: 's3-c4', x: 1930, y: 285, radius: 13 },
      { id: 's3-c5', x: 2320, y: 325, radius: 13 },
    ],
    enemies: [
      {
        id: 's3-saw-1',
        type: 'saw_slider',
        x: 720,
        y: 512,
        w: 34,
        h: 34,
        patrolMinX: 590,
        patrolMaxX: 880,
        speed: 165,
      },
      {
        id: 's3-saw-2',
        type: 'saw_slider',
        x: 1360,
        y: 282,
        w: 34,
        h: 34,
        patrolMinX: 1220,
        patrolMaxX: 1650,
        speed: 185,
      },
      {
        id: 's3-turret-1',
        type: 'pulse_turret',
        x: 1520,
        y: 115,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 3.1,
        laserLength: 195,
      },
      {
        id: 's3-d1',
        type: 'patrol_drone',
        x: 2240,
        y: 355,
        w: 32,
        h: 26,
        patrolMinX: 2170,
        patrolMaxX: 2390,
        speed: 135,
      },
    ],
  },

  // =========================================================================
  // SEKTOR 04 · BLUTWACHT (3250 px) — Kathedrale, Duo-Schleusen & Kreuzfeuer
  // =========================================================================
  {
    index: 3,
    id: 'stage-4',
    name: '04 · Blutwacht',
    subtitle: 'Scharfrichter-Geschütze und taktische Team-Schleusen in den Gewölben',
    theme: 'nerve_cathedral',
    width: 3250,
    height: 720,
    spawn: { x: 106, y: 520 },
    checkpoints: [{ id: 's4-cp1', x: 1640, y: 390 }],
    goal: { x: 3090, y: 316, w: 64, h: 84 },
    parTimeSeconds: 54,
    platforms: [
      { id: 's4-floor-1', kind: 'solid', x: 0, y: 600, w: 420, h: 120 },
      { id: 's4-step-1', kind: 'solid', x: 490, y: 525, w: 280, h: 195 },
      { id: 's4-high-1', kind: 'oneway', x: 550, y: 415, w: 160, h: 18, accent: 'crimson' },
      { id: 's4-mid-island', kind: 'solid', x: 860, y: 470, w: 460, h: 250 },
      { id: 's4-mid-shelf', kind: 'oneway', x: 960, y: 355, w: 210, h: 18, accent: 'bone' },
      { id: 's4-bunker', kind: 'solid', x: 1410, y: 390, w: 480, h: 330 },
      { id: 's4-bunker-top', kind: 'oneway', x: 1520, y: 270, w: 200, h: 18, accent: 'crimson' },
      {
        id: 's4-mov-x',
        kind: 'moving',
        x: 1970,
        y: 430,
        w: 135,
        h: 22,
        accent: 'crimson',
        moveAxis: 'x',
        moveRange: 175,
        moveSpeed: 1.85,
        movePhase: 0.4,
      },
      { id: 's4-plat-4', kind: 'solid', x: 2340, y: 440, w: 380, h: 280 },
      { id: 's4-floor-end', kind: 'solid', x: 2800, y: 400, w: 450, h: 320 },
      { id: 's4-wall-1', kind: 'solid', x: 1270, y: 0, w: 32, h: 350, accent: 'bone' },
      { id: 's4-wall-2', kind: 'solid', x: 1840, y: 0, w: 32, h: 270, accent: 'bone' },
      { id: 's4-end-ceil', kind: 'solid', x: 2945, y: 0, w: 32, h: 280, accent: 'bone' },
    ],
    switches: [
      { id: 's4-sw-1', x: 610, y: 397, w: 44, h: 18, targetGateId: 's4-gate-1', mode: 'latch' },
      { id: 's4-sw-2', x: 1600, y: 252, w: 44, h: 18, targetGateId: 's4-gate-2', mode: 'hold' },
      { id: 's4-sw-3', x: 2520, y: 422, w: 44, h: 18, targetGateId: 's4-gate-3', mode: 'timed', duration: 8.5 },
    ],
    gates: [
      { id: 's4-gate-1', x: 1270, y: 350, w: 32, h: 120, openOffsetY: -125 },
      { id: 's4-gate-2', x: 1840, y: 270, w: 32, h: 120, openOffsetY: -125 },
      { id: 's4-gate-3', x: 2945, y: 280, w: 32, h: 120, openOffsetY: -125 },
    ],
    bouncePads: [
      { id: 's4-bp-1', x: 695, y: 509, w: 56, h: 16, power: 820 },
      { id: 's4-bp-2', x: 1435, y: 374, w: 56, h: 16, power: 790 },
    ],
    crystals: [
      { id: 's4-c1', x: 630, y: 350, radius: 13 },
      { id: 's4-c2', x: 1065, y: 290, radius: 13 },
      { id: 's4-c3', x: 1620, y: 200, radius: 13 },
      { id: 's4-c4', x: 2120, y: 355, radius: 13 },
      { id: 's4-c5', x: 2740, y: 315, radius: 13 },
    ],
    enemies: [
      {
        id: 's4-turret-1',
        type: 'pulse_turret',
        x: 920,
        y: 235,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 3.0,
        laserLength: 230,
      },
      {
        id: 's4-drone-1',
        type: 'patrol_drone',
        x: 1560,
        y: 345,
        w: 32,
        h: 26,
        patrolMinX: 1470,
        patrolMaxX: 1790,
        speed: 145,
      },
      {
        id: 's4-turret-2',
        type: 'pulse_turret',
        x: 2070,
        y: 190,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 2.7,
        laserLength: 240,
      },
      {
        id: 's4-saw-1',
        type: 'saw_slider',
        x: 2430,
        y: 412,
        w: 34,
        h: 34,
        patrolMinX: 2360,
        patrolMaxX: 2680,
        speed: 175,
      },
    ],
  },

  // =========================================================================
  // SEKTOR 05 · GLEISBRUCH (3600 px) — Schwebebahnen über Abgründen & Luftgefechte
  // =========================================================================
  {
    index: 4,
    id: 'stage-5',
    name: '05 · Gleisbruch',
    subtitle: 'Rasende Schwebebahnen und Luftkämpfe über dem bodenlosen Stahlgraben',
    theme: 'flesh_foundry',
    width: 3600,
    height: 720,
    spawn: { x: 106, y: 500 },
    checkpoints: [
      { id: 's5-cp1', x: 1520, y: 440 },
      { id: 's5-cp2', x: 2680, y: 390 },
    ],
    goal: { x: 3440, y: 266, w: 64, h: 84 },
    parTimeSeconds: 60,
    platforms: [
      { id: 's5-floor-1', kind: 'solid', x: 0, y: 580, w: 340, h: 140 },
      {
        id: 's5-mov-1',
        kind: 'moving',
        x: 410,
        y: 540,
        w: 140,
        h: 22,
        accent: 'bone',
        moveAxis: 'x',
        moveRange: 175,
        moveSpeed: 1.85,
        movePhase: 0,
      },
      { id: 's5-plat-2', kind: 'solid', x: 780, y: 500, w: 320, h: 220 },
      {
        id: 's5-mov-2',
        kind: 'moving',
        x: 1170,
        y: 480,
        w: 130,
        h: 22,
        accent: 'crimson',
        moveAxis: 'x',
        moveRange: 180,
        moveSpeed: 2.05,
        movePhase: 1.2,
      },
      { id: 's5-plat-3', kind: 'solid', x: 1480, y: 440, w: 420, h: 280 },
      { id: 's5-shelf-3', kind: 'oneway', x: 1590, y: 320, w: 190, h: 18, accent: 'crimson' },
      {
        id: 's5-mov-3',
        kind: 'moving',
        x: 1980,
        y: 450,
        w: 125,
        h: 22,
        accent: 'crimson',
        moveAxis: 'y',
        moveRange: 135,
        moveSpeed: 2.0,
        movePhase: 0.7,
      },
      { id: 's5-plat-4', kind: 'solid', x: 2200, y: 390, w: 540, h: 330 },
      {
        id: 's5-mov-4',
        kind: 'moving',
        x: 2820,
        y: 380,
        w: 125,
        h: 22,
        accent: 'bone',
        moveAxis: 'x',
        moveRange: 170,
        moveSpeed: 2.1,
        movePhase: 0.2,
      },
      { id: 's5-end', kind: 'solid', x: 3180, y: 350, w: 420, h: 370 },
      { id: 's5-wall-1', kind: 'solid', x: 1850, y: 0, w: 32, h: 320, accent: 'bone' },
      { id: 's5-end-wall', kind: 'solid', x: 3290, y: 0, w: 32, h: 230, accent: 'bone' },
    ],
    switches: [
      { id: 's5-sw-1', x: 1660, y: 302, w: 44, h: 18, targetGateId: 's5-gate-1', mode: 'latch' },
      { id: 's5-sw-2', x: 2560, y: 372, w: 44, h: 18, targetGateId: 's5-gate-2', mode: 'timed', duration: 10.0 },
    ],
    gates: [
      { id: 's5-gate-1', x: 1850, y: 320, w: 32, h: 120, openOffsetY: -125 },
      { id: 's5-gate-2', x: 3290, y: 230, w: 32, h: 120, openOffsetY: -125 },
    ],
    bouncePads: [
      { id: 's5-bp-1', x: 1010, y: 484, w: 56, h: 16, power: 830 },
      { id: 's5-bp-2', x: 2450, y: 374, w: 56, h: 16, power: 800 },
    ],
    crystals: [
      { id: 's5-c1', x: 560, y: 420, radius: 13 },
      { id: 's5-c2', x: 1310, y: 365, radius: 13 },
      { id: 's5-c3', x: 1685, y: 260, radius: 13 },
      { id: 's5-c4', x: 2350, y: 315, radius: 13 },
      { id: 's5-c5', x: 2980, y: 270, radius: 13 },
    ],
    enemies: [
      {
        id: 's5-d1',
        type: 'patrol_drone',
        x: 840,
        y: 445,
        w: 32,
        h: 26,
        patrolMinX: 790,
        patrolMaxX: 990,
        speed: 145,
      },
      {
        id: 's5-saw-1',
        type: 'saw_slider',
        x: 1630,
        y: 412,
        w: 34,
        h: 34,
        patrolMinX: 1550,
        patrolMaxX: 1810,
        speed: 190,
      },
      {
        id: 's5-t1',
        type: 'pulse_turret',
        x: 1680,
        y: 160,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 2.6,
        laserLength: 270,
      },
      {
        id: 's5-d2',
        type: 'patrol_drone',
        x: 2350,
        y: 340,
        w: 32,
        h: 26,
        patrolMinX: 2220,
        patrolMaxX: 2530,
        speed: 165,
      },
      {
        id: 's5-d3',
        type: 'patrol_drone',
        x: 2900,
        y: 280,
        w: 32,
        h: 26,
        patrolMinX: 2810,
        patrolMaxX: 3090,
        speed: 170,
      },
    ],
  },

  // =========================================================================
  // SEKTOR 06 · TURM DER STILLE (3950 px) — Zwei Wandsprung-Türme & Team-Tor
  // =========================================================================
  {
    index: 5,
    id: 'stage-6',
    name: '06 · Turm der Stille',
    subtitle: 'Zwillings-Kamine im Schatten der Blut-Finsternis',
    theme: 'quarantine_vault',
    width: 3950,
    height: 720,
    spawn: { x: 106, y: 520 },
    checkpoints: [
      { id: 's6-cp1', x: 1360, y: 490 },
      { id: 's6-cp2', x: 2740, y: 430 },
    ],
    goal: { x: 3790, y: 226, w: 64, h: 84 },
    parTimeSeconds: 66,
    platforms: [
      { id: 's6-floor-1', kind: 'solid', x: 0, y: 600, w: 390, h: 120 },
      { id: 's6-tower-l', kind: 'solid', x: 460, y: 260, w: 28, h: 360 },
      { id: 's6-tower-r', kind: 'solid', x: 615, y: 220, w: 28, h: 410 },
      { id: 's6-tower-base', kind: 'solid', x: 440, y: 610, w: 210, h: 110 },
      { id: 's6-high-bridge', kind: 'solid', x: 615, y: 310, w: 480, h: 28, accent: 'bone' },
      { id: 's6-drop-deck', kind: 'solid', x: 1210, y: 490, w: 460, h: 230 },
      { id: 's6-shelf-mid', kind: 'oneway', x: 1320, y: 365, w: 200, h: 18, accent: 'crimson' },
      {
        id: 's6-mov-1',
        kind: 'moving',
        x: 1750,
        y: 440,
        w: 130,
        h: 22,
        accent: 'crimson',
        moveAxis: 'x',
        moveRange: 190,
        moveSpeed: 2.0,
        movePhase: 0.2,
      },
      { id: 's6-mid-arena', kind: 'solid', x: 2150, y: 430, w: 660, h: 290 },
      { id: 's6-mid-balcony', kind: 'oneway', x: 2310, y: 310, w: 210, h: 18, accent: 'bone' },
      {
        id: 's6-mov-2',
        kind: 'moving',
        x: 2890,
        y: 450,
        w: 120,
        h: 22,
        accent: 'crimson',
        moveAxis: 'y',
        moveRange: 140,
        moveSpeed: 2.05,
        movePhase: 1.0,
      },
      { id: 's6-shaft-2l', kind: 'solid', x: 3120, y: 210, w: 28, h: 350 },
      { id: 's6-shaft-2r', kind: 'solid', x: 3275, y: 170, w: 28, h: 420 },
      { id: 's6-shaft-base', kind: 'solid', x: 3100, y: 550, w: 210, h: 170 },
      { id: 's6-end-deck', kind: 'solid', x: 3275, y: 310, w: 675, h: 410, accent: 'bone' },
      { id: 's6-wall-1', kind: 'solid', x: 1620, y: 0, w: 32, h: 370, accent: 'bone' },
      { id: 's6-wall-2', kind: 'solid', x: 2760, y: 0, w: 32, h: 310, accent: 'bone' },
      { id: 's6-end-ceil', kind: 'solid', x: 3580, y: 0, w: 32, h: 190, accent: 'bone' },
    ],
    switches: [
      { id: 's6-sw-1', x: 1000, y: 292, w: 44, h: 18, targetGateId: 's6-gate-1', mode: 'latch' },
      { id: 's6-sw-2', x: 2390, y: 292, w: 44, h: 18, targetGateId: 's6-gate-2', mode: 'hold' },
      { id: 's6-sw-3', x: 3420, y: 292, w: 44, h: 18, targetGateId: 's6-gate-3', mode: 'timed', duration: 8.5 },
    ],
    gates: [
      { id: 's6-gate-1', x: 1620, y: 370, w: 32, h: 120, openOffsetY: -125 },
      { id: 's6-gate-2', x: 2760, y: 310, w: 32, h: 120, openOffsetY: -125 },
      { id: 's6-gate-3', x: 3580, y: 190, w: 32, h: 120, openOffsetY: -120 },
    ],
    bouncePads: [
      { id: 's6-bp-1', x: 310, y: 584, w: 56, h: 16, power: 820 },
      { id: 's6-bp-2', x: 3175, y: 534, w: 56, h: 16, power: 860 },
    ],
    crystals: [
      { id: 's6-c1', x: 540, y: 360, radius: 13 },
      { id: 's6-c2', x: 840, y: 250, radius: 13 },
      { id: 's6-c3', x: 1410, y: 300, radius: 13 },
      { id: 's6-c4', x: 2415, y: 240, radius: 13 },
      { id: 's6-c5', x: 3200, y: 240, radius: 13 },
      { id: 's6-c6', x: 3495, y: 245, radius: 13 },
    ],
    enemies: [
      {
        id: 's6-saw-1',
        type: 'saw_slider',
        x: 740,
        y: 282,
        w: 34,
        h: 34,
        patrolMinX: 645,
        patrolMaxX: 950,
        speed: 185,
      },
      {
        id: 's6-t1',
        type: 'pulse_turret',
        x: 820,
        y: 120,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 2.5,
        laserLength: 185,
      },
      {
        id: 's6-d1',
        type: 'patrol_drone',
        x: 1360,
        y: 445,
        w: 32,
        h: 26,
        patrolMinX: 1230,
        patrolMaxX: 1570,
        speed: 155,
      },
      {
        id: 's6-t2',
        type: 'pulse_turret',
        x: 1880,
        y: 165,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 2.4,
        laserLength: 270,
      },
      {
        id: 's6-d2',
        type: 'patrol_drone',
        x: 2450,
        y: 385,
        w: 32,
        h: 26,
        patrolMinX: 2180,
        patrolMaxX: 2710,
        speed: 170,
      },
    ],
  },

  // =========================================================================
  // SEKTOR 07 · KLINGEN-VIADUKT (4300 px) — Hochgeschwindigkeits-Sägen & Luft-Dash
  // =========================================================================
  {
    index: 6,
    id: 'stage-7',
    name: '07 · Klingen-Viadukt',
    subtitle: 'Zerbrochene Obelisken, rasante Kreissägen und weite Doppelsprung-Ketten',
    theme: 'bioreactor_abyss',
    width: 4300,
    height: 720,
    spawn: { x: 106, y: 500 },
    checkpoints: [
      { id: 's7-cp1', x: 1480, y: 470 },
      { id: 's7-cp2', x: 2940, y: 410 },
    ],
    goal: { x: 4140, y: 256, w: 64, h: 84 },
    parTimeSeconds: 72,
    platforms: [
      { id: 's7-floor-1', kind: 'solid', x: 0, y: 580, w: 360, h: 140 },
      { id: 's7-p2', kind: 'solid', x: 470, y: 510, w: 340, h: 210 },
      { id: 's7-p3', kind: 'oneway', x: 910, y: 425, w: 220, h: 18, accent: 'crimson' },
      { id: 's7-p4', kind: 'solid', x: 1220, y: 470, w: 480, h: 250 },
      {
        id: 's7-mov-1',
        kind: 'moving',
        x: 1775,
        y: 450,
        w: 125,
        h: 22,
        accent: 'bone',
        moveAxis: 'x',
        moveRange: 195,
        moveSpeed: 2.15,
        movePhase: 0,
      },
      { id: 's7-p5', kind: 'solid', x: 2150, y: 430, w: 420, h: 290 },
      { id: 's7-p5-up', kind: 'oneway', x: 2240, y: 305, w: 210, h: 18, accent: 'crimson' },
      {
        id: 's7-mov-2',
        kind: 'moving',
        x: 2645,
        y: 430,
        w: 120,
        h: 22,
        accent: 'crimson',
        moveAxis: 'x',
        moveRange: 155,
        moveSpeed: 2.2,
        movePhase: 1.1,
      },
      { id: 's7-p6', kind: 'solid', x: 2900, y: 410, w: 540, h: 310 },
      { id: 's7-p6-up', kind: 'oneway', x: 3080, y: 295, w: 190, h: 18, accent: 'bone' },
      {
        id: 's7-mov-3',
        kind: 'moving',
        x: 3520,
        y: 410,
        w: 120,
        h: 22,
        accent: 'crimson',
        moveAxis: 'y',
        moveRange: 120,
        moveSpeed: 2.2,
        movePhase: 0.4,
      },
      { id: 's7-end', kind: 'solid', x: 3740, y: 340, w: 560, h: 380 },
      { id: 's7-wall-1', kind: 'solid', x: 1640, y: 0, w: 32, h: 350, accent: 'bone' },
      { id: 's7-wall-2', kind: 'solid', x: 2515, y: 0, w: 32, h: 310, accent: 'bone' },
      { id: 's7-end-ceil', kind: 'solid', x: 3980, y: 0, w: 32, h: 220, accent: 'bone' },
    ],
    switches: [
      { id: 's7-sw-1', x: 995, y: 407, w: 44, h: 18, targetGateId: 's7-gate-1', mode: 'timed', duration: 9.0 },
      { id: 's7-sw-2', x: 2320, y: 287, w: 44, h: 18, targetGateId: 's7-gate-2', mode: 'latch' },
      { id: 's7-sw-3', x: 3150, y: 277, w: 44, h: 18, targetGateId: 's7-gate-3', mode: 'timed', duration: 9.5 },
    ],
    gates: [
      { id: 's7-gate-1', x: 1640, y: 350, w: 32, h: 120, openOffsetY: -125 },
      { id: 's7-gate-2', x: 2515, y: 310, w: 32, h: 120, openOffsetY: -125 },
      { id: 's7-gate-3', x: 3980, y: 220, w: 32, h: 120, openOffsetY: -125 },
    ],
    bouncePads: [
      { id: 's7-bp-1', x: 730, y: 494, w: 56, h: 16, power: 820 },
      { id: 's7-bp-2', x: 2425, y: 414, w: 56, h: 16, power: 810 },
      { id: 's7-bp-3', x: 3350, y: 394, w: 56, h: 16, power: 820 },
    ],
    crystals: [
      { id: 's7-c1', x: 415, y: 425, radius: 13 },
      { id: 's7-c2', x: 1020, y: 360, radius: 13 },
      { id: 's7-c3', x: 1930, y: 345, radius: 13 },
      { id: 's7-c4', x: 2345, y: 235, radius: 13 },
      { id: 's7-c5', x: 3175, y: 225, radius: 13 },
      { id: 's7-c6', x: 3860, y: 265, radius: 13 },
    ],
    enemies: [
      {
        id: 's7-saw-1',
        type: 'saw_slider',
        x: 560,
        y: 482,
        w: 34,
        h: 34,
        patrolMinX: 490,
        patrolMaxX: 690,
        speed: 195,
      },
      {
        id: 's7-d1',
        type: 'patrol_drone',
        x: 990,
        y: 350,
        w: 32,
        h: 26,
        patrolMinX: 900,
        patrolMaxX: 1120,
        speed: 170,
      },
      {
        id: 's7-saw-2',
        type: 'saw_slider',
        x: 1360,
        y: 442,
        w: 34,
        h: 34,
        patrolMinX: 1240,
        patrolMaxX: 1580,
        speed: 205,
      },
      {
        id: 's7-t1',
        type: 'pulse_turret',
        x: 1410,
        y: 200,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 2.35,
        laserLength: 265,
      },
      {
        id: 's7-d2',
        type: 'patrol_drone',
        x: 2320,
        y: 385,
        w: 32,
        h: 26,
        patrolMinX: 2170,
        patrolMaxX: 2475,
        speed: 175,
      },
      {
        id: 's7-saw-3',
        type: 'saw_slider',
        x: 3110,
        y: 382,
        w: 34,
        h: 34,
        patrolMinX: 2960,
        patrolMaxX: 3310,
        speed: 215,
      },
      {
        id: 's7-t2',
        type: 'pulse_turret',
        x: 3840,
        y: 120,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 2.3,
        laserLength: 215,
      },
    ],
  },

  // =========================================================================
  // SEKTOR 08 · SCHWARZE KATHEDRALE (4650 px) — Laser-Taktung & Multi-Schleusen
  // =========================================================================
  {
    index: 7,
    id: 'stage-8',
    name: '08 · Schwarze Kathedrale',
    subtitle: 'Verwobene Geschützsalven und geteilte Kommandowege unter Stahlrippen',
    theme: 'nerve_cathedral',
    width: 4650,
    height: 720,
    spawn: { x: 106, y: 510 },
    checkpoints: [
      { id: 's8-cp1', x: 1620, y: 400 },
      { id: 's8-cp2', x: 3180, y: 380 },
    ],
    goal: { x: 4490, y: 236, w: 64, h: 84 },
    parTimeSeconds: 78,
    platforms: [
      { id: 's8-floor-1', kind: 'solid', x: 0, y: 590, w: 380, h: 130 },
      { id: 's8-p2', kind: 'solid', x: 480, y: 520, w: 460, h: 200 },
      { id: 's8-p2-up', kind: 'oneway', x: 590, y: 390, w: 200, h: 18, accent: 'bone' },
      {
        id: 's8-mov-1',
        kind: 'moving',
        x: 1020,
        y: 490,
        w: 125,
        h: 22,
        accent: 'crimson',
        moveAxis: 'y',
        moveRange: 145,
        moveSpeed: 2.1,
        movePhase: 0,
      },
      { id: 's8-p3', kind: 'solid', x: 1230, y: 400, w: 580, h: 320 },
      { id: 's8-p3-up', kind: 'oneway', x: 1390, y: 275, w: 210, h: 18, accent: 'crimson' },
      {
        id: 's8-mov-2',
        kind: 'moving',
        x: 1890,
        y: 410,
        w: 125,
        h: 22,
        accent: 'bone',
        moveAxis: 'x',
        moveRange: 190,
        moveSpeed: 2.25,
        movePhase: 1.0,
      },
      { id: 's8-p4', kind: 'solid', x: 2280, y: 400, w: 460, h: 320 },
      { id: 's8-p4-up', kind: 'oneway', x: 2400, y: 275, w: 190, h: 18, accent: 'bone' },
      {
        id: 's8-mov-3',
        kind: 'moving',
        x: 2820,
        y: 420,
        w: 120,
        h: 22,
        accent: 'crimson',
        moveAxis: 'x',
        moveRange: 165,
        moveSpeed: 2.25,
        movePhase: 0.3,
      },
      { id: 's8-p5', kind: 'solid', x: 3150, y: 380, w: 640, h: 340 },
      { id: 's8-p5-up', kind: 'oneway', x: 3340, y: 255, w: 200, h: 18, accent: 'crimson' },
      { id: 's8-end', kind: 'solid', x: 3910, y: 320, w: 740, h: 400 },
      { id: 's8-wall-1', kind: 'solid', x: 890, y: 0, w: 32, h: 400, accent: 'bone' },
      { id: 's8-wall-2', kind: 'solid', x: 1760, y: 0, w: 32, h: 280, accent: 'bone' },
      { id: 's8-end-wall', kind: 'solid', x: 4320, y: 0, w: 32, h: 200, accent: 'bone' },
    ],
    switches: [
      { id: 's8-sw-1', x: 670, y: 372, w: 44, h: 18, targetGateId: 's8-gate-1', mode: 'latch' },
      { id: 's8-sw-2', x: 1475, y: 257, w: 44, h: 18, targetGateId: 's8-gate-2', mode: 'hold' },
      { id: 's8-sw-3', x: 3420, y: 237, w: 44, h: 18, targetGateId: 's8-gate-3', mode: 'timed', duration: 9.5 },
    ],
    gates: [
      { id: 's8-gate-1', x: 890, y: 400, w: 32, h: 120, openOffsetY: -125 },
      { id: 's8-gate-2', x: 1760, y: 280, w: 32, h: 120, openOffsetY: -125 },
      { id: 's8-gate-3', x: 4320, y: 200, w: 32, h: 120, openOffsetY: -125 },
    ],
    bouncePads: [
      { id: 's8-bp-1', x: 505, y: 504, w: 56, h: 16, power: 820 },
      { id: 's8-bp-2', x: 1260, y: 384, w: 56, h: 16, power: 820 },
      { id: 's8-bp-3', x: 3240, y: 364, w: 56, h: 16, power: 820 },
    ],
    crystals: [
      { id: 's8-c1', x: 690, y: 315, radius: 13 },
      { id: 's8-c2', x: 1085, y: 295, radius: 13 },
      { id: 's8-c3', x: 1495, y: 205, radius: 13 },
      { id: 's8-c4', x: 2495, y: 215, radius: 13 },
      { id: 's8-c5', x: 3440, y: 195, radius: 13 },
      { id: 's8-c6', x: 4120, y: 245, radius: 13 },
    ],
    enemies: [
      {
        id: 's8-t1',
        type: 'pulse_turret',
        x: 640,
        y: 165,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 2.35,
        laserLength: 350,
      },
      {
        id: 's8-d1',
        type: 'patrol_drone',
        x: 1450,
        y: 355,
        w: 32,
        h: 26,
        patrolMinX: 1340,
        patrolMaxX: 1710,
        speed: 175,
      },
      {
        id: 's8-t2',
        type: 'pulse_turret',
        x: 1520,
        y: 120,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 2.2,
        laserLength: 275,
      },
      {
        id: 's8-saw-1',
        type: 'saw_slider',
        x: 2440,
        y: 372,
        w: 34,
        h: 34,
        patrolMinX: 2300,
        patrolMaxX: 2690,
        speed: 210,
      },
      {
        id: 's8-t3',
        type: 'pulse_turret',
        x: 3480,
        y: 125,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 2.2,
        laserLength: 250,
      },
      {
        id: 's8-d2',
        type: 'patrol_drone',
        x: 4050,
        y: 275,
        w: 32,
        h: 26,
        patrolMinX: 3940,
        patrolMaxX: 4280,
        speed: 185,
      },
    ],
  },

  // =========================================================================
  // SEKTOR 09 · HOCHSPANNUNG (5000 px) — Reaktor-Vorhof & Sperrfeuer-Korridor
  // =========================================================================
  {
    index: 8,
    id: 'stage-9',
    name: '09 · Hochspannung',
    subtitle: 'Im innersten Reaktorring: Präzisions-Dashes und Geschütz-Sperrfeuer',
    theme: 'quarantine_vault',
    width: 5000,
    height: 720,
    spawn: { x: 106, y: 500 },
    checkpoints: [
      { id: 's9-cp1', x: 1780, y: 430 },
      { id: 's9-cp2', x: 3440, y: 350 },
    ],
    goal: { x: 4835, y: 226, w: 64, h: 84 },
    parTimeSeconds: 86,
    platforms: [
      { id: 's9-floor-1', kind: 'solid', x: 0, y: 580, w: 340, h: 140 },
      {
        id: 's9-mov-1',
        kind: 'moving',
        x: 420,
        y: 530,
        w: 120,
        h: 22,
        accent: 'crimson',
        moveAxis: 'x',
        moveRange: 185,
        moveSpeed: 2.3,
        movePhase: 0,
      },
      { id: 's9-p2', kind: 'solid', x: 780, y: 480, w: 380, h: 240 },
      { id: 's9-p2-top', kind: 'oneway', x: 860, y: 350, w: 190, h: 18, accent: 'bone' },
      { id: 's9-p3', kind: 'solid', x: 1280, y: 430, w: 580, h: 290 },
      {
        id: 's9-mov-2',
        kind: 'moving',
        x: 1940,
        y: 450,
        w: 120,
        h: 22,
        accent: 'crimson',
        moveAxis: 'y',
        moveRange: 155,
        moveSpeed: 2.3,
        movePhase: 1.5,
      },
      { id: 's9-p4', kind: 'solid', x: 2150, y: 360, w: 560, h: 360 },
      { id: 's9-p4-top', kind: 'oneway', x: 2290, y: 235, w: 190, h: 18, accent: 'crimson' },
      {
        id: 's9-mov-3',
        kind: 'moving',
        x: 2790,
        y: 360,
        w: 115,
        h: 22,
        accent: 'bone',
        moveAxis: 'x',
        moveRange: 190,
        moveSpeed: 2.35,
        movePhase: 0.3,
      },
      { id: 's9-p5', kind: 'solid', x: 3170, y: 350, w: 580, h: 370 },
      { id: 's9-p5-top', kind: 'oneway', x: 3340, y: 220, w: 190, h: 18, accent: 'bone' },
      {
        id: 's9-mov-4',
        kind: 'moving',
        x: 3830,
        y: 340,
        w: 115,
        h: 22,
        accent: 'crimson',
        moveAxis: 'x',
        moveRange: 175,
        moveSpeed: 2.4,
        movePhase: 1.1,
      },
      { id: 's9-end', kind: 'solid', x: 4210, y: 310, w: 790, h: 410 },
      { id: 's9-wall-1', kind: 'solid', x: 1710, y: 0, w: 32, h: 310, accent: 'bone' },
      { id: 's9-wall-2', kind: 'solid', x: 2660, y: 0, w: 32, h: 240, accent: 'bone' },
      { id: 's9-end-ceil', kind: 'solid', x: 4650, y: 0, w: 32, h: 190, accent: 'bone' },
    ],
    switches: [
      { id: 's9-sw-1', x: 930, y: 332, w: 44, h: 18, targetGateId: 's9-gate-1', mode: 'timed', duration: 9.0 },
      { id: 's9-sw-2', x: 2360, y: 217, w: 44, h: 18, targetGateId: 's9-gate-2', mode: 'hold' },
      { id: 's9-sw-3', x: 3410, y: 202, w: 44, h: 18, targetGateId: 's9-gate-3', mode: 'timed', duration: 10.0 },
    ],
    gates: [
      { id: 's9-gate-1', x: 1710, y: 310, w: 32, h: 120, openOffsetY: -125 },
      { id: 's9-gate-2', x: 2660, y: 240, w: 32, h: 120, openOffsetY: -125 },
      { id: 's9-gate-3', x: 4650, y: 190, w: 32, h: 120, openOffsetY: -125 },
    ],
    bouncePads: [
      { id: 's9-bp-1', x: 1090, y: 464, w: 56, h: 16, power: 830 },
      { id: 's9-bp-2', x: 2175, y: 344, w: 56, h: 16, power: 820 },
      { id: 's9-bp-3', x: 3200, y: 334, w: 56, h: 16, power: 820 },
    ],
    crystals: [
      { id: 's9-c1', x: 580, y: 410, radius: 13 },
      { id: 's9-c2', x: 950, y: 270, radius: 13 },
      { id: 's9-c3', x: 1520, y: 310, radius: 13 },
      { id: 's9-c4', x: 2380, y: 165, radius: 13 },
      { id: 's9-c5', x: 3430, y: 160, radius: 13 },
      { id: 's9-c6', x: 4420, y: 235, radius: 13 },
    ],
    enemies: [
      {
        id: 's9-saw-1',
        type: 'saw_slider',
        x: 860,
        y: 452,
        w: 34,
        h: 34,
        patrolMinX: 800,
        patrolMaxX: 1050,
        speed: 215,
      },
      {
        id: 's9-t1',
        type: 'pulse_turret',
        x: 1390,
        y: 165,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 2.15,
        laserLength: 260,
      },
      {
        id: 's9-t2',
        type: 'pulse_turret',
        x: 1560,
        y: 165,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 2.45,
        laserLength: 260,
      },
      {
        id: 's9-d1',
        type: 'patrol_drone',
        x: 2350,
        y: 310,
        w: 32,
        h: 26,
        patrolMinX: 2240,
        patrolMaxX: 2610,
        speed: 185,
      },
      {
        id: 's9-saw-2',
        type: 'saw_slider',
        x: 3340,
        y: 322,
        w: 34,
        h: 34,
        patrolMinX: 3270,
        patrolMaxX: 3680,
        speed: 220,
      },
      {
        id: 's9-t3',
        type: 'pulse_turret',
        x: 4380,
        y: 105,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 2.1,
        laserLength: 205,
      },
      {
        id: 's9-d2',
        type: 'patrol_drone',
        x: 4460,
        y: 265,
        w: 32,
        h: 26,
        patrolMinX: 4240,
        patrolMaxX: 4610,
        speed: 195,
      },
    ],
  },

  // =========================================================================
  // SEKTOR 10 · ROTER KERN (5400 px) — Das große Finale mit allem Arsenal
  // =========================================================================
  {
    index: 9,
    id: 'stage-10',
    name: '10 · Roter Kern',
    subtitle: 'Großes Finale: Durchbrich den Zentral-Reaktor mit ASCHE & KRON',
    theme: 'bioreactor_abyss',
    width: 5400,
    height: 720,
    spawn: { x: 106, y: 520 },
    checkpoints: [
      { id: 's10-cp1', x: 1820, y: 440 },
      { id: 's10-cp2', x: 3560, y: 310 },
    ],
    goal: { x: 5230, y: 216, w: 68, h: 86 },
    parTimeSeconds: 98,
    platforms: [
      { id: 's10-floor-1', kind: 'solid', x: 0, y: 600, w: 360, h: 120 },
      {
        id: 's10-mov-1',
        kind: 'moving',
        x: 430,
        y: 550,
        w: 125,
        h: 22,
        accent: 'crimson',
        moveAxis: 'x',
        moveRange: 175,
        moveSpeed: 2.25,
        movePhase: 0,
      },
      { id: 's10-isl-1', kind: 'solid', x: 780, y: 500, w: 380, h: 220 },
      { id: 's10-high-1', kind: 'oneway', x: 870, y: 380, w: 190, h: 18, accent: 'bone' },
      { id: 's10-isl-2', kind: 'solid', x: 1260, y: 440, w: 660, h: 280 },
      { id: 's10-isl-2up', kind: 'oneway', x: 1470, y: 320, w: 200, h: 18, accent: 'crimson' },
      {
        id: 's10-mov-2',
        kind: 'moving',
        x: 2000,
        y: 430,
        w: 120,
        h: 22,
        accent: 'crimson',
        moveAxis: 'y',
        moveRange: 145,
        moveSpeed: 2.3,
        movePhase: 1.2,
      },
      { id: 's10-shaft-l', kind: 'solid', x: 2210, y: 170, w: 28, h: 350 },
      { id: 's10-shaft-r', kind: 'solid', x: 2365, y: 140, w: 28, h: 420 },
      { id: 's10-shaft-base', kind: 'solid', x: 2190, y: 510, w: 205, h: 210 },
      { id: 's10-bridge-mid', kind: 'solid', x: 2365, y: 290, w: 580, h: 28, accent: 'bone' },
      {
        id: 's10-mov-3',
        kind: 'moving',
        x: 3020,
        y: 330,
        w: 120,
        h: 22,
        accent: 'crimson',
        moveAxis: 'x',
        moveRange: 185,
        moveSpeed: 2.45,
        movePhase: 0.5,
      },
      { id: 's10-isl-3', kind: 'solid', x: 3390, y: 310, w: 660, h: 410 },
      { id: 's10-isl-3up', kind: 'oneway', x: 3580, y: 190, w: 210, h: 18, accent: 'bone' },
      {
        id: 's10-mov-4',
        kind: 'moving',
        x: 4130,
        y: 330,
        w: 115,
        h: 22,
        accent: 'crimson',
        moveAxis: 'x',
        moveRange: 180,
        moveSpeed: 2.5,
        movePhase: 1.4,
      },
      { id: 's10-end', kind: 'solid', x: 4510, y: 300, w: 890, h: 420 },
      { id: 's10-wall-1', kind: 'solid', x: 1860, y: 0, w: 32, h: 320, accent: 'bone' },
      { id: 's10-wall-2', kind: 'solid', x: 3990, y: 0, w: 32, h: 190, accent: 'bone' },
      { id: 's10-ceil-end', kind: 'solid', x: 5050, y: 0, w: 32, h: 180, accent: 'bone' },
    ],
    switches: [
      { id: 's10-sw-1', x: 940, y: 362, w: 44, h: 18, targetGateId: 's10-gate-1', mode: 'timed', duration: 9.0 },
      { id: 's10-sw-2', x: 3660, y: 172, w: 44, h: 18, targetGateId: 's10-gate-2', mode: 'hold' },
      { id: 's10-sw-3', x: 4840, y: 282, w: 44, h: 18, targetGateId: 's10-gate-3', mode: 'timed', duration: 8.5 },
    ],
    gates: [
      { id: 's10-gate-1', x: 1860, y: 320, w: 32, h: 120, openOffsetY: -125 },
      { id: 's10-gate-2', x: 3990, y: 190, w: 32, h: 120, openOffsetY: -125 },
      { id: 's10-gate-3', x: 5050, y: 180, w: 32, h: 120, openOffsetY: -125 },
    ],
    bouncePads: [
      { id: 's10-bp-1', x: 1085, y: 484, w: 56, h: 16, power: 840 },
      { id: 's10-bp-2', x: 1680, y: 424, w: 56, h: 16, power: 820 },
      { id: 's10-bp-3', x: 2260, y: 494, w: 56, h: 16, power: 870 },
      { id: 's10-bp-4', x: 3440, y: 294, w: 56, h: 16, power: 810 },
    ],
    crystals: [
      { id: 's10-c1', x: 560, y: 455, radius: 13 },
      { id: 's10-c2', x: 960, y: 310, radius: 13 },
      { id: 's10-c3', x: 1570, y: 265, radius: 13 },
      { id: 's10-c4', x: 2290, y: 250, radius: 13 },
      { id: 's10-c5', x: 3160, y: 225, radius: 13 },
      { id: 's10-c6', x: 3685, y: 135, radius: 13 },
      { id: 's10-c7', x: 4720, y: 220, radius: 13 },
    ],
    enemies: [
      {
        id: 's10-saw-1',
        type: 'saw_slider',
        x: 890,
        y: 472,
        w: 34,
        h: 34,
        patrolMinX: 800,
        patrolMaxX: 1050,
        speed: 220,
      },
      {
        id: 's10-turret-1',
        type: 'pulse_turret',
        x: 1390,
        y: 195,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 2.1,
        laserLength: 240,
      },
      {
        id: 's10-drone-1',
        type: 'patrol_drone',
        x: 1530,
        y: 385,
        w: 32,
        h: 26,
        patrolMinX: 1290,
        patrolMaxX: 1810,
        speed: 195,
      },
      {
        id: 's10-turret-2',
        type: 'pulse_turret',
        x: 2590,
        y: 75,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 2.0,
        laserLength: 210,
      },
      {
        id: 's10-saw-2',
        type: 'saw_slider',
        x: 2570,
        y: 262,
        w: 34,
        h: 34,
        patrolMinX: 2410,
        patrolMaxX: 2880,
        speed: 230,
      },
      {
        id: 's10-drone-2',
        type: 'patrol_drone',
        x: 3690,
        y: 260,
        w: 32,
        h: 26,
        patrolMinX: 3500,
        patrolMaxX: 3940,
        speed: 200,
      },
      {
        id: 's10-turret-3',
        type: 'pulse_turret',
        x: 4730,
        y: 95,
        w: 34,
        h: 34,
        speed: 0,
        fireInterval: 2.0,
        laserLength: 205,
      },
      {
        id: 's10-drone-3',
        type: 'patrol_drone',
        x: 4680,
        y: 255,
        w: 32,
        h: 26,
        patrolMinX: 4540,
        patrolMaxX: 5010,
        speed: 210,
      },
    ],
  },
];

interface SectorBlueprint {
  index: number;
  id: string;
  name: string;
  subtitle: string;
  theme: LevelDef['theme'];
  targetWidth: number;
  parTimeSeconds: number;
}

const EXTRA_SECTORS: SectorBlueprint[] = [
  {
    index: 10,
    id: 'stage-11',
    name: '11 · Blut-Aquädukt',
    subtitle: 'Toxische Abflusskanäle: Weiche Mörser-Spuckern und Jäger-Wespen im Gleitflug aus',
    theme: 'toxic_sewer',
    targetWidth: 7050,
    parTimeSeconds: 118,
  },
  {
    index: 11,
    id: 'stage-12',
    name: '12 · Quarantäne-Bunker',
    subtitle: 'Schwer gepanzerte Schild-Exekutoren blockieren die Schleusen — Harpune oder Flanke nutzen',
    theme: 'quarantine_vault',
    targetWidth: 7400,
    parTimeSeconds: 126,
  },
  {
    index: 12,
    id: 'stage-13',
    name: '13 · Nerven-Katakomben',
    subtitle: 'Biomasse und Blut-Kriecher in den tiefen Gewölben vor der Brutkammer',
    theme: 'nerve_cathedral',
    targetWidth: 7750,
    parTimeSeconds: 134,
  },
  {
    index: 13,
    id: 'stage-14',
    name: '14 · Omega-Brutkammer',
    subtitle: 'Finale Konfrontation: Durchbrich das Omega-Sanktum und vernichte KARNIFEX-09 · Blut-Seraph',
    theme: 'omega_sanctum',
    targetWidth: 8200,
    parTimeSeconds: 165,
  },
];

function buildVariedFinale(
  prefix: string,
  cursorX: number,
  cursorY: number,
  targetWidth: number,
  difficulty: number,
): {
  platforms: PlatformDef[];
  switches: SwitchDef[];
  gates: GateDef[];
  bouncePads: LevelDef['bouncePads'];
  crystals: CrystalDef[];
  enemies: EnemyDef[];
  goal: LevelDef['goal'];
} {
  const platforms: PlatformDef[] = [];
  const switches: SwitchDef[] = [];
  const gates: GateDef[] = [];
  const bouncePads: LevelDef['bouncePads'] = [];
  const crystals: CrystalDef[] = [];
  const enemies: EnemyDef[] = [];

  const variant = (difficulty - 1) % 6;
  const startX = cursorX + 100;
  const availW = Math.max(540, targetWidth - startX);

  if (variant === 0) {
    // Finale 0: Hochsprung-Bastion (Lower Launch Pier -> Bounce Tower -> Elevated Shrine)
    const lowY = Math.min(555, Math.max(440, cursorY + 45));
    const lowW = Math.min(250, Math.round(availW * 0.36));
    platforms.push({
      id: `${prefix}-fin0-low`,
      kind: 'solid',
      x: startX,
      y: lowY,
      w: lowW,
      h: 720 - lowY,
      accent: 'bio',
    });
    bouncePads.push({
      id: `${prefix}-fin0-bp`,
      x: startX + lowW - 76,
      y: lowY - 16,
      w: 56,
      h: 16,
      power: 845,
    });

    const highX = startX + lowW + 75;
    const highY = 265;
    const highW = Math.max(260, targetWidth - highX);
    platforms.push({
      id: `${prefix}-fin0-high`,
      kind: 'solid',
      x: highX,
      y: highY,
      w: highW,
      h: 36,
      accent: 'bone',
    });
    platforms.push({
      id: `${prefix}-fin0-pillar`,
      kind: 'solid',
      x: highX + Math.round(highW * 0.35),
      y: highY + 36,
      w: 64,
      h: 720 - (highY + 36),
      accent: 'none',
    });
    crystals.push({
      id: `${prefix}-fin0-c`,
      x: highX - 24,
      y: highY - 52,
      radius: 13,
    });
    enemies.push({
      id: `${prefix}-fin0-guard`,
      type: difficulty >= 3 ? 'hunter_wasp' : 'patrol_drone',
      x: highX + 85,
      y: highY - 96,
      w: 30,
      h: 26,
      patrolMinX: highX + 16,
      patrolMaxX: targetWidth - 190,
      speed: 120 + difficulty * 6,
    });

    const goalX = targetWidth - 135;
    return {
      platforms,
      switches,
      gates,
      bouncePads,
      crystals,
      enemies,
      goal: { x: goalX, y: highY - 84, w: 66, h: 84 },
    };
  }

  if (variant === 1) {
    // Finale 1: Abriegelungs-Schleuse (Catwalk Timed Switch -> Full-Bulkhead Blast Gate -> Goal Vault)
    const deckY = Math.max(360, Math.min(510, cursorY));
    const deckW = Math.max(520, availW);
    platforms.push({
      id: `${prefix}-fin1-deck`,
      kind: 'solid',
      x: startX,
      y: deckY,
      w: deckW,
      h: 720 - deckY,
      accent: 'crimson',
    });
    const shelfX = startX + 55;
    const shelfY = deckY - 122;
    platforms.push({
      id: `${prefix}-fin1-shelf`,
      kind: 'oneway',
      x: shelfX,
      y: shelfY,
      w: 175,
      h: 18,
      accent: 'bone',
    });
    const gateX = startX + Math.round(deckW * 0.62);
    const gateId = `${prefix}-fin1-gate`;
    switches.push({
      id: `${prefix}-fin1-sw`,
      x: shelfX + 66,
      y: shelfY - 18,
      w: 44,
      h: 18,
      targetGateId: gateId,
      mode: 'timed',
      duration: 8.5,
    });
    gates.push({
      id: gateId,
      x: gateX,
      y: deckY - 120,
      w: 36,
      h: 120,
      openOffsetY: -122,
    });
    platforms.push({
      id: `${prefix}-fin1-bulkhead`,
      kind: 'solid',
      x: gateX,
      y: 0,
      w: 36,
      h: deckY - 120,
      accent: 'bone',
    });
    crystals.push({
      id: `${prefix}-fin1-c`,
      x: shelfX + 88,
      y: shelfY - 62,
      radius: 13,
    });
    enemies.push({
      id: `${prefix}-fin1-guard`,
      type: difficulty >= 4 ? 'shield_enforcer' : 'stalker_crawler',
      x: startX + Math.round(deckW * 0.42),
      y: deckY - (difficulty >= 4 ? 40 : 26),
      w: 32,
      h: difficulty >= 4 ? 40 : 26,
      patrolMinX: startX + 60,
      patrolMaxX: gateX - 55,
      speed: difficulty >= 4 ? 90 : 145,
    });

    const goalX = Math.min(targetWidth - 120, gateX + 115);
    return {
      platforms,
      switches,
      gates,
      bouncePads,
      crystals,
      enemies,
      goal: { x: goalX, y: deckY - 84, w: 66, h: 84 },
    };
  }

  if (variant === 2) {
    // Finale 2: Schwebebahn-Abgrund (Moving Sled under Watchtower Turret -> Stepped Shrine)
    const entryY = Math.max(340, Math.min(490, cursorY));
    const entryW = 145;
    platforms.push({
      id: `${prefix}-fin2-entry`,
      kind: 'solid',
      x: startX,
      y: entryY,
      w: entryW,
      h: 720 - entryY,
      accent: 'bone',
    });
    const movX = startX + entryW + 35;
    const movRange = Math.max(120, Math.min(180, availW - 430));
    platforms.push({
      id: `${prefix}-fin2-mov`,
      kind: 'moving',
      x: movX,
      y: entryY - 18,
      w: 128,
      h: 22,
      accent: 'crimson',
      moveAxis: 'x',
      moveRange: movRange,
      moveSpeed: Math.min(2.4, 1.45 + difficulty * 0.08),
      movePhase: 0.4,
    });
    crystals.push({
      id: `${prefix}-fin2-c`,
      x: movX + Math.round(movRange * 0.55) + 50,
      y: entryY - 85,
      radius: 13,
    });
    enemies.push({
      id: `${prefix}-fin2-turret`,
      type: 'pulse_turret',
      x: movX + Math.round(movRange * 0.5) + 42,
      y: Math.max(45, entryY - 245),
      w: 34,
      h: 34,
      speed: 0,
      fireInterval: Math.max(2.0, 2.9 - difficulty * 0.06),
      laserLength: 215,
    });

    const shrineX = movX + movRange + 150;
    const shrineY = Math.max(280, entryY - 45);
    const shrineW = Math.max(220, targetWidth - shrineX);
    platforms.push({
      id: `${prefix}-fin2-shrine`,
      kind: 'solid',
      x: shrineX,
      y: shrineY,
      w: shrineW,
      h: 720 - shrineY,
      accent: 'bio',
    });

    const goalX = Math.min(targetWidth - 125, shrineX + shrineW - 135);
    return {
      platforms,
      switches,
      gates,
      bouncePads,
      crystals,
      enemies,
      goal: { x: goalX, y: shrineY - 84, w: 66, h: 84 },
    };
  }

  if (variant === 3) {
    // Finale 3: Tiefbunker-Schacht (Drop into Lower Pit -> Latch Gate -> Bounce up to Balcony Goal)
    const pitY = 550;
    const pitW = Math.round(availW * 0.58);
    platforms.push({
      id: `${prefix}-fin3-pit`,
      kind: 'solid',
      x: startX,
      y: pitY,
      w: pitW,
      h: 720 - pitY,
      accent: 'crimson',
    });
    const gateX = startX + pitW - 88;
    const gateId = `${prefix}-fin3-gate`;
    switches.push({
      id: `${prefix}-fin3-sw`,
      x: startX + 75,
      y: pitY - 18,
      w: 44,
      h: 18,
      targetGateId: gateId,
      mode: 'latch',
    });
    gates.push({
      id: gateId,
      x: gateX,
      y: pitY - 120,
      w: 34,
      h: 120,
      openOffsetY: -124,
    });
    platforms.push({
      id: `${prefix}-fin3-bulkhead`,
      kind: 'solid',
      x: gateX,
      y: 0,
      w: 34,
      h: pitY - 120,
      accent: 'bone',
    });
    enemies.push({
      id: `${prefix}-fin3-crawler`,
      type: 'stalker_crawler',
      x: startX + Math.round(pitW * 0.45),
      y: pitY - 26,
      w: 34,
      h: 26,
      patrolMinX: startX + 135,
      patrolMaxX: gateX - 48,
      speed: Math.min(185, 115 + difficulty * 5),
    });

    const balcX = startX + pitW;
    const balcY = 340;
    const balcW = Math.max(210, targetWidth - balcX);
    platforms.push({
      id: `${prefix}-fin3-balc`,
      kind: 'solid',
      x: balcX,
      y: balcY,
      w: balcW,
      h: 720 - balcY,
      accent: 'bone',
    });
    bouncePads.push({
      id: `${prefix}-fin3-bp`,
      x: gateX + 40,
      y: pitY - 16,
      w: 48,
      h: 16,
      power: 830,
    });
    crystals.push({
      id: `${prefix}-fin3-c`,
      x: balcX - 16,
      y: balcY - 58,
      radius: 13,
    });

    const goalX = Math.min(targetWidth - 120, balcX + balcW - 130);
    return {
      platforms,
      switches,
      gates,
      bouncePads,
      crystals,
      enemies,
      goal: { x: goalX, y: balcY - 84, w: 66, h: 84 },
    };
  }

  if (variant === 4) {
    // Finale 4: Kreissägen-Korridor (Dual-Tier Saw Bridge & Mortar Overlook -> Raised Plinth)
    const bridgeY = Math.max(380, Math.min(500, cursorY + 10));
    const bridgeW = Math.max(360, availW - 210);
    platforms.push({
      id: `${prefix}-fin4-bridge`,
      kind: 'solid',
      x: startX,
      y: bridgeY,
      w: bridgeW,
      h: 720 - bridgeY,
      accent: 'none',
    });
    platforms.push({
      id: `${prefix}-fin4-cat`,
      kind: 'oneway',
      x: startX + 65,
      y: bridgeY - 115,
      w: Math.max(150, bridgeW - 130),
      h: 18,
      accent: 'crimson',
    });
    enemies.push({
      id: `${prefix}-fin4-saw`,
      type: 'saw_slider',
      x: startX + Math.round(bridgeW * 0.4),
      y: bridgeY - 28,
      w: 34,
      h: 34,
      patrolMinX: startX + 45,
      patrolMaxX: startX + bridgeW - 55,
      speed: Math.min(245, 145 + difficulty * 8),
    });
    if (difficulty >= 5) {
      enemies.push({
        id: `${prefix}-fin4-spit`,
        type: 'mortar_spitter',
        x: startX + Math.round(bridgeW * 0.52),
        y: bridgeY - 115 - 32,
        w: 34,
        h: 32,
        speed: 0,
        fireInterval: 2.2,
      });
    }
    crystals.push({
      id: `${prefix}-fin4-c`,
      x: startX + Math.round(bridgeW * 0.5),
      y: bridgeY - 168,
      radius: 13,
    });

    const altarX = startX + bridgeW + 45;
    const altarY = bridgeY - 62;
    const altarW = Math.max(175, targetWidth - altarX);
    platforms.push({
      id: `${prefix}-fin4-altar`,
      kind: 'solid',
      x: altarX,
      y: altarY,
      w: altarW,
      h: 720 - altarY,
      accent: 'bone',
    });
    const goalX = Math.min(targetWidth - 115, altarX + altarW - 125);
    return {
      platforms,
      switches,
      gates,
      bouncePads,
      crystals,
      enemies,
      goal: { x: goalX, y: altarY - 84, w: 66, h: 84 },
    };
  }

  // Finale 5: Zitadellen-Tor (Upper Sniper Balcony Switch -> Citadel Gate -> Inner Shrine)
  const baseY = Math.max(370, Math.min(490, cursorY));
  const baseW = Math.max(520, availW);
  platforms.push({
    id: `${prefix}-fin5-base`,
    kind: 'solid',
    x: startX,
    y: baseY,
    w: baseW,
    h: 720 - baseY,
    accent: 'bio',
  });
  const stepX = startX + 75;
  const stepY = baseY - 108;
  platforms.push({
    id: `${prefix}-fin5-balcony`,
    kind: 'oneway',
    x: stepX,
    y: stepY,
    w: 195,
    h: 18,
    accent: 'bone',
  });
  const gateX = startX + Math.round(baseW * 0.6);
  const gateId = `${prefix}-fin5-gate`;
  switches.push({
    id: `${prefix}-fin5-sw`,
    x: stepX + 36,
    y: stepY - 18,
    w: 44,
    h: 18,
    targetGateId: gateId,
    mode: 'latch',
  });
  gates.push({
    id: gateId,
    x: gateX,
    y: baseY - 125,
    w: 36,
    h: 125,
    openOffsetY: -128,
  });
  platforms.push({
    id: `${prefix}-fin5-bulkhead`,
    kind: 'solid',
    x: gateX,
    y: 0,
    w: 36,
    h: baseY - 125,
    accent: 'bone',
  });
  enemies.push({
    id: `${prefix}-fin5-enforcer`,
    type: 'shield_enforcer',
    x: startX + Math.round(baseW * 0.4),
    y: baseY - 40,
    w: 32,
    h: 40,
    patrolMinX: startX + 60,
    patrolMaxX: gateX - 55,
    speed: 95,
  });
  crystals.push({
    id: `${prefix}-fin5-c`,
    x: stepX + 145,
    y: stepY - 56,
    radius: 13,
  });
  const shrineStepX = gateX + 68;
  const shrineStepY = baseY - 26;
  platforms.push({
    id: `${prefix}-fin5-plinth`,
    kind: 'solid',
    x: shrineStepX,
    y: shrineStepY,
    w: Math.max(150, targetWidth - shrineStepX),
    h: 26,
    accent: 'crimson',
  });
  const goalX = Math.min(targetWidth - 115, shrineStepX + 42);
  return {
    platforms,
    switches,
    gates,
    bouncePads,
    crystals,
    enemies,
    goal: { x: goalX, y: shrineStepY - 84, w: 66, h: 84 },
  };
}

function normalizeBuddyPods(
  candidates: BuddyPodDef[],
  level: {
    id: string;
    width: number;
    goalX: number;
    platforms: PlatformDef[];
    switches: SwitchDef[];
    gates: GateDef[];
    isBossStage: boolean;
  },
): BuddyPodDef[] {
  const MIN_SPACING = 1050;
  const MAX_PODS = level.width >= 6600 ? 3 : 2;
  const maxGoalAllowedX = level.isBossStage ? level.goalX - 380 : level.goalX - 720;

  // Keep only candidates far enough from exit and safely grounded on solid floors away from gates/switches
  const validCandidates = candidates
    .filter((p) => p.x >= 260 && p.x <= maxGoalAllowedX)
    .sort((a, b) => a.x - b.x);

  const chosen: BuddyPodDef[] = [];

  // For Stage 14 Boss Stage, prioritize the pre-boss recovery pod first, then space backwards
  if (level.isBossStage) {
    const preBossPod = validCandidates.find((p) => p.id === 's14-pod-boss');
    if (preBossPod) chosen.push(preBossPod);
  }

  for (const cand of validCandidates) {
    if (chosen.length >= MAX_PODS) break;
    if (chosen.some((existing) => Math.abs(existing.x - cand.x) < MIN_SPACING)) continue;
    chosen.push(cand);
  }

  // If fewer than 2 pods remain after anti-cluster filtering, pick solid deck spots along level thirds
  if (chosen.length < 2) {
    const solidDecks = level.platforms
      .filter((pl) => pl.kind === 'solid' && pl.w >= 180 && pl.y >= 240 && pl.y <= 620)
      .sort((a, b) => a.x - b.x);

    const targets = [level.width * 0.28, level.width * 0.56];
    for (let ti = 0; ti < targets.length && chosen.length < 2; ti++) {
      const targetX = Math.min(maxGoalAllowedX, targets[ti]);
      let bestSpot: { x: number; y: number } | null = null;
      let bestDist = Infinity;

      for (const deck of solidDecks) {
        const px = Math.round(Math.max(deck.x + 56, Math.min(deck.x + deck.w - 56, targetX)));
        if (px < 240 || px > maxGoalAllowedX) continue;
        if (chosen.some((c) => Math.abs(c.x - px) < 900)) continue;
        const hitsGateOrSwitch =
          level.gates.some((g) => Math.abs(g.x + g.w / 2 - px) < 60) ||
          level.switches.some((s) => Math.abs(s.x + s.w / 2 - px) < 52);
        if (hitsGateOrSwitch) continue;
        const d = Math.abs(px - targetX);
        if (d < bestDist) {
          bestDist = d;
          bestSpot = { x: px, y: deck.y };
        }
      }

      if (bestSpot) {
        chosen.push({
          id: `${level.id}-pod-balanced-${ti}`,
          x: bestSpot.x,
          y: bestSpot.y,
        });
      }
    }
  }

  return chosen.sort((a, b) => a.x - b.x);
}

function appendGauntletSegments(
  prefix: string,
  startX: number,
  startY: number,
  targetWidth: number,
  difficulty: number,
  reserveEndWidth = 820,
  skipGenericFinale = false,
): {
  platforms: PlatformDef[];
  switches: SwitchDef[];
  gates: GateDef[];
  bouncePads: LevelDef['bouncePads'];
  crystals: CrystalDef[];
  enemies: EnemyDef[];
  checkpoints: CheckpointDef[];
  buddyPods: BuddyPodDef[];
  goal: LevelDef['goal'];
  endCursorX: number;
  endCursorY: number;
} {
  const platforms: PlatformDef[] = [];
  const switches: SwitchDef[] = [];
  const gates: GateDef[] = [];
  const bouncePads: LevelDef['bouncePads'] = [];
  const crystals: CrystalDef[] = [];
  const enemies: EnemyDef[] = [];
  const checkpoints: CheckpointDef[] = [];
  const buddyPods: BuddyPodDef[] = [];

  let cursorX = startX + 105;
  let cursorY = Math.max(300, Math.min(540, startY));
  let seg = 1;

  // Initial bridge deck with Checkpoint + optional early-mid Gefährten-Kapsel
  const entryW = 340;
  platforms.push({
    id: `${prefix}-gx-entry`,
    kind: 'solid',
    x: cursorX,
    y: cursorY,
    w: entryW,
    h: 720 - cursorY,
    accent: 'bio',
  });
  checkpoints.push({ id: `${prefix}-gcp-0`, x: cursorX + 90, y: cursorY });
  buddyPods.push({ id: `${prefix}-gpod-0`, x: cursorX + 215, y: cursorY });
  cursorX += entryW;

  // Modular escalating gauntlet blocks until we reach final goal/boss deck
  while (cursorX < targetWidth - reserveEndWidth) {
    const remaining = targetWidth - cursorX - (reserveEndWidth - 640);
    const style = (seg + difficulty) % 4;

    if (style === 0 && remaining > 780) {
      const gap1 = 100;
      const movX = cursorX + gap1;
      const movRange = 165;
      const movW = 135;
      platforms.push({
        id: `${prefix}-gmov-${seg}`,
        kind: 'moving',
        x: movX,
        y: cursorY - 10,
        w: movW,
        h: 22,
        accent: 'crimson',
        moveAxis: 'x',
        moveRange: movRange,
        moveSpeed: Math.min(2.6, 1.35 + difficulty * 0.09),
        movePhase: seg * 0.7,
      });
      crystals.push({
        id: `${prefix}-gc-${seg}`,
        x: movX + Math.round(movRange * 0.65),
        y: cursorY - 68,
        radius: 13,
      });

      const landX = movX + movRange + movW + 95;
      cursorY = Math.max(290, Math.min(530, cursorY - 25));
      const landW = 440;
      platforms.push({
        id: `${prefix}-gplat-${seg}`,
        kind: 'solid',
        x: landX,
        y: cursorY,
        w: landW,
        h: 720 - cursorY,
        accent: seg % 2 === 0 ? 'crimson' : 'bio',
      });

      if (difficulty >= 4 && seg % 2 === 0) {
        enemies.push({
          id: `${prefix}-gshield-${seg}`,
          type: 'shield_enforcer',
          x: landX + 220,
          y: cursorY - 40,
          w: 32,
          h: 40,
          patrolMinX: landX + 80,
          patrolMaxX: landX + landW - 60,
          speed: 75 + difficulty * 4,
        });
      } else {
        enemies.push({
          id: `${prefix}-gcrawler-${seg}`,
          type: 'stalker_crawler',
          x: landX + 210,
          y: cursorY - 26,
          w: 34,
          h: 26,
          patrolMinX: landX + 45,
          patrolMaxX: landX + landW - 60,
          speed: Math.min(185, 110 + difficulty * 6),
        });
      }

      if (difficulty >= 2) {
        enemies.push({
          id: `${prefix}-gwasp-${seg}`,
          type: 'hunter_wasp',
          x: movX + 120,
          y: Math.max(120, cursorY - 135),
          w: 30,
          h: 26,
          patrolMinX: movX,
          patrolMaxX: landX + 150,
          speed: 120 + difficulty * 6,
        });
      }

      if (difficulty >= 3) {
        enemies.push({
          id: `${prefix}-gt-${seg}`,
          type: 'pulse_turret',
          x: landX + 210,
          y: Math.max(40, cursorY - 230),
          w: 34,
          h: 34,
          speed: 0,
          fireInterval: Math.max(1.9, 2.8 - difficulty * 0.06),
          laserLength: 210,
        });
      }
      cursorX = landX + landW;
    } else if (style === 1 && remaining > 760) {
      const platX = cursorX + 115;
      cursorY = Math.min(540, cursorY + 35);
      const platW = 540;
      platforms.push({
        id: `${prefix}-gplat-${seg}`,
        kind: 'solid',
        x: platX,
        y: cursorY,
        w: platW,
        h: 720 - cursorY,
      });
      const highY = cursorY - 125;
      platforms.push({
        id: `${prefix}-ghigh-${seg}`,
        kind: 'oneway',
        x: platX + 95,
        y: highY,
        w: 190,
        h: 18,
        accent: 'crimson',
      });
      const swId = `${prefix}-gsw-${seg}`;
      const gateId = `${prefix}-ggate-${seg}`;
      switches.push({
        id: swId,
        x: platX + 168,
        y: highY - 18,
        w: 44,
        h: 18,
        targetGateId: gateId,
        mode: difficulty >= 5 ? 'timed' : 'latch',
        duration: 8.0,
      });
      gates.push({
        id: gateId,
        x: platX + platW - 55,
        y: cursorY - 120,
        w: 32,
        h: 120,
        openOffsetY: -122,
      });
      platforms.push({
        id: `${prefix}-gceil-${seg}`,
        kind: 'solid',
        x: platX + platW - 55,
        y: 0,
        w: 32,
        h: cursorY - 120,
        accent: 'bone',
      });
      crystals.push({
        id: `${prefix}-gc-${seg}`,
        x: platX + 190,
        y: highY - 62,
        radius: 13,
      });
      if (difficulty >= 2) {
        enemies.push({
          id: `${prefix}-gsaw-${seg}`,
          type: 'saw_slider',
          x: platX + 240,
          y: cursorY - 28,
          w: 34,
          h: 34,
          patrolMinX: platX + 150,
          patrolMaxX: platX + platW - 110,
          speed: Math.min(240, 125 + difficulty * 9),
        });
      }
      if (difficulty >= 3) {
        enemies.push({
          id: `${prefix}-gspit-${seg}`,
          type: 'mortar_spitter',
          x: platX + 350,
          y: cursorY - 32,
          w: 34,
          h: 32,
          speed: 0,
          fireInterval: Math.max(1.9, 2.9 - difficulty * 0.06),
        });
      }
      if (seg === 3) {
        buddyPods.push({ id: `${prefix}-gpod-${seg}`, x: platX + 55, y: cursorY });
      }
      cursorX = platX + platW;
    } else if (style === 2 && remaining > 720) {
      const lowX = cursorX + 110;
      const lowY = Math.min(560, cursorY + 60);
      platforms.push({
        id: `${prefix}-glow-${seg}`,
        kind: 'solid',
        x: lowX,
        y: lowY,
        w: 250,
        h: 720 - lowY,
      });
      bouncePads.push({
        id: `${prefix}-gbp-${seg}`,
        x: lowX + 165,
        y: lowY - 16,
        w: 56,
        h: 16,
        power: 830,
      });
      const highBridgeX = lowX + 340;
      cursorY = Math.max(280, lowY - 175);
      const bridgeW = 390;
      platforms.push({
        id: `${prefix}-ghb-${seg}`,
        kind: 'solid',
        x: highBridgeX,
        y: cursorY,
        w: bridgeW,
        h: 28,
        accent: 'bone',
      });
      crystals.push({
        id: `${prefix}-gc-${seg}`,
        x: lowX + 270,
        y: cursorY - 45,
        radius: 13,
      });
      enemies.push({
        id: `${prefix}-gd-${seg}`,
        type: difficulty >= 5 ? 'shield_enforcer' : 'patrol_drone',
        x: highBridgeX + 190,
        y: cursorY - 40,
        w: 32,
        h: difficulty >= 5 ? 40 : 26,
        patrolMinX: highBridgeX + 60,
        patrolMaxX: highBridgeX + bridgeW - 55,
        speed: difficulty >= 5 ? 95 : Math.min(225, 115 + difficulty * 8),
      });
      if (seg === 2 || seg === 4) {
        checkpoints.push({ id: `${prefix}-gcp-${seg}`, x: highBridgeX + 55, y: cursorY });
      }
      if (seg === 4) {
        buddyPods.push({ id: `${prefix}-gpod-${seg}`, x: highBridgeX + 115, y: cursorY });
      }
      cursorX = highBridgeX + bridgeW;
    } else {
      const s1X = cursorX + 125;
      cursorY = Math.max(290, Math.min(510, cursorY - 20));
      platforms.push({
        id: `${prefix}-gstepA-${seg}`,
        kind: 'oneway',
        x: s1X,
        y: cursorY,
        w: 165,
        h: 18,
        accent: 'bone',
      });
      crystals.push({
        id: `${prefix}-gc-${seg}`,
        x: s1X + 82,
        y: cursorY - 48,
        radius: 13,
      });
      if (difficulty >= 2) {
        enemies.push({
          id: `${prefix}-gwaspB-${seg}`,
          type: 'hunter_wasp',
          x: s1X + 70,
          y: Math.max(120, cursorY - 125),
          w: 30,
          h: 26,
          patrolMinX: s1X - 20,
          patrolMaxX: s1X + 220,
          speed: 130 + difficulty * 6,
        });
      }
      const s2X = s1X + 275;
      platforms.push({
        id: `${prefix}-gstepB-${seg}`,
        kind: 'solid',
        x: s2X,
        y: cursorY + 25,
        w: 245,
        h: 720 - (cursorY + 25),
        accent: 'bio',
      });
      if (difficulty >= 4) {
        enemies.push({
          id: `${prefix}-gcrawlB-${seg}`,
          type: 'stalker_crawler',
          x: s2X + 120,
          y: cursorY + 25 - 26,
          w: 34,
          h: 26,
          patrolMinX: s2X + 20,
          patrolMaxX: s2X + 210,
          speed: 145,
        });
      }
      cursorY += 25;
      cursorX = s2X + 245;
    }

    seg += 1;
  }

  let goal: LevelDef['goal'] = { x: targetWidth - 135, y: 396, w: 66, h: 84 };
  if (!skipGenericFinale) {
    const finale = buildVariedFinale(prefix, cursorX, cursorY, targetWidth, difficulty);
    platforms.push(...finale.platforms);
    switches.push(...finale.switches);
    gates.push(...finale.gates);
    bouncePads.push(...finale.bouncePads);
    crystals.push(...finale.crystals);
    enemies.push(...finale.enemies);
    goal = finale.goal;
  }

  return {
    platforms,
    switches,
    gates,
    bouncePads,
    crystals,
    enemies,
    checkpoints,
    buddyPods,
    goal,
    endCursorX: cursorX,
    endCursorY: cursorY,
  };
}

function buildFourteenLevels(): LevelDef[] {
  const TARGET_WIDTHS = [3100, 3500, 3900, 4300, 4700, 5100, 5500, 5900, 6300, 6700];
  const result: LevelDef[] = [];

  for (let i = 0; i < BASE_LEVELS.length; i++) {
    const base = BASE_LEVELS[i];
    const targetW = TARGET_WIDTHS[i];
    const goalBottom = base.goal.y + base.goal.h;
    const ext = appendGauntletSegments(`s${i + 1}`, base.width, goalBottom, targetW, i + 1, 820, false);

    const midPods: BuddyPodDef[] = base.checkpoints.map((cp, cpIdx) => ({
      id: `${base.id}-pod-${cpIdx}`,
      x: cp.x + 56,
      y: cp.y,
    }));

    const allPlatforms = [...base.platforms, ...ext.platforms];
    const allSwitches = [
      ...base.switches.map((s) => ({ ...s, mode: s.mode === 'hold' ? ('latch' as const) : s.mode })),
      ...ext.switches,
    ];
    const allGates = [...base.gates, ...ext.gates];
    const normalizedPods = normalizeBuddyPods([...midPods, ...ext.buddyPods], {
      id: base.id,
      width: targetW,
      goalX: ext.goal.x,
      platforms: allPlatforms,
      switches: allSwitches,
      gates: allGates,
      isBossStage: false,
    });

    result.push({
      ...base,
      width: targetW,
      parTimeSeconds: Math.round(base.parTimeSeconds * 1.45),
      goal: ext.goal,
      checkpoints: [...base.checkpoints, ...ext.checkpoints],
      buddyPods: normalizedPods,
      platforms: allPlatforms,
      switches: allSwitches,
      gates: allGates,
      bouncePads: [...base.bouncePads, ...ext.bouncePads],
      crystals: [...base.crystals, ...ext.crystals],
      enemies: [...base.enemies, ...ext.enemies],
    });
  }

  // Generate Sectors 11..14 (with Sector 14 housing the Karnifex-09 Boss Arena)
  for (const bp of EXTRA_SECTORS) {
    const prefix = `s${bp.index + 1}`;
    const isBossStage = bp.index === 13;
    const startFloor: PlatformDef = {
      id: `${prefix}-start-floor`,
      kind: 'solid',
      x: 0,
      y: 600,
      w: 520,
      h: 120,
      accent: 'bone',
    };
    const warmupLedge: PlatformDef = {
      id: `${prefix}-warmup`,
      kind: 'oneway',
      x: 590,
      y: 515,
      w: 190,
      h: 18,
      accent: 'crimson',
    };
    const warmupDeck: PlatformDef = {
      id: `${prefix}-deck0`,
      kind: 'solid',
      x: 860,
      y: 495,
      w: 440,
      h: 225,
      accent: 'bio',
    };

    const ext = appendGauntletSegments(
      prefix,
      1300,
      495,
      bp.targetWidth,
      bp.index + 1,
      isBossStage ? 1420 : 820,
      isBossStage,
    );

    if (!isBossStage) {
      const allPlatforms = [startFloor, warmupLedge, warmupDeck, ...ext.platforms];
      const normalizedPods = normalizeBuddyPods(
        [{ id: `${prefix}-pod0`, x: 1120, y: 495 }, ...ext.buddyPods],
        {
          id: bp.id,
          width: bp.targetWidth,
          goalX: ext.goal.x,
          platforms: allPlatforms,
          switches: ext.switches,
          gates: ext.gates,
          isBossStage: false,
        },
      );

      result.push({
        index: bp.index,
        id: bp.id,
        name: bp.name,
        subtitle: bp.subtitle,
        theme: bp.theme,
        width: bp.targetWidth,
        height: 720,
        spawn: { x: 108, y: 520 },
        checkpoints: [{ id: `${prefix}-cp0`, x: 960, y: 495 }, ...ext.checkpoints],
        buddyPods: normalizedPods,
        goal: ext.goal,
        parTimeSeconds: bp.parTimeSeconds,
        platforms: allPlatforms,
        switches: ext.switches,
        gates: ext.gates,
        bouncePads: ext.bouncePads,
        crystals: [{ id: `${prefix}-c0`, x: 685, y: 465, radius: 13 }, ...ext.crystals],
        enemies: [
          {
            id: `${prefix}-d0`,
            type: 'stalker_crawler',
            x: 1060,
            y: 469,
            w: 34,
            h: 26,
            patrolMinX: 900,
            patrolMaxX: 1240,
            speed: 175,
          },
          ...ext.enemies,
        ],
      });
    } else {
      // Stage 14: mount the Karnifex-09 Blut-Seraph Boss Chamber!
      const preBossX = ext.endCursorX + 95;
      const preBossY = 510;
      const arenaX = preBossX + 290;
      const arenaFloorY = 540;
      const arenaW = Math.max(960, bp.targetWidth - arenaX);
      const gateX = arenaX + 735;

      const bossPlatforms: PlatformDef[] = [
        {
          id: 's14-preboss-deck',
          kind: 'solid',
          x: preBossX,
          y: preBossY,
          w: 220,
          h: 210,
          accent: 'bone',
        },
        {
          id: 's14-boss-floor',
          kind: 'solid',
          x: arenaX,
          y: arenaFloorY,
          w: arenaW,
          h: 180,
          accent: 'bio',
        },
        {
          id: 's14-boss-cat-l',
          kind: 'oneway',
          x: arenaX + 95,
          y: 405,
          w: 180,
          h: 18,
          accent: 'crimson',
        },
        {
          id: 's14-boss-cat-m',
          kind: 'oneway',
          x: arenaX + 310,
          y: 290,
          w: 170,
          h: 18,
          accent: 'bone',
        },
        {
          id: 's14-boss-cat-r',
          kind: 'oneway',
          x: arenaX + 510,
          y: 405,
          w: 175,
          h: 18,
          accent: 'crimson',
        },
        {
          id: 's14-boss-ceil',
          kind: 'solid',
          x: gateX,
          y: 0,
          w: 32,
          h: 400,
        },
      ];

      const allPlatforms = [startFloor, warmupLedge, warmupDeck, ...ext.platforms, ...bossPlatforms];
      const allGates = [
        ...ext.gates,
        { id: 's14-boss-gate', x: gateX, y: 400, w: 32, h: 140, openOffsetY: -145 },
      ];
      const goalX = gateX + 100;
      const normalizedPods = normalizeBuddyPods(
        [
          { id: `${prefix}-pod0`, x: 1120, y: 495 },
          ...ext.buddyPods,
          { id: 's14-pod-boss', x: preBossX + 155, y: preBossY },
        ],
        {
          id: bp.id,
          width: arenaX + arenaW,
          goalX: arenaX,
          platforms: allPlatforms,
          switches: ext.switches,
          gates: allGates,
          isBossStage: true,
        },
      );

      result.push({
        index: bp.index,
        id: bp.id,
        name: bp.name,
        subtitle: bp.subtitle,
        theme: bp.theme,
        width: arenaX + arenaW,
        height: 720,
        spawn: { x: 108, y: 520 },
        checkpoints: [
          { id: `${prefix}-cp0`, x: 960, y: 495 },
          ...ext.checkpoints,
          { id: 's14-cp-boss', x: preBossX + 75, y: preBossY },
        ],
        buddyPods: normalizedPods,
        goal: { x: goalX, y: arenaFloorY - 86, w: 68, h: 86 },
        parTimeSeconds: bp.parTimeSeconds,
        platforms: allPlatforms,
        switches: ext.switches,
        gates: allGates,
        bouncePads: [
          ...ext.bouncePads,
          { id: 's14-boss-bp-l', x: arenaX + 26, y: arenaFloorY - 16, w: 52, h: 16, power: 820 },
        ],
        crystals: [
          { id: `${prefix}-c0`, x: 685, y: 465, radius: 13 },
          ...ext.crystals,
          { id: 's14-c-boss', x: arenaX + 395, y: 235, radius: 13 },
        ],
        enemies: [
          {
            id: `${prefix}-d0`,
            type: 'shield_enforcer',
            x: 1060,
            y: 455,
            w: 32,
            h: 40,
            patrolMinX: 900,
            patrolMaxX: 1240,
            speed: 95,
          },
          ...ext.enemies,
        ],
        bossArena: {
          triggerX: arenaX + 55,
          arenaMinX: arenaX + 10,
          arenaMaxX: gateX - 6,
          floorY: arenaFloorY,
          gateId: 's14-boss-gate',
          spawnX: arenaX + 530,
          spawnY: 250,
        },
      });
    }
  }

  return result;
}

export const LEVELS: LevelDef[] = buildFourteenLevels();
