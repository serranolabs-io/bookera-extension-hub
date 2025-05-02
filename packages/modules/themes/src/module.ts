import { BookeraModule, DEFAULT_VERSION } from '@serranolabs.io/shared/module';
import { ThemesElement } from './theme-switcher-element';
import { Tab } from '@serranolabs.io/shared/tab';
import { genShortID } from '@serranolabs.io/shared/util';

export const themeSwitcherModule = new BookeraModule(
  DEFAULT_VERSION,
  'Themes',
  new Tab('Themes', 'palette', '', 'themes-element', 'left').removeTab(),
  genShortID(10),
  true,
  ThemesElement
);
