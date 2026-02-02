const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    // Direct fetch because the SDK might abstract this differently or I want raw output
    // Actually, let's try to use the SDK if possible, but the SDK doesn't always expose listModels easily on the client object in early versions.
    // The REST API is https://generativelanguage.googleapis.com/v1beta/models?key=API_KEY

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        if (!response.ok) {
            console.error('Failed to list models:', response.status, await response.text());
            return;
        }
        const data = await response.json();
        console.log('Available Models:', data.models.map(m => m.name));
    } catch (err) {
        console.error('Error:', err);
    }
}

listModels();
