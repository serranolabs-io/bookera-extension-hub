import { genShortID } from '../model/util';
import type { Tab } from './tab';

export const UPDATE_BookeraModule_EVENT = 'update-BookeraModule-event';
export type UPDATE_BookeraModule_EVENT_TYPE = BookeraModule;

export const RequestUpdateEvent = 'request-update';
export interface RequestUpdateEventType {
  moduleId: string;
}

export const DEFAULT_VERSION = '0.0.1';

export type BookeraModuleClass = new (
  renderMode: RenderMode,
  module: BookeraModule,
  _panelTabId?: string
) => object;

export const BookeraModuleRegistryClasses: Record<string, BookeraModuleClass> =
  {};

export type RenderMode =
  | 'renderInSettings'
  | 'renderInSidePanel'
  | 'renderInDaemon'
  | 'renderInPanel';

export type RenderModeArray = Array<RenderMode>;

const renderMode: RenderModeArray = ['renderInDaemon', 'renderInPanel'];

// extensions are just extended functionality from the core system, BookeraModules
export class BookeraModule {
  version?: string;
  title?: string;
  description?: string;
  tab?: Tab;
  id?: string;
  hasSettings?: boolean;
  // * no id since there will always be one instance, of BookeraModules. They are not meant to be passed. But, there are versions.
  constructor(
    version?: string,
    title?: string,
    description?: string,
    tab?: Tab,
    id?: string,
    hasSettings?: boolean,
    constructorType?: BookeraModuleClass
  ) {
    if (version) {
      this.version = version;
    }
    if (title) {
      this.title = title;
    }
    if (description) {
      this.description = description;
    }

    if (constructorType) {
      const constructorTypeName = this.getConstructorTypeName();
      if (constructorTypeName) {
        BookeraModuleRegistryClasses[constructorTypeName] = constructorType;
      }
    }

    if (id) {
      this.id = id;
    } else {
      this.id = genShortID(10);
    }

    if (tab) {
      this.tab = tab;
    }
    if (tab && id) {
      this.tab!.id = id;
    }

    if (hasSettings) {
      this.hasSettings = hasSettings;
    } else {
      this.hasSettings = false;
    }
  }

  getConstructorTypeName() {
    return this.title?.replaceAll(' ', '').concat('Element');
  }

  setHasSettings(val: boolean): this {
    this.hasSettings = val;
    return this;
  }
}
