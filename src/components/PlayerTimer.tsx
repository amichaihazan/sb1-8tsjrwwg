import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Clock, Edit2, Check, SkipForward } from 'lucide-react';

interface PlayerTimerProps {
  playerId: number;
  playerName: string;
  playerColor: string;
  isActive: boolean;
  onTimeUp: (playerId: number) => void;
  onTimerStart: (playerId: number) => void;
  onNameChange: (playerId: number, name: string) => void;
  onNextPlayer: (playerId: number) => void;
  gameState: 'idle' | 'running' | 'paused';
}

const PlayerTimer: React.FC<PlayerTimerProps> = ({
  playerId,
  playerName,
  playerColor,
  isActive,
  onTimeUp,
  onTimerStart,
  onNameChange,
  onNextPlayer,
  gameState
}) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(playerName);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    // Initialize on first user interaction
    const handleFirstInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Sound generation functions
  const playTickSound = () => {
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
  };

  const playTimeUpSound = () => {
    if (!audioContextRef.current) return;
    
    // Play a sequence of beeps
    const frequencies = [523, 659, 784]; // C, E, G notes
    
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = audioContextRef.current!.createOscillator();
        const gainNode = audioContextRef.current!.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current!.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContextRef.current!.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContextRef.current!.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current!.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioContextRef.current!.currentTime + 0.3);
      }, index * 150);
    });
  };

  useEffect(() => {
    if (isActive && gameState === 'running' && timeLeft > 0) {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          
          // Play tick sound in last 10 seconds
          if (newTime <= 10 && newTime > 0) {
            playTickSound();
          }
          
          if (newTime <= 0) {
            setIsRunning(false);
            playTimeUpSound();
            onTimeUp(playerId);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, gameState, timeLeft, playerId, onTimeUp]);

  const handlePlayPause = () => {
    if (!isActive && gameState !== 'idle') {
      return; // Prevent starting if another timer is running
    }
    
    if (!isRunning && timeLeft > 0) {
      onTimerStart(playerId);
    }
  };

  const handleNext = () => {
    // Reset the current timer to 60 seconds
    setTimeLeft(60);
    setIsRunning(false);
    
    // Clear any running interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Switch to next player
    onNextPlayer(playerId);
  };

  const handleNameEdit = () => {
    setIsEditingName(true);
    setTempName(playerName);
  };

  const handleNameSave = () => {
    if (tempName.trim()) {
      onNameChange(playerId, tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName(playerName);
    setIsEditingName(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
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
    <div className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
      isActive ? 'ring-4 ring-blue-400 shadow-xl scale-105' : 'hover:shadow-xl'
    }`}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gray-200">
        <div 
          className={`h-full transition-all duration-1000 ease-linear ${playerColor}`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      <div className="p-6">
        {/* Player header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1">
            <div className={`w-4 h-4 rounded-full ${playerColor.replace('bg-', 'bg-')}`} />
            {isEditingName ? (
              <div className="flex items-center space-x-2 flex-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  autoFocus
                  maxLength={20}
                />
                <button
                  onClick={handleNameSave}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 flex-1">
                <h3 className="font-semibold text-gray-800 truncate">{playerName}</h3>
                <button
                  onClick={handleNameEdit}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}
          </div>
          {isActive && (
            <div className="flex items-center space-x-1 text-blue-600 text-sm font-medium">
              <Clock size={16} />
              <span>Active</span>
            </div>
          )}
        </div>

        {/* Timer display */}
        <div className={`text-center mb-6 transition-all duration-300 ${
          isLowTime ? 'animate-pulse' : ''
        }`}>
          <div className={`text-6xl font-bold mb-2 transition-colors duration-300 ${
            isTimeUp ? 'text-red-500' : 
            isLowTime ? 'text-orange-500' : 
            'text-gray-800'
          }`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-gray-500">
            {isTimeUp ? 'Time\'s up!' : 
             isLowTime ? 'Hurry up!' : 
             isRunning ? 'Time running...' : 
             isActive ? 'Your turn!' : 'Waiting...'}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-3">
          <button
            onClick={handlePlayPause}
            disabled={timeLeft === 0 || (!isActive && gameState !== 'idle')}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
              timeLeft === 0 || (!isActive && gameState !== 'idle')
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isActive && isRunning 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl' 
                  : `${playerColor} hover:opacity-90 text-white shadow-lg hover:shadow-xl`
            }`}
          >
            {isActive && isRunning ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          {/* Next button - only show for active player */}
          {isActive && (
            <button
              onClick={handleNext}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 shadow-md hover:shadow-lg"
              title="Skip to next player and reset timer"
            >
              <SkipForward size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Time up overlay */}
      {isTimeUp && (
        <div className="absolute inset-0 bg-red-500 bg-opacity-10 flex items-center justify-center">
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold animate-bounce">
            Time's Up!
          </div>
        </div>
      )}

      {/* Hover effect for name editing */}
      <style jsx>{`
        .group:hover .group-hover\\:opacity-100 {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default PlayerTimer;