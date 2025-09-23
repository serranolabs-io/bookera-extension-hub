import { Bag, BagManager } from '@pb33f/saddlebag';
import { Config, ExtensionConfig } from '@serranolabs.io/shared/extension-marketplace';
import { User } from '@serranolabs.io/shared/user';
import { genShortID } from '@serranolabs.io/shared/util';
import { Extension } from './backend';

export const defaultExtensionConfig: ExtensionConfig & Extension = {
  version: '',
  title: '',
  description: '',
  configs: [] as Config[],
  isPublished: false,
  id: genShortID(6),
  icon: null,
  hasIcon: false,
};

export const ManageConfigKey = 'manage-config-key';
