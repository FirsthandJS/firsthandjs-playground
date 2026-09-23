/**
 * What devtools is handed, as opposed to what the preview runs.
 *
 * The preview imports each compile from a blob URL, which is the only way to
 * `import` a string. Left alone that makes the sketch the one file in the page
 * nobody can debug: a fresh `blob:…/<uuid>` in the Sources tree on every
 * keystroke, breakpoints attached to a script the next keystroke throws away,
 * and compiler output — templates, parts, hoisted markup — where the TSX
 * should be.
 *
 * Two trailing comments fix both halves, and these assert them, because
 * neither has any effect the preview itself can show.
 */
import { describe, expect, it } from 'vitest';
import { compile } from '../src/preview/compile';

const SOURCE = `import { component, signal } from '@firsthandjs/dom';
export default component(() => {
  const n = signal(0);
  return () => <p onClick={() => { n.value += 1; }}>{String(n.value)}</p>;
});
`;

async function code(source = SOURCE, name = 'sketch.tsx'): Promise<string> {
  const result = await compile(source, name);
  if ('error' in result) {
    throw new Error(result.error);
  }
  return result.code;
}

/** The map, back out of the data URL the comment carries. */
function map(compiled: string): { sources: string[]; sourcesContent: string[]; mappings: string } {
  const line = compiled.split('\n').find((text) => text.startsWith('//# sourceMappingURL='));
  expect(line).toBeDefined();
  const url = (line as string).slice('//# sourceMappingURL='.length);
  const comma = url.indexOf(',');
  return JSON.parse(decodeURIComponent(url.slice(comma + 1))) as ReturnType<typeof map>;
}

describe('what the debugger is given', () => {
  it('names every compile of one file the same, so a breakpoint survives a keystroke', async () => {
    const first = await code(SOURCE, 'weather.tsx');
    const second = await code(`${SOURCE}\n// edited\n`, 'weather.tsx');

    expect(first).toContain('//# sourceURL=firsthand:///weather.tsx');
    expect(second).toContain('//# sourceURL=firsthand:///weather.tsx');
  });

  it('names a different file differently', async () => {
    expect(await code(SOURCE, 'other.tsx')).toContain('//# sourceURL=firsthand:///other.tsx');
  });

  it('ships a source map with the original TSX inside it', async () => {
    const compiled = await code();
    const parsed = map(compiled);

    expect(parsed.sources[0]).toContain('sketch.tsx');
    expect(parsed.mappings.length).toBeGreaterThan(0);
    // The source travels with the map: the file was never served, so there is
    // nowhere for the debugger to fetch it from.
    expect(parsed.sourcesContent[0]).toBe(SOURCE);
  });

  it('encodes a map a sketch with an em dash in it cannot break', async () => {
    // `btoa` throws on anything outside Latin-1, and the sketch the playground
    // opens with has an em dash, an ellipsis and a degree sign in it.
    const wide = `// — … °C\n${SOURCE}`;
    const parsed = map(await code(wide));

    expect(parsed.sourcesContent[0]).toBe(wide);
  });

  it('leaves the code itself runnable, with the comments last', async () => {
    const lines = (await code()).trimEnd().split('\n');

    expect(lines[lines.length - 1]?.startsWith('//# sourceURL=')).toBe(true);
    expect(lines.filter((line) => line.startsWith('//# '))).toHaveLength(2);
  });
});
