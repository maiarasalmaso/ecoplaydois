import { Heart, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { generateEcoTip } from '../../services/gemini';

const Footer = () => {
  const [ecoTip, setEcoTip] = useState(null);
  const [loadingTip, setLoadingTip] = useState(true);

  useEffect(() => {
    const loadTip = async () => {
      setLoadingTip(true);
      const result = await generateEcoTip();
      // Use a dica retornada (seja da API ou fallback)
      if (result.tip) {
        setEcoTip(result.tip);
      }
      setLoadingTip(false);
    };
    loadTip();
  }, []);

  return (
    <footer className="bg-theme-bg-secondary text-theme-text-secondary py-8 mt-auto border-t border-theme-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">EcoPlay</h3>
            <p className="text-sm text-theme-text-tertiary">
              Aprendendo sobre energia renovável de forma divertida e interativa.
              Pequenas ações hoje, grande impacto amanhã.
            </p>
          </div>

          {/* Educational Tips */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              Dica Rápida
              <span className="drop-shadow-[0_0_12px_rgba(250,204,21,0.75)]">💡</span>
            </h3>
            <div className="text-sm text-theme-text-tertiary italic pl-4 relative min-h-[3rem] flex items-center">
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-eco-green rounded-full shadow-[0_0_14px_rgba(74,222,128,0.8)]" />
              {loadingTip ? (
                <Loader2 className="w-5 h-5 animate-spin text-eco-green" />
              ) : (
                <span>"{ecoTip || "Desligar a luz ao sair do quarto economiza energia e ajuda o planeta!"}"</span>
              )}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/about"
                  aria-label="Sobre nós: conheça a história, missão e equipe do EcoPlay"
                  className="inline-flex font-medium hover:text-eco-green transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-green/60 rounded"
                >
                  Sobre Nós
                </Link>
                <p className="text-xs text-slate-400 mt-1">
                  Quem somos, nossa missão e como trabalhamos com educação ambiental.
                </p>
              </li>
              <li>
                <Link
                  to="/privacy"
                  aria-label="Segurança e privacidade: leia nossa política de proteção de dados"
                  className="inline-flex font-medium hover:text-eco-green transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-green/60 rounded"
                >
                  Segurança e Privacidade
                </Link>
                <p className="text-xs text-slate-400 mt-1">
                  Como coletamos e protegemos dados, seus direitos e controles (LGPD).
                </p>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm flex items-center justify-center gap-1">
          <span>Feito com</span>
          <Heart className="w-4 h-4 text-red-500 fill-current drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
          <span>para o futuro do nosso planeta.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
