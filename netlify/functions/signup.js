import netlifyDb from '../../src/services/netlifyDb.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ success: false, error: 'Método não permitido' }) };
  }
  try {
    const data = JSON.parse(event.body || '{}');
    const { email, password, name, age } = data;
    if (!email || !password || !name || !Number.isFinite(Number(age))) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ success: false, error: 'Dados inválidos' }) };
    }
    const user = await netlifyDb.createUser({ email, password, name, age: Number(age) });
    return { statusCode: 201, headers: corsHeaders, body: JSON.stringify({ success: true, user }) };
  } catch (error) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ success: false, error: String(error.message || error) }) };
  }
};

