import type { PlayerId, LevelProgress, AllProgress } from '../types';

const STORAGE_KEY = 'taal-hero-progress';

export function loadProgress(playerId: PlayerId): AllProgress {
  if (playerId === 'anoniem') return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${playerId}`);
    return raw ? (JSON.parse(raw) as AllProgress) : {};
  } catch {
    return {};
  }
}

export function saveProgress(playerId: PlayerId, progress: AllProgress): void {
  if (playerId === 'anoniem') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}-${playerId}`, JSON.stringify(progress));
  } catch { /* localStorage unavailable */ }
}

export function getLevelProgress(progress: AllProgress, levelId: string): LevelProgress {
  return progress[levelId] ?? {};
}

export function updateProgressAfterSession(
  current: AllProgress,
  levelId: string,
  firstTryCorrect: Set<string>,
  wrongInSession: Set<string>,
): AllProgress {
  const levelProg = { ...(current[levelId] ?? {}) };

  for (const wordId of firstTryCorrect) {
    const existing = levelProg[wordId] ?? { wrongCount: 0, correctCount: 0, mastered: false };
    levelProg[wordId] = {
      ...existing,
      correctCount: existing.correctCount + 1,
      wrongCount: Math.max(0, existing.wrongCount - 1),
    };
  }

  for (const wordId of wrongInSession) {
    const existing = levelProg[wordId] ?? { wrongCount: 0, correctCount: 0, mastered: false };
    levelProg[wordId] = {
      ...existing,
      wrongCount: existing.wrongCount + 1,
    };
  }

  return { ...current, [levelId]: levelProg };
}

export function toggleMastered(
  current: AllProgress,
  levelId: string,
  wordId: string,
): AllProgress {
  const levelProg = { ...(current[levelId] ?? {}) };
  const existing = levelProg[wordId] ?? { wrongCount: 0, correctCount: 0, mastered: false };
  levelProg[wordId] = { ...existing, mastered: !existing.mastered };
  return { ...current, [levelId]: levelProg };
}

export function countMastered(progress: AllProgress, levelId: string): number {
  const lp = progress[levelId] ?? {};
  return Object.values(lp).filter(w => w.mastered).length;
}

export function countStruggling(progress: AllProgress, levelId: string): number {
  const lp = progress[levelId] ?? {};
  return Object.values(lp).filter(w => w.wrongCount >= 2 && !w.mastered).length;
}
