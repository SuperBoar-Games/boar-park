// Lightweight toast notification — replaces alert() for non-blocking error/success messages

import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type?: 'error' | 'success';
    onDismiss: () => void;
    duration?: number; // ms, 0 = no auto-dismiss
}

export function Toast({ message, type = 'error', onDismiss, duration = 4000 }: ToastProps) {
    useEffect(() => {
        if (!duration) return;
        const t = setTimeout(onDismiss, duration);
        return () => clearTimeout(t);
    }, [duration, onDismiss, message]);

    return (
        <div className={`toast toast-${type}`} onClick={onDismiss} title="Click to dismiss">
            <i className={type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check'} />
            <span>{message}</span>
        </div>
    );
}
