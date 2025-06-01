
// Fix: Removed invalid import placeholder
import React, { useState } from 'react';
import { useGame } from '../App';
import { CONFIG } from '../constants';
// Fix: Import Screen enum to use Screen.SETTINGS
import { PlayerMode, Screen } from '../types';
import { playSound } from '../services/soundService';

const WelcomeScreen: React.FC = () => {
  const { gameSettings, setGameSettings, setCurrentScreen } = useGame(); // Removed startGame, not used here
  const [p1Name, setP1Name] = useState(gameSettings.player1Name);
  const [p2Name, setP2Name] = useState(gameSettings.player2Name);

  const handleStartSetup = () => {
    playSound(CONFIG.SOUND_EFFECTS.buttonClick, 'buttonClick');
    setGameSettings(prev => ({
      ...prev,
      player1Name: p1Name || CONFIG.DEFAULT_PLAYER_NAME_P1,
      player2Name: p2Name || CONFIG.DEFAULT_PLAYER_NAME_P2, // Kept for potential future use of gameSettings.player2Name
    }));
    setCurrentScreen(Screen.SETTINGS);
  };

  const handleP1NameFocus = () => {
    if (p1Name === CONFIG.DEFAULT_PLAYER_NAME_P1) {
      setP1Name('');
    }
  };

  return (
    <section id="welcome-screen" className="active text-center animate-fadeInScreen">
      <h2 className="text-3xl font-bold mb-6">{CONFIG.UI_TEXTS.welcomeMessage}</h2>
      <div id="player-name-inputs" className="space-y-4 mb-8">
        <div>
          <label htmlFor="player1Name" className="block text-lg mb-1">Your Name:</label>
          <input
            type="text"
            id="student-name-p1" // Matching blueprint ID
            name="player1Name"
            value={p1Name}
            onChange={(e) => setP1Name(e.target.value)}
            onFocus={handleP1NameFocus}
            placeholder={CONFIG.DEFAULT_PLAYER_NAME_P1}
            className="w-full max-w-xs p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            aria-label="Your Name Input"
          />
        </div>
        {/* Player 2 input is conditionally rendered based on gameSettings.playerMode,
            but playerMode selection UI is removed. So this will not show by default.
            Logic kept for robustness if playerMode is ever set to MULTIPLAYER programmatically.
        */}
        {gameSettings.playerMode === PlayerMode.MULTIPLAYER && (
          <div className="animate-fadeInBob">
            <label htmlFor="player2Name" className="block text-lg mb-1">Player 2 Name:</label>
            <input
              type="text"
              id="student-name-p2" // Matching blueprint ID
              name="player2Name"
              value={p2Name}
              onChange={(e) => setP2Name(e.target.value)}
              placeholder={CONFIG.DEFAULT_PLAYER_NAME_P2}
              className="w-full max-w-xs p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
              aria-label="Player 2 Name Input"
            />
          </div>
        )}
      </div>
      <button
        id="start-setup-btn"
        onClick={handleStartSetup}
        className="action-button text-xl px-8 py-4 rounded-lg shadow-lg transition-transform transform hover:scale-105"
      >
        Off we go!
      </button>
    </section>
  );
};

export default WelcomeScreen;
