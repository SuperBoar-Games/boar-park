import React, { ReactNode } from 'react';
import { ThemeSelector } from './ThemeSelector';

interface AdminLayoutProps {
    title: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
}

export function AdminLayout({ title, actions, children }: AdminLayoutProps) {
    return (
        <div className="container">
            <header className="admin-header">
                {title}
                <div className="admin-header-actions">
                    <ThemeSelector />
                    {actions}
                </div>
            </header>
            {children}
        </div>
    );
}
