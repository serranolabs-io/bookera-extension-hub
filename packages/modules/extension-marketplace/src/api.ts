import { sendEvent } from '@serranolabs.io/shared/util';
import { Config } from '@serranolabs.io/shared/extension-marketplace';
import { BookeraModuleClass } from '@serranolabs.io/shared/module';
import {
  NEW_PANEL_EVENT,
  NewPanelEventType,
  PanelTab,
  PanelTabs,
} from '@serranolabs.io/shared/panel';
import { ExtensionMarketplaceElement } from './extension-marketplace-element';
import { z } from 'zod';

export const UPSERT_CONFIG_PANEL_EVENT = 'upsert-config-panel-event';

export interface UpsertConfigPanel {
  config: Config<any>;
}

export const moduleStates = {
  renderConfig: 'render-config',
} as const;

export type ExtensionMarketplaceModuleState =
  (typeof moduleStates)[keyof typeof moduleStates];

// send the config, and also send the panel, which is of panelTab type
export function upsertConfigPanel(
  this: ExtensionMarketplaceElement,
  config: UpsertConfigPanel
) {
  sendEvent<NewPanelEventType<string>>(document, NEW_PANEL_EVENT, {
    tab: new PanelTab('Extension config', PanelTabs.Module),
    moduleId: this.module.id,
    moduleState: moduleStates.renderConfig,
  });
}
