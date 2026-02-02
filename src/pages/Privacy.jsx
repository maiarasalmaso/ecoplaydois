import { ArrowLeft, Shield, Eye, Lock, FileText, Users, Cookie, AlertTriangle, CheckCircle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Privacy = () => {
  const contactEmail = 'ecoplayutfpr@gmail.com';
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}`;

  const dataTypes = [
    {
      category: 'Informações Pessoais',
      items: ['Nome completo', 'Endereço de email', 'Idade'],
      icon: <Users className="w-6 h-6 text-green-400" />
    },
    {
      category: 'Dados de Uso',
      items: ['Progresso nos jogos', 'Pontuações e conquistas', 'Tempo de jogo', 'Preferências de configuração'],
      icon: <FileText className="w-6 h-6 text-green-400" />
    }
  ];

  const purposes = [
    {
      title: 'Personalização da Experiência',
      description: 'Adaptar o conteúdo e funcionalidades de acordo com o perfil e progresso do usuário',
      icon: <Eye className="w-6 h-6 text-green-400" />
    },
    {
      title: 'Melhoria Contínua',
      description: 'Analisar padrões de uso para aprimorar nossos jogos e funcionalidades',
      icon: <CheckCircle className="w-6 h-6 text-green-400" />
    },
    {
      title: 'Comunicação Efetiva',
      description: 'Enviar atualizações importantes, novidades e informações sobre conquistas',
      icon: <Mail className="w-6 h-6 text-teal-400" />
    },
    {
      title: 'Segurança e Proteção',
      description: 'Proteger contra atividades fraudulentas e garantir a integridade da plataforma',
      icon: <Lock className="w-6 h-6 text-green-500" />
    }
  ];

  const rights = [
    {
      title: 'Acesso aos Dados',
      description: 'Você pode solicitar uma cópia de todos os dados que possuímos sobre você',
      article: 'Art. 18, I da LGPD'
    },
    {
      title: 'Correção de Dados',
      description: 'Solicitar a correção de informações incompletas, inexatas ou desatualizadas',
      article: 'Art. 18, II da LGPD'
    },
    {
      title: 'Portabilidade',
      description: 'Receber seus dados em formato estruturado e transferi-los para outro serviço',
      article: 'Art. 18, V da LGPD'
    },
    {
      title: 'Eliminação',
      description: 'Solicitar o apagamento de seus dados pessoais, exceto quando houver obrigação legal',
      article: 'Art. 18, VI da LGPD'
    },
    {
      title: 'Revogação do Consentimento',
      description: 'Retirar seu consentimento a qualquer momento, sem afetar tratamentos já realizados',
      article: 'Art. 8º, §5º da LGPD'
    },
    {
      title: 'Informação sobre Compartilhamento',
      description: 'Saber com quais empresas e para quais finalidades seus dados são compartilhados',
      article: 'Art. 18, IV da LGPD'
    }
  ];

  const securityMeasures = [
    'Criptografia de dados em trânsito e em repouso',
    'Autenticação multifator para acessos sensíveis',
    'Backups regulares e testes de recuperação',
    'Monitoramento contínuo de segurança',
    'Auditorias periódicas de segurança',
    'Treinamento constante da equipe',
    'Políticas de senha fortes e rotativas',
    'Controle de acesso baseado em privilégios mínimos'
  ];

  return (
    <div className="min-h-screen text-theme-text-primary">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-400/20 opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors">
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
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold text-theme-text-primary mb-6">
              Política de <span className="text-green-500">Privacidade</span>
            </h1>
            <p className="text-xl text-theme-text-secondary max-w-3xl mx-auto leading-relaxed">
              Compromisso com a transparência e proteção dos seus dados pessoais em conformidade com a LGPD
            </p>
            <p className="text-sm text-theme-text-tertiary mt-4">
              Última atualização: 31 de dezembro de 2024
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-20">

        {/* Introdução */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-theme-bg-secondary p-8 rounded-2xl border border-theme-border"
        >
          <h2 className="text-3xl font-bold text-theme-text-primary mb-6">Nosso Compromisso</h2>
          <p className="text-theme-text-secondary text-lg leading-relaxed mb-4">
            No EcoPlay, levamos sua privacidade muito a sério. Esta Política de Privacidade descreve como coletamos,
            usamos, armazenamos e protegemos suas informações pessoais quando você utiliza nossa plataforma de jogos educativos.
          </p>
          <p className="text-theme-text-secondary text-lg leading-relaxed">
            Estamos em total conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei 13.709/2018)
            e trabalhamos constantemente para garantir a segurança e transparência no tratamento de seus dados.
          </p>
        </motion.section>

        {/* Coleta de Dados */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-theme-text-primary mb-8 text-center">Coleta de Dados</h2>
          <p className="text-theme-text-secondary text-center mb-12 max-w-3xl mx-auto">
            Coletamos diferentes tipos de informações para proporcionar uma experiência personalizada e segura.
            Todos os dados são coletados com base em seu consentimento explícito.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {dataTypes.map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-theme-bg-secondary p-6 rounded-2xl border border-theme-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  {type.icon}
                  <h3 className="text-xl font-bold text-theme-text-primary">{type.category}</h3>
                </div>
                <ul className="space-y-2">
                  {type.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-3 text-theme-text-secondary">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Finalidade do Uso */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-theme-text-primary mb-8 text-center">Como Usamos Seus Dados</h2>
          <p className="text-theme-text-secondary text-center mb-12 max-w-3xl mx-auto">
            Utilizamos suas informações apenas para finalidades específicas, legítimas e comunicadas a você no momento da coleta.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {purposes.map((purpose, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-theme-bg-secondary p-6 rounded-2xl border border-theme-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  {purpose.icon}
                  <h3 className="text-xl font-bold text-theme-text-primary">{purpose.title}</h3>
                </div>
                <p className="text-theme-text-secondary leading-relaxed">{purpose.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Direitos do Usuário */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-theme-bg-tertiary p-8 rounded-3xl border border-theme-border"
        >
          <h2 className="text-4xl font-bold text-theme-text-primary mb-8 text-center">Seus Direitos (LGPD)</h2>
          <p className="text-theme-text-secondary text-center mb-12 max-w-3xl mx-auto">
            Em conformidade com a Lei Geral de Proteção de Dados, você possui os seguintes direitos:
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rights.map((right, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="bg-theme-bg-secondary p-6 rounded-xl border border-theme-border"
              >
                <h3 className="text-lg font-bold text-theme-text-primary mb-3">{right.title}</h3>
                <p className="text-theme-text-secondary text-sm leading-relaxed mb-3">{right.description}</p>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-500 font-medium">{right.article}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-green-500/10 rounded-xl border border-green-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-theme-text-primary mb-2">Como Exercer Seus Direitos</h3>
                <p className="text-theme-text-secondary leading-relaxed">
                  Para exercer qualquer um desses direitos, entre em contato conosco pelo email{' '}
                  <a
                    href={gmailComposeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-500 hover:text-green-400 underline"
                  >
                    {contactEmail}
                  </a>{' '}
                  ou utilize o formulário de solicitação em sua área de usuário.
                  Respondemos todas as solicitações em até 15 dias úteis conforme exigido pela LGPD.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Cookies */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-theme-text-primary mb-8 text-center">Cookies e Tecnologias Similares</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-theme-bg-secondary p-6 rounded-2xl border border-theme-border">
              <h3 className="text-xl font-bold text-theme-text-primary mb-4">Cookies Essenciais</h3>
              <p className="text-theme-text-secondary mb-4">
                Necessários para o funcionamento básico da plataforma. Não podem ser desativados.
              </p>
              <ul className="space-y-2 text-theme-text-tertiary text-sm">
                <li>• Cookies de autenticação</li>
                <li>• Cookies de segurança</li>
                <li>• Cookies de preferências básicas</li>
              </ul>
            </div>

            <div className="bg-theme-bg-secondary p-6 rounded-2xl border border-theme-border">
              <h3 className="text-xl font-bold text-theme-text-primary mb-4">Cookies de Performance</h3>
              <p className="text-theme-text-secondary mb-4">
                Coletam informações sobre como você utiliza nossa plataforma para melhorar o desempenho.
              </p>
              <ul className="space-y-2 text-theme-text-tertiary text-sm">
                <li>• Análise de velocidade de carregamento</li>
                <li>• Monitoramento de erros</li>
                <li>• Estatísticas de uso</li>
              </ul>
            </div>

            <div className="bg-theme-bg-secondary p-6 rounded-2xl border border-theme-border">
              <h3 className="text-xl font-bold text-theme-text-primary mb-4">Cookies de Funcionalidade</h3>
              <p className="text-theme-text-secondary mb-4">
                Lembram suas preferências para personalizar sua experiência.
              </p>
              <ul className="space-y-2 text-theme-text-tertiary text-sm">
                <li>• Idioma preferido</li>
                <li>• Configurações de acessibilidade</li>
                <li>• Personalização de interface</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-500/10 p-6 rounded-xl border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <Cookie className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-theme-text-primary mb-2">Controle de Cookies</h3>
                <p className="text-theme-text-secondary leading-relaxed">
                  Você pode gerenciar suas preferências de cookies a qualquer momento através das configurações do seu navegador
                  ou utilizando nosso painel de preferências. Cookies essenciais não podem ser desativados pois são necessários
                  para o funcionamento básico da plataforma.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Segurança */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-theme-bg-tertiary p-8 rounded-3xl border border-theme-border"
        >
          <h2 className="text-4xl font-bold text-theme-text-primary mb-8 text-center">Medidas de Segurança</h2>
          <p className="text-theme-text-secondary text-center mb-12 max-w-3xl mx-auto">
            Implementamos rigorosas medidas de segurança para proteger seus dados pessoais contra acesso não autorizado,
            alteração, divulgação ou destruição não autorizada.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {securityMeasures.map((measure, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 p-4 bg-theme-bg-secondary rounded-xl border border-theme-border"
              >
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-theme-text-secondary">{measure}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Alterações na Política */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-theme-bg-tertiary p-8 rounded-3xl border border-theme-border"
        >
          <h2 className="text-3xl font-bold text-theme-text-primary mb-6 text-center">Alterações nesta Política</h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-theme-text-secondary text-lg leading-relaxed mb-6">
              Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas,
              novos requisitos legais ou melhorias em nossos serviços.
            </p>

            <div className="bg-theme-bg-secondary p-6 rounded-xl border border-theme-border mb-6">
              <h3 className="text-xl font-bold text-theme-text-primary mb-4">Como Notificamos Alterações</h3>
              <ul className="space-y-3 text-theme-text-secondary">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Notificação por email para usuários registrados</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Alerta destacado na plataforma ao acessar</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Atualização da data de "Última atualização" no topo da página</span>
                </li>
              </ul>
            </div>

            <p className="text-theme-text-secondary leading-relaxed">
              Recomendamos que você revise esta política periodicamente. O uso continuado de nossos serviços após alterações
              significa que você aceita as mudanças. Em caso de alterações substanciais, forneceremos um aviso prévio
              adequado conforme exigido pela legislação aplicável.
            </p>
          </div>
        </motion.section>

        {/* Contato */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-theme-text-primary mb-6">Dúvidas sobre Privacidade?</h2>
          <p className="text-theme-text-secondary text-lg mb-8 max-w-2xl mx-auto">
            Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos seus dados,
            nossa equipe de privacidade está aqui para ajudar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={gmailComposeUrl}
              target="_blank"
              rel="noreferrer"
              className="px-8 py-4 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors flex items-center gap-3"
            >
              <Mail className="w-5 h-5" />
              {contactEmail}
            </a>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Privacy;
