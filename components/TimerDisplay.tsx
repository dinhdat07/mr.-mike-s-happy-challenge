
import React from 'react';
import { useGame } from '../App';
import { CONFIG } from '../constants';

const TimerDisplay: React.FC = () => {
  const { gameState, gameSettings } = useGame();
  const { timeLeft } = gameState;

  if (gameSettings.hideTimer) {
    return (
      <div className="info-bubble p-2 rounded-lg shadow bg-gray-100 text-center">
        <p className="text-sm font-semibold">{CONFIG.UI_TEXTS.timerHidden}</p>
      </div>
    );
  }

  const totalDuration = gameSettings.quizDurationMinutes * 60 + gameSettings.quizDurationSeconds;
  const progressPercent = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isUrgent = timeLeft <= 10 && totalDuration > 10;

  return (
    <div className="info-bubble p-2 rounded-lg shadow bg-white text-center">
      <div id="timer-display" className={`text-lg font-bold ${isUrgent ? 'text-red-500 animate-pulseTimerUrgent' : 'text-gray-700'}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <div id="timer-progress-container" className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          id="timer-progress-bar"
          className="h-full rounded-full transition-all duration-500 ease-linear"
          style={{ width: `${progressPercent}%`, backgroundColor: isUrgent ? 'var(--negative-color)' : 'var(--accent-color)' }}
          role="progressbar"
          aria-valuenow={timeLeft}
          aria-valuemin={0}
          aria-valuemax={totalDuration}
          aria-label="Time remaining"
        ></div>
      </div>
    </div>
  );
};

export default TimerDisplay;
