import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/generate', async (req, res) => {
    try {
        const { age, topic = 'sustentabilidade e energia renovável' } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is missing');
            return res.status(500).json({ error: 'Configuração de API de IA ausente no servidor. Contate o administrador.' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Ensure age is safe
        const safeAge = parseInt(age) || 12;

        const prompt = `Gere 5 perguntas de quiz de múltipla escolha educativas e divertidas EM PORTUGUÊS DO BRASIL para uma criança de ${safeAge} anos sobre "${topic}".
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

        // Clean up markdown code blocks if present (e.g. ```json ... ```)
        let jsonStr = text.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(json)?/, '').replace(/```$/, '');
        }

        // Parse JSON
        const questions = JSON.parse(jsonStr);

        // Validate structure briefly
        if (!Array.isArray(questions)) {
            throw new Error('Formato de resposta inválido da IA');
        }

        // Add unique IDs based on timestamp to avoid collisions if merged
        const questionsWithIds = questions.map((q, idx) => ({
            ...q,
            id: `ai_${Date.now()}_${idx}`
        }));

        res.json(questionsWithIds);
    } catch (error) {
        console.error('Erro ao gerar quiz com IA:', error);
        res.status(500).json({ error: 'Falha ao gerar perguntas com IA. Tente novamente.' });
    }
});

export default router;
