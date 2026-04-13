import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ScoreEntry {
  playerName: string;
  playerId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeSeconds: number;
  date: string;
}

interface LeaderboardProps {
  levelId: string;
  highlightPlayer?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const PLAYER_EMOJIS: Record<string, string> = {
  thijs: '🧒', mama: '👩', papa: '👨', oma: '👵', anoniem: '🕵️',
};

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ levelId, highlightPlayer }: LeaderboardProps) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/scores?level=${encodeURIComponent(levelId)}`)
      .then(r => r.json())
      .then((data: ScoreEntry[]) => setScores(data))
      .catch(() => setScores([]))
      .finally(() => setLoading(false));
  }, [levelId]);

  if (loading) {
    return (
      <div className="bg-white/10 rounded-xl p-4 text-center text-white/60 text-sm">
        Laden...
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="bg-white/10 rounded-xl p-4 text-center text-white/60 text-sm">
        Nog geen scores! Speel de eerste ronde! 🚀
      </div>
    );
  }

  return (
    <div className="bg-white/10 rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-yellow-400/20 border-b border-white/10">
        <p className="text-yellow-200 text-xs font-bold uppercase tracking-wider text-center">
          🏆 Top 10 — Beste scores
        </p>
      </div>
      <div className="divide-y divide-white/10">
        {scores.map((entry, i) => {
          const isHighlighted = entry.playerName === highlightPlayer;
          const emoji = PLAYER_EMOJIS[entry.playerId] ?? '🎮';
          const medal = MEDAL[i] ?? `${i + 1}.`;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 px-4 py-2.5 ${isHighlighted ? 'bg-yellow-400/20' : ''}`}
            >
              <span className="text-base min-w-[28px] text-center">{medal}</span>
              <span className="text-xl">{emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isHighlighted ? 'text-yellow-200' : 'text-white'}`}>
                  {entry.playerName}
                  {isHighlighted && ' ← jij!'}
                </p>
                <p className="text-white/40 text-xs">
                  {entry.correctCount}/{entry.totalQuestions} goed · {formatTime(entry.timeSeconds)}
                </p>
              </div>
              <span className={`font-black text-lg ${isHighlighted ? 'text-yellow-300' : 'text-white'}`}>
                {entry.score}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
