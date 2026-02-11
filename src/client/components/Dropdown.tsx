import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';

interface DropdownOption {
  id: number | string;
  name: string;
}

interface DropdownProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: DropdownOption[];
  placeholder?: string;
  required?: boolean;
}

export function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  required = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id.toString() === value.toString());

  const handleSelectOption = (option: DropdownOption) => {
    onChange(option.id);
    setIsOpen(false);
  };

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="dropdown-wrapper">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="dropdown-trigger"
        required={required}
      >
        <span className="dropdown-value">
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <span className="dropdown-arrow">{Icons.chevronDown}</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {options.length > 0 ? (
            <div className="dropdown-options">
              {options.map(option => (
                <div
                  key={option.id}
                  className={`dropdown-option ${selectedOption?.id === option.id ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(option)}
                >
                  {option.name}
                </div>
              ))}
            </div>
          ) : (
            <div className="dropdown-option-hint">No options available</div>
          )}
        </div>
      )}
    </div>
  );
}
