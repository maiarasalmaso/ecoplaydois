import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { GameStateProvider } from '@/context/GameStateContext';
import { AuthProvider } from '@/context/AuthContext';
import { AgeFilterProvider } from '@/context/AgeFilterContext';
import { AudioProvider } from '@/context/AudioContext';
import Layout from '@/components/layout/Layout';
import PrivateRoute from '@/components/ui/PrivateRoute';
import AmbientSoundPlayer from '@/components/AmbientSoundPlayer';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import GamesHub from '@/pages/GamesHub';

// Utility to retry lazy imports if chunk load fails (e.g., after a new deployment)
const lazyRetry = (componentImport) => {
  return lazy(async () => {
    try {
      const component = await componentImport();
      return component;
    } catch (error) {
      // Check for chunk load error pattern
      if (error.message.includes('Failed to fetch dynamically imported module') ||
        error.message.includes('Importing a module script failed')) {
        // Reload page to fetch the new version
        console.warn('Chunk load failed, reloading page to get latest version...', error);
        window.location.reload();
        // Return a temporary placeholder to prevent React crash before reload happens
        return { default: () => <div className="min-h-screen flex items-center justify-center">Atualizando aplicação...</div> };
      }
      throw error;
    }
  });
};

const Home = lazyRetry(() => import('@/pages/Home'));
const Login = lazyRetry(() => import('@/pages/Login'));
const Register = lazyRetry(() => import('@/pages/Register'));
const AdminLogin = lazyRetry(() => import('@/pages/admin/AdminLogin'));
const AdminPanel = lazyRetry(() => import('@/pages/admin/AdminPanel'));
const UsersList = lazyRetry(() => import('@/pages/admin/UsersList'));
const Dashboard = lazyRetry(() => import('@/pages/Dashboard'));
const EcoSudoku = lazyRetry(() => import('@/pages/games/EcoSudoku'));
const EcoQuiz = lazyRetry(() => import('@/pages/games/EcoQuiz'));
const EcoMemory = lazyRetry(() => import('@/pages/games/EcoMemory'));
const EcoSwipe = lazyRetry(() => import('@/pages/games/EcoSwipe'));
const EcoMath = lazyRetry(() => import('@/pages/games/EcoMath'));
const EcoSnake = lazyRetry(() => import('@/pages/games/EcoSnake'));
const EcoPlatformer = lazyRetry(() => import('@/pages/games/EcoPlatformer'));
const EcoPassaRepassa = lazyRetry(() => import('@/pages/games/EcoPassaRepassa'));
const HangmanGame = lazyRetry(() => import('@/pages/games/HangmanGame'));
const EcoGuardian = lazyRetry(() => import('@/pages/games/EcoGuardian'));
const EcoWordSearch = lazyRetry(() => import('@/pages/games/EcoWordSearch'));

const Leaderboard = lazyRetry(() => import('@/pages/Leaderboard'));


const EcoBot = lazyRetry(() => import('@/pages/games/EcoBot'));
const About = lazyRetry(() => import('@/pages/About'));
const Privacy = lazyRetry(() => import('@/pages/Privacy'));
const LightDemo = lazyRetry(() => import('@/pages/LightDemo'));
const SaibaMais = lazyRetry(() => import('@/pages/SaibaMais'));
const Feedback = lazyRetry(() => import('@/pages/Feedback'));
const Setup = lazyRetry(() => import('@/pages/Setup'));
const NotFound = lazyRetry(() => import('@/pages/NotFound'));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-theme-bg-primary">
    <div className="w-12 h-12 border-4 border-eco-green border-t-transparent rounded-full animate-spin"></div>
  </div>
);

import { initAudio } from '@/utils/audioManager';

function App() {
  useEffect(() => {
    initAudio();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <GameStateProvider>
          <AgeFilterProvider>
            <AnimatedBackground />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/admin/painel" element={<AdminPanel />} />

                <Route
                  element={
                    <Layout>
                      <Outlet />
                    </Layout>
                  }
                >
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/admin" element={<AdminLogin />} />
                  <Route path="/admin/users" element={<UsersList />} />
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/saiba-mais" element={<SaibaMais />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/light-demo" element={<LightDemo />} />
                  <Route path="/avaliacao" element={<Feedback />} />
                  <Route path="/setup" element={<Setup />} />

                  <Route element={<PrivateRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/games" element={<GamesHub />} />
                    <Route path="/games/sudoku" element={<EcoSudoku />} />
                    <Route path="/games/quiz" element={<EcoQuiz />} />
                    <Route path="/games/memory" element={<EcoMemory />} />
                    <Route path="/games/eco-swipe" element={<EcoSwipe />} />
                    <Route path="/games/eco-math" element={<EcoMath />} />
                    <Route path="/games/eco-snake" element={<EcoSnake />} />
                    <Route path="/games/eco-passa-repassa" element={<EcoPassaRepassa />} />
                    <Route path="/games/eco-platformer" element={<EcoPlatformer />} />
                    <Route path="/games/passa-repassa" element={<EcoPassaRepassa />} />
                    <Route path="/games/hangman" element={<HangmanGame />} />
                    <Route path="/games/eco-guardian" element={<EcoGuardian />} />
                    <Route path="/games/word-search" element={<EcoWordSearch />} />


                  </Route>

                </Route>
                {/* Rota 404 catch-all - deve ser a última rota */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AgeFilterProvider>
        </GameStateProvider>
      </AuthProvider>
    </Router >
  );
}

export default App;
