// Custom select dropdown component with click-outside detection

import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';

interface SelectOption {
    value: string;
    label: string;
    icon?: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    className?: string;
}

export function Select({ value, onChange, options, className = '' }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
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

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`custom-select ${className}`} ref={selectRef}>
            {/* Was a <div> with ▲/▼ text glyphs — not focusable, not
                keyboard-operable, and a different arrow from the other select
                component. Now a real button using the shared chevron. */}
            <button
                type="button"
                className="custom-select-trigger"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`custom-select-value${selectedOption ? '' : ' is-placeholder'}`}>
                    {selectedOption?.icon || selectedOption?.label || 'Select…'}
                </span>
                <span className={`custom-select-arrow${isOpen ? ' open' : ''}`}>
                    {Icons.chevronDown}
                </span>
            </button>
            {isOpen && (
                <div className="custom-select-dropdown">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`custom-select-option ${option.value === value ? 'selected' : ''}`}
                            onClick={() => handleSelect(option.value)}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
