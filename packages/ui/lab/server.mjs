import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
// Sirve packages/ui (el laboratorio en /lab/ y la fuente del kit en /fonts/) solo en este equipo.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4178);
const host = process.env.HOST || '127.0.0.1';
const mime = { '.wasm': 'application/wasm', '.riv': 'application/octet-stream', '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.md': 'text/plain; charset=utf-8' };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/') { res.writeHead(302, { Location: '/lab/' }).end(); return; }
    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if ((file !== root && !file.startsWith(root + path.sep)) || /(?:^|\/)(?:node_modules|\.[^/]+)/.test(path.relative(root, file))) { res.writeHead(403).end(); return; }
    const target = (await stat(file)).isDirectory() ? path.join(file, 'index.html') : file;
    res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(await readFile(target));
  } catch { res.writeHead(404).end('No encontrado'); }
}).listen(port, host, () => console.log(`PlayHub UI Kit · laboratorio en http://localhost:${port}/lab/`));
