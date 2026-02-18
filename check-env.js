
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.development.local');
console.log(`Loading env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.log("Could not load .env.development.local");
    dotenv.config(); // fallback
}

const apiUrl = process.env.VITE_API_URL;
const geminiKey = process.env.GEMINI_API_KEY;

console.log("VITE_API_URL:", apiUrl || "Not set (defaulting to localhost:3000)");
console.log("GEMINI_API_KEY:", geminiKey ? "Set (starts with " + geminiKey.substring(0, 5) + ")" : "MISSING");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "MISSING");
