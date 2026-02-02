import { getUserForAuth, verifyPassword } from '../../src/services/netlifyDb.js';

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
    const { email, password } = data;
    if (!email || !password) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ success: false, error: 'Dados inválidos' }) };
    }
    const userForAuth = await getUserForAuth(email);
    if (!userForAuth) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ success: false, error: 'Credenciais inválidas' }) };
    }
    const ok = await verifyPassword(password, userForAuth.password_hash);
    if (!ok) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ success: false, error: 'Credenciais inválidas' }) };
    }
    const { password_hash: _, ...user } = userForAuth;
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, user }) };
  } catch (error) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ success: false, error: String(error.message || error) }) };
  }
};
