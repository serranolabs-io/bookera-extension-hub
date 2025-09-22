import { SupabaseClient } from '@supabase/supabase-js';
import { genShortID } from '../model/util';
import type { Tab } from './tab';
import { z } from 'zod';

export const UPDATE_BookeraModule_EVENT = 'update-BookeraModule-event';
export type UPDATE_BookeraModule_EVENT_TYPE = BookeraModule;

export const RequestUpdateEvent = 'request-update';
export interface RequestUpdateEventType {
  moduleId: string;
}

export const DEFAULT_VERSION = '0.0.1';
export interface BookeraModuleConfig<T = unknown> {
  renderMode: RenderMode;
  module: BookeraModule<T>;
  _panelTabId?: string;
  supabase?: SupabaseClient;
  instanceType?: T;
}

export type BookeraModuleClass<T extends object = {}> = new (
  config: BookeraModuleConfig<T>
) => object;

export const BookeraModuleRegistryClasses: Record<
  string,
  BookeraModuleClass<any>
> = {};

const RenderModeSchema = z.enum([
  'renderInSettings',
  'renderInSidePanel',
  'renderInDaemon',
  'renderInPanel',
]);
export type RenderMode = z.infer<typeof RenderModeSchema>;

// extensions are just extended functionality from the core system, BookeraModules

export const BookeraModuleSchema = z.object({
  version: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  tab: z.any().optional(), // Replace `z.any()` with a specific schema for `Tab` if available
  id: z.string().optional(),
  renderModes: z.array(RenderModeSchema).optional(),
  instances: z.array(z.unknown()), // Replace `z.unknown()` with a specific schema for `T` if available
});

export type BookeraModuleI = z.infer<typeof BookeraModuleSchema>;

export class BookeraModule<T = unknown> implements BookeraModuleI {
  version?: string;
  title?: string;
  description?: string;
  tab?: Tab;
  id?: string;
  renderModes?: RenderMode[];
  instances: T[];

  // * no id since there will always be one instance, of BookeraModules. They are not meant to be passed. But, there are versions.
  constructor(
    version?: string,
    title?: string,
    description?: string,
    tab?: Tab,
    id?: string,
    renderModes?: RenderMode[],
    constructorType?: BookeraModuleClass,
    instances?: T[]
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

    if (instances) {
      this.instances = instances;
    } else {
      this.instances = [];
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
    return this.title?.replace(/ /g, '').concat('Element');
  }
}
