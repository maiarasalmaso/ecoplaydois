import netlifyDb from '../../src/services/netlifyDb.js';

export const handler = async () => {
  try {
    await netlifyDb.initializeNetlifyDb();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: false, error: String(error.message || error) })
    };
  }
};

