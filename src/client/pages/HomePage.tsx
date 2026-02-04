import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeSelector } from '../components/ThemeSelector';

export default function HomePage() {
    return (
        <div className="container">
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: `1px solid var(--ctp-surface1)`
            }}>
                <h1 style={{ color: 'var(--ctp-primary)', fontSize: '2rem' }}>
                    🐗 Boar Park
                </h1>
                <ThemeSelector />
            </header>

            <main>
                <h2 style={{ marginBottom: '1rem' }}>Welcome to Boar Park</h2>
                <p style={{ marginBottom: '2rem', color: 'var(--ctp-subtext0)' }}>
                    A React-powered game platform
                </p>

                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    <Link
                        to="/games/play-cards"
                        style={{
                            padding: '1rem',
                            backgroundColor: 'var(--ctp-surface0)',
                            borderRadius: '0.5rem',
                            border: `1px solid var(--ctp-surface1)`,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <h3 style={{ marginBottom: '0.5rem', color: 'var(--ctp-secondary)' }}>
                            🎴 Play Cards
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--ctp-subtext0)' }}>
                            Play the card matching game
                        </p>
                    </Link>

                    <Link
                        to="/admin"
                        style={{
                            padding: '1rem',
                            backgroundColor: 'var(--ctp-surface0)',
                            borderRadius: '0.5rem',
                            border: `1px solid var(--ctp-surface1)`,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <h3 style={{ marginBottom: '0.5rem', color: 'var(--ctp-primary)' }}>
                            ⚙️ Admin Dashboard
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--ctp-subtext0)' }}>
                            Manage games and content
                        </p>
                    </Link>
                </div>
            </main>
        </div>
    );
}
