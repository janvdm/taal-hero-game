import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { WordEntry, Level, GameMode, PlayerId, AllProgress } from '../types';
import { buildQuestionList, shuffleArray, JOKES, pickRandom } from '../utils/gameUtils';
import { getLevelProgress, updateProgressAfterSession, saveProgress } from '../utils/progress';
import QuestionCard from './QuestionCard';
import ResultScreen from './ResultScreen';
import { playClickSound } from '../utils/sounds';
import { BookOpen, ArrowRight, ArrowLeft } from 'lucide-react';

type GameState = 'start' | 'playing' | 'retry' | 'finished';

const POINTS_CORRECT = 10;
const POINTS_WRONG = 5;
const STREAK_BONUS = 5;

interface GameContainerProps {
  level: Level;
  playerId: PlayerId;
  playerName: string;
  progress: AllProgress;
  onProgressUpdate: (updated: AllProgress) => void;
  onBack: () => void;
}

export default function GameContainer({
  level,
  playerId,
  playerName,
  progress,
  onProgressUpdate,
  onBack,
}: GameContainerProps) {
  const [gameState, setGameState] = useState<GameState>('start');
  const [mode, setMode] = useState<GameMode>('mix');
  const [joke] = useState(() => pickRandom(JOKES));

  const [normalQuestions, setNormalQuestions] = useState<WordEntry[]>([]);
  const [retryQueue, setRetryQueue] = useState<WordEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRetryPhase, setIsRetryPhase] = useState(false);

  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<WordEntry[]>([]);

  const firstTryCorrectRef = useRef(new Set<string>());
  const wrongInSessionRef = useRef(new Set<string>());

  const [startTime, setStartTime] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  useEffect(() => {
    if ((gameState === 'playing' || gameState === 'retry') && startTime > 0) {
      stopTimer();
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => stopTimer();
  }, [gameState, startTime, stopTimer]);

  const currentQuestions = isRetryPhase ? retryQueue : normalQuestions;
  const globalQuestionIndex = isRetryPhase
    ? normalQuestions.length + currentIndex
    : currentIndex;
  const totalQuestions = normalQuestions.length + retryQueue.length;

  const startGame = (selectedMode: GameMode) => {
    const levelProgress = getLevelProgress(progress, level.id);
    const questions = buildQuestionList(level.words, levelProgress);

    setMode(selectedMode);
    setNormalQuestions(questions);
    setRetryQueue([]);
    setCurrentIndex(0);
    setIsRetryPhase(false);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
    setLongestStreak(0);
    setWrongAnswers([]);
    firstTryCorrectRef.current = new Set();
    wrongInSessionRef.current = new Set();
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setGameState('playing');
  };

  const finishGame = useCallback((finalScore: number) => {
    stopTimer();

    if (playerId !== 'anoniem') {
      const updated = updateProgressAfterSession(
        progress,
        level.id,
        firstTryCorrectRef.current,
        wrongInSessionRef.current,
      );
      onProgressUpdate(updated);
      saveProgress(playerId, updated);

      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          playerId,
          levelId: level.id,
          score: finalScore,
          correctCount,
          totalQuestions,
          timeSeconds: elapsedSeconds,
          date: new Date().toISOString(),
        }),
      }).catch(() => { /* silently ignore if KV not available */ });
    }

    setGameState('finished');
  }, [stopTimer, playerId, progress, level.id, onProgressUpdate, playerName, correctCount, totalQuestions, elapsedSeconds]);

  const handleAnswer = useCallback((correct: boolean) => {
    const questions = isRetryPhase ? retryQueue : normalQuestions;
    const word = questions[currentIndex];

    if (correct) {
      const bonus = streak >= 2 ? STREAK_BONUS : 0;
      setScore(prev => prev + POINTS_CORRECT + bonus);
      setCorrectCount(prev => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setLongestStreak(prev => Math.max(prev, newStreak));

      if (!isRetryPhase && !wrongInSessionRef.current.has(word.id)) {
        firstTryCorrectRef.current.add(word.id);
      }
    } else {
      setScore(prev => Math.max(0, prev - POINTS_WRONG));
      setWrongCount(prev => prev + 1);
      setStreak(0);
      setWrongAnswers(prev => {
        if (prev.some(w => w.id === word.id)) return prev;
        return [...prev, word];
      });

      wrongInSessionRef.current.add(word.id);
      firstTryCorrectRef.current.delete(word.id);

      if (!isRetryPhase) {
        setRetryQueue(prev => {
          if (prev.some(w => w.id === word.id)) return prev;
          return [...prev, word];
        });
      }
    }

    const isLastQuestion = currentIndex + 1 >= questions.length;

    setTimeout(() => {
      if (isLastQuestion) {
        if (!isRetryPhase && retryQueue.length + (correct ? 0 : 1) > 0) {
          const finalRetry = !correct && !retryQueue.some(w => w.id === word.id)
            ? [...retryQueue, word]
            : retryQueue;

          if (finalRetry.length > 0) {
            setRetryQueue(shuffleArray(finalRetry));
            setCurrentIndex(0);
            setIsRetryPhase(true);
            setGameState('retry');
          } else {
            const fs = correct
              ? score + POINTS_CORRECT + (streak >= 2 ? STREAK_BONUS : 0)
              : Math.max(0, score - POINTS_WRONG);
            finishGame(fs);
          }
        } else {
          const fs = correct
            ? score + POINTS_CORRECT + (streak >= 2 ? STREAK_BONUS : 0)
            : Math.max(0, score - POINTS_WRONG);
          finishGame(fs);
        }
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }, 1300);
  }, [isRetryPhase, retryQueue, normalQuestions, currentIndex, streak, score, finishGame]);

  const modes: { value: GameMode; label: string; emoji: string; description: string }[] = [
    { value: 'word-to-meaning', label: 'Woord → Betekenis', emoji: '🎯', description: 'Ken jij de betekenis?' },
    { value: 'meaning-to-word', label: 'Betekenis → Woord', emoji: '🔄', description: 'Ken jij het woord?' },
    { value: 'mix', label: 'Mix (beide!)', emoji: '🎲', description: 'De ultieme uitdaging!' },
  ];

  const levelProgress = getLevelProgress(progress, level.id);
  const activeWords = level.words.filter(w => !levelProgress[w.id]?.mastered);

  return (
    <div className="min-h-dvh">
      <AnimatePresence mode="wait">
        {gameState === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-6">
              <button
                onClick={() => { playClickSound(); onBack(); }}
                className="self-start flex items-center gap-1 text-white/60 hover:text-white/90 text-sm mb-4 transition-colors"
              >
                <ArrowLeft size={16} /> Terug
              </button>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6 }}
                className="text-6xl mb-2"
              >
                {level.emoji}
              </motion.div>

              <motion.h1
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-3xl font-black text-white text-center mb-1"
              >
                {level.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-white/60 text-sm mb-4"
              >
                {activeWords.length} woorden actief
              </motion.p>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 mb-5 max-w-sm w-full"
              >
                <p className="text-white text-center text-sm whitespace-pre-line leading-relaxed">{joke}</p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-sm space-y-2 mb-5"
              >
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider text-center mb-2">
                  Kies je modus
                </p>
                {modes.map(m => (
                  <button
                    key={m.value}
                    onClick={() => { playClickSound(); setMode(m.value); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                      mode === m.value
                        ? 'bg-white text-purple-700 shadow-lg scale-[1.02]'
                        : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <div className="text-left flex-1">
                      <p className="font-bold text-sm">{m.label}</p>
                      <p className={`text-xs ${mode === m.value ? 'text-purple-500' : 'text-white/60'}`}>{m.description}</p>
                    </div>
                    {mode === m.value && <ArrowRight size={18} />}
                  </button>
                ))}
              </motion.div>

              <motion.button
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { playClickSound(); startGame(mode); }}
                className="w-full max-w-sm bg-gradient-to-r from-green-400 to-emerald-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
              >
                <BookOpen size={24} />
                LET'S GO! 🚀
              </motion.button>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex gap-2 mt-4"
              >
                {['📚', '✏️', '🧠', '💡', '🎓'].map((emoji, i) => (
                  <motion.span
                    key={i}
                    className="text-2xl"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ delay: 1 + i * 0.15, duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    {emoji}
                  </motion.span>
                ))}
              </motion.p>
            </div>
          </motion.div>
        )}

        {(gameState === 'playing' || gameState === 'retry') && currentQuestions.length > 0 && (
          <motion.div
            key={`q-${isRetryPhase}-${currentIndex}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.25 }}
          >
            {gameState === 'retry' && currentIndex === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-500/90 text-white text-center py-2 px-4 text-sm font-bold"
              >
                🔄 Herhaalronde — {retryQueue.length} vragen nog een keer!
              </motion.div>
            )}
            <QuestionCard
              currentWord={currentQuestions[currentIndex]}
              allWords={level.words}
              questionIndex={globalQuestionIndex}
              totalQuestions={normalQuestions.length + retryQueue.length}
              score={score}
              streak={streak}
              onAnswer={handleAnswer}
              mode={mode}
              isRetry={isRetryPhase}
            />
          </motion.div>
        )}

        {gameState === 'finished' && (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ResultScreen
              score={score}
              correctCount={correctCount}
              wrongCount={wrongCount}
              totalQuestions={totalQuestions}
              longestStreak={longestStreak}
              timeSeconds={elapsedSeconds}
              wrongAnswers={wrongAnswers}
              levelId={level.id}
              playerName={playerName}
              onRestart={() => setGameState('start')}
              onBack={onBack}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
