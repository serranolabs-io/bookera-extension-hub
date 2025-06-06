import { customElement, property, state } from 'lit/decorators.js';
import extensionMarketplaceStyles from './extension-marketplace-element.styles';
import baseCss from '@serranolabs.io/shared/base';
import {
  BookeraModuleElement,
  moduleElementStyles,
} from '@serranolabs.io/shared/module-element';
import {
  BookeraModule,
  BookeraModuleConfig,
  type RenderMode,
} from '@serranolabs.io/shared/module';
import { html, TemplateResult } from 'lit';
import {
  MANAGE_CONFIG_CONSTRUCTED_EVENT,
  ManageConfigElement,
} from './manage-config-element';
import {
  Config,
  ExtensionConfig,
  SEND_CONFIG_EVENT,
  SEND_CONFIG_EVENT_FROM_API,
  SEND_CONFIG_EVENT_TYPE,
} from '@serranolabs.io/shared/extension-marketplace';
import {
  renderDownloadedPanel,
  renderInSidePanel,
  renderMarketplacePanel,
  setupSidePanel,
  TabGroup,
} from './side-panel';
import {
  ExtensionMarketplaceModuleInstanceType,
  SEND_DOWNLAODED_CONFIG_TO_PANEL_EVENT,
  upsertConfigPanel,
} from './api';
import { PANEL_CONSTRUCTION_EVENT } from '@serranolabs.io/shared/panel';
import { sendEvent } from '@serranolabs.io/shared/util';
import { Bag } from '@pb33f/saddlebag';
import {
  PUBLISH_CONFIG_CONSTRUCTED_EVENT,
  PublishConfigElement,
} from './publish-config-element';

export const elementName = 'extension-marketplace-element';

export const MANAGE_CONFIG_BAG_KEY = 'manage-config-bag-key';
@customElement(elementName)
export class ExtensionMarketplaceElement extends BookeraModuleElement {
  static styles = [extensionMarketplaceStyles, baseCss, moduleElementStyles];

  private _manageConfigBag: Bag<ExtensionConfig<any>> | undefined;

  constructor(
    config: BookeraModuleConfig<ExtensionMarketplaceModuleInstanceType>
  ) {
    super(config);

    if (this.renderMode === 'renderInSidePanel') {
      setupSidePanel.bind(this)();
    } else if (this.renderMode === 'renderInPanel') {
      this._manageConfigBag = this._getSyncedBag(MANAGE_CONFIG_BAG_KEY);
    }
  }

  protected _sidePanelSelectedExtension: ExtensionConfig<any> | null = null;
  _sendConfigToPublishConfigListener!: Function;

  @state()
  protected _extensions: ExtensionConfig<any>[] = [];

  protected _tabs: TabGroup[] = [
    {
      name: 'Marketplace',
      value: 'marketplace',
      showPanel: renderMarketplacePanel.bind(this),
    },
    {
      name: 'Downloaded',
      value: 'downloaded',
      showPanel: renderDownloadedPanel.bind(this),
    },
  ];

  @state()
  _temporaryConfig: Config<any> | null = null;

  _sendConfigToManageConfigInstanceListener!: Function;

  _listenToConfigEventsListener!: Function;

  private _listenToConfigEvents(e: CustomEvent<SEND_CONFIG_EVENT_TYPE<any>>) {
    const config = e.detail.config;
    upsertConfigPanel.bind(this)({ config });
  }

  connectedCallback(): void {
    super.connectedCallback();

    if (this.renderMode === 'renderInDaemon') {
      this._setupDaemonListeners();
    } else if (this.renderMode === 'renderInSidePanel') {
      this._sendConfigToPublishConfigListener =
        this._listenToPublishConfigEvents.bind(this);

      document.addEventListener(
        PUBLISH_CONFIG_CONSTRUCTED_EVENT,
        this._sendConfigToPublishConfigListener
      );
    }
  }

  private _listenToPublishConfigEvents(
    e: CustomEvent<SEND_CONFIG_EVENT_TYPE<any>>
  ) {
    console.log('we found out that panel constructed');
    sendEvent(this, SEND_DOWNLAODED_CONFIG_TO_PANEL_EVENT, {
      config: this._sidePanelSelectedExtension,
    });
  }

  private _setupDaemonListeners() {
    // @ts-expect-error
    this._listenToConfigEventsListener = this._listenToConfigEvents.bind(this);

    document.addEventListener(
      SEND_CONFIG_EVENT,
      this._listenToConfigEventsListener
    );

    this._sendConfigToManageConfigInstanceListener =
      this._sendConfigToManageConfigInstance.bind(this);

    document.addEventListener(
      MANAGE_CONFIG_CONSTRUCTED_EVENT,
      this._sendConfigToManageConfigInstanceListener
    );
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener(
      SEND_CONFIG_EVENT,
      this._listenToConfigEventsListener
    );
    document.removeEventListener(
      MANAGE_CONFIG_CONSTRUCTED_EVENT,
      this._sendConfigToManageConfigInstanceListener
    );
    document.removeEventListener(
      PUBLISH_CONFIG_CONSTRUCTED_EVENT,
      this._sendConfigToPublishConfigListener
    );
  }

  private _sendConfigToManageConfigInstance() {
    if (!this._temporaryConfig) {
      return;
    }
    console.log('we are now sending config to instance');

    // the problem is that I am calling upsertConfigPanel AGAIN.
    sendEvent<SEND_CONFIG_EVENT_TYPE<any>>(this, SEND_CONFIG_EVENT_FROM_API, {
      config: this._temporaryConfig,
    });

    console.log(this._temporaryConfig);

    this._temporaryConfig = null;
  }

  protected renderInSettings(): TemplateResult {
    return html`${this.renderTitleSection()} `;
  }
  protected renderInSidePanel(): TemplateResult {
    return html`
      ${this.renderSidePanelTitleSection()} ${renderInSidePanel.bind(this)()}
    `;
  }
  protected renderInPanel(): TemplateResult {
    // if this instance includes render-config, render in panel

    switch (
      this._config.instanceType as ExtensionMarketplaceModuleInstanceType
    ) {
      case 'render-config':
        return html`${new ManageConfigElement(
          this._config,
          this._manageConfigBag!,
          this._bagManager,
          this._runSyncedFlow.bind(this),
          this._saveSyncedLocalForage.bind(this)
        )}`;
      case 'published-config':
        return html`${new PublishConfigElement(
          this._config,
          this._bag!,
          this._bagManager,
          this._runLocalFlow.bind(this),
          this._savePanelTabState.bind(this)
        )}`;
      default:
    }

    return html`render config`;
  }
  protected renderInModuleDaemon(): TemplateResult {
    return html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [elementName]: ExtensionMarketplaceElement;
  }
}
