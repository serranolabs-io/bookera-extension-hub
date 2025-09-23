import { z } from 'zod';
import type { Tab } from './tab';

// Clean, simple types without the bullshit
export const RenderModeSchema = z.enum([
  'renderInSettings',
  'renderInSidePanel', 
  'renderInDaemon',
  'renderInPanel',
]);

export type RenderMode = z.infer<typeof RenderModeSchema>;

// Module metadata - the actual plugin definition
export const ModuleMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  version: z.string(),
  renderModes: z.array(RenderModeSchema),
});

export type ModuleMetadata = z.infer<typeof ModuleMetadataSchema>;

// Simple module type - just a plain object, no class bullshit
export interface BookeraModule {
  readonly metadata: ModuleMetadata;
  readonly tab?: Tab;
}

// Factory function for clean creation - returns plain object
export function createModule(config: {
  id?: string;
  title: string;
  description: string;
  version?: string;
  renderModes: RenderMode[];
  tab?: Tab;
}): BookeraModule {
  const metadata: ModuleMetadata = {
    id: config.id || generateId(),
    title: config.title,
    description: config.description,
    version: config.version || '1.0.0',
    renderModes: config.renderModes,
  };

  return {
    metadata,
    tab: config.tab,
  };
}

// Simple ID generation
function generateId(): string {
  return Math.random().toString(36).substring(2, 12);
}

// Utility functions for working with modules
export function hasSettings(module: BookeraModule): boolean {
  return module.metadata.renderModes.includes('renderInSettings');
}

export function hasPanel(module: BookeraModule): boolean {
  return module.metadata.renderModes.includes('renderInPanel');
}

export function hasSidePanel(module: BookeraModule): boolean {
  return module.metadata.renderModes.includes('renderInSidePanel');
}

export function hasModuleDaemon(module: BookeraModule): boolean {
  return module.metadata.renderModes.includes('renderInDaemon');
}

export function getConstructorTypeName(module: BookeraModule): string {
  return module.metadata.title.replace(/ /g, '').concat('Element');
}

// Module configuration for element creation
export interface ModuleConfig {
  readonly module: BookeraModule;
  readonly renderMode: RenderMode;
  readonly panelTabId?: string;
  readonly supabase?: any; // Keep for backward compatibility
}

// Type for module element classes - loose typing for compatibility
export interface ModuleElementClass {
  new (config: ModuleConfig): any; // Use any for compatibility with existing elements
}

// Basic module element interface - loose for compatibility
export interface ModuleElement {
  renderInSettings(): unknown;
  renderInSidePanel(): unknown;
  renderInModuleDaemon(): unknown;
  renderInPanel(): unknown;
}

// Registry entry
export interface RegistryEntry {
  readonly module: BookeraModule;
  readonly elementClass: ModuleElementClass;
}

// Clean, simple singleton registry
export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private entries = new Map<string, RegistryEntry>();

  private constructor() {} // Private constructor for singleton

  static getInstance(): ModuleRegistry {
    if (!this.instance) {
      this.instance = new ModuleRegistry();
    }
    return this.instance;
  }

  // Simple static methods for convenience
  static register(module: BookeraModule, elementClass: ModuleElementClass): void {
    ModuleRegistry.getInstance().register(module, elementClass);
  }

  static get(moduleId: string): RegistryEntry | undefined {
    return ModuleRegistry.getInstance().get(moduleId);
  }

  static getAll(): RegistryEntry[] {
    return ModuleRegistry.getInstance().getAll();
  }

  static createInstance(moduleId: string, config: Omit<ModuleConfig, 'module'>): ModuleElement {
    return ModuleRegistry.getInstance().createInstance(moduleId, config);
  }

  // Instance methods
  register(module: BookeraModule, elementClass: ModuleElementClass): void {
    if (this.entries.has(module.metadata.id)) {
      throw new Error(`Module '${module.metadata.id}' already registered`);
    }

    this.entries.set(module.metadata.id, {
      module,
      elementClass,
    });
  }

  get(moduleId: string): RegistryEntry | undefined {
    return this.entries.get(moduleId);
  }

  getAll(): RegistryEntry[] {
    return Array.from(this.entries.values());
  }

  getByRenderMode(renderMode: RenderMode): RegistryEntry[] {
    return this.getAll().filter(entry =>
      entry.module.metadata.renderModes.includes(renderMode)
    );
  }

  createInstance(moduleId: string, config: Omit<ModuleConfig, 'module'>): ModuleElement {
    const entry = this.get(moduleId);
    if (!entry) {
      throw new Error(`Module '${moduleId}' not found`);
    }

    return new entry.elementClass({
      ...config,
      module: entry.module,
    });
  }

  unregister(moduleId: string): boolean {
    return this.entries.delete(moduleId);
  }

  clear(): void {
    this.entries.clear();
  }
}

// User data service - separate from modules
export interface UserDataService<TData = unknown> {
  get(moduleId: string, key?: string): Promise<TData | undefined>;
  set(moduleId: string, data: TData, key?: string): Promise<void>;
  update(moduleId: string, updates: Partial<TData>, key?: string): Promise<void>;
  delete(moduleId: string, key?: string): Promise<void>;
  list(moduleId: string): Promise<TData[]>;
  subscribe(moduleId: string, callback: (data: TData) => void): () => void;
}