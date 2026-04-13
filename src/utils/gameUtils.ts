import type { WordEntry, LevelProgress } from '../types';

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildQuestionList(
  words: WordEntry[],
  progress: LevelProgress,
): WordEntry[] {
  const list: WordEntry[] = [];

  for (const word of words) {
    const wp = progress[word.id];

    if (wp?.mastered) continue;

    list.push(word);

    const wrongCount = wp?.wrongCount ?? 0;
    if (wrongCount >= 4) {
      list.push(word);
      list.push(word);
    } else if (wrongCount >= 2) {
      list.push(word);
    }
  }

  return shuffleArray(list);
}

export const CORRECT_EMOJIS = ['🐟', '😄', '🥳', '🔥', '💪', '⭐', '🏆', '👏', '🦄', '🎸', '🚀', '🌈', '🎯', '😎', '🐬'];
export const WRONG_EMOJIS = ['🦙💨', '💩', '🙈', '😬', '🫠', '🤡', '🐌', '👻', '🧟', '🤪', '🫣', '💀', '🪿'];

export const CORRECT_MESSAGES = [
  'Goed zo!', 'Top!', 'Helemaal goed!', 'Lekker bezig!', 'Taal held!',
  'Knaller!', 'Yes!', 'Nailed it!', 'Bam!', 'Wow!',
];
export const WRONG_MESSAGES = [
  'Helaas!', 'Net niet!', 'Oeps!', 'Jammer!', 'Bijna!',
  'Volgende keer beter!', 'Niet getreurd!', 'Uh oh!',
];

export const JOKES = [
  'Waarom ging het woordenboek naar de dokter?\nHet had te veel betekenissen! 😂',
  'Wat zei het ene woord tegen het andere?\n"Jij betekent veel voor mij!" 🥰',
  'Waarom was de pen verdrietig?\nHij kon zijn woorden niet vinden! 😢✏️',
  'Knock knock!\nWie is daar?\nBetekenis.\nBetekenis wie?\nBetekenis dat je deze game gaat winnen! 🏆',
];
