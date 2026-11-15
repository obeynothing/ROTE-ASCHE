import type { LeaderboardEntry } from './types';

const STORAGE_KEY = 'rote_asche_leaderboard_v2';
const SPEEDRUN_PB_KEY = 'rote_asche_speedrun_pb_v1';

export interface SpeedrunRecords {
  bestFullRunMs: number | null;
  bestStageTimesMs: Record<string, number>;
}

export interface StageSplitResult {
  pbMs: number | null;
  prevPbMs: number | null;
  deltaMs: number | null;
  isNewPb: boolean;
}

const SEED_ENTRIES: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    playerName: 'KRON-01',
    score: 21450,
    totalTimeMs: 418400,
    crystalsCollected: 58,
    stagesCleared: 14,
    deaths: 0,
    createdAt: '2026-11-12T18:20:00.000Z',
  },
  {
    id: 'seed-2',
    playerName: 'ASCHE-VII',
    score: 19620,
    totalTimeMs: 464900,
    crystalsCollected: 51,
    stagesCleared: 14,
    deaths: 2,
    createdAt: '2026-11-13T14:05:00.000Z',
  },
  {
    id: 'seed-3',
    playerName: 'NEBEL',
    score: 17980,
    totalTimeMs: 519200,
    crystalsCollected: 46,
    stagesCleared: 14,
    deaths: 3,
    createdAt: '2026-11-14T09:42:00.000Z',
  },
  {
    id: 'seed-4',
    playerName: 'STAHL',
    score: 16210,
    totalTimeMs: 568500,
    crystalsCollected: 39,
    stagesCleared: 14,
    deaths: 5,
    createdAt: '2026-11-14T20:15:00.000Z',
  },
  {
    id: 'seed-5',
    playerName: 'MONOLITH',
    score: 14840,
    totalTimeMs: 622100,
    crystalsCollected: 34,
    stagesCleared: 14,
    deaths: 7,
    createdAt: '2026-11-15T01:10:00.000Z',
  },
];

function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.totalTimeMs - b.totalTimeMs;
  });
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return sortEntries(SEED_ENTRIES);
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ENTRIES));
      return sortEntries(SEED_ENTRIES);
    }
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return sortEntries(SEED_ENTRIES);
    }
    return sortEntries(parsed);
  } catch {
    return sortEntries(SEED_ENTRIES);
  }
}

export function saveLeaderboardRun(input: {
  playerName: string;
  score: number;
  totalTimeMs: number;
  crystalsCollected: number;
  stagesCleared: number;
  deaths: number;
  isPracticeRun?: boolean;
}): { entry: LeaderboardEntry; rank: number; entries: LeaderboardEntry[] } | null {
  if (input.isPracticeRun) {
    return null;
  }
  const cleanedName = input.playerName.trim().slice(0, 24) || 'SCHATTEN';
  const entry: LeaderboardEntry = {
    id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    playerName: cleanedName,
    score: Math.max(0, Math.round(input.score)),
    totalTimeMs: Math.max(1000, Math.round(input.totalTimeMs)),
    crystalsCollected: Math.max(0, Math.round(input.crystalsCollected)),
    stagesCleared: Math.max(1, Math.round(input.stagesCleared)),
    deaths: Math.max(0, Math.round(input.deaths)),
    createdAt: new Date().toISOString(),
  };

  const current = loadLeaderboard();
  const next = sortEntries([...current, entry]).slice(0, 50);
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }

  const rank = next.findIndex((e) => e.id === entry.id) + 1;
  return { entry, rank: rank > 0 ? rank : next.length, entries: next };
}

export function loadSpeedrunRecords(): SpeedrunRecords {
  const empty: SpeedrunRecords = { bestFullRunMs: null, bestStageTimesMs: {} };
  try {
    if (typeof window === 'undefined' || !window.localStorage) return empty;
    const raw = window.localStorage.getItem(SPEEDRUN_PB_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<SpeedrunRecords>;
    return {
      bestFullRunMs:
        typeof parsed.bestFullRunMs === 'number' && Number.isFinite(parsed.bestFullRunMs) && parsed.bestFullRunMs > 0
          ? parsed.bestFullRunMs
          : null,
      bestStageTimesMs:
        parsed.bestStageTimesMs && typeof parsed.bestStageTimesMs === 'object' ? parsed.bestStageTimesMs : {},
    };
  } catch {
    return empty;
  }
}

function persistSpeedrunRecords(records: SpeedrunRecords): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SPEEDRUN_PB_KEY, JSON.stringify(records));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function recordStageSplit(
  stageId: string,
  elapsedSeconds: number,
  isPracticeRun = false,
): StageSplitResult {
  const elapsedMs = Math.max(10, Math.round(elapsedSeconds * 1000));
  const records = loadSpeedrunRecords();
  const prevPbMs =
    typeof records.bestStageTimesMs[stageId] === 'number' && records.bestStageTimesMs[stageId] > 0
      ? records.bestStageTimesMs[stageId]
      : null;

  const deltaMs = prevPbMs !== null ? elapsedMs - prevPbMs : null;
  const isNewPb = !isPracticeRun && (prevPbMs === null || elapsedMs < prevPbMs);

  if (isNewPb) {
    records.bestStageTimesMs[stageId] = elapsedMs;
    persistSpeedrunRecords(records);
  }

  return {
    pbMs: isNewPb ? elapsedMs : prevPbMs,
    prevPbMs,
    deltaMs,
    isNewPb,
  };
}

export function recordFullRunTime(
  runSeconds: number,
  isPracticeRun = false,
): { pbMs: number | null; prevPbMs: number | null; deltaMs: number | null; isNewPb: boolean } {
  const runMs = Math.max(10, Math.round(runSeconds * 1000));
  const records = loadSpeedrunRecords();
  const prevPbMs = records.bestFullRunMs;
  const deltaMs = prevPbMs !== null ? runMs - prevPbMs : null;
  const isNewPb = !isPracticeRun && (prevPbMs === null || runMs < prevPbMs);

  if (isNewPb) {
    records.bestFullRunMs = runMs;
    persistSpeedrunRecords(records);
  }

  return {
    pbMs: isNewPb ? runMs : prevPbMs,
    prevPbMs,
    deltaMs,
    isNewPb,
  };
}

export function formatDeltaSeconds(deltaMs: number): string {
  const sign = deltaMs <= 0 ? '-' : '+';
  const secs = Math.abs(deltaMs) / 1000;
  return `${sign}${secs.toFixed(2)}s`;
}

