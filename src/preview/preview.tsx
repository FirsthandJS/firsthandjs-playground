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
import { component, effect, signal } from '@firsthandjs/dom';
import { compile } from './compile';
import { harness } from './harness';
import { mode } from '../state/theme';
import { Empty, Frame, Problem, Shell, Status } from '../ui/preview.styled';

export type PreviewProps = {
  readonly source: string;
  readonly name: string;
};

export const Preview = component<PreviewProps>((props) => {
  const problem = signal('');
  const ready = signal(false);
  let frame: HTMLIFrameElement | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const post = (code: string): void => {
    frame?.contentWindow?.postMessage({ kind: 'firsthand:run', code }, '*');
  };

  const listen = (event: MessageEvent): void => {
    const data: unknown = event.data;
    if (data === null || typeof data !== 'object') {
      return;
    }
    const message = data as { kind?: string; message?: string };
    if (message.kind === 'firsthand:ready') {
      ready.value = true;
    } else if (message.kind === 'firsthand:error') {
      problem.value = message.message ?? 'Something went wrong.';
    } else if (message.kind === 'firsthand:ran') {
      problem.value = '';
    }
  };

  addEventListener('message', listen);

  // The playground's colour scheme, into the preview's own document.
  effect(() => {
    const scheme = mode.value;
    if (!ready.value) {
      return;
    }
    frame?.contentWindow?.postMessage({ kind: 'firsthand:theme', mode: scheme }, '*');
  });

  // The source, compiled, a beat after the typing stops.
  effect(() => {
    const source = props.source;
    const name = props.name;
    const running = ready.value;
    clearTimeout(timer);
    if (!running) {
      return;
    }
    timer = setTimeout(() => {
      void compile(source, name).then((result) => {
        if ('error' in result) {
          problem.value = result.error;
          return;
        }
        problem.value = '';
        post(result.code);
      });
    }, 250);
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
      {problem.value === '' ? (
        <Status>{ready.value ? 'running' : 'starting…'}</Status>
      ) : (
        <Problem role="status">{problem.value}</Problem>
      )}
      {ready.value ? '' : <Empty>the preview is warming up</Empty>}
    </Shell>
  );
});
