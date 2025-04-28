import { BookeraModule, DEFAULT_VERSION } from 'shared/module/module';
import { ThemesElement } from './theme-switcher-element';
import { Tab } from 'shared/module/tab';
import { genShortID } from 'shared/util';

export const themeSwitcherModule = new BookeraModule(
  DEFAULT_VERSION,
  'Themes',
  new Tab('Themes', 'palette', '', 'themes-element', 'left').removeTab(),
  genShortID(10),
  true,
  ThemesElement
);
