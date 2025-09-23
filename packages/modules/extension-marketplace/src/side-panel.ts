import { ExtensionMarketplaceElement } from './extension-marketplace-element';
import { html, TemplateResult } from 'lit';
import { ExtensionConfig, PackageJson } from '@serranolabs.io/shared/extension-marketplace';
import { doesClickContainElement, sendEvent } from '@serranolabs.io/shared/util';
import { notify } from '@serranolabs.io/shared/lit';
import {
  NewPanelEventType,
  NEW_PANEL_EVENT,
  PanelTab,
  PanelTabs,
} from '@serranolabs.io/shared/panel';
import { moduleInstances, upsertConfigPanel, windows } from './api';
import { Extension, GetAllExtensionsRequest } from './backend';
import { Task } from '@lit/task';
import { renderImageBox } from './utils';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/skeleton/skeleton.js';

export const marketplace = 'marketplace';
export const downloaded = 'downloaded';
export const myDrafts = 'my-drafts';
export const myExtensions = 'my-extensions';
export type TabOption =
  | typeof downloaded
  | typeof marketplace
  | typeof myDrafts
  | typeof myExtensions;

export interface TabGroup {
  showPanel: () => TemplateResult;
  setupTask: () => void;
  value: TabOption;
  name: string;
}

function sendSelectedExtension(
  this: ExtensionMarketplaceElement,
  extension: ExtensionConfig & Extension
) {
  let tabNamePrefix;
  let moduleInstanceType;
  let instanceLimit = -1;
  if (this._selectedTabOption === 'my-extensions') {
    tabNamePrefix = windows.myExtension;
    moduleInstanceType = moduleInstances.myExtension;
  } else if (this._selectedTabOption === 'my-drafts') {
    tabNamePrefix = windows.myDraft;
    moduleInstanceType = moduleInstances.renderConfig;
    instanceLimit = 1;
  } else if (this._selectedTabOption === 'marketplace') {
    if (this._user?.id === extension.userId) {
      tabNamePrefix = windows.myExtension;
      moduleInstanceType = moduleInstances.myExtension;
    } else {
      tabNamePrefix = windows.downloadExtension;
      moduleInstanceType = moduleInstances.downloadExtension;
    }
  }

  sendEvent<NewPanelEventType<string>>(document, NEW_PANEL_EVENT, {
    tab: new PanelTab(tabNamePrefix + ': ' + extension.title, PanelTabs.Module),
    moduleId: this.module.id,
    moduleInstanceType: moduleInstanceType,
    instanceLimit: instanceLimit,
  });

  this._sidePanelSelectedExtension = extension;
}

function selectExtensionFromMarketplace(this: ExtensionMarketplaceElement, e: Event) {
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

  if (!extension) {
    notify('Could not find extension. If you got here, please file a report :3', 'warning');
    return;
  }

  sendSelectedExtension.bind(this)(extension);
}

function renderExtensionIconIdentifier(
  this: ExtensionMarketplaceElement,
  extension: ExtensionConfig & Extension
) {
  let personIcon;
  if (this._user?.id === extension.userId) {
    personIcon = html` <sl-icon name="person"> </sl-icon> `;
  }

  let isDownloadedIcon;
  if (!extension?.isDownloaded && this._user?.id !== extension.userId) {
    isDownloadedIcon = html` <sl-tag size="small" variant="secondary">Install</sl-tag> `;
  }

  return html` <div class="extension-icon-identifier">${personIcon}${isDownloadedIcon}</div> `;
}

function renderExtension(
  this: ExtensionMarketplaceElement,
  extension: ExtensionConfig & Extension
) {
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
        ${renderExtensionIconIdentifier.bind(this)(extension)}
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

function renderExtensionsTask(this: ExtensionMarketplaceElement) {
  return html`
    <ul class="extensions-list" @click=${selectExtensionFromMarketplace.bind(this)}>
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

          return extensions.map((extension: ExtensionConfig<string> & Extension) => {
            return html`${renderExtension.bind(this)(extension)}`;
          });
        },
        error: () => html`😿 could not get extensions`,
      })}
    </ul>
  `;
}

export function renderMarketplacePanel(this: ExtensionMarketplaceElement) {
  return renderExtensionsTask.bind(this)();
}

export function renderDownloadedPanel(this: ExtensionMarketplaceElement) {
  if (!this._user) {
    return html`<p class="must-be-logged-in">Must be logged in to view downloaded extensions!</p>`;
  }

  return renderExtensionsTask.bind(this)();
}

export function renderMyExtensionsPanel(this: ExtensionMarketplaceElement) {
  if (!this._user) {
    return html`<p class="must-be-logged-in">Must be logged in to view your extensions!</p>`;
  }

  return renderExtensionsTask.bind(this)();
}

export function renderMyDraftsPanel(this: ExtensionMarketplaceElement) {
  if (!this._user) {
    return html`<p class="must-be-logged-in">Must be logged in to view your drafts!</p>`;
  }

  return renderExtensionsTask.bind(this)();
}

export function handleCreateExtension(this: ExtensionMarketplaceElement) {
  upsertConfigPanel.bind(this)(null);
}

export function renderInSidePanel(this: ExtensionMarketplaceElement): TemplateResult {
  const renderCreateExtensionButton = () => {
    return html`
      <div class="create-extension-box">
        <sl-tooltip content="Create extension!"></sl-tooltip>
        <sl-icon-button name="plus-circle" @click=${handleCreateExtension.bind(this)}>
        </sl-icon-button>
      </div>
    `;
  };

  return html`
    ${renderCreateExtensionButton()}
    <sl-tab-group
      @sl-tab-show=${e => {
        const value: TabOption = e.detail.name;
        const selectedTab = this._tabs.find((tab: TabGroup) => {
          return tab.value === value;
        })!;

        this._selectedTabOption = selectedTab?.value;

        selectedTab?.setupTask();
      }}
    >
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
      isDownloaded: extension.isDownloaded,
      author: packageJson.author,
      isPublished: extension.isPublished ? true : false,
      id: extension.id ? String(extension.id) : '',
    } as ExtensionConfig;
  });
};

export function setupExtensionsTask(this: ExtensionMarketplaceElement) {
  this._extensionsTask = new Task(this, {
    task: async ([isPublished, userId, isDownloaded]) => {
      let allExtensions, error;

      try {
        allExtensions = await this._backendApi.getAllExtensions({
          isPublished: isPublished,
          filterByUserId: userId,
          userId: this._user?.id,
          isDownloaded: isDownloaded,
        });
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
    args: () => [this._isPublished, this._userIdTask, this._isDownloadedTask],
  });
}

export async function setupSidePanel(this: ExtensionMarketplaceElement) {
  if (!this._supabase) {
    return;
  }
}
