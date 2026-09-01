// Public landing page

export default function HomePage() {
    return (
        <div className="home-container">
            <main className="home">
                {/* Three cards dealing into a fan — the company makes card
                    games, so the visual is the product, not decoration */}
                <div className="deck" aria-hidden="true">
                    <span className="deck-card deck-card-1" />
                    <span className="deck-card deck-card-2" />
                    <span className="deck-card deck-card-3" />
                </div>

                <h1 className="home-title">Superboar</h1>
                <p className="home-tagline">Tabletop games, made with care.</p>

                <div className="home-rule" aria-hidden="true" />

                <p className="home-note">
                    Our first game is in production. There will be more to show
                    here once it&rsquo;s ready.
                </p>
            </main>
        </div>
    );
}
