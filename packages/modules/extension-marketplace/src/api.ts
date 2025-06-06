import { sendEvent } from '@serranolabs.io/shared/util';
import { Config } from '@serranolabs.io/shared/extension-marketplace';
import {
  NEW_PANEL_EVENT,
  NewPanelEventType,
  PanelTab,
  PanelTabs,
} from '@serranolabs.io/shared/panel';
import { ExtensionMarketplaceElement } from './extension-marketplace-element';
import { SendConfig } from './manage-config-element';

export const UPSERT_CONFIG_PANEL_EVENT = 'upsert-config-panel-event';

export interface UpsertConfigPanel {
  config: Config<any>;
}

export const SEND_DOWNLAODED_CONFIG_TO_PANEL_EVENT =
  'send-downloaded-config-to-panel-event';

export const windows = {
  renderConfig: '🧩🌐 Publish E️xtension',
  viewPublishedConfig: '📥 Download E️xtension',
} as const;

export const moduleInstances = {
  renderConfig: 'render-config',
  publishedConfig: 'published-config',
} as const;

export type ExtensionMarketplaceModuleInstanceType =
  (typeof moduleInstances)[keyof typeof moduleInstances];

// send the config, and also send the panel, which is of panelTab type
export function upsertConfigPanel(
  this: ExtensionMarketplaceElement,
  config: UpsertConfigPanel
) {
  switch (this._config.instanceType as ExtensionMarketplaceModuleInstanceType) {
    case 'render-config':
      // nothing goes here because 'the 'render-config' panel should handle the event
      break;
    default:
      console.log('this is called');
      sendEvent<NewPanelEventType<string>>(document, NEW_PANEL_EVENT, {
        tab: new PanelTab(windows.renderConfig, PanelTabs.Module),
        moduleId: this.module.id,
        moduleInstanceType: moduleInstances.renderConfig,
        instanceLimit: 1,
      });
      this._temporaryConfig = config.config;
  }
}
