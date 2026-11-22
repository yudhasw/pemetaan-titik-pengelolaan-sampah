import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

// Load .env for local development
dotenv.config();

// Dev plugin to execute /api/*.ts endpoints during `npm run dev` without needing Vercel CLI
function vercelApiDevPlugin(): Plugin {
  return {
    name: 'vercel-api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname; // e.g. /api/locations

        let handlerModule: any;
        try {
          if (pathname === '/api/locations') {
            handlerModule = await server.ssrLoadModule('/api/locations.ts');
          } else if (pathname === '/api/login') {
            handlerModule = await server.ssrLoadModule('/api/login.ts');
          } else if (pathname === '/api/logout') {
            handlerModule = await server.ssrLoadModule('/api/logout.ts');
          } else if (pathname === '/api/session') {
            handlerModule = await server.ssrLoadModule('/api/session.ts');
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Endpoint tidak ditemukan' }));
            return;
          }

          const handler = handlerModule.default;
          if (typeof handler !== 'function') {
            throw new Error(`Handler pada ${pathname} bukan fungsi yang valid.`);
          }

          // Read body stream if method has body
          let bodyData: any = {};
          if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const rawBody = Buffer.concat(chunks).toString('utf8');
            if (rawBody.trim() !== '') {
              try {
                bodyData = JSON.parse(rawBody);
              } catch {
                bodyData = rawBody;
              }
            }
          }

          // Parse query
          const query: Record<string, string> = {};
          url.searchParams.forEach((val, key) => {
            query[key] = val;
          });

          // Mock VercelRequest & VercelResponse
          const vercelReq: any = Object.assign(req, {
            query,
            body: bodyData,
            cookies: {},
          });

          // Helper response methods
          const vercelRes: any = Object.assign(res, {
            status(code: number) {
              res.statusCode = code;
              return vercelRes;
            },
            json(payload: any) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(payload));
              return vercelRes;
            },
            send(payload: any) {
              res.end(payload);
              return vercelRes;
            },
          });

          await handler(vercelReq, vercelRes);
        } catch (err: any) {
          console.error(`[Dev API Error at ${pathname}]:`, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              error: err?.message || 'Terjadi kesalahan internal pada server pengembang.',
            }));
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), vercelApiDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './lib'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
