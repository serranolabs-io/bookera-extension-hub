// Clean module element base class - simplified and focused
import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type {
  BookeraModule as CleanBookeraModule,
  ModuleConfig,
  RenderMode,
} from './module';
import { hasSidePanel } from './module';
import { appendTab, removeTab } from './tab';
import { MOBILE_MEDIA_QUERY, sendEvent } from '../model/util';
import { notify } from '../model/lit';
import { Bag, BagManager, CreateBag, CreateBagManager } from '@pb33f/saddlebag';
import localforage from 'localforage';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Source } from '../model/keyboard-shortcuts/model';
import type {
  AuthChangeEvent,
  Session,
  User as SupabaseUser,
} from '@supabase/supabase-js';

// Legacy events for backward compatibility
export const UPDATE_BookeraModule_EVENT = 'update-BookeraModule-event';
export const RequestUpdateEvent = 'request-update';

export interface RequestUpdateEventType {
  moduleId: string;
}

/**
 * Clean, simplified BookeraModuleElement base class
 * Uses clean module types and focuses on essential functionality
 */
@customElement('bookera-module-element')
export abstract class BookeraModuleElement extends LitElement {
  @state()
  protected module!: CleanBookeraModule;

  @state()
  protected renderMode: RenderMode = 'renderInSettings';

  @state()
  protected instanceId?: string;

  // Essential state
  @state()
  protected _isInstanceDirty: boolean = false;

  @state()
  protected _user?: SupabaseUser;

  @state()
  protected _signedIn: boolean = false;

  @state()
  protected _renderInDaemonMode = true;

  // Services - simplified
  protected _bagManager!: BagManager;
  protected _bag?: Bag<any>;
  protected _supabase?: SupabaseClient;
  protected _source?: Source;

  constructor(config: ModuleConfig) {
    super();

    if (!config) return;

    this.renderMode = config.renderMode;
    this.module = config.module;
    this.instanceId = config.panelTabId
      ? `${config.module.metadata.id}-${config.panelTabId}`
      : config.module.metadata.id;

    this._bagManager = CreateBagManager();
    this._supabase = config.supabase;

    if (config.panelTabId) {
      this._bag = CreateBag(this.instanceId);
    }

    // Set up source for shortcuts
    if (this.module.metadata.title) {
      this._source = {
        name: this.module.metadata.title,
        link: 'https://github.com/serranolabs-io/bookera-extension-hub',
      } as Source;
    }

    this._setupAuth();
    this._setupEventListeners();
  }

  private async _setupAuth(): Promise<void> {
    if (!this._supabase) return;

    this._supabase.auth.onAuthStateChange(this._onAuthStateChange.bind(this));

    const session = await this._supabase.auth.getSession();
    if (session?.error) return;

    if (session?.data.session) {
      this._user = session.data.session.user;
      this._signedIn = true;
    }
  }

  private _setupEventListeners(): void {
    // @ts-expect-error - Custom event types
    document.addEventListener(
      RequestUpdateEvent,
      this.listenToUpdates.bind(this)
    );
  }

  private _onAuthStateChange(
    event: AuthChangeEvent,
    session: Session | null
  ): void {
    if (event === 'SIGNED_IN') {
      this._signedIn = true;
      if (session) {
        this._user = session.user;
      }
    } else if (event === 'SIGNED_OUT') {
      this._user = undefined;
      this._signedIn = false;
    }
  }

  private listenToUpdates(e: CustomEvent<RequestUpdateEventType>): void {
    if (e.detail.moduleId === this.module.metadata.id) {
      this.requestUpdate();
    }
  }

  // Daemon mode control
  doNotRenderInDaemonMode(): void {
    this._renderInDaemonMode = false;
  }

  // State management helpers
  protected async _runSyncedFlow<T>(
    defaultsFunction: () => void,
    key: string
  ): Promise<Bag<T>> {
    const bag = this._bagManager.createBag<T>(key);
    const contents = await this._getLocalForage(key);

    if (!contents) {
      defaultsFunction();
    } else {
      bag?.populate(contents);
    }
    return bag!;
  }

  protected _savePanelTabState(key: string, value: any): void {
    this._bag?.set(key, value);
    if (this.instanceId) {
      localforage.setItem(
        this.instanceId,
        this._bag?.export() as Map<string, any>
      );
    }
  }

  protected async _getLocalForage(
    key?: string
  ): Promise<Map<string, any> | null> {
    const storageKey = key || this.instanceId;
    if (!storageKey) return null;
    return await localforage.getItem(storageKey);
  }

  protected async _runLocalFlow(defaultsFunction: () => void): Promise<void> {
    const contents = await this._getLocalForage();
    if (!contents) {
      defaultsFunction();
      return;
    }
    this._bag?.populate(contents);
  }

  // UI Helpers
  protected handleTab(): TemplateResult {
    if (!hasSidePanel(this.module)) {
      return html``;
    }

    const tab = this.module.tab;
    if (!tab) {
      return html``;
    }

    if (tab.isAppended) {
      return html`
        <sl-tooltip content="Remove tab from side-bar">
          <sl-icon-button
            name="layout-sidebar"
            class="icon-button"
            @click=${() => {
              if (tab) {
                // Update tab state immutably
                const updatedTab = removeTab(tab);
                // Update the module with new tab
                this.module = { ...this.module, tab: updatedTab };
                this._emitModuleUpdate();
                notify('removed tab!', 'success', null, 3000);
                this.requestUpdate();
              }
            }}
          ></sl-icon-button>
        </sl-tooltip>
      `;
    }

    return html`
      <sl-tooltip
        content=${`Add ${this.module.metadata.title} settings as a tab`}
      >
        <sl-icon-button
          name="layout-sidebar"
          class="icon-button"
          @click=${() => {
            if (tab && !tab.isAppended) {
              // Update tab state immutably
              const updatedTab = appendTab(tab);
              // Update the module with new tab
              this.module = { ...this.module, tab: updatedTab };
              this._emitModuleUpdate();
              notify(
                'Successfully inserted tab on left panel',
                'success',
                null,
                3000
              );
            } else {
              notify(
                `${this.module.metadata.title} already exists as a tab`,
                'warning',
                null,
                3000
              );
            }
            this.requestUpdate();
          }}
        ></sl-icon-button>
      </sl-tooltip>
    `;
  }

  protected renderThemeButton(trigger?: string): TemplateResult {
    const iconName = this.module.tab?.icon || 'gear';

    if (trigger) {
      return html`<sl-icon-button
        name=${iconName}
        slot="trigger"
      ></sl-icon-button>`;
    }
    return html`<sl-icon-button name=${iconName}></sl-icon-button>`;
  }

  protected createSection(
    title: string,
    description: string,
    section: () => TemplateResult
  ): TemplateResult {
    return html`
      <section>
        <div>
          <h5>${title}</h5>
          <p>${description}</p>
        </div>
        ${section()}
      </section>
    `;
  }

  protected createSidePanelSection(
    title: string,
    description: string,
    section: () => TemplateResult
  ): TemplateResult {
    return html`
      <sl-details open>
        <h5 slot="summary">${title}</h5>
        <p>${description}</p>
        ${section()}
      </sl-details>
    `;
  }

  protected renderTitleSection(): TemplateResult {
    return html`
      <div class="title-box">
        ${this.renderThemeButton()}
        <h4>${this.module.metadata.title}</h4>
        ${this.handleTab()}
      </div>
      <p class="title-description lead">${this.module.metadata.description}</p>
    `;
  }

  protected renderSidePanelTitleSection(): TemplateResult {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    if (mediaQuery.matches) {
      return html``;
    }

    return html`
      <div class="title-box">
        <h5>${this.module.metadata.title}</h5>
      </div>
    `;
  }

  // Wrapper methods for different render contexts
  protected renderDaemonWrapper(): TemplateResult {
    if (!this._renderInDaemonMode) {
      return html``;
    }

    return html`
      <sl-tooltip content=${this.module.metadata.title}>
        <div class="daemon">${this.renderInModuleDaemon()}</div>
      </sl-tooltip>
    `;
  }

  protected renderSidePanelWrapper(): TemplateResult {
    return html`<div class="side-panel">${this.renderInSidePanel()}</div>`;
  }

  protected renderSettingsWrapper(): TemplateResult {
    return html`<div class="panel-container">${this.renderInSettings()}</div>`;
  }

  protected renderInPanelWrapper(): TemplateResult {
    return html`<div class="panel-container">${this.renderInPanel()}</div>`;
  }

  // Event emitter
  private _emitModuleUpdate(): void {
    sendEvent(this, UPDATE_BookeraModule_EVENT, this.module);
  }

  // Abstract methods that must be implemented
  protected abstract renderInSidePanel(): TemplateResult;
  protected abstract renderInSettings(): TemplateResult;
  protected abstract renderInModuleDaemon(): TemplateResult;
  protected abstract renderInPanel(): TemplateResult;

  // Main render method
  render(): TemplateResult {
    switch (this.renderMode) {
      case 'renderInSettings':
        return this.renderSettingsWrapper();
      case 'renderInSidePanel':
        return this.renderSidePanelWrapper();
      case 'renderInDaemon':
        return this.renderDaemonWrapper();
      case 'renderInPanel':
        return this.renderInPanelWrapper();
      default:
        return html`<p>Unknown render mode: ${this.renderMode}</p>`;
    }
  }
}

// Global element registration
declare global {
  interface HTMLElementTagNameMap {
    'bookera-module-element': BookeraModuleElement;
  }
}

// Styles - simplified from the original
export const moduleElementStyles = css`
  .title-box {
    margin-bottom: var(--spacingSmall);
    display: flex !important;
    align-items: center;
    position: relative;
  }

  .title-description {
    margin-bottom: var(--spacing);
    font-size: var(--fontSizeSmall);
    color: var(--slate-400);
  }

  .panel-container {
    padding: var(--spacing);
  }

  h4 {
    text-align: start;
    border-bottom: 2px solid var(--slate-200);
    margin-left: 2px;
  }

  .icon-button {
    position: absolute;
    right: 0;
    font-size: 20px;
    margin-right: var(--spacingSmall);
  }

  .icon-button::part(base) {
    padding: 0;
  }

  section {
    margin-bottom: var(--spacing);
  }

  sl-icon-button {
    font-size: 20px;
    margin-right: var(--spacingSmall);
  }

  p {
    margin-bottom: var(--spacingXSmall);
  }

  .side-panel h4 {
    margin-left: 2px;
  }

  .side-panel .title-box {
    padding: var(--spacingXXSmall) var(--spacingSmall);
    border-bottom: 1px solid var(--slate-200);
    margin-bottom: var(--spacingSmall);
  }

  .side-panel sl-icon-button {
    font-size: 18px;
  }
`;
