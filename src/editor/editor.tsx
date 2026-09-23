/**
 * The editor: one Monaco instance, however many files there are.
 *
 * A model per file rather than an editor per file, which is how Monaco is
 * meant to be used: switching tabs swaps the model, and each file keeps its
 * own undo history, cursor and scroll position, because the model is where
 * those live.
 */
import { component, effect, onCleanup } from '@firsthandjs/dom';
import type { editor as MonacoEditor } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { setupMonaco } from './monaco';
import { mode } from '../state/theme';
import { Host } from '../ui/editor.styled';
import type { File } from '../state/files';

export type EditorProps = {
  readonly file: File;
  readonly onEdit: (source: string) => void;
};

/**
 * How the editor looks and behaves, separately from what it is showing.
 *
 * A table rather than a wall of arguments inside the mount: none of it is a
 * decision the component makes, and all of it is a decision somebody might
 * want to change.
 */
const OPTIONS = {
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
} as const satisfies MonacoEditor.IStandaloneEditorConstructionOptions;

/**
 * A model per file, made once and kept.
 *
 * The model is where the undo history, the cursor and the scroll position
 * live, so keeping it is what makes switching tabs feel like switching files
 * rather than like reloading one.
 */
function library(
  monaco: ReturnType<typeof setupMonaco>,
  onEdit: (source: string) => void,
): { of: (file: File) => MonacoEditor.ITextModel; dispose: () => void } {
  const models = new Map<string, MonacoEditor.ITextModel>();
  return {
    of: (file) => {
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
        onEdit(model.getValue());
      });
      models.set(file.id, model);
      return model;
    },
    dispose: () => {
      for (const model of models.values()) {
        model.dispose();
      }
    },
  };
}

export const Editor = component<EditorProps>((props) => {
  const monaco = setupMonaco();
  let editor: MonacoEditor.IStandaloneCodeEditor | null = null;
  const models = library(monaco, (source: string) => {
    props.onEdit(source);
  });
  const modelFor = models.of;

  const mount = (element: HTMLDivElement): void => {
    editor = monaco.editor.create(element, {
      ...OPTIONS,
      model: modelFor(props.file),
      theme: `firsthand-${mode.value}`,
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
    models.dispose();
  });

  return <Host ref={mount} />;
});
