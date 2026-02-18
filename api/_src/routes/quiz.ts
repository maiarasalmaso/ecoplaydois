import { Router } from 'express';
import axios from 'axios';

const router = Router();

// Configuration
// TODO: Move this key to an environment variable in Vercel for security!
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Helper to sanitize JSON
const cleanAndParse = (text: string) => {
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(json)?/, '').replace(/```$/, '');
    }
    return JSON.parse(jsonStr);
};

// Helper to safely log errors
const safeErrorLog = (err: any) => {
    const status = err?.response?.status;
    const message = err?.message || 'Unknown error';
    console.error(`[QuizAPI] Error Details - Status: ${status}, Message: ${message}`);
    if (err?.response?.data) {
        console.error('[QuizAPI] Response Data:', JSON.stringify(err.response.data).substring(0, 200));
    }
};

router.post('/generate', async (req, res) => {
    const { age, topic = 'sustentabilidade e energia renovável', count = 3 } = req.body;

    // Check if key is available (it is hardcoded above as fallback, but good practice to check)
    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: 'Config Error', message: 'API Key missing' });
    }

    try {
        console.log(`[QuizAPI] Generating quiz (Groq) for age: ${age}, topic: ${topic}`);

        const safeAge = parseInt(age) || 12;
        const safeCount = Math.min(Math.max(parseInt(count) || 3, 1), 10);

        const systemPrompt = `
        Você é o Professor Eco, o professor mais animado do Antigravity! 
        Ensine sobre ENERGIA RENOVÁVEL para crianças de ${safeAge} anos.
        
        Objetivo: Criar um quiz com ${safeCount} perguntas sobre "${topic}".
        
        Regras:
        - Tema: ENERGIA RENOVÁVEL.
        - 4 alternativas (A, B, C, D) por pergunta.
        - Resposta correta aleatória.
        - JSON puro (SEM markdown, SEM \`\`\`json).
        - Responda APENAS com o JSON Array.
        
        JSON Schema:
        [
          {
            "pergunta": "...",
            "alternativas": ["A) ...", "B) ...", "C) ...", "D) ..."],
            "resposta_correta": "A",
            "explicacao_divertida": "..."
          }
        ]
        `;

        const response = await axios.post(GROQ_API_URL, {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Gere ${safeCount} perguntas agora.` }
            ],
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: "json_object" }
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const content = response.data.choices[0]?.message?.content;

        if (!content) {
            throw new Error('No content received from Groq/Llama');
        }

        console.log('[QuizAPI] Raw response length:', content.length);

        let questions;
        try {
            // Check if response is wrapped in an object key like "questions" (sometimes happens with json_object mode)
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                questions = parsed;
            } else if (parsed.questions && Array.isArray(parsed.questions)) {
                questions = parsed.questions;
            } else if (parsed.quiz && Array.isArray(parsed.quiz)) {
                questions = parsed.quiz;
            } else {
                // Try to find array in object values
                const values = Object.values(parsed);
                const arrayVal = values.find(v => Array.isArray(v));
                if (arrayVal) {
                    questions = arrayVal;
                } else {
                    questions = [parsed]; // fallback if single object
                }
            }
        } catch (e) {
            console.error('[QuizAPI] JSON Parse failed:', e);
            // Aggressive cleanup attempt
            const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
            questions = JSON.parse(clean);
        }

        if (!Array.isArray(questions)) {
            // Create array if single object
            if (questions && typeof questions === 'object') {
                questions = [questions];
            } else {
                throw new Error('Format Error: Response is not an array');
            }
        }

        // Map fields
        const mappedQuestions = questions.map((q: any, idx: number) => {
            let correctIndex = 0;
            const letter = (q.resposta_correta || q.correct || 'A').toString().toUpperCase().trim().charAt(0);

            if (letter === 'B') correctIndex = 1;
            else if (letter === 'C') correctIndex = 2;
            else if (letter === 'D') correctIndex = 3;
            else correctIndex = 0;

            return {
                id: `ai_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
                question: q.pergunta || q.question,
                options: q.alternativas || q.options || [],
                correct: correctIndex,
                explanation: q.explicacao_divertida || q.explanation
            };
        });

        res.json(mappedQuestions);

    } catch (error: any) {
        console.error('[QuizAPI] Critical error (Groq):');
        safeErrorLog(error);
        res.status(500).json({
            error: 'Server Error',
            message: error.response?.data?.error?.message || error.message || 'Falha na IA',
        });
    }
});

router.post('/tip', async (req, res) => {
    try {
        const prompt = `Gere uma dica curta e criativa sobre sustentabilidade para crianças. Máximo 15 palavras.`;

        const response = await axios.post(GROQ_API_URL, {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "Você é o Professor Eco. Dê uma dica rápida." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 50
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const tip = response.data.choices[0]?.message?.content?.trim();
        res.json({ tip });

    } catch (error: any) {
        console.error('[QuizAPI] Tip generation failed:', error.message);
        res.status(500).json({ error: 'Generation Failed', message: 'Failed to generate tip' });
    }
});

export default router;
