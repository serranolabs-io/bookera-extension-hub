import { BookeraModule, DEFAULT_VERSION } from '@serranolabs.io/shared/module';
import { Tab } from '@serranolabs.io/shared/tab';
import { genShortID } from '@serranolabs.io/shared/util';
import { elementName, KeyboardShortcutsElement } from './keyboard-shortcuts';

const description = 'Manage all the keyboard shortcuts';

const title = 'Keyboard Shortcuts';

export const keyboardShortcutsModule = new BookeraModule(
  DEFAULT_VERSION,
  title,
  description,
  undefined,
  genShortID(10),
  ['renderInSettings', 'renderInDaemon', 'renderInPanel'],
  KeyboardShortcutsElement
);
