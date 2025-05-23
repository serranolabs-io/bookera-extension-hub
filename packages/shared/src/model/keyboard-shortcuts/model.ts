import localforage from 'localforage';
import { genShortID } from '../util';
import type { KeyboardEventKey } from './keyboard-event-key-type';
import { html, type TemplateResult } from 'lit';

export * from './keyboard-event-key-type';

export type Operator = '&&' | '||' | '!' | '(' | ')';

export const operators: readonly Operator[] = [
  '&&',
  '||',
  '!',
  '(',
  ')',
] as const;

export type PanelTabsFocus = 'panelTabsFocus';
export type PanelFocus = 'panelFocus';
export type SidePanelFocus = 'sidePanelFocus';
export type LeftSidePanelFocus = 'leftSidePanelFocus';
export type RightSidePanelFocus = 'rightSidePanelFocus';
export type PanelBarFocus = 'panelBarFocus';
export type SideDrawerFocus = 'sideDrawerFocus';
export type ModuleDaemonFocus = 'moduleDaemonFocus';

export type When =
  | PanelTabsFocus
  | PanelFocus
  | LeftSidePanelFocus
  | RightSidePanelFocus
  | SidePanelFocus
  | Operator
  | PanelBarFocus
  | SideDrawerFocus
  | ModuleDaemonFocus;

export class Source {
  name: string;
  link?: string;

  constructor(name: string, link?: string) {
    this.name = name;
    this.link = link;
  }
}

export const studio = {
  panel: {
    previousPanelTab: 'studio.panel.previousPanelTab',
    nextPanelTab: 'studio.panel.nextPanelTab',
    leavePanelTabs: 'studio.panel.leavePanelTabs',
    enterPanelTabs: 'studio.panel.enterPanelTabs',
    previousPanelView: 'studio.panel.previousPanelView',
    nextPanelView: 'studio.panel.nextPanelView',
    growPanel: 'studio.panel.growPanel',
    shrinkPanel: 'studio.panel.shrinkPanel',
    closePanel: 'studio.panel.closePanel',
    splitPanel: 'studio.panel.splitPanel',
    addPanelTab: 'studio.panel.addPanelTab',
  },
  sidePanel: {
    traverseTabsUp: 'studio.sidePanel.traverseTabsUp',
    traverseTabsDown: 'studio.sidePanel.traverseTabsDown',
    navigateToPanelBar: 'studio.sidePanel.navigateToPanelBar',
    navigateToDrawer: 'studio.sidePanel.navigateToDrawer',
    openLeft: 'studio.sidePanel.openLeft',
    openRight: 'studio.sidePanel.openRight',
    navigateToSidePanel: 'studio.sidePanel.navigateToSidePanel',
  },
  settings: {
    openSettings: 'studio.settings.open',
    openCommandPalette: 'studio.settings.openCommandPalette',
  },
};

export class KeyboardShortcut {
  command: string;
  keys: KeyboardEventKey[][];
  when: string[];
  source: Source;
  description: string;
  title: string;
  shouldAppearInCommandPalette: string;
  id: string;

  constructor(
    command: string,
    keys: KeyboardEventKey[][],
    when: When[],
    source: Source,
    description: string,
    title: string,
    shouldAppearInCommandPalette: string,
    id?: string
  ) {
    this.command = command;
    this.keys = keys;
    this.when = when;
    this.source = source;
    this.description = description;
    this.title = title;
    this.shouldAppearInCommandPalette = shouldAppearInCommandPalette;

    if (id) {
      this.id = id;
    } else {
      this.id = genShortID(10);
    }
  }

  static PrintKey(key: KeyboardEventKey) {
    if (key === ' ') {
      return html`Space`;
    } else if (key === 'Alt') {
      return html`<sl-icon name="alt"></sl-icon>`;
    } else if (key === 'Meta') {
      return html`<sl-icon name="command"></sl-icon>`;
    } else if (key === 'Shift') {
      return html`<sl-icon name="shift"></sl-icon>`;
    } else if (key === 'Tab') {
      return html`<sl-icon name="indent"></sl-icon>`;
    }

    return key;
  }

  renderKeys(): TemplateResult {
    return KeyboardShortcut.renderKeysStatic(this.keys);
  }

  renderTitleCommand(): TemplateResult {
    return html`
      <div class="title-command">
        <label>${this.title}</label>
        <small>${this.command}</small>
      </div>
    `;
  }

  static renderKeysStatic(keys: KeyboardEventKey[][]): TemplateResult {
    return html`
      <div class="keybindings">
        ${keys.map((key, i: number) => {
          let lastText =
            (i !== keys.length - 1) === false && key.length > 0 === false
              ? 'chord to'
              : '';

          if (key.length === 0) {
            return html``;
          }

          return html`<span class="keybinding"
              >${key.map((k: KeyboardEventKey, i: number) => {
                let value = KeyboardShortcut.PrintKey(k);

                return i !== key.length - 1
                  ? html`<span>${value}+</span>`
                  : html`<span>${value}</span>`;
              })}</span
            >
            <p>${lastText}</p>`;
        })}
      </div>
    `;
  }
  updateKeys(keys: KeyboardEventKey[][]): KeyboardShortcut {
    this.keys = keys;
    return this;
  }

  static fromJSON(json: KeyboardShortcut): KeyboardShortcut {
    return new KeyboardShortcut(
      json.command,
      json.keys,
      json.when as When[],
      new Source(json.source.name, json.source.link),
      json.description,
      json.title,
      json.shouldAppearInCommandPalette,
      json?.id
    );
  }
}

const ACTIVE_ELEMENT_KEY = 'active-element-key';
export interface ActiveElement {
  id: string;
  when: When[];
  subId: string;
}

export class ActiveElementState {
  static async GetActiveElement(): Promise<ActiveElement | null> {
    const activeElement =
      localforage.getItem<ActiveElement>(ACTIVE_ELEMENT_KEY);

    return activeElement;
  }

  static async InitializeActiveElement(
    defaultActiveElement: ActiveElement
  ): Promise<ActiveElement | null> {
    const savedActiveElement =
      await localforage.getItem<ActiveElement>(ACTIVE_ELEMENT_KEY);

    if (!savedActiveElement) {
      localforage.setItem<ActiveElement>(
        ACTIVE_ELEMENT_KEY,
        defaultActiveElement
      );
      return defaultActiveElement;
    }

    return savedActiveElement;
  }

  static async SetActiveElement(activeElement: ActiveElement) {
    localforage.setItem<ActiveElement>(ACTIVE_ELEMENT_KEY, activeElement);
  }
}
