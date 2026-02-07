// Admin page layout with header, user menu, theme selector, and logout functionality

import { ReactNode, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from './ThemeProvider';

interface AdminLayoutProps {
    title: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
}

export function AdminLayout({ title, actions, children }: AdminLayoutProps) {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const themes = [
        { value: 'mocha', icon: '🌙', label: 'Mocha' },
        { value: 'macchiato', icon: '🌆', label: 'Macchiato' },
        { value: 'frappe', icon: '❄️', label: 'Frappé' },
        { value: 'latte', icon: '☀️', label: 'Latte' },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const isProfilePage = location.pathname === '/profile';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

    return (
        <div className="container">
            <header className="admin-header">
                {title}
                <div className="admin-header-actions">
                    {/* User Menu Dropdown */}
                    {user && (
                        <div className="user-menu-dropdown-wrapper" ref={menuRef}>
                            <button
                                className="user-menu-trigger"
                                onClick={() => setIsOpen(!isOpen)}
                                title="User menu"
                            >
                                <span className="user-avatar">👤</span>
                                <span className="user-username">{user.username}</span>
                            </button>

                            {isOpen && (
                                <div className="user-menu-dropdown">
                                    <div className="user-menu-info">
                                        <span className="user-menu-name">{user.username}</span>
                                        {user.roles && user.roles.length > 0 && (
                                            <span className="user-menu-roles">
                                                {user.roles.map(r => r.roleName).join(', ')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="user-menu-section">
                                        {!isProfilePage && (
                                            <button
                                                className="user-menu-item"
                                                onClick={() => {
                                                    navigate('/profile');
                                                    setIsOpen(false);
                                                }}
                                            >
                                                Profile
                                            </button>
                                        )}
                                    </div>

                                    <div className="user-menu-section theme-section">
                                        <span className="theme-section-label">Theme</span>
                                        <div className="theme-options">
                                            {themes.map((t) => (
                                                <button
                                                    key={t.value}
                                                    className={`theme-btn ${theme === t.value ? 'active' : ''}`}
                                                    onClick={() => setTheme(t.value as any)}
                                                    title={t.label}
                                                >
                                                    {t.icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="user-menu-section">
                                        <button
                                            className="user-menu-item logout"
                                            onClick={() => {
                                                setIsOpen(false);
                                                handleLogout();
                                            }}
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {actions}
                </div>
            </header>
            {children}
        </div>
    );
}
