import { z } from 'zod';
import { BookeraModule } from '../../module/module';
import { Source } from '../keyboard-shortcuts/model';
import { genShortID } from '../util';
import { User } from '@supabase/supabase-js';

export const ExtensionDownloadEndpoints = {
  themes: 'themes-download-endpoint',
  keyboardShortcuts: 'keyboard-shortcuts-download-endpoint',
};

export interface Config<T extends object> {
  source: Source; // name: Theme, link: blah blah
  values: T[]; // CustomColorPalette
  id: string;
  nameIndex: keyof T | ''; // theme.name
}

export interface SEND_CONFIG_EVENT_TYPE<T extends object> {
  config: Config<T> | ExtensionConfig<T>;
}
export const SEND_CONFIG_EVENT = 'send-config-event';
export const SEND_CONFIG_EVENT_FROM_API = 'send-config-from-api-event';

export class Config<T extends object = {}> {
  source: Source; // name: Theme, link: blah blah
  values: T[]; // CustomColorPalette
  id: string;
  nameIndex: keyof T | ''; // theme.name

  constructor(source: Source, values: T[], nameIndex: keyof T | '', id?: string) {
    this.source = source;
    if (id) {
      this.id = id;
    } else {
      this.id = genShortID(10);
    }
    this.nameIndex = nameIndex;

    this.values = values;
  }
}

export interface ExtensionConfig<T extends object = {}>
  extends Pick<BookeraModule, 'version' | 'title' | 'description' | 'id'> {
  configs: Config<T>[]; // pass in Theme[], or KeyboardShortcut[]
  isPublished: boolean;
  icon: File | null; // base64 encoded icon, shit
}

const toKebabCase = (str: string) =>
  str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/\s+/g, '-');

export const PackageJsonSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'Version must follow the format number.number.number'),
  private: z.boolean(),
  description: z.string(),
  icon: z.string(),
  author: z.string(),
});

export type PackageJson = z.infer<typeof PackageJsonSchema>;

export const getPackageJsonName = <T>(extensionConfig: ExtensionConfig<T>) => {
  return {
    name: toKebabCase(extensionConfig.title ? extensionConfig.title : ''),
  };
};

export const createPackageJsonJson = <T>(
  extensionConfig: ExtensionConfig<T>,
  user: User
): string => {
  const packageJson: PackageJson = {
    ...getPackageJsonName(extensionConfig),
    displayName: extensionConfig.title ? extensionConfig.title : '',
    version: extensionConfig.version ? extensionConfig.version : '',
    private: extensionConfig.isPublished!,
    author: user.email,
    description: extensionConfig.description ? extensionConfig.description : '',
    icon: extensionConfig.icon,
  };

  return JSON.stringify(packageJson);
};
