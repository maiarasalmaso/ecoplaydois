// Funções de validação segura para inputs

/**
 * Valida se o email está em formato válido
 * @param {string} email - Email a ser validado
 * @returns {boolean} - true se válido, false se inválido
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  // Regex mais robusto para validação de email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // Verificar comprimento (máximo 254 caracteres conforme RFC)
  if (email.length > 254) return false;
  
  // Verificar formato
  if (!emailRegex.test(email)) return false;
  
  // Verificar se não tem espaços em branco
  if (email.includes(' ')) return false;
  
  // Verificar se o domínio tem pelo menos 2 caracteres
  const domain = email.split('@')[1];
  if (!domain || domain.length < 2) return false;
  
  return true;
};

/**
 * Valida e sanitiza nome de usuário
 * @param {string} name - Nome a ser validado
 * @returns {object} - { isValid: boolean, sanitized: string, error?: string }
 */
export const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Nome é obrigatório' };
  }
  
  // Remover espaços extras e caracteres de controle
  const sanitized = name.trim().replace(/[^\x20-\x7E\u00A0-\u00FF]/g, ''); // Apenas caracteres visíveis
  
  // Verificar comprimento
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Nome deve ter pelo menos 2 caracteres' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, error: 'Nome não pode ter mais de 100 caracteres' };
  }
  
  // Verificar caracteres permitidos (letras, números, espaços, hífens, underscores)
  const validCharsRegex = /^[a-zA-Z0-9\s\-_]+$/;
  if (!validCharsRegex.test(sanitized)) {
    return { isValid: false, error: 'Nome contém caracteres inválidos' };
  }
  
  // Verificar se não começa ou termina com espaço
  if (sanitized !== sanitized.trim()) {
    return { isValid: false, error: 'Nome não pode começar ou terminar com espaço' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Valida senha seguindo requisitos de segurança
 * @param {string} password - Senha a ser validada
 * @returns {object} - { isValid: boolean, error?: string, strength: number }
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Senha é obrigatória' };
  }
  
  // Comprimento mínimo
  if (password.length < 6) {
    return { isValid: false, error: 'Senha deve ter pelo menos 6 caracteres' };
  }
  
  // Comprimento máximo (evitar DoS)
  if (password.length > 128) {
    return { isValid: false, error: 'Senha não pode ter mais de 128 caracteres' };
  }
  
  // Calcular força da senha
  let strength = 0;
  
  // Comprimento
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  
  // Tipos de caracteres
  if (/[a-z]/.test(password)) strength += 1; // letras minúsculas
  if (/[A-Z]/.test(password)) strength += 1; // letras maiúsculas
  if (/[0-9]/.test(password)) strength += 1; // números
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1; // caracteres especiais
  
  return { isValid: true, strength };
};

/**
 * Valida idade para o sistema EcoPlay (10-14 anos)
 * @param {number} age - Idade a ser validada
 * @returns {object} - { isValid: boolean, error?: string }
 */
export const validateAge = (age) => {
  if (age === null || age === undefined) {
    return { isValid: false, error: 'Idade é obrigatória' };
  }
  
  // Converter para número e verificar se é válido
  const ageNum = Number(age);
  if (isNaN(ageNum) || !Number.isInteger(ageNum)) {
    return { isValid: false, error: 'Idade deve ser um número inteiro' };
  }
  
  // Verificar faixa etária do EcoPlay (10-14 anos)
  if (ageNum < 10) {
    return { isValid: false, error: 'Você deve ter pelo menos 10 anos para usar o EcoPlay' };
  }
  
  if (ageNum > 14) {
    return { isValid: false, error: 'O EcoPlay é destinado para crianças de 10 a 14 anos' };
  }
  
  return { isValid: true };
};

/**
 * Sanitiza e valida dados de entrada gerais
 * @param {string} input - Input a ser sanitizado
 * @param {number} maxLength - Comprimento máximo permitido
 * @returns {object} - { isValid: boolean, sanitized: string, error?: string }
 */
export const sanitizeInput = (input, maxLength = 255) => {
  if (input === null || input === undefined) {
    return { isValid: true, sanitized: '' };
  }
  
  if (typeof input !== 'string') {
    return { isValid: false, error: 'Input deve ser uma string' };
  }
  
  // Remover espaços extras e caracteres de controle
  let sanitized = input.trim().replace(/[^\x20-\x7E\u00A0-\u00FF]/g, ''); // Apenas caracteres visíveis
  
  // Limitar comprimento
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Escapar caracteres HTML para prevenir XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  return { isValid: true, sanitized };
};

/**
 * Valida UUID format
 * @param {string} uuid - UUID a ser validado
 * @returns {boolean} - true se válido
 */
export const validateUUID = (uuid) => {
  if (!uuid || typeof uuid !== 'string') return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};