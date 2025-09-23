import { z } from 'zod';
import { ModuleMetadataSchema, RenderModeSchema, TabSchema } from './types';
import type { ModuleMetadata, IBookeraModule } from './types';

// Enhanced module validation with detailed error reporting
export const BookeraModuleSchema = z.object({
  metadata: ModuleMetadataSchema,
  tab: TabSchema.optional(),
  instances: z.array(z.unknown()).default([]),
});

// Extension configuration validation
export const ExtensionConfigSchema = z.object({
  source: z.object({
    name: z.string().min(1, 'Source name is required'),
    link: z.string().url('Source link must be a valid URL').optional(),
  }),
  values: z.array(z.unknown()).min(1, 'At least one value is required'),
  id: z.string().min(1, 'Extension ID is required'),
  nameIndex: z.string().min(1, 'Name index is required'),
});

// Module instance validation
export const ModuleInstanceSchema = z.object({
  id: z.string().min(1, 'Instance ID is required'),
  moduleId: z.string().min(1, 'Module ID is required'),
  configuration: z.record(z.unknown()).default({}),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Validation result type
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
}

// Module validator class
export class ModuleValidator {
  /**
   * Validates module metadata
   */
  static validateMetadata(metadata: unknown): ValidationResult<ModuleMetadata> {
    try {
      const result = ModuleMetadataSchema.safeParse(metadata);
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          errors: [],
          warnings: [],
        };
      }
      
      return {
        success: false,
        errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        warnings: [],
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
      };
    }
  }

  /**
   * Validates complete module structure
   */
  static validateModule<T>(module: unknown): ValidationResult<IBookeraModule<T>> {
    try {
      const result = BookeraModuleSchema.safeParse(module);
      
      if (result.success) {
        const warnings: string[] = [];
        
        // Check for common issues
        if (result.data.metadata.renderModes.length === 0) {
          warnings.push('No render modes specified - module may not be visible');
        }
        
        if (!result.data.metadata.description || result.data.metadata.description.length < 10) {
          warnings.push('Description should be more descriptive');
        }
        
        return {
          success: true,
          data: result.data as IBookeraModule<T>,
          errors: [],
          warnings,
        };
      }
      
      return {
        success: false,
        errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        warnings: [],
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Module validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
      };
    }
  }

  /**
   * Validates extension configuration
   */
  static validateExtensionConfig(config: unknown): ValidationResult {
    try {
      const result = ExtensionConfigSchema.safeParse(config);
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          errors: [],
          warnings: [],
        };
      }
      
      return {
        success: false,
        errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        warnings: [],
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Extension config validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
      };
    }
  }

  /**
   * Validates render mode compatibility
   */
  static validateRenderModeCompatibility(
    requestedMode: string,
    availableModes: string[]
  ): ValidationResult<string> {
    // Validate requested mode format
    const modeResult = RenderModeSchema.safeParse(requestedMode);
    if (!modeResult.success) {
      return {
        success: false,
        errors: [`Invalid render mode: ${requestedMode}`],
        warnings: [],
      };
    }

    // Check availability
    if (!availableModes.includes(requestedMode)) {
      return {
        success: false,
        errors: [`Render mode '${requestedMode}' not supported by this module`],
        warnings: [],
      };
    }

    return {
      success: true,
      data: requestedMode,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Validates module dependencies (for future use)
   */
  static validateDependencies(
    dependencies: string[],
    availableModules: string[]
  ): ValidationResult<string[]> {
    const missing = dependencies.filter(dep => !availableModules.includes(dep));
    
    if (missing.length > 0) {
      return {
        success: false,
        errors: [`Missing dependencies: ${missing.join(', ')}`],
        warnings: [],
      };
    }

    return {
      success: true,
      data: dependencies,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Comprehensive module health check
   */
  static performHealthCheck<T>(module: IBookeraModule<T>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check metadata
    const metadataResult = this.validateMetadata(module.metadata);
    if (!metadataResult.success) {
      errors.push(...metadataResult.errors);
    }
    warnings.push(...metadataResult.warnings);

    // Check render modes
    if (module.metadata.renderModes.length === 0) {
      errors.push('Module must support at least one render mode');
    }

    // Check instances
    if (module.instances.length > 100) {
      warnings.push('Large number of instances may impact performance');
    }

    // Check tab configuration if present
    if (module.tab && module.metadata.renderModes.includes('renderInSidePanel')) {
      if (!module.tab.title || module.tab.title.length === 0) {
        errors.push('Tab title is required for side panel modules');
      }
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Utility functions for common validation patterns
export const validateRequired = (value: unknown, fieldName: string): string[] => {
  if (value === null || value === undefined || value === '') {
    return [`${fieldName} is required`];
  }
  return [];
};

export const validateStringLength = (
  value: string,
  fieldName: string,
  min = 1,
  max = 1000
): string[] => {
  const errors: string[] = [];
  
  if (value.length < min) {
    errors.push(`${fieldName} must be at least ${min} characters`);
  }
  
  if (value.length > max) {
    errors.push(`${fieldName} must be no more than ${max} characters`);
  }
  
  return errors;
};

export const validateUrl = (value: string, fieldName: string): string[] => {
  try {
    new URL(value);
    return [];
  } catch {
    return [`${fieldName} must be a valid URL`];
  }
};

// Type guard functions
export const isValidRenderMode = (mode: string): mode is z.infer<typeof RenderModeSchema> => {
  return RenderModeSchema.safeParse(mode).success;
};

export const isValidModuleMetadata = (metadata: unknown): metadata is ModuleMetadata => {
  return ModuleMetadataSchema.safeParse(metadata).success;
};