import { BookeraModule, DEFAULT_VERSION } from '@serranolabs.io/shared/module';
import { UserElement, elementName } from './user-element';
import { Tab } from '@serranolabs.io/shared/tab';
import { genShortID } from '@serranolabs.io/shared/util';

const description = 'Manage your account here!';

export const userModule = new BookeraModule(
  DEFAULT_VERSION,
  'User',
  description,
  new Tab('User', 'person', '', elementName, 'left'),
  genShortID(10),
  ['renderInSidePanel', 'renderInDaemon', 'renderInPanel', 'renderInSettings'],
  UserElement
);
