import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root } from './util.mjs';

const webRoot = path.join(root, 'dist/web');
if (!fs.existsSync(path.join(webRoot, 'index.html'))) throw new Error('dist/web is missing; run npm run build first');

const browser = findBrowser();
if (!browser) throw new Error('Browser smoke test requires Chrome/Chromium. Set BROWSER_PATH if it is not on PATH.');

const server = http.createServer((request, response) => serveStatic(request, response));
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

try {
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to determine smoke-test server port');
  const origin = `http://127.0.0.1:${address.port}`;
  smoke(`${origin}/`, ['class="shell"', 'class="hero"']);
  smoke(`${origin}/play/base-0-1/`, ['class="game-page"', 'id="game"']);
  console.log(`browser smoke: OK — ${path.basename(browser)} loaded home and /play/base-0-1/ from dist/web`);
} finally {
  await new Promise((resolve) => server.close(resolve));
}

function smoke(url, expectedFragments) {
  const result = spawnSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-background-networking',
    '--virtual-time-budget=4000',
    '--dump-dom',
    url
  ], {
    encoding: 'utf8',
    timeout: 20000,
    maxBuffer: 8 * 1024 * 1024
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Browser failed for ${url} (exit ${result.status})\n${result.stderr || result.stdout}`);
  }
  const output = result.stdout ?? '';
  for (const fragment of expectedFragments) {
    if (!output.includes(fragment)) {
      throw new Error(`Browser did not mount the expected app for ${url}; missing ${fragment}\n${compact(output)}\n${compact(result.stderr ?? '')}`);
    }
  }
  const fatalPatterns = [
    /Failed to resolve module specifier/i,
    /blocked by a null value/i,
    /Uncaught TypeError/i
  ];
  const diagnostics = `${result.stderr ?? ''}\n${output}`;
  const fatal = fatalPatterns.find((pattern) => pattern.test(diagnostics));
  if (fatal) throw new Error(`Browser reported a fatal module/runtime error for ${url}: ${fatal}`);
}

function serveStatic(request, response) {
  try {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    let relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    const file = path.resolve(webRoot, relative);
    const normalizedRoot = `${path.resolve(webRoot)}${path.sep}`;
    if (file !== path.resolve(webRoot) && !file.startsWith(normalizedRoot)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    response.writeHead(200, { 'content-type': contentType(file), 'cache-control': 'no-store' });
    fs.createReadStream(file).pipe(response);
  } catch (error) {
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end(String(error));
  }
}

function contentType(file) {
  switch (path.extname(file).toLowerCase()) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': case '.mjs': return 'text/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.mid': return 'audio/midi';
    default: return 'application/octet-stream';
  }
}

function findBrowser() {
  const candidates = [
    process.env.BROWSER_PATH,
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
    process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : null,
    process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : null,
    process.platform === 'win32' ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' : null
  ].filter(Boolean);
  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ['--version'], { encoding: 'utf8', timeout: 5000 });
    if (!probe.error && probe.status === 0) return candidate;
  }
  return null;
}

function compact(value) {
  return value.replace(/\s+/g, ' ').trim().slice(0, 1200);
}
