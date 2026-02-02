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
  
  // Verificar se não está vazio após sanitização
  if (!sanitized) {
    return { isValid: false, error: 'Nome inválido após sanitização' };
  }
  
  // Verificar se não contém apenas números ou caracteres especiais
  if (/^[0-9\W_]+$/.test(sanitized)) {
    return { isValid: false, error: 'Nome deve conter letras' };
  }
  
  // Verificar palavras suspeitas ou inapropriadas (lista básica)
  const suspiciousWords = ['admin', 'root', 'test', 'user', 'guest', 'anonymous'];
  const lowerSanitized = sanitized.toLowerCase();
  if (suspiciousWords.some(word => lowerSanitized.includes(word))) {
    return { isValid: false, error: 'Nome contém termos não permitidos' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Valida senha seguindo requisitos de segurança
 * @param {string} password - Senha a ser validada
 * @returns {object} - { isValid: boolean, error?: string }
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Senha é obrigatória' };
  }
  
  // Verificar comprimento mínimo
  if (password.length < 8) {
    return { isValid: false, error: 'Senha deve ter pelo menos 8 caracteres' };
  }
  
  // Verificar comprimento máximo
  if (password.length > 128) {
    return { isValid: false, error: 'Senha não pode ter mais de 128 caracteres' };
  }
  
  // Verificar complexidade
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase) {
    return { isValid: false, error: 'Senha deve conter pelo menos uma letra maiúscula' };
  }
  
  if (!hasLowerCase) {
    return { isValid: false, error: 'Senha deve conter pelo menos uma letra minúscula' };
  }
  
  if (!hasNumbers) {
    return { isValid: false, error: 'Senha deve conter pelo menos um número' };
  }
  
  if (!hasSpecialChar) {
    return { isValid: false, error: 'Senha deve conter pelo menos um caractere especial' };
  }
  
  // Verificar sequências comuns
  const commonSequences = ['123', 'abc', 'qwe', 'password', 'senha'];
  const lowerPassword = password.toLowerCase();
  if (commonSequences.some(seq => lowerPassword.includes(seq))) {
    return { isValid: false, error: 'Senha muito comum ou previsível' };
  }
  
  // Verificar espaços em branco
  if (password.includes(' ')) {
    return { isValid: false, error: 'Senha não pode conter espaços em branco' };
  }
  
  return { isValid: true };
};

/**
 * Valida idade para o sistema
 * @param {number|string} age - Idade a ser validada
 * @returns {object} - { isValid: boolean, error?: string }
 */
export const validateAge = (age) => {
  if (age === null || age === undefined || age === '') {
    return { isValid: false, error: 'Idade é obrigatória' };
  }
  
  // Converter para número se for string
  const ageNum = typeof age === 'string' ? parseInt(age, 10) : age;
  
  // Verificar se é número válido
  if (isNaN(ageNum) || !isFinite(ageNum)) {
    return { isValid: false, error: 'Idade deve ser um número válido' };
  }
  
  // Verificar faixa etária permitida (10-14 anos para o sistema)
  if (ageNum < 10) {
    return { isValid: false, error: 'Idade mínima é 10 anos' };
  }
  
  if (ageNum > 14) {
    return { isValid: false, error: 'Idade máxima é 14 anos' };
  }
  
  // Verificar se é número inteiro
  if (!Number.isInteger(ageNum)) {
    return { isValid: false, error: 'Idade deve ser um número inteiro' };
  }
  
  return { isValid: true, age: ageNum };
};

/**
 * Sanitiza entrada de texto para prevenir XSS e injeção de código
 * @param {string} input - Texto a ser sanitizado
 * @returns {string} - Texto sanitizado
 */
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remover tags HTML
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Escapar caracteres especiais
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Remover espaços em branco no início e fim
  sanitized = sanitized.trim();
  
  // Limitar comprimento
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  
  // Remover caracteres de controle
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  return sanitized;
};

/**
 * Valida um nome de usuário completo (nome e sobrenome)
 * @param {string} fullName - Nome completo
 * @returns {object} - { isValid: boolean, error?: string }
 */
export const validateFullName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') {
    return { isValid: false, error: 'Nome completo é obrigatório' };
  }
  
  const sanitized = fullName.trim();
  
  if (sanitized.length < 3) {
    return { isValid: false, error: 'Nome completo muito curto' };
  }
  
  if (sanitized.length > 200) {
    return { isValid: false, error: 'Nome completo muito longo' };
  }
  
  // Verificar se tem pelo menos 2 palavras (nome e sobrenome)
  const words = sanitized.split(/\s+/);
  if (words.length < 2) {
    return { isValid: false, error: 'Por favor, forneça nome e sobrenome' };
  }
  
  // Verificar se cada palavra tem pelo menos 2 caracteres
  if (words.some(word => word.length < 2)) {
    return { isValid: false, error: 'Cada parte do nome deve ter pelo menos 2 caracteres' };
  }
  
  // Verificar se contém apenas letras, espaços e caracteres acentuados comuns
  if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(sanitized)) {
    return { isValid: false, error: 'Nome deve conter apenas letras e espaços' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Verifica se uma string contém apenas caracteres alfanuméricos e espaços
 * @param {string} str - String a ser verificada
 * @returns {boolean} - true se for alfanumérica com espaços
 */
export const isAlphanumericWithSpaces = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^[a-zA-Z0-9\s]+$/.test(str.trim());
};

/**
 * Remove emojis de uma string
 * @param {string} str - String com possíveis emojis
 * @returns {string} - String sem emojis
 */
export const removeEmojis = (str) => {
  if (!str || typeof str !== 'string') return '';
  
  // Regex para remover emojis (inclui uma ampla gama de emojis Unicode)
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{20E3}]/gu;
  
  return str.replace(emojiRegex, '').trim();
};