
import React from 'react';
import { useGame } from '../App';
import { CONFIG } from '../constants';
import { PlayerMode, ChallengeType, GameSettings } from '../types';
import ToggleButton from './ToggleButton';
import MultiSelectDropdown from './MultiSelectDropdown';
import { playSound } from '../services/soundService';

const SettingsScreen: React.FC = () => {
  const { gameSettings, setGameSettings, startGame, showFeedback } = useGame();

  const handleSettingChange = <K extends keyof GameSettings,>(key: K, value: GameSettings[K]) => {
    setGameSettings(prev => {
        const newState = { ...prev, [key]: value };
        if (key === 'isLearningMode' && value === true) {
            newState.manualMode = false;
            newState.hideTimer = true;
            newState.playerMode = PlayerMode.SINGLE;
            newState.hints = false; // Hints are generally not applicable/replaced by tips in learning mode
        }
        if (key === 'manualMode' && value === true) {
            newState.isLearningMode = false;
            newState.voiceInput = false;
        }
        return newState;
    });
  };

  const handleChallengeTypeToggle = (toggledType: ChallengeType) => {
    setGameSettings(prev => {
      const currentChallengeTypes = prev.challengeType;
      let newChallengeTypes: ChallengeType[];
      let newMultiplicationTable = [...prev.multiplicationTable];
      let newDivisionDivisor = [...prev.divisionDivisor];
      let newSubtractionTable = [...prev.subtractionTable];
      let newAdditionTable = [...prev.additionTable];

      if (currentChallengeTypes.includes(toggledType)) {
        newChallengeTypes = currentChallengeTypes.filter(ct => ct !== toggledType);
        if (toggledType === ChallengeType.MULTIPLICATION) newMultiplicationTable = [];
        if (toggledType === ChallengeType.DIVISION) newDivisionDivisor = [];
        if (toggledType === ChallengeType.SUBTRACTION) newSubtractionTable = [];
        if (toggledType === ChallengeType.ADDITION) newAdditionTable = [];
      } else {
        newChallengeTypes = [...currentChallengeTypes, toggledType];
        if (toggledType === ChallengeType.MULTIPLICATION && newMultiplicationTable.length === 0) newMultiplicationTable = ['mixed'];
        if (toggledType === ChallengeType.DIVISION && newDivisionDivisor.length === 0) newDivisionDivisor = ['mixed'];
        if (toggledType === ChallengeType.SUBTRACTION && newSubtractionTable.length === 0) newSubtractionTable = ['mixed'];
        if (toggledType === ChallengeType.ADDITION && newAdditionTable.length === 0) newAdditionTable = ['mixed'];
      }

      return {
        ...prev,
        challengeType: newChallengeTypes,
        multiplicationTable: newMultiplicationTable,
        divisionDivisor: newDivisionDivisor,
        subtractionTable: newSubtractionTable,
        additionTable: newAdditionTable,
      };
    });
  };

  const handleDurationChange = (unit: 'minutes' | 'seconds', value: string) => {
    const numValue = parseInt(value, 10);
    if (unit === 'minutes') {
      handleSettingChange('quizDurationMinutes', Math.max(0, Math.min(60, numValue || 0)));
    } else {
      handleSettingChange('quizDurationSeconds', Math.max(0, Math.min(59, numValue || 0)));
    }
  };

  const handleStartQuiz = () => {
    if (gameSettings.challengeType.length === 0) {
        showFeedback("Please select at least one challenge type!", "info");
        return;
    }
    const checkEmptyOptions = (type: ChallengeType, options: (number | 'mixed')[], name: string): boolean => {
        if (gameSettings.challengeType.includes(type) && options.length === 0) {
            showFeedback(`Please select options for ${name} (e.g., 'Mixed ${name}' or specific items).`, "info");
            return false;
        }
        return true;
    };

    if (!checkEmptyOptions(ChallengeType.MULTIPLICATION, gameSettings.multiplicationTable, "Multiplication")) return;
    if (!checkEmptyOptions(ChallengeType.DIVISION, gameSettings.divisionDivisor, "Division")) return;
    if (!checkEmptyOptions(ChallengeType.SUBTRACTION, gameSettings.subtractionTable, "Subtraction")) return;
    if (!checkEmptyOptions(ChallengeType.ADDITION, gameSettings.additionTable, "Addition")) return;

    if (!gameSettings.isLearningMode && !gameSettings.manualMode && gameSettings.quizDurationMinutes === 0 && gameSettings.quizDurationSeconds === 0) {
        showFeedback("Quiz duration must be greater than 0 seconds for timed quiz mode!", "info");
        return;
    }

    playSound(CONFIG.SOUND_EFFECTS.buttonClick, 'buttonClick');
    const finalSettings = { ...gameSettings, playerMode: PlayerMode.SINGLE };
    startGame(finalSettings);
  };

  return (
    <section id="settings-screen" className="active animate-fadeInScreen space-y-3 md:space-y-4">
      <h2 className="text-2xl md:text-3xl font-bold mb-3">{CONFIG.UI_TEXTS.settingsTitle}</h2>

      <div className="setting-group">
        <h3 className="text-lg md:text-xl font-semibold mb-1.5">Mode Select</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
            <ToggleButton
                label="Enable Learning Mode"
                id="learningModeToggle"
                checked={gameSettings.isLearningMode}
                onChange={(c) => handleSettingChange('isLearningMode', c)}
            />
            <ToggleButton
                label="Manual Mode (Teacher)"
                id="manualModeToggle"
                checked={gameSettings.manualMode}
                onChange={(c) => handleSettingChange('manualMode', c)}
                disabled={gameSettings.isLearningMode}
            />
        </div>
         {gameSettings.isLearningMode && <p className="text-xs text-center mt-1 text-purple-600 font-semibold">(Learning Mode is ON: Systematic practice with tips! Player mode is Single.)</p>}
         {gameSettings.manualMode && <p className="text-xs text-center mt-1 text-blue-600 font-semibold">(Manual Mode is ON: Teacher controls problem flow.)</p>}
      </div>

      <div className="setting-group">
        <fieldset>
          <legend className="text-lg md:text-xl font-semibold mb-2">Challenge Type(s)</legend>
          <div id="test-type-selection" className="flex flex-wrap justify-center gap-x-2 gap-y-1">
            {CONFIG.CHALLENGE_TYPE_OPTIONS.map(opt => (
              <label key={opt.value} className="radio-label has-[:checked]:bg-purple-100 has-[:checked]:border-purple-500">
                <input
                  type="checkbox"
                  name="challengeType"
                  value={opt.value}
                  checked={gameSettings.challengeType.includes(opt.value)}
                  onChange={() => handleChallengeTypeToggle(opt.value)}
                  className="form-checkbox text-purple-600 rounded focus:ring-purple-400 mr-1.5"
                />
                <span className="text-sm md:text-base">{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {gameSettings.challengeType.includes(ChallengeType.MULTIPLICATION) && (
        <div className="setting-group animate-fadeInBob" id="multiplication-options-group">
          <h3 id="multiplication-options-label" className="text-base md:text-lg font-semibold mb-1">Multiplication Options</h3>
          <MultiSelectDropdown
            id="multiplication-dropdown"
            ariaLabelledBy="multiplication-options-label"
            options={CONFIG.MULTIPLICATION_OPTIONS}
            selectedValues={gameSettings.multiplicationTable}
            onChange={(values) => handleSettingChange('multiplicationTable', values)}
            baseButtonText="Tables"
          />
        </div>
      )}

      {gameSettings.challengeType.includes(ChallengeType.DIVISION) && (
         <div className="setting-group animate-fadeInBob" id="division-options-group">
          <h3 id="division-options-label" className="text-base md:text-lg font-semibold mb-1">Division Options</h3>
          <MultiSelectDropdown
            id="division-dropdown"
            ariaLabelledBy="division-options-label"
            options={CONFIG.DIVISION_OPTIONS}
            selectedValues={gameSettings.divisionDivisor}
            onChange={(values) => handleSettingChange('divisionDivisor', values)}
            baseButtonText="Divisors"
          />
        </div>
      )}

      {gameSettings.challengeType.includes(ChallengeType.SUBTRACTION) && (
        <div className="setting-group animate-fadeInBob" id="subtraction-options-group">
          <h3 id="subtraction-options-label" className="text-base md:text-lg font-semibold mb-1">Subtraction Options</h3>
           <MultiSelectDropdown
            id="subtraction-dropdown"
            ariaLabelledBy="subtraction-options-label"
            options={CONFIG.SUBTRACTION_OPTIONS}
            selectedValues={gameSettings.subtractionTable}
            onChange={(values) => handleSettingChange('subtractionTable', values)}
            baseButtonText="Numbers"
          />
        </div>
      )}

      {gameSettings.challengeType.includes(ChallengeType.ADDITION) && (
        <div className="setting-group animate-fadeInBob" id="addition-options-group">
          <h3 id="addition-options-label" className="text-base md:text-lg font-semibold mb-1">Addition Options</h3>
          <MultiSelectDropdown
            id="addition-dropdown"
            ariaLabelledBy="addition-options-label"
            options={CONFIG.ADDITION_OPTIONS}
            selectedValues={gameSettings.additionTable}
            onChange={(values) => handleSettingChange('additionTable', values)}
            baseButtonText="Numbers"
          />
        </div>
      )}

      {!gameSettings.isLearningMode && (
        <div className="setting-group">
            <h3 className="text-lg md:text-xl font-semibold mb-1">Quiz Duration</h3>
            <div className="flex justify-center items-center space-x-1">
            <input type="number" id="quiz-duration-minutes-input" aria-label="Quiz duration minutes" value={gameSettings.quizDurationMinutes} onChange={(e) => handleDurationChange('minutes', e.target.value)} min="0" max="60" className="w-14 p-1 border rounded text-center" disabled={gameSettings.manualMode || gameSettings.isLearningMode}/> <span className="time-unit-label text-sm">min</span>
            <input type="number" id="quiz-duration-seconds-input" aria-label="Quiz duration seconds" value={gameSettings.quizDurationSeconds} onChange={(e) => handleDurationChange('seconds', e.target.value)} min="0" max="59" className="w-14 p-1 border rounded text-center" disabled={gameSettings.manualMode || gameSettings.isLearningMode}/> <span className="time-unit-label text-sm">sec</span>
            </div>
            {(gameSettings.manualMode || gameSettings.isLearningMode) && <p className="text-xs text-center mt-0.5">(Timer disabled in Manual/Learning Mode)</p>}
        </div>
      )}

      <div className="setting-group">
        <h3 className="text-lg md:text-xl font-semibold mb-1">Extra Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-1.5 gap-y-0.5">
            <ToggleButton
                label="Read Aloud Questions"
                id="readAloudToggle"
                checked={gameSettings.readAloud}
                onChange={(c) => handleSettingChange('readAloud', c)}
                disabled={true}
            />
            <ToggleButton
                label="Voice Input for Answers"
                id="voiceInputToggle"
                checked={gameSettings.voiceInput}
                onChange={(c) => handleSettingChange('voiceInput', c)}
                disabled={true}
            />
          <ToggleButton label="Show Array Visuals" id="arrayVisualsToggle" checked={gameSettings.arrayVisuals} onChange={(c) => handleSettingChange('arrayVisuals', c)} />
          <ToggleButton label="Hide Timer" id="hideTimerToggle" checked={gameSettings.hideTimer} onChange={(c) => handleSettingChange('hideTimer', c)} disabled={gameSettings.manualMode || gameSettings.isLearningMode} />
          <ToggleButton label="Enable Hints" id="hintsToggle" checked={gameSettings.hints} onChange={(c) => handleSettingChange('hints', c)} disabled={gameSettings.isLearningMode || gameSettings.manualMode} />
        </div>
         {(gameSettings.isLearningMode || gameSettings.manualMode) && <p className="text-xs text-center mt-0.5">(Hints disabled in Learning/Manual Mode; specific tips or teacher guidance applies.)</p>}
      </div>

      <button
        id="start-quiz-btn"
        onClick={handleStartQuiz}
        className="action-button w-full"
      >
        {gameSettings.isLearningMode ? 'Start Learning Session!' : 'Start Quiz Now!'}
      </button>
    </section>
  );
};

export default SettingsScreen;
