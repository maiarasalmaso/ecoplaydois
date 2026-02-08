import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const MAX_RETRIES = 2;

// Helper to sanitize JSON
const cleanAndParse = (text: string) => {
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(json)?/, '').replace(/```$/, '');
    }
    return JSON.parse(jsonStr);
};

router.post('/generate', async (req, res) => {
    try {
        const { age, topic = 'sustentabilidade e energia renovável', count = 5 } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is missing');
            return res.status(500).json({ error: 'Configuração de API de IA ausente no servidor. Contate o administrador.' });
        }

        // Use a configured model or default
        const modelName = "gemini-1.5-flash";
        const model = genAI.getGenerativeModel({ model: modelName });

        // Ensure age is safe
        const safeAge = parseInt(age) || 12;
        const safeCount = Math.min(Math.max(parseInt(count) || 5, 1), 10); // Clamp 1-10

        const prompt = `Gere ${safeCount} perguntas de quiz de múltipla escolha educativas e divertidas EM PORTUGUÊS DO BRASIL para uma criança de ${safeAge} anos sobre "${topic}".
    Certifique-se de que TODAS as perguntas, opções e explicações estejam em Português.
    A saída DEVE ser estritamente um JSON array válido, sem formatação Markdown ou texto adicional.
    Use o seguinte formato para cada objeto do array:
    {
      "id": number,
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct": number (0-3),
      "explanation": "string"
    }
    
    Certifique-se que o JSON é válido.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const questions = cleanAndParse(text);

        if (!Array.isArray(questions)) {
            throw new Error('Formato de resposta inválido da IA');
        }

        const questionsWithIds = questions.map((q: any, idx: number) => ({
            ...q,
            id: `ai_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`
        }));

        res.json(questionsWithIds);
    } catch (error) {
        console.error('Erro ao gerar quiz com IA:', error);
        res.status(500).json({ error: 'Falha ao gerar perguntas com IA. Tente novamente.' });
    }
});

router.post('/tip', async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'API Key missing' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const seed = Date.now();

        const prompt = `
          Gere uma "Dica Rápida" ÚNICA e CRIATIVA sobre sustentabilidade, economia de energia ou ecologia para crianças.
          A dica deve ter no máximo 15 palavras.
          Use uma linguagem motivadora, divertida e variada.
          Evite repetir dicas comuns como "apagar a luz" ou "fechar a torneira" a menos que seja muito criativo.
          NÃO use markdown. Apenas o texto puro.
          Seed de aleatoriedade: ${seed}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        res.json({ tip: text });
    } catch (error) {
        console.error('Error generating tip:', error);
        res.status(500).json({ error: 'Failed to generate tip' });
    }
});

export default router;
