import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerId, PlayerConfig, AllProgress } from '../types';
import { loadProgress } from '../utils/progress';
import { playClickSound } from '../utils/sounds';

const PLAYERS: PlayerConfig[] = [
  { id: 'thijs', name: 'Thijs', emoji: '🧒', requiresPin: true },
  { id: 'mama', name: 'Mama', emoji: '👩', requiresPin: false },
  { id: 'papa', name: 'Papa', emoji: '👨', requiresPin: false },
  { id: 'oma', name: 'Oma', emoji: '👵', requiresPin: false },
  { id: 'anoniem', name: 'Anoniem', emoji: '🕵️', requiresPin: false },
];

const THIJS_PIN = import.meta.env.VITE_THIJS_PIN ?? '1234';

interface PlayerSelectProps {
  onSelect: (id: PlayerId, name: string, progress: AllProgress) => void;
}

export default function PlayerSelect({ onSelect }: PlayerSelectProps) {
  const [pinPlayer, setPinPlayer] = useState<PlayerConfig | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handlePlayerClick = (player: PlayerConfig) => {
    playClickSound();
    if (player.requiresPin) {
      setPinPlayer(player);
      setPin('');
      setPinError(false);
    } else {
      const prog = loadProgress(player.id);
      onSelect(player.id, player.name, prog);
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setPinError(false);

    if (newPin.length === 6) {
      if (newPin === THIJS_PIN) {
        const prog = loadProgress(pinPlayer!.id);
        onSelect(pinPlayer!.id, pinPlayer!.name, prog);
      } else {
        setPinError(true);
        setTimeout(() => setPin(''), 600);
      }
    }
  };

  const handlePinBack = () => {
    setPin(p => p.slice(0, -1));
    setPinError(false);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="text-7xl mb-3"
      >
        🦸
      </motion.div>

      <motion.h1
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-black text-white text-center mb-1"
        style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.3)' }}
      >
        TAAL HERO
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-white/70 text-sm mb-8"
      >
        Wie ben jij?
      </motion.p>

      <AnimatePresence mode="wait">
        {!pinPlayer ? (
          <motion.div
            key="player-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm space-y-2"
          >
            {PLAYERS.filter(p => p.id !== 'anoniem').map((player, i) => (
              <motion.button
                key={player.id}
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 * i }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePlayerClick(player)}
                className="w-full flex items-center gap-4 p-4 bg-white/20 hover:bg-white/30 active:bg-white/25 backdrop-blur-sm rounded-2xl transition-all duration-150"
              >
                <span className="text-4xl">{player.emoji}</span>
                <span className="text-white font-black text-xl flex-1 text-left">{player.name}</span>
                {player.requiresPin && (
                  <span className="text-white/50 text-xs">🔒 pincode</span>
                )}
              </motion.button>
            ))}

            <motion.button
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePlayerClick(PLAYERS.find(p => p.id === 'anoniem')!)}
              className="w-full flex items-center gap-4 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl transition-all duration-150"
            >
              <span className="text-3xl">🕵️</span>
              <div className="text-left flex-1">
                <p className="text-white/80 font-bold text-sm">Anoniem</p>
                <p className="text-white/40 text-xs">Geen voortgang opgeslagen</p>
              </div>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="pin-entry"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-xs text-center"
          >
            <p className="text-white font-bold text-lg mb-1">
              {pinPlayer.emoji} {pinPlayer.name}
            </p>
            <p className="text-white/60 text-sm mb-6">Voer je pincode in</p>

            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <motion.div
                  key={i}
                  animate={pinError ? { x: [-8, 8, -6, 6, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl transition-all duration-150 ${
                    i < pin.length
                      ? pinError
                        ? 'bg-red-500 border-red-400'
                        : 'bg-white/80 border-white'
                      : 'bg-white/20 border-white/30'
                  }`}
                >
                  {i < pin.length ? '●' : ''}
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
                <button
                  key={i}
                  onClick={() => {
                    playClickSound();
                    if (d === '⌫') handlePinBack();
                    else if (d !== '') handlePinDigit(d);
                  }}
                  disabled={d === ''}
                  className={`h-14 rounded-2xl font-black text-xl transition-all duration-150 ${
                    d === ''
                      ? 'invisible'
                      : 'bg-white/20 text-white hover:bg-white/30 active:scale-95'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <button
              onClick={() => { playClickSound(); setPinPlayer(null); setPin(''); }}
              className="w-full text-center text-white/50 text-sm hover:text-white/80 transition-colors py-2"
            >
              ← Terug
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
