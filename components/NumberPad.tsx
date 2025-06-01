
import React from 'react';

interface NumberPadProps {
  onInput: (value: string) => void;
}

const buttonsOrder = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    'clear', '0', 'backspace'
];

const StandardNumberPad: React.FC<NumberPadProps> = ({ onInput }) => {
  return (
    <div id="number-pad-area" className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto my-2 sm:my-3">
      {buttonsOrder.map((btn) => (
        <button
          key={btn}
          onClick={() => onInput(btn)}
          className={`num-pad-btn py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-lg text-base md:text-lg font-bold shadow transition-colors flex items-center justify-center
            ${btn === 'clear' ? 'bg-red-400 hover:bg-red-500 text-white' : ''}
            ${btn === 'backspace' ? 'bg-yellow-400 hover:bg-yellow-500 text-white' : ''}
            ${!['clear', 'backspace'].includes(btn) ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : ''}
          `}
        >
          {btn === 'backspace' ? '⌫' : btn.toUpperCase()}
        </button>
      ))}
    </div>
  );
};


export default StandardNumberPad;
