/**
 * Zero-config production build using esbuild (an alternative to `vite build`).
 *
 *   node scripts/build.mjs          → builds to ./dist
 *   node scripts/build.mjs --serve  → builds, then serves ./dist on http://localhost:5173
 *
 * Produces the same multi-page output as Vite: index.html (single-page site),
 * booking.html and login.html, with code-splitting so three.js loads lazily.
 */
import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile, readdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist');
const pages = [
  { html: 'index.html', entry: 'src/main.jsx', name: 'main' },
  { html: 'booking.html', entry: 'src/booking.jsx', name: 'booking' },
  { html: 'login.html', entry: 'src/login.jsx', name: 'login' },
];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(join(root, 'public'), out, { recursive: true });

const result = await build({
  absWorkingDir: root,
  entryPoints: Object.fromEntries(pages.map((p) => [p.name, p.entry])),
  bundle: true,
  splitting: true,
  format: 'esm',
  outdir: join(out, 'assets'),
  entryNames: '[name]-[hash]',
  chunkNames: 'chunk-[hash]',
  assetNames: '[name]-[hash]',
  minify: true,
  sourcemap: false,
  target: ['es2020', 'chrome100', 'safari15', 'firefox100'],
  jsx: 'automatic',
  loader: { '.js': 'jsx', '.woff2': 'file', '.webp': 'file', '.png': 'file' },
  define: {
    'process.env.NODE_ENV': '"production"',
    'import.meta.env': JSON.stringify({ DEV: false, VITE_AUTH_LOGIN_URL: process.env.VITE_AUTH_LOGIN_URL || '', VITE_AUTH_RESET_URL: process.env.VITE_AUTH_RESET_URL || '' }),
  },
  metafile: true,
  legalComments: 'none',
  logLevel: 'warning',
});

// Map each entry to its generated JS + CSS files.
const outputs = result.metafile.outputs;
for (const page of pages) {
  const [jsFile, meta] = Object.entries(outputs).find(([, m]) => m.entryPoint === page.entry) || [];
  if (!jsFile) throw new Error(`No output for ${page.entry}`);
  const rel = (f) => './' + f.slice(f.indexOf('dist/') + 5);
  const cssFile = meta.cssBundle ? rel(meta.cssBundle) : null;
  let html = await readFile(join(root, page.html), 'utf8');
  html = html.replace(/<script type="module" src="[^"]+"><\/script>/, `<script type="module" src="${rel(jsFile)}"></script>`);
  if (cssFile) html = html.replace('</head>', `  <link rel="stylesheet" href="${cssFile}" />\n  </head>`);
  await writeFile(join(out, page.html), html);
}

const size = async (dir) => {
  let total = 0;
  for (const f of await readdir(dir)) {
    const s = await stat(join(dir, f));
    total += s.isDirectory() ? await size(join(dir, f)) : s.size;
  }
  return total;
};
const jsKb = Object.entries(outputs)
  .filter(([f]) => f.endsWith('.js'))
  .map(([f, m]) => `${f.split('/').pop()} ${(m.bytes / 1024).toFixed(0)} KB`);
console.log('Built →', jsKb.join(' · '));
console.log(`dist total: ${((await size(out)) / 1024 / 1024).toFixed(1)} MB`);

if (process.argv.includes('--serve')) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.mp4': 'video/mp4', '.svg': 'image/svg+xml' };
  createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = join(out, p);
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  }).listen(5173, () => console.log('Serving dist on http://localhost:5173'));
}
