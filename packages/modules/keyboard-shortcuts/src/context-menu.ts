import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  CONTEXT_MENU_EVENT,
  CONTEXT_MENU_STATE_DEFAULTS,
  ContextMenuState,
} from './keyboard-shortcuts';
import { styleMap } from 'lit/directives/style-map.js';
import {
  KeyboardShortcut,
  Source,
} from '@serranolabs.io/shared/keyboard-shortcuts';
import { SlSelect } from '@shoelace-style/shoelace';
import { sendEvent } from '@serranolabs.io/shared/util';
import { KeyboardShortcutsState } from './state';
import { BagManager, CreateBagManager } from '@pb33f/saddlebag';
import {
  Config,
  SEND_CONFIG_EVENT,
  SEND_CONFIG_EVENT_TYPE,
} from '@serranolabs.io/shared/extension-marketplace';

type MenuOptionType =
  | 'copy-all'
  | 'copy-id'
  | 'copy-title'
  | 'remove-keybinding'
  | 'reset-keybinding'
  | 'share-keybinding';

class MenuItem {
  value: MenuOptionType;
  name: string;

  constructor(value: MenuOptionType, name: string) {
    this.value = value;
    this.name = name;
  }
}

const copyAll = new MenuItem('copy-all', 'Copy');
const copyCommandId = new MenuItem('copy-id', 'Copy Command Id');
const copyCommandTitle = new MenuItem('copy-title', 'Copy Command Title');
const removeKeybinding = new MenuItem('remove-keybinding', 'Remove Keybinding');
const resetKeybinding = new MenuItem('reset-keybinding', 'Reset Keybinding');
const shareKeybinding = new MenuItem('share-keybinding', 'Share Keybinding');
const menuItems: MenuItem[] = [
  copyAll,
  copyCommandId,
  copyCommandTitle,
  removeKeybinding,
  resetKeybinding,
  shareKeybinding,
];

@customElement('context-menu')
export class ContextMenu extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
        position: absolute;
        z-index: 99;
      }
    `,
  ];

  @property()
  contextMenuState: ContextMenuState = CONTEXT_MENU_STATE_DEFAULTS;

  @state()
  rect!: DOMRect;

  @property()
  bagManager!: BagManager;

  @property()
  source!: Source;

  constructor() {
    super();
  }
  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.rect = this.getBoundingClientRect();
  }

  private _extractKeys(
    keys: (keyof KeyboardShortcut)[],
    indexValue: boolean
  ): string {
    const ks = this.contextMenuState.keyboardShortcut;

    if (!ks) {
      return '{}';
    }

    if (indexValue) {
      return JSON.stringify(ks[keys[0]]);
    }

    const extracted: Partial<keyof KeyboardShortcut> = {};

    keys.forEach((key) => {
      if (key in ks) {
        extracted[key] = ks[key];
      }
    });

    return JSON.stringify(extracted);
  }

  private _handleCopyKeys(
    keys: (keyof KeyboardShortcut)[],
    indexValue = false
  ) {
    const newShortcut = this._extractKeys(keys, indexValue);

    navigator.clipboard.writeText(newShortcut).catch((err) => {
      console.error('Failed to copy to clipboard: ', err);
    });
  }

  private _handleRemoveKeybinding() {
    if (!this.contextMenuState.keyboardShortcut) {
      return;
    }
    this.contextMenuState.keyboardShortcut.keys = [];

    KeyboardShortcutsState.updateShortcut(
      this.bagManager,
      this.contextMenuState.keyboardShortcut
    );
  }

  private _handleResetKeybinding() {
    const defaultShortcut = KeyboardShortcutsState.defaults.find(
      (shortcut: KeyboardShortcut) =>
        shortcut.command === this.contextMenuState.keyboardShortcut?.command
    );

    if (!defaultShortcut || !this.contextMenuState.keyboardShortcut) {
      return;
    }

    this.contextMenuState.keyboardShortcut.keys = defaultShortcut.keys;
    KeyboardShortcutsState.updateShortcut(
      this.bagManager,
      this.contextMenuState.keyboardShortcut
    );
    sendEvent(this, CONTEXT_MENU_EVENT);
  }

  private _shareKeybinding(command: string) {
    let c: Partial<KeyboardShortcut> = JSON.parse(command);

    const payload: Config<Partial<KeyboardShortcut>> = new Config(
      this.source,
      [c],
      ''
    );

    sendEvent<SEND_CONFIG_EVENT_TYPE<Partial<KeyboardShortcut>>>(
      this,
      SEND_CONFIG_EVENT,
      {
        config: payload,
      }
    );
  }

  private _handleSelectMenuItem(e: SlSelect) {
    const menuOptionType: MenuOptionType = e.detail.item.value;
    if (menuOptionType === 'copy-all') {
      this._handleCopyKeys(['title', 'command', 'when', 'keys'], false);
    } else if (menuOptionType === 'copy-id') {
      this._handleCopyKeys(['command'], true);
    } else if (menuOptionType === 'copy-title') {
      this._handleCopyKeys(['title'], true);
    } else if (menuOptionType === 'remove-keybinding') {
      this._handleRemoveKeybinding();
    } else if (menuOptionType === 'reset-keybinding') {
      this._handleResetKeybinding();
    } else if (menuOptionType === 'share-keybinding') {
      this._shareKeybinding(
        this._extractKeys(['title', 'command', 'when', 'keys'], false)
      );
    }

    this.contextMenuState.isOpened = false;
    this.requestUpdate();
  }

  private _createContextMenuStyles() {
    let styles: Record<string, string> = {
      display: `${this.contextMenuState.isOpened ? 'block' : 'none'}`,
      'max-width': 'fit-content',
    };
    if (!this.rect || !this.contextMenuState.coords) {
      return styleMap(styles);
    }

    styles = {
      ...styles,
      left: `${this.contextMenuState.coords?.x - this.rect.left}px`,
      top: `${this.contextMenuState.coords?.y - this.rect.top}px`,
    };

    return styleMap(styles);
  }

  render() {
    return html`
      <sl-menu
        style="${this._createContextMenuStyles()}"
        @sl-select=${this._handleSelectMenuItem.bind(this)}
      >
        ${menuItems.map((menuItem: MenuItem) => {
          return html`
            ${menuItem.value === 'remove-keybinding'
              ? html`<sl-divider></sl-divider>`
              : ''}
            <sl-menu-item value=${menuItem.value}>
              ${menuItem.name}
            </sl-menu-item>
          `;
        })}
      </sl-menu>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'context-menu': ContextMenu;
  }
}
