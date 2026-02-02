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
      icon: <Sparkles className="w-7 h-7 text-green-500" />,
      title: 'Trilhas e Desafios',
      description: 'Atividades progressivas para praticar conceitos e melhorar o desempenho ao longo do tempo.'
    },
    {
      icon: <Trophy className="w-7 h-7 text-green-500" />,
      title: 'Progresso e Conquistas',
      description: 'Acompanhe pontuações, conquistas e evolução, mantendo o aprendizado motivador e consistente.'
    },
    {
      icon: <Shield className="w-7 h-7 text-green-500" />,
      title: 'Experiência Segura',
      description: 'Controles de privacidade, transparência e foco em proteção de dados para uma navegação confiável.'
    }
  ];

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-4 mb-10">
          <Link
            to="/"
            aria-label="Voltar para a página inicial"
            className="inline-flex items-center gap-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-green/60 rounded"
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-eco-green to-lime-500 bg-clip-text text-transparent">
            Saiba Mais
          </h1>
          <p className="text-theme-text-secondary text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
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
              className="bg-theme-bg-secondary/50 border border-theme-border rounded-2xl p-7"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0">{item.icon}</div>
                <div>
                  <h2 className="text-xl font-bold text-theme-text-primary mb-2">{item.title}</h2>
                  <p className="text-theme-text-secondary leading-relaxed">{item.description}</p>
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
          className="mt-12 bg-theme-bg-secondary/30 border border-theme-border rounded-3xl p-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-theme-text-primary mb-3">Comece agora</h2>
          <p className="text-theme-text-secondary mb-8 leading-relaxed">
            Para acessar jogos e acompanhar seu progresso, entre com sua conta ou crie um cadastro em poucos passos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/register"
              aria-label="Criar Conta (criar conta no EcoPlay)"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-eco-green text-slate-900 font-bold hover:bg-green-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-green/60"
            >
              Criar Conta
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              aria-label="Entrar (entrar na sua conta do EcoPlay)"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-theme-bg-tertiary text-theme-text-primary font-bold hover:bg-theme-bg-secondary border border-theme-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-green/60"
            >
              Entrar
            </Link>
            <Link
              to="/games"
              aria-label="Ver Jogos (ir para a área de jogos do EcoPlay)"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-theme-bg-tertiary text-theme-text-primary font-bold border border-theme-border hover:bg-theme-bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-green/60"
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
