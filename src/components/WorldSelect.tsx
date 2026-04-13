import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { PlayerId, Level, AllProgress } from '../types';
import { countMastered, countStruggling, saveProgress, toggleMastered } from '../utils/progress';
import { playClickSound } from '../utils/sounds';

const COLOR_MAP: Record<string, string> = {
  green: 'from-green-500 to-emerald-600',
  purple: 'from-purple-500 to-violet-600',
  blue: 'from-blue-500 to-indigo-600',
  orange: 'from-orange-500 to-amber-600',
  red: 'from-red-500 to-rose-600',
  pink: 'from-pink-500 to-fuchsia-600',
};

interface WorldSelectProps {
  playerId: PlayerId;
  playerName: string;
  progress: AllProgress;
  onSelectLevel: (level: Level) => void;
  onProgressUpdate: (progress: AllProgress) => void;
}

export default function WorldSelect({
  playerId,
  playerName,
  progress,
  onSelectLevel,
  onProgressUpdate,
}: WorldSelectProps) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [masteredLevel, setMasteredLevel] = useState<string | null>(null);

  useEffect(() => {
    const modules = import.meta.glob<{ default: Level }>('../levels/*.json', { eager: true });
    const loaded = Object.values(modules).map(m => m.default);
    loaded.sort((a, b) => a.title.localeCompare(b.title));
    setLevels(loaded);
  }, []);

  const handleToggleMastered = (levelId: string, wordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    const updated = toggleMastered(progress, levelId, wordId);
    onProgressUpdate(updated);
    saveProgress(playerId, updated);
  };

  const playerEmojis: Record<PlayerId, string> = {
    thijs: '🧒', mama: '👩', papa: '👨', oma: '👵', anoniem: '🕵️',
  };

  return (
    <div className="min-h-dvh flex flex-col px-4 py-6 max-w-lg mx-auto">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-black text-white">TAAL HERO 🦸</h1>
          <p className="text-white/60 text-sm">
            {playerEmojis[playerId]} Hallo {playerName}!
          </p>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-3"
      >
        Kies een wereld
      </motion.p>

      <div className="space-y-3">
        {levels.map((level, i) => {
          const mastered = countMastered(progress, level.id);
          const struggling = countStruggling(progress, level.id);
          const total = level.words.length;
          const gradient = COLOR_MAP[level.color] ?? 'from-purple-500 to-violet-600';

          return (
            <motion.div key={level.id}>
              <motion.button
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 * i }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { playClickSound(); onSelectLevel(level); }}
                className={`w-full bg-gradient-to-r ${gradient} rounded-2xl p-4 shadow-lg text-left`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{level.emoji}</span>
                  <div className="flex-1">
                    <p className="text-white font-black text-lg leading-tight">{level.title}</p>
                    <p className="text-white/70 text-xs">{level.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/90 text-xs font-bold">{total - mastered} woorden</p>
                    {struggling > 0 && (
                      <p className="text-yellow-200 text-xs">⚠️ {struggling} lastig</p>
                    )}
                    {mastered > 0 && (
                      <p className="text-white/60 text-xs">✅ {mastered} geleerd</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 w-full bg-white/20 rounded-full h-1.5">
                  <div
                    className="bg-white/80 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(mastered / total) * 100}%` }}
                  />
                </div>
              </motion.button>

              {masteredLevel === level.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-2 bg-white/10 rounded-xl p-3 max-h-60 overflow-y-auto"
                >
                  <p className="text-white/70 text-xs font-semibold mb-2 uppercase tracking-wider">
                    Al geleerd — klik om in/uit te schakelen
                  </p>
                  <div className="space-y-1">
                    {level.words.map(word => {
                      const wp = progress[level.id]?.[word.id];
                      return (
                        <button
                          key={word.id}
                          onClick={(e) => handleToggleMastered(level.id, word.id, e)}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-150 ${
                            wp?.mastered ? 'bg-green-500/30' : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-base">{wp?.mastered ? '✅' : '⬜'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-bold truncate">{word.word}</p>
                            <p className="text-white/50 text-xs truncate">{word.meaning}</p>
                          </div>
                          {(wp?.wrongCount ?? 0) >= 2 && !wp?.mastered && (
                            <span className="text-yellow-300 text-xs shrink-0">⚠️ {wp?.wrongCount}x</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              <button
                onClick={() => {
                  playClickSound();
                  setMasteredLevel(prev => prev === level.id ? null : level.id);
                }}
                className="w-full text-white/40 text-xs py-1 hover:text-white/60 transition-colors"
              >
                {masteredLevel === level.id ? '▲ Verberg woordenlijst' : '▼ Bekijk woordenlijst & al geleerd'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
