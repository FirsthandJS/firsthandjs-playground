/**
 * The editor knows what Firsthand is.
 *
 * Monaco is handed the framework's own `.d.ts` set and a JSX configuration,
 * and neither is obviously working until somebody types a `<` and sees what
 * comes back. This has been broken twice — once with no types at all, once
 * with types that loaded but no JSX, which offers completions for everything
 * except the thing a visitor is writing.
 *
 * The counts are lower bounds rather than exact numbers: a TypeScript upgrade
 * may add an attribute, and a test that fails because the web platform grew is
 * a test nobody trusts. What matters is the order of magnitude and the
 * presence of the names a person would actually type.
 */
import { expect, test, type Page } from '@playwright/test';

/**
 * Replaces the editor's contents without Monaco helping.
 *
 * `insertText` rather than `type`: typing lets the editor close brackets and
 * tags as it goes, which changes the text the completion is asked about.
 */
async function write(page: Page, text: string): Promise<void> {
  await page.locator('.monaco-editor').first().click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(text);
}

/**
 * How many entries the widget is offering.
 *
 * Not how many rows are in the DOM: Monaco virtualises the list and draws
 * about twelve of them whatever the total is, so counting rows measures the
 * viewport. Each row carries `aria-setsize`, which is the number a screen
 * reader is told and the number that is actually wanted here.
 */
async function offered(page: Page): Promise<number> {
  const row = page.locator('.suggest-widget .monaco-list-row').first();
  await row.waitFor();
  return Number(await row.getAttribute('aria-setsize'));
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.monaco-editor').first()).toBeVisible();
});

test('an element offers its attributes', async ({ page }) => {
  await write(page, 'export default () => <div ');
  await page.keyboard.press('Control+Space');

  // 184 when this was written. Twenty would already mean the JSX types are
  // loaded and the intrinsic element is known; zero is the failure this has
  // had twice — once with no types at all, once with types but no JSX.
  expect(await offered(page)).toBeGreaterThan(20);
  await expect(page.locator('.suggest-widget').getByText('class', { exact: true })).toBeVisible();
});
