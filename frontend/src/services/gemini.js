import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper to get API Key (allows mocking in tests)
const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY;

export const GEMINI_CONFIG = {
  CACHE_TTL_MS: 10 * 60 * 1000, // 10 minutes
  MAX_RETRIES: 2,
  MODEL_NAME: "gemini-1.5-flash"
};

const CACHE_PREFIX = 'ecoplay.gemini.questions.';
const METRICS_KEY = 'ecoplay.gemini.metrics';
const USED_PREFIX = 'ecoplay.gemini.used.';

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

const metricsInit = () => {
  const m = readJson(METRICS_KEY);
  if (m && typeof m === 'object') return m;
  const init = {
    totalRequests: 0,
    successCount: 0,
    failureCount: 0,
    avgResponseMs: 0,
    lastResponseMs: 0,
    lastError: null
  };
  writeJson(METRICS_KEY, init);
  return init;
};

const updateMetrics = ({ success, responseMs, error }) => {
  const m = metricsInit();
  const total = (m.totalRequests || 0) + 1;
  const successes = (m.successCount || 0) + (success ? 1 : 0);
  const failures = (m.failureCount || 0) + (!success ? 1 : 0);
  const lastMs = Number(responseMs || 0);
  const avg =
    m.avgResponseMs && m.totalRequests
      ? (m.avgResponseMs * m.totalRequests + lastMs) / total
      : lastMs;
  const next = {
    totalRequests: total,
    successCount: successes,
    failureCount: failures,
    avgResponseMs: Math.round(avg),
    lastResponseMs: lastMs,
    lastError: success ? null : String(error || 'unknown')
  };
  writeJson(METRICS_KEY, next);
  return next;
};

export const getGeminiMetrics = () => metricsInit();

const cacheKey = (age, topic) => `${CACHE_PREFIX}${age}.${String(topic || '').toLowerCase()}`;
const usedKey = (age, topic) => `${USED_PREFIX}${age}.${String(topic || '').toLowerCase()}`;
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

const getCachedQuestions = (age, topic, count) => {
  const entry = readJson(cacheKey(age, topic));
  if (!entry || !Array.isArray(entry.questions)) return null;
  const expired = Date.now() - Number(entry.timestamp || 0) > GEMINI_CONFIG.CACHE_TTL_MS;
  if (expired) return null;
  if (Number(count || 0) > 0 && entry.questions.length >= count) {
    return entry.questions.slice(0, count);
  }
  return entry.questions.slice();
};

const setCachedQuestions = (age, topic, questions) => {
  if (!Array.isArray(questions) || questions.length === 0) return false;
  const key = cacheKey(age, topic);
  const prev = readJson(key);
  const merged = Array.isArray(prev?.questions) ? [...questions, ...prev.questions] : questions.slice();
  const uniqueById = [];
  const seen = new Set();
  merged.forEach((q) => {
    const id = String(q?.id || '');
    if (id && !seen.has(id)) {
      seen.add(id);
      uniqueById.push(q);
    }
  });
  return writeJson(key, { questions: uniqueById.slice(0, 25), timestamp: Date.now() });
};

const getUsedSet = (age, topic) => {
  const arr = readJson(usedKey(age, topic));
  const set = new Set(Array.isArray(arr) ? arr.map(norm) : []);
  return set;
};

const addUsedQuestions = (age, topic, questions) => {
  const key = usedKey(age, topic);
  const prev = readJson(key);
  const list = Array.isArray(prev) ? prev.slice() : [];
  const next = list.concat(
    (questions || []).map((q) => norm(q?.question))
  ).filter(Boolean);
  const unique = Array.from(new Set(next)).slice(-200);
  writeJson(key, unique);
  return unique.length;
};

// Fallback questions in case of API failure (subset of existing static data)
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
  }
];

// Serviço proxy para contornar CORS com a API do Gemini
// Usa o proxy configurado no vite.config.js
const GEMINI_PROXY_URL = '/api/gemini';
const OPENAI_PROXY_URL = '/api/openai/chat';

const callGeminiAPI = async (prompt, modelName = GEMINI_CONFIG.MODEL_NAME) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('Chave de API não configurada');
  }

  try {
    const versions = ['v1beta', 'v1'];
    // Update model list to include more variants that might be active
    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro'];
    let lastError;
    for (const ver of versions) {
      for (const model of models) {
        try {
          console.log('🔎 Gemini attempt:', { ver, model });
          const response = await fetch(`${GEMINI_PROXY_URL}/${ver}/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [{
                  text: prompt
                }]
              }]
            })
          });
          if (!response.ok) {
            lastError = new Error(`HTTP error! status: ${response.status}`);
            continue;
          }
          const data = await response.json();
          return data.candidates[0].content.parts[0].text;
        } catch (e) {
          lastError = e;
          continue;
        }
      }
    }
    throw lastError || new Error('Falha ao chamar API Gemini');

  } catch (error) {
    console.error('Erro na chamada da API Gemini:', error);
    throw error;
  }
};

const callOpenAIAPI = async (prompt, opts = {}) => {
  try {
    const response = await fetch(OPENAI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model: opts.model || 'gpt-4o-mini',
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.max_tokens ?? 1024
      })
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return String(data?.text || '');
  } catch (error) {
    console.error('Erro na chamada da API OpenAI:', error);
    throw error;
  }
};




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

// Function to pre-fetch next batch (optimization)
export const prefetchQuestions = (age, topic) => {
  generateQuizQuestions(age, topic).catch(err => console.error('Prefetch failed', err));
};

// Qualidade das perguntas baseada no uso (proxy de qualidade sem alterar UI)
const OUTCOME_KEY = 'ecoplay.gemini.outcomes';
export const recordQuestionOutcome = ({ questionId, age, correct }) => {
  try {
    const prev = readJson(OUTCOME_KEY);
    const next = Array.isArray(prev) ? prev.slice() : [];
    next.push({
      at: new Date().toISOString(),
      questionId: String(questionId || ''),
      age: Number(age || 0),
      correct: Boolean(correct)
    });
    writeJson(OUTCOME_KEY, next.slice(-2000));
    return true;
  } catch {
    return false;
  }
};

export const generateEcoTip = async () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    const tips = [
      "Desligar a luz ao sair do quarto economiza energia e ajuda o planeta!",
      "Prefira lâmpadas LED, elas gastam menos e duram mais.",
      "Tome banhos rápidos para economizar água e energia.",
      "Aproveite a luz natural do dia abrindo as janelas.",
      "Desligue aparelhos da tomada quando não estiverem em uso."
    ];
    return { success: true, tip: tips[Math.floor(Math.random() * tips.length)], source: 'fallback' };
  }

  try {
    const seed = Date.now() + Math.random();

    const prompt = `
      Gere uma "Dica Rápida" ÚNICA e CRIATIVA sobre sustentabilidade, economia de energia ou ecologia para crianças.
      A dica deve ter no máximo 15 palavras.
      Use uma linguagem motivadora, divertida e variada.
      Evite repetir dicas comuns como "apagar a luz" ou "fechar a torneira" a menos que seja muito criativo.
      Não use markdown. Apenas o texto puro.
      Seed de aleatoriedade: ${seed}
    `;

    const text = await callGeminiAPI(prompt);

    return { success: true, tip: text.trim(), source: 'api' };
  } catch (error) {
    console.error('Error generating tip:', error);
    try {
      const textO = await callOpenAIAPI(`
        Gere uma "Dica Rápida" ÚNICA e CRIATIVA sobre sustentabilidade, economia de energia ou ecologia para crianças.
        Máximo 15 palavras, linguagem motivadora e divertida. Apenas texto puro, sem markdown.
      `, { temperature: 0.9, max_tokens: 60 });
      return { success: true, tip: textO.trim(), source: 'openai' };
    } catch (err2) {
      console.error('OpenAI tip fallback failed:', err2);
    }
    // Lista expandida de fallbacks para garantir variedade mesmo sem IA
    const fallbackTips = [
      "Plante uma árvore e ajude a limpar o ar que respiramos!",
      "Separe o lixo reciclável do orgânico para ajudar a natureza.",
      "Use a água da chuva para regar as plantas do jardim.",
      "Troque sacolas plásticas por sacolas retornáveis ao fazer compras.",
      "Desligar a torneira enquanto escova os dentes economiza muita água!",
      "Prefira brinquedos feitos de materiais reciclados ou madeira.",
      "Doe roupas e brinquedos que não usa mais em vez de jogar fora.",
      "Caminhe ou use bicicleta para ir a lugares perto de casa.",
      "Evite canudos de plástico, eles poluem os oceanos.",
      "Apague a luz se o sol estiver iluminando o quarto!"
    ];
    return {
      success: false,
      tip: fallbackTips[Math.floor(Math.random() * fallbackTips.length)],
      source: 'error_fallback'
    };
  }
};
