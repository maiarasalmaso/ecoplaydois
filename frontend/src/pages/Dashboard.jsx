import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGameState } from '../context/GameStateContext';
import { BADGES, getLevel, getNextLevel } from '../utils/gamification';
import { motion } from 'framer-motion';
import { Trophy, Lock, FlaskConical, Award, Shield, Home, Wind, Sun, Sprout, Droplets, TreeDeciduous, Flame, Zap } from 'lucide-react';
import AnimatedBackground from '../components/layout/AnimatedBackground';

const USERS_KEY = 'ecoplay_users_db';
const PROGRESS_PREFIX = 'ecoplay_progress_';

const readJson = (storage, key) => {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const defaultProgress = () => ({
  score: 0,
  badges: [],
  badgeUnlocks: {},
  stats: { xp: 0, logins: 0, streak: 0, timeSpentSeconds: 0 },
  completedLevels: {},
  lastDailyXpDate: null,
  unclaimedRewards: []
});

const readUsers = () => {
  const users = readJson(localStorage, USERS_KEY);
  return Array.isArray(users) ? users : [];
};

const readProgress = (userId) => {
  const key = `${PROGRESS_PREFIX}${userId}`;
  const progress = readJson(localStorage, key);
  if (!progress || typeof progress !== 'object') return defaultProgress();
  const baseline = defaultProgress();
  return { ...baseline, ...progress, stats: { ...baseline.stats, ...(progress.stats || {}) } };
};

const Dashboard = () => {
  const { user } = useAuth();
  const { score, badges, stats } = useGameState();
  
  const currentLevel = getLevel(score);
  const nextLevel = getNextLevel(score);
  
  // Calcular progresso para o próximo nível
  const progressToNext = nextLevel 
    ? ((score - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 
    : 100;

  const topPlayers = useMemo(() => {
    const users = readUsers().filter((u) => u && typeof u === 'object');
    const mapped = users.map((u) => {
      const progress = readProgress(u.id);
      const xp = Number(progress?.score ?? progress?.stats?.xp ?? 0) || 0;
      return { id: u.id, name: u.name || 'Usuário', xp };
    });

    let merged = mapped;
    if (user?.id) {
      const existingIndex = merged.findIndex((p) => p.id === user.id);
      if (existingIndex === -1) {
        merged = [...merged, { id: user.id, name: user.name || 'Você', xp: score }];
      } else {
        merged = merged.map((p) => (p.id === user.id ? { ...p, name: user.name || p.name, xp: score } : p));
      }
    }

    return merged
      .filter((p) => Number.isFinite(Number(p.xp)))
      .sort((a, b) => (b.xp || 0) - (a.xp || 0))
      .slice(0, 3);
  }, [score, user]);

  const MotionDiv = motion.div;
  return (
    <div className="min-h-screen relative overflow-hidden pb-20 bg-slate-900">
      <AnimatedBackground />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        
        {/* Profile Header HUD */}
        <MotionDiv 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700 mb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-eco-green/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

          {/* Avatar Container */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-eco-green to-blue-500 rounded-full blur opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center border-4 border-slate-800 relative z-10 overflow-hidden">
               <img 
                 src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name}`} 
                 alt="Avatar" 
                 className="w-full h-full object-cover"
               />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 p-2 rounded-lg shadow-lg z-20">
               <Shield className="w-6 h-6 text-eco-green" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-4xl font-display font-bold text-white tracking-wide">{user?.name}</h1>
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-700 ${currentLevel.color}`}>
              <Trophy className="w-4 h-4" />
              <span className="font-mono font-bold uppercase tracking-wider text-sm">{currentLevel.title}</span>
            </div>
            
            <div className="mt-6 max-w-lg">
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
                <span>XP Atual: <span className="text-white">{score}</span></span>
                {nextLevel && <span>Próximo Nível: <span className="text-white">{nextLevel.min}</span></span>}
              </div>
              <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden border border-slate-700 p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-gradient-to-r from-eco-green to-teal-400 h-full rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                />
              </div>
            </div>
          </div>

          {/* Stats Box */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 text-center min-w-[120px]">
              <span className="block text-3xl font-display font-bold text-white">{badges ? badges.length : 0}</span>
              <span className="text-xs text-slate-400 font-mono uppercase">Conquistas</span>
            </div>
          </div>
        </MotionDiv>

        <div className="grid md:grid-cols-1 gap-8">

          <section className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-4">
              <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-300" />
                TOP 3 JOGADORES
              </h2>
              <span className="text-xs font-mono uppercase text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                Ranking por XP
              </span>
            </div>

            {topPlayers.length === 0 ? (
              <div className="text-sm text-slate-400">Ainda não há jogadores ranqueados.</div>
            ) : (
              <ol aria-label="Top 3 jogadores" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topPlayers.map((p, index) => {
                  const rank = index + 1;
                  const isMe = user?.id && p.id === user.id;
                  const styles =
                    rank === 1
                      ? 'bg-amber-500/10 border-amber-400/30'
                      : rank === 2
                        ? 'bg-slate-400/10 border-slate-300/30'
                        : 'bg-orange-500/10 border-orange-400/30';

                  const rankText =
                    rank === 1 ? 'text-amber-300' : rank === 2 ? 'text-slate-200' : 'text-orange-300';

                  return (
                    <li
                      key={String(p.id ?? index)}
                      className={`rounded-2xl border ${styles} p-5 bg-slate-900/30 flex items-center gap-4`}
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center border border-slate-700 bg-slate-950/30 font-display font-black ${rankText}`}
                        aria-label={`Posição ${rank}`}
                      >
                        {rank}
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0">
                        <img
                          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${p.name}`}
                          alt={`Avatar de ${p.name}`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="text-white font-bold truncate">{p.name}</div>
                          {isMe ? (
                            <span className="text-[10px] font-mono uppercase bg-eco-green/15 text-eco-green border border-eco-green/25 px-2 py-0.5 rounded-full">
                              Você
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {Intl.NumberFormat('pt-BR').format(Number(p.xp || 0))} XP
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
          
          {/* Base Operations Section - New Feature Preview */}
          <section className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700">
             <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-4">
                <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                  <Home className="w-6 h-6 text-blue-400" />
                  BASE DE OPERAÇÕES
                </h2>
                <span className="text-xs font-mono uppercase text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                  Em Desenvolvimento
                </span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Solar Panels */}
                <div className={`p-6 rounded-2xl border ${score >= 500 ? 'bg-slate-800 border-yellow-500/50' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${score >= 500 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-800 text-slate-600'}`}>
                      <Sun className="w-8 h-8" />
                    </div>
                    {score < 500 && <Lock className="w-4 h-4 text-slate-600" />}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Matriz Solar</h3>
                  <p className="text-xs text-slate-400 mb-4">Gera energia limpa passiva para a base.</p>
                  <div className="text-xs font-mono text-yellow-500">Requer 500 XP</div>
                </div>

                {/* Wind Turbines */}
                <div className={`p-6 rounded-2xl border ${score >= 1500 ? 'bg-slate-800 border-cyan-500/50' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${score >= 1500 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-600'}`}>
                      <Wind className="w-8 h-8" />
                    </div>
                    {score < 1500 && <Lock className="w-4 h-4 text-slate-600" />}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Parque Eólico</h3>
                  <p className="text-xs text-slate-400 mb-4">Aumenta a eficiência das missões.</p>
                  <div className="text-xs font-mono text-cyan-500">Requer 1500 XP</div>
                </div>

                {/* Hydro */}
                <div className={`p-6 rounded-2xl border ${score >= 2200 ? 'bg-slate-800 border-blue-500/50' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${score >= 2200 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-600'}`}>
                      <Droplets className="w-8 h-8" />
                    </div>
                    {score < 2200 && <Lock className="w-4 h-4 text-slate-600" />}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Recursos Hídricos</h3>
                  <p className="text-xs text-slate-400 mb-4">Estabiliza a rede com potência controlável.</p>
                  <div className="text-xs font-mono text-blue-500">Requer 2200 XP</div>
                </div>

                {/* Eco Garden */}
                <div className={`p-6 rounded-2xl border ${score >= 3000 ? 'bg-slate-800 border-green-500/50' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${score >= 3000 ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-600'}`}>
                      <Sprout className="w-8 h-8" />
                    </div>
                    {score < 3000 && <Lock className="w-4 h-4 text-slate-600" />}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Jardim Vertical</h3>
                  <p className="text-xs text-slate-400 mb-4">Melhora a qualidade do ar da base.</p>
                  <div className="text-xs font-mono text-green-500">Requer 3000 XP</div>
                </div>

                {/* Biomass */}
                <div className={`p-6 rounded-2xl border ${score >= 3800 ? 'bg-slate-800 border-emerald-500/50' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${score >= 3800 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                      <TreeDeciduous className="w-8 h-8" />
                    </div>
                    {score < 3800 && <Lock className="w-4 h-4 text-slate-600" />}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Biomassa</h3>
                  <p className="text-xs text-slate-400 mb-4">Transforma resíduos em energia e reduz impactos.</p>
                  <div className="text-xs font-mono text-emerald-500">Requer 3800 XP</div>
                </div>

                {/* Research Lab */}
                <div className={`p-6 rounded-2xl border ${score >= 5000 ? 'bg-slate-800 border-purple-500/50' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${score >= 5000 ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-600'}`}>
                      <FlaskConical className="w-8 h-8" />
                    </div>
                    {score < 5000 && <Lock className="w-4 h-4 text-slate-600" />}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Laboratório Eco</h3>
                  <p className="text-xs text-slate-400 mb-4">Desbloqueia novas tecnologias.</p>
                  <div className="text-xs font-mono text-purple-500">Requer 5000 XP</div>
                </div>

                {/* Geothermal */}
                <div className={`p-6 rounded-2xl border ${score >= 6500 ? 'bg-slate-800 border-orange-500/50' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${score >= 6500 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-600'}`}>
                      <Flame className="w-8 h-8" />
                    </div>
                    {score < 6500 && <Lock className="w-4 h-4 text-slate-600" />}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Geotérmica</h3>
                  <p className="text-xs text-slate-400 mb-4">Fornece energia constante para manter a base ativa.</p>
                  <div className="text-xs font-mono text-orange-500">Requer 6500 XP</div>
                </div>

                {/* Storage */}
                <div className={`p-6 rounded-2xl border ${score >= 8000 ? 'bg-slate-800 border-rose-500/50' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${score >= 8000 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-600'}`}>
                      <Zap className="w-8 h-8" />
                    </div>
                    {score < 8000 && <Lock className="w-4 h-4 text-slate-600" />}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Armazenamento</h3>
                  <p className="text-xs text-slate-400 mb-4">Cria reserva para suportar picos de demanda.</p>
                  <div className="text-xs font-mono text-rose-500">Requer 8000 XP</div>
                </div>
             </div>
          </section>

          {/* Badges Gallery HUD */}
          <section className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700">
            <h2 className="text-2xl font-display font-bold text-white mb-8 flex items-center gap-3 border-b border-slate-700 pb-4">
              <Award className="w-6 h-6 text-yellow-400" />
              GALERIA DE TROFÉUS
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {BADGES.map((badge) => {
                const isUnlocked = badges && badges.includes(badge.id);
                const progress = !isUnlocked && badge.getProgress ? badge.getProgress(stats || {}) : 0;
                
                return (
                  <MotionDiv 
                    key={badge.id}
                    whileHover={{ scale: 1.05 }}
                    className={`relative group p-6 rounded-2xl border text-center transition-all duration-300 flex flex-col items-center justify-between ${
                      isUnlocked 
                        ? badge.color
                        : 'bg-slate-900/50 border-slate-800 opacity-50'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none" />
                    
                    <div className="w-full">
                      <div className="flex justify-center mb-4 relative">
                        {isUnlocked ? (
                          <div className="relative">
                             <div className="absolute inset-0 bg-current opacity-20 blur-xl rounded-full" />
                             {badge.icon}
                          </div>
                        ) : (
                          <Lock className="w-10 h-10 text-slate-600" />
                        )}
                      </div>
                      
                      <h3 className={`font-bold text-sm mb-2 font-display ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                        {badge.title}
                      </h3>
                      
                      <p className="text-xs text-slate-400 leading-relaxed font-mono mb-3">
                        {badge.description}
                      </p>
                    </div>

                    {!isUnlocked && (
                      <div className="w-full mt-auto">
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700/50">
                            <div 
                                className="bg-blue-500/50 h-full rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        {badge.target && (
                             <div className="text-[10px] text-slate-500 mt-1 font-mono text-right">
                                 {Math.floor((stats?.[badge.metric] || 0))} / {badge.target}
                             </div>
                        )}
                      </div>
                    )}
                  </MotionDiv>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
