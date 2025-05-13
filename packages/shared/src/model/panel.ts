import { html, type TemplateResult } from 'lit';
import { BookeraModule, type BookeraModuleClass } from '../module/module';
import type { TabPosition } from '../module/tab';
import { genShortID } from './util';

export const CLOSE_PANEL_EVENT = 'close-panel-event';
export const SPLIT_PANEL_EVENT = 'split-panel-event';
export const PANEL_CONSTRUCTION_EVENT = 'panel-construction-event';
export const OPEN_SIDE_PANEL_EVENT = 'open-side-panel-event';
export const NEW_PANEL_EVENT = 'new-panel-event';
export const IS_DRAGGING_TAB_EVENT = 'is-dragging-tab-event';
export const NEW_TAB_EVENT = 'new-tab-event';
export const TOGGLE_SIDE_PANEL_EVENT = 'toggle-side-panel-event';
export const SWITCH_TOGGLE_SIDE_PANEL_EVENT = 'switch-toggle-side-panel-event';
export const CLOSE_SIDE_PANEL_EVENT = 'close-side-panel-event';

export interface NewPanelEventType {
  tab: PanelTab;
  moduleId?: string;
}

export interface NewPanelEventType {
  tab: PanelTab;
}

export interface OpenSidePanelEventTYpe {
  panelID: TabPosition;
  position: TabPosition;
}

export interface ToggleSidePanelEventType {
  module: BookeraModule | null;
  position: TabPosition;
}

export interface CloseSidePanelEventType {
  closedDrawerWidth: number;
  position: TabPosition;
}

export interface SplitPanelEventType {
  panelID: string;
  tab: PanelTab;
  side: PanelDrop;
  moduleId?: string;
}

export enum PanelDrop {
  Left = 'Left',
  Right = 'Right',
  Center = 'Center',
}

// ! please please redefine them lmao
export const PanelTabs = {
  Settings: 'Settings',
  New: 'New',
  Module: 'Module',
  Undefined: 'Undefined',
} as const;
export type PanelTabType = keyof typeof PanelTabs;

export class PanelTab {
  name?: string;
  type?: PanelTabType;
  id?: string;
  _panelContentElement?: any;

  constructor(name?: string, type?: PanelTabType, id?: string) {
    this.name = name;
    this.type = type;
    if (id) {
      this.id = id;
    } else {
      this.id = genShortID(6);
    }
  }

  static NewPanelTab(
    panelTab: PanelTab,
    panelContentElement: new () => object
  ): PanelTab {
    const pt = new PanelTab(panelTab.name, panelTab.type, panelTab.id);

    pt._panelContentElement = panelContentElement;

    return pt;
  }

  renderPanelContents(): TemplateResult {
    if (!this.id) return html``;

    const panelContent = new this._panelContentElement(
      this.type as PanelTabType,
      this.id
    );

    return html`${panelContent}`;
  }
}
interface PanelElement {}

export interface IsDraggingTabEvent {
  tab: PanelTab;
  tabElement: Element;
  el: Element | null;
  hoveredTab: HTMLElement | null;
  hoveredTabElement: Element | null;
  isHoveringOverPanel: boolean;
  panelDrop: PanelDrop | null;
  fromPanel: string | null;
  toPanel: string | null;
  panel: PanelElement;
}

export type PanelApi =
  | typeof CLOSE_PANEL_EVENT
  | typeof SPLIT_PANEL_EVENT
  | typeof PANEL_CONSTRUCTION_EVENT
  | typeof OPEN_SIDE_PANEL_EVENT
  | typeof NEW_PANEL_EVENT
  | typeof IS_DRAGGING_TAB_EVENT
  | typeof NEW_TAB_EVENT
  | typeof TOGGLE_SIDE_PANEL_EVENT
  | typeof CLOSE_SIDE_PANEL_EVENT
  | typeof SWITCH_TOGGLE_SIDE_PANEL_EVENT;
