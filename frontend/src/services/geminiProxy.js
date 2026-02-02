// Serviço proxy para contornar CORS com a API do Gemini
// Usa o proxy configurado no vite.config.js

const GEMINI_PROXY_URL = '/api/gemini';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const generateQuizQuestionsProxy = async (age, topic = 'sustentabilidade e ecologia', count = 5) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Chave de API não configurada');
  }

  const modelName = 'gemini-1.5-flash';
  const seed = Date.now() + Math.random();
  
  const ageGuidance = age <= 10
    ? 'Use linguagem simples, concreta, frases curtas e exemplos do cotidiano infantil.'
    : age <= 12
      ? 'Use linguagem clara, introduza conceitos básicos com exemplos acessíveis.'
      : age <= 14
        ? 'Use linguagem mais elaborada, explore conceitos intermediários e impactos ambientais.'
        : 'Use linguagem apropriada para o nível indicado.';

  const prompt = `
    ATENÇÃO: Você é um professor especialista em educação ambiental.
    Crie ${count} perguntas de quiz de múltipla escolha para uma criança de ${age} anos sobre o tema "${topic}".
    
    REQUISITOS OBRIGATÓRIOS:
    1. ORTOGRAFIA E GRAMÁTICA: Devem ser IMPECÁVEIS. Verifique acentuação, concordância e pontuação.
    2. ADEQUAÇÃO: ${ageGuidance}
    3. FORMATO: Retorne APENAS um JSON válido.
    4. Seed de aleatoriedade: ${seed}

    Retorne APENAS um JSON válido com o seguinte formato, sem markdown ou explicações adicionais:
    [
      {
        "id": "unique_id",
        "question": "Texto da pergunta (Verifique ortografia!)",
        "options": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
        "correct": 0,
        "explanation": "Breve explicação educativa sobre a resposta correta"
      }
    ]
    
    Evite perguntas muito longas.
  `;

  try {
    const response = await fetch(`${GEMINI_PROXY_URL}/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Limpar e parsear JSON
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const questions = JSON.parse(cleanedText);
    
    // Validar estrutura
    const validQuestions = (Array.isArray(questions) ? questions : []).filter(q => 
      q.question && 
      Array.isArray(q.options) && 
      q.options.length === 4 && 
      typeof q.correct === 'number' && 
      q.explanation
    );

    if (validQuestions.length === 0) {
      throw new Error('Nenhuma pergunta válida gerada');
    }

    return {
      success: true,
      questions: validQuestions,
      source: 'api'
    };

  } catch (error) {
    console.error('Erro no proxy da API Gemini:', error);
    throw error;
  }
};

// Função auxiliar para gerar dicas ecológicas
export const generateEcoTipProxy = async () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    const fallbackTips = [
      "Plante uma árvore e ajude a limpar o ar que respiramos!",
      "Separe o lixo reciclável do orgânico para ajudar a natureza.",
      "Use a água da chuva para regar as plantas do jardim.",
      "Troque sacolas plásticas por sacolas retornáveis ao fazer compras.",
      "Desligar a torneira enquanto escova os dentes economiza muita água!"
    ];
    return { 
      success: false, 
      tip: fallbackTips[Math.floor(Math.random() * fallbackTips.length)], 
      source: 'error_fallback' 
    };
  }

  try {
    const modelName = 'gemini-1.5-flash';
    const seed = Date.now() + Math.random();
    
    const prompt = `
      Gere uma "Dica Rápida" ÚNICA e CRIATIVA sobre sustentabilidade, economia de energia ou ecologia para crianças.
      A dica deve ter no máximo 15 palavras.
      Use uma linguagem motivadora, divertida e variada.
      Evite repetir dicas comuns como "apagar a luz" ou "fechar a torneira" a menos que seja muito criativo.
      Não use markdown. Apenas o texto puro.
      Seed de aleatoriedade: ${seed}
    `;

    const response = await fetch(`${GEMINI_PROXY_URL}/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text.trim();
    
    return { success: true, tip: text, source: 'api' };

  } catch (error) {
    console.error('Erro ao gerar dica:', error);
    const fallbackTips = [
      "Plante uma árvore e ajude a limpar o ar que respiramos!",
      "Separe o lixo reciclável do orgânico para ajudar a natureza.",
      "Use a água da chuva para regar as plantas do jardim.",
      "Troque sacolas plásticas por sacolas retornáveis ao fazer compras.",
      "Desligar a torneira enquanto escova os dentes economiza muita água!"
    ];
    return { 
      success: false, 
      tip: fallbackTips[Math.floor(Math.random() * fallbackTips.length)], 
      source: 'error_fallback' 
    };
  }
};