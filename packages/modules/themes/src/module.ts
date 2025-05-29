import { BookeraModule, DEFAULT_VERSION } from '@serranolabs.io/shared/module';
import { ThemesElement } from './theme-switcher-element';
import { Tab } from '@serranolabs.io/shared/tab';
import { genShortID } from '@serranolabs.io/shared/util';

const description =
  'Customize the look and feel of your Bookera application with themes. There are two types of themes: System and Custom. System themes are simple, while Custom themes allow you to create your own unique look.';

export const themeSwitcherModule = new BookeraModule(
  DEFAULT_VERSION,
  'Themes',
  description,
  new Tab('Themes', 'palette', '', 'themes-element', 'left').removeTab(),
  genShortID(10),
  ['renderInDaemon', 'renderInPanel', 'renderInSettings', 'renderInSidePanel'],
  ThemesElement,
  []
);
