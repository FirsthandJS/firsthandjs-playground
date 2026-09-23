/**
 * The playground is a Firsthand application, compiled by Firsthand's own
 * compiler. `base` is set for GitHub Pages, where the site is served from a
 * repository path rather than from the root.
 */
import { defineConfig } from 'vite';
import { firsthand } from '@firsthandjs/compiler/vite';

export default defineConfig({
  base: process.env.PAGES === 'true' ? '/firsthandjs-playground/' : '/',
  plugins: [firsthand({ packageName: 'playground' })],
  build: { target: 'es2022' },
  // Monaco ships its own workers; letting Vite pre-bundle them breaks them.
  worker: { format: 'es' },
});
