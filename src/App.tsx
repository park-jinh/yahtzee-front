import { useState } from 'react';
import type { AILevel } from './types/game';
import SetupScreen from './components/UI/SetupScreen';
import GameBoard from './components/GameBoard/GameBoard';

function App() {
  const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
  const [aiLevel, setAiLevel] = useState<AILevel>('BEGINNER');

  const handleStartGame = (selectedAiLevel: AILevel) => {
    setAiLevel(selectedAiLevel);
    setGameState('playing');
  };

  const handleGameEnd = () => {
    setGameState('setup');
  };

  return (
    <div className="App">
      {gameState === 'setup' ? (
        <SetupScreen onStartGame={handleStartGame} />
      ) : (
        <GameBoard aiLevel={aiLevel} onGameEnd={handleGameEnd} />
      )}
    </div>
  );
}

export default App;
