import { genShortID } from '../util';
import type { KeyboardEventKey } from './keyboard-event-key-type';
import { html, type TemplateResult } from 'lit';

export * from './keyboard-event-key-type';

export type Operator = '&&' | '||' | '!' | '(' | ')';
export type PanelTabsFocus = 'panelTabsFocus';
export type PanelFocus = 'panelFocus';

export type When = PanelTabsFocus | PanelFocus | Operator;

export class Source {
  name: string;
  link?: string;

  constructor(name: string, link?: string) {
    this.name = name;
    this.link = link;
  }
}

export class KeyboardShortcut {
  command: string;
  keys: KeyboardEventKey[][];
  when: string[];
  source: Source;
  id: string;

  constructor(
    command: string,
    keys: KeyboardEventKey[][],
    when: When[],
    source: Source,
    id?: string
  ) {
    this.command = command;
    this.keys = keys;
    this.when = when;
    this.source = source;
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

  static renderKeysStatic(keys: KeyboardEventKey[][]): TemplateResult {
    console.log(keys);
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

  static fromJSON(json: any): KeyboardShortcut {
    return new KeyboardShortcut(
      json.command,
      json.keys,
      json.when,
      new Source(json.source.name, json.source.link),
      json?.id
    );
  }
}
