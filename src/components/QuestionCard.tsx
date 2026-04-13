import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { WordEntry, GameMode } from '../types';
import {
  CORRECT_EMOJIS, WRONG_EMOJIS,
  CORRECT_MESSAGES, WRONG_MESSAGES,
  pickRandom, shuffleArray,
} from '../utils/gameUtils';
import { playClickSound, playCorrectSound, playWrongSound, playStreakSound } from '../utils/sounds';

interface QuestionCardProps {
  currentWord: WordEntry;
  allWords: WordEntry[];
  questionIndex: number;
  totalQuestions: number;
  score: number;
  streak: number;
  onAnswer: (correct: boolean) => void;
  mode: GameMode;
  isRetry?: boolean;
}

type FeedbackState = null | 'correct' | 'wrong';

const OPTION_COLORS = [
  'border-l-purple-500',
  'border-l-blue-500',
  'border-l-teal-500',
  'border-l-orange-500',
  'border-l-pink-500',
];

const CONFETTI_EMOJIS = ['🎉', '🎊', '✨', '⭐', '💫', '🌟', '🎯', '💥', '🔥', '🥳'];

function generateConfettiParticles() {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i,
    emoji: pickRandom(CONFETTI_EMOJIS),
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1.5,
    size: 14 + Math.random() * 18,
    drift: (Math.random() - 0.5) * 80,
  }));
}

export default function QuestionCard({
  currentWord,
  allWords,
  questionIndex,
  totalQuestions,
  score,
  streak,
  onAnswer,
  mode,
  isRetry = false,
}: QuestionCardProps) {
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedbackEmoji, setFeedbackEmoji] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [scoreAnim, setScoreAnim] = useState(false);
  const [options, setOptions] = useState<WordEntry[]>([]);
  const [confettiParticles, setConfettiParticles] = useState<ReturnType<typeof generateConfettiParticles>>([]);

  const isWordToMeaning = mode === 'word-to-meaning' ||
    (mode === 'mix' && questionIndex % 2 === 0);

  const generateOptions = useCallback(() => {
    const distractors = shuffleArray(
      allWords.filter(w => w.id !== currentWord.id)
    ).slice(0, 4);
    return shuffleArray([currentWord, ...distractors]);
  }, [currentWord, allWords]);

  useEffect(() => {
    setOptions(generateOptions());
    setFeedback(null);
    setSelectedId(null);
    setConfettiParticles([]);
  }, [currentWord, generateOptions]);

  const handleAnswer = (option: WordEntry) => {
    if (feedback !== null) return;

    playClickSound();
    setSelectedId(option.id);
    const isCorrect = option.id === currentWord.id;

    if (isCorrect) {
      setFeedback('correct');
      setFeedbackEmoji(pickRandom(CORRECT_EMOJIS));
      setFeedbackMessage(pickRandom(CORRECT_MESSAGES));
      setScoreAnim(true);
      setConfettiParticles(generateConfettiParticles());
      playCorrectSound();
      if (streak >= 2) setTimeout(() => playStreakSound(), 300);
    } else {
      setFeedback('wrong');
      setFeedbackEmoji(pickRandom(WRONG_EMOJIS));
      setFeedbackMessage(pickRandom(WRONG_MESSAGES));
      playWrongSound();
    }

    setTimeout(() => {
      setScoreAnim(false);
      onAnswer(isCorrect);
    }, 1200);
  };

  const progress = (questionIndex / totalQuestions) * 100;

  const getOptionStyle = (option: WordEntry, colorClass: string) => {
    if (feedback === null) {
      return `bg-white/90 hover:bg-white active:scale-[0.98] ${colorClass}`;
    }
    if (option.id === currentWord.id) return 'bg-green-500 text-white border-l-green-600';
    if (option.id === selectedId && feedback === 'wrong') return 'bg-red-500 text-white border-l-red-600';
    return `bg-white/40 text-gray-400 ${colorClass}`;
  };

  const overlays = createPortal(
    <>
      <AnimatePresence>
        {feedback === 'correct' && confettiParticles.map((p) => (
          <motion.span
            key={p.id}
            className="pointer-events-none"
            style={{ position: 'fixed', left: `${p.x}%`, fontSize: `${p.size}px`, zIndex: 99998 }}
            initial={{ top: -30, opacity: 1, rotate: 0 }}
            animate={{ top: window.innerHeight + 50, opacity: [1, 1, 0], rotate: 360 + Math.random() * 360, x: p.drift }}
            exit={{ opacity: 0 }}
            transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          >
            {p.emoji}
          </motion.span>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {feedback && (
          <motion.div
            className="pointer-events-none"
            style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
            initial={{ scale: 0, rotate: -45, opacity: 0 }}
            animate={{ scale: [0, 1.8, 1.3, 1.5], rotate: [-45, 15, -8, 0], opacity: 1, transition: { duration: 0.6, ease: 'easeOut' as const } }}
            exit={{ scale: [1.5, 2.5, 0], rotate: [0, 25, -40], opacity: [1, 0.7, 0], transition: { duration: 0.35 } }}
          >
            <span style={{ fontSize: feedback === 'correct' ? '200px' : '180px', filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))' }}>
              {feedbackEmoji}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );

  return (
    <div className="min-h-dvh flex flex-col px-4 py-4 max-w-lg mx-auto w-full relative">
      {overlays}

      <div className="flex items-center justify-between mb-2">
        <span className="text-white/80 font-bold text-sm">
          {isRetry && <span className="text-orange-300 mr-1">🔄</span>}
          Vraag {questionIndex + 1}/{totalQuestions}
        </span>
        <AnimatePresence mode="wait">
          {streak >= 3 && (
            <motion.span
              key={streak}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              className="text-orange-300 font-black text-sm"
            >
              🔥 x{streak}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full h-2.5 bg-white/20 rounded-full mb-3 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <motion.div className="text-center mb-3 relative">
        <div className="flex items-center justify-center gap-2">
          <span className={`text-white font-black text-2xl ${scoreAnim ? 'animate-score-pop' : ''}`}>
            {score}
          </span>
          <span className="text-yellow-300 text-xl">⭐</span>
        </div>
        <AnimatePresence>
          {feedback === 'correct' && (
            <motion.span
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -40, scale: 1.5 }}
              transition={{ duration: 1.2 }}
              className="text-green-300 font-black text-xl absolute left-1/2 -translate-x-1/2"
            >
              +10
            </motion.span>
          )}
          {feedback === 'wrong' && (
            <motion.span
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -40, scale: 1.5 }}
              transition={{ duration: 1.2 }}
              className="text-red-300 font-black text-xl absolute left-1/2 -translate-x-1/2"
            >
              -5
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        key={currentWord.id + questionIndex}
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`rounded-2xl p-5 mb-4 shadow-lg relative overflow-hidden ${
          feedback === 'correct' ? 'bg-green-50 border-2 border-green-300' :
          feedback === 'wrong' ? 'bg-red-50 border-2 border-red-300' :
          isRetry ? 'bg-orange-50 border-2 border-orange-200' :
          'bg-white'
        }`}
      >
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
          {isWordToMeaning ? '📖 Wat betekent dit woord?' : '🤔 Welk woord hoort hierbij?'}
        </p>
        <p className={`font-black ${isWordToMeaning ? 'text-2xl text-purple-700' : 'text-base text-gray-800 leading-relaxed'}`}>
          {isWordToMeaning ? currentWord.word : currentWord.meaning}
        </p>
      </motion.div>

      <div className="space-y-2 flex-1">
        {options.map((option, i) => (
          <motion.button
            key={option.id}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.05 * i }}
            onClick={() => handleAnswer(option)}
            disabled={feedback !== null}
            className={`w-full text-left p-3.5 rounded-xl border-l-4 transition-all duration-200 shadow-sm ${getOptionStyle(option, OPTION_COLORS[i] ?? 'border-l-gray-400')}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 min-w-[20px]">
                {String.fromCharCode(65 + i)})
              </span>
              <span className={`text-sm font-medium flex-1 ${
                feedback !== null && (option.id === currentWord.id || (option.id === selectedId && feedback === 'wrong'))
                  ? 'text-white' : 'text-gray-700'
              }`}>
                {isWordToMeaning ? option.meaning : option.word}
              </span>
              {feedback && option.id === currentWord.id && <span className="text-lg">✅</span>}
              {feedback === 'wrong' && option.id === selectedId && <span className="text-lg">❌</span>}
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={`mt-3 rounded-xl p-3 text-center ${
              feedback === 'correct' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            <p className="font-bold text-lg">{feedbackMessage} {feedbackEmoji}</p>
            {feedback === 'wrong' && currentWord.example && (
              <p className="text-sm text-white/80 mt-1 italic">"{currentWord.example}"</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
