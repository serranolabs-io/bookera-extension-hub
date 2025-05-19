import { FieldApi, TanStackFormController } from '@tanstack/lit-form';
import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/dialog/dialog.js';
import baseCss from '@serranolabs.io/shared/base';
import {
  ASSIGN_KEYBINDING_DIALOG_DEFAULTS,
  SHORTCUT_MAX_LENGTH,
  SUBMIT_FORM_EVENT,
  type AssignKeybindingDialog,
} from './keyboard-shortcuts';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/input/input.js';
import { sendEvent } from '@serranolabs.io/shared/util';
import {
  KeyboardEventKey,
  KeyboardShortcut,
  modifierKeys,
  ModifierKeys,
} from '@serranolabs.io/shared/keyboard-shortcuts';

const KEYBINDINGS_INPUT_ID = 'keybindings-input';

export const handleKeyDownAndSubmit = (
  e: KeyboardEvent,
  allKeyPressSets: KeyboardEventKey[][],
  modifiers: KeyboardEventKey[]
): {
  shouldSubmit: boolean;
  allKeyPressSets: KeyboardEventKey[][];
  modifiers: KeyboardEventKey[];
} => {
  const nextKey = e.key as KeyboardEventKey;

  if (e.altKey && !modifiers.includes('Alt')) {
    modifiers.push('Alt');
  }
  if (e.ctrlKey && !modifiers.includes('Control')) {
    modifiers.push('Control');
  }

  if (e.shiftKey && !modifiers.includes('Shift')) {
    modifiers.push('Shift');
  }
  if (e.metaKey && !modifiers.includes('Meta')) {
    modifiers.push('Meta');
  }

  if (nextKey === 'Enter' && modifiers.length === 0) {
    return { shouldSubmit: true, allKeyPressSets, modifiers };
  }

  if (!modifierKeys.includes(nextKey as ModifierKeys)) {
    allKeyPressSets.push([...(modifiers as KeyboardEventKey[]), nextKey]);
    modifiers = [];
  }
  return { shouldSubmit: false, allKeyPressSets, modifiers };
};

export const calculateValue = (
  allKeyPressSets: KeyboardEventKey[][],
  modifiers: KeyboardEventKey[]
): KeyboardEventKey => {
  const value = (modifiers.join('') +
    allKeyPressSets
      .flatMap((keyPressSet) => {
        return keyPressSet.join('');
      })
      .join('')) as KeyboardEventKey;

  return value;
};

@customElement('formwrapper-element')
export class Formwrapper extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }
      sl-dialog::part(title) {
      }
      sl-dialog {
        --width: 36rem;
      }
      .input-box {
        display: flex;
        justify-content: start;
        align-items: center;
        height: 2rem;
      }

      .keybinding {
        background-color: var(--slate-200);
        padding: var(--spacingXXSmall);
        border-radius: var(--borderRadius);
        display: flex;
      }

      .keybindings {
        display: flex;
        gap: var(--spacingXXSmall);
        align-items: center;
      }

      span {
        display: flex;
        align-items: center;
      }
    `,
    baseCss,
  ];

  @property()
  keybindingsInput!: HTMLInputElement;

  @state()
  assignKeybindingDialogState: AssignKeybindingDialog =
    ASSIGN_KEYBINDING_DIALOG_DEFAULTS;

  private _modifiers: KeyboardEventKey[] = [];

  private _allKeyPressSets: KeyboardEventKey[][] = [];

  #form = new TanStackFormController(this, {
    defaultValues: {
      keybindings: '' as KeyboardEventKey,
    },
  });

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.keybindingsInput = this.shadowRoot?.querySelector(
      `#${KEYBINDINGS_INPUT_ID}`
    )!;
  }

  private _renderKeysStatic() {
    return KeyboardShortcut.renderKeysStatic(
      [this._modifiers, ...this._allKeyPressSets].filter(
        (kek: KeyboardEventKey[]) => {
          return kek.length > 0;
        }
      )
    );
  }

  // behavior 1: - given the
  private _renderForm() {
    return this.#form.field(
      {
        name: `keybindings`,
      },
      (field) => {
        return html` <div>
          <sl-input
            type="text"
            placeholder="First Name"
            id=${KEYBINDINGS_INPUT_ID}
            .value="${calculateValue(this._allKeyPressSets, this._modifiers)}"
            @blur="${() => field.handleBlur()}"
            @keydown="${(e: KeyboardEvent) => {
              const { shouldSubmit, allKeyPressSets, modifiers } =
                handleKeyDownAndSubmit(
                  e,
                  this._allKeyPressSets,
                  this._modifiers
                );
              this._allKeyPressSets = allKeyPressSets;
              if (shouldSubmit) {
                field.form.handleSubmit();
                return;
              }
              this._modifiers = modifiers;

              field.handleChange(
                calculateValue(this._allKeyPressSets, this._modifiers)
              );

              e.preventDefault();
            }}"
          ></sl-input>
          <div class="input-box">
            ${field.state.value.length > 0
              ? html`<sl-icon name="check2"></sl-icon>`
              : html`<sl-icon name="x"></sl-icon>`}
            ${this._renderKeysStatic()}
          </div>
        </div>`;
      }
    );
  }

  private async _submitForm(): Promise<void> {
    sendEvent<KeyboardEventKey[][]>(
      this,
      SUBMIT_FORM_EVENT,
      this._allKeyPressSets
    );
    this.assignKeybindingDialogState = ASSIGN_KEYBINDING_DIALOG_DEFAULTS;
    this.keybindingsInput.value = '';
    this._allKeyPressSets = [];
    this._modifiers = [];

    return Promise.resolve();
  }

  render() {
    this.#form.api.handleSubmit = this._submitForm.bind(this);

    return html`
      <sl-dialog
        id="keybinding-dialog"
        label=""
        @sl-after-show=${(e: Event) => {
          this.keybindingsInput.focus();
        }}
        ?open="${this.assignKeybindingDialogState.isOpened}"
      >
        <h2 class="lead" slot="label">
          Press desired keybinding combination and press ENTER
        </h2>
        <form
          @submit=${(e: SubmitEvent) => {
            e.preventDefault();
          }}
        >
          ${this._renderForm()}
        </form>
      </sl-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'formwrapper-element': Formwrapper;
  }
}
