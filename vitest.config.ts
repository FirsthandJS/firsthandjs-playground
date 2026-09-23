import { defineConfig } from 'vitest/config';
import { firsthand } from '@firsthandjs/compiler/vite';

export default defineConfig({
  plugins: [firsthand({ packageName: 'playground' })],
  test: { environment: 'happy-dom', include: ['test/**/*.test.ts'] },
});
