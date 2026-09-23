/**
 * The declarations Monaco gets, so that a sketch has real autocompletion.
 *
 * "All the Firsthand packages are installed" has to be true of the editor as
 * well as of the preview, and for the editor that means the `.d.ts` files.
 * They are copied out of `node_modules` at build time, under the paths they
 * already have, so that TypeScript's own resolution finds them the way it
 * would in a project — `package.json` included, because that is what says
 * where the types are.
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const modules = resolve(root, 'node_modules');

const PACKAGES = ['core', 'dom', 'data', 'styled', 'router', 'i18n', 'deep'];

/** Every `.d.ts` under a directory, with the path it is served at. */
function declarations(directory, into, base) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      declarations(path, into, base);
    } else if (entry.endsWith('.d.ts')) {
      const served = relative(base, path).split(String.fromCharCode(92)).join('/');
      into[`file:///node_modules/${served}`] = readFileSync(path, 'utf8');
    }
  }
}

const files = {};
for (const name of PACKAGES) {
  // Straight from `node_modules` rather than through resolution: a package
  // that does not export its own `package.json` cannot be asked for it.
  const home = resolve(modules, '@firsthandjs', name);
  const manifest = resolve(home, 'package.json');
  files[`file:///node_modules/@firsthandjs/${name}/package.json`] = readFileSync(manifest, 'utf8');
  declarations(resolve(home, 'dist'), files, modules);
}

mkdirSync(resolve(root, 'src/generated'), { recursive: true });
writeFileSync(
  resolve(root, 'src/generated/types.json'),
  `${JSON.stringify(files, null, 0)}\n`,
  'utf8',
);

const size = Object.values(files).reduce((total, text) => total + text.length, 0);
console.log(
  `types: ${String(Object.keys(files).length)} files, ${String(Math.round(size / 1024))} kB`,
);
