import { sendEvent } from '@serranolabs.io/shared/util';
import { Config } from '@serranolabs.io/shared/extension-marketplace';
import {
  NEW_PANEL_EVENT,
  NewPanelEventType,
  PanelTab,
  PanelTabs,
} from '@serranolabs.io/shared/panel';
import { ExtensionMarketplaceElement } from './extension-marketplace-element';

export const UPSERT_CONFIG_PANEL_EVENT = 'upsert-config-panel-event';

export interface UpsertConfigPanel {
  config: Config<any>;
}

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
  sendEvent<NewPanelEventType<string>>(document, NEW_PANEL_EVENT, {
    tab: new PanelTab('🧩🌐 Publish E️xtension', PanelTabs.Module),
    moduleId: this.module.id,
    moduleInstanceType: moduleInstances.renderConfig,
    instanceLimit: 1,
  });
}
