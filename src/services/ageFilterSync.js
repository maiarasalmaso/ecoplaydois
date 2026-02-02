import { isRemoteDbEnabled } from './remoteDb';
import { getUserByEmail, updateUser } from './remoteDb';

// Sincronização do filtro de idades com o banco de dados
export const syncAgeFilter = async (userEmail, ageData) => {
  if (!isRemoteDbEnabled() || !userEmail) {
    return { success: false, message: 'Banco de dados offline ou email não fornecido' };
  }

  try {
    // Buscar usuário no banco
    const user = await getUserByEmail(userEmail);
    if (!user) {
      return { success: false, message: 'Usuário não encontrado' };
    }

    // Atualizar dados de idade do usuário
    const updates = {
      age: ageData.selectedAge,
      age_verified: ageData.isAgeVerified,
      age_verified_at: ageData.verifiedAt || new Date().toISOString(),
    };

    await updateUser(user.id, updates);

    return { success: true, message: 'Filtro de idade sincronizado com sucesso' };
  } catch (error) {
    console.error('Erro ao sincronizar filtro de idade:', error);
    return { success: false, message: 'Erro ao sincronizar com o servidor' };
  }
};

// Recuperar configuração de idade do banco
export const getAgeFilterFromDb = async (userEmail) => {
  if (!isRemoteDbEnabled() || !userEmail) {
    return null;
  }

  try {
    const user = await getUserByEmail(userEmail);
    if (!user || !user.age_verified) {
      return null;
    }

    return {
      selectedAge: user.age,
      isAgeVerified: user.age_verified,
      verifiedAt: user.age_verified_at,
    };
  } catch (error) {
    console.error('Erro ao recuperar filtro de idade:', error);
    return null;
  }
};

// Verificar se idade está dentro das faixas permitidas
export const isAgeInRange = (userAge, minAge, maxAge) => {
  return userAge >= minAge && userAge <= maxAge;
};

// Validar idade para conteúdo específico
export const validateContentAccess = (userAge, content) => {
  const minAge = content.minAge || 0;
  const maxAge = content.maxAge || 99;
  
  if (userAge < minAge) {
    return {
      allowed: false,
      message: `Este conteúdo é para ${minAge}+ anos. Você tem ${userAge} anos.`,
    };
  }
  
  if (userAge > maxAge) {
    return {
      allowed: false,
      message: `Este conteúdo é para até ${maxAge} anos. Você tem ${userAge} anos.`,
    };
  }
  
  return {
    allowed: true,
    message: 'Acesso permitido',
  };
};

// Função para aplicar restrições de idade em tempo real
export const applyAgeRestrictions = (contentList, userAge, isVerified = false) => {
  if (!isVerified) {
    return contentList.map(content => ({
      ...content,
      allowed: false,
      restrictionMessage: 'Por favor, verifique sua idade para acessar este conteúdo.',
    }));
  }

  return contentList.map(content => {
    const validation = validateContentAccess(userAge, content);
    return {
      ...content,
      allowed: validation.allowed,
      restrictionMessage: validation.message,
    };
  });
};

// Cache local para melhorar performance
const ageFilterCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export const getCachedAgeFilter = (userEmail) => {
  if (!userEmail) return null;
  
  const cached = ageFilterCache.get(userEmail);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  return null;
};

export const setCachedAgeFilter = (userEmail, data) => {
  if (!userEmail) return;
  
  ageFilterCache.set(userEmail, {
    data,
    timestamp: Date.now(),
  });
};

export const clearAgeFilterCache = (userEmail) => {
  if (userEmail) {
    ageFilterCache.delete(userEmail);
  } else {
    ageFilterCache.clear();
  }
};

// Exportar funções principais
export default {
  syncAgeFilter,
  getAgeFilterFromDb,
  isAgeInRange,
  validateContentAccess,
  applyAgeRestrictions,
  getCachedAgeFilter,
  setCachedAgeFilter,
  clearAgeFilterCache,
};