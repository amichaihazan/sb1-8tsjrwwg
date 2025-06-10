import React, { useState } from 'react';
import { Timer, Users, Play, Plus, Minus, Edit2 } from 'lucide-react';
import { Player } from '../App';

interface SetupScreenProps {
  onGameStart: (players: Player[]) => void;
}

const playerColors = [
  'bg-blue-500',
  'bg-green-500', 
  'bg-orange-500',
  'bg-purple-500'
];

const SetupScreen: React.FC<SetupScreenProps> = ({ onGameStart }) => {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  const [editingPlayer, setEditingPlayer] = useState<number | null>(null);
  const [tempName, setTempName] = useState('');

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
  };

  const handleNameEdit = (playerId: number) => {
    setEditingPlayer(playerId);
    setTempName(playerNames[playerId]);
  };

  const handleNameSave = (playerId: number) => {
    if (tempName.trim()) {
      const newNames = [...playerNames];
      newNames[playerId] = tempName.trim();
      setPlayerNames(newNames);
    }
    setEditingPlayer(null);
    setTempName('');
  };

  const handleNameCancel = () => {
    setEditingPlayer(null);
    setTempName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, playerId: number) => {
    if (e.key === 'Enter') {
      handleNameSave(playerId);
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  const handleStartGame = () => {
    const players: Player[] = Array.from({ length: playerCount }, (_, index) => ({
      id: index,
      name: playerNames[index],
      color: playerColors[index]
    }));
    onGameStart(players);
  };

  const canStartGame = playerNames.slice(0, playerCount).every(name => name.trim().length > 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 bg-blue-500 rounded-2xl shadow-lg">
            <Timer className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Board Game Timer
          </h1>
        </div>
        <p className="text-gray-600 text-base">
          Set up your game with player names
        </p>
      </div>

      {/* Setup Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        {/* Player Count */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-gray-700">
              <Users size={20} />
              <span className="font-medium">Number of Players</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePlayerCountChange(Math.max(2, playerCount - 1))}
                disabled={playerCount <= 2}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center font-semibold text-lg">{playerCount}</span>
              <button
                onClick={() => handlePlayerCountChange(Math.min(4, playerCount + 1))}
                disabled={playerCount >= 4}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Player Names */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-4">Player Names</h3>
          <div className="space-y-3">
            {Array.from({ length: playerCount }, (_, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${playerColors[index]}`} />
                {editingPlayer === index ? (
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, index)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
                      autoFocus
                      maxLength={20}
                      placeholder="Enter player name"
                    />
                    <button
                      onClick={() => handleNameSave(index)}
                      className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-medium text-gray-800">{playerNames[index]}</span>
                    <button
                      onClick={() => handleNameEdit(index)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        <button
          onClick={handleStartGame}
          disabled={!canStartGame}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
            canStartGame
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Play size={20} />
          <span>Start Game</span>
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">How It Works</h3>
        <ul className="space-y-2 text-gray-600 text-sm">
          <li>• Each player gets 60 seconds per turn</li>
          <li>• Only one timer runs at a time</li>
          <li>• Tick sounds in the last 10 seconds</li>
          <li>• Special tone when time runs out</li>
          <li>• Auto-advance to next player</li>
        </ul>
      </div>
    </div>
  );
};

export default SetupScreen;