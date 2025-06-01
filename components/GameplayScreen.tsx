
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from '../App';
import { CONFIG } from '../constants';
import TimerDisplay from './TimerDisplay';
import ScoreDisplay from './ScoreDisplay';
import ArrayVisualization from './ArrayVisualization';
import NumberPad from './NumberPad';
import { ManualModeInteractionState, Problem, Screen } from '../types';
import { playSound } from '../services/soundService';


const GameplayScreen: React.FC = () => {
  const {
    gameState,
    gameSettings,
    submitAnswer,
    requestHint,
    activePlayerStats,
    nextProblem, // Added nextProblem for learning mode advancement
    handleManualControlAction,
    endManualSession,
    showFeedback,
  } = useGame();

  const { currentProblem, attemptsLeft, feedback, manualModeInteractionState, learningProgress, currentScreen } = gameState;
  const [answerInput, setAnswerInput] = useState('');
  const answerInputRef = useRef<HTMLInputElement>(null);
  const [hasSubmittedForThisInput, setHasSubmittedForThisInput] = useState(false);

  const problemToDisplay: Problem | null = gameSettings.isLearningMode ? learningProgress?.currentStepProblem || null : currentProblem;
  const currentLearningTip: string | null = gameSettings.isLearningMode ? learningProgress?.currentTip || null : null;

  useEffect(() => {
    setAnswerInput('');
    setHasSubmittedForThisInput(false);
    if (currentScreen === Screen.GAMEPLAY && !gameSettings.manualMode && !gameSettings.isLearningMode && problemToDisplay) {
      answerInputRef.current?.focus();
    }
  }, [problemToDisplay, gameSettings.manualMode, gameSettings.isLearningMode, currentScreen]);

  useEffect(() => {
    if (
      currentScreen === Screen.GAMEPLAY &&
      feedback &&
      feedback.type === 'incorrect' &&
      gameState.attemptsLeft > 0 &&
      !gameSettings.isLearningMode &&
      !gameSettings.manualMode &&
      problemToDisplay
    ) {
      setAnswerInput('');
      setHasSubmittedForThisInput(false);
      if (answerInputRef.current && document.activeElement !== answerInputRef.current) {
        answerInputRef.current.focus();
      }
    }
  }, [feedback, gameState.attemptsLeft, currentScreen, gameSettings.isLearningMode, gameSettings.manualMode, problemToDisplay]);


  useEffect(() => {
    const handleSpacebar = (event: KeyboardEvent) => {
      if (event.code === 'Space' && currentScreen === Screen.GAMEPLAY) {
        // Teacher Manual Mode
        if (gameSettings.manualMode && !gameSettings.isLearningMode) {
            if (!(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLButtonElement)) {
                event.preventDefault();
                handleManualControlAction();
            }
        // Learning Mode
        } else if (gameSettings.isLearningMode && problemToDisplay) {
             if (!(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLButtonElement)) {
                event.preventDefault();
                playSound(CONFIG.SOUND_EFFECTS.buttonClick, 'buttonClick');
                nextProblem();
            }
        }
      }
    };

    document.addEventListener('keydown', handleSpacebar);
    return () => {
      document.removeEventListener('keydown', handleSpacebar);
    };
  }, [gameSettings.manualMode, gameSettings.isLearningMode, handleManualControlAction, nextProblem, currentScreen, problemToDisplay]);

  useEffect(() => {
    if (gameSettings.isLearningMode || gameSettings.manualMode) return;

    if (problemToDisplay && answerInput.length > 0 && !hasSubmittedForThisInput) {
      const correctAnswerString = String(problemToDisplay.answer);
      if (answerInput.length === correctAnswerString.length) {
        const numAnswer = parseInt(answerInput, 10);
        if (!isNaN(numAnswer)) {
          setHasSubmittedForThisInput(true);
          submitAnswer(numAnswer);
        }
      }
    }
  }, [answerInput, problemToDisplay, gameSettings.manualMode, gameSettings.isLearningMode, submitAnswer, hasSubmittedForThisInput]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
        setAnswerInput(value);
        if (hasSubmittedForThisInput) {
            setHasSubmittedForThisInput(false);
        }
    }
  };

  const handleSubmitViaButtonOrEnter = useCallback(() => {
    if (gameSettings.manualMode && !gameSettings.isLearningMode) return;
    if (gameSettings.isLearningMode) return;

    if (answerInput.trim() === '') {
        showFeedback(CONFIG.UI_TEXTS.feedbackEmptyAnswer, 'info');
        return;
    }
    const numAnswer = parseInt(answerInput, 10);
    if (!isNaN(numAnswer)) {
      setHasSubmittedForThisInput(true);
      submitAnswer(numAnswer);
    } else {
      showFeedback(CONFIG.UI_TEXTS.feedbackInvalidInput, 'info');
      setAnswerInput('');
      setHasSubmittedForThisInput(false);
    }
  }, [gameSettings.manualMode, gameSettings.isLearningMode, answerInput, submitAnswer, showFeedback]);

  const handleNumberPadInput = useCallback((value: string) => {
    if (gameSettings.manualMode && !gameSettings.isLearningMode) return;
    if (gameSettings.isLearningMode) return;
    playSound(CONFIG.SOUND_EFFECTS.buttonClick, 'buttonClick');
    setHasSubmittedForThisInput(false);

    if (value === 'clear') {
      setAnswerInput('');
    } else if (value === 'backspace') {
      setAnswerInput(prev => prev.slice(0, -1));
    } else {
      setAnswerInput(prev => {
        if (prev.length < 5) {
            return prev + value;
        }
        return prev;
      });
    }
  }, [gameSettings.manualMode, gameSettings.isLearningMode, playSound]);


  if (!problemToDisplay && (gameSettings.isLearningMode && (!learningProgress || !learningProgress.currentStepProblem))) {
    return <div className="text-center p-4">{CONFIG.UI_TEXTS.problemGetReady}</div>;
  }
  if (!problemToDisplay && !gameSettings.isLearningMode && !currentProblem) {
     return <div className="text-center p-4">{CONFIG.UI_TEXTS.problemGetReady}</div>;
  }
  if (!problemToDisplay) {
    return <div className="text-center p-4">Loading next challenge...</div>;
  }


  const manualQuizControlButtonText = manualModeInteractionState === ManualModeInteractionState.SHOW_ANSWER
    ? CONFIG.UI_TEXTS.manualButtonShowAnswer
    : CONFIG.UI_TEXTS.manualButtonNextProblem;

  const playerTurnText = gameSettings.isLearningMode
    ? learningProgress?.moduleLabel || CONFIG.UI_TEXTS.learningModeActive
    : CONFIG.UI_TEXTS.gameplayTitle(activePlayerStats?.name || "");

  const problemFullText = gameSettings.isLearningMode
    ? `${problemToDisplay.question} = ${problemToDisplay.answer}`
    : problemToDisplay.question;

  const handleNextFactClick = () => {
    playSound(CONFIG.SOUND_EFFECTS.buttonClick, 'buttonClick');
    nextProblem();
  };

  return (
    <section id="gameplay-screen" className="active animate-fadeInScreen space-y-2 md:space-y-3">
      <h2
        id="player-turn-display"
        className="text-xl md:text-2xl font-bold"
        aria-live="polite"
        aria-atomic="true"
      >
        {playerTurnText}
        {gameSettings.manualMode && !gameSettings.isLearningMode && <span className="text-xs font-normal block"> (Manual Mode)</span>}
        {gameSettings.isLearningMode && <span className="text-sm font-normal block text-purple-600">({CONFIG.UI_TEXTS.learningModeActive})</span>}
      </h2>

      { !gameSettings.isLearningMode && !gameSettings.manualMode && (
        <div id="game-info" className={`grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 ${gameSettings.hideTimer ? 'timer-is-hidden' : ''}`}>
          {!gameSettings.hideTimer && <TimerDisplay />}
          <ScoreDisplay />
        </div>
      )}

      {gameSettings.arrayVisuals && problemToDisplay && <ArrayVisualization problem={problemToDisplay} />}

      <div id="problem-area" className="space-y-2">
        <div
          id="problem-display"
          className="problem-bubble text-2xl md:text-3xl p-3 rounded-lg shadow"
          aria-live="polite"
          aria-atomic="true"
        >
          {problemFullText}
        </div>

        {currentLearningTip && (
            <div
              id="learning-tip-area"
              className="p-2 my-1 bg-purple-50 border border-purple-200 rounded-md text-xs sm:text-sm text-purple-700 shadow"
              aria-live="polite"
            >
                <span className="font-bold">💡 Learning Tip: </span>{currentLearningTip}
            </div>
        )}

        {!gameSettings.isLearningMode && !gameSettings.manualMode && (
          <>
            <div id="answer-methods" className="flex flex-col items-center space-y-1.5">
              <input
                ref={answerInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                id="answer-input"
                value={answerInput}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitViaButtonOrEnter()}
                className="p-2 text-lg border-2 border-gray-300 rounded-lg shadow-sm w-32 text-center focus:ring-2 focus:ring-indigo-500"
                placeholder="?"
                aria-label="Enter your answer"
                autoComplete="off"
              />
              {gameSettings.voiceInput && (
                <div className="voice-button-container">
                  <button
                    id="speak-answer-btn"
                    disabled={true}
                    title="Voice input feature is under development."
                    className={`action-button px-2 py-1 text-xs rounded-md`}
                  >
                    Speak Answer (Soon!)
                  </button>
                </div>
              )}
            </div>
            <div id="speech-status-display" className="text-xs italic text-gray-600 h-4 text-center">
            </div>
            <NumberPad onInput={handleNumberPadInput} />
          </>
        )}
      </div>

      {gameSettings.isLearningMode && problemToDisplay && (
        <div id="learning-mode-controls" className="mt-2 text-center">
          <button
            id="next-fact-btn"
            onClick={handleNextFactClick}
            className="action-button text-sm px-4 py-2"
            aria-label="Next Fact (Press Space)"
          >
            Next Fact (Space)
          </button>
        </div>
      )}

      {!gameSettings.isLearningMode && gameSettings.hints && !gameSettings.manualMode && (
        <div className="flex justify-center space-x-2 mt-2">
            <button id="request-hint-btn" onClick={() => { requestHint(); playSound(CONFIG.SOUND_EFFECTS.buttonClick, 'buttonClick'); }} className="action-button text-xs px-3 py-1.5">
            {gameState.currentHintIndex >= 0 && gameState.currentHintIndex < gameState.currentHints.length -1 ? CONFIG.UI_TEXTS.hintButtonAnother : CONFIG.UI_TEXTS.hintRequest}
            </button>
        </div>
      )}

      {gameSettings.manualMode && !gameSettings.isLearningMode && (
        <div id="manual-controls-area" className="mt-2 flex flex-wrap justify-center items-center gap-2 md:gap-3 text-center">
           <p className="text-xs text-gray-600 w-full basis-full order-first md:hidden" id="manual-mode-description-sm">{CONFIG.UI_TEXTS.manualModeActive}</p>
          <button id="manual-control-btn" onClick={handleManualControlAction} className="action-button text-sm px-4 py-2" aria-describedby="manual-mode-description-main manual-mode-description-sm">
            {manualQuizControlButtonText}
          </button>
          <button id="end-manual-session-btn" onClick={endManualSession} className="action-button action-button-secondary text-sm px-4 py-2" aria-describedby="manual-mode-description-main manual-mode-description-sm">
            End Manual Session
          </button>
          <p className="text-xs text-gray-600 hidden md:block md:w-full md:basis-full md:order-last md:mt-0.5" id="manual-mode-description-main">{CONFIG.UI_TEXTS.manualModeActive}</p>
        </div>
      )}

      {feedback && (
        <div
          id="feedback-area"
          className={`feedback-bubble show p-2 my-2 rounded-md text-center font-semibold text-sm
            ${feedback.type === 'correct' ? 'bg-green-100 text-green-700 border-green-500 animate-pulseGlowCorrect' : ''}
            ${feedback.type === 'incorrect' ? 'bg-red-100 text-red-700 border-red-500' : ''}
            ${feedback.type === 'info' ? 'bg-blue-100 text-blue-700 border-blue-500' : ''}
          `}
          style={{borderWidth: feedback.type !== 'info' ? '2px' : '1px', borderStyle: 'solid'}}
          role={feedback.type === 'incorrect' || feedback.message.includes('error') || feedback.message.includes('Please') ? 'alert' : 'status'}
          aria-live={feedback.type === 'incorrect' || feedback.message.includes('error') || feedback.message.includes('Please') ? 'assertive' : 'polite'}
        >
          {feedback.message}
        </div>
      )}

      {!gameSettings.isLearningMode && !gameSettings.manualMode && (
        <div id="attempts-left-display" className="text-center mt-1 text-xs" aria-live="polite">
          Attempts left:
          {Array.from({ length: CONFIG.MAX_ATTEMPTS }).map((_, i) => (
            <span key={i} className={`attempt-dot inline-block w-3 h-3 rounded-full mx-0.5 ${i < attemptsLeft ? 'bg-green-500' : 'bg-gray-300 used'}`}></span>
          ))}
        </div>
      )}
    </section>
  );
};

export default GameplayScreen;
