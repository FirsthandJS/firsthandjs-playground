/**
 * What the editor is given to think with.
 *
 * The completions come from real `.d.ts` files copied out of `node_modules`,
 * and the one that decides whether JSX means anything is `jsx-runtime`: it
 * declares the global `JSX` namespace that types `<div class=…>`. Without it
 * every tag and every attribute is `any`, which is not an error anywhere —
 * the editor simply stops being useful, quietly. Hence a test.
 */
import { describe, expect, it } from 'vitest';
import declarations from '../src/generated/types.json';

/** The `.d.ts` of `jsx-runtime`, which is not its `package.json`. */
const runtimeTypes = (): string | undefined =>
  Object.entries(declarations as Record<string, string>).find(
    ([path]) => path.includes('jsx-runtime') && path.endsWith('.d.ts'),
  )?.[1];

describe('the declarations the editor loads', () => {
  it('includes the global JSX namespace', () => {
    const jsx = runtimeTypes();

    expect(jsx).toBeDefined();
    expect(jsx).toContain('namespace JSX');
    expect(jsx).toContain('IntrinsicElements');
  });

  it('types the elements from the DOM rather than as `any`', () => {
    const jsx = runtimeTypes();

    // `[name: string]: any` is what a loose stub looks like, and it is what
    // this playground shipped until the real types were loaded.
    expect(jsx).not.toMatch(/IntrinsicElements\s*\{\s*\[name: string\]: any/);
  });

  it('carries each package’s manifest, which is what resolution reads', () => {
    const manifests = Object.keys(declarations as Record<string, string>).filter((path) => path.endsWith('package.json'));

    expect(manifests).toContain('file:///node_modules/@firsthandjs/dom/package.json');
    expect(manifests).toContain('file:///node_modules/@firsthandjs/jsx-runtime/package.json');
    expect(manifests.length).toBeGreaterThanOrEqual(8);
  });

  it('offers the packages the preview can actually import', () => {
    // The editor and the preview have to agree: a completion for something
    // the import map does not serve is a promise the preview cannot keep.
    const offered = new Set(
      Object.keys(declarations as Record<string, string>)
        .map((path) => /@firsthandjs\/([^/]+)\//.exec(path)?.[1])
        .filter((name): name is string => name !== undefined),
    );

    for (const name of ['core', 'dom', 'data', 'styled', 'router', 'i18n', 'deep']) {
      expect(offered).toContain(name);
    }
  });
});
