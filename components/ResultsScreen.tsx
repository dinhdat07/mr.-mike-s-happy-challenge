
import React from 'react';
import { useGame } from '../App';
import { CONFIG } from '../constants';
import { PlayerMode, QuizHistoryEntry } from '../types';
import { playSound } from '../services/soundService';

const QuizReviewList: React.FC<{ history: QuizHistoryEntry[], playerName: string }> = ({ history, playerName }) => {
    const incorrectAnswers = history.filter(entry => !entry.correct);

    if (incorrectAnswers.length === 0) {
        return <p className="text-green-600 text-sm">{CONFIG.UI_TEXTS.allReviewCorrect(playerName)}</p>;
    }

    return (
        <ul id={`quiz-review-list-${playerName.toLowerCase().replace(/\s+/g, '-')}`} className="space-y-1">
            {incorrectAnswers.map((entry, index) => (
                <li key={`${playerName}-incorrect-${index}`} className="p-2 bg-red-50 border border-red-200 rounded-md incorrect-review">
                    <p className="font-semibold text-xs sm:text-sm">Problem: <span className="font-normal">{entry.problem.question}</span></p>
                    <p className="text-xs sm:text-sm">Your answer: <span className="user-answer text-red-700 font-bold">{entry.userAnswer ?? "No answer"}</span></p>
                    <p className="text-xs sm:text-sm">Correct answer: <span className="correct-answer text-green-700 font-bold">{entry.problem.answer}</span></p>
                </li>
            ))}
        </ul>
    );
};


const ResultsScreen: React.FC = () => {
  const { gameState, gameSettings, resetGame, completedLearningModules } = useGame();
  const { player1Stats, player2Stats } = gameState;

  const handlePlayAgain = () => {
    playSound(CONFIG.SOUND_EFFECTS.buttonClick, 'buttonClick');
    resetGame();
  }

  if (gameSettings.isLearningMode) {
    return (
        <section id="results-screen" className="active animate-fadeInScreen space-y-3 text-center">
            <h2 id="results-title" className="text-2xl font-bold mb-3">{CONFIG.UI_TEXTS.learningModeResultsTitle}</h2>
            <div className="results-summary-box p-3 bg-purple-50 rounded-lg shadow">
                <p className="text-base mb-2">{CONFIG.UI_TEXTS.learningModeResultsMessage}</p>
                {completedLearningModules.length > 0 ? (
                    <ul className="list-disc list-inside text-left space-y-0.5">
                        {completedLearningModules.map((moduleName, index) => (
                            <li key={index} className="text-purple-700 text-sm">{moduleName}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-600">No modules were completed in this session.</p>
                )}
                 <p className="mt-2 text-base font-semibold">Keep practicing to become a math whiz! ✨</p>
            </div>
            <button
                id="play-again-btn"
                onClick={handlePlayAgain}
                className="action-button w-full mt-4"
            >
                Learn More or Play Quiz!
            </button>
        </section>
    );
  }

  if (gameSettings.manualMode) {
    return (
        <section id="results-screen" className="active animate-fadeInScreen space-y-3 text-center">
            <h2 id="results-title" className="text-2xl font-bold mb-3">{CONFIG.UI_TEXTS.resultsTitle}</h2>
            <div className="results-summary-box p-4 bg-blue-50 rounded-lg shadow">
                <p className="text-base">{CONFIG.UI_TEXTS.manualSessionEndedMessage}</p>
            </div>
            <button
                id="play-again-btn"
                onClick={handlePlayAgain}
                className="action-button w-full mt-4"
            >
                Play Again!
            </button>
        </section>
    );
  }

  let winnerAnnouncement = "";
  if (gameSettings.playerMode === PlayerMode.MULTIPLAYER) {
    if (player1Stats.score > player2Stats.score) {
      winnerAnnouncement = `${player1Stats.name} wins! Congratulations!`;
    } else if (player2Stats.score > player1Stats.score) {
      winnerAnnouncement = `${player2Stats.name} wins! Congratulations!`;
    } else {
      winnerAnnouncement = "It's a tie! Well played by both!";
    }
  }

  return (
    <section id="results-screen" className="active animate-fadeInScreen space-y-3">
      <h2 id="results-title" className="text-2xl font-bold mb-3">{CONFIG.UI_TEXTS.resultsTitle}</h2>

      <div id="final-score-summary" className="results-summary-box p-3 bg-blue-50 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-blue-700">{player1Stats.name}'s Score</h3>
        <p className="score-value text-2xl font-bold text-blue-600 my-1">{player1Stats.score}</p>
        <p className="text-xs">Correct: {player1Stats.history.filter(h => h.correct).length} / {player1Stats.history.length}</p>
      </div>

      {gameSettings.playerMode === PlayerMode.MULTIPLAYER && (
        <div id="player2-score-summary" className="results-summary-box p-3 bg-green-50 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-green-700">{player2Stats.name}'s Score</h3>
          <p className="score-value text-2xl font-bold text-green-600 my-1">{player2Stats.score}</p>
          <p className="text-xs">Correct: {player2Stats.history.filter(h => h.correct).length} / {player2Stats.history.length}</p>
        </div>
      )}

      {winnerAnnouncement && (
        <div
          id="winner-announcement"
          className="winner-box p-2 my-2 rounded-lg shadow-lg text-center text-lg font-bold animate-tadaWinner"
          role="alert"
          aria-live="assertive"
        >
          {winnerAnnouncement}
        </div>
      )}

      <div id="quiz-review-area" className="mt-3">
        <h3 className="text-base font-semibold mb-2">{CONFIG.UI_TEXTS.reviewIncorrectTitle}</h3>
        <div className="space-y-2">
            <div>
                <QuizReviewList history={player1Stats.history} playerName={player1Stats.name} />
            </div>
            {gameSettings.playerMode === PlayerMode.MULTIPLAYER && player2Stats.history.length > 0 && (
                 <div>
                    <QuizReviewList history={player2Stats.history} playerName={player2Stats.name} />
                </div>
            )}
        </div>
      </div>

      <button
        id="play-again-btn"
        onClick={handlePlayAgain}
        className="action-button w-full mt-4"
      >
        Play Again!
      </button>
    </section>
  );
};

export default ResultsScreen;
