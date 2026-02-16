// Admin dashboard with links to user management and game management sections

import { Link, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { usePermissionCheck } from '../../hooks/auth/usePermissions';
import { Button } from '../../components/Button';
import { Icons } from '../../components/Icons';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { hasTalkiesAccess, hasUserManagementAccess } = usePermissionCheck();

    return (
        <AdminLayout title={<h1>Admin Dashboard</h1>}>
            <main>
                {hasTalkiesAccess() && (
                    <>
                        <h2>Games</h2>
                        <div className="game-cards">
                            <Link
                                to="/admin/games/talkies"
                                className="game-card"
                            >
                                <h3>Talkies</h3>
                                <p>Manage heroes, movies, and cards</p>
                            </Link>
                        </div>
                    </>
                )}

                {!hasTalkiesAccess() && !hasUserManagementAccess() && (
                    <div className="empty-state">
                        <p>You don't have access to any admin features yet.</p>
                        <p>Contact an administrator to get permissions.</p>
                    </div>
                )}
            </main>
        </AdminLayout>
    );
}
