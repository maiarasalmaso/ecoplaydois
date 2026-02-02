import { ArrowLeft, Users, Target, Award, Mail, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const About = () => {
  const focusItems = [
    'Desenvolver conteúdos educacionais interativos e gamificados sobre energias renováveis',
    'Criar experiências de aprendizagem adaptadas para crianças de 10 a 14 anos',
    'Implementar mecânicas de jogo que incentivem a retenção de conhecimento e mudança de comportamento',
    'Medir o impacto educacional através de métricas de engajamento e aprendizagem'
  ];

  const odsValues = [
    { code: 'ODS 4', title: 'Educação de Qualidade' },
    { code: 'ODS 7', title: 'Energia Acessível e Limpa' }
  ];

  const team = [
    { name: 'Maiara de Souza Salmaso', role: 'Desenvolvedora Full Stack' },
    { name: 'Prof. Dra. Larissa Maria Fernandes Gatti', role: 'Orientadora' }
  ];

  const instagramUrl = 'https://instagram.com';
  const contactEmail = 'ecoplayutfpr@gmail.com';
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}`;

  return (
    <div className="min-h-screen text-theme-text-primary">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-display font-bold text-theme-text-primary mb-6">
              Sobre o <span className="text-green-500">EcoPlay</span>
            </h1>
            <p className="text-xl text-theme-text-secondary max-w-3xl mx-auto leading-relaxed">
              Metodologia baseada em jogos para o ensino de energia renovável em crianças (10 a 14 anos).
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-20">

        {/* Visão e Foco */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid lg:grid-cols-2 gap-8"
        >
          <div className="bg-theme-bg-secondary p-8 rounded-2xl border border-theme-border">
            <Target className="w-12 h-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-theme-text-primary mb-4">Visão</h2>
            <p className="text-theme-text-secondary leading-relaxed">
              Ser a principal plataforma que utiliza a metodologia baseada em jogos para o ensino de energia renovável em crianças.
            </p>
          </div>

          <div className="bg-theme-bg-secondary p-8 rounded-2xl border border-theme-border">
            <Award className="w-12 h-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-theme-text-primary mb-4">Foco</h2>
            <ol className="space-y-3 text-theme-text-secondary">
              {focusItems.map((item, index) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500/15 text-green-500 font-bold text-sm">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </motion.section>

        {/* Valores (ODS) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <Award className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-theme-text-primary mb-4">Valores (ODS)</h2>
            <p className="text-theme-text-secondary max-w-2xl mx-auto">
              Valores alinhados com os Objetivos de Desenvolvimento Sustentável.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {odsValues.map((ods, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-theme-bg-secondary p-6 rounded-2xl border border-theme-border text-center"
              >
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-green-500/15 text-green-500 font-bold mb-4">
                  {ods.code}
                </div>
                <h3 className="text-xl font-bold text-theme-text-primary">{ods.title}</h3>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Equipe */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <Users className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-theme-text-primary mb-4">Nossa Equipe</h2>
            <p className="text-theme-text-secondary max-w-2xl mx-auto">
              Projeto desenvolvido em contexto acadêmico com orientação docente.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-theme-bg-secondary p-8 rounded-2xl border border-theme-border text-center"
              >
                <div className="w-16 h-16 bg-green-500/15 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-theme-text-primary mb-2">{member.name}</h3>
                <p className="text-green-500 font-medium">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Informações de Contato */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-theme-bg-tertiary p-8 rounded-3xl border border-theme-border"
        >
          <div className="text-center mb-12">
            <Mail className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-theme-text-primary mb-4">Entre em Contato</h2>
            <p className="text-theme-text-secondary max-w-2xl mx-auto">
              Canais de contato do projeto.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-theme-bg-secondary border border-theme-border rounded-2xl p-6 text-center">
              <h3 className="text-lg font-bold text-theme-text-primary mb-2">Projeto</h3>
              <p className="text-theme-text-secondary">Projeto de extensão da UTFPR - Campus Londrina</p>
            </div>

            <div className="bg-theme-bg-secondary border border-theme-border rounded-2xl p-6 text-center">
              <h3 className="text-lg font-bold text-theme-text-primary mb-4">Contato</h3>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={gmailComposeUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Enviar email para contato do EcoPlay"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-full font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 shadow-lg hover:scale-105 transform duration-200"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6Z" fill="white" />
                    <path d="M2 6L12 13L22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6Z" fill="#EAEAEA" />
                    <path d="M20 4H4C2.9 4 2 4.9 2 6L12 13L22 6C22 4.9 21.1 4 20 4Z" fill="#EA4335" />
                    <path d="M2 6L12 13L22 6" stroke="#C5221F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Gmail
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Abrir Instagram do EcoPlay"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-full font-bold border border-slate-700 hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 shadow-lg hover:scale-105 transform duration-200"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient id="insta_grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(6.5 22.5) rotate(-55) scale(26)">
                        <stop stopColor="#FFD600" />
                        <stop offset="0.35" stopColor="#FF0100" />
                        <stop offset="0.75" stopColor="#D80027" />
                        <stop offset="1" stopColor="#C40087" />
                      </radialGradient>
                      <linearGradient id="insta_grad2" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#405DE6" />
                        <stop offset="0.2" stopColor="#5851DB" />
                        <stop offset="0.4" stopColor="#833AB4" />
                        <stop offset="0.6" stopColor="#C13584" />
                        <stop offset="0.8" stopColor="#E1306C" />
                        <stop offset="1" stopColor="#FD1D1D" />
                      </linearGradient>
                    </defs>
                    <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#insta_grad2)" />
                    <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="2" fill="none" />
                    <circle cx="17.5" cy="6.5" r="1.5" fill="white" />
                  </svg>
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default About;
