import { Bag, BagManager } from '@pb33f/saddlebag';
import baseCss from '@serranolabs.io/shared/base';
import {
  ExtensionConfig,
  Config,
  SEND_CONFIG_EVENT_TYPE,
} from '@serranolabs.io/shared/extension-marketplace';
import { BookeraModuleConfig } from '@serranolabs.io/shared/module';
import { TABLES } from '@serranolabs.io/shared/supabase';
import { SlDialog } from '@shoelace-style/shoelace';
import { TanStackFormController } from '@tanstack/lit-form';
import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import {
  ExtensionMarketplaceModuleInstanceType,
  SEND_DOWNLAODED_CONFIG_TO_PANEL_EVENT,
} from './api';
import { ARE_YOU_SURE_DIALOG } from './manage-config-element';
import manageConfigElementStyles from './manage-config-element.styles';
import { defaultExtensionConfig } from './manage-config-stateful';
import { sendEvent } from '@serranolabs.io/shared/util';
import { renderConfigs } from './render-logic';

export const PUBLISH_CONFIG_CONSTRUCTED_EVENT =
  'publish-config-constructed-event';

export const LISTEN_TO_PUBLISH_CONFIG_EVENT = 'listen-to-publish-config-event';

export const ExtensionKey = 'extension-key';

@customElement('publish-config-element')
export class PublishConfigElement extends LitElement {
  static styles = [manageConfigElementStyles, baseCss];

  private _config: BookeraModuleConfig<ExtensionMarketplaceModuleInstanceType>;

  private _listenToPublishConfigEventListener!: Function;

  @query(`#${ARE_YOU_SURE_DIALOG}`)
  private _areYouSureDialog!: SlDialog;

  private _bag: Bag<ExtensionConfig<any>>;

  private _bagManager: BagManager;

  private _selectedConfig: Config<any> | null = null;

  private _extension!: ExtensionConfig<any>;

  private _runLocalFlow: (defaultFunction: () => void) => void;

  private _savePanelTabState;

  constructor(
    config: BookeraModuleConfig<ExtensionMarketplaceModuleInstanceType>,
    bag: Bag<ExtensionConfig<any>>,
    bagManager: BagManager,
    runLocalFlow: (defaultsFunction: () => void) => void,
    savePanelTabState: any
  ) {
    super();

    this._bagManager = bagManager;
    this._config = config;
    this._bag = bag;
    //   this._bag.onAllChanges(this._setupExtensionConfig.bind(this));
    //   this._setupExtensionConfig(MANAGE_CONFIG_BAG_KEY);
    this._savePanelTabState = savePanelTabState;

    this._runLocalFlow = runLocalFlow;
  }

  connectedCallback(): void {
    super.connectedCallback();

    this._listenToPublishConfigEventListener =
      this._listenToConfigEvents.bind(this);

    document.addEventListener(
      SEND_DOWNLAODED_CONFIG_TO_PANEL_EVENT,
      this._listenToPublishConfigEventListener
    );
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    document.removeEventListener(
      SEND_DOWNLAODED_CONFIG_TO_PANEL_EVENT,
      this._listenToPublishConfigEventListener
    );
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    console.log('panel cosntructed');

    sendEvent(this, PUBLISH_CONFIG_CONSTRUCTED_EVENT);
    this._kickOffLocalFlow();
  }

  private _listenToConfigEvents(e: CustomEvent<SEND_CONFIG_EVENT_TYPE<any>>) {
    console.log('config sent!!! publish config', e.detail.config);

    if (!e.detail.config) return;

    this._extension = e.detail.config;

    if (this._extension.configs) {
      this._extension.configs = JSON.parse(this._extension.configs);
    }

    this._savePanelTabState(ExtensionKey, this._extension);

    document.removeEventListener(
      SEND_DOWNLAODED_CONFIG_TO_PANEL_EVENT,
      this._listenToPublishConfigEventListener
    );

    this.requestUpdate();
  }

  private async _kickOffLocalFlow() {
    await this._runLocalFlow(() => {
      this._savePanelTabState(ExtensionKey, this._extension);
    });

    if (!this._bag) return;

    this._bag.onAllChanges((key) => {
      console.log(key);
    });

    console.log('bag', this._bag);

    Array.from(this._bag?.export().entries()).forEach(([key, newValue]) => {
      console.log(key, newValue);

      if (key === ExtensionKey) {
        this._extension = newValue;
      }

      this.requestUpdate();
    });
  }

  render() {
    if (!this._extension) return html``;

    console.log('rendering config', this._extension.configs);

    return html`
      ${renderConfigs.bind(this)(this._extension.configs, 'publish')}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'publish-config-element': PublishConfigElement;
  }
}
