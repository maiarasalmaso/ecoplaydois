import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, RefreshCw, Leaf, Zap, Wind, Droplets } from 'lucide-react';
import AnimatedBackground from '../components/layout/AnimatedBackground';

const NotFound = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Registrar erro no console para debugging
    console.error('404 - Página não encontrada:', window.location.pathname);
  }, []);

  const handleRefresh = () => {
    navigate(0); // Recarregar a página
  };

  const goBack = () => {
    navigate(-1); // Voltar uma página
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto"
        >
          {/* Elementos decorativos de energia */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-20 left-10 text-blue-400/20"
            >
              <Wind className="w-12 h-12" />
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-20 right-10 text-yellow-400/20"
            >
              <Zap className="w-16 h-16" />
            </motion.div>
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-40 right-20 text-blue-300/20"
            >
              <Droplets className="w-10 h-10" />
            </motion.div>
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-40 left-20 text-green-400/20"
            >
              <Leaf className="w-14 h-14" />
            </motion.div>
          </div>

          {/* Título 404 */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-eco-green via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              404
            </h1>
            <div className="text-2xl md:text-3xl font-light text-slate-300 mb-2">
              Oops! Página não encontrada
            </div>
          </motion.div>

          {/* Mensagem principal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-8"
          >
            <p className="text-lg text-slate-400 mb-4 leading-relaxed">
              Parece que você se perdeu no mundo da energia sustentável! 
              A página que você está procurando não existe ou foi movida.
            </p>
            <p className="text-sm text-slate-500">
              Mas não se preocupe, vamos te ajudar a voltar para o caminho verde! 🌱
            </p>
          </motion.div>

          {/* Cards de energia com mensagens educativas */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-4 text-center">
              <Wind className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-300 mb-1">Energia Eólica</h3>
              <p className="text-sm text-slate-400">Como o vento pode nos ajudar a gerar energia limpa!</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-4 text-center">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <h3 className="font-semibold text-yellow-300 mb-1">Energia Solar</h3>
              <p className="text-sm text-slate-400">Aproveitando o poder do sol para um futuro sustentável!</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-4 text-center">
              <Droplets className="w-8 h-8 text-blue-300 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-300 mb-1">Energia Hídrica</h3>
              <p className="text-sm text-slate-400">A força da água em movimento gerando eletricidade!</p>
            </div>
          </motion.div>

          {/* Botões de ação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to="/"
              className="bg-gradient-to-r from-eco-green to-green-500 hover:from-green-500 hover:to-eco-green text-slate-900 font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center gap-2 transform hover:scale-105"
            >
              <Home className="w-5 h-5" />
              Voltar para Home
            </Link>
            
            <button
              onClick={goBack}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center gap-2 transform hover:scale-105"
            >
              <RefreshCw className="w-5 h-5" />
              Voltar
            </button>
            
            <button
              onClick={handleRefresh}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center gap-2 transform hover:scale-105 border border-slate-600"
            >
              <RefreshCw className="w-5 h-5" />
              Recarregar
            </button>
          </motion.div>

          {/* Dica educativa */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-8 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50"
          >
            <div className="flex items-center gap-3">
              <Leaf className="w-6 h-6 text-eco-green flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-eco-green mb-1">Dica Eco-Sustentável</h4>
                <p className="text-sm text-slate-400">
                  Sabe que você pode economizar energia até mesmo ao navegar na web? 
                  Desligar dispositivos quando não estiver usando ajuda o planeta! 💚
                </p>
              </div>
            </div>
          </motion.div>

          {/* Link para suporte */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-slate-500">
              Se você acha que isso é um erro, por favor{' '}
              <Link to="/avaliacao" className="text-eco-green hover:text-green-400 underline">
                nos informe
              </Link>
              .
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;