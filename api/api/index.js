/**
 * Vercel Serverless Function entry.
 *
 * Vercel tự động phát hiện file `api/index.js` và dùng làm handler.
 * Handler nhận (req, res) tương thích Express — ta mount toàn bộ app Express
 * vào một http server nhỏ cho mỗi invocation.
 */
import http from 'node:http';
import app from '../src/server.js';

const server = http.createServer(app);

export default async function handler(req, res) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, async () => {
      const { port } = server.address();
      try {
        // Chuyển tiếp request từ Vercel sang app Express
        const url = `http://127.0.0.1:${port}${req.url}`;
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = Buffer.concat(chunks);

        const headers = { ...req.headers };
        delete headers.host;
        delete headers['content-length'];

        const proxyReq = http.request(
          url,
          { method: req.method, headers: { ...headers, 'content-length': body.length } },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
            proxyRes.on('end', () => {
              server.close(() => resolve());
            });
          }
        );

        proxyReq.on('error', (err) => {
          server.close(() => reject(err));
        });

        if (body.length) proxyReq.write(body);
        proxyReq.end();
      } catch (err) {
        server.close(() => reject(err));
      }
    });
  });
}
