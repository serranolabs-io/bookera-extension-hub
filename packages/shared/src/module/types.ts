import { z } from 'zod';
import type { Tab } from './tab';
import type { SupabaseClient } from '@supabase/supabase-js';

// Render mode validation schema
export const RenderModeSchema = z.enum([
  'renderInSettings',
  'renderInSidePanel',
  'renderInDaemon',
  'renderInPanel',
]);

export type RenderMode = z.infer<typeof RenderModeSchema>;

// Tab validation schema
export const TabSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  icon: z.string(),
  position: z.enum(['left', 'right']),
  isAppended: z.boolean().default(false),
  isToggledInDrawer: z.boolean().default(false),
  value: z.string().optional(),
});

// Module metadata schema
export const ModuleMetadataSchema = z.object({
  version: z.string(),
  title: z.string(),
  description: z.string(),
  id: z.string(),
  renderModes: z.array(RenderModeSchema),
});

export type ModuleMetadata = z.infer<typeof ModuleMetadataSchema>;

// Base module interface
export interface IBookeraModule<T = unknown> {
  readonly metadata: ModuleMetadata;
  readonly tab?: Tab;
  readonly instances: ReadonlyArray<T>;
  
  hasSettings(): boolean;
  hasPanel(): boolean;
  hasSidePanel(): boolean;
  hasModuleDaemon(): boolean;
  addInstance(instance: T): void;
  removeInstance(instanceId: string): void;
  getInstance(instanceId: string): T | undefined;
}

// Module configuration interface
export interface ModuleConfig<T = unknown> {
  readonly renderMode: RenderMode;
  readonly module: IBookeraModule<T>;
  readonly panelTabId?: string;
  readonly supabase?: SupabaseClient;
  readonly instanceType?: T;
}

// Type-safe module class constraint
export interface ModuleElementConstructor<T = unknown> {
  new (config: ModuleConfig<T>): ModuleElementInstance<T>;
}

// Module element instance interface
export interface ModuleElementInstance<T = unknown> {
  readonly module: IBookeraModule<T>;
  readonly renderMode: RenderMode;
  readonly instanceId?: string;
  
  renderInSettings(): unknown;
  renderInSidePanel(): unknown;
  renderInModuleDaemon(): unknown;
  renderInPanel(): unknown;
}

// Registry entry interface
export interface ModuleRegistryEntry<T = unknown> {
  readonly metadata: ModuleMetadata;
  readonly moduleClass: ModuleElementConstructor<T>;
  readonly moduleInstance: IBookeraModule<T>;
}

// Type-safe registry interface
export interface IModuleRegistry {
  register<T>(
    module: IBookeraModule<T>,
    elementClass: ModuleElementConstructor<T>
  ): void;
  
  get<T>(moduleId: string): ModuleRegistryEntry<T> | undefined;
  
  getAll(): ReadonlyArray<ModuleRegistryEntry<any>>;
  
  createInstance<T>(
    moduleId: string,
    config: ModuleConfig<T>
  ): ModuleElementInstance<T> | undefined;
  
  getModulesWithRenderMode(renderMode: RenderMode): ReadonlyArray<ModuleRegistryEntry<any>>;
}

// Factory function type
export type ModuleFactory<T> = (config: ModuleConfig<T>) => ModuleElementInstance<T>;

// Update event types
export interface ModuleUpdateEvent<T = unknown> {
  readonly moduleId: string;
  readonly module: IBookeraModule<T>;
  readonly changeType: 'created' | 'updated' | 'deleted';
}

// Error types
export class ModuleRegistrationError extends Error {
  constructor(moduleId: string, reason: string) {
    super(`Failed to register module '${moduleId}': ${reason}`);
    this.name = 'ModuleRegistrationError';
  }
}

export class ModuleNotFoundError extends Error {
  constructor(moduleId: string) {
    super(`Module with id '${moduleId}' not found in registry`);
    this.name = 'ModuleNotFoundError';
  }
}

export class ModuleValidationError extends Error {
  constructor(moduleId: string, validationErrors: string[]) {
    super(`Module '${moduleId}' validation failed: ${validationErrors.join(', ')}`);
    this.name = 'ModuleValidationError';
  }
}