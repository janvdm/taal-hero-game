import { motion } from 'framer-motion';
import { RotateCcw, List, ArrowLeft, Trophy } from 'lucide-react';
import type { WordEntry } from '../types';
import { playClickSound, playVictorySound } from '../utils/sounds';
import { useEffect, useState } from 'react';
import Leaderboard from './Leaderboard';

interface ResultScreenProps {
  score: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  longestStreak: number;
  timeSeconds: number;
  wrongAnswers: WordEntry[];
  levelId: string;
  playerName: string;
  onRestart: () => void;
  onBack: () => void;
}

function getGradeInfo(correctCount: number, wrongCount: number, totalQuestions: number) {
  const baseScore = (correctCount / totalQuestions) * 10;
  const penalty = Math.min(wrongCount * 0.2, 2);
  const grade = Math.max(1, Math.min(10, Math.round((baseScore - penalty) * 10) / 10));

  let label: string;
  let emoji: string;
  let color: string;
  if (grade >= 8.5) { label = 'Uitstekend!'; emoji = '🏆🥳'; color = 'text-emerald-400'; }
  else if (grade >= 7.5) { label = 'Goed!'; emoji = '🎉'; color = 'text-green-400'; }
  else if (grade >= 6.5) { label = 'Voldoende!'; emoji = '👍'; color = 'text-yellow-400'; }
  else if (grade >= 5.5) { label = 'Matig'; emoji = '😊'; color = 'text-orange-400'; }
  else { label = 'Oefenen!'; emoji = '💪📚'; color = 'text-red-400'; }

  return { grade, label, emoji, color };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ResultScreen({
  score,
  correctCount,
  wrongCount,
  totalQuestions,
  longestStreak,
  timeSeconds,
  wrongAnswers,
  levelId,
  playerName,
  onRestart,
  onBack,
}: ResultScreenProps) {
  const [showWrongAnswers, setShowWrongAnswers] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { grade, label, emoji, color } = getGradeInfo(correctCount, wrongCount, totalQuestions);
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  useEffect(() => {
    if (grade >= 6.5) playVictorySound();
  }, [grade]);

  const confettiColors = ['🟣', '🔵', '🟢', '🟡', '🟠', '🔴', '⭐', '✨', '🎉', '🎊'];

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-6 relative overflow-hidden">
      {grade >= 6.5 && confettiColors.map((c, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl pointer-events-none"
          initial={{ x: Math.random() * 400 - 200, y: -100, rotate: 0, opacity: 1 }}
          animate={{ y: window.innerHeight + 100, rotate: 720, opacity: 0 }}
          transition={{ duration: 3 + Math.random() * 2, delay: Math.random() * 1.5, ease: 'easeIn' }}
          style={{ left: `${10 + Math.random() * 80}%` }}
        >
          {c}
        </motion.span>
      ))}

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="text-center mb-4"
      >
        <p className="text-white/60 text-sm font-semibold uppercase tracking-wider">🏆 Score 🏆</p>
        <motion.p
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.4, stiffness: 200 }}
          className="text-7xl font-black text-white"
          style={{ textShadow: '0 0 30px rgba(255,255,255,0.3)' }}
        >
          {score}
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', delay: 0.6 }}
        className={`w-28 h-28 rounded-full border-4 ${
          grade >= 5.5 ? 'border-green-400' : 'border-red-400'
        } flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm mb-4`}
      >
        <span className={`text-3xl font-black ${color}`}>{grade}</span>
        <span className="text-white text-xs text-center px-1">{label} {emoji}</span>
      </motion.div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 w-full max-w-sm mb-3"
      >
        <p className="text-white font-bold text-sm mb-3 text-center">📊 Statistieken</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/70">✅ Goed</span>
            <span className="text-white font-bold">{correctCount}/{totalQuestions} ({percentage}%)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/70">❌ Fout</span>
            <span className="text-white font-bold">{wrongCount}/{totalQuestions}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/70">🔥 Langste streak</span>
            <span className="text-white font-bold">{longestStreak}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/70">⏱️ Tijd</span>
            <span className="text-white font-bold">{formatTime(timeSeconds)}</span>
          </div>
        </div>
      </motion.div>

      {wrongAnswers.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="w-full max-w-sm mb-3"
        >
          <button
            onClick={() => { playClickSound(); setShowWrongAnswers(!showWrongAnswers); }}
            className="w-full bg-white/10 text-white font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <List size={16} />
            {showWrongAnswers ? 'Verberg fouten' : `Bekijk fouten (${wrongAnswers.length})`}
          </button>

          {showWrongAnswers && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-2 space-y-2 max-h-60 overflow-y-auto"
            >
              {wrongAnswers.map((word) => (
                <div key={word.id} className="bg-white/10 rounded-xl p-3">
                  <p className="text-white font-bold text-sm">{word.word}</p>
                  <p className="text-white/70 text-xs">{word.meaning}</p>
                  {word.example && (
                    <p className="text-white/50 text-xs italic mt-1">"{word.example}"</p>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="w-full max-w-sm mb-3"
      >
        <button
          onClick={() => { playClickSound(); setShowLeaderboard(!showLeaderboard); }}
          className="w-full bg-yellow-400/20 text-yellow-200 font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-400/30 transition-colors"
        >
          <Trophy size={16} />
          {showLeaderboard ? 'Verberg leaderboard' : 'Bekijk leaderboard 🏆'}
        </button>

        {showLeaderboard && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-2"
          >
            <Leaderboard levelId={levelId} highlightPlayer={playerName} />
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="w-full max-w-sm flex gap-3"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { playClickSound(); onBack(); }}
          className="flex-1 bg-white/15 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={18} />
          Werelden
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { playClickSound(); onRestart(); }}
          className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
        >
          <RotateCcw size={18} />
          Opnieuw!
        </motion.button>
      </motion.div>
    </div>
  );
}
