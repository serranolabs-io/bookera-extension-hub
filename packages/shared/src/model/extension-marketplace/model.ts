import { BookeraModule } from '../../module/module';
import { Source } from '../keyboard-shortcuts/model';
import { User } from '../user/author';
import { genShortID } from '../util';

export interface Config<T extends string> {
  source: Source; // name: Theme, link: blah blah
  value: T; // CustomColorPalette
  id: string;
  nameIndex: keyof T | ''; // theme.name
}

export interface SEND_CONFIG_EVENT_TYPE<T extends string> {
  config: Config<T>;
}
export const SEND_CONFIG_EVENT = 'send-config-event';

export class Config<T> {
  source: Source; // name: Theme, link: blah blah
  value: T; // CustomColorPalette
  id: string;
  nameIndex: keyof T | ''; // theme.name

  constructor(source: Source, value: T, nameIndex: keyof T | '', id?: string) {
    this.source = source;
    this.value = value;
    if (id) {
      this.id = id;
    } else {
      this.id = genShortID(10);
    }
    this.nameIndex = nameIndex;
  }

  getConfigName() {
    if (this.nameIndex === '') {
      return this.source.name.toLocaleLowerCase();
    }

    return this.value[this.nameIndex];
  }

  serialize() {
    return {
      ...this,
      value: JSON.stringify(this.value),
    };
  }
}

// when we press share, we want to share this to the modal
export interface ExtensionConfig<T>
  extends Pick<BookeraModule, 'version' | 'title' | 'description' | 'id'> {
  configs: Config<T>[]; // pass in Theme[], or KeyboardShortcut[]
  markdown: string; // description quickly describes the extension. markdown is used for Details, Features, Changelog
  user: User; // user who publishes -> for now, you are assigned a random session_id or some shit
  isPublished: boolean;
}

export class ExtensionConfig<T extends string> implements ExtensionConfig<T> {
  configs: Config<T>[];
  markdown: string;
  user: User;
  isPublished: boolean;

  constructor(
    version: string,
    title: string,
    description: string,
    id: string,
    configs: Config<T>[],
    markdown: string,
    user: User,
    isPublished: boolean
  ) {
    this.version = version;
    this.title = title;
    this.description = description;
    this.id = id;
    this.configs = configs;
    this.markdown = markdown;
    this.user = user;
    this.isPublished = isPublished;
  }

  static FromInterface<T extends string>(
    data: ExtensionConfig<T>
  ): ExtensionConfig<T> {
    const configs = data.configs.map(
      (config) =>
        new Config<T>(
          config.source,
          config.value as unknown as string,
          config.nameIndex,
          config.id
        )
    );

    return new ExtensionConfig<T>(
      data.version ? data.version : '',
      data.title ? data.title : '',
      data.description ? data.description : '',
      data.id ? data.id : '',
      configs,
      data.markdown,
      data.user,
      data.isPublished
    );
  }

  serialize() {
    return {
      ...this,
      configs: this.configs.map((config: Config<any>) => config.serialize()),
    };
  }

  // Add any additional methods or logic here
}
