import type { LeaderboardEntry } from './types';

const STORAGE_KEY = 'rote_asche_leaderboard_v2';

const SEED_ENTRIES: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    playerName: 'KRON-01',
    score: 21450,
    totalTimeMs: 268400,
    crystalsCollected: 42,
    stagesCleared: 10,
    deaths: 0,
    createdAt: '2026-11-12T18:20:00.000Z',
  },
  {
    id: 'seed-2',
    playerName: 'ASCHE-VII',
    score: 19620,
    totalTimeMs: 304900,
    crystalsCollected: 38,
    stagesCleared: 10,
    deaths: 2,
    createdAt: '2026-11-13T14:05:00.000Z',
  },
  {
    id: 'seed-3',
    playerName: 'NEBEL',
    score: 17980,
    totalTimeMs: 339200,
    crystalsCollected: 34,
    stagesCleared: 10,
    deaths: 3,
    createdAt: '2026-11-14T09:42:00.000Z',
  },
  {
    id: 'seed-4',
    playerName: 'STAHL',
    score: 16210,
    totalTimeMs: 378500,
    crystalsCollected: 29,
    stagesCleared: 10,
    deaths: 5,
    createdAt: '2026-11-14T20:15:00.000Z',
  },
  {
    id: 'seed-5',
    playerName: 'MONOLITH',
    score: 14840,
    totalTimeMs: 412100,
    crystalsCollected: 25,
    stagesCleared: 10,
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
}): { entry: LeaderboardEntry; rank: number; entries: LeaderboardEntry[] } {
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
