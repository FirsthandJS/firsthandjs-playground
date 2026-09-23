/**
 * Bundles the Firsthand packages the preview runs against.
 *
 * The preview is an iframe with an import map, so a file in the editor can
 * `import { signal } from '@firsthandjs/dom'` with nothing installed. These
 * are those modules, built from the versions in `node_modules` — the same ones
 * the playground itself is built with, so what a visitor writes runs against
 * the version the page claims.
 *
 * One esbuild run for all of them, with splitting on, and that is the whole
 * point: `@firsthandjs/dom` and `@firsthandjs/dom/internal` are two entries
 * into one module, and compiled markup uses the second while the code around
 * it uses the first. Bundled separately they would be two copies with two
 * owner trees, and nothing would work. Split, they share a chunk and there is
 * one of everything.
 */
import { rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public/runtime');

/** What the import map offers, and what each name resolves to. */
export const RUNTIME = [
  '@firsthandjs/core',
  '@firsthandjs/dom',
  '@firsthandjs/dom/internal',
  '@firsthandjs/data',
  '@firsthandjs/styled',
  '@firsthandjs/router',
  '@firsthandjs/i18n',
  '@firsthandjs/deep',
];

/** `@firsthandjs/dom/internal` becomes `dom-internal`, which is a file name. */
export const fileFor = (specifier) => `${specifier.replace('@firsthandjs/', '').replace('/', '-')}.js`;

rmSync(out, { recursive: true, force: true });

await build({
  entryPoints: Object.fromEntries(
    RUNTIME.map((specifier) => [fileFor(specifier).replace(/\.js$/, ''), require.resolve(specifier)]),
  ),
  outdir: out,
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  // The development build: a playground is where you want the framework to
  // tell you what you did, and the size of the download is nobody's budget.
  define: { 'process.env.NODE_ENV': '"development"' },
  legalComments: 'none',
});

console.log(`runtime: ${String(RUNTIME.length)} entries in public/runtime`);
