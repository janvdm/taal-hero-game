export interface WordEntry {
  id: string;
  word: string;
  meaning: string;
  example?: string;
}

export interface Level {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  words: WordEntry[];
}

export type GameMode = 'word-to-meaning' | 'meaning-to-word' | 'mix';

export type PlayerId = 'thijs' | 'mama' | 'papa' | 'oma' | 'anoniem';

export interface PlayerConfig {
  id: PlayerId;
  name: string;
  emoji: string;
  requiresPin: boolean;
}

export interface WordProgress {
  wrongCount: number;
  correctCount: number;
  mastered: boolean;
}

export type LevelProgress = Record<string, WordProgress>;
export type AllProgress = Record<string, LevelProgress>;

export interface ScoreEntry {
  playerName: string;
  playerId: PlayerId;
  levelId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeSeconds: number;
  date: string;
}
