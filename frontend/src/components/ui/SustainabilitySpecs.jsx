import { motion } from 'framer-motion';
import { Sun, Wind, Zap, RefreshCw, TreeDeciduous, Droplets } from 'lucide-react';

const specs = [
  {
    id: 'solar',
    title: 'Energia Solar',
    icon: <Sun className="w-8 h-8 text-yellow-400" />,
    description: 'Conversão direta da irradiação solar em energia elétrica através do efeito fotovoltaico em semicondutores, excitando elétrons para gerar corrente contínua.',
    stat: 'FÓTONS',
    color: 'from-yellow-400/20 to-orange-500/20',
    borderColor: 'border-yellow-400/30'
  },
  {
    id: 'wind',
    title: 'Energia Eólica',
    icon: <Wind className="w-8 h-8 text-cyan-400" />,
    description: 'Aproveitamento da energia cinética das massas de ar, convertida em rotação mecânica por aerogeradores otimizados via aerodinâmica e sistemas de controle.',
    stat: 'CINÉTICA',
    color: 'from-cyan-400/20 to-blue-500/20',
    borderColor: 'border-cyan-400/30'
  },
  {
    id: 'hydro',
    title: 'Recursos Hídricos',
    icon: <Droplets className="w-8 h-8 text-blue-400" />,
    description: 'Geração despachável baseada na transformação da energia potencial gravitacional da água em energia mecânica e elétrica, utilizando turbinas de alta eficiência hidráulica.',
    stat: 'POTENCIAL',
    color: 'from-blue-400/20 to-indigo-500/20',
    borderColor: 'border-blue-400/30'
  },
  {
    id: 'biomass',
    title: 'Biomassa e Reflorestamento',
    icon: <TreeDeciduous className="w-8 h-8 text-green-400" />,
    description: 'Liberação da energia química armazenada em matéria orgânica (animal ou vegetal) originalmente fixada via fotossíntese para produção térmica ou elétrica.',
    stat: 'FOTOSSÍNTESE',
    color: 'from-green-400/20 to-emerald-500/20',
    borderColor: 'border-green-400/30'
  },
  {
    id: 'efficiency',
    title: 'Eficiência Energética',
    icon: <Zap className="w-8 h-8 text-purple-400" />,
    description: 'Otimização de sistemas baseada nas leis da termodinâmica, visando a redução de perdas irreversíveis (entropia) e a maximização da eficiência exergética.',
    stat: 'TERMODINÂMICA',
    color: 'from-purple-400/20 to-fuchsia-500/20',
    borderColor: 'border-purple-400/30'
  },
  {
    id: 'recycle',
    title: 'Ciclo de Materiais',
    icon: <RefreshCw className="w-8 h-8 text-red-400" />,
    description: 'Implementação da economia circular com análise do ciclo de vida (ACV) e reciclagem avançada, minimizando a extração de matéria-prima virgem e a pegada de carbono.',
    stat: 'CIRCULAR',
    color: 'from-red-400/20 to-pink-500/20',
    borderColor: 'border-red-400/30'
  }
];

const SustainabilitySpecs = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
          Tecnologias de <span className="text-transparent bg-clip-text bg-gradient-to-r from-eco-green to-teal-400">Preservação</span>
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto font-light">
          Acesse os protocolos essenciais para a manutenção da vida planetária. 
          Conhecimento é o primeiro passo para a mudança.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {specs.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border ${item.borderColor} hover:border-opacity-100 border-opacity-30 hover:bg-slate-800/60 transition-all duration-300 group relative overflow-hidden hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]`}
          >
            {/* Background Gradient Effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:border-slate-600">
                  {item.icon}
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border border-slate-700/50 px-2 py-1 rounded bg-slate-900/50">
                  {item.stat}
                </span>
              </div>
              
              <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                {item.title}
              </h3>
              
              <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                {item.description}
              </p>
            </div>
            
            {/* Tech Decoration Lines */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50 group-hover:opacity-100 group-hover:via-white/20 transition-all" />
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/10 transition-colors" />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default SustainabilitySpecs;
