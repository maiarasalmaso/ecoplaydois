const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

console.log('Testando API Key:', API_KEY ? 'Presente' : 'AUSENTE');

async function testGemini() {
    if (!API_KEY) {
        console.error('ERRO: GEMINI_API_KEY não encontrada no .env');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = "Diga 'Olá Mundo' em português.";
        console.log('Enviando prompt para o Gemini...');

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('SUCESSO! Resposta da IA:', text);
    } catch (error) {
        console.error('FALHA NO TESTE DA API:', error.message);
        if (error.response) {
            console.error('Detalhes:', JSON.stringify(error.response, null, 2));
        }
    }
}

testGemini();
