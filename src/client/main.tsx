// Client entry point - renders React app to DOM root element

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

// In dev, tear down any service worker left over from a prod build. Its
// cache-first handler serves stale JS/CSS over Vite, so edits don't refresh.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) reg.unregister();
    });
    if (window.caches) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
}

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
