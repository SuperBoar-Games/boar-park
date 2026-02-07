// Admin dashboard with links to user management and game management sections

import { Link, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '../../components/Button';
import { Icons } from '../../components/Icons';

export default function AdminDashboard() {
    const navigate = useNavigate();

    return (
        <AdminLayout
            title={<h1>Admin Dashboard</h1>}
            actions={
                <Button variant="secondary" onClick={() => navigate('/')}>
                    {Icons.arrowLeft} <span>Back to Home</span>
                </Button>
            }
        >
            <main>
                <h2>User Management</h2>
                <div className="game-cards">
                    <Link
                        to="/admin/users"
                        className="game-card"
                    >
                        <h3>👥 Users</h3>
                        <p>Manage users, roles, and permissions</p>
                    </Link>
                </div>

                <h2>Games</h2>
                <div className="game-cards">
                    <Link
                        to="/admin/games/talkies"
                        className="game-card"
                    >
                        <h3>🎬 Talkies</h3>
                        <p>Manage heroes, movies, and cards</p>
                    </Link>
                </div>
            </main>
        </AdminLayout>
    );
}
