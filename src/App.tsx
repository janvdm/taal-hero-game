import { useState } from 'react';
import type { PlayerId, Level, AllProgress } from './types';
import PlayerSelect from './components/PlayerSelect';
import WorldSelect from './components/WorldSelect';
import GameContainer from './components/GameContainer';

type AppState = 'player-select' | 'world-select' | 'playing';

export default function App() {
  const [appState, setAppState] = useState<AppState>('player-select');
  const [playerId, setPlayerId] = useState<PlayerId>('anoniem');
  const [playerName, setPlayerName] = useState('Anoniem');
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [progress, setProgress] = useState<AllProgress>({});

  const handlePlayerSelect = (id: PlayerId, name: string, loadedProgress: AllProgress) => {
    setPlayerId(id);
    setPlayerName(name);
    setProgress(loadedProgress);
    setAppState('world-select');
  };

  const handleLevelSelect = (level: Level) => {
    setSelectedLevel(level);
    setAppState('playing');
  };

  const handleProgressUpdate = (updated: AllProgress) => {
    setProgress(updated);
  };

  const handleBackToWorlds = () => {
    setAppState('world-select');
    setSelectedLevel(null);
  };

  return (
    <div className="min-h-dvh">
      {appState === 'player-select' && (
        <PlayerSelect onSelect={handlePlayerSelect} />
      )}
      {appState === 'world-select' && (
        <WorldSelect
          playerId={playerId}
          playerName={playerName}
          progress={progress}
          onSelectLevel={handleLevelSelect}
          onProgressUpdate={handleProgressUpdate}
        />
      )}
      {appState === 'playing' && selectedLevel && (
        <GameContainer
          level={selectedLevel}
          playerId={playerId}
          playerName={playerName}
          progress={progress}
          onProgressUpdate={handleProgressUpdate}
          onBack={handleBackToWorlds}
        />
      )}
    </div>
  );
}
