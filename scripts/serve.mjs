import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 4187);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    // Mirror the GitHub Pages project prefix as well as the local root.
    if (pathname === '/demo5') { res.writeHead(302, { Location: '/demo5/' }); res.end(); return; }
    if (pathname.startsWith('/demo5/')) pathname = pathname.slice(6);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const segments = pathname.split('/');
    if (segments.some(s => s.startsWith('.') || s === 'node_modules' || s === 'output' || s === 'tests' || s === 'docs')) { res.writeHead(403); res.end(); return; }
    const target = path.resolve(root, '.' + pathname);
    if (!target.startsWith(root)) { res.writeHead(403); res.end(); return; }
    const content = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`おとのつづき: http://127.0.0.1:${port}/demo5/`));
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use. Choose another: PORT=4188 npm start` : error.message);
  process.exitCode = 1;
});
