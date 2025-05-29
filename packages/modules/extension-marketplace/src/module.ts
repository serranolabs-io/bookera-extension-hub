import { BookeraModule, DEFAULT_VERSION } from '@serranolabs.io/shared/module';
import {
  ExtensionMarketplaceElement,
  elementName,
} from './extension-marketplace-element';
import { Tab } from '@serranolabs.io/shared/tab';
import { genShortID } from '@serranolabs.io/shared/util';
import { ExtensionMarketplaceModuleState, moduleInstances } from './api';

const description = `The Bookera Marketplace is your go-to hub for discovering, installing, and managing extensions that enhance your reading and writing experience. Whether you're looking for tools to improve productivity, customize your reading environment, or integrate with your favorite apps and platforms, the Extension Marketplace offers a wide variety of extensions built by the community.`;

export const extensionMarketplaceModule =
  new BookeraModule<ExtensionMarketplaceModuleState>(
    DEFAULT_VERSION,
    'Extension Marketplace',
    description,
    new Tab('Extension Marketplace', 'puzzle', '', elementName, 'left'),
    genShortID(10),
    [
      'renderInSidePanel',
      'renderInDaemon',
      'renderInSettings',
      'renderInPanel',
    ],
    ExtensionMarketplaceElement,
    Object.values(moduleInstances)
  );
