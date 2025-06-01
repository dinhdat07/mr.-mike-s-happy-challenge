
export enum Screen {
  WELCOME = 'welcome',
  SETTINGS = 'settings',
  GAMEPLAY = 'gameplay',
  RESULTS = 'results',
}

export enum PlayerMode {
  SINGLE = 'single',
  MULTIPLAYER = 'multiplayer',
}

export enum ChallengeType {
  MULTIPLICATION = 'multiplication',
  DIVISION = 'division',
  SUBTRACTION = 'subtraction',
  ADDITION = 'addition',
  DOUBLES = 'doubles',
  HALVES = 'halves',
}

export enum OperationType { // For problem generation
  MULTIPLICATION = '*',
  DIVISION = '/',
  SUBTRACTION = '-',
  ADDITION = '+',
}

export enum MrMikeState {
  IDLE = 'idle',
  HAPPY = 'happy',
  THINKING = 'thinking',
  SAD = 'sad',
  CORRECT = 'correct',
  INCORRECT = 'incorrect',
  SUPER_CORRECT = 'super-correct',
  PERFECT_STREAK = 'perfect-streak',
}

export enum ManualModeInteractionState {
  SHOW_ANSWER = 'show_answer',
  LOAD_NEXT_PROBLEM = 'load_next_problem',
}

export interface Problem {
  id: string; // Unique ID for the problem
  question: string; // The formatted question string, e.g., "7 × 5 = ?"
  answer: number; // The numerical correct answer
  operation: OperationType; // The type of operation
  originalChallengeType: ChallengeType; // The originating challenge type for specific logic
  operand1: number; // For multiplication: actualFactor1; For division: dividend; For subtraction: minuend; For addition: addend1; For Doubles: number to double; For Halves: number to halve
  operand2: number; // For multiplication: actualFactor2; For division: divisor; For subtraction: subtrahend; For addition: addend2; For Doubles: 2 (implicit); For Halves: 2 (implicit)
  visualEmoji?: string; // Emoji for array visualization
}

export interface QuizHistoryEntry {
  problem: Problem;
  userAnswer: number | null;
  correct: boolean;
}

export interface PlayerStats {
  name: string;
  score: number;
  history: QuizHistoryEntry[];
}

export interface GameSettings {
  player1Name: string;
  player2Name: string; // Optional, used in multiplayer
  playerMode: PlayerMode;
  challengeType: ChallengeType[];
  multiplicationTable: (number | 'mixed')[];
  divisionDivisor: (number | 'mixed')[];
  subtractionTable: (number | 'mixed')[];
  additionTable: (number | 'mixed')[];
  // No specific options needed for doubles/halves in GameSettings, presence in challengeType is enough
  quizDurationMinutes: number;
  quizDurationSeconds: number;
  readAloud: boolean;
  voiceInput: boolean;
  arrayVisuals: boolean;
  hideTimer: boolean;
  hints: boolean;
  manualMode: boolean;
  isLearningMode: boolean; // Added for Learning Mode
}

export interface SoundFile {
  url: string;
  volume?: number;
}

export type SoundBank = {
  [key: string]: SoundFile | undefined;
  correct?: SoundFile;
  incorrect?: SoundFile;
  levelUp?: SoundFile;
  gameOver?: SoundFile;
  buttonClick?: SoundFile;
  countdown?: SoundFile;
  streak?: SoundFile;
};

// For Learning Mode state
export interface LearningModuleQueueItem {
  challengeType: ChallengeType;
  specificOption: number | 'mixed'; // For doubles/halves, this might be a dummy value if not used
  label: string; // e.g., "Times Table 2", "Division by 'Mixed'", "Doubles to 20"
}

export interface LearningProgress {
  moduleLabel: string;
  currentStepProblem: Problem | null;
  currentStepNumber: number; // 0-indexed
  totalStepsInModule: number;
  currentTip: string | null;
}