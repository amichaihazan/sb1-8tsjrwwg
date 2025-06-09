import React, { useState, useCallback } from 'react';
import PlayerTimer from './components/PlayerTimer';
import GameControls from './components/GameControls';
import { Timer } from 'lucide-react';

const playerColors = [
  'bg-blue-500',
  'bg-green-500', 
  'bg-orange-500',
  'bg-purple-500'
];

const defaultPlayerNames = [
  'Player 1',
  'Player 2', 
  'Player 3',
  'Player 4'
];

function App() {
  const [playerCount, setPlayerCount] = useState(2);
  const [activePlayer, setActivePlayer] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'running' | 'paused'>('idle');
  const [resetKey, setResetKey] = useState(0);
  const [playerNames, setPlayerNames] = useState(defaultPlayerNames);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    setActivePlayer(null);
    setGameState('idle');
  };

  const handleTimerStart = useCallback((playerId: number) => {
    setActivePlayer(playerId);
    setGameState('running');
  }, []);

  const handleTimeUp = useCallback((playerId: number) => {
    console.log(`${playerNames[playerId]} time is up!`);
    
    // Auto-advance to next player
    const nextPlayer = (playerId + 1) % playerCount;
    setActivePlayer(nextPlayer);
    
    // Keep the game running for the next player
    // The next player's timer will start automatically due to the useEffect in PlayerTimer
  }, [playerCount, playerNames]);

  const handleNextPlayer = useCallback((currentPlayerId: number) => {
    // Advance to next player
    const nextPlayer = (currentPlayerId + 1) % playerCount;
    setActivePlayer(nextPlayer);
    // Game state remains 'running' so the next player can start immediately
  }, [playerCount]);

  const handleResetAll = () => {
    setActivePlayer(null);
    setGameState('idle');
    setResetKey(prev => prev + 1); // Force re-render of all timers
  };

  const handleNameChange = (playerId: number, newName: string) => {
    setPlayerNames(prev => {
      const updated = [...prev];
      updated[playerId] = newName;
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-blue-500 rounded-2xl shadow-lg">
              <Timer className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Board Game Timer
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Turn-based 60-second timers with audio alerts
          </p>
        </div>

        {/* Game Controls */}
        <GameControls
          playerCount={playerCount}
          onPlayerCountChange={handlePlayerCountChange}
          onResetAll={handleResetAll}
          gameState={gameState}
          activePlayerName={activePlayer !== null ? playerNames[activePlayer] : null}
        />

        {/* Player Timers Grid */}
        <div className={`grid gap-6 ${
          playerCount === 2 ? 'grid-cols-1 md:grid-cols-2' :
          playerCount === 3 ? 'grid-cols-1 md:grid-cols-3' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {Array.from({ length: playerCount }, (_, index) => (
            <div key={`${index}-${resetKey}`} className="group">
              <PlayerTimer
                playerId={index}
                playerName={playerNames[index]}
                playerColor={playerColors[index]}
                isActive={activePlayer === index}
                onTimeUp={handleTimeUp}
                onTimerStart={handleTimerStart}
                onNameChange={handleNameChange}
                onNextPlayer={handleNextPlayer}
                gameState={gameState}
              />
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">How to Use</h3>
          <div className="grid md:grid-cols-2 gap-4 text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Game Setup</h4>
              <ul className="space-y-1 text-sm">
                <li>• Select the number of players (2-4)</li>
                <li>• Click on player names to customize them</li>
                <li>• Each player gets a 60-second timer</li>
                <li>• Only one timer runs at a time</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Timer Controls & Audio</h4>
              <ul className="space-y-1 text-sm">
                <li>• Click play to start a player's timer</li>
                <li>• Click next (→) to skip turn and reset timer</li>
                <li>• Tick sounds play in the last 10 seconds</li>
                <li>• Special tone plays when time runs out</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;