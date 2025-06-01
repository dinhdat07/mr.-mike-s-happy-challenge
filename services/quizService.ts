
import { GameSettings, Problem, ChallengeType, OperationType, LearningModuleQueueItem } from '../types';
import { CONFIG } from '../constants';

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[getRandomInt(0, arr.length - 1)];
}

function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// State for the "robust first 20 questions" logic
let sessionMandatoryProblems: Problem[] | null = null;
let sessionShuffledMandatoryIndices: number[] | null = null;
let sessionNextMandatoryIndexPointer: number = 0;

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function resetMandatoryProblemState(): void {
    sessionMandatoryProblems = null;
    sessionShuffledMandatoryIndices = null;
    sessionNextMandatoryIndexPointer = 0;
}

function initializeMandatoryProblems(settings: GameSettings): void {
    resetMandatoryProblemState(); // Ensure clean state before initializing

    const { challengeType } = settings;
    let relevantChallenge: ChallengeType | null = null;
    let relevantNumericOption: number | null = null;

    // Determine if settings qualify for mandatory problem list
    if (challengeType.length === 1) {
        relevantChallenge = challengeType[0];
        switch (relevantChallenge) {
            case ChallengeType.MULTIPLICATION:
                if (settings.multiplicationTable.length === 1 && typeof settings.multiplicationTable[0] === 'number') {
                    relevantNumericOption = settings.multiplicationTable[0];
                } else relevantChallenge = null;
                break;
            case ChallengeType.DIVISION:
                if (settings.divisionDivisor.length === 1 && typeof settings.divisionDivisor[0] === 'number') {
                    relevantNumericOption = settings.divisionDivisor[0];
                    if (relevantNumericOption === 0) relevantChallenge = null; // Cannot divide by 0
                } else relevantChallenge = null;
                break;
            case ChallengeType.ADDITION:
                 if (settings.additionTable.length === 1 && typeof settings.additionTable[0] === 'number') {
                    relevantNumericOption = settings.additionTable[0];
                } else relevantChallenge = null;
                break;
            case ChallengeType.SUBTRACTION:
                if (settings.subtractionTable.length === 1 && typeof settings.subtractionTable[0] === 'number') {
                    relevantNumericOption = settings.subtractionTable[0];
                } else relevantChallenge = null;
                break;
            case ChallengeType.DOUBLES: // No specific numeric option needed beyond the type itself
            case ChallengeType.HALVES:  // No specific numeric option needed
                break;
            default:
                relevantChallenge = null;
        }
    }

    if (!relevantChallenge) {
        return; // Settings do not qualify for a mandatory list
    }

    const problems: Problem[] = [];
    const LMAX = CONFIG.LEARNING_MODE_STEP_MAX;
    const DH_LMAX = CONFIG.DOUBLES_HALVES_LEARNING_MAX_INPUT;

    // Use a temporary problem ID, final ID generated when problem is served
    const tempId = "mandatory_template";
    const tempEmoji = "❓";

    if (relevantChallenge === ChallengeType.MULTIPLICATION && relevantNumericOption !== null) {
        let factorA = relevantNumericOption;
        for (let factorB = 0; factorB <= LMAX; factorB++) {
            let finalOperand1 = factorA;
            let finalOperand2 = factorB;
            if (Math.random() < 0.5) {
                [finalOperand1, finalOperand2] = [finalOperand2, finalOperand1];
            }
            problems.push({
                id: tempId, operand1: finalOperand1, operand2: finalOperand2, answer: factorA * factorB,
                operation: OperationType.MULTIPLICATION, originalChallengeType: ChallengeType.MULTIPLICATION,
                question: `${finalOperand1} × ${finalOperand2}`, visualEmoji: tempEmoji
            });
        }
    } else if (relevantChallenge === ChallengeType.DIVISION && relevantNumericOption !== null) {
        const divisor = relevantNumericOption;
        for (let result = 0; result <= LMAX; result++) {
            const dividend = result * divisor;
            problems.push({
                id: tempId, operand1: dividend, operand2: divisor, answer: result,
                operation: OperationType.DIVISION, originalChallengeType: ChallengeType.DIVISION,
                question: `${dividend} ÷ ${divisor}`, visualEmoji: tempEmoji
            });
        }
    } else if (relevantChallenge === ChallengeType.ADDITION && relevantNumericOption !== null) {
        let addendA = relevantNumericOption;
        for (let addendB = 0; addendB <= LMAX; addendB++) {
            if (addendA + addendB > CONFIG.MAX_ADDITION_SUM) continue;
            let finalOperand1 = addendA;
            let finalOperand2 = addendB;
            if (Math.random() < 0.5) {
                [finalOperand1, finalOperand2] = [finalOperand2, finalOperand1];
            }
            problems.push({
                id: tempId, operand1: finalOperand1, operand2: finalOperand2, answer: addendA + addendB,
                operation: OperationType.ADDITION, originalChallengeType: ChallengeType.ADDITION,
                question: `${finalOperand1} + ${finalOperand2}`, visualEmoji: tempEmoji
            });
        }
    } else if (relevantChallenge === ChallengeType.SUBTRACTION && relevantNumericOption !== null) {
        const subtrahendFixed = relevantNumericOption;
        for (let result = 0; result <= LMAX; result++) {
            const minuend = result + subtrahendFixed;
            if (minuend > CONFIG.MAX_ADDITION_SUM) continue; // Max sum also applies to minuend for consistency
            problems.push({
                id: tempId, operand1: minuend, operand2: subtrahendFixed, answer: result,
                operation: OperationType.SUBTRACTION, originalChallengeType: ChallengeType.SUBTRACTION,
                question: `${minuend} - ${subtrahendFixed}`, visualEmoji: tempEmoji
            });
        }
    } else if (relevantChallenge === ChallengeType.DOUBLES) {
        for (let num = 0; num <= DH_LMAX; num++) {
            problems.push({
                id: tempId, operand1: num, operand2: 2, answer: num * 2,
                operation: OperationType.MULTIPLICATION, originalChallengeType: ChallengeType.DOUBLES,
                question: `Double of ${num}`, visualEmoji: tempEmoji
            });
        }
    } else if (relevantChallenge === ChallengeType.HALVES) {
        for (let result = 0; result <= DH_LMAX; result++) {
            const numToHalve = result * 2;
            problems.push({
                id: tempId, operand1: numToHalve, operand2: 2, answer: result,
                operation: OperationType.DIVISION, originalChallengeType: ChallengeType.HALVES,
                question: `Half of ${numToHalve}`, visualEmoji: tempEmoji
            });
        }
    }

    if (problems.length > 0) {
        sessionMandatoryProblems = problems;
        sessionShuffledMandatoryIndices = shuffleArray(problems.map((_, i) => i));
    }
}


export const generateProblem = (settings: GameSettings, history: Problem[] = []): Problem => {
  if (history.length === 0) { // First problem of a new game
    initializeMandatoryProblems(settings); // Initialize for current game settings
  }

  // Robust first 20 questions logic
  if (history.length < 20 && sessionMandatoryProblems && sessionShuffledMandatoryIndices &&
      sessionNextMandatoryIndexPointer < sessionShuffledMandatoryIndices.length) {

      const problemIndex = sessionShuffledMandatoryIndices[sessionNextMandatoryIndexPointer];
      const mandatoryProblemTemplate = sessionMandatoryProblems[problemIndex];
      sessionNextMandatoryIndexPointer++;

      return {
          ...mandatoryProblemTemplate,
          id: generateUniqueId(), // Generate unique ID when serving
          visualEmoji: getRandomElement(CONFIG.EMOJI_ARRAY_ITEMS) || '❓'
      };
  }

  // Normal random problem generation if mandatory list exhausted or not applicable, or beyond 20 questions
  let tempOp1: number, tempOp2: number, finalOperand1: number, finalOperand2: number, answer: number;
  let operation: OperationType;
  let question: string;
  let problemId: string;
  let attempts = 0;
  let originalChallengeType: ChallengeType;

  do {
    problemId = generateUniqueId();
    let currentSelectedChallengeType: ChallengeType;

    if (settings.challengeType.length === 0) {
      currentSelectedChallengeType = ChallengeType.MULTIPLICATION; // Fallback
    } else if (settings.challengeType.length === 1) {
      currentSelectedChallengeType = settings.challengeType[0];
    } else {
      currentSelectedChallengeType = getRandomElement(settings.challengeType) || ChallengeType.MULTIPLICATION;
    }
    originalChallengeType = currentSelectedChallengeType;

    if (currentSelectedChallengeType === ChallengeType.MULTIPLICATION) {
      operation = OperationType.MULTIPLICATION;
      const tableSelection = settings.multiplicationTable;
      if (tableSelection.includes('mixed') || tableSelection.length === 0) {
        tempOp1 = getRandomInt(0, CONFIG.MAX_MULTIPLICATION_OPERAND);
      } else {
        tempOp1 = getRandomElement(tableSelection.filter(v => typeof v === 'number') as number[]) ?? getRandomInt(0, CONFIG.MAX_MULTIPLICATION_OPERAND);
      }
      tempOp2 = getRandomInt(0, CONFIG.MAX_MULTIPLICATION_OPERAND);
      answer = tempOp1 * tempOp2;
      finalOperand1 = tempOp1;
      finalOperand2 = tempOp2;
      if (Math.random() < 0.5) {
        [finalOperand1, finalOperand2] = [finalOperand2, finalOperand1];
      }
      question = `${finalOperand1} × ${finalOperand2}`;

    } else if (currentSelectedChallengeType === ChallengeType.DIVISION) {
      operation = OperationType.DIVISION;
      const divisorSelection = settings.divisionDivisor;
      if (divisorSelection.includes('mixed') || divisorSelection.length === 0) {
        tempOp2 = getRandomInt(1, CONFIG.MAX_MULTIPLICATION_OPERAND);
      } else {
        tempOp2 = getRandomElement(divisorSelection.filter(v => typeof v === 'number') as number[]) ?? getRandomInt(1, CONFIG.MAX_MULTIPLICATION_OPERAND);
      }
      if (tempOp2 === 0) tempOp2 = 1;

      answer = getRandomInt(0, CONFIG.MAX_MULTIPLICATION_OPERAND);
      tempOp1 = answer * tempOp2;
      // Ensure tempOp1 (dividend) doesn't become excessively large for division "by mixed"
      if (tempOp1 > 144 && (divisorSelection.includes('mixed') || divisorSelection.length === 0)) {
          tempOp1 = getRandomInt(0,12) * tempOp2; // Keep dividend smaller for mixed
          answer = tempOp1 / tempOp2;
      }
      finalOperand1 = tempOp1; // For division, order is fixed
      finalOperand2 = tempOp2;
      question = `${finalOperand1} ÷ ${finalOperand2}`;

    } else if (currentSelectedChallengeType === ChallengeType.SUBTRACTION) {
      operation = OperationType.SUBTRACTION;
      const subtrahendSelection = settings.subtractionTable;
      if (subtrahendSelection.includes('mixed') || subtrahendSelection.length === 0) {
        tempOp2 = getRandomInt(0, CONFIG.MAX_SUBTRAHEND);
      } else {
        tempOp2 = getRandomElement(subtrahendSelection.filter(v => typeof v === 'number') as number[]) ?? getRandomInt(0, CONFIG.MAX_SUBTRAHEND);
      }

      answer = getRandomInt(0, CONFIG.MAX_SUBTRACTION_ANSWER);
      tempOp1 = answer + tempOp2;
      if (tempOp1 > CONFIG.MAX_ADDITION_SUM) {
          tempOp1 = getRandomInt(tempOp2, CONFIG.MAX_ADDITION_SUM);
          answer = tempOp1 - tempOp2;
          if (answer < 0) {
              answer = 0;
              tempOp1 = tempOp2;
          }
      }
      finalOperand1 = tempOp1; // For subtraction, order is fixed
      finalOperand2 = tempOp2;
      question = `${finalOperand1} - ${finalOperand2}`;

    } else if (currentSelectedChallengeType === ChallengeType.ADDITION) {
      operation = OperationType.ADDITION;
      const addend1Selection = settings.additionTable;
      if (addend1Selection.includes('mixed') || addend1Selection.length === 0) {
        tempOp1 = getRandomInt(0, CONFIG.MAX_ADDITION_OPERAND);
      } else {
        tempOp1 = getRandomElement(addend1Selection.filter(v => typeof v === 'number') as number[]) ?? getRandomInt(0, CONFIG.MAX_ADDITION_OPERAND);
      }

      const maxPossibleOperand2 = CONFIG.MAX_ADDITION_SUM - tempOp1;
      tempOp2 = getRandomInt(0, Math.min(CONFIG.MAX_ADDITION_OPERAND, Math.max(0, maxPossibleOperand2)));

      answer = tempOp1 + tempOp2;
      finalOperand1 = tempOp1;
      finalOperand2 = tempOp2;
      if (Math.random() < 0.5) {
        [finalOperand1, finalOperand2] = [finalOperand2, finalOperand1];
      }
      question = `${finalOperand1} + ${finalOperand2}`;

    } else if (currentSelectedChallengeType === ChallengeType.DOUBLES) {
      operation = OperationType.MULTIPLICATION;
      finalOperand1 = getRandomInt(0, CONFIG.DOUBLES_HALVES_LEARNING_MAX_INPUT); // This is the number being doubled
      finalOperand2 = 2; // Implicit operand
      answer = finalOperand1 * 2;
      question = `Double of ${finalOperand1}`;

    } else { // HALVES (must be the last one, ChallengeType.HALVES)
      operation = OperationType.DIVISION;
      answer = getRandomInt(0, CONFIG.DOUBLES_HALVES_LEARNING_MAX_INPUT);
      finalOperand1 = answer * 2; // This is the number being halved
      finalOperand2 = 2; // Implicit operand
      question = `Half of ${finalOperand1}`;
    }
    attempts++;
  } while (
    (history.length > 0 &&
     history[history.length - 1].operand1 === finalOperand1 &&
     history[history.length - 1].operand2 === finalOperand2 &&
     history[history.length - 1].operation === operation) &&
    attempts < CONFIG.PROBLEM_GENERATION_MAX_REPETITION_ATTEMPTS
  );

  const visualEmoji = CONFIG.EMOJI_ARRAY_ITEMS[getRandomInt(0, CONFIG.EMOJI_ARRAY_ITEMS.length - 1)];

  return { id: problemId, operand1: finalOperand1, operand2: finalOperand2, answer, operation, originalChallengeType, question, visualEmoji };
};

export const evaluateAnswer = (problem: Problem, userAnswer: number): boolean => {
  return problem.answer === userAnswer;
};

// --- Learning Mode Functions ---

export const getLearningModuleDetails = (
  challengeType: ChallengeType,
  specificOption: number | 'mixed'
): { totalSteps: number; label: string } => {
  let totalSteps = CONFIG.LEARNING_MODE_STEP_MAX + 1;
  let label = "";

  switch (challengeType) {
    case ChallengeType.MULTIPLICATION:
      label = `Multiplication: Times Table ${specificOption}`;
      if (specificOption === 'mixed') {
        totalSteps = (CONFIG.LEARNING_MODE_STEP_MAX + 1) * (CONFIG.LEARNING_MODE_STEP_MAX + 1);
        label = "Multiplication: Mixed Tables";
      }
      break;
    case ChallengeType.DIVISION:
      label = `Division: Dividing by ${specificOption}`;
      if (specificOption === 'mixed') {
        totalSteps = (CONFIG.LEARNING_MODE_STEP_MAX + 1) * CONFIG.LEARNING_MODE_STEP_MAX;
        label = "Division: Mixed Divisors";
      } else if (specificOption === 0) {
        totalSteps = 0;
        label = "Division: Invalid (cannot divide by 0)";
      }
      break;
    case ChallengeType.SUBTRACTION:
      label = `Subtraction: Subtracting ${specificOption}`;
      if (specificOption === 'mixed') {
        totalSteps = (CONFIG.LEARNING_MODE_STEP_MAX + 1) * (CONFIG.MAX_SUBTRACTION_ANSWER + 1);
        label = "Subtraction: Mixed Subtraction";
      } else {
        // For a fixed subtrahend, minuend = result + subtrahend.
        // If result goes 0 to LMAX, minuend goes subtrahend to LMAX + subtrahend.
        // Ensure minuend does not exceed MAX_ADDITION_SUM.
        const fixedSubtrahend = specificOption as number;
        let count = 0;
        for(let res = 0; res <= CONFIG.LEARNING_MODE_STEP_MAX; res++){
            if(res + fixedSubtrahend <= CONFIG.MAX_ADDITION_SUM) count++; else break;
        }
        totalSteps = count;
      }
      break;
    case ChallengeType.ADDITION:
      label = `Addition: Adding to ${specificOption}`;
      if (specificOption === 'mixed') {
        totalSteps = (CONFIG.LEARNING_MODE_STEP_MAX + 1) * (CONFIG.LEARNING_MODE_STEP_MAX + 1);
        label = "Addition: Mixed Addition";
      } else {
        // For a fixed addend1, addend2 goes 0 to LMAX.
        // Ensure sum does not exceed MAX_ADDITION_SUM.
        const fixedAddend = specificOption as number;
        let count = 0;
        for(let add2 = 0; add2 <= CONFIG.LEARNING_MODE_STEP_MAX; add2++){
            if(fixedAddend + add2 <= CONFIG.MAX_ADDITION_SUM) count++; else break;
        }
        totalSteps = count;
      }
      break;
    case ChallengeType.DOUBLES:
      totalSteps = CONFIG.DOUBLES_HALVES_LEARNING_MAX_INPUT + 1;
      label = "Doubles up to " + (CONFIG.DOUBLES_HALVES_LEARNING_MAX_INPUT * 2);
      break;
    case ChallengeType.HALVES:
      totalSteps = CONFIG.DOUBLES_HALVES_LEARNING_MAX_INPUT + 1;
      label = "Halves up to " + (CONFIG.DOUBLES_HALVES_LEARNING_MAX_INPUT * 2);
      break;
    default:
      totalSteps = 0;
      label = "Unknown Module";
  }
  return { totalSteps, label };
};

export const generateProblemForLearningStep = (
  challengeType: ChallengeType,
  specificOption: number | 'mixed',
  stepNumber: number
): { problem: Problem; tip: string | null } => {
  let tempOp1 = 0, tempOp2 = 0, finalOperand1 = 0, finalOperand2 = 0, answer = 0;
  let operation: OperationType = OperationType.ADDITION;
  let question = "";
  const problemId = `learn-${challengeType}-${specificOption}-${stepNumber}`; // Deterministic ID
  const LMAX = CONFIG.LEARNING_MODE_STEP_MAX;
  const DH_LMAX = CONFIG.DOUBLES_HALVES_LEARNING_MAX_INPUT;
  const originalChallengeType = challengeType;

  switch (challengeType) {
    case ChallengeType.MULTIPLICATION:
      operation = OperationType.MULTIPLICATION;
      if (specificOption === 'mixed') {
        tempOp1 = Math.floor(stepNumber / (LMAX + 1));
        tempOp2 = stepNumber % (LMAX + 1);
      } else {
        tempOp1 = specificOption as number;
        tempOp2 = stepNumber;
      }
      answer = tempOp1 * tempOp2;
      finalOperand1 = tempOp1;
      finalOperand2 = tempOp2;
      if (Math.random() < 0.5) {
        [finalOperand1, finalOperand2] = [finalOperand2, finalOperand1];
      }
      question = `${finalOperand1} × ${finalOperand2}`;
      break;

    case ChallengeType.DIVISION:
      operation = OperationType.DIVISION;
      if (specificOption === 'mixed') {
        // Iterate through divisors 1-12 first, then results 0-12 for each divisor
        const numDivisorsToCycle = LMAX; // 1 to 12
        tempOp2 = (stepNumber % numDivisorsToCycle) + 1; // Divisor from 1 to 12
        answer = Math.floor(stepNumber / numDivisorsToCycle); // Result from 0 up to LMAX
        if (answer > LMAX) { // Cap result if stepNumber is too large
            answer = LMAX;
            // Recalculate tempOp2 to ensure it's valid if answer was capped
            tempOp2 = ( (stepNumber - (LMAX * numDivisorsToCycle) ) % numDivisorsToCycle) +1;
             if(tempOp2 > LMAX) tempOp2 = LMAX; // ensure valid divisor
        }

      } else {
        tempOp2 = specificOption as number;
        if (tempOp2 === 0) tempOp2 = 1; // Avoid division by zero
        answer = stepNumber;
      }
      tempOp1 = answer * tempOp2;
      finalOperand1 = tempOp1; // Order is fixed for division display
      finalOperand2 = tempOp2;
      question = `${finalOperand1} ÷ ${finalOperand2}`;
      break;

    case ChallengeType.SUBTRACTION:
      operation = OperationType.SUBTRACTION;
      if (specificOption === 'mixed') {
         // Cycle through results (0-LMAX) for each subtrahend (0-LMAX)
        const numSubtrahendsToCycle = CONFIG.MAX_SUBTRAHEND +1; // 0 to MAX_SUBTRAHEND
        tempOp2 = stepNumber % numSubtrahendsToCycle; // Subtrahend
        answer = Math.floor(stepNumber / numSubtrahendsToCycle); // Result
        if (answer > CONFIG.MAX_SUBTRACTION_ANSWER) answer = CONFIG.MAX_SUBTRACTION_ANSWER;
      } else {
        tempOp2 = specificOption as number;
        answer = stepNumber;
      }
      tempOp1 = answer + tempOp2;
      // Ensure minuend and answer adhere to overall limits for this step
      if (tempOp1 > CONFIG.MAX_ADDITION_SUM) {
          tempOp1 = CONFIG.MAX_ADDITION_SUM;
          answer = tempOp1 - tempOp2;
          if (answer < 0) { answer = 0; tempOp1 = tempOp2; }
      }
      if (answer < 0) { // Recalculate if answer became negative
          answer = 0;
          tempOp1 = tempOp2;
      }
      finalOperand1 = tempOp1; // Order is fixed for subtraction display
      finalOperand2 = tempOp2;
      question = `${finalOperand1} - ${finalOperand2}`;
      break;

    case ChallengeType.ADDITION:
      operation = OperationType.ADDITION;
      if (specificOption === 'mixed') {
        // Cycle through tempOp2 (0-LMAX) for each tempOp1 (0-LMAX)
        tempOp1 = Math.floor(stepNumber / (LMAX + 1));
        tempOp2 = stepNumber % (LMAX + 1);
      } else {
        tempOp1 = specificOption as number;
        tempOp2 = stepNumber;
      }
      answer = tempOp1 + tempOp2;
      if (answer > CONFIG.MAX_ADDITION_SUM) {
          answer = CONFIG.MAX_ADDITION_SUM;
          // Adjust one of the operands if sum is capped
          if (tempOp1 === (specificOption === 'mixed' ? Math.floor(stepNumber / (LMAX + 1)) : specificOption as number) ) { 
             tempOp2 = answer - tempOp1;
             if(tempOp2 < 0) { 
                tempOp1 = Math.floor(CONFIG.MAX_ADDITION_SUM / 2);
                tempOp2 = CONFIG.MAX_ADDITION_SUM - tempOp1;
                answer = tempOp1 + tempOp2;
             }
          } else { 
             tempOp1 = answer - tempOp2;
              if(tempOp1 < 0) {
                tempOp2 = Math.floor(CONFIG.MAX_ADDITION_SUM / 2);
                tempOp1 = CONFIG.MAX_ADDITION_SUM - tempOp2;
                answer = tempOp1 + tempOp2;
              }
          }
      }
      finalOperand1 = tempOp1;
      finalOperand2 = tempOp2;
      if (Math.random() < 0.5) {
        [finalOperand1, finalOperand2] = [finalOperand2, finalOperand1];
      }
      question = `${finalOperand1} + ${finalOperand2}`;
      break;

    case ChallengeType.DOUBLES:
      operation = OperationType.MULTIPLICATION;
      finalOperand1 = stepNumber; // This is the number being doubled
      finalOperand2 = 2; // Implicit operand for display/logic if needed, but question is specific
      answer = finalOperand1 * 2;
      question = `Double of ${finalOperand1}`;
      break;

    case ChallengeType.HALVES:
      operation = OperationType.DIVISION;
      answer = stepNumber;
      finalOperand1 = answer * 2; // This is the number being halved
      finalOperand2 = 2; // Implicit operand
      question = `Half of ${finalOperand1}`;
      break;
  }

  const visualEmoji = CONFIG.EMOJI_ARRAY_ITEMS[getRandomInt(0, CONFIG.EMOJI_ARRAY_ITEMS.length - 1)];
  const problem: Problem = { id: problemId, operand1: finalOperand1, operand2: finalOperand2, answer, operation, originalChallengeType, question, visualEmoji };
  const tip = getTipForProblem(problem, specificOption === 'mixed' && stepNumber < 3);

  return { problem, tip };
};


export const getTipForProblem = (problem: Problem, isFirstFewMixedSteps: boolean = false): string | null => {
  const { operation, operand1, operand2, originalChallengeType } = problem;

  if (originalChallengeType === ChallengeType.DOUBLES || originalChallengeType === ChallengeType.HALVES) {
    const tipsForChallengeType = CONFIG.LEARNING_TIPS[originalChallengeType];
    if (tipsForChallengeType) {
      const defaultTip = tipsForChallengeType.DEFAULT;
      return typeof defaultTip === 'function' ? defaultTip(operand1, operand2) : defaultTip || null;
    }
  }

  const tipsForOperation = CONFIG.LEARNING_TIPS[operation];

  if (isFirstFewMixedSteps && operation !== OperationType.DIVISION && originalChallengeType !== ChallengeType.DOUBLES && originalChallengeType !== ChallengeType.HALVES) {
     return CONFIG.LEARNING_TIPS.GENERAL?.MIXED_INTRO || null;
  }
  if (!tipsForOperation) return null;

  // For multiplication and addition, we use the actual operands from the problem for tips,
  // as their order might have been swapped for the question.
  const actualOp1 = problem.operand1;
  const actualOp2 = problem.operand2;


  if ((operation === OperationType.MULTIPLICATION || operation === OperationType.ADDITION) && (actualOp1 === 0 || actualOp2 === 0)) {
    const key = operation === OperationType.MULTIPLICATION ? 'BY_ZERO' : 'WITH_ZERO';
    if (tipsForOperation[key] && typeof tipsForOperation[key] === 'function') {
      return (tipsForOperation[key] as Function)(actualOp1, actualOp2);
    }
  }
  if (operation === OperationType.MULTIPLICATION) {
    if (actualOp1 === 1 || actualOp2 === 1) return (tipsForOperation.BY_ONE as Function)(actualOp1, actualOp2);
    if (actualOp1 === 2 || actualOp2 === 2) return (tipsForOperation.BY_TWO as Function)(actualOp1, actualOp2);
    if (actualOp1 === 10 || actualOp2 === 10) return (tipsForOperation.BY_TEN as Function)(actualOp1, actualOp2);
    if (actualOp1 !== actualOp2 && actualOp1 > 1 && actualOp2 > 1 && tipsForOperation.COMMUTATIVE) return (tipsForOperation.COMMUTATIVE as Function)(actualOp1, actualOp2);
  }
  if (operation === OperationType.DIVISION) { // For division, operand1 and operand2 retain their meaning (dividend, divisor)
    if (operand1 === 0 && operand2 !== 0) return (tipsForOperation.DIVIDING_ZERO as Function)(operand1, operand2);
    if (operand2 === 1) return (tipsForOperation.BY_ONE as Function)(operand1, operand2);
    if (operand1 !== 0 && operand1 === operand2) return (tipsForOperation.SELF_DIVISION as Function)(operand1, operand2);
    if (tipsForOperation.RELATE_TO_MULTIPLICATION) return (tipsForOperation.RELATE_TO_MULTIPLICATION as Function)(operand1, operand2);
  }
  if (operation === OperationType.ADDITION) {
     if (actualOp1 !== actualOp2 && tipsForOperation.COMMUTATIVE) return (tipsForOperation.COMMUTATIVE as Function)(actualOp1, actualOp2);
     if (Math.min(actualOp1, actualOp2) > 0 && Math.min(actualOp1, actualOp2) <= 4 && tipsForOperation.COUNT_ON) return (tipsForOperation.COUNT_ON as Function)(actualOp1, actualOp2);
  }
  if (operation === OperationType.SUBTRACTION) { // For subtraction, operand1 and operand2 retain their meaning (minuend, subtrahend)
    if (operand2 === 0) return (tipsForOperation.WITH_ZERO as Function)(operand1, operand2);
    if (operand1 === operand2) return (tipsForOperation.SUBTRACTING_SELF as Function)(operand1, operand2);
    if (operand2 > 0 && operand2 <= 4 && tipsForOperation.COUNT_BACK) return (tipsForOperation.COUNT_BACK as Function)(operand1, operand2);
    if (tipsForOperation.RELATE_TO_ADDITION) return (tipsForOperation.RELATE_TO_ADDITION as Function)(operand1, operand2);
  }

  const defaultTip = tipsForOperation.DEFAULT;
  // Use actualOp1 and actualOp2 for default tips if they are multiplication/addition
  if (operation === OperationType.MULTIPLICATION || operation === OperationType.ADDITION) {
    return typeof defaultTip === 'function' ? defaultTip(actualOp1, actualOp2) : defaultTip || null;
  }
  return typeof defaultTip === 'function' ? defaultTip(operand1, operand2) : defaultTip || null;
};
