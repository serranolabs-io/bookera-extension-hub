import { SupabaseClient } from '@supabase/supabase-js';
import { genShortID } from '../model/util';
import type { Tab } from './tab';

export const UPDATE_BookeraModule_EVENT = 'update-BookeraModule-event';
export type UPDATE_BookeraModule_EVENT_TYPE = BookeraModule;

export const RequestUpdateEvent = 'request-update';
export interface RequestUpdateEventType {
  moduleId: string;
}

export const DEFAULT_VERSION = '0.0.1';
export interface BookeraModuleConfig {
  renderMode: RenderMode;
  module: BookeraModule;
  _panelTabId?: string;
  supabase: SupabaseClient;
}

export type BookeraModuleClass = new (config: BookeraModuleConfig) => object;

export const BookeraModuleRegistryClasses: Record<string, BookeraModuleClass> =
  {};

export type RenderMode =
  | 'renderInSettings'
  | 'renderInSidePanel'
  | 'renderInDaemon'
  | 'renderInPanel';

// extensions are just extended functionality from the core system, BookeraModules
export class BookeraModule {
  version?: string;
  title?: string;
  description?: string;
  tab?: Tab;
  id?: string;
  renderModes?: RenderMode[];

  // * no id since there will always be one instance, of BookeraModules. They are not meant to be passed. But, there are versions.
  constructor(
    version?: string,
    title?: string,
    description?: string,
    tab?: Tab,
    id?: string,
    renderModes?: RenderMode[],
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
    if (renderModes) {
      this.renderModes = renderModes;
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
  }

  hasSettings() {
    if (this.renderModes?.includes('renderInSettings')) {
      return true;
    }
    return false;
  }

  hasPanel() {
    if (this.renderModes?.includes('renderInPanel')) {
      return true;
    }
    return false;
  }

  hasSidePanel() {
    if (this.renderModes?.includes('renderInSidePanel')) {
      return true;
    }
    return false;
  }

  hasModuleDaemon() {
    if (this.renderModes?.includes('renderInDaemon')) {
      return true;
    }
    return false;
  }

  getConstructorTypeName() {
    return this.title?.replaceAll(' ', '').concat('Element');
  }
}
