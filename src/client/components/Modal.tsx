// Modal dialog: focus-trapped, ESC to close, scroll-locked body

import React, { useEffect, useRef, useId } from 'react';
import { Icons } from './Icons';
import '../styles/modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    /** Optional one-line explanation under the title */
    description?: string;
    children: React.ReactNode;
    maxWidth?: string;
}

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    maxWidth = '600px',
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const restoreFocusTo = useRef<HTMLElement | null>(null);
    const titleId = useId();
    const descId = useId();

    // Lock the page behind the dialog
    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Move focus in on open, and put it back where it came from on close —
    // without this, dismissing a dialog dropped focus to the top of the page.
    useEffect(() => {
        if (!isOpen) return;
        restoreFocusTo.current = document.activeElement as HTMLElement | null;

        const first = modalRef.current?.querySelector<HTMLElement>(FOCUSABLE);
        first?.focus();

        return () => {
            restoreFocusTo.current?.focus?.();
        };
    }, [isOpen]);

    // ESC to close, Tab kept inside the dialog
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key !== 'Tab' || !modalRef.current) return;

            const items = Array.from(
                modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
            ).filter(el => el.offsetParent !== null);
            if (items.length === 0) return;

            const first = items[0];
            const last = items[items.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                ref={modalRef}
                className="modal-content"
                style={{ maxWidth }}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descId : undefined}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div className="modal-heading">
                        <h2 id={titleId}>{title}</h2>
                        {description && (
                            <p className="modal-description" id={descId}>{description}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="modal-close"
                        aria-label="Close dialog"
                    >
                        {Icons.x}
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}
