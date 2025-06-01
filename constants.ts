
import { GameSettings, PlayerMode, ChallengeType, SoundBank, ManualModeInteractionState, OperationType } from './types';

export const APP_TITLE = "Mr. Mike's Happy Challenge!";
export const DEFAULT_PLAYER_NAME_P1 = "Player 1";
export const DEFAULT_PLAYER_NAME_P2 = "Player 2";
export const LEARNING_MODE_STEP_MAX = 12; // Max step for sequences like 2x0 to 2x12
export const DOUBLES_HALVES_LEARNING_MAX_INPUT = 10; // For "Double of X" or "Half of Y=X", X goes 0-10

export const INITIAL_GAME_SETTINGS: GameSettings = {
  player1Name: DEFAULT_PLAYER_NAME_P1,
  player2Name: DEFAULT_PLAYER_NAME_P2,
  playerMode: PlayerMode.SINGLE, // Default to single player
  challengeType: [],
  multiplicationTable: [],
  divisionDivisor: [],
  subtractionTable: [],
  additionTable: [],
  quizDurationMinutes: 1,
  quizDurationSeconds: 30,
  readAloud: false,
  voiceInput: false,
  arrayVisuals: false,
  hideTimer: false,
  hints: false,
  manualMode: false,
  isLearningMode: false,
};

// PLAYER_MODE_OPTIONS is removed as UI for selection is removed.
// export const PLAYER_MODE_OPTIONS: { value: PlayerMode; label: string }[] = [
//   { value: PlayerMode.SINGLE, label: '1 Player' },
//   { value: PlayerMode.MULTIPLAYER, label: '2 Players' },
// ];

export const CHALLENGE_TYPE_OPTIONS: { value: ChallengeType; label: string }[] = [
  { value: ChallengeType.MULTIPLICATION, label: 'Multiplication (×)' },
  { value: ChallengeType.DIVISION, label: 'Division (÷)' },
  { value: ChallengeType.ADDITION, label: 'Addition (+)' },
  { value: ChallengeType.SUBTRACTION, label: 'Subtraction (-)' },
  { value: ChallengeType.DOUBLES, label: 'Doubles to 20' },
  { value: ChallengeType.HALVES, label: 'Halves to 20' },
];

export const MULTIPLICATION_OPTIONS: { value: number | 'mixed'; label: string }[] = [
  { value: 'mixed', label: 'Mixed Tables (0-12)' },
  ...Array.from({ length: 13 }, (_, i) => ({ value: i, label: `Times ${i}` })), // 0-12
];

export const DIVISION_OPTIONS: { value: number | 'mixed'; label: string }[] = [
  { value: 'mixed', label: 'Mixed Divisors (1-12)' },
  ...Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Divide by ${i + 1}` })), // 1-12
];

export const SUBTRACTION_OPTIONS: { value: number | 'mixed'; label: string }[] = [
  { value: 'mixed', label: 'Mixed Subtraction' }, 
  ...Array.from({ length: 13 }, (_, i) => ({ value: i, label: `Minus ${i}` })), 
];

export const ADDITION_OPTIONS: { value: number | 'mixed'; label: string }[] = [
  { value: 'mixed', label: 'Mixed Addition (0-12)' }, 
  ...Array.from({ length: 13 }, (_, i) => ({ value: i, label: `Plus ${i}` })), 
];

// Doubles and Halves do not have specific sub-options like tables, so no dedicated OPTIONS array here.
// Their selection is handled by their presence in gameSettings.challengeType.

export const MAX_ATTEMPTS = 3;
export const TIMER_INTERVAL_MS = 1000;
export const FEEDBACK_MESSAGE_DURATION_MS = 2500;
export const MR_MIKE_STATE_REVERT_DELAY_MS = 2000;
export const STREAK_THRESHOLD_FOR_PRAISE = 3;
export const CORRECT_ANSWER_NEXT_PROBLEM_DELAY_MS = 300; 
export const LEARNING_MODE_NEXT_PROBLEM_DELAY_MS = 1200; 

export const NUMBER_WORDS_MAP: { [key: string]: number } = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
  'tู้': 2,
  'sex': 6,
};

export const SOUND_EFFECTS: SoundBank = {
    correct: { url: 'correct.wav', volume: 0.5 },
    incorrect: { url: 'incorrect.wav', volume: 0.5 },
    buttonClick: { url: 'click.wav', volume: 0.3 },
    streak: { url: 'streak.wav', volume: 0.6 },
    gameOver: {url: 'gameover.wav', volume: 0.7},
    levelUp: {url: 'levelup.wav', volume: 0.6}
};

export const UI_TEXTS = {
    welcomeMessage: "Enter Your Name!",
    settingsTitle: "Quiz Settings",
    gameplayTitle: (playerName: string) => `${playerName}'s Turn!`,
    resultsTitle: "Quiz Results!",
    feedbackCorrect: "Correct! Well done! ^_^",
    feedbackIncorrect: (answer: number) => `Not quite! The correct answer was ${answer}.`,
    feedbackPartial: "Keep trying! You're close!",
    feedbackInvalidInput: "Hmm, that doesn't look like a number.",
    speechListening: "Listening... 🎤",
    speechError: "Sorry, I didn't catch that. Please try again.",
    timerHidden: "Timer is Hidden",
    arrayZeroMultiply: (op1: number, op2: number, item: string) =>
        op1 === 0 ? `0️⃣ Zero groups of ${op2} ${item}s is 0 ${item}s.` : `0️⃣ ${op1} groups of zero ${item}s is 0 ${item}s.`,
    arrayZeroDivide: (item: string) => `0️⃣ Zero ${item}s divided by anything (except 0) is still zero ${item}s.`,
    arraySubtraction: (op1: number, op2: number, item: string) => `Start with ${op1} ${item}s, take away ${op2} ${item}s...`,
    arrayAddition: (op1: number, op2: number, item: string) => `Combine ${op1} ${item}s and ${op2} ${item}s...`,
    arrayZeroAdd: (otherOperand: number, item: string) => `Combining ${otherOperand} ${item}s and zero ${item}s.`,
    arrayDoubles: (op1: number, item: string) => `Double of ${op1} ${item}s means two groups of ${op1} ${item}s.`,
    arrayHalves: (op1: number, item: string) => `Half of ${op1} ${item}s means splitting ${op1} ${item}s into two equal groups.`,
    hintRequest: "Need a little help?",
    manualModeActive: "Manual Mode: Press Space or Button",
    manualButtonShowAnswer: "Show Answer",
    manualButtonNextProblem: "Next Problem",
    manualSessionEndedMessage: "Manual session completed. Great job!",
    problemGetReady: "Get ready for the next question...",
    voiceInputNotSupported: "Voice input is not supported on this browser.",
    feedbackEmptyAnswer: "Please type an answer first!",
    hintButtonAnother: "Another Hint?",
    noMoreHints: "No more hints for this one, sorry!",
    allReviewCorrect: (playerName: string) => `${playerName}, you got all questions right! Amazing!`,
    reviewIncorrectTitle: "Review Your Incorrect Answers",
    learningModeActive: "Learning Mode Active",
    learningModuleComplete: (moduleLabel: string) => `${moduleLabel} module complete! Great work!`,
    allLearningModulesComplete: "All learning modules complete! You're a star! 🌟",
    learningModeResultsTitle: "Learning Session Summary",
    learningModeResultsMessage: "You've completed the following learning modules:",
};

export const EMOJI_ARRAY_ITEMS = ['🍎', '⭐', '🎈', '🎁', '⚽', '🍕', '🍩', '🚀', '🧩', '🎸'];

export const STRATEGY_HINTS_CONFIG: { [key in ChallengeType]?: string[] } = {
    [ChallengeType.MULTIPLICATION]: [
        "Think of it as repeated addition!",
        "Can you break it down into smaller multiplications you know?",
        "Visualise drawing groups of items!",
        "Double check your times tables for one of the numbers.",
        "If one number is 10, just add a zero!",
        "If one number is 0, the answer is always zero!",
        "If one number is 1, the answer is the other number!",
    ],
    [ChallengeType.DIVISION]: [
        "How many times does the smaller number fit into the bigger one?",
        "Think about the opposite: What number multiplied by the divisor gives the dividend?",
        "Can you share these items out equally into groups?",
        "Remember, dividing by 1 leaves the number unchanged.",
        "If you divide 0 by any number (not zero), the answer is 0."
    ],
    [ChallengeType.SUBTRACTION]: [
        "Think about counting back on a number line.",
        "What number added to the smaller number makes the bigger number?",
        "Imagine you have some items and some are taken away.",
        "If you subtract 0, the number stays the same.",
        "Subtracting a number from itself always equals 0.",
    ],
    [ChallengeType.ADDITION]: [
        "Think about combining two groups of items.",
        "You can count on from the larger number.",
        "Try using a number line to jump forward.",
        "If you add 0, the number stays the same.",
        "Look for pairs that make 10!",
    ],
    [ChallengeType.DOUBLES]: [
        "Think of adding the number to itself!",
        "This is the same as multiplying the number by 2.",
        "Imagine two identical groups of items."
    ],
    [ChallengeType.HALVES]: [
        "Think of sharing the number equally into two groups.",
        "This is the same as dividing the number by 2.",
        "What number, when added to itself, makes this number?"
    ]
};

export const LEARNING_TIPS: { [key in OperationType | ChallengeType]?: { [key: string]: string | ((op1: number, op2: number) => string) } } & { GENERAL?: { [key: string]: string } } = {
  [OperationType.MULTIPLICATION]: {
    BY_ZERO: (op1: number, op2: number) => `Multiplying by zero always results in zero! So, ${op1} × ${op2} = 0.`,
    BY_ONE: (op1: number, op2: number) => `Any number multiplied by 1 is itself. So, ${op1} × ${op2} = ${op1 > op2 ? op1 : op2}.`,
    BY_TWO: (op1: number, op2: number) => {
        const nonTwo = op1 === 2 ? op2 : op1;
        return `Multiplying by 2 is doubling! ${nonTwo} + ${nonTwo} = ${nonTwo * 2}.`;
    },
    BY_TEN: (op1: number, op2: number) => {
        const nonTen = op1 === 10 ? op2 : op1;
        return `To multiply by 10, just add a zero to the end of ${nonTen}! So, ${nonTen} × 10 = ${nonTen * 10}.`;
    },
    COMMUTATIVE: (op1: number, op2: number) => `${op1} × ${op2} is the same as ${op2} × ${op1}. Order doesn't matter in multiplication!`,
    DEFAULT: (op1: number, op2: number) => `Think of ${op1} × ${op2} as ${op1} groups of ${op2} items. You can also use repeated addition: add ${op2} to itself ${op1} times.`
  },
  [OperationType.DIVISION]: {
    DIVIDING_ZERO: (op1: number, op2: number) => `Zero divided by any non-zero number is zero. So, 0 ÷ ${op2} = 0.`,
    BY_ONE: (op1: number, op2: number) => `Dividing by 1 doesn't change the number. So, ${op1} ÷ 1 = ${op1}.`,
    SELF_DIVISION: (op1: number, op2: number) => `Any non-zero number divided by itself is 1. So, ${op1} ÷ ${op1} = 1.`,
    RELATE_TO_MULTIPLICATION: (op1: number, op2: number) => `Think: what number multiplied by ${op2} gives you ${op1}? That's your answer!`,
    DEFAULT: (op1: number, op2: number) => `How many times does ${op2} fit into ${op1}? Imagine sharing ${op1} items equally into ${op2} groups.`
  },
  [OperationType.ADDITION]: {
    WITH_ZERO: (op1: number, op2: number) => `Adding zero doesn't change the number. So, ${op1} + ${op2} = ${op1 === 0 ? op2 : op1}.`,
    COMMUTATIVE: (op1: number, op2: number) => `${op1} + ${op2} is the same as ${op2} + ${op1}. You can add in any order!`,
    COUNT_ON: (op1: number, op2: number) => `You can start with the larger number and count on. If adding ${Math.min(op1,op2)}, count ${Math.min(op1,op2)} steps from ${Math.max(op1,op2)}.`,
    DEFAULT: (op1: number, op2: number) => `Combining ${op1} items and ${op2} items gives you a total. Use fingers or a number line if it helps!`
  },
  [OperationType.SUBTRACTION]: {
    WITH_ZERO: (op1: number, op2: number) => `Subtracting zero doesn't change the number. So, ${op1} - 0 = ${op1}.`,
    SUBTRACTING_SELF: (op1: number, op2: number) => `Subtracting a number from itself is always zero. So, ${op1} - ${op1} = 0.`,
    COUNT_BACK: (op1: number, op2: number) => `Start at ${op1} and count back ${op2} steps on a number line.`,
    RELATE_TO_ADDITION: (op1: number, op2: number) => `Think: what number added to ${op2} makes ${op1}? That's ${op1} - ${op2}.`,
    DEFAULT: (op1: number, op2: number) => `Imagine you have ${op1} items and ${op2} are taken away. How many are left?`
  },
  [ChallengeType.DOUBLES]: {
    DEFAULT: (op1: number, _op2?: number) => `To find the double of ${op1}, you add ${op1} to itself, or multiply ${op1} by 2. So, ${op1} + ${op1} = ${op1 * 2}. Example: Double of 3 is 3 + 3, which equals 6.`,
  },
  [ChallengeType.HALVES]: {
    DEFAULT: (op1: number, _op2?: number) => `To find half of ${op1}, you are looking for a number that, when added to itself, makes ${op1}. This is like dividing ${op1} by 2. So, ${op1} ÷ 2 = ${op1 / 2}. Example: Half of 8 is 4, because 4 + 4 = 8.`,
  },
  GENERAL: {
    WELCOME: "Let's learn step by step! Pay attention to the tips!",
    MIXED_INTRO: "This 'Mixed' module will go through many common facts. Take your time!"
  }
};

export const MANUAL_MODE_STATES = {
  SHOW_ANSWER: ManualModeInteractionState.SHOW_ANSWER,
  LOAD_NEXT_PROBLEM: ManualModeInteractionState.LOAD_NEXT_PROBLEM,
};

export const CONFIG = {
    APP_TITLE,
    DEFAULT_PLAYER_NAME_P1,
    DEFAULT_PLAYER_NAME_P2,
    INITIAL_GAME_SETTINGS,
    // PLAYER_MODE_OPTIONS, // Removed
    CHALLENGE_TYPE_OPTIONS,
    MULTIPLICATION_OPTIONS,
    DIVISION_OPTIONS,
    SUBTRACTION_OPTIONS,
    ADDITION_OPTIONS,
    MAX_ATTEMPTS,
    TIMER_INTERVAL_MS,
    FEEDBACK_MESSAGE_DURATION_MS,
    MR_MIKE_STATE_REVERT_DELAY_MS,
    STREAK_THRESHOLD_FOR_PRAISE,
    CORRECT_ANSWER_NEXT_PROBLEM_DELAY_MS,
    NUMBER_WORDS_MAP,
    SOUND_EFFECTS,
    UI_TEXTS,
    EMOJI_ARRAY_ITEMS,
    STRATEGY_HINTS_CONFIG,
    MANUAL_MODE_STATES,
    MAX_MULTIPLICATION_OPERAND: 12,
    MAX_SUBTRACTION_ANSWER: 12,
    MAX_SUBTRAHEND: 12,
    MAX_ADDITION_OPERAND: 12,
    MAX_ADDITION_SUM: 24,
    PROBLEM_GENERATION_MAX_REPETITION_ATTEMPTS: 10,
    LEARNING_MODE_STEP_MAX,
    DOUBLES_HALVES_LEARNING_MAX_INPUT,
    LEARNING_TIPS,
    LEARNING_MODE_NEXT_PROBLEM_DELAY_MS,
};
