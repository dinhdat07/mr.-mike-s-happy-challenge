
import React, { useEffect, useRef } from 'react';
import { useGame } from '../App';

const ScoreDisplay: React.FC = () => {
  const { activePlayerStats } = useGame();
  const scoreRef = useRef<HTMLSpanElement>(null);
  const prevScoreRef = useRef<number>(0);

  useEffect(() => {
    if (activePlayerStats && scoreRef.current && activePlayerStats.score !== prevScoreRef.current) {
      if (activePlayerStats.score > prevScoreRef.current) {
        scoreRef.current.classList.add('animate-popScore');
        setTimeout(() => {
          scoreRef.current?.classList.remove('animate-popScore');
        }, 500);
      }
      prevScoreRef.current = activePlayerStats.score;
    }
  }, [activePlayerStats]);


  if (!activePlayerStats) return null;

  return (
    <div className="info-bubble p-2 rounded-lg shadow bg-white text-center">
      <div id="score-display" className="text-sm font-semibold text-gray-700">
        Score: <span
                  ref={scoreRef}
                  className="text-lg font-bold text-indigo-600"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {activePlayerStats.score}
                </span>
      </div>
      {/* Star display has been removed */}
    </div>
  );
};

export default ScoreDisplay;
