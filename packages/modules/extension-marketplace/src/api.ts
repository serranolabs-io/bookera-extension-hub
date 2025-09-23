import { sendEvent } from '@serranolabs.io/shared/util';
import { Config } from '@serranolabs.io/shared/extension-marketplace';
import {
  NEW_PANEL_EVENT,
  NewPanelEventType,
  PanelTab,
  PanelTabs,
} from '@serranolabs.io/shared/panel';
import { ExtensionMarketplaceElement } from './extension-marketplace-element';
import { Configuration } from './backend';

let backendServiceUrl = 'https://extension-marketplace-service.fly.dev';
if (import.meta.env.MODE === 'development') {
  backendServiceUrl = 'http://localhost:8080';
}

export const apiConfig: Configuration = new Configuration({
  basePath: backendServiceUrl,
});

export const UPSERT_CONFIG_PANEL_EVENT = 'upsert-config-panel-event';

export interface UpsertConfigPanel {
  config: Config;
}

export const SEND_DOWNLAODED_CONFIG_TO_PANEL_EVENT = 'send-downloaded-config-to-panel-event';

export const windows = {
  renderConfig: '🧩🌐 Publish Extension',
  downloadExtension: '📥 Download Extension',
  myExtension: '📦 My Extension',
  myDraft: '📝 My Draft',
  manageExtension: '⚙️ Manage Extension',
} as const;

export const moduleInstances = {
  renderConfig: 'render-config', // creating an extension
  downloadExtension: 'published-config', //
  myExtension: 'my-extension', // a published extension that's mine.
  myDraft: 'my-draft', // my extension Im editing
} as const;

export type ExtensionMarketplaceModuleInstanceType =
  (typeof moduleInstances)[keyof typeof moduleInstances];

// send the config, and also send the panel, which is of panelTab type
export function upsertConfigPanel(
  this: ExtensionMarketplaceElement,
  config: UpsertConfigPanel | null
) {
  switch (this._config.instanceType as ExtensionMarketplaceModuleInstanceType) {
    case 'render-config':
      // nothing goes here because 'the 'render-config' panel should handle the event
      break;
    default:
      sendEvent<NewPanelEventType<string>>(document, NEW_PANEL_EVENT, {
        tab: new PanelTab(windows.renderConfig, PanelTabs.Module),
        moduleId: this.module.id,
        moduleInstanceType: moduleInstances.renderConfig,
        instanceLimit: 1,
      });

      if (config?.config) {
        this._temporaryConfig = config.config;
      }
  }
}
