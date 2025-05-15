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
  Keybinding,
  KeyboardEventKey,
  modifierKeys,
  ModifierKeys,
} from '@serranolabs.io/shared/keyboard-shortcuts';

const KEYBINDINGS_INPUT_ID = 'keybindings-input';

export const handleKeyPress = (
  allKeyPressSets: KeyboardEventKey[][],
  keyPressSet: KeyboardEventKey[],
  isModifierPressed: ModifierKeys | null,
  nextKey: KeyboardEventKey
): {
  allKeyPressSets: KeyboardEventKey[][];
  keyPressSet: KeyboardEventKey[];
  isModifierPressed: ModifierKeys | null;
} => {
  if (modifierKeys.includes(nextKey as ModifierKeys)) {
    isModifierPressed = nextKey as ModifierKeys;
  }

  if (isModifierPressed) {
    keyPressSet.push(nextKey);
  } else {
    allKeyPressSets.push([nextKey]);
  }
  return {
    allKeyPressSets,
    keyPressSet,
    isModifierPressed,
  };
};

export const handleKeyUp = (
  allKeyPressSets: KeyboardEventKey[][],
  keyPressSet: KeyboardEventKey[],
  isModifierPressed: ModifierKeys | null,
  nextKey: KeyboardEventKey
): {
  allKeyPressSets: KeyboardEventKey[][];
  keyPressSet: KeyboardEventKey[];
  isModifierPressed: ModifierKeys | null;
  isModifierReleased: boolean;
} => {
  let isModifierReleased = false;
  if (nextKey === isModifierPressed) {
    isModifierPressed = null;
    if (keyPressSet.length > 0) {
      allKeyPressSets.push(keyPressSet);
      keyPressSet = [];
      isModifierReleased = true;
    }
  }
  return {
    allKeyPressSets,
    keyPressSet,
    isModifierPressed,
    isModifierReleased,
  };
};

export const calculateValue = (
  allKeyPressSets: KeyboardEventKey[][],
  keyPressSet: KeyboardEventKey[]
): KeyboardEventKey => {
  return (allKeyPressSets.flatMap((x) => x).join('') +
    keyPressSet.join('')) as KeyboardEventKey;
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

  @state()
  isModifierPressed: ModifierKeys | null = null;

  private _keyPressSet: KeyboardEventKey[] = [];

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
            .value="${calculateValue(this._allKeyPressSets, this._keyPressSet)}"
            @blur="${() => field.handleBlur()}"
            @keyup="${(e: KeyboardEvent) => {
              const {
                allKeyPressSets,
                keyPressSet,
                isModifierPressed,
                isModifierReleased,
              } = handleKeyUp(
                this._allKeyPressSets,
                this._keyPressSet,
                this.isModifierPressed,
                e.key as KeyboardEventKey
              );
              this._allKeyPressSets = allKeyPressSets;
              this._keyPressSet = keyPressSet;
              this.isModifierPressed = isModifierPressed;
              if (isModifierReleased) {
                field.handleChange(
                  calculateValue(this._allKeyPressSets, this._keyPressSet)
                );
              }
            }}"
            @keydown="${(e: KeyboardEvent) => {
              const nextKey = e.key as KeyboardEventKey;
              if (nextKey === 'Enter') {
                field.form.handleSubmit();
                return;
              }

              if (this._allKeyPressSets.length >= SHORTCUT_MAX_LENGTH) {
                field.handleChange('' as KeyboardEventKey);
                this._allKeyPressSets = [];
              }

              const { allKeyPressSets, keyPressSet, isModifierPressed } =
                handleKeyPress(
                  this._allKeyPressSets,
                  this._keyPressSet,
                  this.isModifierPressed,
                  nextKey
                );
              this._allKeyPressSets = allKeyPressSets;
              this._keyPressSet = keyPressSet;
              this.isModifierPressed = isModifierPressed;

              this.requestUpdate();

              field.handleChange(
                calculateValue(this._allKeyPressSets, this._keyPressSet)
              );

              e.preventDefault();
            }}"
          ></sl-input>
          <div class="input-box">
            ${field.state.value.length > 0
              ? html`<sl-icon name="check2"></sl-icon>`
              : html`<sl-icon name="x"></sl-icon>`}
            ${new Keybinding([
              ...this._allKeyPressSets,
              this._keyPressSet,
            ]).render()}
          </div>
        </div>`;
      }
    );
  }

  private async _submitForm(): Promise<void> {
    sendEvent<Keybinding>(
      this,
      SUBMIT_FORM_EVENT,
      new Keybinding(this._allKeyPressSets)
    );
    this.assignKeybindingDialogState = ASSIGN_KEYBINDING_DIALOG_DEFAULTS;
    this.keybindingsInput.value = '';
    this._allKeyPressSets = [];

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
