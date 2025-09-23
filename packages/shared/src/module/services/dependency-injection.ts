import type { SupabaseClient } from '@supabase/supabase-js';
import { BagManager } from '@pb33f/saddlebag';
import type { ModuleConfig, IBookeraModule } from '../types';

/**
 * Dependency injection container for module system
 * Provides centralized dependency management and injection
 */
export class DIContainer {
  private static instance: DIContainer;
  private services: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();
  private singletons: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): DIContainer {
    if (!this.instance) {
      this.instance = new DIContainer();
    }
    return this.instance;
  }

  /**
   * Register a service instance
   */
  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  /**
   * Register a factory function for lazy instantiation
   */
  registerFactory<T>(key: string, factory: () => T): void {
    this.factories.set(key, factory);
  }

  /**
   * Register a singleton factory
   */
  registerSingleton<T>(key: string, factory: () => T): void {
    this.factories.set(key, factory);
  }

  /**
   * Get a service instance
   */
  get<T>(key: string): T | undefined {
    // Check if already instantiated
    if (this.services.has(key)) {
      return this.services.get(key);
    }

    // Check for singleton
    if (this.singletons.has(key)) {
      return this.singletons.get(key);
    }

    // Check for factory
    if (this.factories.has(key)) {
      const factory = this.factories.get(key)!;
      const instance = factory();
      
      // Store as singleton if registered as such
      this.singletons.set(key, instance);
      return instance;
    }

    return undefined;
  }

  /**
   * Get required service (throws if not found)
   */
  getRequired<T>(key: string): T {
    const service = this.get<T>(key);
    if (!service) {
      throw new Error(`Required service '${key}' not found in DI container`);
    }
    return service;
  }

  /**
   * Check if service is registered
   */
  has(key: string): boolean {
    return this.services.has(key) || this.factories.has(key) || this.singletons.has(key);
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }

  /**
   * Get all registered service keys
   */
  getRegisteredKeys(): string[] {
    const keys = new Set<string>();
    this.services.forEach((_, key) => keys.add(key));
    this.factories.forEach((_, key) => keys.add(key));
    this.singletons.forEach((_, key) => keys.add(key));
    return Array.from(keys);
  }
}

/**
 * Service registry keys for common services
 */
export const ServiceKeys = {
  SUPABASE_CLIENT: 'supabase-client',
  BAG_MANAGER: 'bag-manager',
  MODULE_REGISTRY: 'module-registry',
  EVENT_BUS: 'event-bus',
  LOGGER: 'logger',
  CONFIG_SERVICE: 'config-service',
} as const;

/**
 * Injectable decorator for marking classes as injectable
 */
export function Injectable(key?: string) {
  return function <T extends new (...args: any[]) => any>(constructor: T) {
    const serviceKey = key || constructor.name;
    
    // Auto-register in DI container
    DIContainer.getInstance().registerFactory(serviceKey, () => new constructor());
    
    return constructor;
  };
}

/**
 * Inject decorator for property injection
 */
export function Inject(serviceKey: string) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get() {
        return DIContainer.getInstance().get(serviceKey);
      },
      enumerable: true,
      configurable: true,
    });
  };
}

/**
 * Module dependencies interface
 */
export interface ModuleDependencies {
  supabase?: SupabaseClient;
  bagManager: BagManager;
  logger?: ILogger;
  eventBus?: IEventBus;
}

/**
 * Dependency resolver for modules
 */
export class ModuleDependencyResolver {
  private container: DIContainer;

  constructor(container: DIContainer = DIContainer.getInstance()) {
    this.container = container;
  }

  /**
   * Resolve dependencies for a module configuration
   */
  resolveDependencies<T>(config: Partial<ModuleConfig<T>>): ModuleDependencies {
    const dependencies: ModuleDependencies = {
      bagManager: this.container.getRequired<BagManager>(ServiceKeys.BAG_MANAGER),
    };

    // Optional dependencies
    if (this.container.has(ServiceKeys.SUPABASE_CLIENT)) {
      dependencies.supabase = this.container.get<SupabaseClient>(ServiceKeys.SUPABASE_CLIENT);
    }

    if (this.container.has(ServiceKeys.LOGGER)) {
      dependencies.logger = this.container.get<ILogger>(ServiceKeys.LOGGER);
    }

    if (this.container.has(ServiceKeys.EVENT_BUS)) {
      dependencies.eventBus = this.container.get<IEventBus>(ServiceKeys.EVENT_BUS);
    }

    return dependencies;
  }

  /**
   * Create module configuration with resolved dependencies
   */
  createModuleConfig<T>(
    module: IBookeraModule<T>,
    renderMode: string,
    overrides: Partial<ModuleConfig<T>> = {}
  ): ModuleConfig<T> {
    const dependencies = this.resolveDependencies(overrides);

    return {
      module,
      renderMode: renderMode as any,
      supabase: dependencies.supabase,
      ...overrides,
    };
  }

  /**
   * Inject dependencies into an existing object
   */
  injectInto(target: any, dependencyMap: Record<string, string>): void {
    Object.entries(dependencyMap).forEach(([property, serviceKey]) => {
      const service = this.container.get(serviceKey);
      if (service) {
        target[property] = service;
      }
    });
  }
}

/**
 * Service locator pattern for modules that can't use DI
 */
export class ServiceLocator {
  private static container = DIContainer.getInstance();

  static getSupabase(): SupabaseClient | undefined {
    return this.container.get<SupabaseClient>(ServiceKeys.SUPABASE_CLIENT);
  }

  static getBagManager(): BagManager {
    return this.container.getRequired<BagManager>(ServiceKeys.BAG_MANAGER);
  }

  static getLogger(): ILogger | undefined {
    return this.container.get<ILogger>(ServiceKeys.LOGGER);
  }

  static getEventBus(): IEventBus | undefined {
    return this.container.get<IEventBus>(ServiceKeys.EVENT_BUS);
  }
}

/**
 * Logger interface
 */
export interface ILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error, ...args: any[]): void;
}

/**
 * Event bus interface
 */
export interface IEventBus {
  emit<T>(event: string, data: T): void;
  on<T>(event: string, handler: (data: T) => void): () => void;
  off(event: string, handler: Function): void;
}

/**
 * Simple console logger implementation
 */
@Injectable(ServiceKeys.LOGGER)
export class ConsoleLogger implements ILogger {
  debug(message: string, ...args: any[]): void {
    console.debug(`[DEBUG] ${message}`, ...args);
  }

  info(message: string, ...args: any[]): void {
    console.info(`[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, error?: Error, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, error, ...args);
  }
}

/**
 * Simple event bus implementation
 */
@Injectable(ServiceKeys.EVENT_BUS)
export class SimpleEventBus implements IEventBus {
  private listeners: Map<string, Set<Function>> = new Map();

  emit<T>(event: string, data: T): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error);
        }
      });
    }
  }

  on<T>(event: string, handler: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.off(event, handler);
    };
  }

  off(event: string, handler: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(handler);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }
}

/**
 * Bootstrap function to set up DI container with default services
 */
export function bootstrapDI(bagManager: BagManager, supabase?: SupabaseClient): DIContainer {
  const container = DIContainer.getInstance();

  // Register core services
  container.register(ServiceKeys.BAG_MANAGER, bagManager);
  
  if (supabase) {
    container.register(ServiceKeys.SUPABASE_CLIENT, supabase);
  }

  // Register default implementations
  container.registerSingleton(ServiceKeys.LOGGER, () => new ConsoleLogger());
  container.registerSingleton(ServiceKeys.EVENT_BUS, () => new SimpleEventBus());

  return container;
}