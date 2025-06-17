import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Settings, Clock, Plus, Minus, Trophy } from 'lucide-react';
import { Player } from '../App';

interface TimerScreenProps {
  players: Player[];
  onBackToSetup: () => void;
  onUpdatePlayerPoints: (playerId: number, points: number) => void;
}

const TimerScreen: React.FC<TimerScreenProps> = ({ players, onBackToSetup, onUpdatePlayerPoints }) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [gameState, setGameState] = useState<'idle' | 'running' | 'paused'>('idle');
  const [showTimeUpMessage, setShowTimeUpMessage] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentPlayer = players[currentPlayerIndex];

  // Initialize audio context
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    const handleFirstInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Sound generation functions with increased volume
  const playTickSound = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + 0.1);
  }, []);

  const playTimeUpSound = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const frequencies = [523, 659, 784]; // C, E, G notes
    
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        if (!audioContextRef.current) return;
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContextRef.current.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioContextRef.current.currentTime + 0.3);
      }, index * 150);
    });
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          
          // Play tick sound in last 10 seconds
          if (newTime <= 10 && newTime > 0) {
            playTickSound();
          }
          
          if (newTime <= 0) {
            // Time is up - show message and auto-advance
            setIsRunning(false);
            setGameState('idle');
            setShowTimeUpMessage(true);
            playTimeUpSound();
            
            // Clear any existing timeout
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            
            // Auto-advance to next player after 1.5 seconds
            timeoutRef.current = setTimeout(() => {
              setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
              setTimeLeft(60);
              setIsRunning(true); // Auto-start next player
              setGameState('running');
              setShowTimeUpMessage(false);
            }, 1500);
            
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeLeft, playTickSound, playTimeUpSound, players.length]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (timeLeft === 0) return;
    
    if (isRunning) {
      setIsRunning(false);
      setGameState('paused');
    } else {
      setIsRunning(true);
      setGameState('running');
    }
  };

  const handleNextPlayer = () => {
    // Clear any running interval and timeout
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Advance to next player manually
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
    
    // Reset states
    setTimeLeft(60);
    setIsRunning(false);
    setGameState('idle');
    setShowTimeUpMessage(false);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setGameState('idle');
    setTimeLeft(60);
    setShowTimeUpMessage(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleAddPoints = (playerId: number, points: number) => {
    onUpdatePlayerPoints(playerId, points);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((60 - timeLeft) / 60) * 100;
  };

  const isLowTime = timeLeft <= 10 && timeLeft > 0;
  const isTimeUp = timeLeft === 0;

  // Synchronized Timer component - both show the same active timer
  const SynchronizedTimer = ({ isRotated = false }: { isRotated?: boolean }) => (
    <div className={`${isRotated ? 'transform rotate-180' : ''} transition-all duration-300`}>
      <div className={`bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 ${
        gameState === 'running' ? 'ring-4 ring-blue-400 shadow-xl' : ''
      }`}>
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${currentPlayer.color}`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>

        {/* Player info */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${currentPlayer.color}`} />
            <h3 className="text-lg font-bold text-gray-800">{currentPlayer.name}</h3>
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Trophy size={14} />
              <span>{currentPlayer.points}</span>
            </div>
          </div>
          <div className={`text-xs ${
            gameState === 'running' ? 'text-blue-600' : 
            gameState === 'paused' ? 'text-orange-600' : 'text-gray-500'
          }`}>
            {gameState === 'idle' ? 'Ready' : gameState}
          </div>
        </div>

        {/* Timer Display */}
        <div className={`text-center transition-all duration-300 ${
          isLowTime ? 'animate-pulse' : ''
        }`}>
          <div className={`text-4xl font-bold mb-1 transition-colors duration-300 ${
            isTimeUp ? 'text-red-500' : 
            isLowTime ? 'text-orange-500' : 
            'text-gray-800'
          }`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs text-gray-500">
            {showTimeUpMessage ? "Time's up!" : 
             isLowTime ? 'Hurry up!' : 
             isRunning ? 'Time running...' : 
             'Tap play to start'}
          </div>
        </div>

        {/* Points controls - only show on bottom timer (not rotated) */}
        {!isRotated && (
          <div className="flex items-center justify-center space-x-2 mt-4">
            <button
              onClick={() => handleAddPoints(currentPlayer.id, -1)}
              disabled={currentPlayer.points <= 0}
              className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-red-600"
            >
              <Minus size={14} />
            </button>
            <span className="text-sm font-medium text-gray-600 min-w-[60px] text-center">
              {currentPlayer.points} pts
            </span>
            <button
              onClick={() => handleAddPoints(currentPlayer.id, 1)}
              className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-green-600"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <button
          onClick={onBackToSetup}
          className="p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-colors"
        >
          <Settings size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-800">TMT - Tahel Master Timer</h1>
        <button
          onClick={() => setShowPointsModal(true)}
          className="p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-colors"
        >
          <Trophy size={20} />
        </button>
      </div>

      {/* Dual Synchronized Timer Layout */}
      <div className="flex-1 flex flex-col">
        {/* Top Timer (Rotated 180° for opposite player) */}
        <div className="flex-1 p-4 bg-gradient-to-b from-gray-50 to-white">
          <SynchronizedTimer isRotated={true} />
        </div>

        {/* Controls Section */}
        <div className="bg-white border-t border-b border-gray-200 p-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={handlePlayPause}
              disabled={timeLeft === 0}
              className={`flex items-center justify-center w-14 h-14 rounded-full transition-all duration-200 ${
                timeLeft === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isRunning 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl' 
                    : `${currentPlayer.color} hover:opacity-90 text-white shadow-lg hover:shadow-xl`
              }`}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            <button
              onClick={handleNextPlayer}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <SkipForward size={20} />
            </button>
            
            <button
              onClick={handleResetTimer}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-500 hover:bg-gray-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>

        {/* Bottom Timer (Normal orientation) */}
        <div className="flex-1 p-4 bg-gradient-to-t from-gray-50 to-white">
          <SynchronizedTimer isRotated={false} />
        </div>
      </div>

      {/* Points Modal */}
      {showPointsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Player Scores</h2>
                <button
                  onClick={() => setShowPointsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${player.color}`} />
                      <span className="font-medium text-gray-800">{player.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleAddPoints(player.id, -1)}
                        disabled={player.points <= 0}
                        className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-red-600"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-bold text-lg min-w-[40px] text-center">{player.points}</span>
                      <button
                        onClick={() => handleAddPoints(player.id, 1)}
                        className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-green-600"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time up overlay */}
      {showTimeUpMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-red-500 text-white px-8 py-4 rounded-2xl font-bold text-xl animate-bounce shadow-2xl">
            Time's Up! Next Player...
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerScreen;