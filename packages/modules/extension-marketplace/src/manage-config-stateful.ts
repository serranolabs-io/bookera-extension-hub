import { Bag, BagManager } from '@pb33f/saddlebag';
import {
  Config,
  ExtensionConfig,
} from '@serranolabs.io/shared/extension-marketplace';
import { User } from '@serranolabs.io/shared/user';
import { genShortID } from '@serranolabs.io/shared/util';

export const defaultExtensionConfig: ExtensionConfig = {
  version: '',
  title: '',
  description: '',
  configs: [] as Config[],
  markdown: '',
  user: new User('', '', []),
  isPublished: false,
  id: genShortID(6),
};

export const ManageConfigKey = 'manage-config-key';
