import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper to get API Key (allows mocking in tests)
const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY;

// Debug log to verify file update
console.log('✨ Gemini Service v3.0 Loaded');

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

  if (!apiKey || apiKey.includes('YOUR_KEY')) {
    throw new Error('Chave de API não configurada ou inválida');
  }

  try {
    const versions = ['v1beta', 'v1'];
    // Prioritize older stable model if flash is 404ing
    const models = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];
    let lastError;

    for (const ver of versions) {
      for (const model of models) {
        try {
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
            // Validar se é 404 silenciosamente para tentar proximo
            if (response.status === 404) {
              lastError = new Error(`Model ${model} not found (${ver})`);
              continue;
            }
            const errText = await response.text();
            console.warn(`Gemini Warning (${ver}/${model}): ${response.status} - Retrying...`);
            lastError = new Error(`HTTP error! status: ${response.status}`);
            continue;
          }

          const data = await response.json();
          if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            lastError = new Error('Resposta inválida da API');
            continue;
          }
          return data.candidates[0].content.parts[0].text;

        } catch (e) {
          // console.warn(`Gemini Attempt Failed (${ver}/${model})`);
          lastError = e;
        }
      }
    }
    console.error('All Gemini attempts failed.');
    throw lastError || new Error('Falha ao chamar API Gemini');

  } catch (error) {
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
    // console.warn('Aviso: Falha na chamada OpenAI (usando fallback):', error.message);
    throw error;
  }
};

export const generateQuizQuestions = async (age, topic = 'sustentabilidade e ecologia', count = 5, bypassCache = false) => {
  console.group('🤖 Gemini Service Debug');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Params:', { age, topic, count, bypassCache });
  const apiKey = getApiKey();
  console.log('API Key Configured:', !!apiKey);

  // 1. Cache (Skip if bypassCache is true)
  if (!bypassCache) {
    const cached = getCachedQuestions(age, topic, count);
    if (cached && cached.length >= Number(count || 0)) {
      console.log('📦 Using cached questions:', cached.length);
      console.groupEnd();
      return { success: true, questions: cached.slice(0, count), source: 'cache' };
    }
  } else {
    console.log('🔄 Bypassing cache for fresh questions');
  }

  // 2. Validate API Key
  if (!apiKey) {
    console.warn('❌ Gemini API Key is missing.');
    console.groupEnd();
    return { success: false, questions: FALLBACK_QUESTIONS, source: 'fallback', error: 'Chave de API não configurada. Adicione VITE_GEMINI_API_KEY ao arquivo .env' };
  }

  try {
    // 3. Adiciona seed para garantir aleatoriedade real
    const seed = Date.now() + Math.random();
    const usedSet = getUsedSet(age, topic);
    const avoidList = Array.from(usedSet).slice(-15); // Aumentado histórico

    // --- LÓGICA DE APRENDIZADO ADAPTATIVO ---
    const outcomes = readJson(OUTCOME_KEY) || [];
    // Pegar erros recentes (últimos 20) para essa idade
    const recentErrors = outcomes
      .filter(o => o.correct === false && Math.abs((o.age || 0) - age) <= 2)
      .slice(-20)
      .map(o => o.questionId); // Se tivéssemos o texto salvo seria melhor, mas o ID serve se mantivermos cache. 
    // Na verdade, o `recordQuestionOutcome` salva o ID. Sem o texto do erro, é difícil.
    // Vamos melhorar: O `recordQuestionOutcome` já deve estar sendo chamado com meta-dados ou precisamos ler do cache de perguntas.
    // Como simplificação eficaz: Vamos pedir para a IA focar em "conceitos fundamentais" se detectar muitos erros gerais,
    // ou podemos passar o TEMA como reforço.

    // Melhoria: Vamos ler as perguntas falhadas do cache se possível, ou apenas instruir reforço geral.
    // Dado o tempo, vamos instruir a IA a aumentar a clareza se houver muitos erros recentes.
    const errorRate = outcomes.slice(-10).filter(o => o.correct === false).length / 10;
    const adaptiveInstruction = errorRate > 0.4
      ? "O aluno está com dificuldades. Foco em explicar conceitos fundamentais com muita clareza e exemplos práticos. Reduza levemente a complexidade das perguntas para construir confiança."
      : "O aluno está indo bem. Pode introduzir 1 ou 2 perguntas mais desafiadoras para testar o conhecimento profundo.";

    const ageGuidance = age <= 10
      ? 'Use linguagem simples, concreta, frases curtas e exemplos do cotidiano infantil.'
      : age <= 12
        ? 'Use linguagem clara, introduza conceitos básicos com exemplos acessíveis.'
        : age <= 14
          ? 'Use linguagem mais elaborada, explore conceitos intermediários e impactos ambientais.'
          : 'Use linguagem apropriada para o nível indicado.';

    // 4. Construct Prompt
    const prompt = `
      ATENÇÃO: Você é um professor especialista em educação ambiental.
      Crie ${count} perguntas de quiz de múltipla escolha para uma criança de ${age} anos sobre o tema "${topic}".
      
      REQUISITOS OBRIGATÓRIOS:
      1. ORTOGRAFIA E GRAMÁTICA: Devem ser IMPECÁVEIS. Verifique acentuação, concordância e pontuação.
      2. ADEQUAÇÃO: ${ageGuidance}
      3. ADAPTAÇÃO: ${adaptiveInstruction}
      4. DIVERSIDADE: Evite perguntas repetitivas ou muito similares às seguintes: ${JSON.stringify(avoidList)}
      5. FORMATO: Retorne APENAS um JSON válido.
      6. Seed de aleatoriedade: ${seed}

      Retorne APENAS um JSON válido com o seguinte formato, sem markdown ou explicações adicionais:
      [
        {
          "id": "unique_id",
          "question": "Texto da pergunta (Verifique ortografia!)",
          "options": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
          "correct": 0, // Índice da resposta correta (0-3)
          "explanation": "Breve explicação educativa sobre a resposta correta"
        }
      ]
      
      Evite perguntas muito longas.
    `;
    console.log('📝 Prompt sent:', prompt.trim().substring(0, 100) + '...');

    // 5. Generate Content
    console.log('⏳ Waiting for API response...');
    const start = Date.now();
    const text = await callGeminiAPI(prompt);
    const elapsed = Date.now() - start;
    console.log(`✅ Response received in ${elapsed}ms`);
    console.log('📦 Raw response length:', text.length);

    // 6. Parse JSON safely
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    let questions;
    try {
      questions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.log('Bad content:', cleanedText);
      updateMetrics({ success: false, responseMs: elapsed, error: 'parse_error' });
      throw new Error('Falha ao processar resposta da IA');
    }

    // 7. Validate Structure
    const validQuestions = (Array.isArray(questions) ? questions : []).filter(q =>
      q.question &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correct === 'number' &&
      q.explanation
    );

    if (validQuestions.length === 0) {
      updateMetrics({ success: false, responseMs: elapsed, error: 'invalid_structure' });
      throw new Error('Nenhuma pergunta válida gerada');
    }

    // 8. Filtrar repetidas pelo histórico (não repetir por sessão e por idade)
    const filtered = validQuestions.filter(q => !usedSet.has(norm(q.question)));
    let out = filtered.slice(0, count);

    // 9. Se faltar, tentar uma segunda geração com avoidList expandida
    if (out.length < count && GEMINI_CONFIG.MAX_RETRIES > 0) {
      console.log('⚠️ Not enough unique questions, retrying...');
      const remaining = count - out.length;
      const avoidExpanded = Array.from(new Set([...avoidList, ...filtered.map(q => norm(q.question))])).slice(-20);
      const seed2 = Date.now() + Math.random();
      const prompt2 = `
        ATENÇÃO: Geração complementar.
        Crie ${remaining} novas perguntas de quiz de múltipla escolha para ${age} anos sobre "${topic}".
        Seed: ${seed2}
        Diretrizes etárias: ${ageGuidance}
        ORTOGRAFIA: Impecável.
        NÃO repita perguntas iguais ou similares a: ${JSON.stringify(avoidExpanded)}
        Formato JSON idêntico ao anterior, sem comentários.
      `;
      const start2 = Date.now();
      try {
        const text2 = await callGeminiAPI(prompt2);
        const elapsed2 = Date.now() - start2;
        let more = [];
        try {
          more = JSON.parse(text2.replace(/```json/g, '').replace(/```/g, '').trim());
        } catch {
          updateMetrics({ success: false, responseMs: elapsed2, error: 'parse_error_2' });
          more = [];
        }
        const moreValid = (Array.isArray(more) ? more : []).filter(q =>
          q?.question && Array.isArray(q?.options) && q.options.length === 4 && typeof q.correct === 'number' && q.explanation
        ).filter(q => !usedSet.has(norm(q.question)));

        out = out.concat(moreValid.slice(0, remaining));
        updateMetrics({ success: moreValid.length > 0, responseMs: elapsed2, error: moreValid.length ? null : 'empty_second_batch' });
      } catch (retryError) {
        console.error('Retry failed', retryError);
      }
    }

    // 10. Atualizar métricas, cache e histórico
    // Só atualiza cache se tivermos perguntas
    if (out.length > 0) {
      updateMetrics({ success: true, responseMs: elapsed });
      // Se bypassCache for true, nós AINDA gravamos no cache para futuras consultas (com novo timestamp), 
      // mas não lemos dele na entrada.
      setCachedQuestions(age, topic, out);
      addUsedQuestions(age, topic, out);
    }

    console.log(`✨ Successfully generated ${out.length} unique questions`);
    console.groupEnd();

    // Se ainda assim tivermos 0, lançar erro para cair no fallback
    if (out.length === 0) {
      throw new Error('Falha ao gerar perguntas únicas após retentativas');
    }

    return { success: true, questions: out, source: 'api' };

  } catch (error) {
    console.warn('⚠️ Error generating questions (using fallback):', error.message);
    try {
      const startO = Date.now();
      const textO = await callOpenAIAPI(prompt);
      const cleanedO = textO.replace(/```json/g, '').replace(/```/g, '').trim();
      let questionsO = [];
      try {
        questionsO = JSON.parse(cleanedO);
      } catch {
        throw new Error('Falha ao processar resposta da OpenAI');
      }
      const usedSet = getUsedSet(age, topic);
      const validO = (Array.isArray(questionsO) ? questionsO : []).filter(q =>
        q?.question && Array.isArray(q?.options) && q.options.length === 4 && typeof q.correct === 'number' && q.explanation
      ).filter(q => !usedSet.has(norm(q.question)));
      const outO = validO.slice(0, count);
      if (outO.length === 0) throw new Error('Nenhuma pergunta válida gerada pela OpenAI');
      setCachedQuestions(age, topic, outO);
      addUsedQuestions(age, topic, outO);
      updateMetrics({ success: true, responseMs: Date.now() - startO });
      console.groupEnd();
      return { success: true, questions: outO, source: 'openai' };
    } catch (err2) {
      console.error('OpenAI fallback failed:', err2);
      updateMetrics({ success: false, responseMs: 0, error: err2?.message });
      console.groupEnd();
      return { success: false, questions: FALLBACK_QUESTIONS, source: 'fallback', error: err2?.message || error.message };
    }
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
    // console.error('Error generating tip:', error); // Silent fallback
    try {
      const textO = await callOpenAIAPI(`
        Gere uma "Dica Rápida" ÚNICA e CRIATIVA sobre sustentabilidade, economia de energia ou ecologia para crianças.
        Máximo 15 palavras, linguagem motivadora e divertida. Apenas texto puro, sem markdown.
      `, { temperature: 0.9, max_tokens: 60 });
      return { success: true, tip: textO.trim(), source: 'openai' };
    } catch (err2) {
      // console.error('OpenAI tip fallback failed:', err2); // Silent fallback
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
