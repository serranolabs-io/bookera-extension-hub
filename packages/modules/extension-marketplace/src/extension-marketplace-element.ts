import { customElement, state } from 'lit/decorators.js';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import extensionMarketplaceStyles from './extension-marketplace-element.styles';
import baseCss from '@serranolabs.io/shared/base';
import {
  BookeraModuleElement,
  moduleElementStyles,
} from '@serranolabs.io/shared/module-element';
import { BookeraModuleConfig } from '@serranolabs.io/shared/module';
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
  marketplace,
  renderDownloadedPanel,
  renderInSidePanel,
  renderMarketplacePanel,
  renderMyDraftsPanel,
  renderMyExtensionsPanel,
  setupExtensionsTask,
  setupSidePanel,
  TabGroup,
  TabOption,
} from './side-panel';
import {
  apiConfig,
  ExtensionMarketplaceModuleInstanceType,
  upsertConfigPanel,
} from './api';
import { sendEvent } from '@serranolabs.io/shared/util';
import { DefaultApi, Extension } from './backend';
import { Task } from '@lit/task';

export const elementName = 'extension-marketplace-element';

export const MANAGE_CONFIG_BAG_KEY = 'manage-config-bag-key';
@customElement(elementName)
export class ExtensionMarketplaceElement extends BookeraModuleElement {
  static styles = [extensionMarketplaceStyles, baseCss, moduleElementStyles];

  protected _backendApi = new DefaultApi(apiConfig);

  constructor(
    config: BookeraModuleConfig<ExtensionMarketplaceModuleInstanceType>
  ) {
    super(config);

    if (this.renderMode === 'renderInSidePanel') {
      setupSidePanel.bind(this)();
      this._config.supabase?.auth.onAuthStateChange(
        this._onAuthStateChange.bind(this)
      );

      setupExtensionsTask.bind(this)();
    } else if (this.renderMode === 'renderInPanel') {
    }
  }

  _onAuthStateChange(
    event: AuthChangeEvent,
    session: Session | null
  ): void | Promise<void> {
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      setupExtensionsTask.bind(this)();
    }
  }

  protected _sidePanelSelectedExtension: ExtensionConfig | null = null;
  _sendConfigToPublishConfigListener!: Function;

  @state()
  protected _extensions: ExtensionConfig & Extension[] = [];

  protected _extensionsTask: null | Task = null;

  @state()
  _selectedTabOption: TabOption = marketplace;

  @state()
  _isPublished: boolean = true;

  @state()
  _isDownloadedTask: boolean | undefined = undefined;

  @state()
  _userIdTask: undefined | string = undefined;

  protected _tabs: TabGroup[] = [
    {
      name: 'Marketplace',
      value: 'marketplace',
      showPanel: renderMarketplacePanel.bind(this),
      setupTask: () => {
        this._isPublished = true;
        this._userIdTask = undefined;
        this._isDownloadedTask = undefined;
      },
    },
    {
      name: 'Downloaded',
      value: 'downloaded',
      showPanel: renderDownloadedPanel.bind(this),
      setupTask: () => {
        this._isPublished = true;
        this._userIdTask = undefined;
        this._isDownloadedTask = true;
      },
    },
    {
      name: 'My Extensions',
      value: 'my-extensions',
      showPanel: renderMyExtensionsPanel.bind(this),
      setupTask: () => {
        this._isPublished = true;
        this._userIdTask = this._user?.id;
        this._isDownloadedTask = undefined;
      },
    },
    {
      name: 'My Drafts',
      value: 'my-drafts',
      showPanel: renderMyDraftsPanel.bind(this),
      setupTask: () => {
        this._isPublished = false;
        this._userId = this._user?.id;
      },
    },
  ];

  @state()
  _temporaryConfig: Config | null = null;

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
      this._tabs[0].setupTask();
    } else if (this.renderMode === 'renderInSidePanel') {
    }

    if (
      this.renderMode === 'renderInDaemon' ||
      this.renderMode === 'renderInSidePanel'
    ) {
      this._sendConfigToManageConfigInstanceListener =
        this._sendConfigToManageConfigInstance.bind(this);

      document.addEventListener(
        MANAGE_CONFIG_CONSTRUCTED_EVENT,
        this._sendConfigToManageConfigInstanceListener
      );
    }
  }

  private _setupDaemonListeners() {
    // @ts-expect-error
    this._listenToConfigEventsListener = this._listenToConfigEvents.bind(this);

    document.addEventListener(
      SEND_CONFIG_EVENT,
      this._listenToConfigEventsListener
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
  }

  private _sendConfigToManageConfigInstance() {
    if (this._sidePanelSelectedExtension) {
      sendEvent(this, SEND_CONFIG_EVENT_FROM_API, {
        config: this._sidePanelSelectedExtension,
      });

      this._sidePanelSelectedExtension = null;
    }

    if (this._temporaryConfig) {
      sendEvent(this, SEND_CONFIG_EVENT_FROM_API, {
        config: this._temporaryConfig,
      });

      this._temporaryConfig = null;
    }
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
      case 'published-config':
      case 'my-draft':
      case 'my-extension':
        return html`${new ManageConfigElement(
          this._config,
          this._bag,
          this._bagManager,
          this._runLocalFlow.bind(this),
          this._savePanelTabState.bind(this),
          this._user
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
