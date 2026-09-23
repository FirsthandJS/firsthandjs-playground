/**
 * The editor: one Monaco instance, however many files there are.
 *
 * A model per file rather than an editor per file, which is how Monaco is
 * meant to be used: switching tabs swaps the model, and each file keeps its
 * own undo history, cursor and scroll position because the model is where
 * those live.
 */
import { component, effect, onCleanup } from '@firsthandjs/dom';
import { setupMonaco } from './monaco';
import { mode } from '../state/theme';
import { Host } from '../ui/editor.styled';
import type { File } from '../state/files';

export type EditorProps = {
  readonly file: File;
  readonly onEdit: (source: string) => void;
};

export const Editor = component<EditorProps>((props) => {
  const monaco = setupMonaco();
  let editor: import('monaco-editor').editor.IStandaloneCodeEditor | null = null;
  const models = new Map<string, import('monaco-editor').editor.ITextModel>();

  const modelFor = (file: File): import('monaco-editor').editor.ITextModel => {
    const existing = models.get(file.id);
    if (existing !== undefined && !existing.isDisposed()) {
      return existing;
    }
    const model = monaco.editor.createModel(
      file.source,
      'typescript',
      monaco.Uri.parse(`file:///${file.id}.tsx`),
    );
    model.onDidChangeContent(() => {
      props.onEdit(model.getValue());
    });
    models.set(file.id, model);
    return model;
  };

  const mount = (element: HTMLDivElement): void => {
    // A handle for the end-to-end tests, which ask the language service for
    // completions the way a keystroke does.
    (globalThis as unknown as { __monaco?: unknown }).__monaco = monaco;
    editor = monaco.editor.create(element, {
      model: modelFor(props.file),
      theme: `firsthand-${mode.value}`,
      automaticLayout: true,
      fontSize: 13.5,
      fontLigatures: true,
      fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, monospace',
      minimap: { enabled: false },
      padding: { top: 18, bottom: 18 },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      renderLineHighlight: 'all',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      roundedSelection: true,
      tabSize: 2,
      bracketPairColorization: { enabled: true },
      guides: { indentation: true },
      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
    });
  };

  // The open file: swap the model, keeping every file's own history.
  effect(() => {
    const file = props.file;
    if (editor === null) {
      return;
    }
    const model = modelFor(file);
    if (editor.getModel() !== model) {
      editor.setModel(model);
    }
    // A file renamed or replaced elsewhere — its text is the truth.
    if (model.getValue() !== file.source) {
      model.setValue(file.source);
    }
  });

  effect(() => {
    monaco.editor.setTheme(`firsthand-${mode.value}`);
  });

  onCleanup(() => {
    editor?.dispose();
    for (const model of models.values()) {
      model.dispose();
    }
  });

  return <Host ref={mount} />;
});
