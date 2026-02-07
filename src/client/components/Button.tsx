// Reusable button component with variant styling (primary, secondary, danger, lock)

import React, { ButtonHTMLAttributes } from 'react';
import '../styles/button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'lock';
    children: React.ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
    const buttonClass = `btn btn-${variant} ${className}`.trim();

    return (
        <button
            className={buttonClass}
            {...props}
        >
            {children}
        </button>
    );
}
