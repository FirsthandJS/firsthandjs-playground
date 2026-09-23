/**
 * The compiler bridge: the one place this project could quietly disagree with
 * a real build.
 *
 * What is asserted is that the output is Firsthand's — templates and parts,
 * from the framework's own plugin — and that a person who types half a line
 * gets a sentence rather than a stack trace.
 */
import { describe, expect, it } from 'vitest';
import { compile } from '../src/preview/compile';
import { WEATHER } from '../src/defaults/weather';

const code = async (source: string): Promise<string> => {
  const result = await compile(source, 'test.tsx');
  if ('error' in result) {
    throw new Error(result.error);
  }
  return result.code;
};

describe('compiling in the page', () => {
  it('turns markup into a template and a part', async () => {
    const out = await code(`
import { component, signal } from '@firsthandjs/dom';
export default component(() => {
  const n = signal(0);
  return <p>{String(n.value)}</p>;
});
`);
    // The compiler's own output shape: a hoisted template, and the runtime
    // imported from the entry the import map serves.
    expect(out).toContain('@firsthandjs/dom/internal');
    expect(out).toContain('_$template');
    expect(out).toMatch(/_\$(insert|part|writeChild)/);
  });

  it('strips the types and keeps the JSX semantics', async () => {
    const out = await code(`
const label: string = 'x';
export default () => <b title={label}>{label}</b>;
`);
    expect(out).not.toContain(': string');
    expect(out).toContain('_$template');
  });

  it('compiles the sketch every visitor sees first', async () => {
    // If the default file does not compile, the playground is broken on
    // arrival, and no other test here would notice.
    expect(await code(WEATHER)).toContain('_$template');
  });

  it('answers a syntax error with one sentence', async () => {
    const result = await compile('export default () => <p>oops</b>;', 'test.tsx');

    expect(result).toHaveProperty('error');
    if ('error' in result) {
      expect(result.error).not.toContain('\n');
      expect(result.error.length).toBeLessThan(160);
    }
  });
});
