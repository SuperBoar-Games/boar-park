// Admin page layout with header, user menu, theme selector, and logout functionality

import { ReactNode, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissionCheck } from '../hooks/auth/usePermissions';
import { useTheme } from './ThemeProvider';
import { useNotifications } from '../hooks/notifications/useNotificationsQueries';
import { useReadAllMutation } from '../hooks/notifications/useNotificationsMutations';

interface AdminLayoutProps {
    title: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
}

function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export function AdminLayout({ title, actions, children }: AdminLayoutProps) {
    const { user, logout } = useAuth();
    const { hasUserManagementAccess } = usePermissionCheck();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isBellOpen, setIsBellOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const bellRef = useRef<HTMLDivElement>(null);

    const { data: notifications = [] } = useNotifications();
    const { mutate: markAllRead } = useReadAllMutation();

    const unreadCount = notifications.filter(n => !n.is_read).length;

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
            if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
                setIsBellOpen(false);
            }
        };

        if (isOpen || isBellOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, isBellOpen]);

    return (
        <div className="container">
            <header className="admin-header">
                {title}
                <div className="admin-header-actions">
                    {/* Notification Bell */}
                    {user && (
                        <div className="notif-bell-wrapper" ref={bellRef}>
                            <button
                                className="notif-bell-btn"
                                onClick={() => setIsBellOpen(!isBellOpen)}
                                title="Notifications"
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span className="notif-badge">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {isBellOpen && (
                                <div className="notif-dropdown">
                                    <div className="notif-dropdown-header">
                                        <span className="notif-dropdown-title">Notifications</span>
                                        {unreadCount > 0 && (
                                            <button
                                                className="notif-mark-read-btn"
                                                onClick={() => markAllRead()}
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="notif-list">
                                        {notifications.length === 0 ? (
                                            <div className="notif-empty">No notifications</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                                                    onClick={() => {
                                                        markAllRead();
                                                        if (n.url) navigate(n.url);
                                                        setIsBellOpen(false);
                                                    }}
                                                    style={{ cursor: n.url ? 'pointer' : 'default' }}
                                                >
                                                    <div className="notif-item-title">{n.title}</div>
                                                    <div className="notif-item-body">{n.body}</div>
                                                    <div className="notif-item-time">{formatTimeAgo(n.created_at)}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

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
                                        {hasUserManagementAccess() && (
                                            <button
                                                className="user-menu-item"
                                                onClick={() => {
                                                    navigate('/admin/users');
                                                    setIsOpen(false);
                                                }}
                                            >
                                                User Management
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
