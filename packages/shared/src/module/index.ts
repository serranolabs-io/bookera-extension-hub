// Clean, simple module system exports
// The old system is burned down, this is the new way

// Core clean module system
export * from './clean-module';

// Clean module element base class
export { BookeraModuleElement, moduleElementStyles } from './module-element';

// Tab system
export { Tab, TabPosition } from './tab';

// Simplified types
export type { ValidationResult, ModuleUpdateEvent } from './types';

// Legacy compatibility (deprecated but functional)
export {
  BookeraModule as LegacyBookeraModule,
  UPDATE_BookeraModule_EVENT,
  RequestUpdateEvent,
  DEFAULT_VERSION,
  BookeraModuleRegistryClasses,
  migrateLegacyModule,
  createLegacyModule,
} from './module';

export type {
  UPDATE_BookeraModule_EVENT_TYPE,
  BookeraModuleConfig,
  BookeraModuleClass,
  BookeraModuleI,
  RequestUpdateEventType,
} from './module';

// Migration helpers for upgrading from old system
export class ModuleMigration {
  /**
   * Convert legacy module to clean module
   */
  static upgradeLegacy(legacy: any): import('./clean-module').BookeraModule {
    const { createModule } = require('./clean-module');
    
    return createModule({
      id: legacy.id,
      title: legacy.title || 'Untitled Module',
      description: legacy.description || 'No description',
      version: legacy.version || '1.0.0',
      renderModes: legacy.renderModes || ['renderInSettings'],
      tab: legacy.tab,
    });
  }

  /**
   * Convert clean module to legacy for compatibility
   */
  static downgradeTo Legacy(modern: import('./clean-module').BookeraModule): any {
    const { BookeraModule } = require('./module');
    
    return new BookeraModule(
      modern.metadata.version,
      modern.metadata.title,
      modern.metadata.description,
      modern.tab,
      modern.metadata.id,
      modern.metadata.renderModes,
      undefined,
      []
    );
  }

  /**
   * Check if a module is using the old system
   */
  static isLegacy(module: any): boolean {
    return module.constructor?.name === 'BookeraModule' && 
           'instances' in module;
  }

  /**
   * Auto-upgrade if legacy, return as-is if modern
   */
  static ensureModern(module: any): import('./clean-module').BookeraModule {
    if (this.isLegacy(module)) {
      return this.upgradeLegacy(module);
    }
    return module;
  }
}

// Quick reference guide for migration
export const MIGRATION_GUIDE = {
  old: {
    creation: 'new BookeraModule(...8 params)',
    registration: 'BookeraModuleRegistryClasses[name] = class',
    userdata: 'module.instances.push(data)',
  },
  new: {
    creation: 'createModule({ title, description, renderModes })',
    registration: 'ModuleRegistry.register(module, elementClass)',
    userdata: 'userDataService.set(moduleId, data)',
  },
  steps: [
    '1. Replace new BookeraModule() with createModule()',
    '2. Move user data to separate service',
    '3. Use ModuleRegistry.register() instead of class registry',
    '4. Update element to extend clean BookeraModuleElement',
    '5. Remove instances from module definition',
  ]
};

// Simple factory function for common module patterns
export function createSettingsModule(config: {
  title: string;
  description: string;
  elementClass: any;
  version?: string;
}): void {
  const module = createModule({
    title: config.title,
    description: config.description,
    version: config.version || '1.0.0',
    renderModes: ['renderInSettings'],
  });

  ModuleRegistry.register(module, config.elementClass);
}

export function createSidePanelModule(config: {
  title: string;
  description: string;
  elementClass: any;
  icon?: string;
  version?: string;
}): void {
  const tab = new Tab(
    config.title,
    config.icon || 'gear',
    undefined,
    undefined,
    'left'
  );

  const module = createModule({
    title: config.title,
    description: config.description,
    version: config.version || '1.0.0',
    renderModes: ['renderInSettings', 'renderInSidePanel'],
    tab,
  });

  ModuleRegistry.register(module, config.elementClass);
}

// Re-export the main API from clean-module
export const {
  createModule,
  ModuleRegistry,
  hasSettings,
  hasPanel,
  hasSidePanel,
  hasModuleDaemon,
  getConstructorTypeName,
} = require('./clean-module');