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
import { ManageConfigElement } from './manage-config-element';
import {
  Config,
  ExtensionConfig,
  SEND_CONFIG_EVENT,
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
  upsertConfigPanel,
} from './api';

export const elementName = 'extension-marketplace-element';

@customElement(elementName)
export class ExtensionMarketplaceElement extends BookeraModuleElement {
  static styles = [extensionMarketplaceStyles, baseCss, moduleElementStyles];

  constructor(
    config: BookeraModuleConfig<ExtensionMarketplaceModuleInstanceType>
  ) {
    super(config);

    if (this.renderMode === 'renderInDaemon') {
      this._setupDaemonListeners();
    } else if (this.renderMode === 'renderInSidePanel') {
      setupSidePanel.bind(this)();
    }
  }

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

  private _listenToConfigEvents(e: CustomEvent<SEND_CONFIG_EVENT_TYPE<any>>) {
    const config = e.detail.config;
    upsertConfigPanel.bind(this)({ config });
  }

  private _setupDaemonListeners() {
    // @ts-expect-error
    document.addEventListener(
      SEND_CONFIG_EVENT,
      this._listenToConfigEvents.bind(this)
    );
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
    if (this.module === 'render-config') {
      return html`NEW PANEL BABY`;
    }

    return html`${new ManageConfigElement(this._config)}`;
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
