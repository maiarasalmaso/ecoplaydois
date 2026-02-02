import { useEffect, useRef } from 'react';
import { playHover } from '../utils/soundEffects';

const GlobalSoundEffects = () => {
  const lastHoveredRef = useRef(null);

  useEffect(() => {
    const handleMouseOver = (e) => {
      // Verifica se o elemento possui a classe específica para som de hover
      const target = e.target.closest('.sound-hover');
      
      // Se não tiver a classe, reseta o último hover e retorna
      if (!target) {
        lastHoveredRef.current = null;
        return;
      }

      // Verifica se o elemento está desabilitado
      if (target.disabled || target.getAttribute('aria-disabled') === 'true' || target.classList.contains('disabled')) {
        return;
      }

      // Se for um novo elemento interativo, toca o som
      if (target !== lastHoveredRef.current) {
        lastHoveredRef.current = target;
        playHover();
      }
    };

    // Adiciona listener global
    // Usamos capture=true para garantir que pegamos o evento cedo, 
    // mas mouseover bubbles, então capture não é estritamente necessário, mas ajuda em alguns casos.
    // Passive=true para performance.
    document.addEventListener('mouseover', handleMouseOver, { passive: true });

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return null; // Componente lógico, sem renderização visual
};

export default GlobalSoundEffects;
