import { ArrowLeft, Gamepad2, Sparkles, Trophy, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const SaibaMais = () => {
  const highlights = [
    {
      icon: <Gamepad2 className="w-7 h-7 text-eco-green" />,
      title: 'Jogos Educativos',
      description: 'Minijogos curtos e interativos para aprender sobre sustentabilidade, energia e hábitos conscientes.'
    },
    {
      icon: <Sparkles className="w-7 h-7 text-cyan-400" />,
      title: 'Trilhas e Desafios',
      description: 'Atividades progressivas para praticar conceitos e melhorar o desempenho ao longo do tempo.'
    },
    {
      icon: <Trophy className="w-7 h-7 text-purple-400" />,
      title: 'Progresso e Conquistas',
      description: 'Acompanhe pontuações, conquistas e evolução, mantendo o aprendizado motivador e consistente.'
    },
    {
      icon: <Shield className="w-7 h-7 text-blue-400" />,
      title: 'Experiência Segura',
      description: 'Controles de privacidade, transparência e foco em proteção de dados para uma navegação confiável.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-4 mb-10">
          <Link
            to="/"
            aria-label="Voltar para a página inicial"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-green/60 rounded"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>
        </div>

        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-eco-green to-cyan-400 bg-clip-text text-transparent">
            Saiba Mais
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            O EcoPlay combina jogos educativos, desafios e acompanhamento de progresso para transformar o aprendizado sobre
            sustentabilidade em uma experiência prática, divertida e acessível.
          </p>
        </motion.header>

        <div className="grid md:grid-cols-2 gap-6">
          {highlights.map((item, index) => (
            <motion.section
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="bg-slate-800/50 border border-slate-700 rounded-2xl p-7"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0">{item.icon}</div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">{item.title}</h2>
                  <p className="text-slate-300 leading-relaxed">{item.description}</p>
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-12 bg-slate-800/30 border border-slate-700 rounded-3xl p-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Comece agora</h2>
          <p className="text-slate-300 mb-8 leading-relaxed">
            Para acessar jogos e acompanhar seu progresso, entre com sua conta ou crie um cadastro em poucos passos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/register"
              aria-label="Criar Conta (criar conta no EcoPlay)"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-eco-green text-slate-900 font-bold hover:bg-green-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-green/60"
            >
              Criar Conta
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              aria-label="Entrar (entrar na sua conta do EcoPlay)"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-slate-700 text-white font-bold hover:bg-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-green/60"
            >
              Entrar
            </Link>
            <Link
              to="/games"
              aria-label="Ver Jogos (ir para a área de jogos do EcoPlay)"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-slate-800 text-white font-bold border border-slate-700 hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-green/60"
            >
              Ver Jogos
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default SaibaMais;
