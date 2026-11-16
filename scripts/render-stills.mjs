// Renderiza stills de QC: node scripts/render-stills.mjs [compId] [frames...]
// Ex.: node scripts/render-stills.mjs TestScene 0 45 90
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [, , compId = 'TestScene', ...rest] = process.argv;
const frames = rest.length ? rest.map(Number) : [0, 45, 90];
const outDir = path.resolve('out/stills');
fs.mkdirSync(outDir, {recursive: true});

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const chromiumOptions = {gl: 'swangle'};
const browserExecutable = '/opt/pw-browsers/chromium';
const composition = await selectComposition({serveUrl, id: compId, chromiumOptions, browserExecutable});
for (const frame of frames) {
	const output = path.join(outDir, `${compId}_${String(frame).padStart(3, '0')}.png`);
	const t0 = performance.now();
	await renderStill({composition, serveUrl, frame, output, chromiumOptions, browserExecutable, timeoutInMilliseconds: 240000, onBrowserLog: (l) => (process.env.VERBOSE || l.type === 'error') && console.log('[browser]', l.type, l.text.slice(0, 1500))});
	console.log(`ok ${output} (${((performance.now() - t0) / 1000).toFixed(1)} s)`);
}
