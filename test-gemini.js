
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.development.local');
dotenv.config({ path: envPath });

if (!process.env.GEMINI_API_KEY) {
    dotenv.config();
}

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is missing!");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-8b",
        "gemini-2.0-flash", // checking if newer exists
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    console.log("🧪 Testing models...");

    for (const modelName of modelsToTry) {
        try {
            console.log(`\nAttempting model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const prompt = "Hello, are you working?";
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            console.log(`✅ SUCCESS with ${modelName}!`);
            console.log(`Response: ${text.substring(0, 50)}...`);
            return; // Exit on first success
        } catch (error) {
            console.log(`❌ Failed with ${modelName}: ${error.message.split(']')[1] || error.message}`);
        }
    }

    console.error("\n❌ All models failed.");
}

testGemini();
