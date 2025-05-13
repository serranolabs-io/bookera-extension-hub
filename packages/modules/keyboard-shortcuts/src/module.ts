import { BookeraModule, DEFAULT_VERSION } from '@serranolabs.io/shared/module';
import { Tab } from '@serranolabs.io/shared/tab';
import { genShortID } from '@serranolabs.io/shared/util';
import { KeyboardShortcutsElement } from './keyboard-shortcuts';

const description =
  'Customize the look and feel of your Bookera application with themes. There are two types of themes: System and Custom. System themes are simple, while Custom themes allow you to create your own unique look.';

const title = 'Keyboard Shortcuts';

export const keyboardShortcutsModule = new BookeraModule(
  DEFAULT_VERSION,
  title,
  description,
  new Tab(
    title,
    'palette',
    '',
    'keyboard-shortcuts-element',
    'left'
  ).removeTab(),
  genShortID(10),
  true,
  KeyboardShortcutsElement
);
