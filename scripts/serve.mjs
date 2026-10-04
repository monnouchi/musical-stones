import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 4187);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.wav':'audio/wav', '.md': 'text/plain; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    // Mirror the GitHub Pages project prefix as well as the local root.
    if (pathname === '/musical-stones') { res.writeHead(302, { Location: '/musical-stones/' }); res.end(); return; }
    if (pathname.startsWith('/musical-stones/')) pathname = pathname.slice('/musical-stones'.length);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const segments = pathname.split('/');
    if (segments.some(s => s.startsWith('.') || s === 'node_modules' || s === 'output' || s === 'tests' || s === 'docs')) { res.writeHead(403); res.end(); return; }
    const target = path.resolve(root, '.' + pathname);
    if (!target.startsWith(root)) { res.writeHead(403); res.end(); return; }
    const content = await readFile(target);
    const headers = { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
    // Native audio needs a known length and byte seeking for its duration/controls.
    const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
    if (range) {
      const start = range[1] ? Number(range[1]) : Math.max(0, content.length - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(content.length - 1, Number(range[2])) : content.length - 1;
      if (start > end || start >= content.length) {
        res.writeHead(416, { ...headers, 'Content-Range': `bytes */${content.length}` }); res.end(); return;
      }
      res.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${content.length}` });
      res.end(content.subarray(start, end + 1)); return;
    }
    res.writeHead(200, { ...headers, 'Content-Length': content.length });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Musical Stones: http://127.0.0.1:${port}/musical-stones/`));
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use. Choose another: PORT=4188 npm start` : error.message);
  process.exitCode = 1;
});
