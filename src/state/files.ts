/**
 * The files, and the only place they live.
 *
 * Each file is a project of its own: it is compiled alone, it runs alone, and
 * nothing imports anything else here. That is the whole model, and it is why
 * there is no module graph, no resolver and no bundler in this application.
 *
 * Persistence is `localStorage`, written on every change. It can be absent or
 * refuse to answer — a private window, blocked site data — so every read and
 * write is guarded and the playground works without it, for this visit.
 */
import { signal, type Signal } from '@firsthandjs/dom';
import { WEATHER } from '../defaults/weather';

export type File = {
  readonly id: string;
  readonly name: string;
  readonly source: string;
};

const KEY = 'firsthand.playground.files';
const OPEN = 'firsthand.playground.open';

const FIRST: File = { id: 'weather', name: 'weather.tsx', source: WEATHER };

function read<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : (JSON.parse(stored) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A visitor who blocks storage still gets a playground, for this visit.
  }
}

/** A name nothing else has, so two `sketch.tsx` cannot both be the tab. */
function free(names: readonly string[], wanted: string): string {
  if (!names.includes(wanted)) {
    return wanted;
  }
  const dot = wanted.lastIndexOf('.');
  const stem = dot === -1 ? wanted : wanted.slice(0, dot);
  const extension = dot === -1 ? '' : wanted.slice(dot);
  for (let n = 2; ; n++) {
    const candidate = `${stem} ${String(n)}${extension}`;
    if (!names.includes(candidate)) {
      return candidate;
    }
  }
}

export type Files = {
  readonly all: Signal<readonly File[]>;
  readonly openId: Signal<string>;
  readonly open: () => File;
  add: (name?: string) => void;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  edit: (id: string, source: string) => void;
  select: (id: string) => void;
};

/** A file made now: an id nothing else has, and a name nothing else has. */
function fresh(taken: readonly string[], name: string): File {
  return {
    id: `f${String(Date.now())}${String(Math.floor(Math.random() * 1000))}`,
    name: free(taken, name),
    source: STARTER,
  };
}

/**
 * What was stored, made sound.
 *
 * Storage can hold anything a previous version wrote, or nothing, or an open
 * file that has since been deleted — and every one of those has to end with a
 * playground that has files and one of them open.
 */
function restore(): { files: readonly File[]; open: string } {
  const stored = read<File[]>(KEY, [FIRST]);
  const files = stored.length === 0 ? [FIRST] : stored;
  const first = files[0] ?? FIRST;
  const open = read<string>(OPEN, first.id);
  return { files, open: files.some((file) => file.id === open) ? open : first.id };
}

export function createFiles(): Files {
  const initial = restore();
  const all = signal<readonly File[]>(initial.files);
  const openId = signal(initial.open);

  const put = (next: readonly File[]): void => {
    all.value = next;
    write(KEY, next);
  };

  const select = (id: string): void => {
    openId.value = id;
    write(OPEN, id);
  };

  return {
    all,
    openId,
    open: () => all.value.find((file) => file.id === openId.value) ?? (all.value[0] as File),
    select,
    add: (name = 'sketch.tsx') => {
      const file = fresh(
        all.value.map((other) => other.name),
        name,
      );
      put([...all.value, file]);
      select(file.id);
    },
    rename: (id, name) => {
      const taken = all.value.filter((file) => file.id !== id).map((file) => file.name);
      const wanted = name.trim() === '' ? 'untitled.tsx' : name.trim();
      put(
        all.value.map((file) => (file.id === id ? { ...file, name: free(taken, wanted) } : file)),
      );
    },
    remove: (id) => {
      const left = all.value.filter((file) => file.id !== id);
      // Never nothing: an empty playground has no editor and no way back.
      const next = left.length === 0 ? [{ ...FIRST, id: `f${String(Date.now())}` }] : left;
      put(next);
      if (openId.value === id) {
        select((next[0] as File).id);
      }
    },
    edit: (id, source) => {
      put(all.value.map((file) => (file.id === id ? { ...file, source } : file)));
    },
  };
}

/** What a new file starts as: the smallest thing that is already running. */
const STARTER = `import { component, signal } from '@firsthandjs/dom';

export default component(() => {
  const count = signal(0);

  return (
    <main style="font: 16px system-ui; padding: 2rem; color: #e8ecf8">
      <h1>Hello</h1>
      <p>Clicked {String(count.value)} times.</p>
      <button type="button" onClick={() => count.value++}>Click</button>
    </main>
  );
});
`;
