import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import {
  BookeraModuleElement,
  moduleElementStyles,
} from '@serranolabs.io/shared/module-element';
import { BookeraModule, type RenderMode } from '@serranolabs.io/shared/module';
import './formwrapper';
import keyboardShortcutsStyle from './keyboard-shortcuts.style';
import baseCss from '@serranolabs.io/shared/base';
import {
  Keybinding,
  KeyboardEventKey,
  KeyboardShortcut,
  ModifierKeys,
  When,
} from '@serranolabs.io/shared/keyboard-shortcuts';

import {
  doesClickContainElement,
  sendEvent,
} from '@serranolabs.io/shared/util';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/icon/icon.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/icon-button/icon-button.js';
import { KeyboardShortcutsState } from './state';
import type { Bag } from '@pb33f/saddlebag';
import {
  NEW_PANEL_EVENT,
  NewPanelEventType,
  PanelTab,
} from '@serranolabs.io/shared/panel';
import { calculateValue, handleKeyPress, handleKeyUp } from './formwrapper';
import { createHandleInDaemonListeners } from './handle-keyboard-shortcut';

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

export const SHORTCUT_MAX_LENGTH = 2;

export const SUBMIT_FORM_EVENT = 'submit-form-event-key';

@customElement(elementName)
export class KeyboardShortcutsElement extends BookeraModuleElement {
  static styles = [keyboardShortcutsStyle, moduleElementStyles, baseCss];

  @state()
  protected _keyboardShortcuts: KeyboardShortcut[] = [];

  @state()
  assignKeybindingDialogState: AssignKeybindingDialog =
    ASSIGN_KEYBINDING_DIALOG_DEFAULTS;

  @state()
  private _shortcutsBag!: Bag<KeyboardShortcut>;

  @state()
  isModifierPressed: ModifierKeys | null = null;

  protected _keyPressSet: KeyboardEventKey[] = [];

  protected _allKeyPressSets: KeyboardEventKey[][] = [];

  protected _commandsRan: string[] = [];

  protected _context: When[] = [];

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
    }

    this._setupState();
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
        ${this._context.map((when: When) => {
          return html`<small>${when}</small>`;
        })}
      </div>
    `;
  }

  protected _renderKeyPressesInModuleDaemon() {
    const value = calculateValue(this._allKeyPressSets, this._keyPressSet);
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

  protected _renderCommandsInModuleDaemon() {
    if (this._commandsRan.length === 0) {
      return html``;
    }

    return html`
        <div class="commands">
            <small class="label">command</small>
          ${this._commandsRan.map((command: string) => {
            setTimeout(() => {
              this._commandsRan = [];
            }, 200);

            return html`<small>${command}</small>`;
          })}
          </div>
        </div>
    `;
  }

  protected renderInModuleDaemon(): TemplateResult {
    return html`
      ${this._renderContextInModuleDaemon()}
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
      <formwrapper-element
        .assignKeybindingDialogState=${this.assignKeybindingDialogState}
      ></formwrapper-element>
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
        >
          ${this._keyboardShortcuts.map(
            (shortcut: KeyboardShortcut, index: number) => html`
              <tr
                data-index=${index}
                data-command="${shortcut.id}"
                tabindex="0"
              >
                <td>
                  <div class="flex command-title">
                    <sl-icon class="edit-icon" name="pencil"></sl-icon>
                    <span> ${shortcut.command} </span>
                    <span>
                      <sl-tooltip content="${shortcut.description}">
                        ?
                      </sl-tooltip>
                    </span>
                  </div>
                </td>
                <td>
                  <div class="center-v">${shortcut.renderKeys()}</div>
                </td>
                <td>${shortcut.when.join(', ')}</td>
                <td>
                  ${shortcut.source.link
                    ? html`<a href="${shortcut.source.link}" target="_blank"
                        >${shortcut.source.name}</a
                      >`
                    : shortcut.source.name}
                </td>
              </tr>
            `
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
