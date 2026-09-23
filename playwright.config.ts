/**
 * The end-to-end run.
 *
 * Every bug this playground has had was found by driving a browser: a theme
 * that never reached the iframe, a delete control a keyboard could not press,
 * completions that answered with nothing. None of them was found by a unit
 * test, because none of them was a unit — they were the seams between Monaco,
 * an iframe and `localStorage`, and a seam only exists when the whole thing is
 * running.
 *
 * It builds and serves rather than running the dev server. A dev server that
 * has been up since before a dependency changed serves the old dependency,
 * through a hard reload, which has already cost somebody an hour here. A
 * build cannot be stale about what it contains.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = 4183;

export default defineConfig({
  testDir: './e2e',
  // Monaco and the runtime bundles are megabytes: the first paint of a cold
  // preview is not a fast thing, and a timeout tuned for a form would make
  // this suite flake rather than fail.
  timeout: 45_000,
  expect: { timeout: 15_000 },
  /**
   * One at a time.
   *
   * Each test drives a Monaco instance and a preview iframe that compiles on
   * a timer, and in parallel they starve each other enough that a compile
   * lands after its assertion. Serial costs a minute and buys a suite whose
   * failures mean something.
   */
  fullyParallel: false,
  workers: 1,
  forbidOnly: process.env.CI !== undefined,
  retries: process.env.CI === undefined ? 0 : 1,
  reporter: process.env.CI === undefined ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${String(PORT)}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx vite preview --port ${String(PORT)} --strictPort`,
    url: `http://127.0.0.1:${String(PORT)}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
