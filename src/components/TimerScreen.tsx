import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Settings, Clock } from 'lucide-react';
import { Player } from '../App';

interface TimerScreenProps {
  players: Player[];
  onBackToSetup: () => void;
}

const TimerScreen: React.FC<TimerScreenProps> = ({ players, onBackToSetup }) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [gameState, setGameState] = useState<'idle' | 'running' | 'paused'>('idle');
  const [showTimeUpMessage, setShowTimeUpMessage] = useState(false);
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

  // Sound generation functions
  const playTickSound = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
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
        gainNode.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioContextRef.current.currentTime + 0.3);
      }, index * 150);
    });
  }, []);

  // Auto-advance to next player - using useCallback with proper dependencies
  const advanceToNextPlayer = useCallback(() => {
    console.log(`Current player index: ${currentPlayerIndex}, Total players: ${players.length}`);
    
    setCurrentPlayerIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % players.length;
      console.log(`Advancing from player ${prevIndex + 1} (${players[prevIndex]?.name}) to player ${nextIndex + 1} (${players[nextIndex]?.name})`);
      return nextIndex;
    });
    
    // Reset all states for the new player
    setTimeLeft(60);
    setIsRunning(true); // Automatically start the next player's timer
    setGameState('running');
    setShowTimeUpMessage(false);
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [currentPlayerIndex, players]);

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
              // Use the current state values directly instead of closure
              setCurrentPlayerIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % players.length;
                console.log(`Auto-advancing from player ${prevIndex + 1} to player ${nextIndex + 1}`);
                return nextIndex;
              });
              
              // Reset states for new player
              setTimeLeft(60);
              setIsRunning(true);
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
    setCurrentPlayerIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % players.length;
      console.log(`Manual advance from player ${prevIndex + 1} to player ${nextIndex + 1}`);
      return nextIndex;
    });
    
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-md min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToSetup}
          className="p-2 text-gray-600 hover:bg-white hover:text-gray-800 rounded-lg transition-colors"
        >
          <Settings size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Board Game Timer</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Player List */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-3 text-center">Players</h3>
        <div className="flex justify-center space-x-4">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`flex flex-col items-center space-y-1 transition-all duration-300 ${
                index === currentPlayerIndex ? 'scale-110' : 'opacity-60'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${player.color} ${
                index === currentPlayerIndex ? 'ring-2 ring-offset-1 ring-gray-400' : ''
              }`} />
              <span className={`text-xs font-medium ${
                index === currentPlayerIndex ? 'text-gray-800' : 'text-gray-500'
              }`}>
                {player.name}
              </span>
              {/* Debug info - remove this later */}
              <span className="text-xs text-gray-400">#{index + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Timer */}
      <div className="flex-1 flex flex-col justify-center">
        <div className={`bg-white rounded-3xl shadow-xl p-8 transition-all duration-300 ${
          gameState === 'running' ? 'ring-4 ring-blue-400 shadow-2xl' : ''
        }`}>
          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${currentPlayer.color}`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>

          {/* Current Player */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className={`w-4 h-4 rounded-full ${currentPlayer.color}`} />
              <h2 className="text-xl font-bold text-gray-800">{currentPlayer.name}'s Turn</h2>
            </div>
            <div className={`flex items-center justify-center space-x-1 text-sm ${
              gameState === 'running' ? 'text-blue-600' : 
              gameState === 'paused' ? 'text-orange-600' : 'text-gray-500'
            }`}>
              <Clock size={16} />
              <span className="capitalize">
                {gameState === 'idle' ? 'Ready' : gameState}
              </span>
            </div>
            {/* Debug info - remove this later */}
            <div className="text-xs text-gray-400 mt-1">
              Player {currentPlayerIndex + 1} of {players.length}
            </div>
          </div>

          {/* Timer Display */}
          <div className={`text-center mb-8 transition-all duration-300 ${
            isLowTime ? 'animate-pulse' : ''
          }`}>
            <div className={`text-7xl font-bold mb-2 transition-colors duration-300 ${
              isTimeUp ? 'text-red-500' : 
              isLowTime ? 'text-orange-500' : 
              'text-gray-800'
            }`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-base text-gray-500">
              {showTimeUpMessage ? "Time's up! Next player..." : 
               isLowTime ? 'Hurry up!' : 
               isRunning ? 'Time running...' : 
               'Tap play to start'}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={handlePlayPause}
              disabled={timeLeft === 0}
              className={`flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200 ${
                timeLeft === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isRunning 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl' 
                    : `${currentPlayer.color} hover:opacity-90 text-white shadow-lg hover:shadow-xl`
              }`}
            >
              {isRunning ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <button
              onClick={handleNextPlayer}
              className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <SkipForward size={24} />
            </button>
            
            <button
              onClick={handleResetTimer}
              className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-500 hover:bg-gray-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <RotateCcw size={24} />
            </button>
          </div>
        </div>
      </div>

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