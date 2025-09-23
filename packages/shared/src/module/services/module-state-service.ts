import { Bag, BagManager } from '@pb33f/saddlebag';
import localforage from 'localforage';
import type { IBookeraModule, ModuleUpdateEvent } from '../types';
import { ModuleValidator, type ValidationResult } from '../validation';

/**
 * Handles module state persistence and synchronization
 * Separates state management logic from UI components
 */
export class ModuleStateService<T = unknown> {
  private readonly bagManager: BagManager;
  private readonly moduleId: string;
  private bag: Bag<T> | undefined;
  private listeners: Set<(data: T) => void> = new Set();

  constructor(bagManager: BagManager, moduleId: string) {
    this.bagManager = bagManager;
    this.moduleId = moduleId;
  }

  /**
   * Initialize state with defaults if no saved state exists
   */
  async initialize(defaultsFactory: () => T, key?: string): Promise<Bag<T>> {
    const storageKey = key || this.moduleId;
    this.bag = this.bagManager.createBag<T>(storageKey);

    const savedState = await this.loadFromStorage(storageKey);

    if (!savedState) {
      const defaults = defaultsFactory();
      await this.setState(defaults);
    } else {
      this.bag.populate(savedState);
    }

    // Set up change listeners
    this.bag.onAllChanges(this.handleStateChange.bind(this));

    return this.bag;
  }

  /**
   * Get current state
   */
  getState(): Map<string, T> | undefined {
    return this.bag?.export();
  }

  /**
   * Get specific state value
   */
  getValue(key: string): T | undefined {
    return this.bag?.get(key);
  }

  /**
   * Set state value with automatic persistence
   */
  async setState(data: T, key: string = 'default'): Promise<void> {
    if (!this.bag) {
      throw new Error('State service not initialized');
    }

    this.bag.set(key, data);
    await this.persistToStorage();
    this.notifyListeners(data);
  }

  /**
   * Update partial state
   */
  async updateState(updates: Partial<T>, key: string = 'default'): Promise<void> {
    const current = this.getValue(key);
    if (current && typeof current === 'object') {
      const updated = { ...current, ...updates };
      await this.setState(updated as T, key);
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (data: T) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Clear all state
   */
  async clearState(): Promise<void> {
    if (this.bag) {
      this.bag.clear();
      await this.persistToStorage();
    }
  }

  /**
   * Validate state before setting
   */
  async setValidatedState(
    data: T,
    validator: (data: T) => ValidationResult<T>,
    key: string = 'default'
  ): Promise<ValidationResult<T>> {
    const result = validator(data);
    
    if (result.success && result.data) {
      await this.setState(result.data, key);
    }
    
    return result;
  }

  private async loadFromStorage(key: string): Promise<Map<string, T> | null> {
    try {
      return await localforage.getItem<Map<string, T>>(key);
    } catch (error) {
      console.error(`Failed to load state for ${key}:`, error);
      return null;
    }
  }

  private async persistToStorage(): Promise<void> {
    if (!this.bag) return;

    try {
      await localforage.setItem(this.moduleId, this.bag.export());
    } catch (error) {
      console.error(`Failed to persist state for ${this.moduleId}:`, error);
    }
  }

  private handleStateChange(changedKey: string): void {
    const changedValue = this.getValue(changedKey);
    if (changedValue) {
      this.notifyListeners(changedValue);
    }
  }

  private notifyListeners(data: T): void {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    });
  }
}

/**
 * Global module registry state service
 * Manages the registry of all modules
 */
export class ModuleRegistryStateService {
  private static instance: ModuleRegistryStateService;
  private bagManager: BagManager;
  private registryBag: Bag<IBookeraModule> | undefined;
  private updateListeners: Set<(event: ModuleUpdateEvent) => void> = new Set();

  constructor(bagManager: BagManager) {
    this.bagManager = bagManager;
  }

  static getInstance(bagManager?: BagManager): ModuleRegistryStateService {
    if (!this.instance) {
      if (!bagManager) {
        throw new Error('BagManager required for first instantiation');
      }
      this.instance = new ModuleRegistryStateService(bagManager);
    }
    return this.instance;
  }

  async initialize(
    defaultModules: IBookeraModule[],
    registryKey: string = 'module-registry'
  ): Promise<void> {
    this.registryBag = this.bagManager.createBag<IBookeraModule>(registryKey);

    const savedModules = await localforage.getItem<Map<string, IBookeraModule>>(registryKey);

    if (!savedModules) {
      // Initialize with default modules
      defaultModules.forEach(module => {
        this.registryBag!.set(module.metadata.id, module);
      });
      await this.persistRegistry();
    } else {
      this.registryBag.populate(savedModules);
    }

    this.registryBag.onAllChanges(this.handleRegistryChange.bind(this));
  }

  getModule(moduleId: string): IBookeraModule | undefined {
    return this.registryBag?.get(moduleId);
  }

  getAllModules(): Map<string, IBookeraModule> | undefined {
    return this.registryBag?.export();
  }

  async updateModule(module: IBookeraModule): Promise<ValidationResult> {
    if (!this.registryBag) {
      return {
        success: false,
        errors: ['Registry not initialized'],
        warnings: [],
      };
    }

    // Validate module before updating
    const validation = ModuleValidator.performHealthCheck(module);
    if (!validation.success) {
      return validation;
    }

    this.registryBag.set(module.metadata.id, module);
    await this.persistRegistry();

    this.notifyUpdateListeners({
      moduleId: module.metadata.id,
      module,
      changeType: 'updated',
    });

    return {
      success: true,
      errors: [],
      warnings: validation.warnings,
    };
  }

  async addModule(module: IBookeraModule): Promise<ValidationResult> {
    if (!this.registryBag) {
      return {
        success: false,
        errors: ['Registry not initialized'],
        warnings: [],
      };
    }

    // Check if module already exists
    if (this.registryBag.get(module.metadata.id)) {
      return {
        success: false,
        errors: [`Module with id '${module.metadata.id}' already exists`],
        warnings: [],
      };
    }

    // Validate module
    const validation = ModuleValidator.performHealthCheck(module);
    if (!validation.success) {
      return validation;
    }

    this.registryBag.set(module.metadata.id, module);
    await this.persistRegistry();

    this.notifyUpdateListeners({
      moduleId: module.metadata.id,
      module,
      changeType: 'created',
    });

    return {
      success: true,
      errors: [],
      warnings: validation.warnings,
    };
  }

  async removeModule(moduleId: string): Promise<ValidationResult> {
    if (!this.registryBag) {
      return {
        success: false,
        errors: ['Registry not initialized'],
        warnings: [],
      };
    }

    const module = this.registryBag.get(moduleId);
    if (!module) {
      return {
        success: false,
        errors: [`Module with id '${moduleId}' not found`],
        warnings: [],
      };
    }

    this.registryBag.delete(moduleId);
    await this.persistRegistry();

    this.notifyUpdateListeners({
      moduleId,
      module,
      changeType: 'deleted',
    });

    return {
      success: true,
      errors: [],
      warnings: [],
    };
  }

  getModulesByRenderMode(renderMode: string): IBookeraModule[] {
    const allModules = this.getAllModules();
    if (!allModules) return [];

    return Array.from(allModules.values()).filter(module =>
      module.metadata.renderModes.includes(renderMode as any)
    );
  }

  subscribeToUpdates(listener: (event: ModuleUpdateEvent) => void): () => void {
    this.updateListeners.add(listener);
    
    return () => {
      this.updateListeners.delete(listener);
    };
  }

  private async persistRegistry(): Promise<void> {
    if (!this.registryBag) return;

    try {
      await localforage.setItem('module-registry', this.registryBag.export());
    } catch (error) {
      console.error('Failed to persist module registry:', error);
    }
  }

  private handleRegistryChange(moduleId: string): void {
    const module = this.getModule(moduleId);
    if (module) {
      this.notifyUpdateListeners({
        moduleId,
        module,
        changeType: 'updated',
      });
    }
  }

  private notifyUpdateListeners(event: ModuleUpdateEvent): void {
    this.updateListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in module update listener:', error);
      }
    });
  }
}