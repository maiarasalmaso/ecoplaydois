import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sun, Wind, Zap, RefreshCw, TreeDeciduous, Droplets, ArrowRight } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const specs = [
  {
    id: 'solar',
    title: 'Energia Solar',
    Icon: Sun,
    description: 'Transforma a luz do sol em energia elétrica com painéis solares.',
    stat: 'FÓTONS',
    accent: { dark: '#f97316', light: '#ea580c' }, // Orange (Rainbow Color 2)
    accentSurface: { dark: 'rgba(249, 115, 22, 0.2)', light: 'rgba(234, 88, 12, 0.15)' },
    accentBorder: { dark: 'rgba(249, 115, 22, 0.6)', light: 'rgba(234, 88, 12, 0.4)' },
    accentGlow: { dark: 'rgba(249, 115, 22, 0.35)', light: 'rgba(234, 88, 12, 0.25)' },
  },
  {
    id: 'wind',
    title: 'Energia Eólica',
    Icon: Wind,
    description: 'O vento gira as turbinas e gera energia limpa.',
    stat: 'CINÉTICA',
    accent: { dark: '#eab308', light: '#ca8a04' }, // Yellow (Rainbow Color 3)
    accentSurface: { dark: 'rgba(234, 179, 8, 0.2)', light: 'rgba(202, 138, 4, 0.15)' },
    accentBorder: { dark: 'rgba(234, 179, 8, 0.6)', light: 'rgba(202, 138, 4, 0.4)' },
    accentGlow: { dark: 'rgba(234, 179, 8, 0.35)', light: 'rgba(202, 138, 4, 0.25)' },
  },
  {
    id: 'hydro',
    title: 'Recursos Hídricos',
    Icon: Droplets,
    description: 'A força da água em movimento vira eletricidade nas hidrelétricas.',
    stat: 'POTENCIAL',
    accent: { dark: '#3b82f6', light: '#2563eb' }, // Blue (Rainbow Color 5)
    accentSurface: { dark: 'rgba(59, 130, 246, 0.2)', light: 'rgba(37, 99, 235, 0.15)' },
    accentBorder: { dark: 'rgba(59, 130, 246, 0.6)', light: 'rgba(37, 99, 235, 0.4)' },
    accentGlow: { dark: 'rgba(59, 130, 246, 0.35)', light: 'rgba(37, 99, 235, 0.25)' },
  },
  {
    id: 'biomass',
    title: 'Biomassa',
    Icon: TreeDeciduous,
    description: 'Matéria orgânica que se torna combustível sustentável.',
    stat: 'ORGÂNICA',
    accent: { dark: '#22c55e', light: '#16a34a' }, // Green (Rainbow Color 4)
    accentSurface: { dark: 'rgba(34, 197, 94, 0.2)', light: 'rgba(22, 163, 74, 0.15)' },
    accentBorder: { dark: 'rgba(34, 197, 94, 0.6)', light: 'rgba(22, 163, 74, 0.4)' },
    accentGlow: { dark: 'rgba(34, 197, 94, 0.35)', light: 'rgba(22, 163, 74, 0.25)' },
  },
  {
    id: 'efficiency',
    title: 'Eficiência',
    Icon: Zap,
    description: 'Fazer mais com menos energia: inteligente e econômico.',
    stat: 'OTIMIZADA',
    accent: { dark: '#ef4444', light: '#dc2626' }, // Red (Rainbow Color 1)
    accentSurface: { dark: 'rgba(239, 68, 68, 0.2)', light: 'rgba(220, 38, 38, 0.15)' },
    accentBorder: { dark: 'rgba(239, 68, 68, 0.6)', light: 'rgba(220, 38, 38, 0.4)' },
    accentGlow: { dark: 'rgba(239, 68, 68, 0.35)', light: 'rgba(220, 38, 38, 0.25)' },
  },
  {
    id: 'recycle',
    title: 'Ciclo de Materiais',
    Icon: RefreshCw,
    description: 'Reutilizar, reciclar e reaproveitar para gastar menos recursos do planeta.',
    stat: 'CIRCULAR',
    accent: { dark: '#a855f7', light: '#7e22ce' }, // Purple (Rainbow Color 6)
    accentSurface: { dark: 'rgba(168, 85, 247, 0.2)', light: 'rgba(126, 34, 206, 0.15)' },
    accentBorder: { dark: 'rgba(168, 85, 247, 0.6)', light: 'rgba(126, 34, 206, 0.4)' },
    accentGlow: { dark: 'rgba(168, 85, 247, 0.35)', light: 'rgba(126, 34, 206, 0.25)' },
  },
];

const SustainabilitySpecs = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-theme-text-primary mb-4">
          Tecnologias de{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-lime-400 filter drop-shadow-[0_0_18px_rgba(74,222,128,0.3)]">
            Preservação
          </span>
        </h2>
        <p className="text-theme-text-secondary max-w-2xl mx-auto font-sans text-base md:text-lg">
          Acesse protocolos essenciais para proteger a vida no planeta. Conhecimento é o primeiro passo para a mudança.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.2
            }
          }
        }}
      >
        {specs.map((item) => {
          const accent = isLight ? item.accent.light : item.accent.dark;
          const accentSurface = isLight ? item.accentSurface.light : item.accentSurface.dark;
          const accentBorder = isLight ? item.accentBorder.light : item.accentBorder.dark;
          const accentGlow = isLight ? item.accentGlow.light : item.accentGlow.dark;
          const Icon = item.Icon;

          return (
            <motion.div
              key={item.id}
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: "spring", stiffness: 300, damping: 25 }
                }
              }}
              style={{
                '--card-accent': accent,
                '--card-accent-surface': accentSurface,
                '--card-accent-border': accentBorder,
                '--card-accent-glow': accentGlow,
              }}
              className="bg-theme-bg-secondary/70 backdrop-blur-md rounded-2xl p-7 border border-[color:var(--card-accent-border)] hover:border-[color:var(--card-accent)] transition-all duration-300 group relative overflow-hidden transform hover:scale-105 hover:shadow-[0_20px_50px_var(--card-accent-glow)] z-0 hover:z-10"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  backgroundImage: 'linear-gradient(135deg, var(--card-accent-surface), transparent 60%)',
                }}
              />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-5">
                  <div className="p-3 rounded-2xl border border-[color:var(--card-accent-border)] bg-[color:var(--card-accent-surface)] shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-[color:var(--card-accent)]" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--card-accent)] border border-[color:var(--card-accent-border)] px-2.5 py-1 rounded-full bg-[color:var(--card-accent-surface)]">
                    {item.stat}
                  </span>
                </div>

                <h3 className="text-lg md:text-xl font-display font-bold text-theme-text-primary mb-2">
                  {item.title}
                </h3>

                <p className="text-sm md:text-base text-theme-text-secondary leading-relaxed">{item.description}</p>

                <Link
                  to="/games"
                  className="mt-4 inline-flex items-center gap-2 text-xs md:text-sm font-semibold hover:brightness-110 transition-colors"
                  style={{ color: accent }}
                  aria-label={`Explorar jogos sobre ${item.title}`}
                >
                  Explorar
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div
                className="absolute bottom-0 left-0 w-full h-1 opacity-70 group-hover:opacity-100 transition-all"
                style={{
                  backgroundImage: 'linear-gradient(to right, transparent, var(--card-accent), transparent)',
                }}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
};

export default SustainabilitySpecs;
