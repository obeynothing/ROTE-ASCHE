import { useCallback, useEffect, useRef, useState } from 'react';
import { formatTime, HudOverlay, type HudSnapshot } from './components/HudOverlay';
import { LeaderboardModal } from './components/LeaderboardModal';
import { StatusModal } from './components/StatusModal';
import { TitleOverlay } from './components/TitleOverlay';
import { soundFX } from './engine/audio';
import { InputHub, type GamepadDeviceInfo } from './engine/input';
import { WorldRenderer } from './engine/renderer';
import { LEVELS } from './game/levels';
import { createWorldSimulation, stepWorldSimulation } from './game/physics';
import type { GameScreenState, WorldSimulation } from './game/types';

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

  const [screen, setScreen] = useState<GameScreenState>('title');
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [gamepads, setGamepads] = useState<GamepadDeviceInfo[]>([]);

  const [hud, setHud] = useState<HudSnapshot>({
    stageIndex: 0,
    totalStages: LEVELS.length,
    stageName: LEVELS[0].name,
    elapsedSeconds: 0,
    crystalsCollected: 0,
    totalCrystals: LEVELS[0].crystals.length,
    totalScore: 0,
  });

  // Refs read by the 60fps RAF loop (never triggering re-renders)
  const screenRef = useRef<GameScreenState>('title');
  const leaderboardOpenRef = useRef<boolean>(false);
  const stageIndexRef = useRef<number>(0);
  const runScoreRef = useRef<number>(0);
  const runTimeRef = useRef<number>(0);
  const runCrystalsRef = useRef<number>(0);
  const totalDeathsRef = useRef<number>(0);
  const simRef = useRef<WorldSimulation>(createWorldSimulation(LEVELS[0], 0));
  const rendererRef = useRef<WorldRenderer>(new WorldRenderer());
  const inputHubRef = useRef<InputHub | null>(null);

  useEffect(() => {
    leaderboardOpenRef.current = leaderboardOpen;
  }, [leaderboardOpen]);

  const [runSummary, setRunSummary] = useState({
    stageElapsed: 0,
    runElapsed: 0,
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
    setHud({
      stageIndex: stageIndexRef.current,
      totalStages: LEVELS.length,
      stageName: sim.level.name,
      elapsedSeconds: sim.elapsedSeconds,
      crystalsCollected: sim.collectedCrystals.size,
      totalCrystals: sim.level.crystals.length,
      totalScore: sim.totalScore,
    });
  }, []);

  const loadStage = useCallback(
    (idx: number, carryScore: number) => {
      const safeIdx = Math.max(0, Math.min(LEVELS.length - 1, idx));
      stageIndexRef.current = safeIdx;
      simRef.current = createWorldSimulation(LEVELS[safeIdx], carryScore);
      inputHubRef.current?.clearHeld();
      syncHudImmediate();
    },
    [syncHudImmediate],
  );

  const startPlayRun = useCallback(
    (startStage = 0) => {
      soundFX.unlock();
      runScoreRef.current = 0;
      runTimeRef.current = 0;
      runCrystalsRef.current = 0;
      totalDeathsRef.current = 0;
      leaderboardOpenRef.current = false;
      setLeaderboardOpen(false);
      loadStage(startStage, 0);
      syncBodyState('playing');
      canvasRef.current?.focus();
    },
    [loadStage, syncBodyState],
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
    loadStage(0, 0);
    syncBodyState('title');
  }, [loadStage, syncBodyState]);

  const handleToggleMute = useCallback(() => {
    const nextMuted = soundFX.toggleMute();
    setMuted(nextMuted);
  }, []);

  // Init body state, ?autostart=1 & optional ?stage=1..10
  useEffect(() => {
    document.body.dataset.state = mapBodyDatasetState('title');
    const params = new URLSearchParams(window.location.search);
    const stageRaw = Number(params.get('stage'));
    const startStage = Number.isFinite(stageRaw) && stageRaw >= 1 ? Math.min(LEVELS.length - 1, Math.floor(stageRaw - 1)) : 0;
    if (params.get('autostart') === '1') {
      startPlayRun(startStage);
    } else if (startStage > 0) {
      loadStage(startStage, 0);
    }
  }, [loadStage, startPlayRun]);

  // Title Screen Enter/Space & Immediate Pause Keydown Handshake
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (screenRef.current === 'title' && !leaderboardOpen) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startPlayRun(0);
          return;
        }
      }

      if ((e.code === 'Escape' || e.code === 'KeyP') && !leaderboardOpen) {
        if (screenRef.current === 'playing' || screenRef.current === 'paused') {
          e.preventDefault();
          const next = screenRef.current === 'playing' ? 'paused' : 'playing';
          if (next === 'paused') syncHudImmediate();
          syncBodyState(next);
          inputHubRef.current?.clearHeld();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [leaderboardOpen, startPlayRun, syncBodyState, syncHudImmediate]);

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
    setGamepads(inputHub.getConnectedGamepads());

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
    let prevCrystals = -1;
    let prevScore = -1;

    const frame = (now: number) => {
      const rawDt = Math.max(0.001, (now - lastTime) / 1000);
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      const polled = inputHub.poll();

      if (polled.muteJustPressed) {
        setMuted(soundFX.toggleMute());
      }
      if (polled.pauseJustPressed && (screenRef.current === 'playing' || screenRef.current === 'paused')) {
        const next = screenRef.current === 'playing' ? 'paused' : 'playing';
        frozenRendered = false;
        if (next === 'paused') syncHudImmediate();
        syncBodyState(next);
        inputHub.clearHeld();
      }
      if (polled.restartJustPressed && screenRef.current === 'playing') {
        loadStage(stageIndexRef.current, runScoreRef.current);
      }

      const sim = simRef.current;
      const renderer = rendererRef.current;

      if (screenRef.current === 'title' && !leaderboardOpenRef.current) {
        frozenRendered = false;
        sim.elapsedSeconds += dt;

        // Atmospheric obsidian-protagonist diorama on right deck (clear of left title lockup)
        const p = sim.player;
        const t = sim.elapsedSeconds;
        p.x = 795 + Math.sin(t * 0.55) * 44;
        p.y = 560 - p.h;
        p.facing = Math.cos(t * 0.55) >= 0 ? 1 : -1;
        p.onGround = true;
        p.walkPhase += dt * 3.4;

        // Animate flowing crimson scarf in wind
        const anchorX = p.x + p.w / 2 - p.facing * 4;
        const anchorY = p.y + 13;
        p.scarfTrail[0].x = anchorX;
        p.scarfTrail[0].y = anchorY;
        for (let i = 1; i < p.scarfTrail.length; i++) {
          const prev = p.scarfTrail[i - 1];
          p.scarfTrail[i].x = prev.x - p.facing * 5.2 - 1.5;
          p.scarfTrail[i].y = prev.y + 0.8 + Math.sin(t * 7 + i * 0.9) * 1.6;
        }

        renderer.updateParticles(dt);
        renderer.render(ctx, canvas.width, canvas.height, sim, {
          isTitleBackdrop: true,
          timeSeconds: now / 1000,
        });
      } else if (screenRef.current === 'playing') {
        frozenRendered = false;
        stepWorldSimulation(sim, dt, polled.player);

        if (sim.events.length > 0) {
          renderer.spawnParticlesFromEvents(sim.events);
          for (const ev of sim.events) {
            soundFX.playEvent(ev.type);
          }
        }
        renderer.updateParticles(dt);

        if (sim.stageCompleted) {
          runScoreRef.current = sim.totalScore;
          runTimeRef.current += sim.elapsedSeconds;
          runCrystalsRef.current += sim.collectedCrystals.size;
          totalDeathsRef.current += sim.deaths;

          const isFinal = stageIndexRef.current >= LEVELS.length - 1;
          setRunSummary({
            stageElapsed: sim.elapsedSeconds,
            runElapsed: runTimeRef.current,
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

        if (sim.collectedCrystals.size !== prevCrystals || sim.totalScore !== prevScore) {
          prevCrystals = sim.collectedCrystals.size;
          prevScore = sim.totalScore;
          syncHudImmediate();
        }

        renderer.render(ctx, canvas.width, canvas.height, sim, {
          isTitleBackdrop: false,
          timeSeconds: now / 1000,
        });
      } else if (!frozenRendered) {
        frozenRendered = true;
        renderer.render(ctx, canvas.width, canvas.height, sim, {
          isTitleBackdrop: false,
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
    <main className="relative w-screen h-screen overflow-hidden bg-[#050506]">
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
          onStart={() => startPlayRun(0)}
          onOpenLeaderboard={() => setLeaderboardOpen(true)}
          gamepads={gamepads}
        />
      )}

      {/* Active Gameplay HUD */}
      {screen !== 'title' && (
        <HudOverlay
          hud={hud}
          timerRef={timerRef}
          muted={muted}
          hasGamepad={gamepads.length > 0}
          onToggleMute={handleToggleMute}
          onRestart={handleRestartStage}
          onPause={() => {
            const next = screen === 'paused' ? 'playing' : 'paused';
            if (next === 'paused') syncHudImmediate();
            syncBodyState(next);
          }}
        />
      )}

      {/* Pause / Stage Clear / Victory Modal */}
      <StatusModal
        screen={screen}
        stageIndex={hud.stageIndex}
        totalStages={LEVELS.length}
        stageElapsedSeconds={screen === 'paused' ? hud.elapsedSeconds : runSummary.stageElapsed}
        runElapsedSeconds={runSummary.runElapsed}
        crystalsCollected={runSummary.crystals}
        totalCrystals={runSummary.totalCrystals}
        runCrystals={runSummary.runCrystals}
        deaths={runSummary.deaths}
        totalScore={runSummary.score || hud.totalScore}
        onResume={() => syncBodyState('playing')}
        onRestartStage={handleRestartStage}
        onNextStage={handleNextStage}
        onRestartRun={() => startPlayRun(0)}
        onReturnTitle={handleReturnTitle}
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
      />

      {/* Local Leaderboard Modal */}
      <LeaderboardModal open={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
    </main>
  );
}
