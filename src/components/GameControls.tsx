import React from 'react';
import { RotateCcw, Play, Pause, Users, User } from 'lucide-react';

interface GameControlsProps {
  playerCount: number;
  onPlayerCountChange: (count: number) => void;
  onResetAll: () => void;
  gameState: 'idle' | 'running' | 'paused';
  activePlayerName: string | null;
}

const GameControls: React.FC<GameControlsProps> = ({
  playerCount,
  onPlayerCountChange,
  onResetAll,
  gameState,
  activePlayerName
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        {/* Player count selector */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-gray-700">
            <Users size={20} />
            <span className="font-medium">Players:</span>
          </div>
          <div className="flex space-x-2">
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => onPlayerCountChange(count)}
                className={`w-10 h-10 rounded-lg font-semibold transition-all duration-200 ${
                  playerCount === count
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Current turn and game status */}
        <div className="flex items-center space-x-4">
          {/* Current turn indicator */}
          {activePlayerName && gameState === 'running' && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              <User size={16} />
              <span>{activePlayerName}'s Turn</span>
            </div>
          )}

          {/* Game status */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
            gameState === 'running' ? 'bg-green-100 text-green-800' :
            gameState === 'paused' ? 'bg-orange-100 text-orange-800' :
            'bg-gray-100 text-gray-600'
          }`}>
            {gameState === 'running' && <Play size={16} />}
            {gameState === 'paused' && <Pause size={16} />}
            <span className="capitalize">{gameState === 'idle' ? 'Ready' : gameState}</span>
          </div>

          {/* Reset all button */}
          <button
            onClick={onResetAll}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <RotateCcw size={18} />
            <span>Reset All</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameControls;