// 404 Not Found page with link to home

import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
    return (
        <div className="container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center'
        }}>
            <h1 style={{
                fontSize: '6rem',
                color: 'var(--ctp-primary)',
                marginBottom: '1rem'
            }}>
                404
            </h1>
            <h2 style={{ marginBottom: '1rem' }}>Page Not Found</h2>
            <p style={{
                marginBottom: '2rem',
                color: 'var(--ctp-subtext0)',
                maxWidth: '400px'
            }}>
                The page you're looking for doesn't exist or has been moved.
            </p>
            <Link
                to="/"
                style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--ctp-primary)',
                    color: 'var(--ctp-base)',
                    borderRadius: '0.5rem',
                    fontWeight: 600
                }}
            >
                Go Home
            </Link>
        </div>
    );
}
