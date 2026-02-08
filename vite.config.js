import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { securityHeadersPlugin } from './vite.security.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Inline proxy plugin for OpenAI to avoid exposing API key in the browser
const openaiProxyPlugin = (openaiKey) => {
  return {
    name: 'openai-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          if (req.url?.startsWith('/api/openai/chat')) {
            const key = openaiKey || '';
            if (!key) {
              res.statusCode = 503;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: "OpenAI API Key not configured" }));
              return;
            }
            let raw = '';
            req.on('data', (chunk) => { raw += chunk; });
            req.on('end', async () => {
              let payload = {};
              try {
                payload = raw ? JSON.parse(raw) : {};
              } catch {
                payload = {};
              }
              const prompt = String(payload.prompt || '');
              const model = String(payload.model || 'gpt-4o-mini');
              const temperature = Number(payload.temperature ?? 0.7);
              const max_tokens = Number(payload.max_tokens ?? 1024);
              const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${key}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model,
                  temperature,
                  max_tokens,
                  messages: [
                    { role: 'system', content: 'Você é um educador ambiental. Responda em português do Brasil.' },
                    { role: 'user', content: prompt }
                  ]
                })
              });
              if (!response.ok) {
                res.statusCode = response.status;
                const errText = await response.text().catch(() => '');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'OpenAI HTTP error', status: response.status, body: errText }));
                return;
              }
              const data = await response.json();
              const text = String(data?.choices?.[0]?.message?.content || '');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ text }));
            });
            return;
          }
        } catch (e) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Falha no proxy OpenAI', detail: String(e) }));
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => next());
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const cwd = globalThis.process?.cwd?.() || ''
  const env = loadEnv(mode, cwd, '')
  const openaiKey = env.OPENAI_API_KEY || ''
  return {
    plugins: [
      react(),
      tailwindcss(),
      securityHeadersPlugin(),
      openaiProxyPlugin(openaiKey),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@types': path.resolve(__dirname, './src/types'),
        '@utils': path.resolve(__dirname, './src/utils'),
      }
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api/gemini': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/gemini/, ''),
          secure: true,
        },
        '/auth': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/users': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/games': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            if (req.headers.accept && req.headers.accept.includes('text/html')) {
              return req.url;
            }
          },
        },
        '/feedback': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/health': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/quiz': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/progress': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/api/eco-bot': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    envPrefix: ['VITE_', 'SUPABASE_'],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('react-router')) return 'vendor-router'
            if (id.includes('framer-motion')) return 'vendor-motion'
            if (id.includes('lucide-react')) return 'vendor-icons'
            if (id.includes('canvas-confetti')) return 'vendor-confetti'
            return 'vendor'
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
    },
  }
})
