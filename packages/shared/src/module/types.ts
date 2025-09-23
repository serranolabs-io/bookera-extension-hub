// Clean, simplified types - no more over-engineering
export * from './clean-module';

// Re-export clean module types as the main types
export type {
  BookeraModule,
  ModuleMetadata,
  RenderMode,
  ModuleConfig,
  ModuleElement,
  ModuleElementClass,
  RegistryEntry,
  UserDataService,
} from './clean-module';

export {
  createModule,
  ModuleRegistry,
  hasSettings,
  hasPanel,
  hasSidePanel,
  hasModuleDaemon,
  getConstructorTypeName,
  RenderModeSchema,
  ModuleMetadataSchema,
} from './clean-module';

// Legacy types for backward compatibility - all marked as deprecated
/** @deprecated Use createModule() instead */
export type IBookeraModule<T = unknown> = any;

/** @deprecated Use ModuleMetadata instead */
export type ModuleMetadata_Legacy = any;

/** @deprecated Use ModuleConfig instead */
export interface ModuleConfig_Legacy<T = unknown> {
  renderMode: string;
  module: any;
  panelTabId?: string;
  supabase?: any;
  instanceType?: T;
}

/** @deprecated Use ModuleElementClass instead */
export interface ModuleElementConstructor<T = unknown> {
  new (config: any): any;
}

/** @deprecated Use ModuleElement instead */
export interface ModuleElementInstance<T = unknown> {
  readonly module: any;
  readonly renderMode: string;
  readonly instanceId?: string;
  renderInSettings(): unknown;
  renderInSidePanel(): unknown;
  renderInModuleDaemon(): unknown;
  renderInPanel(): unknown;
}

/** @deprecated Use RegistryEntry instead */
export interface ModuleRegistryEntry<T = unknown> {
  readonly metadata: any;
  readonly moduleClass: any;
  readonly moduleInstance: any;
}

/** @deprecated Use ModuleRegistry singleton instead */
export interface IModuleRegistry {
  register<T>(module: any, elementClass: any): void;
  get<T>(moduleId: string): any;
  getAll(): ReadonlyArray<any>;
  createInstance<T>(moduleId: string, config: any): any;
  getModulesWithRenderMode(renderMode: string): ReadonlyArray<any>;
}

/** @deprecated Use built-in Error instead */
export class ModuleRegistrationError extends Error {
  constructor(moduleId: string, reason: string) {
    super(`Failed to register module '${moduleId}': ${reason}`);
    this.name = 'ModuleRegistrationError';
  }
}

/** @deprecated Use built-in Error instead */
export class ModuleNotFoundError extends Error {
  constructor(moduleId: string) {
    super(`Module with id '${moduleId}' not found in registry`);
    this.name = 'ModuleNotFoundError';
  }
}

/** @deprecated Use built-in Error instead */
export class ModuleValidationError extends Error {
  constructor(moduleId: string, validationErrors: string[]) {
    super(`Module '${moduleId}' validation failed: ${validationErrors.join(', ')}`);
    this.name = 'ModuleValidationError';
  }
}

// Simple validation result - no need for complex validation anymore
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
}

// Update event types - simplified
export interface ModuleUpdateEvent<T = unknown> {
  readonly moduleId: string;
  readonly module: any;
  readonly changeType: 'created' | 'updated' | 'deleted';
}