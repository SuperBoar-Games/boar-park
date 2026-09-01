// Admin page layout with header, user menu, theme selector, and logout functionality

import { ReactNode, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissionCheck } from '../hooks/auth/usePermissions';
import { useTheme } from './ThemeProvider';
import { useNotifications } from '../hooks/notifications/useNotificationsQueries';
import { useReadAllMutation } from '../hooks/notifications/useNotificationsMutations';

export interface Crumb {
    label: string;
    to: string;
}

interface AdminLayoutProps {
    title: ReactNode;
    /**
     * Ancestors of the current page, root first. The current page is NOT a
     * crumb — the <h1> below already names it. Replaces the old per-page
     * "Back to X" button, which lived in the account cluster on the right and
     * could only climb one level in a four-level tree.
     */
    breadcrumbs?: Crumb[];
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

export function AdminLayout({ title, breadcrumbs, actions, children }: AdminLayoutProps) {
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

    // Real icons, not emoji — emoji render differently per-platform and can't
    // inherit colour, so they never match the rest of the icon set.
    const themes = [
        { value: 'slate-dark', icon: 'fa-solid fa-moon', label: 'Dark' },
        { value: 'slate-light', icon: 'fa-solid fa-sun', label: 'Light' },
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
                <div className="admin-header-titles">
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <nav className="breadcrumbs" aria-label="Breadcrumb">
                            {breadcrumbs.map((crumb, i) => (
                                <span className="breadcrumb-item" key={crumb.to}>
                                    <Link to={crumb.to} className="breadcrumb-link">{crumb.label}</Link>
                                    {i < breadcrumbs.length - 1 && (
                                        <span className="breadcrumb-sep" aria-hidden="true">/</span>
                                    )}
                                </span>
                            ))}
                        </nav>
                    )}
                    {title}
                </div>
                <div className="admin-header-actions">
                    {/* Notification Bell */}
                    {user && (
                        <div className="notif-bell-wrapper" ref={bellRef}>
                            <button
                                className="notif-bell-btn"
                                onClick={() => setIsBellOpen(!isBellOpen)}
                                title="Notifications"
                            >
                                <i className={unreadCount > 0 ? 'fa-solid fa-bell' : 'fa-regular fa-bell'} />
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
                                            <div className="notif-empty">No new notifications</div>
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
                                    <button
                                        className="notif-view-all-btn"
                                        onClick={() => {
                                            navigate('/admin/notifications');
                                            setIsBellOpen(false);
                                        }}
                                    >
                                        View all notifications
                                    </button>
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
                                <span className="user-avatar"><i className="fa-regular fa-circle-user" /></span>
                                <span className="user-username">{user.username}</span>
                            </button>

                            {isOpen && (
                                <div className="user-menu-dropdown" role="menu">
                                    <div className="user-menu-info">
                                        <span className="user-menu-avatar">
                                            <i className="fa-regular fa-circle-user" />
                                        </span>
                                        <span className="user-menu-identity">
                                            <span className="user-menu-name">{user.username}</span>
                                            {user.roles && user.roles.length > 0 && (
                                                <span className="user-menu-roles">
                                                    {user.roles.map(r => r.roleName).join(', ')}
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    <div className="user-menu-section">
                                        {!isProfilePage && (
                                            <button
                                                className="user-menu-item"
                                                role="menuitem"
                                                onClick={() => {
                                                    navigate('/profile');
                                                    setIsOpen(false);
                                                }}
                                            >
                                                <i className="fa-regular fa-user" aria-hidden="true" />
                                                <span>Profile</span>
                                            </button>
                                        )}
                                        {hasUserManagementAccess() && (
                                            <button
                                                className="user-menu-item"
                                                role="menuitem"
                                                onClick={() => {
                                                    navigate('/admin/users');
                                                    setIsOpen(false);
                                                }}
                                            >
                                                <i className="fa-solid fa-users" aria-hidden="true" />
                                                <span>User management</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="user-menu-section theme-section">
                                        <span className="theme-section-label">Theme</span>
                                        <div className="segmented theme-switch" role="group" aria-label="Theme">
                                            {themes.map((t) => (
                                                <button
                                                    key={t.value}
                                                    className={`segmented-option ${theme === t.value ? 'active' : ''}`}
                                                    aria-pressed={theme === t.value}
                                                    onClick={() => setTheme(t.value as any)}
                                                >
                                                    <i className={t.icon} aria-hidden="true" />
                                                    <span>{t.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="user-menu-section">
                                        <button
                                            className="user-menu-item logout"
                                            role="menuitem"
                                            onClick={() => {
                                                setIsOpen(false);
                                                handleLogout();
                                            }}
                                        >
                                            <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />
                                            <span>Log out</span>
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
