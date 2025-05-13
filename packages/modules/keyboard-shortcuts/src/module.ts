import { BookeraModule, DEFAULT_VERSION } from '@serranolabs.io/shared/module';
import { Tab } from '@serranolabs.io/shared/tab';
import { genShortID } from '@serranolabs.io/shared/util';
import { KeyboardShortcutsElement } from './keyboard-shortcuts';

const description = 'Manage all the keyboard shortcuts';

const title = 'Keyboard Shortcuts';

export const elementName = 'keyboard-shortcuts-element';

export const keyboardShortcutsModule = new BookeraModule(
  DEFAULT_VERSION,
  title,
  description,
  new Tab(title, 'command', '', elementName, 'left').removeTab(),
  genShortID(10),
  true,
  KeyboardShortcutsElement
);
