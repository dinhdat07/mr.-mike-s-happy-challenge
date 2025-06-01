
import React from 'react';
import { MrMikeState } from '../types';

interface MrMikeCharacterProps {
  state: MrMikeState;
  'aria-label': string;
  onClick?: () => void; // Optional onClick handler
}

const MrMikeCharacter: React.FC<MrMikeCharacterProps> = ({ state, 'aria-label': ariaLabel, onClick }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div 
      id="mr-mike-character" 
      className={`relative ${state} ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-[var(--primary-bg)] rounded-full' : ''}`}
      role={onClick ? "button" : "img"}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
    >
      {/* Sun body style is in global CSS via #mr-mike-character */}
      <div className="mr-mike-face"> {/* Classes also controlled by global CSS for scaling */}
        <div className="mr-mike-eyes-container">
          <div className="mr-mike-eye"></div>
          <div className="mr-mike-eye"></div>
        </div>
        <div className="mr-mike-mouth">
          {/* Mouth styling and animation controlled by parent's state class */}
        </div>
      </div>
    </div>
  );
};

export default MrMikeCharacter;
