import { html, type TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import {
  BookeraModuleElement,
  moduleElementStyles,
} from '@serranolabs.io/shared/module-element';
import { BookeraModule, type RenderMode } from '@serranolabs.io/shared/module';
import './formwrapper';
import keyboardShortcutsStyle from './keyboard-shortcuts.style';
import baseCss from '@serranolabs.io/shared/base';
import {
  KeyboardEventKey,
  KeyboardShortcut,
  When,
  studio,
} from '@serranolabs.io/shared/keyboard-shortcuts';

import {
  doesClickContainElement,
  sendEvent,
} from '@serranolabs.io/shared/util';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/icon/icon.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/icon-button/icon-button.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/menu/menu.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/menu-item/menu-item.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/menu-label/menu-label.js';
import './context-menu';

import { KeyboardShortcutsState } from './state';
import type { Bag } from '@pb33f/saddlebag';
import {
  NEW_PANEL_EVENT,
  NewPanelEventType,
  PanelTab,
} from '@serranolabs.io/shared/panel';
import { calculateValue } from './formwrapper';
import {
  createHandleInDaemonListeners,
  openCommandPalette,
} from './handle-keyboard-shortcut';
import { SlDialog, SlInput } from '@shoelace-style/shoelace';
import Fuse, { FuseResult } from 'fuse.js';
import { renderMatches } from './fuse';

export const elementName = 'keyboard-shortcuts-element';

export interface AssignKeybindingDialog {
  isOpened: boolean;
  index: number;
  command: string;
}

export const ASSIGN_KEYBINDING_DIALOG_DEFAULTS = {
  isOpened: false,
  index: -1,
  command: '',
};

interface Coords {
  x: number;
  y: number;
}

export interface ContextMenuState {
  isOpened: boolean;
  keyboardShortcut: KeyboardShortcut | null;
  coords: Coords | null;
}

export const CONTEXT_MENU_STATE_DEFAULTS: ContextMenuState = {
  isOpened: false,
  keyboardShortcut: null,
  coords: null,
};

export const SHORTCUT_MAX_LENGTH = 2;

export const SUBMIT_FORM_EVENT = 'submit-form-event-key';

export const CONTEXT_MENU_EVENT = 'context-menu-event-key';

const COMMAND_PALETTE_DIALOG = 'command-palette-dialog';

@customElement(elementName)
export class KeyboardShortcutsElement extends BookeraModuleElement {
  static styles = [keyboardShortcutsStyle, moduleElementStyles, baseCss];

  @state()
  protected _keyboardShortcuts: KeyboardShortcut[] = [];

  @state()
  assignKeybindingDialogState: AssignKeybindingDialog =
    ASSIGN_KEYBINDING_DIALOG_DEFAULTS;

  protected _contextMenuState: ContextMenuState = CONTEXT_MENU_STATE_DEFAULTS;

  @state()
  private _shortcutsBag!: Bag<KeyboardShortcut>;

  protected _allKeyPressSets: KeyboardEventKey[][] = [];

  protected _commandsRan: string[] = [];

  protected _context: When[] = [];

  protected _modifiers: KeyboardEventKey[] = [];

  protected _isCommandPaletteOpened = false;

  private _shortcutFilters: string = '';

  protected _registerKeydownListener!: Function;
  protected _openCommandPaletteListener!: Function;

  @query(`#${COMMAND_PALETTE_DIALOG}`)
  _commandPaletteDialog!: SlDialog;

  private _listenToEvents() {
    console.log('fuck');
  }

  constructor(
    renderMode: RenderMode,
    module: BookeraModule,
    _panelTabId: string
  ) {
    super(renderMode, module, _panelTabId);

    this._keyboardShortcuts = [];

    if (this.renderMode === 'renderInDaemon') {
      createHandleInDaemonListeners.bind(this)();
    }

    if (
      this.renderMode === 'renderInPanel' ||
      this.renderMode === 'renderInSidePanel'
    ) {
      document.addEventListener('sl-hide', (e) => {
        this.assignKeybindingDialogState = ASSIGN_KEYBINDING_DIALOG_DEFAULTS;
      });

      // @ts-expect-error fuck it
      document.addEventListener(
        SUBMIT_FORM_EVENT,
        this._listToAssignNewKeysEvent.bind(this)
      );

      document.addEventListener(
        CONTEXT_MENU_EVENT,
        this._listenToContextMenuEvent.bind(this)
      );
    }

    this._setupState();
  }

  disconnectedCallback(): void {
    // @ts-ignore
    document.removeEventListener('keydown', this._registerKeydownListener);
    // @ts-ignore
    document.removeEventListener('keydown', this._openCommandPaletteListener);
  }

  private _listenToContextMenuEvent() {
    this.requestUpdate();
  }

  private async _setupState() {
    if (!this._bagManager) {
      return;
    }

    this._shortcutsBag = await KeyboardShortcutsState.initializeShortcutsInBag(
      this._bagManager
    );

    this._keyboardShortcuts = Array.from(
      this._shortcutsBag.export().values()
    ).map((shortcut: KeyboardShortcut) => KeyboardShortcut.fromJSON(shortcut));

    this._shortcutsBag.onAllChanges(this._listenToAllChanges.bind(this));
  }

  private _listenToAllChanges(changed: string) {
    const changedCommand = KeyboardShortcut.fromJSON(
      this._shortcutsBag.get(changed)!
    );

    for (let i = 0; i < this._keyboardShortcuts.length; i++) {
      if (this._keyboardShortcuts[i].id === changedCommand.id) {
        this._keyboardShortcuts[i] = changedCommand;
      }
    }

    this.requestUpdate();
  }

  private _listToAssignNewKeysEvent(e: CustomEvent<KeyboardEventKey[][]>) {
    if (this.assignKeybindingDialogState.index === -1) {
      return;
    }

    const updatedShortcut =
      this._keyboardShortcuts[this.assignKeybindingDialogState.index];

    updatedShortcut.keys = e.detail;

    KeyboardShortcutsState.updateShortcut(this._bagManager, updatedShortcut);

    this.assignKeybindingDialogState = ASSIGN_KEYBINDING_DIALOG_DEFAULTS;
    this.requestUpdate();
  }

  protected _renderContextInModuleDaemon() {
    if (this._context.length === 0) {
      return html``;
    }

    return html`
      <div class="context">
        <small class="label">context</small>
        ${this._context.map((when: When, i: number) => {
          return html`<small>${when}</small> ${i !== this._context.length - 1
              ? '&'
              : ''} `;
        })}
      </div>
    `;
  }

  protected _renderKeyPressesInModuleDaemon() {
    const value = calculateValue(this._allKeyPressSets, this._modifiers);

    if (value.length === 0) {
      return html``;
    }

    return html`
      <div>
        <small class="label">keys</small>
        <small class="keys"> ${value} </small>
      </div>
    `;
  }

  private _renderMatches():
    | FuseResult<KeyboardShortcut>[]
    | KeyboardShortcut[] {
    const matches = renderMatches(
      this._filterCommandPalette(false),
      ['keys', 'command', 'title'],
      this._shortcutFilters
    );

    if (matches.length !== 0) {
      return matches;
    }

    return this._keyboardShortcuts;
  }

  private _selectCommand(e: CustomEvent) {
    const value: string = e.detail.item.value;

    const shortcut = this._keyboardShortcuts.find(
      (shortcut: KeyboardShortcut) => {
        return shortcut.id === value;
      }
    )!;

    sendEvent(this, shortcut?.command);
  }

  private _filterCommandPalette(
    applyFilter: boolean = true
  ): KeyboardShortcut[] {
    return this._keyboardShortcuts.filter((shortcut: KeyboardShortcut) => {
      if (applyFilter) {
        return true;
      }

      return shortcut.shouldAppearInCommandPalette === 'true';
    });
  }

  private _renderCommandPalette() {
    return html`
        <sl-dialog id=${COMMAND_PALETTE_DIALOG}>
        <sl-input autofocus @sl-input=${(e: CustomEvent) => {
          // @ts-ignore
          this._shortcutFilters = e.target.value;
          e.preventDefault();
        }}></sl-input>
        <sl-menu class="command-palette-menu" @sl-select=${this._selectCommand.bind(this)}>
          ${this._renderMatches().map(
            (match: FuseResult<KeyboardShortcut> | KeyboardShortcut) => {
              if ('item' in match) {
                return html`<sl-menu-item value=${match.item.id}
                  >${match.item.renderTitleCommand()}
                  <p slot="suffix">${match.item.renderKeys()}</p></sl-menu-item
                >`;
              }
              return html`<sl-menu-item value=${match.id}
                >${match.renderTitleCommand()}
                <p slot="suffix">${match.renderKeys()}</p></sl-menu-item
              >`;
            }
          )}
        </sl-dialog>
      </div>
    `;
  }

  protected _renderCommandsInModuleDaemon() {
    if (this._commandsRan.length === 0) {
      return html``;
    }

    return html`
        <div class="commands">
            <small class="label">command</small>
          ${this._commandsRan.map((command: string) => {
            return html`<small>${command}</small>`;
          })}
          </div>
        </div>
    `;
  }

  protected renderInModuleDaemon(): TemplateResult {
    return html`
      ${this._renderCommandPalette()} ${this._renderContextInModuleDaemon()}
      ${this._renderKeyPressesInModuleDaemon()}
      ${this._renderCommandsInModuleDaemon()}
    `;
  }

  private _openKeyboardShortcutsPanel(): TemplateResult {
    return html`
      <sl-button
        @click=${() => {
          sendEvent<NewPanelEventType>(this, NEW_PANEL_EVENT, {
            tab: new PanelTab(this.module.title, 'Module'),
            moduleId: this.module.id,
          });
        }}
        >Open In Panel</sl-button
      >
    `;
  }

  protected renderInSettings(): TemplateResult {
    return html`
      ${this.renderTitleSection()} ${this._openKeyboardShortcutsPanel()}
    `;
  }

  protected renderInSidePanel(): TemplateResult {
    return html``;
  }

  protected renderInPanel(): TemplateResult {
    return html`
      <context-menu
        .bagManager=${this._bagManager}
        .contextMenuState=${this._contextMenuState}
      ></context-menu>
      <formwrapper-element
        .assignKeybindingDialogState=${this.assignKeybindingDialogState}
      ></formwrapper-element>

      <sl-input
        autofocus
        @sl-input=${(e: CustomEvent) => {
          // @ts-ignore
          this._shortcutFilters = e.target.value;
          this.requestUpdate();
        }}
      ></sl-input>
      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Keybinding</th>
            <th>When</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody
          @click=${(e: Event) => {
            const el = doesClickContainElement<HTMLTableRowElement>(e, {
              nodeName: 'TR',
            })!;

            const index = el.dataset.index;

            this.assignKeybindingDialogState = {
              isOpened: true,
              index: Number(index),
              command: el.dataset.id!,
            };

            this.requestUpdate();
          }}
          @contextmenu=${(e: PointerEvent) => {
            e.preventDefault();
            const el = doesClickContainElement<HTMLTableRowElement>(e, {
              nodeName: 'TR',
            })!;

            const index: number = Number(el.dataset.index);
            if (index !== 0 && !index) {
              return;
            }
            const shortcut = this._keyboardShortcuts[index];

            this._contextMenuState = {
              isOpened: true,
              keyboardShortcut: shortcut,
              coords: { x: e.x, y: e.y },
            };
            this.requestUpdate();
          }}
        >
          ${this._renderMatches()?.map(
            (
              shortcut: FuseResult<KeyboardShortcut> | KeyboardShortcut,
              index: number
            ) => {
              if ('item' in shortcut) {
                shortcut = shortcut.item;
              }

              return html`
                <tr
                  data-index=${index}
                  data-command="${shortcut.id}"
                  tabindex="0"
                >
                  <td>
                    <div class="flex command-title">
                      <sl-icon class="edit-icon" name="pencil"></sl-icon>
                      ${shortcut.renderTitleCommand()}
                      <span>
                        <sl-tooltip
                          content="${shortcut.description}"
                          hoist
                          style="--sl-tooltip-arrow-size: 0;"
                        >
                          ?
                        </sl-tooltip>
                      </span>
                    </div>
                  </td>
                  <td>
                    <div class="center-v">${shortcut.renderKeys()}</div>
                  </td>
                  <td>${shortcut.when.join(' ')}</td>
                  <td>
                    ${shortcut.source.link
                      ? html`<a href="${shortcut.source.link}" target="_blank"
                          >${shortcut.source.name}</a
                        >`
                      : shortcut.source.name}
                  </td>
                </tr>
              `;
            }
          )}
        </tbody>
      </table>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [elementName]: KeyboardShortcutsElement;
  }
}
