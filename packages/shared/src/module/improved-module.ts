import type { Tab } from './tab';
import type { 
  IBookeraModule, 
  ModuleMetadata, 
  RenderMode, 
  ModuleElementConstructor,
  ModuleConfig 
} from './types';
import { ModuleValidator } from './validation';
import { genShortID } from '../model/util';

/**
 * Improved BookeraModule implementation with better type safety
 * Implements the IBookeraModule interface with proper constraints
 */
export class ImprovedBookeraModule<T = unknown> implements IBookeraModule<T> {
  private readonly _metadata: ModuleMetadata;
  private readonly _tab?: Tab;
  private readonly _instances: T[] = [];

  constructor(metadata: ModuleMetadata, tab?: Tab, instances: T[] = []) {
    // Validate metadata on construction
    const validation = ModuleValidator.validateMetadata(metadata);
    if (!validation.success) {
      throw new Error(`Invalid module metadata: ${validation.errors.join(', ')}`);
    }

    this._metadata = { ...metadata };
    this._tab = tab;
    this._instances = [...instances];

    // Ensure ID is set
    if (!this._metadata.id) {
      this._metadata.id = genShortID(10);
    }

    // Set tab ID to match module ID
    if (this._tab && this._metadata.id) {
      this._tab.id = this._metadata.id;
    }
  }

  // Readonly metadata access
  get metadata(): ModuleMetadata {
    return { ...this._metadata };
  }

  // Readonly tab access
  get tab(): Tab | undefined {
    return this._tab;
  }

  // Readonly instances access
  get instances(): ReadonlyArray<T> {
    return [...this._instances];
  }

  // Type-safe render mode checks
  hasSettings(): boolean {
    return this._metadata.renderModes.includes('renderInSettings');
  }

  hasPanel(): boolean {
    return this._metadata.renderModes.includes('renderInPanel');
  }

  hasSidePanel(): boolean {
    return this._metadata.renderModes.includes('renderInSidePanel');
  }

  hasModuleDaemon(): boolean {
    return this._metadata.renderModes.includes('renderInDaemon');
  }

  /**
   * Add instance with validation
   */
  addInstance(instance: T): void {
    if (!instance) {
      throw new Error('Instance cannot be null or undefined');
    }

    // Check for duplicates if instance has an ID
    if (typeof instance === 'object' && instance !== null && 'id' in instance) {
      const existingIndex = this._instances.findIndex(
        existing => typeof existing === 'object' && 
                   existing !== null && 
                   'id' in existing && 
                   existing.id === (instance as any).id
      );
      
      if (existingIndex !== -1) {
        throw new Error(`Instance with id '${(instance as any).id}' already exists`);
      }
    }

    this._instances.push(instance);
  }

  /**
   * Remove instance by ID (if instance has ID property)
   */
  removeInstance(instanceId: string): void {
    const index = this._instances.findIndex(
      instance => typeof instance === 'object' && 
                  instance !== null && 
                  'id' in instance && 
                  (instance as any).id === instanceId
    );

    if (index === -1) {
      throw new Error(`Instance with id '${instanceId}' not found`);
    }

    this._instances.splice(index, 1);
  }

  /**
   * Get instance by ID (if instance has ID property)
   */
  getInstance(instanceId: string): T | undefined {
    return this._instances.find(
      instance => typeof instance === 'object' && 
                  instance !== null && 
                  'id' in instance && 
                  (instance as any).id === instanceId
    );
  }

  /**
   * Create a copy of this module with new metadata
   */
  withMetadata(updates: Partial<ModuleMetadata>): ImprovedBookeraModule<T> {
    const newMetadata = { ...this._metadata, ...updates };
    return new ImprovedBookeraModule<T>(newMetadata, this._tab, this._instances);
  }

  /**
   * Create a copy of this module with new tab
   */
  withTab(tab: Tab): ImprovedBookeraModule<T> {
    return new ImprovedBookeraModule<T>(this._metadata, tab, this._instances);
  }

  /**
   * Get constructor type name for registry lookup
   */
  getConstructorTypeName(): string {
    return this._metadata.title.replace(/ /g, '').concat('Element');
  }

  /**
   * Validate this module's health
   */
  validate(): { success: boolean; errors: string[]; warnings: string[] } {
    return ModuleValidator.performHealthCheck(this);
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): any {
    return {
      metadata: this._metadata,
      tab: this._tab,
      instances: this._instances,
    };
  }

  /**
   * Create from plain object
   */
  static fromJSON<T>(data: any): ImprovedBookeraModule<T> {
    return new ImprovedBookeraModule<T>(
      data.metadata,
      data.tab,
      data.instances || []
    );
  }
}

/**
 * Type-safe module registry implementation
 */
export class TypeSafeModuleRegistry {
  private static instance: TypeSafeModuleRegistry;
  private registrations: Map<string, {
    module: IBookeraModule<any>;
    elementClass: ModuleElementConstructor<any>;
  }> = new Map();

  private constructor() {}

  static getInstance(): TypeSafeModuleRegistry {
    if (!this.instance) {
      this.instance = new TypeSafeModuleRegistry();
    }
    return this.instance;
  }

  /**
   * Register a module with its element class
   */
  register<T>(
    module: IBookeraModule<T>,
    elementClass: ModuleElementConstructor<T>
  ): void {
    // Validate module before registration
    const validation = ModuleValidator.performHealthCheck(module);
    if (!validation.success) {
      throw new Error(`Cannot register invalid module: ${validation.errors.join(', ')}`);
    }

    const moduleId = module.metadata.id;
    if (this.registrations.has(moduleId)) {
      throw new Error(`Module with id '${moduleId}' is already registered`);
    }

    this.registrations.set(moduleId, {
      module,
      elementClass,
    });
  }

  /**
   * Get module registration by ID
   */
  get<T>(moduleId: string): {
    module: IBookeraModule<T>;
    elementClass: ModuleElementConstructor<T>;
  } | undefined {
    return this.registrations.get(moduleId) as any;
  }

  /**
   * Check if module is registered
   */
  has(moduleId: string): boolean {
    return this.registrations.has(moduleId);
  }

  /**
   * Get all registered modules
   */
  getAll(): Array<{
    module: IBookeraModule<any>;
    elementClass: ModuleElementConstructor<any>;
  }> {
    return Array.from(this.registrations.values());
  }

  /**
   * Create module instance with configuration
   */
  createInstance<T>(
    moduleId: string,
    config: ModuleConfig<T>
  ): any | undefined {
    const registration = this.get<T>(moduleId);
    if (!registration) {
      throw new Error(`Module '${moduleId}' is not registered`);
    }

    // Validate configuration
    const configValidation = ModuleValidator.validateRenderModeCompatibility(
      config.renderMode,
      registration.module.metadata.renderModes
    );

    if (!configValidation.success) {
      throw new Error(`Invalid configuration: ${configValidation.errors.join(', ')}`);
    }

    return new registration.elementClass(config);
  }

  /**
   * Get modules that support a specific render mode
   */
  getModulesWithRenderMode(renderMode: RenderMode): Array<{
    module: IBookeraModule<any>;
    elementClass: ModuleElementConstructor<any>;
  }> {
    return this.getAll().filter(registration =>
      registration.module.metadata.renderModes.includes(renderMode)
    );
  }

  /**
   * Unregister a module
   */
  unregister(moduleId: string): boolean {
    return this.registrations.delete(moduleId);
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.registrations.clear();
  }

  /**
   * Get registration count
   */
  size(): number {
    return this.registrations.size;
  }

  /**
   * Get all module IDs
   */
  getModuleIds(): string[] {
    return Array.from(this.registrations.keys());
  }
}

/**
 * Builder pattern for creating modules with better ergonomics
 */
export class ModuleBuilder<T = unknown> {
  private _metadata: Partial<ModuleMetadata> = {};
  private _tab?: Tab;
  private _instances: T[] = [];

  static create<T>(): ModuleBuilder<T> {
    return new ModuleBuilder<T>();
  }

  withId(id: string): ModuleBuilder<T> {
    this._metadata.id = id;
    return this;
  }

  withTitle(title: string): ModuleBuilder<T> {
    this._metadata.title = title;
    return this;
  }

  withDescription(description: string): ModuleBuilder<T> {
    this._metadata.description = description;
    return this;
  }

  withVersion(version: string): ModuleBuilder<T> {
    this._metadata.version = version;
    return this;
  }

  withRenderModes(renderModes: RenderMode[]): ModuleBuilder<T> {
    this._metadata.renderModes = [...renderModes];
    return this;
  }

  withTab(tab: Tab): ModuleBuilder<T> {
    this._tab = tab;
    return this;
  }

  withInstances(instances: T[]): ModuleBuilder<T> {
    this._instances = [...instances];
    return this;
  }

  addInstance(instance: T): ModuleBuilder<T> {
    this._instances.push(instance);
    return this;
  }

  build(): ImprovedBookeraModule<T> {
    // Ensure required fields
    if (!this._metadata.id) {
      this._metadata.id = genShortID(10);
    }

    if (!this._metadata.title) {
      throw new Error('Module title is required');
    }

    if (!this._metadata.description) {
      throw new Error('Module description is required');
    }

    if (!this._metadata.version) {
      this._metadata.version = '1.0.0';
    }

    if (!this._metadata.renderModes || this._metadata.renderModes.length === 0) {
      throw new Error('At least one render mode is required');
    }

    return new ImprovedBookeraModule<T>(
      this._metadata as ModuleMetadata,
      this._tab,
      this._instances
    );
  }
}

/**
 * Utility functions for backward compatibility
 */
export class ModuleCompat {
  /**
   * Convert legacy BookeraModule to new ImprovedBookeraModule
   */
  static upgrade<T>(legacyModule: any): ImprovedBookeraModule<T> {
    const metadata: ModuleMetadata = {
      id: legacyModule.id || genShortID(10),
      title: legacyModule.title || 'Untitled Module',
      description: legacyModule.description || 'No description provided',
      version: legacyModule.version || '1.0.0',
      renderModes: legacyModule.renderModes || ['renderInSettings'],
    };

    return new ImprovedBookeraModule<T>(
      metadata,
      legacyModule.tab,
      legacyModule.instances || []
    );
  }

  /**
   * Convert ImprovedBookeraModule to legacy format for compatibility
   */
  static downgrade<T>(improvedModule: ImprovedBookeraModule<T>): any {
    const metadata = improvedModule.metadata;
    
    return {
      id: metadata.id,
      title: metadata.title,
      description: metadata.description,
      version: metadata.version,
      renderModes: metadata.renderModes,
      tab: improvedModule.tab,
      instances: [...improvedModule.instances],
      
      // Legacy methods
      hasSettings: () => improvedModule.hasSettings(),
      hasPanel: () => improvedModule.hasPanel(),
      hasSidePanel: () => improvedModule.hasSidePanel(),
      hasModuleDaemon: () => improvedModule.hasModuleDaemon(),
      getConstructorTypeName: () => improvedModule.getConstructorTypeName(),
    };
  }
}