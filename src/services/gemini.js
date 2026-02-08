const GEMINI_CONFIG = {
  CACHE_TTL_MS: 10 * 60 * 1000, // 10 minutes
};

const CACHE_PREFIX = 'ecoplay.gemini.questions.';

const readJson = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const cacheKey = (age, topic) => `${CACHE_PREFIX}${age}.${String(topic || '').toLowerCase()}`;

const getCachedQuestions = (age, topic, count) => {
  const entry = readJson(cacheKey(age, topic));
  if (!entry || !Array.isArray(entry.questions)) return null;
  const expired = Date.now() - Number(entry.timestamp || 0) > GEMINI_CONFIG.CACHE_TTL_MS;
  if (expired) return null;
  if (Number(count || 0) > 0 && entry.questions.length >= count) {
    // Shuffle cached questions for variety
    return entry.questions.sort(() => Math.random() - 0.5).slice(0, count);
  }
  return entry.questions.slice();
};

const setCachedQuestions = (age, topic, questions) => {
  if (!Array.isArray(questions) || questions.length === 0) return false;
  const key = cacheKey(age, topic);
  return writeJson(key, { questions: questions.slice(0, 50), timestamp: Date.now() });
};

// Fallback questions in case of API failure
const FALLBACK_QUESTIONS = [
  {
    id: 'fb1',
    question: "O que é sustentabilidade?",
    options: ["Gastar tudo agora", "Usar recursos pensando no futuro", "Não usar nada", "Vender recursos"],
    correct: 1,
    explanation: "Sustentabilidade é suprir as necessidades do presente sem comprometer as gerações futuras."
  },
  {
    id: 'fb2',
    question: "Qual energia usa o vento?",
    options: ["Solar", "Eólica", "Hídrica", "Térmica"],
    correct: 1,
    explanation: "A energia eólica é gerada a partir da força do vento."
  },
  {
    id: 'fb3',
    question: "O que é reciclagem?",
    options: ["Jogar lixo na rua", "Queimar lixo", "Reaproveitar materiais", "Enterrar lixo"],
    correct: 2,
    explanation: "Reciclagem é o processo de transformação de resíduos em novos produtos."
  },
  {
    id: 'fb4',
    question: "Qual cor da lixeira para papel?",
    options: ["Vermelho", "Azul", "Verde", "Amarelo"],
    correct: 1,
    explanation: "A lixeira azul é destinada ao descarte de papel e papelão."
  },
  {
    id: 'fb5',
    question: "O que causa o aquecimento global?",
    options: ["Plantar árvores", "Andar de bicicleta", "Excesso de gases estufa", "Usar energia solar"],
    correct: 2,
    explanation: "O acúmulo de gases como dióxido de carbono na atmosfera retém calor e causa o aquecimento global."
  }
];

export const generateQuizQuestions = async (age, topic = 'sustentabilidade e ecologia', count = 5, bypassCache = false) => {
  console.log('[GeminiService] Requesting questions:', { age, topic, count });

  // 1. Cache
  if (!bypassCache) {
    const cached = getCachedQuestions(age, topic, count);
    if (cached && cached.length >= Number(count || 0)) {
      console.log('[GeminiService] Using cached questions');
      return { success: true, questions: cached.slice(0, count), source: 'cache' };
    }
  }

  // 2. Server-side Generation
  try {
    const response = await fetch('/api/quiz/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ age, topic, count })
    });

    if (!response.ok) {
      throw new Error(`Server API error: ${response.status}`);
    }

    const questions = await response.json();

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('No questions returned from server');
    }

    // Cache results
    setCachedQuestions(age, topic, questions);

    return { success: true, questions, source: 'api' };

  } catch (error) {
    console.error('[GeminiService] Generation failed:', error);
    return { success: false, questions: FALLBACK_QUESTIONS, source: 'fallback', error: error.message };
  }
};

export const generateEcoTip = async () => {
  try {
    const response = await fetch('/api/quiz/tip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.tip) {
        return { success: true, tip: data.tip, source: 'api' };
      }
    }
  } catch (e) {
    console.warn('Failed to fetch tip from server:', e);
  }

  // Fallback
  const fallbackTips = [
    "Plante uma árvore e ajude a limpar o ar que respiramos!",
    "Separe o lixo reciclável do orgânico para ajudar a natureza.",
    "Use a água da chuva para regar as plantas do jardim.",
    "Troque sacolas plásticas por sacolas retornáveis ao fazer compras.",
    "Desligar a torneira enquanto escova os dentes economiza muita água!",
    "Apague a luz se o sol estiver iluminando o quarto!"
  ];
  return {
    success: false,
    tip: fallbackTips[Math.floor(Math.random() * fallbackTips.length)],
    source: 'fallback'
  };
};

// Deprecated/Stubbed functions for compatibility
export const prefetchQuestions = () => { };
export const recordQuestionOutcome = () => { };
export const getGeminiMetrics = () => ({});
