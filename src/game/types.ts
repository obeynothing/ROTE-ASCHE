export type GameScreenState = 'title' | 'playing' | 'paused' | 'stage_clear' | 'victory' | 'gameover';

export type BackdropTheme =
  | 'containment_lab'
  | 'flesh_foundry'
  | 'bioreactor_abyss'
  | 'quarantine_vault'
  | 'toxic_sewer'
  | 'nerve_cathedral'
  | 'omega_sanctum';

export type CharacterId = 'asche' | 'kron';

export type WeaponId = 'pulse' | 'shotgun' | 'harpoon' | 'mortar';

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
  switchJustPressed: boolean;
  summonJustPressed: boolean;
  weaponCycleJustPressed: boolean;
  weaponSelect: WeaponId | null;
}

export interface MenuInputSnapshot {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  confirm: boolean;
  back: boolean;
}

export interface TrailSample {
  x: number;
  y: number;
  facing: 1 | -1;
  onGround: boolean;
  vx: number;
  vy: number;
}

export interface PlayerState {
  id: CharacterId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  onGround: boolean;
  onWall: -1 | 0 | 1;
  gliding: boolean;
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
  accent?: 'none' | 'crimson' | 'bone' | 'bio';
  moveAxis?: 'x' | 'y';
  moveRange?: number;
  moveSpeed?: number;
  movePhase?: number;
}

export interface SwitchDef extends Rect {
  id: string;
  targetGateId: string;
  mode: 'latch' | 'timed' | 'hold';
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

export interface BuddyPodDef {
  id: string;
  x: number;
  y: number;
}

export interface CheckpointDef {
  id: string;
  x: number;
  y: number;
}

export type EnemyType =
  | 'patrol_drone'
  | 'saw_slider'
  | 'pulse_turret'
  | 'stalker_crawler'
  | 'mortar_spitter'
  | 'shield_enforcer'
  | 'hunter_wasp';

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
  state: 'idle' | 'windup' | 'firing' | 'charging' | 'recover';
  hp: number;
  maxHp: number;
  hitFlashTimer: number;
  alive: boolean;
  originY: number;
  attackVx: number;
  attackVy: number;
}

export interface ProjectileRuntime {
  id: string;
  weapon: WeaponId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  radius: number;
  splashRadius: number;
  damage: number;
  pierce: number;
  life: number;
  active: boolean;
  heavy: boolean;
  hitEnemyIds: string[];
  trail?: Vec2[];
}

export interface EnemyProjectileRuntime {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  radius: number;
  life: number;
  active: boolean;
  kind: 'bio_orb' | 'bolt';
}

export interface BossArenaDef {
  triggerX: number;
  arenaMinX: number;
  arenaMaxX: number;
  floorY: number;
  gateId: string;
  spawnX: number;
  spawnY: number;
}

export interface BossTentacle {
  angle: number;
  length: number;
  striking: boolean;
  targetX: number;
  targetY: number;
}

export interface BossState {
  name: string;
  active: boolean;
  defeated: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  anchorX: number;
  anchorY: number;
  hp: number;
  maxHp: number;
  phase: 1 | 2 | 3;
  state: 'dormant' | 'idle' | 'telegraph_slam' | 'slam' | 'telegraph_volley' | 'telegraph_surge' | 'surge' | 'dying';
  stateTimer: number;
  attackCycle: number;
  targetX: number;
  targetY: number;
  hitFlashTimer: number;
  tentacles: BossTentacle[];
  arenaMinX: number;
  arenaMaxX: number;
  floorY: number;
  triggerX: number;
  gateId: string;
}

export interface BloodDecal {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
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
  checkpoints: CheckpointDef[];
  buddyPods: BuddyPodDef[];
  goal: Rect;
  parTimeSeconds: number;
  platforms: PlatformDef[];
  switches: SwitchDef[];
  gates: GateDef[];
  bouncePads: BouncePadDef[];
  crystals: CrystalDef[];
  enemies: EnemyDef[];
  bossArena?: BossArenaDef;
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

export interface ShockwaveRing {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

export type GameEventType =
  | 'jump'
  | 'double_jump'
  | 'land'
  | 'dash'
  | 'shoot'
  | 'shoot_shotgun'
  | 'shoot_harpoon'
  | 'shoot_mortar'
  | 'explosion'
  | 'weapon_switch'
  | 'enemy_hit'
  | 'enemy_kill'
  | 'ram_kill'
  | 'ricochet'
  | 'bounce'
  | 'crystal'
  | 'switch_on'
  | 'switch_char'
  | 'summon'
  | 'buddy_loss'
  | 'buddy_rescue'
  | 'checkpoint'
  | 'upgrade'
  | 'turret_windup'
  | 'turret_fire'
  | 'enemy_telegraph'
  | 'boss_roar'
  | 'boss_hit'
  | 'boss_slam'
  | 'boss_defeat'
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
  players: [PlayerState, PlayerState];
  activeCharIndex: 0 | 1;
  partnerPresent: boolean;
  activeTrailHistory: TrailSample[];
  lastSafePos: Vec2;
  activeSpawn: Vec2;
  activatedCheckpoints: Set<string>;
  collectedBuddyPods: Set<string>;
  activeWeapon: WeaponId;
  weaponLevel: 1 | 2 | 3 | 4;
  movingPlatforms: MovingPlatformRuntime[];
  switches: SwitchRuntime[];
  gates: GateRuntime[];
  enemies: EnemyRuntime[];
  projectiles: ProjectileRuntime[];
  enemyProjectiles: EnemyProjectileRuntime[];
  boss: BossState | null;
  bloodDecals: BloodDecal[];
  collectedCrystals: Set<string>;
  shardsEarned: number;
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
