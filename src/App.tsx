import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GuideModal } from './components/GuideModal';
import { formatTime, HudOverlay, type HudSnapshot } from './components/HudOverlay';
import { LeaderboardModal } from './components/LeaderboardModal';
import { StatusModal } from './components/StatusModal';
import { TitleOverlay } from './components/TitleOverlay';
import { soundFX } from './engine/audio';
import { InputHub, type GamepadDeviceInfo } from './engine/input';
import { WorldRenderer } from './engine/renderer';
import { getControlLabels } from './game/controls';
import { loadSpeedrunRecords, recordFullRunTime, recordStageSplit } from './game/leaderboard';
import { LEVELS } from './game/levels';
import {
  createWorldSimulation,
  stepWorldSimulation,
  updateScarfTrail,
  WEAPON_UPGRADES,
} from './game/physics';
import type { GameScreenState, InputSnapshot, MenuInputSnapshot, WeaponId, WorldSimulation } from './game/types';
import type { MenuInputSubscriber } from './hooks/useMenuNavigation';

function mapBodyDatasetState(screen: GameScreenState): string {
  if (screen === 'stage_clear' || screen === 'victory' || screen === 'gameover') {
    return 'gameover';
  }
  return screen;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<HTMLDivElement | null>(null);
  const runTimerRef = useRef<HTMLDivElement | null>(null);

  const [screen, setScreen] = useState<GameScreenState>('title');
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [gamepads, setGamepads] = useState<GamepadDeviceInfo[]>([]);
  const [availableShards, setAvailableShards] = useState(0);
  const [weaponLevel, setWeaponLevel] = useState<1 | 2 | 3 | 4>(1);
  const controls = useMemo(() => getControlLabels(gamepads), [gamepads]);

  const [hud, setHud] = useState<HudSnapshot>({
    stageIndex: 0,
    totalStages: LEVELS.length,
    stageName: LEVELS[0].name,
    elapsedSeconds: 0,
    runElapsedSeconds: 0,
    stageBestMs: null,
    isPracticeRun: false,
    crystalsCollected: 0,
    totalCrystals: LEVELS[0].crystals.length,
    availableShards: 0,
    activeCharacter: 'asche',
    partnerPresent: true,
    activeWeapon: 'pulse',
    weaponLevel: 1,
    totalScore: 0,
    bossActive: false,
    bossDefeated: false,
    bossName: '',
    bossHp: 0,
    bossMaxHp: 0,
    bossPhase: 1,
  });

  // Refs read by the 60fps RAF loop (never triggering unnecessary re-renders)
  const screenRef = useRef<GameScreenState>('title');
  const leaderboardOpenRef = useRef<boolean>(false);
  const guideOpenRef = useRef<boolean>(false);
  const stageIndexRef = useRef<number>(0);
  const isPracticeRunRef = useRef<boolean>(false);
  const runScoreRef = useRef<number>(0);
  const runTimeRef = useRef<number>(0);
  const runCrystalsRef = useRef<number>(0);
  const totalDeathsRef = useRef<number>(0);
  const availableShardsRef = useRef<number>(0);
  const weaponLevelRef = useRef<1 | 2 | 3 | 4>(1);
  const activeWeaponRef = useRef<WeaponId>('pulse');
  const creditedCrystalsRef = useRef<Set<string>>(new Set());
  const skipMenuInputFramesRef = useRef<number>(0);
  const menuSubscribersRef = useRef<Set<(input: MenuInputSnapshot) => void>>(new Set());

  const simRef = useRef<WorldSimulation>(createWorldSimulation(LEVELS[0], 0, 1, 'pulse'));
  const rendererRef = useRef<WorldRenderer>(new WorldRenderer());
  const inputHubRef = useRef<InputHub | null>(null);

  useEffect(() => {
    leaderboardOpenRef.current = leaderboardOpen;
  }, [leaderboardOpen]);

  useEffect(() => {
    guideOpenRef.current = guideOpen;
  }, [guideOpen]);

  const subscribeMenuInput = useCallback<MenuInputSubscriber>((cb) => {
    menuSubscribersRef.current.add(cb);
    return () => {
      menuSubscribersRef.current.delete(cb);
    };
  }, []);

  const [runSummary, setRunSummary] = useState({
    stageElapsed: 0,
    runElapsed: 0,
    stageSplitDeltaMs: null as number | null,
    stageIsNewPb: false,
    stagePbMs: null as number | null,
    fullRunIsNewPb: false,
    fullRunPbMs: null as number | null,
    crystals: 0,
    totalCrystals: LEVELS[0].crystals.length,
    runCrystals: 0,
    deaths: 0,
    score: 0,
  });

  const syncBodyState = useCallback((nextScreen: GameScreenState) => {
    screenRef.current = nextScreen;
    setScreen(nextScreen);
    document.body.dataset.state = mapBodyDatasetState(nextScreen);
  }, []);

  const syncHudImmediate = useCallback(() => {
    const sim = simRef.current;
    const records = loadSpeedrunRecords();
    const stageBestMs =
      typeof records.bestStageTimesMs[sim.level.id] === 'number'
        ? records.bestStageTimesMs[sim.level.id]
        : null;
    setHud({
      stageIndex: stageIndexRef.current,
      totalStages: LEVELS.length,
      stageName: sim.level.name,
      elapsedSeconds: sim.elapsedSeconds,
      runElapsedSeconds: runTimeRef.current + sim.elapsedSeconds,
      stageBestMs,
      isPracticeRun: isPracticeRunRef.current,
      crystalsCollected: sim.collectedCrystals.size,
      totalCrystals: sim.level.crystals.length,
      availableShards: availableShardsRef.current,
      activeCharacter: sim.players[sim.activeCharIndex].id,
      partnerPresent: sim.partnerPresent,
      activeWeapon: sim.activeWeapon,
      weaponLevel: sim.weaponLevel,
      totalScore: sim.totalScore,
      bossActive: Boolean(sim.boss?.active),
      bossDefeated: Boolean(sim.boss?.defeated),
      bossName: sim.boss?.name ?? '',
      bossHp: sim.boss?.hp ?? 0,
      bossMaxHp: sim.boss?.maxHp ?? 0,
      bossPhase: sim.boss?.phase ?? 1,
    });
  }, []);

  const loadStage = useCallback(
    (idx: number, carryScore: number) => {
      const safeIdx = Math.max(0, Math.min(LEVELS.length - 1, idx));
      stageIndexRef.current = safeIdx;
      simRef.current = createWorldSimulation(
        LEVELS[safeIdx],
        carryScore,
        weaponLevelRef.current,
        activeWeaponRef.current,
      );
      inputHubRef.current?.clearHeld();
      syncHudImmediate();
    },
    [syncHudImmediate],
  );

  const startPlayRun = useCallback(
    (startStage = 0, jumpToBoss = false) => {
      soundFX.unlock();
      isPracticeRunRef.current = startStage > 0 || jumpToBoss;
      runScoreRef.current = 0;
      runTimeRef.current = 0;
      runCrystalsRef.current = 0;
      totalDeathsRef.current = 0;
      availableShardsRef.current = 0;
      weaponLevelRef.current = 1;
      activeWeaponRef.current = 'pulse';
      creditedCrystalsRef.current.clear();
      setAvailableShards(0);
      setWeaponLevel(1);
      leaderboardOpenRef.current = false;
      setLeaderboardOpen(false);
      guideOpenRef.current = false;
      setGuideOpen(false);
      loadStage(startStage, 0);

      if (jumpToBoss) {
        const sim = simRef.current;
        const arena = sim.level.bossArena;
        if (arena) {
          const p1 = sim.players[0];
          const p2 = sim.players[1];
          const startX = arena.triggerX + 20;
          const startY = arena.floorY - p1.h;
          p1.x = startX;
          p1.y = startY;
          p1.onGround = true;
          p2.x = startX - 28;
          p2.y = arena.floorY - p2.h;
          p2.onGround = true;
          sim.activeSpawn = { x: startX, y: startY - 4 };
          sim.lastSafePos = { x: startX, y: startY };
          sim.cameraX = Math.max(0, startX - 240);
          syncHudImmediate();
        }
      }

      syncBodyState('playing');
      canvasRef.current?.focus();
    },
    [loadStage, syncBodyState, syncHudImmediate],
  );

  const handleRestartStage = useCallback(() => {
    loadStage(stageIndexRef.current, runScoreRef.current);
    syncBodyState('playing');
    canvasRef.current?.focus();
  }, [loadStage, syncBodyState]);

  const handleNextStage = useCallback(() => {
    const nextIdx = stageIndexRef.current + 1;
    if (nextIdx >= LEVELS.length) {
      syncBodyState('victory');
      return;
    }
    loadStage(nextIdx, runScoreRef.current);
    syncBodyState('playing');
    canvasRef.current?.focus();
  }, [loadStage, syncBodyState]);

  const handleReturnTitle = useCallback(() => {
    weaponLevelRef.current = 1;
    activeWeaponRef.current = 'pulse';
    availableShardsRef.current = 0;
    creditedCrystalsRef.current.clear();
    setWeaponLevel(1);
    setAvailableShards(0);
    loadStage(0, 0);
    syncBodyState('title');
  }, [loadStage, syncBodyState]);

  const handleToggleMute = useCallback(() => {
    const nextMuted = soundFX.toggleMute();
    setMuted(nextMuted);
  }, []);

  const handleSelectWeapon = useCallback(
    (weapon: WeaponId) => {
      if (simRef.current.activeWeapon === weapon) return;
      activeWeaponRef.current = weapon;
      simRef.current.activeWeapon = weapon;
      soundFX.playEvent('weapon_switch');
      syncHudImmediate();
      canvasRef.current?.focus();
    },
    [syncHudImmediate],
  );

  const handleUpgradeWeapon = useCallback(() => {
    const currentLv = weaponLevelRef.current;
    const nextUpgrade = WEAPON_UPGRADES.find((w) => w.level === currentLv + 1);
    if (!nextUpgrade) return;
    if (availableShardsRef.current < nextUpgrade.cost) return;

    availableShardsRef.current -= nextUpgrade.cost;
    weaponLevelRef.current = nextUpgrade.level;
    simRef.current.weaponLevel = nextUpgrade.level;
    setAvailableShards(availableShardsRef.current);
    setWeaponLevel(nextUpgrade.level);

    const activeP = simRef.current.players[simRef.current.activeCharIndex];
    rendererRef.current.spawnParticlesFromEvents([
      { type: 'upgrade', x: activeP.x + activeP.w / 2, y: activeP.y + activeP.h / 2, color: '#FFFFFF' },
    ]);
    soundFX.playEvent('upgrade');
    syncHudImmediate();
  }, [syncHudImmediate]);

  // Init body state, ?autostart=1 & optional ?stage=1..14 & ?boss=1
  useEffect(() => {
    document.body.dataset.state = mapBodyDatasetState('title');
    const params = new URLSearchParams(window.location.search);
    const stageRaw = Number(params.get('stage'));
    const startStage = Number.isFinite(stageRaw) && stageRaw >= 1 ? Math.min(LEVELS.length - 1, Math.floor(stageRaw - 1)) : 0;
    const jumpToBoss = params.get('boss') === '1';
    if (params.get('autostart') === '1') {
      startPlayRun(startStage, jumpToBoss);
    } else if (startStage > 0) {
      loadStage(startStage, 0);
    }
  }, [loadStage, startPlayRun]);

  // Immediate Pause / Resume Hotkeys (Esc / P)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.code === 'Escape' || e.code === 'KeyP') && !leaderboardOpenRef.current && !guideOpenRef.current) {
        if (screenRef.current === 'playing') {
          e.preventDefault();
          skipMenuInputFramesRef.current = 1;
          syncHudImmediate();
          syncBodyState('paused');
          inputHubRef.current?.clearHeld();
        } else if (screenRef.current === 'paused' && e.code === 'KeyP') {
          e.preventDefault();
          syncBodyState('playing');
          inputHubRef.current?.clearHeld();
          canvasRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [syncBodyState, syncHudImmediate]);

  // Isolated Canvas Mount, ResizeObserver & 60fps Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const inputHub = new InputHub((pads) => {
      setGamepads(pads);
    });
    inputHubRef.current = inputHub;
    const initialPads = inputHub.getConnectedGamepads();
    setGamepads(initialPads);
    let prevPadCount = initialPads.length;
    let prevPadId = initialPads[0]?.id ?? '';

    let frozenRendered = false;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(240, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.imageSmoothingEnabled = false;
      frozenRendered = false;
    };
    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(container);

    let rafId = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    const FIXED_DT = 1 / 120;
    let prevCrystals = -1;
    let prevScore = -1;
    let prevActiveChar = -1;
    let prevPartnerPresent: boolean | null = null;
    let prevWeapon: WeaponId | null = null;
    let prevBossActive: boolean | null = null;
    let prevBossHp = -1;
    let prevBossPhase = -1;
    let prevBossDefeated: boolean | null = null;

    const frame = (now: number) => {
      const rawDt = Math.max(0.001, (now - lastTime) / 1000);
      lastTime = now;
      const dt = Math.min(rawDt, 0.08);

      const polled = inputHub.poll();

      const nextPadId = polled.gamepads[0]?.id ?? '';
      if (polled.gamepads.length !== prevPadCount || nextPadId !== prevPadId) {
        prevPadCount = polled.gamepads.length;
        prevPadId = nextPadId;
        setGamepads(polled.gamepads);
      }

      if (polled.muteJustPressed) {
        setMuted(soundFX.toggleMute());
      }

      let justToggledPause = false;
      if (polled.pauseJustPressed && !leaderboardOpenRef.current && !guideOpenRef.current) {
        if (screenRef.current === 'playing') {
          justToggledPause = true;
          frozenRendered = false;
          syncHudImmediate();
          syncBodyState('paused');
          inputHub.clearHeld();
        } else if (screenRef.current === 'paused') {
          justToggledPause = true;
          frozenRendered = false;
          syncBodyState('playing');
          inputHub.clearHeld();
          canvasRef.current?.focus();
        }
      }

      if (polled.restartJustPressed && screenRef.current === 'playing') {
        accumulator = 0;
        loadStage(stageIndexRef.current, runScoreRef.current);
      }

      // Forward directional/confirm/back inputs to active menus when not actively playing
      if (screenRef.current !== 'playing' || leaderboardOpenRef.current || guideOpenRef.current) {
        if (skipMenuInputFramesRef.current > 0 || justToggledPause) {
          skipMenuInputFramesRef.current = Math.max(0, skipMenuInputFramesRef.current - 1);
        } else {
          const m = polled.menu;
          if (m.up || m.down || m.left || m.right || m.confirm || m.back) {
            for (const cb of menuSubscribersRef.current) {
              cb(m);
            }
          }
        }
      }

      const sim = simRef.current;
      const renderer = rendererRef.current;

      if (screenRef.current === 'title' && !leaderboardOpenRef.current && !guideOpenRef.current) {
        frozenRendered = false;
        accumulator = 0;
        sim.elapsedSeconds += dt;

        // Atmospheric dual-character diorama on right deck (ASCHE & KRON with long scarves)
        const t = sim.elapsedSeconds;
        const p1 = sim.players[0];
        p1.x = 815 + Math.sin(t * 0.55) * 44;
        p1.y = 560 - p1.h;
        p1.facing = Math.cos(t * 0.55) >= 0 ? 1 : -1;
        p1.vx = Math.cos(t * 0.55) * 120;
        p1.onGround = true;
        p1.walkPhase += dt * 3.8;
        updateScarfTrail(p1, t, dt);

        const p2 = sim.players[1];
        p2.x = 745 + Math.sin(t * 0.55 - 0.6) * 32;
        p2.y = 560 - p2.h;
        p2.facing = 1;
        p2.vx = Math.cos(t * 0.55 - 0.6) * 90;
        p2.onGround = true;
        p2.walkPhase += dt * 3.2;
        updateScarfTrail(p2, t + 0.5, dt);

        renderer.updateParticles(dt);
        renderer.render(ctx, canvas.width, canvas.height, sim, {
          isTitleBackdrop: true,
          freezeCamera: true,
          timeSeconds: now / 1000,
        });
      } else if (screenRef.current === 'playing') {
        frozenRendered = false;

        // Deterministic 120Hz fixed-timestep accumulator (lag-tunnel-proof + framerate-independent speedrun timing)
        accumulator = Math.min(0.12, accumulator + dt);
        let substepInput: InputSnapshot = polled.player;
        let stepped = false;
        while (accumulator >= FIXED_DT) {
          stepWorldSimulation(sim, FIXED_DT, substepInput);
          accumulator -= FIXED_DT;
          stepped = true;
          // Consume single-press edge flags after first physics substep so Held states continue cleanly
          if (
            substepInput.jumpJustPressed ||
            substepInput.jumpJustReleased ||
            substepInput.dashJustPressed ||
            substepInput.shootJustPressed ||
            substepInput.switchJustPressed ||
            substepInput.summonJustPressed ||
            substepInput.weaponCycleJustPressed ||
            substepInput.weaponSelect !== null
          ) {
            substepInput = {
              ...substepInput,
              jumpJustPressed: false,
              jumpJustReleased: false,
              dashJustPressed: false,
              shootJustPressed: false,
              switchJustPressed: false,
              summonJustPressed: false,
              weaponCycleJustPressed: false,
              weaponSelect: null,
            };
          }
          if (sim.events.length > 0) {
            renderer.spawnParticlesFromEvents(sim.events);
            for (const ev of sim.events) {
              soundFX.playEvent(ev.type);
            }
          }
          if (sim.stageCompleted) {
            accumulator = 0;
            break;
          }
        }
        // If frame interval < FIXED_DT (e.g. >120Hz or initial tiny frame), flush edge press on next step
        if (!stepped && (
          polled.player.jumpJustPressed ||
          polled.player.dashJustPressed ||
          polled.player.shootJustPressed ||
          polled.player.switchJustPressed ||
          polled.player.weaponCycleJustPressed
        )) {
          stepWorldSimulation(sim, FIXED_DT, polled.player);
          if (sim.events.length > 0) {
            renderer.spawnParticlesFromEvents(sim.events);
            for (const ev of sim.events) {
              soundFX.playEvent(ev.type);
            }
          }
        }

        activeWeaponRef.current = sim.activeWeapon;

        // Credit newly collected crystals to shard reserve (deduped per crystal ID)
        let shardsUpdated = false;
        for (const cid of sim.collectedCrystals) {
          if (!creditedCrystalsRef.current.has(cid)) {
            creditedCrystalsRef.current.add(cid);
            availableShardsRef.current += 1;
            shardsUpdated = true;
          }
        }
        if (shardsUpdated) {
          setAvailableShards(availableShardsRef.current);
        }

        renderer.updateAmbientPlayerEffects(sim, dt);
        renderer.updateParticles(dt);

        if (sim.stageCompleted) {
          runScoreRef.current = sim.totalScore;
          runTimeRef.current += sim.elapsedSeconds;
          runCrystalsRef.current += sim.collectedCrystals.size;
          totalDeathsRef.current += sim.deaths;

          const stageSplit = recordStageSplit(
            sim.level.id,
            sim.elapsedSeconds,
            isPracticeRunRef.current,
          );
          const isFinal = stageIndexRef.current >= LEVELS.length - 1;
          const fullSplit = isFinal
            ? recordFullRunTime(runTimeRef.current, isPracticeRunRef.current)
            : { pbMs: null, prevPbMs: null, deltaMs: null, isNewPb: false };

          setRunSummary({
            stageElapsed: sim.elapsedSeconds,
            runElapsed: runTimeRef.current,
            stageSplitDeltaMs: stageSplit.deltaMs,
            stageIsNewPb: stageSplit.isNewPb,
            stagePbMs: stageSplit.pbMs,
            fullRunIsNewPb: fullSplit.isNewPb,
            fullRunPbMs: fullSplit.pbMs,
            crystals: sim.collectedCrystals.size,
            totalCrystals: sim.level.crystals.length,
            runCrystals: runCrystalsRef.current,
            deaths: totalDeathsRef.current,
            score: sim.totalScore,
          });
          syncHudImmediate();
          syncBodyState(isFinal ? 'victory' : 'stage_clear');
        }

        if (timerRef.current) {
          timerRef.current.textContent = formatTime(sim.elapsedSeconds);
        }
        if (runTimerRef.current) {
          runTimerRef.current.textContent = formatTime(runTimeRef.current + sim.elapsedSeconds);
        }

        const bossActive = Boolean(sim.boss?.active);
        const bossHp = sim.boss?.hp ?? -1;
        const bossPhase = sim.boss?.phase ?? -1;
        const bossDefeated = Boolean(sim.boss?.defeated);

        if (
          sim.collectedCrystals.size !== prevCrystals ||
          sim.totalScore !== prevScore ||
          sim.activeCharIndex !== prevActiveChar ||
          sim.partnerPresent !== prevPartnerPresent ||
          sim.activeWeapon !== prevWeapon ||
          bossActive !== prevBossActive ||
          bossHp !== prevBossHp ||
          bossPhase !== prevBossPhase ||
          bossDefeated !== prevBossDefeated ||
          shardsUpdated
        ) {
          prevCrystals = sim.collectedCrystals.size;
          prevScore = sim.totalScore;
          prevActiveChar = sim.activeCharIndex;
          prevPartnerPresent = sim.partnerPresent;
          prevWeapon = sim.activeWeapon;
          prevBossActive = bossActive;
          prevBossHp = bossHp;
          prevBossPhase = bossPhase;
          prevBossDefeated = bossDefeated;
          syncHudImmediate();
        }

        renderer.render(ctx, canvas.width, canvas.height, sim, {
          isTitleBackdrop: false,
          freezeCamera: false,
          timeSeconds: now / 1000,
        });
      } else if (!frozenRendered) {
        frozenRendered = true;
        renderer.render(ctx, canvas.width, canvas.height, sim, {
          isTitleBackdrop: screenRef.current === 'title',
          freezeCamera: true,
          timeSeconds: now / 1000,
        });
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      inputHub.destroy();
    };
  }, [loadStage, syncBodyState, syncHudImmediate]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#030304]">
      {/* Isolated Pixel-Art Canvas Mount */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          data-testid="game-canvas"
          aria-label="ROTE ASCHE Spielfeld"
          className="block w-full h-full outline-none pixel-canvas"
        />
      </div>

      {/* Title Screen Overlay */}
      {screen === 'title' && (
        <TitleOverlay
          active={screen === 'title' && !leaderboardOpen && !guideOpen}
          controls={controls}
          onStart={() => startPlayRun(0)}
          onOpenGuide={() => {
            skipMenuInputFramesRef.current = 1;
            setGuideOpen(true);
          }}
          onOpenLeaderboard={() => {
            skipMenuInputFramesRef.current = 1;
            setLeaderboardOpen(true);
          }}
          subscribeMenuInput={subscribeMenuInput}
        />
      )}

      {/* Active Gameplay HUD */}
      {screen !== 'title' && (
        <HudOverlay
          hud={hud}
          timerRef={timerRef}
          runTimerRef={runTimerRef}
          muted={muted}
          controls={controls}
          onSelectWeapon={handleSelectWeapon}
          onToggleMute={handleToggleMute}
          onRestart={handleRestartStage}
          onPause={() => {
            const next = screen === 'paused' ? 'playing' : 'paused';
            if (next === 'paused') syncHudImmediate();
            syncBodyState(next);
          }}
        />
      )}

      {/* Pause / Weapon Forge / Stage Clear / Victory Modal */}
      <StatusModal
        screen={screen}
        blocked={leaderboardOpen || guideOpen}
        controls={controls}
        stageIndex={hud.stageIndex}
        totalStages={LEVELS.length}
        stageElapsedSeconds={screen === 'paused' ? hud.elapsedSeconds : runSummary.stageElapsed}
        runElapsedSeconds={screen === 'paused' ? hud.runElapsedSeconds : runSummary.runElapsed}
        isPracticeRun={hud.isPracticeRun}
        stageSplitDeltaMs={runSummary.stageSplitDeltaMs}
        stageIsNewPb={runSummary.stageIsNewPb}
        stagePbMs={runSummary.stagePbMs}
        fullRunIsNewPb={runSummary.fullRunIsNewPb}
        fullRunPbMs={runSummary.fullRunPbMs}
        crystalsCollected={runSummary.crystals}
        totalCrystals={runSummary.totalCrystals}
        runCrystals={runSummary.runCrystals}
        availableShards={availableShards}
        weaponLevel={weaponLevel}
        deaths={runSummary.deaths}
        totalScore={runSummary.score || hud.totalScore}
        subscribeMenuInput={subscribeMenuInput}
        onUpgradeWeapon={handleUpgradeWeapon}
        onResume={() => {
          syncBodyState('playing');
          canvasRef.current?.focus();
        }}
        onRestartStage={handleRestartStage}
        onNextStage={handleNextStage}
        onRestartRun={() => startPlayRun(0)}
        onReturnTitle={handleReturnTitle}
        onOpenGuide={() => {
          skipMenuInputFramesRef.current = 1;
          setGuideOpen(true);
        }}
        onOpenLeaderboard={() => {
          skipMenuInputFramesRef.current = 1;
          setLeaderboardOpen(true);
        }}
      />

      {/* Local Leaderboard Modal */}
      <LeaderboardModal
        open={leaderboardOpen}
        controls={controls}
        onClose={() => {
          skipMenuInputFramesRef.current = 1;
          setLeaderboardOpen(false);
        }}
        subscribeMenuInput={subscribeMenuInput}
      />

      {/* Guide & Enemy Bestiary Modal */}
      <GuideModal
        open={guideOpen}
        controls={controls}
        onClose={() => {
          skipMenuInputFramesRef.current = 1;
          setGuideOpen(false);
        }}
        subscribeMenuInput={subscribeMenuInput}
      />
    </main>
  );
}
