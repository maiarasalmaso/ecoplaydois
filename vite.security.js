// Plugin de segurança para Vite
export function securityHeadersPlugin() {
  return {
    name: 'security-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Headers de segurança
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // Content Security Policy - permitir blob: para SharedWorker
        const csp = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
          "style-src 'self' 'unsafe-inline' https:",
          "img-src 'self' data: https:",
          "font-src 'self' https: data:",
          "connect-src 'self' http://localhost:3000 ws://localhost:3000 https://uhhjyeuirbqlespanftj.supabase.co https://*.supabase.co https://generativelanguage.googleapis.com https://api.generativeai.google.com https://api.openai.com",
          "media-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'"
        ].join('; ');

        res.setHeader('Content-Security-Policy', csp);

        // Strict Transport Security (HTTPS)
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        // Mesmos headers para preview
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        const csp = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
          "style-src 'self' 'unsafe-inline' https:",
          "img-src 'self' data: https:",
          "font-src 'self' https: data:",
          "connect-src 'self' http://localhost:3000 ws://localhost:3000 https://generativelanguage.googleapis.com https://api.generativeai.google.com https://api.openai.com",
          "media-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'"
        ].join('; ');

        res.setHeader('Content-Security-Policy', csp);
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        next();
      });
    }
  };
}
