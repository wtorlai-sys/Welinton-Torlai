import { createRequire } from 'module'; import fs from 'fs'; import http from 'http'; import path from 'path';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const root = path.resolve(process.argv[2]), out = path.resolve(process.argv[3]);
const types = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(8765);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage();
p.on('console', m => console.log('page:', m.text())); p.on('pageerror', e => console.log('err:', e.message));
await p.goto('http://localhost:8765/tools/models.html'); const res = await p.evaluate(() => window.done);
if (res.error) { console.log(res.error); process.exit(1); }
for (const [k, v] of Object.entries(res)) { fs.writeFileSync(`${out}/${k}.glb`, Buffer.from(v, 'base64')); console.log(k, Buffer.from(v, 'base64').length); }
await b.close(); srv.close();
