// Minimal static file server for the QA fixtures (no deps).
// Usage: node serve.mjs <dir> <port>
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = process.argv[2] ?? 'good';
const port = Number(process.argv[3] ?? 4173);
const root = join(fileURLToPath(new URL('./', import.meta.url)), dir);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const clean = urlPath.replace(/^[/\\]+/, '');
    const rel = clean === '' || clean === '/' ? 'index.html' : clean;
    const file = join(root, rel);
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  }
});

server.listen(port, () => console.log(`fixture server: http://localhost:${port}/ (${dir})`));
