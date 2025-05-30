import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import {
  BookeraModule,
  RequestUpdateEvent,
  RequestUpdateEventType,
  UPDATE_BookeraModule_EVENT,
  UPDATE_BookeraModule_EVENT_TYPE,
} from './module';
import type {
  BookeraModuleConfig,
  ModuleInstanceType,
  RenderMode,
} from './module';
import { Tab } from './tab';
import { sendEvent } from '../model/util';
import { notify } from '../model/lit';
import { Bag, BagManager, CreateBag, CreateBagManager } from '@pb33f/saddlebag';
import localforage from 'localforage';
import { SupabaseClient } from '@supabase/supabase-js';
import { Source } from '../model/keyboard-shortcuts/model';

customElement('bookera-module-element');
/**
 * The `ModuleElement` class serves as an abstract base class for creating custom module elements
 * in the application. It extends the `LitElement` class and provides a structure for managing
 * module state, rendering, and event handling.
 *
 * @abstract
 * @extends {LitElement}
 *
 * @property {CSSResult[]} static styles - Defines the default styles for the module element.
 * @property {BookeraModule} module - Represents the module associated with this element.
 * @property {string} title - The title of the module element. Defaults to 'Theme Switcher'.
 * @property {RenderMode} renderMode - Specifies the rendering mode for the module element.
 *
 * @constructor
 * @param {RenderMode} renderMode - The rendering mode to initialize the module element with.
 * @param {BookeraModule} module - The module to associate with this element.
 *
 * @event sendEvent<UpdateMenuType<T>> - Dispatched to update the menu state with the current module's data.
 *
 * @method newMethod - Abstract method to be implemented by subclasses for additional functionality.
 * @method intializeModule - Abstract method to initialize and return a new module instance.
 * @method _sendTabState - Abstract method to handle the dispatching of the module's tab state.
 * @method renderInSidePanel - Abstract method to define rendering logic for the side panel.
 * @method renderInSettings - Abstract method to define rendering logic for the main panel.
 * @method render - Abstract method to define the overall rendering logic for the module element.
 */
export abstract class BookeraModuleElement extends LitElement {
  @state()
  module!: BookeraModule;

  @state() title!: string;

  @state()
  renderMode: RenderMode;

  @state()
  u: boolean = false;

  private _panelTabId: string | undefined;

  protected _source: Source;

  @state()
  instanceId: string | undefined;

  @state()
  protected _isInstanceDirty: boolean = false;

  protected _bagManager: BagManager;
  protected _bag: Bag | undefined;

  protected _supabase!: SupabaseClient | null;

  private _formInstanceId() {
    return this.module.id! + this._panelTabId;
  }

  protected _config: BookeraModuleConfig<any>;

  constructor(config: BookeraModuleConfig<any>) {
    super();
    this.renderMode = config.renderMode;
    this.module = config.module;

    if (config.instanceType) {
      this.module.instances.push(config.instanceType);
    }

    this.module.tab = Object.assign(new Tab(), this.module.tab);
    this.title = this.module.title!;
    this._bagManager = CreateBagManager();
    if (config.supabase) {
      this._supabase = config.supabase;
    }

    if (config._panelTabId) {
      this._panelTabId = config._panelTabId;
      this.instanceId = this._formInstanceId();
      this._bag = CreateBag(this.instanceId);
    }

    this._config = config;

    if (this.module.title) {
      this._source = new Source(
        this.module.title,
        'https://github.com/serranolabs-io/bookera-extension-hub/tree/main/packages/modules/themes'
      );
    }

    // @ts-expect-error addEventListener sucks
    document.addEventListener(
      RequestUpdateEvent,
      this.listenToUpdates.bind(this)
    );
  }

  protected findKey(savingKeys: any, index: any) {
    Object.keys(savingKeys).find(
      (key) => savingKeys[key as keyof typeof savingKeys] === index
    );
  }

  protected _savePanelTabState(key: string, value: any) {
    this._bag?.set(key, value);

    localforage.setItem(
      this.instanceId!,
      this._bag?.export() as Map<string, any>
    );
  }

  protected async _getLocalForage(): Promise<Map<string, any> | null> {
    return await localforage.getItem(this.instanceId!);
  }

  protected async _runLocalFlow(defaultsFunction: () => void) {
    const contents = await this._getLocalForage();

    if (!contents) {
      defaultsFunction();
      return;
    }

    this._bag?.populate(contents);
  }

  private listenToUpdates(e: CustomEvent<RequestUpdateEventType>) {
    if (e.detail.moduleId === this.module.id) {
      this.requestUpdate();
    }
  }

  protected handleTab() {
    if (!this.module.hasSidePanel()) {
      return html``;
    }

    if (this.module.tab?.isAppended) {
      return html`
        <sl-tooltip content="Remove tab from side-bar">
          <sl-icon-button
            name="layout-sidebar"
            class="icon-button"
            @click=${() => {
              this.module.tab?.removeTab();
              sendEvent<UPDATE_BookeraModule_EVENT_TYPE>(
                this,
                UPDATE_BookeraModule_EVENT,
                this.module
              );
              notify('removed tab!', 'success', null, 3000);
              this.requestUpdate();
            }}
          ></sl-icon-button>
        </sl-tooltip>
      `;
    }

    return html`
      <sl-tooltip content=${`Add ${this.title} settings as a tab`}>
        <sl-icon-button
          name="layout-sidebar"
          class="icon-button"
          @click=${() => {
            if (!this.module.tab?.isAppended) {
              this.module.tab?.appendTab();
              sendEvent<UPDATE_BookeraModule_EVENT_TYPE>(
                this,
                UPDATE_BookeraModule_EVENT,
                this.module
              );
              notify(
                'Successfully inserted tab on left panel',
                'success',
                null,
                3000
              );
            } else {
              notify(
                `${this.title} already exists as a tab`,
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

  protected renderThemeButton(trigger?: string) {
    if (trigger) {
      return html`
        <sl-icon-button name=${this.module.tab?.value} slot="trigger">
        </sl-icon-button>
      `;
    }

    return html`
      <sl-icon-button name=${this.module.tab?.value}></sl-icon-button>
    `;
  }

  protected createSection(
    title: string,
    description: string,
    section: () => TemplateResult
  ) {
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
  ) {
    return html`
      <sl-details open>
        <h5 slot="summary">${title}</h5>
        <p>${description}</p>
        ${section()}
      </sl-details>
    `;
  }

  protected renderTitleSection() {
    return html`
      <div class="title-box">
        ${this.renderThemeButton()}
        <h4>${this.title}</h4>
        ${this.handleTab()}
      </div>
      <p class="title-description lead">${this.module.description}</p>
    `;
  }

  protected renderSidePanelTitleSection() {
    return html` <div class="title-box">
      <h5>${this.title}</h5>
    </div>`;
  }

  protected renderDaemonWrapper() {
    return html`
      <sl-tooltip content=${this.module.title}>
        <div class="daemon">${this.renderInModuleDaemon()}</div>
      </sl-tooltip>
    `;
  }

  protected renderSidePanelWrapper() {
    return html` <div class="side-panel">${this.renderInSidePanel()}</div> `;
  }

  protected renderSettingsWrapper() {
    return html` <div class="panel-container">${this.renderInSettings()}</div>`;
  }

  protected renderInPanelWrapper() {
    return html` <div class="panel-container">${this.renderInPanel()}</div>`;
  }

  protected abstract renderInSidePanel(): TemplateResult;

  protected abstract renderInSettings(): TemplateResult;

  protected abstract renderInModuleDaemon(): TemplateResult;

  protected abstract renderInPanel(): TemplateResult;

  render() {
    switch (this.renderMode) {
      case 'renderInSettings':
        return this.renderSettingsWrapper();
      case 'renderInSidePanel':
        return this.renderSidePanelWrapper();
      case 'renderInDaemon':
        return this.renderDaemonWrapper();
      case 'renderInPanel':
        return this.renderInPanelWrapper();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookera-module-element': BookeraModuleElement;
  }
}

export const moduleElementStyles = css`
  .title-box {
    margin-bottom: var(--spacingSmall);
  }

  .title-description {
    margin-bottom: var(--spacing);
    font-size: var(--fontSizeSmall);
  }

  .panel-container {
    padding: var(--spacing);
  }

  h4 {
    text-align: start;
    border-bottom: 2px solid var(--slate-200);
    margin-left: 2px;
  }

  .column-layout div {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: stretch;
    gap: var(--spacingSmall);
  }
  .column-layout sl-icon-button {
    font-size: 24px;
  }

  .title-box {
    display: flex !important;
    align-items: center;
    margin-bottom: var(--spacing);
    position: relative;
  }

  .icon-button {
    position: absolute;
    right: 0;
  }
  .column-layout {
    display: flex;
    gap: var(--spacingMedium);
    margin: var(--spacing) 0 0 0;
  }

  section {
    margin-bottom: var(--spacing);
  }

  sl-icon-button {
    font-size: 20px;
    margin-right: var(--spacingSmall);
  }
  sl-icon-button::part(base) {
    padding: 0;
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
