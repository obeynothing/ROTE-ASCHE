export type GameScreenState = 'title' | 'playing' | 'paused' | 'stage_clear' | 'victory' | 'gameover';

export type BackdropTheme =
  | 'eclipse_citadel'
  | 'ash_foundry'
  | 'obelisk_wasteland'
  | 'cathedral_void'
  | 'red_core';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface InputSnapshot {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jumpHeld: boolean;
  jumpJustPressed: boolean;
  jumpJustReleased: boolean;
  dashJustPressed: boolean;
  shootJustPressed: boolean;
  shootHeld: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  onGround: boolean;
  onWall: -1 | 0 | 1;
  coyoteTimer: number;
  jumpBufferTimer: number;
  airJumpsLeft: number;
  dashTimer: number;
  dashCooldown: number;
  dashVx: number;
  dashVy: number;
  canAirDash: boolean;
  shootCooldown: number;
  recoilTimer: number;
  squashX: number;
  squashY: number;
  hitFlashTimer: number;
  invulnTimer: number;
  alive: boolean;
  respawnTimer: number;
  inGoal: boolean;
  walkPhase: number;
  scarfTrail: Vec2[];
}

export interface PlatformDef extends Rect {
  id: string;
  kind: 'solid' | 'oneway' | 'moving';
  accent?: 'none' | 'crimson' | 'bone';
  moveAxis?: 'x' | 'y';
  moveRange?: number;
  moveSpeed?: number;
  movePhase?: number;
}

export interface SwitchDef extends Rect {
  id: string;
  targetGateId: string;
  mode: 'latch' | 'timed';
  duration?: number;
}

export interface GateDef extends Rect {
  id: string;
  openOffsetX?: number;
  openOffsetY?: number;
}

export interface BouncePadDef extends Rect {
  id: string;
  power: number;
}

export interface CrystalDef {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export type EnemyType = 'patrol_drone' | 'saw_slider' | 'pulse_turret';

export interface EnemyDef {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  w: number;
  h: number;
  patrolMinX?: number;
  patrolMaxX?: number;
  speed: number;
  fireInterval?: number;
  laserLength?: number;
}

export interface EnemyRuntime extends EnemyDef {
  dir: 1 | -1;
  phaseTimer: number;
  state: 'idle' | 'windup' | 'firing';
  hp: number;
  maxHp: number;
  hitFlashTimer: number;
  alive: boolean;
}

export interface ProjectileRuntime {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  active: boolean;
}

export interface SwitchRuntime extends SwitchDef {
  pressed: boolean;
  timer: number;
}

export interface GateRuntime extends GateDef {
  openProgress: number;
}

export interface MovingPlatformRuntime extends PlatformDef {
  originX: number;
  originY: number;
  dx: number;
  dy: number;
}

export interface LevelDef {
  index: number;
  id: string;
  name: string;
  subtitle: string;
  theme: BackdropTheme;
  width: number;
  height: number;
  spawn: Vec2;
  goal: Rect;
  parTimeSeconds: number;
  platforms: PlatformDef[];
  switches: SwitchDef[];
  gates: GateDef[];
  bouncePads: BouncePadDef[];
  crystals: CrystalDef[];
  enemies: EnemyDef[];
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
}

export type GameEventType =
  | 'jump'
  | 'double_jump'
  | 'land'
  | 'dash'
  | 'shoot'
  | 'enemy_hit'
  | 'enemy_kill'
  | 'ricochet'
  | 'bounce'
  | 'crystal'
  | 'switch_on'
  | 'turret_windup'
  | 'turret_fire'
  | 'hurt'
  | 'stage_clear';

export interface GameEvent {
  type: GameEventType;
  x: number;
  y: number;
  color?: string;
}

export interface WorldSimulation {
  level: LevelDef;
  player: PlayerState;
  movingPlatforms: MovingPlatformRuntime[];
  switches: SwitchRuntime[];
  gates: GateRuntime[];
  enemies: EnemyRuntime[];
  projectiles: ProjectileRuntime[];
  collectedCrystals: Set<string>;
  elapsedSeconds: number;
  deaths: number;
  hitstopTimer: number;
  cameraX: number;
  cameraY: number;
  trauma: number;
  stageCompleted: boolean;
  totalScore: number;
  events: GameEvent[];
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  totalTimeMs: number;
  crystalsCollected: number;
  stagesCleared: number;
  deaths: number;
  createdAt: string;
}
