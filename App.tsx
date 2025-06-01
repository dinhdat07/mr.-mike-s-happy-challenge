
import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { Screen, GameSettings, PlayerStats, Problem, MrMikeState, QuizHistoryEntry, PlayerMode, ChallengeType, OperationType, ManualModeInteractionState, LearningModuleQueueItem, LearningProgress } from './types';
import { CONFIG }  from './constants';
import WelcomeScreen from './components/WelcomeScreen';
import SettingsScreen from './components/SettingsScreen';
import GameplayScreen from './components/GameplayScreen';
import ResultsScreen from './components/ResultsScreen';
import MrMikeCharacter from './components/MrMikeCharacter';
import { initializeSpeechRecognition, stopRecognition, startRecognition, speakText } from './services/speechService';
import { playSound } from './services/soundService';
import { generateProblem, getLearningModuleDetails, generateProblemForLearningStep, resetMandatoryProblemState as resetQuizServiceMandatoryProblems } from './services/quizService';

interface GameContextType {
  gameState: AppState;
  gameSettings: GameSettings;
  setGameSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  setCurrentScreen: (screen: Screen) => void;
  startGame: (settings: GameSettings) => void;
  submitAnswer: (answer: number) => void;
  requestHint: () => void; 
  nextProblem: () => void; 
  endTurn: () => void;
  resetGame: () => void;
  setMrMikeState: (state: MrMikeState, duration?: number) => void;
  showFeedback: (message: string, type: 'correct' | 'incorrect' | 'info', duration?: number) => void;
  activePlayerStats: PlayerStats | null;
  getProblemById: (id: string) => Problem | undefined;
  readTextAloud: (text: string, onEnd?: () => void) => void;
  isRecognizingSpeech: boolean; 
  handleManualControlAction: () => void;
  endManualSession: () => void;
  setAmbientEffect: (effect: 'warm' | 'cool' | 'none') => void;
  completedLearningModules: string[]; 
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface AppState {
  currentScreen: Screen;
  currentPlayerIndex: 0 | 1; 
  player1Stats: PlayerStats;
  player2Stats: PlayerStats;
  currentProblem: Problem | null; 
  timeLeft: number; 
  timerId: ReturnType<typeof setTimeout> | null; 
  attemptsLeft: number; 
  mrMikeState: MrMikeState;
  feedback: { message: string; type: 'correct' | 'incorrect' | 'info' } | null;
  consecutiveCorrectAnswers: number; 
  isRecognizingSpeech: boolean; 
  currentHints: string[]; 
  currentHintIndex: number; 
  quizActive: boolean; 
  manualModeInteractionState: ManualModeInteractionState;

  learningProgress: LearningProgress | null;
  learningModulesQueue: LearningModuleQueueItem[];
  currentLearningModuleQueueIndex: number;
  completedLearningModules: string[];
}

const initialPlayerStats = (name: string): PlayerStats => ({
  name,
  score: 0,
  history: [],
});

const App: React.FC = () => {
  const [gameSettings, setGameSettings] = useState<GameSettings>(CONFIG.INITIAL_GAME_SETTINGS);
  const [appState, setAppState] = useState<AppState>({
    currentScreen: Screen.WELCOME,
    currentPlayerIndex: 0,
    player1Stats: initialPlayerStats(CONFIG.INITIAL_GAME_SETTINGS.player1Name),
    player2Stats: initialPlayerStats(CONFIG.INITIAL_GAME_SETTINGS.player2Name),
    currentProblem: null,
    timeLeft: 0,
    timerId: null,
    attemptsLeft: CONFIG.MAX_ATTEMPTS,
    mrMikeState: MrMikeState.IDLE,
    feedback: null,
    consecutiveCorrectAnswers: 0,
    isRecognizingSpeech: false, 
    currentHints: [],
    currentHintIndex: -1,
    quizActive: false,
    manualModeInteractionState: CONFIG.MANUAL_MODE_STATES.SHOW_ANSWER,
    learningProgress: null,
    learningModulesQueue: [],
    currentLearningModuleQueueIndex: -1,
    completedLearningModules: [],
  });

  const { player1Stats, player2Stats, currentPlayerIndex, currentProblem, timerId, feedback, mrMikeState, timeLeft, quizActive, manualModeInteractionState, learningProgress } = appState;

  const activePlayerStats = currentPlayerIndex === 0 ? player1Stats : player2Stats;

  const appStateRef = useRef(appState);
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  const learningModeAutoAdvanceTimerRef = useRef<number | null>(null);


  const updatePlayerStats = (statsUpdate: Partial<PlayerStats>) => {
    setAppState(prev => ({
      ...prev,
      ...(prev.currentPlayerIndex === 0
        ? { player1Stats: { ...prev.player1Stats, ...statsUpdate } }
        : { player2Stats: { ...prev.player2Stats, ...statsUpdate } }),
    }));
  };

  const updatePlayerHistory = (entry: QuizHistoryEntry) => {
    setAppState(prev => {
      const currentHistory = prev.currentPlayerIndex === 0 ? prev.player1Stats.history : prev.player2Stats.history;
      const updatedHistory = [...currentHistory, entry];
      return {
        ...prev,
        ...(prev.currentPlayerIndex === 0
          ? { player1Stats: { ...prev.player1Stats, history: updatedHistory } }
          : { player2Stats: { ...prev.player2Stats, history: updatedHistory } }),
      };
    });
  };

  const setCurrentScreen = useCallback((screen: Screen) => {
    setAppState(prev => ({ ...prev, currentScreen: screen }));
    setTimeout(() => {
        let focusElement: HTMLElement | null = null;
        if (screen === Screen.WELCOME) focusElement = document.getElementById('student-name-p1');
        else if (screen === Screen.SETTINGS) focusElement = document.getElementById('learningModeToggle');
        else if (screen === Screen.GAMEPLAY) focusElement = document.getElementById('answer-input') || document.getElementById('manual-control-btn') || document.getElementById('next-fact-btn');
        else if (screen === Screen.RESULTS) focusElement = document.getElementById('play-again-btn');
        
        focusElement?.focus();
    }, 100); 
  }, []);

  const setMrMikeAnimState = useCallback((state: MrMikeState, duration: number = CONFIG.MR_MIKE_STATE_REVERT_DELAY_MS) => {
    setAppState(prev => ({ ...prev, mrMikeState: state }));
    if (state !== MrMikeState.IDLE && state !== MrMikeState.THINKING) {
      setTimeout(() => setAppState(prev => {
        if (prev.mrMikeState === state) { 
            return {...prev, mrMikeState: MrMikeState.IDLE };
        }
        return prev;
      }), duration);
    }
  }, []);

  const showFeedback = useCallback((message: string, type: 'correct' | 'incorrect' | 'info', duration?: number) => {
    const feedbackDuration = duration ?? (type === 'info' && message.toLowerCase().includes('hint:') ? 4000 : CONFIG.FEEDBACK_MESSAGE_DURATION_MS) ;
    setAppState(prev => ({ ...prev, feedback: { message, type } }));
    setTimeout(() => setAppState(prev => ({ ...prev, feedback: null })), feedbackDuration);
  }, []);

  const setAmbientEffect = useCallback((effect: 'warm' | 'cool' | 'none') => {
    document.body.classList.remove('ambiance-warm', 'ambiance-cool');
    if (effect === 'warm') {
        document.body.classList.add('ambiance-warm');
    } else if (effect === 'cool') {
        document.body.classList.add('ambiance-cool');
    }
  }, []);

  const readTextAloud = useCallback(async (text: string, onEnd?: () => void) => {
    if (gameSettings.readAloud) {
      await speakText(text, onEnd); 
    } else if (onEnd) {
      onEnd(); 
    }
  }, [gameSettings.readAloud]);

  const endQuizSession = useCallback(() => { 
    if (timerId) clearInterval(timerId);
    setAppState(prev => ({ ...prev, quizActive: false, timerId: null }));
    setCurrentScreen(Screen.RESULTS);
    playSound(CONFIG.SOUND_EFFECTS.gameOver, 'gameOver');
    setAmbientEffect('none');
  },[timerId, setCurrentScreen, setAmbientEffect]);

  const setupCurrentLearningModule = useCallback(() => {
    setAppState(prev => {
      if (prev.currentLearningModuleQueueIndex < 0 || prev.currentLearningModuleQueueIndex >= prev.learningModulesQueue.length) {
        return { ...prev, learningProgress: null }; 
      }
      const currentModuleInfo = prev.learningModulesQueue[prev.currentLearningModuleQueueIndex];
      const details = getLearningModuleDetails(currentModuleInfo.challengeType, currentModuleInfo.specificOption);
      
      const { problem, tip } = generateProblemForLearningStep(currentModuleInfo.challengeType, currentModuleInfo.specificOption, 0);

      if (prev.completedLearningModules.indexOf(details.label) === -1) {
        readTextAloud(`Starting module: ${details.label}. ${CONFIG.LEARNING_TIPS.GENERAL?.WELCOME || ''}`);
      }

      return {
        ...prev,
        learningProgress: {
          moduleLabel: details.label,
          currentStepProblem: problem, 
          currentStepNumber: 0,
          totalStepsInModule: details.totalSteps,
          currentTip: tip, 
        },
        mrMikeState: MrMikeState.IDLE, 
      };
    });
  }, [readTextAloud]);

  const loadNextLearningModuleOrEnd = useCallback(() => {
    setAppState(prev => {
      const nextModuleIndex = prev.currentLearningModuleQueueIndex + 1;
      if (nextModuleIndex >= prev.learningModulesQueue.length) {
        showFeedback(CONFIG.UI_TEXTS.allLearningModulesComplete, 'info', 5000);
        readTextAloud(CONFIG.UI_TEXTS.allLearningModulesComplete, () => {
           setCurrentScreen(Screen.RESULTS);
           setAmbientEffect('none');
        });
        return { ...prev, learningProgress: null, quizActive: false }; 
      }
      const completedLabel = prev.learningProgress?.moduleLabel;
      const updatedCompletedModules = completedLabel && !prev.completedLearningModules.includes(completedLabel)
        ? [...prev.completedLearningModules, completedLabel]
        : prev.completedLearningModules;

      return { ...prev, currentLearningModuleQueueIndex: nextModuleIndex, completedLearningModules: updatedCompletedModules };
    });
  }, [showFeedback, readTextAloud, setCurrentScreen, setAmbientEffect]);
  
  useEffect(() => {
    if (gameSettings.isLearningMode && appState.currentLearningModuleQueueIndex !== -1 && appState.currentScreen === Screen.GAMEPLAY) {
        if (!appState.learningProgress || appState.learningProgress.moduleLabel !== appState.learningModulesQueue[appState.currentLearningModuleQueueIndex].label) {
             setupCurrentLearningModule();
        }
    }
  }, [appState.currentLearningModuleQueueIndex, gameSettings.isLearningMode, appState.currentScreen, appState.learningProgress, appState.learningModulesQueue, setupCurrentLearningModule]);


  const loadLearningStepProblem = useCallback(() => {
    setAppState(prev => {
      if (!prev.learningProgress || !prev.learningModulesQueue[prev.currentLearningModuleQueueIndex]) {
        return prev; 
      }
      const currentModuleInfo = prev.learningModulesQueue[prev.currentLearningModuleQueueIndex];
      const { problem, tip } = generateProblemForLearningStep(
        currentModuleInfo.challengeType,
        currentModuleInfo.specificOption,
        prev.learningProgress.currentStepNumber
      );
      return {
        ...prev,
        learningProgress: {
          ...prev.learningProgress,
          currentStepProblem: problem,
          currentTip: tip,
        },
        mrMikeState: MrMikeState.THINKING, 
        feedback: null, 
      };
    });
  }, []); 
  
  const nextQuizProblem = useCallback(() => {
    if (!quizActive && !gameSettings.manualMode) {
        if (!gameSettings.manualMode && timeLeft <= 0) {
            endQuizSession();
        }
        return;
    }

    const problemHistory = activePlayerStats?.history.map(h => h.problem) || [];
    const newProblem = generateProblem(gameSettings, problemHistory);

    let hintsForProblem: string[] = [];
    if (newProblem && newProblem.originalChallengeType) {
      const challengeHints = CONFIG.STRATEGY_HINTS_CONFIG[newProblem.originalChallengeType];
      if (challengeHints) {
        hintsForProblem = challengeHints;
      } else {
        const mappedOpType = newProblem.originalChallengeType === ChallengeType.MULTIPLICATION || newProblem.originalChallengeType === ChallengeType.DOUBLES ? ChallengeType.MULTIPLICATION :
                             newProblem.originalChallengeType === ChallengeType.DIVISION || newProblem.originalChallengeType === ChallengeType.HALVES ? ChallengeType.DIVISION :
                             newProblem.originalChallengeType === ChallengeType.ADDITION ? ChallengeType.ADDITION :
                             newProblem.originalChallengeType === ChallengeType.SUBTRACTION ? ChallengeType.SUBTRACTION : undefined;
        if(mappedOpType && CONFIG.STRATEGY_HINTS_CONFIG[mappedOpType]) {
            hintsForProblem = CONFIG.STRATEGY_HINTS_CONFIG[mappedOpType]!;
        }
      }
    }


    setAppState(prev => ({
      ...prev,
      currentProblem: newProblem,
      attemptsLeft: CONFIG.MAX_ATTEMPTS,
      feedback: null,
      currentHints: hintsForProblem,
      currentHintIndex: -1,
      manualModeInteractionState: CONFIG.MANUAL_MODE_STATES.SHOW_ANSWER,
    }));
    setMrMikeAnimState(MrMikeState.IDLE);
    if (newProblem) {
      readTextAloud(gameSettings.manualMode ? `Next problem: ${newProblem.question}` : newProblem.question);
    }
  }, [gameSettings, activePlayerStats?.history, readTextAloud, quizActive, setMrMikeAnimState, timeLeft, endQuizSession]);

  const nextProblem = useCallback(() => { 
    if (gameSettings.isLearningMode) {
        setAppState(prev => {
            if (!prev.learningProgress) return prev; 
            
            const nextStepNumber = prev.learningProgress.currentStepNumber + 1;
            if (nextStepNumber >= prev.learningProgress.totalStepsInModule) {
                return {...prev, feedback: {message: CONFIG.UI_TEXTS.learningModuleComplete(prev.learningProgress.moduleLabel), type: 'info'}};
            }
            return {
                ...prev,
                learningProgress: {
                    ...prev.learningProgress,
                    currentStepNumber: nextStepNumber,
                },
            };
        });
    } else {
      nextQuizProblem();
    }
  }, [gameSettings.isLearningMode, nextQuizProblem]);

  useEffect(() => { 
    if (gameSettings.isLearningMode && appState.learningProgress && 
        (appState.learningProgress.currentStepProblem === null || 
         (appState.learningProgress.currentStepProblem && 
          appState.learningModulesQueue[appState.currentLearningModuleQueueIndex] && 
          appState.learningProgress.currentStepProblem.id !== generateProblemForLearningStep(appState.learningModulesQueue[appState.currentLearningModuleQueueIndex].challengeType, appState.learningModulesQueue[appState.currentLearningModuleQueueIndex].specificOption, appState.learningProgress.currentStepNumber).problem.id ))
       ) {
      loadLearningStepProblem();
    }
    if (gameSettings.isLearningMode && appState.feedback?.message.includes("module complete!")) {
        const displayDuration = appState.feedback.message.length > 50 ? 4000 : 3000; 
        setTimeout(() => loadNextLearningModuleOrEnd(), displayDuration);
    }

  }, [gameSettings.isLearningMode, appState.learningProgress?.currentStepNumber, appState.learningProgress?.currentStepProblem, loadLearningStepProblem, appState.learningModulesQueue, appState.currentLearningModuleQueueIndex, appState.feedback, loadNextLearningModuleOrEnd]);

  useEffect(() => {
    if (
        gameSettings.isLearningMode &&
        appStateRef.current.currentScreen === Screen.GAMEPLAY && 
        appStateRef.current.learningProgress &&
        appStateRef.current.learningProgress.currentStepProblem 
    ) {
        const problem = appStateRef.current.learningProgress.currentStepProblem;
        const tip = appStateRef.current.learningProgress.currentTip;
        
        if (!problem) return; 

        const textToRead = `${problem.question}. The answer is ${problem.answer}. ${tip || ''}`;
        
        if (learningModeAutoAdvanceTimerRef.current) {
            clearTimeout(learningModeAutoAdvanceTimerRef.current);
            learningModeAutoAdvanceTimerRef.current = null;
        }

        if (gameSettings.readAloud) {
            readTextAloud(textToRead, () => {
                 // console.log("Finished reading learning fact. Waiting for manual advance.");
            });
        }
    }

    return () => {
        if (learningModeAutoAdvanceTimerRef.current) {
            clearTimeout(learningModeAutoAdvanceTimerRef.current);
            learningModeAutoAdvanceTimerRef.current = null;
        }
    };
  }, [
      gameSettings.isLearningMode,
      gameSettings.readAloud,
      appState.learningProgress?.currentStepProblem?.id, 
      appState.learningProgress?.currentStepProblem?.answer,
      appState.learningProgress?.currentTip,
      readTextAloud,
      appState.currentScreen 
  ]);


  const submitAnswer = useCallback((answer: number) => {
    if (gameSettings.isLearningMode) return;

    if (!currentProblem || (!quizActive && !gameSettings.manualMode)) return;
    const isCorrect = answer === currentProblem.answer;
    updatePlayerHistory({ problem: currentProblem, userAnswer: answer, correct: isCorrect });

    if (isCorrect) {
      playSound(CONFIG.SOUND_EFFECTS.correct, 'correct');
      setMrMikeAnimState(MrMikeState.HAPPY);
      setAmbientEffect('warm');
      showFeedback(CONFIG.UI_TEXTS.feedbackCorrect, 'correct');
      updatePlayerStats({ score: (activePlayerStats?.score || 0) + 1 });
      setAppState(prev => ({...prev, consecutiveCorrectAnswers: prev.consecutiveCorrectAnswers + 1}));
      if ((appState.consecutiveCorrectAnswers + 1) % CONFIG.STREAK_THRESHOLD_FOR_PRAISE === 0) {
        showFeedback(`Amazing! ${appState.consecutiveCorrectAnswers + 1} in a row!`, 'info', 3000);
        playSound(CONFIG.SOUND_EFFECTS.streak, 'streak');
        setMrMikeAnimState(MrMikeState.PERFECT_STREAK);
      }
      setTimeout(() => nextProblem(), CONFIG.CORRECT_ANSWER_NEXT_PROBLEM_DELAY_MS);
    } else {
      playSound(CONFIG.SOUND_EFFECTS.incorrect, 'incorrect');
      setMrMikeAnimState(MrMikeState.SAD);
      setAmbientEffect('cool');
      setAppState(prev => ({...prev, attemptsLeft: prev.attemptsLeft - 1, consecutiveCorrectAnswers: 0}));
      if (appState.attemptsLeft -1 <= 0) {
        showFeedback(CONFIG.UI_TEXTS.feedbackIncorrect(currentProblem.answer), 'incorrect', CONFIG.FEEDBACK_MESSAGE_DURATION_MS * 1.5);
        setTimeout(() => nextProblem(), CONFIG.FEEDBACK_MESSAGE_DURATION_MS * 1.2);
      } else {
        showFeedback(`Not quite. ${appState.attemptsLeft - 1} attempts left.`, 'incorrect');
      }
    }
    
  }, [gameSettings, currentProblem, activePlayerStats?.score, appState.attemptsLeft, appState.consecutiveCorrectAnswers, quizActive, showFeedback, setMrMikeAnimState, playSound, nextProblem, updatePlayerStats, updatePlayerHistory, setAmbientEffect]);


  const endTurn = useCallback(() => { 
    if(timerId) clearInterval(timerId);
    setAppState(prev => ({ ...prev, quizActive: false, timerId: null }));

    if (gameSettings.playerMode === PlayerMode.MULTIPLAYER && currentPlayerIndex === 0 && !gameSettings.manualMode && !gameSettings.isLearningMode) {
      setAppState(prev => ({...prev, currentPlayerIndex: 1}));
      const totalDuration = gameSettings.quizDurationMinutes * 60 + gameSettings.quizDurationSeconds;
      const newTimerId = setInterval(() => {
        setAppState(p => ({ ...p, timeLeft: Math.max(0, p.timeLeft - 1) }));
      }, CONFIG.TIMER_INTERVAL_MS);
      setAppState(prev => ({
        ...prev,
        timeLeft: totalDuration,
        timerId: newTimerId,
        quizActive: true,
      }));
      showFeedback(`${gameSettings.player2Name}'s turn!`, 'info');
      setTimeout(() => nextQuizProblem(), 100);
    } else {
      endQuizSession();
    }
  }, [timerId, gameSettings, currentPlayerIndex, showFeedback, endQuizSession, nextQuizProblem]);

  useEffect(() => { 
    if (timeLeft <= 0 && quizActive && timerId && !gameSettings.manualMode && !gameSettings.isLearningMode) {
      clearInterval(timerId);
      setAppState(prev => ({ ...prev, timerId: null, quizActive: false }));
      showFeedback("Time's up!", 'info');
      setMrMikeAnimState(MrMikeState.SAD);
      setAmbientEffect('cool');
      endTurn();
    }
  }, [timeLeft, quizActive, timerId, showFeedback, setMrMikeAnimState, gameSettings.manualMode, gameSettings.isLearningMode, endTurn, setAmbientEffect]);

  const startGame = useCallback((settings: GameSettings) => {
    setGameSettings(settings);
    resetQuizServiceMandatoryProblems(); 
    if (timerId) clearInterval(timerId);
    if (learningModeAutoAdvanceTimerRef.current) {
        clearTimeout(learningModeAutoAdvanceTimerRef.current);
        learningModeAutoAdvanceTimerRef.current = null;
    }
    
    setAppState(prev => ({
      ...prev,
      currentScreen: Screen.GAMEPLAY,
      player1Stats: initialPlayerStats(settings.player1Name), 
      player2Stats: initialPlayerStats(settings.player2Name),
      currentPlayerIndex: 0,
      currentProblem: null,
      timeLeft: 0,
      timerId: null,
      attemptsLeft: CONFIG.MAX_ATTEMPTS,
      mrMikeState: MrMikeState.IDLE,
      feedback: null,
      consecutiveCorrectAnswers: 0,
      quizActive: false, 
      isRecognizingSpeech: false, 
      manualModeInteractionState: CONFIG.MANUAL_MODE_STATES.SHOW_ANSWER,
      learningProgress: null,
      learningModulesQueue: [],
      currentLearningModuleQueueIndex: -1,
      completedLearningModules: [],
    }));

    if (settings.isLearningMode) {
        const queue: LearningModuleQueueItem[] = [];
        settings.challengeType.forEach(ct => {
            if (ct === ChallengeType.DOUBLES || ct === ChallengeType.HALVES) {
                const details = getLearningModuleDetails(ct, 0); 
                queue.push({
                    challengeType: ct,
                    specificOption: 0, 
                    label: details.label
                });
            } else {
                let specificOptions: (number | 'mixed')[] = [];
                switch (ct) {
                    case ChallengeType.MULTIPLICATION: specificOptions = settings.multiplicationTable; break;
                    case ChallengeType.DIVISION: specificOptions = settings.divisionDivisor; break;
                    case ChallengeType.SUBTRACTION: specificOptions = settings.subtractionTable; break;
                    case ChallengeType.ADDITION: specificOptions = settings.additionTable; break;
                }
                
                specificOptions.forEach(opt => {
                    const details = getLearningModuleDetails(ct, opt);
                    queue.push({
                        challengeType: ct,
                        specificOption: opt,
                        label: details.label
                    });
                });
            }
        });
        
        setAppState(prev => ({
            ...prev,
            learningModulesQueue: queue,
            currentLearningModuleQueueIndex: queue.length > 0 ? 0 : -1, 
            quizActive: queue.length > 0, 
        }));
        if (settings.readAloud) {
             readTextAloud(`Let's start Learning Mode, ${settings.player1Name}!`);
        }

    } else { 
      const totalDuration = settings.quizDurationMinutes * 60 + settings.quizDurationSeconds;
      let newTimerId: ReturnType<typeof setTimeout> | null = null;
      if (!settings.manualMode) {
        newTimerId = setInterval(() => {
          setAppState(prev => ({ ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) }));
        }, CONFIG.TIMER_INTERVAL_MS);
      }
      setAppState(prev => ({
        ...prev,
        timeLeft: totalDuration,
        timerId: newTimerId,
        quizActive: true,
      }));
      if (settings.readAloud) {
        readTextAloud(`Let's start the quiz, ${settings.player1Name}! ${settings.manualMode ? "Manual mode is active." : ""}`);
      }
    }
  }, [timerId, readTextAloud]);
  
  useEffect(() => {
    // Auto-load first problem in regular quiz mode (non-manual, non-learning) for player 1
    if (!gameSettings.isLearningMode && appState.currentScreen === Screen.GAMEPLAY && appState.quizActive && !appState.currentProblem && !gameSettings.manualMode && appState.currentPlayerIndex === 0) {
      nextQuizProblem();
    }
    // Auto-load first problem for player 2 in multiplayer (non-manual, non-learning)
    if (!gameSettings.isLearningMode && gameSettings.playerMode === PlayerMode.MULTIPLAYER && appState.currentPlayerIndex === 1 && appState.currentScreen === Screen.GAMEPLAY && appState.quizActive && !appState.currentProblem && !gameSettings.manualMode) {
      nextQuizProblem(); 
    }
    // Auto-load first problem in manual mode
    if (
      gameSettings.manualMode &&
      !gameSettings.isLearningMode &&
      appState.currentScreen === Screen.GAMEPLAY &&
      appState.quizActive &&
      !appState.currentProblem
    ) {
      nextProblem();
    }
  }, [
    appState.quizActive, 
    appState.currentProblem, 
    appState.currentPlayerIndex, 
    appState.currentScreen,
    gameSettings.playerMode, 
    gameSettings.isLearningMode, 
    gameSettings.manualMode,
    nextQuizProblem,
    nextProblem 
  ]);


  const requestHint = useCallback(() => { 
    if (gameSettings.isLearningMode || !currentProblem || appState.currentHints.length === 0 || (!quizActive && !gameSettings.manualMode) ) return;

    const newHintIndex = (appState.currentHintIndex + 1);
    if (newHintIndex >= appState.currentHints.length) {
        showFeedback(CONFIG.UI_TEXTS.noMoreHints, 'info', 3000);
        return;
    }
    const hint = appState.currentHints[newHintIndex];
    setAppState(prev => ({ ...prev, currentHintIndex: newHintIndex }));
    showFeedback(`💡 Clue: ${hint}`, 'info', 4000);
    readTextAloud(`Hint: ${hint}`);
    setMrMikeAnimState(MrMikeState.THINKING);
  }, [gameSettings.isLearningMode, currentProblem, appState.currentHints, appState.currentHintIndex, quizActive, showFeedback, readTextAloud, setMrMikeAnimState, gameSettings.manualMode]);

  const resetGame = useCallback(() => {
    if (timerId) clearInterval(timerId);
    if (learningModeAutoAdvanceTimerRef.current) {
        clearTimeout(learningModeAutoAdvanceTimerRef.current);
        learningModeAutoAdvanceTimerRef.current = null;
    }
    setAppState({ 
      ...appState, 
      currentScreen: Screen.WELCOME,
      currentPlayerIndex: 0,
      player1Stats: initialPlayerStats(gameSettings.player1Name),
      player2Stats: initialPlayerStats(gameSettings.player2Name),
      currentProblem: null,
      timeLeft: 0,
      timerId: null,
      attemptsLeft: CONFIG.MAX_ATTEMPTS,
      mrMikeState: MrMikeState.IDLE,
      feedback: null,
      consecutiveCorrectAnswers: 0,
      isRecognizingSpeech: false, 
      currentHints: [],
      currentHintIndex: -1,
      quizActive: false,
      manualModeInteractionState: CONFIG.MANUAL_MODE_STATES.SHOW_ANSWER,
      learningProgress: null,
      learningModulesQueue: [],
      currentLearningModuleQueueIndex: -1,
      completedLearningModules: [],
    });
    setAmbientEffect('none');
  }, [timerId, gameSettings.player1Name, gameSettings.player2Name, setAmbientEffect, appState]); 

  const getProblemById = (id: string): Problem | undefined => {
    const allProblems = [...player1Stats.history, ...player2Stats.history].map(h => h.problem);
    return allProblems.find(p => p.id === id);
  };

  const handleManualControlAction = useCallback(() => {
    if (gameSettings.isLearningMode || !gameSettings.manualMode) return;
    playSound(CONFIG.SOUND_EFFECTS.buttonClick, 'buttonClick');

    if (!currentProblem) { 
      nextProblem(); 
      return;
    }

    if (manualModeInteractionState === CONFIG.MANUAL_MODE_STATES.SHOW_ANSWER) {
      showFeedback(`The answer is: ${currentProblem.answer}`, "info", CONFIG.FEEDBACK_MESSAGE_DURATION_MS * 2);
      readTextAloud(`The answer is ${currentProblem.answer}`);
      setMrMikeAnimState(MrMikeState.IDLE);
      setAppState(prev => ({ ...prev, manualModeInteractionState: CONFIG.MANUAL_MODE_STATES.LOAD_NEXT_PROBLEM }));
    } else if (manualModeInteractionState === CONFIG.MANUAL_MODE_STATES.LOAD_NEXT_PROBLEM) {
      nextProblem(); 
    }
  }, [
    gameSettings.isLearningMode,
    gameSettings.manualMode,
    currentProblem, 
    manualModeInteractionState,
    showFeedback,
    readTextAloud,
    nextProblem,
    setMrMikeAnimState,
    playSound
  ]);

  const endManualSession = useCallback(() => { 
    if (gameSettings.isLearningMode || !gameSettings.manualMode) return;
    playSound(CONFIG.SOUND_EFFECTS.gameOver, 'gameOver');
    setAppState(prev => ({ ...prev, quizActive: false }));
    setCurrentScreen(Screen.RESULTS);
    setAmbientEffect('none');
  }, [gameSettings.isLearningMode, gameSettings.manualMode, setCurrentScreen, setAmbientEffect, playSound]);

  const handleHeaderIconClick = useCallback(() => {
    playSound(CONFIG.SOUND_EFFECTS.buttonClick, 'buttonClick');
    setAmbientEffect('none');

    setAppState(prev => {
      let nextScreen = prev.currentScreen;
      let updates: Partial<AppState> = {};

      switch (prev.currentScreen) {
        case Screen.GAMEPLAY:
          nextScreen = Screen.SETTINGS;
          if (prev.timerId) clearInterval(prev.timerId);
          updates = {
            quizActive: false,
            timerId: null,
            currentProblem: null,
            timeLeft: 0,
            attemptsLeft: CONFIG.MAX_ATTEMPTS,
            feedback: null,
            consecutiveCorrectAnswers: 0,
            currentHints: [],
            currentHintIndex: -1,
            manualModeInteractionState: CONFIG.MANUAL_MODE_STATES.SHOW_ANSWER,
            learningProgress: null, 
          };
          break;
        case Screen.SETTINGS:
          nextScreen = Screen.WELCOME;
          break;
        case Screen.RESULTS:
          nextScreen = Screen.SETTINGS;
          break;
        case Screen.WELCOME:
        default:
          return prev; 
      }
      return { ...prev, ...updates, currentScreen: nextScreen };
    });
  }, [playSound, setAmbientEffect]);


  const mrMikeAriaLabel = `Mr. Mike is ${mrMikeState.replace('-', ' ')}. ${appState.currentScreen !== Screen.WELCOME ? "Click to go back." : ""}`;

  const contextValue: GameContextType = {
    gameState: appState,
    gameSettings,
    setGameSettings,
    setCurrentScreen,
    startGame,
    submitAnswer,
    requestHint,
    nextProblem,
    endTurn,
    resetGame,
    setMrMikeState: setMrMikeAnimState,
    showFeedback,
    activePlayerStats,
    getProblemById,
    readTextAloud,
    isRecognizingSpeech: appState.isRecognizingSpeech,
    handleManualControlAction,
    endManualSession,
    setAmbientEffect,
    completedLearningModules: appState.completedLearningModules,
  };

  return (
    <GameContext.Provider value={contextValue}>
      <div id="app-wrapper" className="min-h-screen w-full flex flex-col items-center justify-between p-4">
        <header role="banner" className="w-full max-w-3xl text-center mb-4 flex items-center justify-center gap-3">
          <MrMikeCharacter 
            state={mrMikeState} 
            aria-label={mrMikeAriaLabel} 
            onClick={appState.currentScreen !== Screen.WELCOME ? handleHeaderIconClick : undefined}
          />
          <h1 className="text-4xl font-bold">{CONFIG.APP_TITLE}</h1>
        </header>

        <main role="main" id="app-container" className="bg-white/80 backdrop-blur-md shadow-xl rounded-lg p-6 w-full max-w-3xl flex-grow">
          {appState.currentScreen === Screen.WELCOME && <WelcomeScreen />}
          {appState.currentScreen === Screen.SETTINGS && <SettingsScreen />}
          {appState.currentScreen === Screen.GAMEPLAY && <GameplayScreen />}
          {appState.currentScreen === Screen.RESULTS && <ResultsScreen />}
        </main>

        <footer role="contentinfo" className="w-full max-w-3xl text-center mt-4 text-sm">
          <p>&copy; {new Date().getFullYear()} Duc Manh (Mike) Nghiem - S386773</p>
        </footer>
      </div>
    </GameContext.Provider>
  );
};

export default App;
