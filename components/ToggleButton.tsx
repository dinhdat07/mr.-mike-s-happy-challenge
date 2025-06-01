
import React from 'react';

interface ToggleButtonProps {
  label: string;
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ label: labelText, id, checked, onChange, disabled = false }) => {
  return (
    <label 
      htmlFor={id} 
      className={`toggle-button-wrapper ${disabled ? 'disabled' : ''}`}
    >
      <span className="toggle-text">{labelText}</span>
      <div className="toggle-switch-visual" aria-hidden="true">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => {
            if (!disabled) {
              onChange(e.target.checked);
            }
          }}
          disabled={disabled}
          // Visually hidden by CSS, but still focusable and interactive
        />
        <span className="slider"></span>
      </div>
    </label>
  );
};

export default ToggleButton;
