import { TemplateLiteral } from 'typescript';
import { ExtensionMarketplaceElement } from './extension-marketplace-element';
import { html, TemplateResult } from 'lit';
import { ExtensionConfig } from '@serranolabs.io/shared/extension-marketplace';
import { repeat } from 'lit/directives/repeat.js';
import { TABLES } from '@serranolabs.io/shared/supabase';
import {
  doesClickContainElement,
  sendEvent,
} from '@serranolabs.io/shared/util';
import { notify } from '@serranolabs.io/shared/lit';
import {
  NewPanelEventType,
  NEW_PANEL_EVENT,
  PanelTab,
  PanelTabs,
} from '@serranolabs.io/shared/panel';
import { moduleInstances, windows } from './api';

export const marketplace = 'marketplace';
export const downloaded = 'downloaded';
export type TabOption = typeof downloaded | typeof marketplace;

export interface TabGroup {
  name: string;
  value: TabOption;
  showPanel: () => TemplateResult;
}

function renderImageBox(extensionImg: string | null): TemplateResult {
  let content = html`<sl-icon name="puzzle"></sl-icon>`;
  if (extensionImg) {
    content = html` <img src=${extensionImg} /> `;
  }

  return html` <div class="image-box">${content}</div> `;
}

function renderExtensionsList(this: ExtensionMarketplaceElement, filters) {
  return html``;
}

function selectExtensionFromMarketplace(
  this: ExtensionMarketplaceElement,
  e: Event
) {
  const el = doesClickContainElement<HTMLButtonElement>(e, {
    nodeName: 'button',
  });

  if (!el) {
    return;
  }

  const id = Number(el.id);

  const extension = this._extensions.find((extension: ExtensionConfig<any>) => {
    // todo: use zod
    return extension.id === id;
  });

  if (!extension) {
    notify(
      'Could not find extension. If you got here, please file a report :3',
      'warning'
    );
    return;
  }

  sendEvent<NewPanelEventType<string>>(document, NEW_PANEL_EVENT, {
    tab: new PanelTab(windows.viewPublishedConfig, PanelTabs.Module),
    moduleId: this.module.id,
    moduleInstanceType: moduleInstances.publishedConfig,
    instanceLimit: -1,
  });

  this._sidePanelSelectedExtension = extension;
}

export function renderMarketplacePanel(this: ExtensionMarketplaceElement) {
  return html`
    <ul
      class="extensions-list"
      @click=${selectExtensionFromMarketplace.bind(this)}
    >
      ${this._extensions.map((extension: ExtensionConfig<string>) => {
        return html`
          <li>
            <button id=${extension.id}>
              ${renderImageBox(extension.image)}
              <div class="description-box">
                <h5>${extension.title}</h5>
                <small class="description">${extension.description}</small>
                <small class="user-id">${extension.userId}</small>
              </div>
              <span class="view-hover">&rarr;</span>
            </button>
          </li>
        `;
      })}
    </ul>
  `;
}

export function renderDownloadedPanel(this: ExtensionMarketplaceElement) {
  return html`hello from panel`;
}

export function renderInSidePanel(
  this: ExtensionMarketplaceElement
): TemplateResult {
  return html`
    <sl-tab-group>
      ${this._tabs.map((tab: TabGroup) => {
        return html`<sl-tab slot="nav" panel=${tab.value}>${tab.name}</sl-tab>
          <sl-tab-panel name=${tab.value}> ${tab.showPanel()} </sl-tab-panel>`;
      })}
    </sl-tab-group>
  `;
}

export async function setupSidePanel(this: ExtensionMarketplaceElement) {
  if (!this._supabase) {
    return;
  }

  const { data: configs, error } = await this._supabase
    .from<string, ExtensionConfig<string>>('ExtensionConfig')
    .select('*');

  if (error) {
    console.error('Error fetching extension configs:', error);
    return;
  }

  if (!configs) {
    console.warn('No extension configs found.');
    return;
  }

  this._extensions = configs as ExtensionConfig<string>;
}
