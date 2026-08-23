import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { root, run } from './util.mjs';

const requestedMode = process.argv[2] ?? 'web';
const mode = requestedMode === 'engine' ? 'engine' : requestedMode === 'editor' ? 'editor' : 'web';
const noBuild = process.argv.includes('--no-build');
if (!noBuild) run(process.execPath, ['tools/scripts/build.mjs']);
const base = path.join(root, mode === 'engine' ? 'dist/engine-playground' : 'dist/web');
const port = Number(process.env.PORT ?? (mode === 'engine' ? 5174 : mode === 'editor' ? 5175 : 5173));
const mime = new Map([
  ['.html','text/html; charset=utf-8'], ['.js','text/javascript; charset=utf-8'], ['.mjs','text/javascript; charset=utf-8'],
  ['.css','text/css; charset=utf-8'], ['.json','application/json; charset=utf-8'], ['.png','image/png'],
  ['.mid','audio/midi'], ['.map','application/json; charset=utf-8'], ['.svg','image/svg+xml']
]);

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0] || '/');
  const candidate = path.resolve(base, `.${decoded}`);
  if (candidate !== base && !candidate.startsWith(base + path.sep)) return null;
  return candidate;
}

const server = http.createServer((req, res) => {
  const requestPath = req.url ?? '/';
  let file = safePath(requestPath);
  if (!file) { res.writeHead(400); res.end('Bad path'); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    if (mode !== 'engine') file = path.join(base, 'index.html');
    else { res.writeHead(404); res.end('Not found'); return; }
  }
  const type = mime.get(path.extname(file).toLowerCase()) ?? 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
server.listen(port, '0.0.0.0', () => {
  const label = mode === 'engine' ? 'Engine playground' : mode === 'editor' ? 'Editor' : 'Web UI';
  const suffix = mode === 'editor' ? '/edit' : '';
  console.log(`${label}: http://localhost:${port}${suffix}`);
  console.log('Press Ctrl+C to stop.');
});
