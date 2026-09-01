import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { useNotificationHistory } from '../../hooks/notifications/useNotificationsQueries';
import { useReadAllMutation } from '../../hooks/notifications/useNotificationsMutations';

function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function NotificationHistoryPage() {
    const navigate = useNavigate();
    const { data: notifications = [], isLoading } = useNotificationHistory();
    const { mutate: markAllRead } = useReadAllMutation();

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const actions = (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            {unreadCount > 0 && (
                <button className="btn btn-secondary" onClick={() => markAllRead()}>
                    Mark all read
                </button>
            )}
            <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
                ← Back
            </button>
        </div>
    );

    return (
        <AdminLayout title={<h1>Notifications</h1>} actions={actions}>
            <div style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
                {isLoading ? (
                    <div className="page-status">Loading notifications…</div>
                ) : notifications.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: 'var(--ctp-subtext0)',
                        padding: '4rem 0',
                        fontSize: '1rem',
                    }}>
                        No notifications yet
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {notifications.map(n => (
                            <div
                                key={n.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.5rem',
                                    background: n.is_read
                                        ? 'var(--ctp-surface0)'
                                        : 'var(--ctp-surface1)',
                                    border: `1px solid ${n.is_read ? 'var(--ctp-surface1)' : 'var(--ctp-overlay0)'}`,
                                    cursor: n.url ? 'pointer' : 'default',
                                    transition: 'opacity 0.2s',
                                    opacity: n.is_read ? 0.7 : 1,
                                }}
                                onClick={() => {
                                    if (n.url) window.location.href = n.url;
                                }}
                            >
                                <span style={{ fontSize: '1rem', marginTop: '0.1rem', flexShrink: 0, width: '1.2rem', textAlign: 'center', color: n.is_read ? 'var(--ctp-subtext0)' : 'var(--ctp-mauve)' }}>
                                    <i className={n.is_read ? 'fa-regular fa-circle-check' : 'fa-solid fa-bell'} />
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontWeight: n.is_read ? 400 : 600,
                                        color: 'var(--ctp-text)',
                                        marginBottom: '0.2rem',
                                    }}>
                                        {n.title}
                                    </div>
                                    {n.body && (
                                        <div style={{ color: 'var(--ctp-subtext1)', fontSize: '0.9rem' }}>
                                            {n.body}
                                        </div>
                                    )}
                                </div>
                                <span style={{
                                    color: 'var(--ctp-subtext0)',
                                    fontSize: '0.8rem',
                                    flexShrink: 0,
                                    marginTop: '0.1rem',
                                }}>
                                    {formatTimeAgo(n.created_at)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
