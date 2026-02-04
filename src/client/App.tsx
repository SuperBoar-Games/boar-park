import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import PlayCardsPage from './pages/games/PlayCardsPage';
import TalkiesGamePage from './pages/admin/talkies/TalkiesGamePage';
import HeroDetailsPage from './pages/admin/talkies/HeroDetailsPage';
import MovieDetailsPage from './pages/admin/talkies/MovieDetailsPage';

function App() {
    return (
        <ThemeProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/games/talkies" element={<TalkiesGamePage />} />
                    <Route path="/admin/games/talkies/hero/:heroId" element={<HeroDetailsPage />} />
                    <Route path="/admin/games/talkies/movie/:movieId" element={<MovieDetailsPage />} />
                    <Route path="/games/play-cards" element={<PlayCardsPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
