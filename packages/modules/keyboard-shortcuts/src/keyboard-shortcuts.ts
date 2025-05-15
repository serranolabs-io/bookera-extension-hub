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
} from '@serranolabs.io/shared/keyboard-shortcuts';

import {
  doesClickContainElement,
  sendEvent,
} from '@serranolabs.io/shared/util';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/icon/icon.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/icon-button/icon-button.js';
import { KeyboardShortcutsState } from './state';
import type { Bag } from '@pb33f/saddlebag';
import { NEW_PANEL_EVENT, PanelTab } from '@serranolabs.io/shared/panel';
import { calculateValue, handleKeyPress, handleKeyUp } from './formwrapper';

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
  private _keyboardShortcuts: KeyboardShortcut[] = [];

  @state()
  assignKeybindingDialogState: AssignKeybindingDialog =
    ASSIGN_KEYBINDING_DIALOG_DEFAULTS;

  @state()
  private _shortcutsBag!: Bag<KeyboardShortcut>;

  @state()
  isModifierPressed: ModifierKeys | null = null;

  private _keyPressSet: KeyboardEventKey[] = [];

  private _allKeyPressSets: KeyboardEventKey[][] = [];

  constructor(
    renderMode: RenderMode,
    module: BookeraModule,
    _panelTabId: string
  ) {
    super(renderMode, module, _panelTabId);

    this._keyboardShortcuts = [];

    if (this.renderMode === 'renderInDaemon') {
      this._createHandleInDaemonListeners();
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

  private _detectShortcut() {
    const allSets = [...this._allKeyPressSets, this._keyPressSet];
    this._keyboardShortcuts.forEach((shortcut: KeyboardShortcut) => {
      allSets.every((set: KeyboardEventKey[]) => {
        console.log(shortcut, set);
      });
    });
  }
  private _registerKeydownListener(e: KeyboardEvent) {
    const nextKey = e.key as KeyboardEventKey;
    const { allKeyPressSets, keyPressSet, isModifierPressed } = handleKeyPress(
      this._allKeyPressSets,
      this._keyPressSet,
      this.isModifierPressed,
      nextKey
    );
    this._allKeyPressSets = allKeyPressSets;
    this._keyPressSet = keyPressSet;
    this.isModifierPressed = isModifierPressed;
    if (this._allKeyPressSets.length > SHORTCUT_MAX_LENGTH) {
      this._allKeyPressSets = [];
    }
    this.requestUpdate();

    this._detectShortcut();
  }
  private _registerKeyupListener(e: KeyboardEvent) {
    const { allKeyPressSets, keyPressSet, isModifierPressed } = handleKeyUp(
      this._allKeyPressSets,
      this._keyPressSet,
      this.isModifierPressed,
      e.key as KeyboardEventKey
    );
    this._allKeyPressSets = allKeyPressSets;
    this._keyPressSet = keyPressSet;
    this.isModifierPressed = isModifierPressed;
    this.requestUpdate();
  }
  private _createHandleInDaemonListeners() {
    document.addEventListener(
      'keydown',
      this._registerKeydownListener.bind(this)
    );

    document.addEventListener('keyup', this._registerKeyupListener.bind(this));
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

  private _listToAssignNewKeysEvent(e: CustomEvent<Keybinding>) {
    if (this.assignKeybindingDialogState.index === -1) {
      return;
    }

    const updatedShortcut =
      this._keyboardShortcuts[this.assignKeybindingDialogState.index];

    updatedShortcut.keybinding = e.detail;

    KeyboardShortcutsState.updateShortcut(this._bagManager, updatedShortcut);

    this.assignKeybindingDialogState = ASSIGN_KEYBINDING_DIALOG_DEFAULTS;
    this.requestUpdate();
  }

  protected renderInModuleDaemon(): TemplateResult {
    return html`
      <div class="daemon">
        <div class="context">
          <small>context</small>
        </div>
        <div>
          <small class="keys">
            ${calculateValue(this._allKeyPressSets, this._keyPressSet)}
          </small>
        </div>
      </div>
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
            (shortcut, index: number) => html`
              <tr data-index=${index} data-command="${shortcut.id}">
                <td>
                  <sl-icon class="edit-icon" name="pencil"></sl-icon>
                  ${shortcut.command}
                </td>
                <td>
                  <div class="center-v">${shortcut.keybinding.render()}</div>
                </td>
                <td>${shortcut.when.condition.join(', ')}</td>
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
