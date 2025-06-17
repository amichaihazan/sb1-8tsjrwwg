import React, { useState } from 'react';
import SetupScreen from './components/SetupScreen';
import TimerScreen from './components/TimerScreen';

export interface Player {
  id: number;
  name: string;
  color: string;
  points: number;
}

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);

  const handleGameStart = (playerList: Player[]) => {
    setPlayers(playerList);
    setGameStarted(true);
  };

  const handleBackToSetup = () => {
    setGameStarted(false);
    setPlayers([]);
  };

  const handleUpdatePlayerPoints = (playerId: number, points: number) => {
    setPlayers(prevPlayers => 
      prevPlayers.map(player => 
        player.id === playerId 
          ? { ...player, points: player.points + points }
          : player
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {!gameStarted ? (
        <SetupScreen onGameStart={handleGameStart} />
      ) : (
        <TimerScreen 
          players={players} 
          onBackToSetup={handleBackToSetup}
          onUpdatePlayerPoints={handleUpdatePlayerPoints}
        />
      )}
    </div>
  );
}

export default App;