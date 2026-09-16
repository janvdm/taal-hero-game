import type { PlayerId } from '../types';

/** Words a player already knows — auto-marked as mastered and skipped in games. */
export const KNOWN_WORDS: Partial<Record<PlayerId, Record<string, string[]>>> = {
  thijs: {
    'identiteit-cultuur': [
      'identiteit',
      'koosnaam',
      'moedertaal',
      'adopteren',
      'afkomst',
      'generatie',
      'herkomst',
      'officieel',
      'in-een-oogopslag',
      'pleeggezin',
      'roepnaam',
      'toekomstroom',
      'vaderland',
      'vernoemen',
      'vondeling',
      'attribuut',
      'eigentijds',
      'heimwee',
      'inspireren',
      'origineel',
      'symbool',
      'traditie',
    ],
  },
};
