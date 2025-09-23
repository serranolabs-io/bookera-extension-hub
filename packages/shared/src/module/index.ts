// Phase 1 Refactoring: Type-safe module system exports
// This index file provides a clean API for the improved module system

// Core types and interfaces
export type {
  RenderMode,
  ModuleMetadata,
  IBookeraModule,
  ModuleConfig,
  ModuleElementConstructor,
  ModuleElementInstance,
  ModuleRegistryEntry,
  IModuleRegistry,
  ModuleFactory,
  ModuleUpdateEvent,
} from './types';

// Error classes
export {
  ModuleRegistrationError,
  ModuleNotFoundError,
  ModuleValidationError,
} from './types';

// Validation system
export {
  ModuleValidator,
  validateRequired,
  validateStringLength,
  validateUrl,
  isValidRenderMode,
  isValidModuleMetadata,
} from './validation';

export type { ValidationResult } from './validation';

// Services
export {
  ModuleStateService,
  ModuleRegistryStateService,
} from './services/module-state-service';

export {
  ModuleBusinessLogicService,
  TabBusinessLogicService,
  ModuleConfigService,
} from './services/module-business-logic';

export type {
  ModuleSummary,
  TabSummary,
  ConfigSummary,
} from './services/module-business-logic';

// Dependency injection
export {
  DIContainer,
  ServiceKeys,
  Injectable,
  Inject,
  ModuleDependencyResolver,
  ServiceLocator,
  ConsoleLogger,
  SimpleEventBus,
  bootstrapDI,
} from './services/dependency-injection';

export type {
  ModuleDependencies,
  ILogger,
  IEventBus,
} from './services/dependency-injection';

// Improved implementations
export {
  ImprovedBookeraModule,
  TypeSafeModuleRegistry,
  ModuleBuilder,
  ModuleCompat,
} from './improved-module';

export {
  ImprovedBookeraModuleElement,
  SimpleModuleElement,
} from './improved-module-element';

// Legacy exports for backward compatibility
export {
  BookeraModule,
  BookeraModuleRegistryClasses,
  UPDATE_BookeraModule_EVENT,
  UPDATE_BookeraModule_EVENT_TYPE,
  RequestUpdateEvent,
  RequestUpdateEventType,
  DEFAULT_VERSION,
} from './module';

export type {
  BookeraModuleConfig,
  BookeraModuleClass,
  BookeraModuleI,
} from './module';

export {
  BookeraModuleElement,
  moduleElementStyles,
} from './module-element';

// Tab system
export { Tab, TabPosition } from './tab';

// Schemas for external use
export {
  RenderModeSchema,
  ModuleMetadataSchema,
  BookeraModuleSchema,
  ExtensionConfigSchema,
  ModuleInstanceSchema,
} from './validation';

/**
 * Migration helper for gradually adopting the new system
 * 
 * Usage:
 * ```typescript
 * import { ModuleMigrationHelper } from '@serranolabs.io/shared/module';
 * 
 * // Gradually migrate existing modules
 * const helper = new ModuleMigrationHelper();
 * const improvedModule = helper.upgradeModule(legacyModule);
 * ```
 */
export class ModuleMigrationHelper {
  /**
   * Upgrade legacy module to new improved module
   */
  upgradeModule<T>(legacyModule: any): ImprovedBookeraModule<T> {
    return ModuleCompat.upgrade<T>(legacyModule);
  }

  /**
   * Downgrade improved module to legacy format
   */
  downgradeModule<T>(improvedModule: ImprovedBookeraModule<T>): any {
    return ModuleCompat.downgrade(improvedModule);
  }

  /**
   * Validate legacy module and get upgrade recommendations
   */
  analyzeModule(legacyModule: any): {
    canUpgrade: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check required fields
    if (!legacyModule.title) {
      issues.push('Missing title');
    }

    if (!legacyModule.description) {
      issues.push('Missing description');
    }

    if (!legacyModule.renderModes || legacyModule.renderModes.length === 0) {
      issues.push('No render modes specified');
    }

    // Check for potential improvements
    if (!legacyModule.version) {
      recommendations.push('Add version information');
    }

    if (legacyModule.instances && legacyModule.instances.length > 10) {
      recommendations.push('Consider implementing instance pagination');
    }

    if (legacyModule.renderModes?.includes('renderInSidePanel') && !legacyModule.tab) {
      recommendations.push('Add tab configuration for side panel support');
    }

    return {
      canUpgrade: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Get migration steps for a specific module
   */
  getMigrationSteps(legacyModule: any): string[] {
    const analysis = this.analyzeModule(legacyModule);
    const steps: string[] = [];

    if (analysis.issues.length > 0) {
      steps.push('Fix required issues:');
      analysis.issues.forEach(issue => steps.push(`  - ${issue}`));
    }

    steps.push('Run ModuleCompat.upgrade() to convert to ImprovedBookeraModule');
    steps.push('Update module registration to use TypeSafeModuleRegistry');
    steps.push('Migrate element class to extend ImprovedBookeraModuleElement');

    if (analysis.recommendations.length > 0) {
      steps.push('Consider these improvements:');
      analysis.recommendations.forEach(rec => steps.push(`  - ${rec}`));
    }

    return steps;
  }
}