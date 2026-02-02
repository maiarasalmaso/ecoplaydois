import { Suspense, lazy } from 'react';
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

const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const AdminPanel = lazy(() => import('@/pages/admin/AdminPanel'));
const UsersList = lazy(() => import('@/pages/admin/UsersList'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const EcoSudoku = lazy(() => import('@/pages/games/EcoSudoku'));
const EcoQuiz = lazy(() => import('@/pages/games/EcoQuiz'));
const EcoMemory = lazy(() => import('@/pages/games/EcoMemory'));
const EcoSwipe = lazy(() => import('@/pages/games/EcoSwipe'));
const EcoMath = lazy(() => import('@/pages/games/EcoMath'));
const EcoSnake = lazy(() => import('@/pages/games/EcoSnake'));
const EcoPlatformer = lazy(() => import('@/pages/games/EcoPlatformer'));
const EcoPassaRepassa = lazy(() => import('@/pages/games/EcoPassaRepassa'));
const HangmanGame = lazy(() => import('@/pages/games/HangmanGame'));
const EcoGuardian = lazy(() => import('@/pages/games/EcoGuardian'));
const EcoWordSearch = lazy(() => import('@/pages/games/EcoWordSearch'));

const Leaderboard = lazy(() => import('@/pages/Leaderboard'));


const EcoBot = lazy(() => import('@/pages/games/EcoBot'));
const About = lazy(() => import('@/pages/About'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const LightDemo = lazy(() => import('@/pages/LightDemo'));
const SaibaMais = lazy(() => import('@/pages/SaibaMais'));
const Feedback = lazy(() => import('@/pages/Feedback'));
const Setup = lazy(() => import('@/pages/Setup'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-theme-bg-primary">
    <div className="w-12 h-12 border-4 border-eco-green border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
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
