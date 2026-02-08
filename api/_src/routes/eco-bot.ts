import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Clean JSON helper
const cleanAndParse = (text: string) => {
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(json)?/, '').replace(/```$/, '');
    }
    return JSON.parse(jsonStr);
};

router.post('/chat', async (req, res) => {
    try {
        const { message, assistantAge = 12, quizContext } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Chave de API do Gemini não configurada.' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let systemPrompt = '';

        // MODO 1: Feedback de Quiz (RAG - Contexto Específico)
        if (quizContext) {
            const { question, userAnswer, correctAnswer, options } = quizContext;

            systemPrompt = `
🎯 PROMPT ENGENHADO: Ecoquiz – Feedback de Erro em Quiz (Múltipla Escolha)
👤 Persona
Você é o EcoBot, um tutor ambiental sábio e amigável; calibrado para uma criança de ${assistantAge} anos.

compass Tarefa (RAG - Contexto do Quiz)
O usuário errou uma questão de múltipla escolha.
- Pergunta: "${question}"
- Resposta do Usuário (Errada): "${userAnswer}"
- Resposta Correta: "${correctAnswer}"
- Outras Opções: ${JSON.stringify(options)}

Seu objetivo é explicar POR QUE a resposta do usuário está incorreta (ou menos adequada) e POR QUE a resposta correta é a certa, de forma encorajadora.

🧾 Formato Esperado (JSON ESTRITO)
{
  "errorType": "Erro de Quiz",
  "ageLevel": "${assistantAge} anos",
  "response": "Explicação direta e amigável. Comece validando a tentativa (ex: 'Boa tentativa, mas...'). Explique o conceito errado e depois o certo.",
  "correctionGuide": ["Dica curta para lembrar na próxima"],
  "improvementTips": ["Conceito relacionado para estudar"]
}

Gere APENAS o JSON.
`;
        }
        // MODO 2: Chat Geral (Prompt Original)
        else {
            if (!message) {
                return res.status(400).json({ error: 'Mensagem do usuário é obrigatória para chat geral.' });
            }

            systemPrompt = `
🎯 PROMPT ENGENHADO: Ecoquiz – Resposta orientada a erro e idade
👤 Persona
Você é o engenheiro de prompts para Ecoquiz; calibrado pela idade simbólica do assistente (${assistantAge} anos); adaptando tom e profundidade conforme o erro e a idade.

🧭 Rotina
Diante de uma pergunta com erro ou feedback, gerar uma resposta que:
1. Reconheça e classifique o erro do usuário.
2. Adapte o nível de detalhe com base na idade simulada (${assistantAge} anos).
3. Ofereça correção clara, passos para recompor a pergunta e uma resposta útil ao tema ambiental.

🧾 Formato Esperado (JSON ESTRITO)
{
  "errorType": "string (ex: erro de entrada, ambiguidade, erro conceitual)",
  "ageLevel": "string (ex: jovem/ensino fundamental; adulto; sênior)",
  "response": "string (A resposta principal com linguagem apropriada para a idade ${assistantAge})",
  "correctionGuide": ["passo 1", "passo 2"],
  "improvementTips": ["dica 1", "dica 2"]
}

INPUT DO USUÁRIO: "${message}"

Gere APENAS o JSON de resposta.
`;
        }

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        try {
            const parsedResponse = cleanAndParse(text);
            res.json(parsedResponse);
        } catch (e) {
            console.error('Falha ao parsear JSON do Gemini:', text);
            // Fallback content in case of JSON error
            res.json({
                errorType: 'Erro de processamento',
                ageLevel: 'N/A',
                response: text, // Return raw text if JSON fails
                correctionGuide: [],
                improvementTips: []
            });
        }

    } catch (error) {
        console.error('Erro no endpoint /api/eco-bot/chat:', error);
        res.status(500).json({ error: 'Erro interno ao processar resposta do assistente.' });
    }
});

export default router;
