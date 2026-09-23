/**
 * The tab bar: which file is open, and everything you can do to one.
 *
 * Renaming happens in place — a double click turns the tab into an input,
 * Enter keeps it, Escape abandons it. That is one interaction rather than a
 * dialog, and it is the only place a file's name can be changed, which is why
 * it is worth doing properly.
 */
import { component, signal } from '@firsthandjs/dom';
import { Add, Bar, Close, Naming, Tab, TabName } from './tabs.styled';
import type { File, Files } from '../state/files';

export type TabsProps = { readonly files: Files };

export const Tabs = component<TabsProps>((props) => {
  const renaming = signal('');

  const keep = (file: File, value: string): void => {
    props.files.rename(file.id, value);
    renaming.value = '';
  };

  return () => (
    <Bar>
      {props.files.all.value.map((file) =>
        renaming.value === file.id ? (
          <Naming
            key={file.id}
            value={file.name}
            autofocus
            onBlur={(event: FocusEvent) => {
              keep(file, (event.target as HTMLInputElement).value);
            }}
            onKeyDown={(event: KeyboardEvent) => {
              if (event.key === 'Enter') {
                keep(file, (event.target as HTMLInputElement).value);
              } else if (event.key === 'Escape') {
                renaming.value = '';
              }
            }}
          />
        ) : (
          <Tab
            key={file.id}
            type="button"
            $open={file.id === props.files.openId.value}
            title={`${file.name} — double-click to rename`}
            onClick={() => {
              props.files.select(file.id);
            }}
            onDblClick={() => {
              renaming.value = file.id;
            }}
          >
            <TabName>{file.name}</TabName>
            <Close
              role="button"
              aria-label={`delete ${file.name}`}
              title="delete"
              onClick={(event: MouseEvent) => {
                event.stopPropagation();
                if (confirm(`Delete ${file.name}?`)) {
                  props.files.remove(file.id);
                }
              }}
            >
              ×
            </Close>
          </Tab>
        ),
      )}
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
