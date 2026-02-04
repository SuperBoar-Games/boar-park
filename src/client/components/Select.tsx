import React, { useState, useRef, useEffect } from 'react';

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
            <div
                className="custom-select-trigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="custom-select-value">
                    {selectedOption?.icon || selectedOption?.label || 'Select...'}
                </span>
                <span className="custom-select-arrow">{isOpen ? '▲' : '▼'}</span>
            </div>
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
