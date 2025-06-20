import { TemplateLiteral } from 'typescript';
import { ExtensionMarketplaceElement } from './extension-marketplace-element';
import { html, TemplateResult } from 'lit';
import {
  ExtensionConfig,
  PackageJson,
} from '@serranolabs.io/shared/extension-marketplace';
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
import { moduleInstances, upsertConfigPanel, windows } from './api';
import { Extension } from './backend';
import { User } from '@serranolabs.io/shared/user';
import { Task } from '@lit/task';
import { getExtensionIcon, renderImageBox } from './utils';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/skeleton/skeleton.js';

export const marketplace = 'marketplace';
export const downloaded = 'downloaded';
export type TabOption = typeof downloaded | typeof marketplace;

export interface TabGroup {
  name: string;
  value: TabOption;
  showPanel: () => TemplateResult;
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

  const extension = this._extensions.find((extension: ExtensionConfig) => {
    // todo: use zod
    return extension.id == id;
  });

  console.log(extension, el);

  if (!extension) {
    notify(
      'Could not find extension. If you got here, please file a report :3',
      'warning'
    );
    return;
  }

  sendEvent<NewPanelEventType<string>>(document, NEW_PANEL_EVENT, {
    tab: new PanelTab(
      windows.viewPublishedConfig + ': ' + extension.title,
      PanelTabs.Module
    ),
    moduleId: this.module.id,
    moduleInstanceType: moduleInstances.publishedConfig,
    instanceLimit: -1,
  });

  this._sidePanelSelectedExtension = extension;
}

function renderExtension(extension: ExtensionConfig & Extension) {
  return html`
    <li>
      <button id=${extension.id}>
        ${renderImageBox(extension, '48')}
        <div class="description-box">
          <h5>${extension.title}</h5>
          <small class="description">${extension.description}</small>
          <small class="user-id">${extension.userId}</small>
        </div>
        <span class="view-hover">&rarr;</span>
      </button>
    </li>
  `;
}

function renderSkeleton() {
  return html`<div class="skeleton-overview">
    <header>
      <sl-skeleton effect="pulse"></sl-skeleton>
    </header>
    <div>
      <sl-skeleton effect="pulse"></sl-skeleton>
      <sl-skeleton effect="pulse"></sl-skeleton>
      <sl-skeleton effect="pulse"></sl-skeleton>
    </div>
  </div> `;
}

export function renderMarketplacePanel(this: ExtensionMarketplaceElement) {
  return html`
    <ul
      class="extensions-list"
      @click=${selectExtensionFromMarketplace.bind(this)}
    >
      ${this._extensionsTask?.render({
        pending: () => {
          return html`<div class="skeleton-list">
            ${Array.from({ length: 5 }, () => renderSkeleton())}
          </div> `;
        },
        complete: (extensions: readonly (ExtensionConfig & Extension)[]) => {
          this._extensions = extensions;

          if (extensions.length === 0) {
            return html`🙅‍♀️ No extensions`;
          }

          return extensions.map(
            (extension: ExtensionConfig<string> & Extension) => {
              return html`${renderExtension(extension)}`;
            }
          );
        },
        error: () => html`😿 could not get extensions`,
      })}
    </ul>
  `;
}

export function renderDownloadedPanel(this: ExtensionMarketplaceElement) {
  return html`hello from panel`;
}

export function handleCreateExtension(this: ExtensionMarketplaceElement) {
  upsertConfigPanel.bind(this)(null);
}

export function renderInSidePanel(
  this: ExtensionMarketplaceElement
): TemplateResult {
  const renderCreateExtensionButton = () => {
    return html`
      <div class="create-extension-box">
        <sl-tooltip content="Create extension!"></sl-tooltip>
        <sl-icon-button
          name="plus-circle"
          @click=${handleCreateExtension.bind(this)}
        >
        </sl-icon-button>
      </div>
    `;
  };

  return html`
    ${renderCreateExtensionButton()}
    <sl-tab-group>
      ${this._tabs.map((tab: TabGroup) => {
        return html`<sl-tab slot="nav" panel=${tab.value}>${tab.name}</sl-tab>
          <sl-tab-panel name=${tab.value}> ${tab.showPanel()} </sl-tab-panel>`;
      })}
    </sl-tab-group>
  `;
}

export const convertBackendExtensionIntoExtension = (
  extensions: Extension[]
): ExtensionConfig[] => {
  return extensions.map((extension: Extension) => {
    const packageJson: PackageJson = JSON.parse(extension.packageJson);

    return {
      configs: extension.config,
      version: packageJson.version,
      userId: extension.userId,
      description: packageJson.description,
      hasIcon: extension.hasIcon,
      title: packageJson.name,
      author: packageJson.author,
      isPublished: packageJson.private,
      id: extension.id ? String(extension.id) : '',
    } as ExtensionConfig;
  });
};

export async function setupSidePanel(this: ExtensionMarketplaceElement) {
  if (!this._supabase) {
    return;
  }

  this._extensionsTask = new Task(this, {
    task: async () => {
      let allExtensions, error;
      try {
        allExtensions = await this._backendApi.getAllExtensions();
      } catch (e) {
        error = e;
      } finally {
        if (!allExtensions) {
          throw new Error(error as string);
        }

        const converted = convertBackendExtensionIntoExtension(allExtensions);
        return converted;
      }
    },
    args: () => [],
  });
}
