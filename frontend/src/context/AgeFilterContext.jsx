import { createContext, useContext, useState } from 'react';
import { isRemoteDbEnabled } from '../services/remoteDb';

const AgeFilterContext = createContext();

export const useAgeFilter = () => {
  const context = useContext(AgeFilterContext);
  if (!context) {
    throw new Error('useAgeFilter must be used within an AgeFilterProvider');
  }
  return context;
};

export const AgeFilterProvider = ({ children }) => {
  const [selectedAge, setSelectedAge] = useState(() => {
    // Carregar idade salva do localStorage ou padrão
    const saved = localStorage.getItem('ecoplay_selected_age');
    return saved ? parseInt(saved) : 10;
  });
  
  const [isAgeVerified, setIsAgeVerified] = useState(() => {
    // Carregar estado de verificação do localStorage
    const verified = localStorage.getItem('ecoplay_age_verified');
    return verified === 'true';
  });

  const [ageRestrictions] = useState({
    10: { min: 10, max: 10, label: '10 anos', color: 'bg-blue-500' },
    11: { min: 11, max: 11, label: '11 anos', color: 'bg-green-500' },
    12: { min: 12, max: 12, label: '12 anos', color: 'bg-yellow-500' },
    13: { min: 13, max: 13, label: '13 anos', color: 'bg-orange-500' },
    14: { min: 14, max: 14, label: '14 anos', color: 'bg-purple-500' },
  });

  const verifyAge = (age) => {
    if (age >= 10 && age <= 14) {
      setSelectedAge(age);
      setIsAgeVerified(true);
      localStorage.setItem('ecoplay_selected_age', age.toString());
      localStorage.setItem('ecoplay_age_verified', 'true');
      
      // Sincronizar com banco se online
      if (isRemoteDbEnabled()) {
        // Aqui você pode adicionar lógica para salvar no Supabase
        console.log('Idade verificada e sincronizada:', age);
      }
      
      return true;
    }
    return false;
  };

  const resetAgeFilter = () => {
    setIsAgeVerified(false);
    setSelectedAge(10); // Resetar para idade padrão
    localStorage.removeItem('ecoplay_age_verified');
    localStorage.removeItem('ecoplay_selected_age');
  };

  const isContentAllowed = (content) => {
    if (!isAgeVerified) return false;
    
    const contentMinAge = content.minAge || 0;
    const contentMaxAge = content.maxAge || 99;
    const userAge = selectedAge;
    
    return userAge >= contentMinAge && userAge <= contentMaxAge;
  };

  const getAgeRestrictionMessage = (content) => {
    if (!isAgeVerified) {
      return 'Por favor, selecione sua idade para acessar este conteúdo.';
    }
    
    const contentMinAge = content.minAge || 0;
    const contentMaxAge = content.maxAge || 99;
    
    if (selectedAge < contentMinAge) {
      return `Este conteúdo é para ${contentMinAge}+ anos. Você selecionou ${selectedAge} anos.`;
    }
    
    if (selectedAge > contentMaxAge) {
      return `Este conteúdo é para até ${contentMaxAge} anos. Você selecionou ${selectedAge} anos.`;
    }
    
    return null;
  };

  const value = {
    selectedAge,
    isAgeVerified,
    ageRestrictions,
    verifyAge,
    resetAgeFilter,
    isContentAllowed,
    getAgeRestrictionMessage,
  };

  return (
    <AgeFilterContext.Provider value={value}>
      {children}
    </AgeFilterContext.Provider>
  );
};