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
    { code: 'ODS 7', title: 'Energia Acessível e Limpa' },
    { code: 'ODS 13', title: 'Ação Contra a Mudança Global do Clima' }
  ];

  const team = [
    { name: 'Maiara de Souza Salmaso', role: 'Desenvolvedora Full Stack' },
    { name: 'Prof. Dra. Larissa Maria Fernandes Gatti', role: 'Orientadora' }
  ];

  const instagramUrl = 'https://instagram.com';
  const contactEmail = 'ecoplayutfpr@gmail.com';
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-eco-green/20 to-blue-500/20 opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
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
            <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-6">
              Sobre o <span className="text-eco-green">EcoPlay</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
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
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
            <Target className="w-12 h-12 text-eco-green mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Visão</h2>
            <p className="text-slate-300 leading-relaxed">
              Ser a principal plataforma que utiliza a metodologia baseada em jogos para o ensino de energia renovável em crianças.
            </p>
          </div>

          <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
            <Award className="w-12 h-12 text-eco-green mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Foco</h2>
            <ol className="space-y-3 text-slate-300">
              {focusItems.map((item, index) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-eco-green/15 text-eco-green font-bold text-sm">
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
            <Award className="w-16 h-16 text-eco-green mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-white mb-4">Valores (ODS)</h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Valores alinhados com os Objetivos de Desenvolvimento Sustentável.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {odsValues.map((ods, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-center"
              >
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-eco-green/15 text-eco-green font-bold mb-4">
                  {ods.code}
                </div>
                <h3 className="text-xl font-bold text-white">{ods.title}</h3>
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
            <Users className="w-16 h-16 text-eco-green mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-white mb-4">Nossa Equipe</h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
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
                className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 text-center"
              >
                <div className="w-16 h-16 bg-eco-green/15 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-eco-green" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                <p className="text-eco-green font-medium">{member.role}</p>
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
          className="bg-gradient-to-r from-slate-800 to-slate-700 p-8 rounded-3xl border border-slate-600"
        >
          <div className="text-center mb-12">
            <Mail className="w-16 h-16 text-eco-green mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-white mb-4">Entre em Contato</h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Canais de contato do projeto.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-slate-900/40 border border-slate-600 rounded-2xl p-6 text-center">
              <h3 className="text-lg font-bold text-white mb-2">Projeto</h3>
              <p className="text-slate-300">Projeto de extensão da UTFPR - Campus Londrina</p>
            </div>

            <div className="bg-slate-900/40 border border-slate-600 rounded-2xl p-6 text-center">
              <h3 className="text-lg font-bold text-white mb-4">Contato</h3>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={gmailComposeUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Enviar email para contato do EcoPlay"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-eco-green text-slate-900 rounded-full font-bold hover:bg-green-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-green/60"
                >
                  <Mail className="w-5 h-5" />
                  Email
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Abrir Instagram do EcoPlay"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900/50 text-white rounded-full font-bold border border-slate-600 hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-green/60"
                >
                  <Instagram className="w-5 h-5" />
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
