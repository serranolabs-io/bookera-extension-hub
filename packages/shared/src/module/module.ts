// Clean, simple module system - no bullshit
import { z } from 'zod';
import type { Tab } from './tab';
import { genShortID } from '../model/util';

// Re-export everything from clean-module
export * from './clean-module';

// Legacy compatibility - these will be deprecated
export const UPDATE_BookeraModule_EVENT = 'update-BookeraModule-event';
export const RequestUpdateEvent = 'request-update';
export const DEFAULT_VERSION = '1.0.0';

export interface RequestUpdateEventType {
  moduleId: string;
}

// Legacy types for backward compatibility
export type UPDATE_BookeraModule_EVENT_TYPE = any;
export type BookeraModuleConfig<T = unknown> = any;
export type BookeraModuleClass<T extends object = {}> = any;
export type BookeraModuleI = any;

// Legacy registry for backward compatibility
export const BookeraModuleRegistryClasses: Record<string, any> = {};

// Legacy BookeraModule class - DEPRECATED, use createModule() instead
export class BookeraModule<T = unknown> {
  version?: string;
  title?: string;
  description?: string;
  tab?: Tab;
  id?: string;
  renderModes?: string[];
  instances: T[] = [];

  constructor(
    version?: string,
    title?: string,
    description?: string,
    tab?: Tab,
    id?: string,
    renderModes?: string[],
    constructorType?: any,
    instances?: T[]
  ) {
    this.version = version || DEFAULT_VERSION;
    this.title = title || 'Untitled Module';
    this.description = description || 'No description';
    this.id = id || genShortID(10);
    this.renderModes = renderModes || ['renderInSettings'];
    this.tab = tab;
    this.instances = instances || [];

    // Legacy registry registration
    if (constructorType && this.title) {
      const typeName = this.getConstructorTypeName();
      if (typeName) {
        BookeraModuleRegistryClasses[typeName] = constructorType;
      }
    }
  }

  hasSettings(): boolean {
    return this.renderModes?.includes('renderInSettings') || false;
  }

  hasPanel(): boolean {
    return this.renderModes?.includes('renderInPanel') || false;
  }

  hasSidePanel(): boolean {
    return this.renderModes?.includes('renderInSidePanel') || false;
  }

  hasModuleDaemon(): boolean {
    return this.renderModes?.includes('renderInDaemon') || false;
  }

  getConstructorTypeName(): string {
    return this.title?.replace(/ /g, '').concat('Element') || 'UnknownElement';
  }
}

// Legacy schema for validation
export const BookeraModuleSchema = z.object({
  version: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  tab: z.any().optional(),
  id: z.string().optional(),
  renderModes: z.array(z.string()).optional(),
  instances: z.array(z.unknown()).default([]),
});

// Migration helper to convert legacy to new system
export function migrateLegacyModule(legacy: BookeraModule<any>): import('./clean-module').BookeraModule {
  const { createModule } = require('./clean-module');
  
  return createModule({
    id: legacy.id,
    title: legacy.title || 'Untitled Module',
    description: legacy.description || 'No description',
    version: legacy.version || DEFAULT_VERSION,
    renderModes: (legacy.renderModes || ['renderInSettings']) as any[],
    tab: legacy.tab,
  });
}

// Helper to convert new to legacy for compatibility
export function createLegacyModule(modern: import('./clean-module').BookeraModule): BookeraModule<any> {
  const legacy = new BookeraModule(
    modern.metadata.version,
    modern.metadata.title,
    modern.metadata.description,
    modern.tab,
    modern.metadata.id,
    modern.metadata.renderModes,
    undefined,
    []
  );
  
  return legacy;
}