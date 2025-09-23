import type { IBookeraModule, ModuleConfig, RenderMode } from '../types';
import { ModuleValidator, type ValidationResult } from '../validation';
import type { Tab } from '../tab';

/**
 * Business logic service for module operations
 * Extracted from UI components for better separation of concerns
 */
export class ModuleBusinessLogicService<T = unknown> {
  private readonly module: IBookeraModule<T>;

  constructor(module: IBookeraModule<T>) {
    this.module = module;
  }

  /**
   * Check if module supports a specific render mode
   */
  supportsRenderMode(renderMode: RenderMode): boolean {
    return this.module.metadata.renderModes.includes(renderMode);
  }

  /**
   * Get available render modes for this module
   */
  getAvailableRenderModes(): RenderMode[] {
    return [...this.module.metadata.renderModes];
  }

  /**
   * Validate render mode request
   */
  validateRenderMode(requestedMode: RenderMode): ValidationResult<RenderMode> {
    return ModuleValidator.validateRenderModeCompatibility(
      requestedMode,
      this.module.metadata.renderModes
    );
  }

  /**
   * Check if module can be displayed in settings
   */
  canRenderInSettings(): boolean {
    return this.supportsRenderMode('renderInSettings');
  }

  /**
   * Check if module can be displayed in side panel
   */
  canRenderInSidePanel(): boolean {
    return this.supportsRenderMode('renderInSidePanel');
  }

  /**
   * Check if module can run as daemon
   */
  canRenderInDaemon(): boolean {
    return this.supportsRenderMode('renderInDaemon');
  }

  /**
   * Check if module can be displayed in panel
   */
  canRenderInPanel(): boolean {
    return this.supportsRenderMode('renderInPanel');
  }

  /**
   * Get module display name
   */
  getDisplayName(): string {
    return this.module.metadata.title;
  }

  /**
   * Get module description
   */
  getDescription(): string {
    return this.module.metadata.description;
  }

  /**
   * Get module version
   */
  getVersion(): string {
    return this.module.metadata.version;
  }

  /**
   * Get module unique identifier
   */
  getId(): string {
    return this.module.metadata.id;
  }

  /**
   * Check if module has tab configuration
   */
  hasTab(): boolean {
    return this.module.tab !== undefined;
  }

  /**
   * Get tab configuration if available
   */
  getTab(): Tab | undefined {
    return this.module.tab;
  }

  /**
   * Get number of active instances
   */
  getInstanceCount(): number {
    return this.module.instances.length;
  }

  /**
   * Check if module has instances
   */
  hasInstances(): boolean {
    return this.getInstanceCount() > 0;
  }

  /**
   * Get all instances
   */
  getInstances(): ReadonlyArray<T> {
    return this.module.instances;
  }

  /**
   * Find instance by predicate
   */
  findInstance(predicate: (instance: T) => boolean): T | undefined {
    return this.module.instances.find(predicate);
  }

  /**
   * Check if instance exists
   */
  hasInstance(predicate: (instance: T) => boolean): boolean {
    return this.findInstance(predicate) !== undefined;
  }

  /**
   * Validate module health
   */
  performHealthCheck(): ValidationResult {
    return ModuleValidator.performHealthCheck(this.module);
  }

  /**
   * Get module summary for debugging/logging
   */
  getSummary(): ModuleSummary {
    return {
      id: this.getId(),
      title: this.getDisplayName(),
      version: this.getVersion(),
      renderModes: this.getAvailableRenderModes(),
      instanceCount: this.getInstanceCount(),
      hasTab: this.hasTab(),
      tabTitle: this.getTab()?.title,
      isHealthy: this.performHealthCheck().success,
    };
  }
}

/**
 * Tab management business logic
 * Handles tab operations separate from UI concerns
 */
export class TabBusinessLogicService {
  private readonly tab: Tab;

  constructor(tab: Tab) {
    this.tab = tab;
  }

  /**
   * Check if tab is currently appended to side panel
   */
  isAppended(): boolean {
    return this.tab.isAppended;
  }

  /**
   * Check if tab is currently visible in drawer
   */
  isVisible(): boolean {
    return this.tab.isToggledInDrawer;
  }

  /**
   * Get tab position
   */
  getPosition(): 'left' | 'right' {
    return this.tab.position;
  }

  /**
   * Get tab title
   */
  getTitle(): string {
    return this.tab.title;
  }

  /**
   * Get tab icon
   */
  getIcon(): string {
    return this.tab.icon;
  }

  /**
   * Check if tab can be toggled
   */
  canToggle(): boolean {
    return this.isAppended();
  }

  /**
   * Validate tab configuration
   */
  validate(): ValidationResult<Tab> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.tab.title || this.tab.title.trim().length === 0) {
      errors.push('Tab title is required');
    }

    if (!this.tab.icon || this.tab.icon.trim().length === 0) {
      warnings.push('Tab icon is recommended for better UX');
    }

    if (this.tab.title.length > 50) {
      warnings.push('Tab title is quite long and may be truncated');
    }

    return {
      success: errors.length === 0,
      data: this.tab,
      errors,
      warnings,
    };
  }

  /**
   * Get tab summary for debugging
   */
  getSummary(): TabSummary {
    return {
      title: this.getTitle(),
      icon: this.getIcon(),
      position: this.getPosition(),
      isAppended: this.isAppended(),
      isVisible: this.isVisible(),
      canToggle: this.canToggle(),
    };
  }
}

/**
 * Module configuration business logic
 * Handles configuration validation and management
 */
export class ModuleConfigService<T = unknown> {
  private readonly config: ModuleConfig<T>;

  constructor(config: ModuleConfig<T>) {
    this.config = config;
  }

  /**
   * Validate complete configuration
   */
  validate(): ValidationResult<ModuleConfig<T>> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate render mode
    const renderModeResult = ModuleValidator.validateRenderModeCompatibility(
      this.config.renderMode,
      this.config.module.metadata.renderModes
    );
    
    if (!renderModeResult.success) {
      errors.push(...renderModeResult.errors);
    }

    // Validate module
    const moduleResult = ModuleValidator.performHealthCheck(this.config.module);
    if (!moduleResult.success) {
      errors.push(...moduleResult.errors);
    }
    warnings.push(...moduleResult.warnings);

    // Check panel tab ID if needed
    if (this.config.renderMode === 'renderInPanel' && !this.config.panelTabId) {
      warnings.push('Panel tab ID recommended for panel render mode');
    }

    return {
      success: errors.length === 0,
      data: this.config,
      errors,
      warnings,
    };
  }

  /**
   * Get configuration summary
   */
  getSummary(): ConfigSummary {
    return {
      moduleId: this.config.module.metadata.id,
      renderMode: this.config.renderMode,
      hasPanelTabId: !!this.config.panelTabId,
      hasSupabase: !!this.config.supabase,
      hasInstanceType: !!this.config.instanceType,
      isValid: this.validate().success,
    };
  }

  /**
   * Get render mode
   */
  getRenderMode(): RenderMode {
    return this.config.renderMode;
  }

  /**
   * Get module reference
   */
  getModule(): IBookeraModule<T> {
    return this.config.module;
  }

  /**
   * Check if has panel tab ID
   */
  hasPanelTabId(): boolean {
    return !!this.config.panelTabId;
  }

  /**
   * Get panel tab ID
   */
  getPanelTabId(): string | undefined {
    return this.config.panelTabId;
  }

  /**
   * Check if has Supabase configuration
   */
  hasSupabase(): boolean {
    return !!this.config.supabase;
  }
}

// Type definitions for summary objects
export interface ModuleSummary {
  id: string;
  title: string;
  version: string;
  renderModes: RenderMode[];
  instanceCount: number;
  hasTab: boolean;
  tabTitle?: string;
  isHealthy: boolean;
}

export interface TabSummary {
  title: string;
  icon: string;
  position: 'left' | 'right';
  isAppended: boolean;
  isVisible: boolean;
  canToggle: boolean;
}

export interface ConfigSummary {
  moduleId: string;
  renderMode: RenderMode;
  hasPanelTabId: boolean;
  hasSupabase: boolean;
  hasInstanceType: boolean;
  isValid: boolean;
}