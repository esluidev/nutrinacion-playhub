// Prepara lab/ para servirse: copia lo que el laboratorio necesita y no se versiona aquí
// (logo, fuente, runtime de Rive y los dibujos del huevo, que viven en la librería de Player)
// y genera lab/icons.js desde ../icons.json, la única fuente de la iconografía.
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const lab = new URL('../', import.meta.url);
const ui = new URL('../../', import.meta.url);
const library = new URL('../../../../apps/player/content/library/', import.meta.url);
const require = createRequire(import.meta.url);
const riveDir = path.dirname(require.resolve('@rive-app/webgl2/package.json'));

// assets/ es solo generado: se rehace entero para que no queden copias de versiones anteriores.
await rm(new URL('assets/', lab), { recursive: true, force: true });
await mkdir(new URL('assets/mock/', lab), { recursive: true });
await mkdir(new URL('assets/rive-2.42.2/', lab), { recursive: true });

for (const file of ['nutrinacion.png', 'nutrinacion-isotipo.png']) await copyFile(new URL(`public/ui/${file}`, ui), new URL(`assets/${file}`, lab));
for (const subset of ['latin', 'latin-ext']) await copyFile(new URL(`fonts/nunito-${subset}.woff2`, ui), new URL(`assets/nunito-${subset}.woff2`, lab));
for (const file of ['rive.js', 'rive.wasm', 'rive_fallback.wasm']) await copyFile(path.join(riveDir, file), new URL(`assets/rive-2.42.2/${file}`, lab));
await copyFile(new URL('rive/aves.riv', library), new URL('assets/aves.riv', lab));
await copyFile(new URL('svg/huevo.svg', library), new URL('assets/huevo.svg', lab));
for (const name of ['huevo-gallina', 'huevo-codorniz', 'huevo-pato', 'nido', 'casa', 'tienda']) {
  await copyFile(new URL(`svg/${name}.svg`, library), new URL(`assets/mock/${name}.svg`, lab));
}

const icons = JSON.parse(await readFile(new URL('icons.json', ui), 'utf8'));
const runtime = await readFile(new URL('src/icons-runtime.js', lab), 'utf8');
await writeFile(new URL('icons.js', lab), `/* Generado por scripts/assets.mjs desde ../icons.json. No editar. */\nconst icons = ${JSON.stringify(icons, null, 2)};\n\n${runtime}`);
console.log('lab: assets e iconos listos');
