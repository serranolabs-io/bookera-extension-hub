import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { 
  IBookeraModule, 
  ModuleConfig, 
  RenderMode, 
  ModuleElementInstance 
} from './types';
import { ModuleBusinessLogicService } from './services/module-business-logic';
import { ModuleStateService } from './services/module-state-service';
import { DIContainer, ServiceKeys, type ModuleDependencies } from './services/dependency-injection';
import type { Tab } from './tab';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BagManager, Bag } from '@pb33f/saddlebag';

/**
 * Improved BookeraModuleElement with better separation of concerns
 * Uses dependency injection and service classes for business logic
 */
export abstract class ImprovedBookeraModuleElement<T = unknown> 
  extends LitElement 
  implements ModuleElementInstance<T> {
  
  // Core module properties
  @state()
  protected _module!: IBookeraModule<T>;

  @state()
  protected _renderMode: RenderMode = 'renderInSettings';

  @state()
  protected _instanceId?: string;

  // Services (injected via DI)
  protected businessLogic!: ModuleBusinessLogicService<T>;
  protected stateService!: ModuleStateService<T>;
  protected dependencies!: ModuleDependencies;

  // State
  @state()
  protected _isInitialized = false;

  @state()
  protected _isLoading = false;

  @state()
  protected _errors: string[] = [];

  constructor(config: ModuleConfig<T>) {
    super();
    
    this.initializeFromConfig(config);
    this.setupServices();
  }

  private initializeFromConfig(config: ModuleConfig<T>): void {
    this._module = config.module;
    this._renderMode = config.renderMode;
    this._instanceId = config.panelTabId ? 
      `${config.module.metadata.id}-${config.panelTabId}` : 
      config.module.metadata.id;

    // Resolve dependencies
    const container = DIContainer.getInstance();
    this.dependencies = {
      bagManager: container.getRequired<BagManager>(ServiceKeys.BAG_MANAGER),
      supabase: config.supabase,
      logger: container.get(ServiceKeys.LOGGER),
      eventBus: container.get(ServiceKeys.EVENT_BUS),
    };
  }

  private setupServices(): void {
    // Initialize business logic service
    this.businessLogic = new ModuleBusinessLogicService(this._module);

    // Initialize state service
    this.stateService = new ModuleStateService<T>(
      this.dependencies.bagManager,
      this._instanceId!
    );

    // Subscribe to state changes
    this.stateService.subscribe(this.handleStateChange.bind(this));
  }

  protected async initializeState(defaultsFactory: () => T): Promise<void> {
    this._isLoading = true;
    
    try {
      await this.stateService.initialize(defaultsFactory, this._instanceId);
      this._isInitialized = true;
      this._errors = [];
    } catch (error) {
      this._errors.push(`Failed to initialize state: ${error}`);
      this.dependencies.logger?.error('State initialization failed', error as Error);
    } finally {
      this._isLoading = false;
    }
  }

  protected handleStateChange(data: T): void {
    // Override in subclasses to handle state changes
    this.requestUpdate();
  }

  protected async setState(data: T, key = 'default'): Promise<void> {
    try {
      await this.stateService.setState(data, key);
    } catch (error) {
      this._errors.push(`Failed to update state: ${error}`);
      this.dependencies.logger?.error('State update failed', error as Error);
    }
  }

  protected getState(key = 'default'): T | undefined {
    return this.stateService.getValue(key);
  }

  protected async updateState(updates: Partial<T>, key = 'default'): Promise<void> {
    try {
      await this.stateService.updateState(updates, key);
    } catch (error) {
      this._errors.push(`Failed to update state: ${error}`);
      this.dependencies.logger?.error('Partial state update failed', error as Error);
    }
  }

  // Getters for interface compliance
  get module(): IBookeraModule<T> {
    return this._module;
  }

  get renderMode(): RenderMode {
    return this._renderMode;
  }

  get instanceId(): string | undefined {
    return this._instanceId;
  }

  // Validation helpers
  protected validateRenderMode(): boolean {
    const validation = this.businessLogic.validateRenderMode(this._renderMode);
    if (!validation.success) {
      this._errors.push(...validation.errors);
      return false;
    }
    return true;
  }

  protected clearErrors(): void {
    this._errors = [];
  }

  protected addError(error: string): void {
    this._errors.push(error);
    this.requestUpdate();
  }

  // UI Helper methods (extracted from legacy base class)
  protected createSection(
    title: string, 
    description: string, 
    content: () => TemplateResult
  ): TemplateResult {
    return html`
      <section class="module-section">
        <div class="section-header">
          <h5>${title}</h5>
          <p class="section-description">${description}</p>
        </div>
        <div class="section-content">
          ${content()}
        </div>
      </section>
    `;
  }

  protected createSidePanelSection(
    title: string,
    description: string,
    content: () => TemplateResult
  ): TemplateResult {
    return html`
      <sl-details open class="side-panel-section">
        <h5 slot="summary">${title}</h5>
        <p class="section-description">${description}</p>
        <div class="section-content">
          ${content()}
        </div>
      </sl-details>
    `;
  }

  protected renderTitleSection(): TemplateResult {
    const title = this.businessLogic.getDisplayName();
    const description = this.businessLogic.getDescription();
    
    return html`
      <div class="title-section">
        <div class="title-header">
          ${this.renderModuleIcon()}
          <h4>${title}</h4>
          ${this.renderTabActions()}
        </div>
        <p class="module-description">${description}</p>
      </div>
    `;
  }

  protected renderModuleIcon(): TemplateResult {
    const tab = this.businessLogic.getTab();
    if (!tab?.icon) {
      return html`<sl-icon name="puzzle"></sl-icon>`;
    }
    return html`<sl-icon name="${tab.icon}"></sl-icon>`;
  }

  protected renderTabActions(): TemplateResult {
    if (!this.businessLogic.canRenderInSidePanel()) {
      return html``;
    }

    const tab = this.businessLogic.getTab();
    if (!tab) {
      return html``;
    }

    return html`
      <sl-tooltip content="Toggle side panel tab">
        <sl-icon-button 
          name="layout-sidebar"
          class="tab-action-button"
          @click=${this.handleTabToggle}
        ></sl-icon-button>
      </sl-tooltip>
    `;
  }

  protected renderErrorMessages(): TemplateResult {
    if (this._errors.length === 0) {
      return html``;
    }

    return html`
      <div class="error-messages">
        ${this._errors.map(error => html`
          <sl-alert variant="danger" open>
            <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
            ${error}
          </sl-alert>
        `)}
      </div>
    `;
  }

  protected renderLoadingState(): TemplateResult {
    if (!this._isLoading) {
      return html``;
    }

    return html`
      <div class="loading-overlay">
        <sl-spinner></sl-spinner>
        <p>Loading module...</p>
      </div>
    `;
  }

  // Event handlers
  protected handleTabToggle(): void {
    // Emit event for tab management
    this.dependencies.eventBus?.emit('toggle-module-tab', {
      moduleId: this.module.metadata.id,
      tab: this.businessLogic.getTab(),
    });
  }

  // Abstract methods (must be implemented by subclasses)
  abstract renderInSettings(): TemplateResult;
  abstract renderInSidePanel(): TemplateResult;
  abstract renderInModuleDaemon(): TemplateResult;
  abstract renderInPanel(): TemplateResult;

  // Main render method with mode switching
  render(): TemplateResult {
    // Always render errors and loading state
    const overlay = html`
      ${this.renderErrorMessages()}
      ${this.renderLoadingState()}
    `;

    if (!this._isInitialized && !this._isLoading) {
      return html`
        ${overlay}
        <div class="not-initialized">
          <p>Module not initialized</p>
        </div>
      `;
    }

    if (!this.validateRenderMode()) {
      return html`
        ${overlay}
        <div class="invalid-render-mode">
          <p>Invalid render mode: ${this._renderMode}</p>
        </div>
      `;
    }

    // Render based on mode
    let content: TemplateResult;
    switch (this._renderMode) {
      case 'renderInSettings':
        content = this.renderInSettings();
        break;
      case 'renderInSidePanel':
        content = this.renderInSidePanel();
        break;
      case 'renderInDaemon':
        content = this.renderInModuleDaemon();
        break;
      case 'renderInPanel':
        content = this.renderInPanel();
        break;
      default:
        content = html`<p>Unknown render mode: ${this._renderMode}</p>`;
    }

    return html`
      ${overlay}
      <div class="module-container" data-render-mode="${this._renderMode}">
        ${content}
      </div>
    `;
  }

  // Lifecycle hooks
  connectedCallback(): void {
    super.connectedCallback();
    this.dependencies.logger?.debug(`Module ${this.module.metadata.title} connected`);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.dependencies.logger?.debug(`Module ${this.module.metadata.title} disconnected`);
  }

  // Enhanced styles with better organization
  static styles = css`
    :host {
      display: block;
      --module-spacing: 1rem;
      --module-spacing-small: 0.5rem;
      --module-border-radius: 0.375rem;
      --module-border-color: var(--sl-color-neutral-200);
      --module-text-color: var(--sl-color-neutral-900);
      --module-text-color-muted: var(--sl-color-neutral-600);
    }

    .module-container {
      position: relative;
      padding: var(--module-spacing);
    }

    .title-section {
      margin-bottom: var(--module-spacing);
    }

    .title-header {
      display: flex;
      align-items: center;
      gap: var(--module-spacing-small);
      margin-bottom: var(--module-spacing-small);
    }

    .module-description {
      color: var(--module-text-color-muted);
      font-size: 0.875rem;
      margin: 0;
    }

    .module-section {
      margin-bottom: var(--module-spacing);
    }

    .section-header h5 {
      margin: 0 0 var(--module-spacing-small) 0;
      font-weight: 600;
    }

    .section-description {
      color: var(--module-text-color-muted);
      font-size: 0.875rem;
      margin: 0 0 var(--module-spacing-small) 0;
    }

    .section-content {
      /* Content spacing handled by child elements */
    }

    .side-panel-section {
      margin-bottom: var(--module-spacing);
    }

    .tab-action-button {
      margin-left: auto;
    }

    .error-messages {
      margin-bottom: var(--module-spacing);
    }

    .error-messages sl-alert {
      margin-bottom: var(--module-spacing-small);
    }

    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--module-spacing-small);
      padding: var(--module-spacing);
      background: rgba(255, 255, 255, 0.9);
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 100;
    }

    .not-initialized,
    .invalid-render-mode {
      padding: var(--module-spacing);
      text-align: center;
      color: var(--module-text-color-muted);
    }

    /* Render mode specific styles */
    .module-container[data-render-mode="renderInDaemon"] {
      padding: var(--module-spacing-small);
    }

    .module-container[data-render-mode="renderInSidePanel"] {
      padding: var(--module-spacing-small);
    }

    .module-container[data-render-mode="renderInPanel"] {
      height: 100%;
      overflow-y: auto;
    }

    .module-container[data-render-mode="renderInSettings"] {
      max-width: 800px;
    }
  `;
}

/**
 * Simple module element for basic use cases
 */
export abstract class SimpleModuleElement<T = unknown> extends ImprovedBookeraModuleElement<T> {
  constructor(config: ModuleConfig<T>) {
    super(config);
    // Auto-initialize with empty state
    this.initializeState(() => ({} as T));
  }

  // Provide default implementations for unused render modes
  renderInSidePanel(): TemplateResult {
    return html`<p>Side panel view not implemented</p>`;
  }

  renderInModuleDaemon(): TemplateResult {
    return html`<sl-icon name="gear"></sl-icon>`;
  }

  renderInPanel(): TemplateResult {
    return this.renderInSettings();
  }
}