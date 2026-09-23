/**
 * The document the preview runs in, and the script inside it.
 *
 * The bootstrap is written as a template literal inside a template literal, so
 * a backslash in it belongs to whichever of the two you were thinking about
 * when you typed it. Get that wrong and the generated script is a syntax
 * error — the module never runs, so it never posts `firsthand:ready`, so the
 * preview says "warming up" forever and reports nothing, because the very
 * handler that would have reported it is in the script that did not parse.
 *
 * There is no stack trace for that and no console line. Parsing the thing is
 * the only cheap way to know, so that is what this does.
 */
import { describe, expect, it } from 'vitest';
import * as Babel from '@babel/standalone';
import { harness } from '../src/preview/harness';

/** The module script out of the document, which is the part that has to parse. */
function bootstrap(): string {
  const html = harness();
  const opening = '<script type="module">';
  const from = html.indexOf(opening);
  expect(from).toBeGreaterThan(-1);
  const to = html.indexOf('</script>', from);
  expect(to).toBeGreaterThan(from);
  return html.slice(from + opening.length, to);
}

describe('the preview harness', () => {
  it('generates a script that parses', () => {
    expect(() =>
      Babel.transform(bootstrap(), {
        sourceType: 'module',
        babelrc: false,
        configFile: false,
      }),
    ).not.toThrow();
  });

  it('carries no stray escape into the generated script', () => {
    // Every backslash in the source belongs to the outer literal, so none
    // should survive into what the browser is handed. `String.fromCharCode` is
    // there instead, which is why.
    expect(bootstrap()).not.toContain(String.fromCharCode(92));
  });

  it('says it is ready, which is the whole reason the preview ever starts', () => {
    expect(bootstrap()).toContain('firsthand:ready');
  });

  it('reports rather than swallows: throws, rejections, and what the sketch logs', () => {
    const code = bootstrap();
    expect(code).toContain("addEventListener('error'");
    expect(code).toContain("addEventListener('unhandledrejection'");
    expect(code).toContain('console.error');
  });

  it('withholds "it ran" from a run that already reported a failure', () => {
    // Otherwise a `console.error` during the first render is posted, and the
    // unconditional "it ran" that follows clears it half a frame later.
    expect(bootstrap()).toContain('if (!broke)');
  });

  it('serves the import map from the document, so a bare specifier resolves', () => {
    const html = harness();
    expect(html).toContain('type="importmap"');
    expect(html).toContain('@firsthandjs/dom');
  });
});
