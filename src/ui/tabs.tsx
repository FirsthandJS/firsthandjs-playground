/**
 * The tab bar: which file is open, and everything you can do to one.
 *
 * Three components rather than one, because a tab is three things depending
 * on what is happening to it — a button, a name being edited, and a way to
 * delete it — and each carries its own handful of events.
 *
 * Renaming happens in place: a double click, or F2, turns the tab into an
 * input; Enter keeps it and Escape abandons it. One interaction rather than a
 * dialog, and the only place a file's name changes.
 */
import { component, signal } from '@firsthandjs/dom';
import { Add, Bar, Close, Naming, Tab, TabName } from './tabs.styled';
import type { File, Files } from '../state/files';

export type TabsProps = { readonly files: Files };

type RenameProps = {
  readonly file: File;
  readonly onKeep: (name: string) => void;
  readonly onAbandon: () => void;
};

/** A tab that is being renamed. Enter and blur keep it; Escape does not. */
const Rename = component<RenameProps>((props) => {
  const typed = (event: Event): string => (event.target as HTMLInputElement).value;

  return (
    <Naming
      value={props.file.name}
      autofocus
      aria-label={`rename ${props.file.name}`}
      onBlur={(event: FocusEvent) => {
        props.onKeep(typed(event));
      }}
      onKeyDown={(event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          props.onKeep(typed(event));
        } else if (event.key === 'Escape') {
          props.onAbandon();
        }
      }}
    />
  );
});

type FileTabProps = {
  readonly file: File;
  readonly open: boolean;
  readonly onSelect: () => void;
  readonly onRename: () => void;
  readonly onDelete: () => void;
};

/**
 * One tab.
 *
 * The delete control is a `<span role="button">` rather than a nested
 * `<button>`: a button inside a button is invalid HTML, and browsers resolve
 * it in ways that lose the inner click. Being a span, it has to answer Enter
 * and Space itself, which is what a real button would have done for it.
 */
const FileTab = component<FileTabProps>((props) => (
  <Tab
    type="button"
    $open={props.open}
    aria-current={props.open ? 'page' : undefined}
    title={`${props.file.name} — double-click or F2 to rename`}
    onClick={props.onSelect}
    onDblClick={props.onRename}
    onKeyDown={(event: KeyboardEvent) => {
      if (event.key === 'F2') {
        event.preventDefault();
        props.onRename();
      }
    }}
  >
    <TabName>{props.file.name}</TabName>
    <Close
      role="button"
      tabindex={0}
      aria-label={`delete ${props.file.name}`}
      title="delete"
      onClick={(event: MouseEvent) => {
        event.stopPropagation();
        props.onDelete();
      }}
      onKeyDown={(event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          props.onDelete();
        }
      }}
    >
      ×
    </Close>
  </Tab>
));

type EntryProps = {
  readonly file: File;
  readonly files: Files;
  /** Whether this file is the one having its name edited. */
  readonly renaming: boolean;
  readonly onRename: () => void;
  readonly onDone: () => void;
};

/**
 * One file in the bar, as whichever of the two things it currently is.
 *
 * Its own component so that the decision and the handlers live beside each
 * other rather than inside the bar, which is then only a bar.
 */
const Entry = component<EntryProps>((props) => () => {
  const { file, files } = props;

  if (props.renaming) {
    return (
      <Rename
        file={file}
        onKeep={(name: string) => {
          files.rename(file.id, name);
          props.onDone();
        }}
        onAbandon={props.onDone}
      />
    );
  }

  return (
    <FileTab
      file={file}
      open={file.id === files.openId.value}
      onSelect={() => {
        files.select(file.id);
      }}
      onRename={props.onRename}
      onDelete={() => {
        if (confirm(`Delete ${file.name}?`)) {
          files.remove(file.id);
        }
      }}
    />
  );
});

export const Tabs = component<TabsProps>((props) => {
  const renaming = signal('');

  return () => (
    <Bar aria-label="files">
      {props.files.all.value.map((file) => (
        <Entry
          key={file.id}
          file={file}
          files={props.files}
          renaming={renaming.value === file.id}
          onRename={() => {
            renaming.value = file.id;
          }}
          onDone={() => {
            renaming.value = '';
          }}
        />
      ))}
      <Add
        type="button"
        title="new file"
        aria-label="new file"
        onClick={() => {
          props.files.add();
        }}
      >
        +
      </Add>
    </Bar>
  );
});
