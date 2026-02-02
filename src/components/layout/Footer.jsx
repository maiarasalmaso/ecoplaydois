import { Heart, Loader2, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { generateEcoTip } from '../../services/gemini';
import { playHover, playClick } from '@/utils/soundEffects';

import { motion } from 'framer-motion';

const Footer = () => {
  const [ecoTip, setEcoTip] = useState(null);
  const [loadingTip, setLoadingTip] = useState(true);

  useEffect(() => {
    const loadTip = async () => {
      setLoadingTip(true);
      const result = await generateEcoTip();
      if (result.tip) {
        setEcoTip(result.tip);
      }
      setLoadingTip(false);
    };
    loadTip();
  }, []);

  return (
    <footer className="relative bg-theme-bg-secondary/70 text-theme-text-secondary py-10 mt-auto border-t border-theme-border/70 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/80 to-transparent blur-[1px]"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 4,
            ease: "linear",
            repeatDelay: 0.5
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-theme-text-primary font-bold text-lg mb-3">EcoPlay</h3>
            <p className="text-sm text-theme-text-secondary">
              Aprendendo sobre energia renovável de forma divertida e interativa. Pequenas ações hoje, grande impacto
              amanhã.
            </p>
          </div>

          <div>
            <h3 className="text-theme-text-primary font-bold text-lg mb-3 flex items-center gap-2">
              Dica Rápida
              <span className="text-lg leading-none filter drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">💡</span>
            </h3>
            <div className="text-sm text-theme-text-secondary bg-theme-bg-tertiary/70 border border-theme-border rounded-2xl p-4 pl-5 relative min-h-[3.5rem] flex items-center">
              <motion.span
                className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#4ade80] rounded-full z-10"
                animate={{
                  boxShadow: [
                    "0 0 8px rgba(74,222,128,0.4)",
                    "0 0 16px rgba(74,222,128,0.8)",
                    "0 0 8px rgba(74,222,128,0.4)"
                  ],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              {loadingTip ? (
                <Loader2 className="w-5 h-5 animate-spin text-green-400" />
              ) : (
                <span>"{ecoTip || 'Apague a luz ao sair do quarto e economize energia!'}"</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-theme-text-primary font-bold text-lg mb-3">Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/about"

                  onClick={() => playClick()}
                  aria-label="Sobre nós: conheça a história, missão e equipe do EcoPlay"
                  className="inline-flex font-medium text-theme-text-primary hover:text-green-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/60 rounded"
                >
                  Sobre Nós
                </Link>
                <p className="text-xs text-theme-text-tertiary mt-1">
                  Quem somos, nossa missão e como trabalhamos com educação ambiental.
                </p>
              </li>
              <li>
                <Link
                  to="/privacy"

                  onClick={() => playClick()}
                  aria-label="Segurança e privacidade: leia nossa política de proteção de dados"
                  className="inline-flex font-medium text-theme-text-primary hover:text-green-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/60 rounded"
                >
                  Segurança e Privacidade
                </Link>
                <p className="text-xs text-theme-text-tertiary mt-1">
                  Como coletamos e protegemos dados, seus direitos e controles (LGPD).
                </p>
              </li>

              <li>
                <Link
                  to="/admin"

                  onClick={() => playClick()}
                  aria-label="Acesso administrativo"
                  className="inline-flex font-medium text-theme-text-primary hover:text-green-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/60 rounded"
                >
                  Área Administrativa
                </Link>
                <p className="text-xs text-theme-text-tertiary mt-1">
                  Acesso restrito para gestão da plataforma.
                </p>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-theme-border/60 mt-8 pt-6 text-center text-sm flex items-center justify-center gap-1 text-theme-text-tertiary">
          <span>Feito com</span>
          <motion.div
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
          >
            <Heart className="w-4 h-4 text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          </motion.div>
          <span>para o futuro do nosso planeta.</span>
        </div>
      </div>
    </footer >
  );
};

export default Footer;
