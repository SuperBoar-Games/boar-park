// Home page with theme selector and animated cooking pan

import { ThemeSelector } from '../components/ThemeSelector';

export default function HomePage() {
    return (
        <div className="home-container">
            <div className="home-footer">
                <ThemeSelector />
            </div>

            <header className="home-header">
                <h1 className="home-title">🐗 SUPERBOAR</h1>
            </header>

            <div className="cooking-animation">
                {/* Fire */}
                <div className="fire">
                    <div className="flame flame-1"></div>
                    <div className="flame flame-2"></div>
                    <div className="flame flame-3"></div>
                </div>

                {/* Pan */}
                <div className="pan">
                    <div className="pan-handle"></div>
                </div>

                {/* Vegetables cooking */}
                <div className="pan-content">
                    <div className="vegetable carrot"></div>
                    <div className="vegetable pepper"></div>
                    <div className="vegetable onion"></div>
                    <div className="vegetable pea"></div>
                </div>

                {/* Steam */}
                <div className="steam steam-1"></div>
                <div className="steam steam-2"></div>
                <div className="steam steam-3"></div>
            </div>

        </div>
    );
}
