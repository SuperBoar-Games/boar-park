// Confirmation dialog, replacing browser confirm()

import React, { useRef, useEffect, useId } from 'react';
import '../styles/modal.css';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDangerous?: boolean; // Red confirm button for destructive actions
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isDangerous = false,
}: ConfirmDialogProps) {
    const cancelRef = useRef<HTMLButtonElement>(null);
    const restoreFocusTo = useRef<HTMLElement | null>(null);
    const titleId = useId();
    const messageId = useId();

    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Focus Cancel, not Confirm — for a destructive dialog the safe option
    // should be the one that takes a stray Enter.
    useEffect(() => {
        if (!isOpen) return;
        restoreFocusTo.current = document.activeElement as HTMLElement | null;
        cancelRef.current?.focus();
        return () => {
            restoreFocusTo.current?.focus?.();
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div
                className="modal-content modal-content-sm"
                style={{ maxWidth: '26rem' }}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={messageId}
                onClick={(e) => e.stopPropagation()}
            >
                {/* No close X: Cancel is right there and ESC works, so a third
                    way out is just more chrome on a two-choice dialog. */}
                <div className="modal-header">
                    <div className="modal-heading">
                        <h2 id={titleId}>{title}</h2>
                    </div>
                </div>
                <div className="modal-body">
                    <p className="modal-message" id={messageId}>{message}</p>
                </div>
                <div className="modal-footer">
                    <button
                        ref={cancelRef}
                        type="button"
                        onClick={onCancel}
                        className="btn btn-secondary"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`btn ${isDangerous ? 'btn-danger' : 'btn-primary'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
