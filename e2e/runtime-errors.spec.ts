/**
 * What the strip says when the sketch itself breaks.
 *
 * A compile error is already covered. This is the other half and the one a
 * visitor hits more often: code that compiles and then throws — on the first
 * render, in a handler they click, or in an effect a signal wakes. None of
 * those reaches the compiler, so none of them is reported by the path that
 * reports a syntax error; they arrive from inside the iframe or not at all.
 */
import { expect, test, type Page } from '@playwright/test';

const failure = (page: Page) => page.locator('[role="alert"]').filter({ hasText: /\S/ });

async function write(page: Page, source: string): Promise<void> {
  await page.locator('.monaco-editor').first().click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(source);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.monaco-editor').first()).toBeVisible();
});

test('a throw on the first render is reported', async ({ page }) => {
  await write(
    page,
    `import { component } from '@firsthandjs/dom';
export default component(() => {
  throw new Error('kaboom-on-render');
});`,
  );

  await expect(failure(page)).toContainText('kaboom-on-render');
});

test('a throw inside a handler is reported when it is clicked', async ({ page }) => {
  await write(
    page,
    `import { component } from '@firsthandjs/dom';
export default component(() => () => (
  <button onClick={() => { throw new Error('kaboom-on-click'); }}>press</button>
));`,
  );

  const frame = page.frameLocator('iframe[title="preview"]');
  await frame.getByRole('button', { name: 'press' }).click();

  await expect(failure(page)).toContainText('kaboom-on-click');
});

test('a rejected promise in the sketch is reported', async ({ page }) => {
  await write(
    page,
    `import { component } from '@firsthandjs/dom';
export default component(() => {
  void Promise.reject(new Error('kaboom-async'));
  return () => <p>ok</p>;
});`,
  );

  await expect(failure(page)).toContainText('kaboom-async');
});

test('the report goes away once the sketch is fixed', async ({ page }) => {
  await write(
    page,
    `import { component } from '@firsthandjs/dom';
export default component(() => { throw new Error('kaboom-temporary'); });`,
  );
  await expect(failure(page)).toContainText('kaboom-temporary');

  await write(
    page,
    `import { component } from '@firsthandjs/dom';
export default component(() => () => <p>better</p>);`,
  );

  await expect(failure(page)).toHaveCount(0);
});

test('an error the sketch logs itself is reported', async ({ page }) => {
  // A `catch` that logs is the ordinary way code says something went wrong,
  // and the console it reaches inside an iframe is one nobody has open.
  await write(
    page,
    `import { component } from '@firsthandjs/dom';
export default component(() => {
  try { throw new Error('kaboom-caught'); } catch (error) { console.error(error); }
  return () => <p>ok</p>;
});`,
  );

  await expect(failure(page)).toContainText('kaboom-caught');
});

test('the report says where, not only what', async ({ page }) => {
  await write(
    page,
    `import { component } from '@firsthandjs/dom';
function brokenHelper() { throw new Error('kaboom-where'); }
export default component(() => { brokenHelper(); return () => <p>x</p>; });`,
  );

  // The frame that names the function the visitor wrote: a message alone
  // answers "what" and never "where", and the sketch is thirty lines.
  await expect(failure(page)).toContainText('brokenHelper');
});

test('the warming-up overlay leaves once the preview is running', async ({ page }) => {
  // It covers the whole frame (`inset: 0`), so one that stays is a running
  // sketch behind a line saying it has not started.
  const frame = page.frameLocator('iframe[title="preview"]');
  await expect(frame.locator('body')).not.toBeEmpty();

  await expect(page.getByText('running')).toBeVisible();
  await expect(page.getByText('the preview is warming up')).toBeHidden();
});
