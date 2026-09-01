import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';

interface IndustryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  industries: string[];
  placeholder?: string;
  required?: boolean;
}

export function IndustryCombobox({
  value,
  onChange,
  industries,
  placeholder = 'Select or type industry...',
  required = false,
}: IndustryComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update local input when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter industries based on input
  const filteredIndustries = industries.filter(industry =>
    industry.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelectIndustry = (industry: string) => {
    setInputValue(industry);
    onChange(industry);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Close dropdown when clicking outside
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        setIsOpen(false);
      }
    }, 200);
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
      <div className="dropdown-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          required={required}
          className="dropdown-input"
          autoComplete="off"
        />
        <span className="dropdown-arrow">{Icons.chevronDown}</span>
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          {filteredIndustries.length > 0 ? (
            <div className="dropdown-options">
              {filteredIndustries.map(industry => (
                <div
                  key={industry}
                  className={`dropdown-option ${inputValue === industry ? 'selected' : ''}`}
                  onClick={() => handleSelectIndustry(industry)}
                >
                  {industry}
                </div>
              ))}
            </div>
          ) : inputValue ? (
            <div className="dropdown-option-hint">
              Press Enter to create "{inputValue}"
            </div>
          ) : (
            <div className="dropdown-option-hint">
              No industries found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
