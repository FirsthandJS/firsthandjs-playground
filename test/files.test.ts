/**
 * The file store: what a tab bar does to what is kept.
 *
 * Every one of these is a thing a person can do in two clicks, and each of
 * them has a way of going wrong that a type cannot catch — two files with one
 * name, a playground with no files at all, an open file that no longer exists.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createFiles } from '../src/state/files';

beforeEach(() => {
  localStorage.clear();
});

describe('the files', () => {
  it('starts with the weather sketch, open', () => {
    const files = createFiles();

    expect(files.all.value).toHaveLength(1);
    expect(files.open().name).toBe('weather.tsx');
    expect(files.open().source).toContain('open-meteo');
  });

  it('keeps what was written, across a reload', () => {
    const first = createFiles();
    first.edit(first.openId.value, 'const x = 1;');
    first.add('second.tsx');

    const second = createFiles();
    expect(second.all.value).toHaveLength(2);
    expect(second.all.value[0]?.source).toBe('const x = 1;');
    expect(second.open().name).toBe('second.tsx');
  });

  it('never lets two files share a name', () => {
    const files = createFiles();
    files.add('sketch.tsx');
    files.add('sketch.tsx');
    files.add('sketch.tsx');

    expect(files.all.value.map((file) => file.name)).toEqual([
      'weather.tsx',
      'sketch.tsx',
      'sketch 2.tsx',
      'sketch 3.tsx',
    ]);
  });

  it('refuses a rename onto a name already taken', () => {
    const files = createFiles();
    files.add('other.tsx');
    files.rename(files.openId.value, 'weather.tsx');

    expect(files.open().name).toBe('weather 2.tsx');
  });

  it('gives an empty name something to be called', () => {
    const files = createFiles();
    files.rename(files.openId.value, '   ');

    expect(files.open().name).toBe('untitled.tsx');
  });

  it('opens another file when the open one is deleted', () => {
    const files = createFiles();
    files.add('second.tsx');
    const second = files.openId.value;
    files.remove(second);

    expect(files.all.value).toHaveLength(1);
    expect(files.open().name).toBe('weather.tsx');
    expect(files.openId.value).not.toBe(second);
  });

  it('is never empty, because an empty playground has no way back', () => {
    const files = createFiles();
    files.remove(files.openId.value);

    expect(files.all.value).toHaveLength(1);
    expect(files.open().source).toContain('open-meteo');
  });

  it('survives storage that answers with nonsense', () => {
    localStorage.setItem('firsthand.playground.files', '{not json');
    const files = createFiles();

    expect(files.open().name).toBe('weather.tsx');
  });

  it('opens something when the stored open file is gone', () => {
    localStorage.setItem('firsthand.playground.open', '"deleted-long-ago"');
    const files = createFiles();

    expect(files.open()).toBeDefined();
    expect(files.openId.value).toBe(files.all.value[0]?.id);
  });
});
