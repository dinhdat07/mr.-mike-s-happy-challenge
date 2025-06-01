import React, { useState, useEffect, useRef, useCallback } from 'react';

interface MultiSelectDropdownProps {
  options: { value: number | 'mixed'; label: string }[];
  selectedValues: (number | 'mixed')[];
  onChange: (newValues: (number | 'mixed')[]) => void;
  ariaLabelledBy?: string;
  id?: string;
  baseButtonText?: string; // E.g., "Tables", "Divisors"
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  ariaLabelledBy,
  id,
  baseButtonText = "Options"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getButtonLabel = useCallback(() => {
    if (selectedValues.length === 0 || (selectedValues.length === 1 && selectedValues[0] === 'mixed')) {
      const mixedOption = options.find(opt => opt.value === 'mixed');
      return mixedOption ? mixedOption.label : `Mixed ${baseButtonText}`;
    }
    if (selectedValues.length === 1) {
      const selectedOption = options.find(opt => opt.value === selectedValues[0]);
      return selectedOption ? selectedOption.label : String(selectedValues[0]);
    }
    if (selectedValues.length <= 3) {
      return selectedValues
        .map(val => options.find(opt => opt.value === val)?.label || String(val))
        .join(', ');
    }
    return `${selectedValues.length} ${baseButtonText} selected`;
  }, [selectedValues, options, baseButtonText]);


  const handleCheckboxChange = (value: number | 'mixed', checked: boolean) => {
    let newSelectedValues: (number | 'mixed')[];

    if (value === 'mixed') {
      if (checked) {
        newSelectedValues = ['mixed'];
      } else {
        // Prevent unchecking "Mixed" if it's the only option left that would make sense
        // This case is tricky because unchecking mixed should allow numbers to be checked.
        // If numbers are already checked, then unchecking mixed is fine.
        // If no numbers are checked, unchecking mixed should ideally not happen or default to first number.
        // For simplicity, if unchecking mixed and no numbers are selected, keep mixed checked.
         const numericSelections = selectedValues.filter(v => typeof v === 'number');
         if (numericSelections.length === 0) {
            newSelectedValues = ['mixed']; // Keep mixed if no numbers are selected
         } else {
            newSelectedValues = numericSelections;
         }
      }
    } else { // A number option was changed
      let currentNumbers = selectedValues.filter(v => typeof v === 'number') as number[];
      if (checked) {
        currentNumbers = [...currentNumbers, value as number];
      } else {
        currentNumbers = currentNumbers.filter(v => v !== value);
      }

      if (currentNumbers.length === 0) {
        newSelectedValues = ['mixed']; // If no numbers left, default to mixed
      } else {
        newSelectedValues = currentNumbers;
      }
    }
    onChange(newSelectedValues);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div id={id} className="multi-select-dropdown relative" ref={dropdownRef}>
      <button
        type="button"
        className="dropdown-button w-full flex justify-between items-center text-left p-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={ariaLabelledBy}
      >
        <span className="truncate">{getButtonLabel()}</span>
        <svg className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {isOpen && (
        <div
          className="dropdown-panel absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
          aria-multiselectable="true"
        >
          {options.map(option => (
            <label
              key={option.value}
              className="dropdown-item flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer"
              role="option"
              aria-selected={selectedValues.includes(option.value)}
            >
              <input
                type="checkbox"
                value={String(option.value)}
                checked={selectedValues.includes(option.value)}
                onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                className="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 select-none">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;