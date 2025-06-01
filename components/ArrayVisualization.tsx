
import React from 'react';
import { Problem, OperationType, ChallengeType } from '../types';
import { CONFIG } from '../constants';

interface ArrayVisualizationProps {
  problem: Problem;
}

const ArrayVisualization: React.FC<ArrayVisualizationProps> = ({ problem }) => {
  const { operand1, operand2, operation, visualEmoji, answer, originalChallengeType } = problem;
  const itemEmoji = visualEmoji || CONFIG.EMOJI_ARRAY_ITEMS[Math.floor(Math.random() * CONFIG.EMOJI_ARRAY_ITEMS.length)];

  // Standardized small item class
  const itemClass = "array-item text-base sm:text-lg w-5 h-5 sm:w-6 sm:h-6 flex justify-center items-center rounded";

  if (originalChallengeType === ChallengeType.DOUBLES) {
    const numberToDouble = operand1;
    const displayCount = Math.min(numberToDouble, 8); // Max 8 items per group

    if (numberToDouble === 0) {
      return <div id="array-visualization-area" className="p-2 my-2 border rounded-md bg-gray-50 min-h-[60px] flex justify-center items-center"></div>;
    }

    return (
      <div id="array-visualization-area" className="p-2 my-2 border rounded-md text-center bg-gray-50 min-h-[60px]">
        <div className="flex flex-row flex-wrap justify-center items-center gap-x-2 gap-y-1 my-1">
          <div className="flex flex-wrap justify-center gap-1 p-1 border border-dashed border-blue-300 rounded bg-blue-50" aria-label={`First group of ${numberToDouble} ${itemEmoji}s`}>
            {Array.from({ length: displayCount }).map((_, i) => (
              <span key={`d1-${i}`} className={`${itemClass} bg-blue-100`}>{itemEmoji}</span>
            ))}
            {displayCount < numberToDouble && <span className="text-xs self-center mx-1">...</span>}
          </div>
          <span className="text-xl font-bold mx-1 text-gray-600">+</span>
          <div className="flex flex-wrap justify-center gap-1 p-1 border border-dashed border-green-300 rounded bg-green-50" aria-label={`Second group of ${numberToDouble} ${itemEmoji}s`}>
            {Array.from({ length: displayCount }).map((_, i) => (
              <span key={`d2-${i}`} className={`${itemClass} bg-green-100`}>{itemEmoji}</span>
            ))}
            {displayCount < numberToDouble && <span className="text-xs self-center mx-1">...</span>}
          </div>
        </div>
        {displayCount < numberToDouble && <p className="text-xs mt-1">(Showing {displayCount} + {displayCount} from {numberToDouble} + {numberToDouble})</p>}
      </div>
    );
  } else if (originalChallengeType === ChallengeType.HALVES) {
    const numberToHalve = operand1;
    const itemsPerGroupActual = answer;
    const displayTotalItems = Math.min(numberToHalve, 16);
    const displayItemsPerGroup = Math.floor(displayTotalItems / 2);

     if (numberToHalve === 0) {
      return <div id="array-visualization-area" className="p-2 my-2 border rounded-md text-center bg-gray-50 min-h-[60px] flex justify-center items-center"></div>;
    }

    return (
      <div id="array-visualization-area" className="p-2 my-2 border rounded-md text-center bg-gray-50 min-h-[60px]">
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-wrap justify-center gap-1 p-1 border border-gray-300 rounded bg-gray-100 mb-1" aria-label={`Total of ${numberToHalve} ${itemEmoji}s`}>
            {Array.from({ length: displayTotalItems }).map((_, i) => (
              <span key={`h-total-${i}`} className={`${itemClass} bg-yellow-100`}>{itemEmoji}</span>
            ))}
            {displayTotalItems < numberToHalve && <span className="text-xs self-center mx-1">...</span>}
          </div>
          <div className="flex flex-row flex-wrap justify-center gap-x-3 gap-y-1">
            <div className="p-1.5 border border-dashed border-purple-400 rounded bg-purple-50" aria-label={`First half group`}>
              {Array.from({ length: displayItemsPerGroup }).map((_, i) => (
                 <span key={`h1-${i}`} className={`${itemClass} inline-block mx-px`}>{itemEmoji}</span>
              ))}
              {displayItemsPerGroup < itemsPerGroupActual && <span className="text-xs mx-1">...</span>}
            </div>
            <div className="p-1.5 border border-dashed border-teal-400 rounded bg-teal-50" aria-label={`Second half group`}>
              {Array.from({ length: displayItemsPerGroup }).map((_, i) => (
                 <span key={`h2-${i}`} className={`${itemClass} inline-block mx-px`}>{itemEmoji}</span>
              ))}
              {displayItemsPerGroup < itemsPerGroupActual && <span className="text-xs mx-1">...</span>}
            </div>
          </div>
        </div>
         {displayTotalItems < numberToHalve &&
            <p className="text-xs mt-1">(Showing a representation for {displayTotalItems} of {numberToHalve} items)</p>}
      </div>
    );
  } else if (operation === OperationType.MULTIPLICATION) {
    if (operand1 === 0 || operand2 === 0) {
      return <div id="array-visualization-area" className="p-2 my-2 border rounded-md text-center bg-gray-50 min-h-[60px] flex justify-center items-center"></div>;
    }
    // Ensure wider than longer: cols >= rows
    let r = operand1, c = operand2;
    if (r > c) { [r,c] = [c,r]; } // Swap if rows > cols to make it wider

    const rows = Math.min(r, 6); // Max 6 rows
    const cols = Math.min(c, 10); // Max 10 columns
    const displayItemCount = rows * cols;
    const actualItemCount = operand1 * operand2;

    const gridStyle: React.CSSProperties = {
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      maxWidth: `${cols * 30}px` // Adjusted max width based on smaller item size
    };

    return (
      <div id="array-visualization-area" className="p-2 my-2 border rounded-md text-center bg-gray-50 min-h-[60px]">
        <div className="array-inner-grid mx-auto" style={gridStyle}>
          {Array.from({ length: displayItemCount }).map((_, i) => (
            <div key={i} className={`${itemClass} bg-blue-100 aspect-square`}>
              {itemEmoji}
            </div>
          ))}
        </div>
        {displayItemCount < actualItemCount && <p className="text-xs mt-1">(Showing {displayItemCount} of {actualItemCount} {itemEmoji}s)</p>}
      </div>
    );
  } else if (operation === OperationType.DIVISION) {
    const totalItemsForDisplay = Math.min(operand1, 30); // Max 30 items total
    const numGroupsForDisplay = Math.min(operand2, 6); // Max 6 groups

    if (operand1 === 0) {
         return <div id="array-visualization-area" className="p-2 my-2 border rounded-md text-center bg-gray-50 min-h-[60px] flex justify-center items-center"></div>;
    }
    if (operand2 === 0) return <div id="array-visualization-area" className="p-2 my-2 min-h-[60px]"><p className="text-xs">Cannot divide by zero!</p></div>;

    const itemsPerGroupActual = problem.answer;
    const itemsPerGroupForDisplay = numGroupsForDisplay > 0 ? Math.min(itemsPerGroupActual, Math.floor(totalItemsForDisplay / numGroupsForDisplay) || 1) : 0;


    return (
      <div id="array-visualization-area" className="p-2 my-2 border rounded-md text-center bg-gray-50 min-h-[60px]">
        <div className="flex flex-row flex-wrap justify-center gap-1.5">
          {Array.from({ length: numGroupsForDisplay }).map((_, groupIndex) => (
            <div key={groupIndex} className="p-1.5 border border-dashed border-gray-400 rounded bg-green-50">
              <div className="flex flex-wrap gap-0.5 justify-center">
                {Array.from({ length: itemsPerGroupForDisplay }).map((_, itemIndex) => (
                  <span key={itemIndex} className={`${itemClass}`}>{itemEmoji}</span>
                ))}
              </div>
               {itemsPerGroupForDisplay < itemsPerGroupActual && <span className="text-xs block text-center">...</span>}
            </div>
          ))}
        </div>
         {(totalItemsForDisplay < operand1 || numGroupsForDisplay < operand2) &&
            <p className="text-xs mt-1">(Showing representation for ~{totalItemsForDisplay} items in {numGroupsForDisplay} groups)</p>}
      </div>
    );
  } else if (operation === OperationType.SUBTRACTION) {
    const minuendDisplayCount = Math.min(operand1, 24);
    const subtrahendDisplayCount = Math.min(operand2, minuendDisplayCount);
    const remainingDisplayCount = minuendDisplayCount - subtrahendDisplayCount;


    return (
      <div id="array-visualization-area" className="p-2 my-2 border rounded-md text-center bg-gray-50 min-h-[60px]">
        <div className="flex flex-wrap justify-center gap-0.5 my-1">
          {Array.from({ length: minuendDisplayCount }).map((_, i) => (
            <span
              key={i}
              className={`${itemClass} p-0.5 
                         ${i < remainingDisplayCount ? 'bg-yellow-100' : 'bg-red-200 opacity-50 line-through'}`}
              title={i < remainingDisplayCount ? 'Remaining' : 'Taken Away'}
            >
              {itemEmoji}
            </span>
          ))}
        </div>
        {(minuendDisplayCount < operand1) &&
            <p className="text-xs mt-1">(Showing a representation for {minuendDisplayCount} of {operand1} items)</p>}
      </div>
    );
  } else if (operation === OperationType.ADDITION) {
    if (operand1 === 0 && operand2 === 0) {
      return <div id="array-visualization-area" className="p-2 my-2 border rounded-md text-center bg-gray-50 min-h-[60px] flex justify-center items-center"></div>;
    }
    const group1DisplayCount = Math.min(operand1, 10);
    const group2DisplayCount = Math.min(operand2, 10);
    const totalDisplayCount = group1DisplayCount + group2DisplayCount;
    const actualTotal = operand1 + operand2;

    return (
      <div id="array-visualization-area" className="p-2 my-2 border rounded-md text-center bg-gray-50 min-h-[60px]">
        <div className="flex flex-row flex-wrap justify-center items-center gap-x-2 gap-y-1 my-1">
          {operand1 > 0 && (
            <div className="flex flex-wrap justify-center gap-1 p-1 border border-dashed border-blue-300 rounded bg-blue-50">
              {Array.from({ length: group1DisplayCount }).map((_, i) => (
                <span key={`g1-${i}`} className={`${itemClass} bg-blue-100`}>{itemEmoji}</span>
              ))}
               {group1DisplayCount < operand1 && <span className="text-xs self-center mx-1">...</span>}
            </div>
          )}
          {operand1 > 0 && operand2 > 0 && <span className="text-xl font-bold mx-1 text-gray-600">+</span>}
          {operand2 > 0 && (
            <div className="flex flex-wrap justify-center gap-1 p-1 border border-dashed border-green-300 rounded bg-green-50">
              {Array.from({ length: group2DisplayCount }).map((_, i) => (
                <span key={`g2-${i}`} className={`${itemClass} bg-green-100`}>{itemEmoji}</span>
              ))}
              {group2DisplayCount < operand2 && <span className="text-xs self-center mx-1">...</span>}
            </div>
          )}
        </div>
        {(totalDisplayCount < actualTotal && (operand1 > 0 || operand2 > 0) ) &&
            <p className="text-xs mt-1">(Showing representation. Actual total is {actualTotal}.)</p>}
      </div>
    );
  }

  return null;
};

export default ArrayVisualization;
