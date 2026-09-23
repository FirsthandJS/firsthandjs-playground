/**
 * The right-hand side: whatever the file currently says, running.
 *
 * One iframe for the life of the playground, rebuilt only when it has to be.
 * Re-creating it per keystroke would reload the framework every time and make
 * every sketch start from nothing; instead the compiled module is posted in,
 * the previous one is disposed, and the DOM is replaced.
 *
 * Compilation is debounced, not because it is slow — it is a few milliseconds
 * — but because a half-typed line is a syntax error, and an error that appears
 * between two keystrokes is noise rather than information.
 */
import { component, effect, onCleanup, signal, type Signal } from '@firsthandjs/dom';
import { compile } from './compile';
import { harness } from './harness';
import { mode, type Mode } from '../state/theme';
import { Empty, Frame, Problem, Shell, Status } from '../ui/preview.styled';

export type PreviewProps = {
  readonly source: string;
  readonly name: string;
};

/** What the preview says back: it is up, it ran, or it threw. */
type Report = { kind?: string; message?: string };

/** The wait after the last keystroke before a sketch is compiled. */
const SETTLE = 250;

/** What the playground sends the preview, and how. */
type Channel = {
  run: (code: string) => void;
  theme: (scheme: Mode) => void;
};

function channel(frame: () => HTMLIFrameElement | null): Channel {
  // `*` as the target origin: the frame is `srcdoc`, which has no origin of
  // its own to name. Nothing secret travels this way — it is the visitor's
  // own code, going to the visitor's own tab.
  const send = (message: object): void => {
    frame()?.contentWindow?.postMessage(message, '*');
  };
  return {
    run: (code) => {
      send({ kind: 'firsthand:run', code });
    },
    theme: (scheme) => {
      send({ kind: 'firsthand:theme', mode: scheme });
    },
  };
}

/** Listens for what the preview reports, and keeps two signals current. */
function listener(ready: Signal<boolean>, problem: Signal<string>): (event: MessageEvent) => void {
  return (event: MessageEvent) => {
    const data: unknown = event.data;
    if (data === null || typeof data !== 'object') {
      return;
    }
    const report = data as Report;
    if (report.kind === 'firsthand:ready') {
      ready.value = true;
    } else if (report.kind === 'firsthand:error') {
      problem.value = report.message ?? 'Something went wrong.';
    } else if (report.kind === 'firsthand:ran') {
      problem.value = '';
    }
  };
}

/**
 * Everything the preview does while it is alive, in one place.
 *
 * The component below is then what it should be: a frame, a strip that says
 * what is happening, and a handle to post into.
 */
function drive(props: PreviewProps, to: Channel, ready: Signal<boolean>, problem: Signal<string>) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  /** Compile, and either show what went wrong or hand the module over. */
  const run = (source: string, name: string): void => {
    void compile(source, name).then((result) => {
      if ('error' in result) {
        problem.value = result.error;
        return;
      }
      problem.value = '';
      to.run(result.code);
    });
  };

  // The playground's colour scheme, into the preview's own document.
  effect(() => {
    const scheme = mode.value;
    if (ready.value) {
      to.theme(scheme);
    }
  });

  // The source, compiled, a beat after the typing stops. Reading the props
  // here is what subscribes this to them; the timer is what keeps a
  // half-written line from being compiled and reported as an error.
  effect(() => {
    const source = props.source;
    const name = props.name;
    const running = ready.value;
    clearTimeout(timer);
    if (running) {
      timer = setTimeout(() => {
        run(source, name);
      }, SETTLE);
    }
  });

  return (): void => {
    clearTimeout(timer);
  };
}

export const Preview = component<PreviewProps>((props) => {
  const problem = signal('');
  const ready = signal(false);
  let frame: HTMLIFrameElement | null = null;

  const to = channel(() => frame);
  const listen = listener(ready, problem);
  addEventListener('message', listen);

  const stop = drive(props, to, ready, problem);
  onCleanup(() => {
    stop();
    removeEventListener('message', listen);
  });

  return () => (
    <Shell>
      <Frame
        title="preview"
        attr:sandbox="allow-scripts allow-same-origin allow-modals allow-popups allow-forms"
        srcdoc={harness()}
        $mode={mode.value}
        ref={(element: HTMLIFrameElement) => {
          frame = element;
        }}
      />
      <Say ready={ready.value} problem={problem.value} />
    </Shell>
  );
});

/** What the strip along the bottom says: running, starting, or what broke. */
const Say = component<{ readonly ready: boolean; readonly problem: string }>((props) => () => (
  <>
    {props.problem === '' ? (
      <Status>{props.ready ? 'running' : 'starting…'}</Status>
    ) : (
      <Problem role="alert">{props.problem}</Problem>
    )}
    {props.ready ? '' : <Empty>the preview is warming up</Empty>}
  </>
));
