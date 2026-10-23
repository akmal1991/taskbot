import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { localizationVitePlugin } from './localization-vite-plugin';
import { interfaceTranslations } from '../src/utils/interfaceTranslations';
const transform = localizationVitePlugin().transform;
if (typeof transform !== 'function') throw new Error('Localization transform is unavailable.');
let errors = 0;
for (const file of [...readdirSync('src/components').filter(name => name.endsWith('.tsx')).map(name => `src/components/${name}`), 'src/App.tsx']) {
  try { (transform as Function).call({}, readFileSync(file,'utf8'), resolve(file)); }
  catch (error) { console.error((error as Error).message); errors++; }
}
for (const file of readdirSync('server').filter(name => name.endsWith('.ts') && !name.endsWith('.test.ts'))) {
  for (const match of readFileSync(`server/${file}`,'utf8').matchAll(/new HttpError\(\d+,\s*(['"])(.*?)\1/g)) {
    const entry=interfaceTranslations[match[2]];
    if (!entry?.en || !entry?.ru || !entry?.['uz-Latn']) { console.error(`Missing API error translations: ${match[2]}`); errors++; }
  }
}
if (errors) process.exitCode = 1;
else console.log('UI translation coverage passed.');
