import { genShortID } from '../util';
import type { KeyboardEventKey } from './keyboard-event-key-type';
import { html, type TemplateResult } from 'lit';

export * from './keyboard-event-key-type';

export class Keybinding {
  keys: KeyboardEventKey[][];

  constructor(keys: KeyboardEventKey[][]) {
    this.keys = keys.filter((key: KeyboardEventKey[]) => {
      return key.length > 0;
    });
  }

  private _printKey(key: KeyboardEventKey) {
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

  render(): TemplateResult {
    return html`
      <div class="keybindings">
        ${this.keys.map((key, i: number) => {
          let lastText = i !== this.keys.length - 1 ? 'chord to' : '';

          return html`<span class="keybinding"
              >${key.map((k: string, i: number) => {
                let value = this._printKey(k);

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

  print() {}
}

export class When {
  condition: string[];

  constructor(condition: string[]) {
    this.condition = condition;
  }
}

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
  keybinding: Keybinding;
  when: When;
  source: Source;
  id: string;

  constructor(
    command: string,
    keybinding: Keybinding,
    when: When,
    source: Source,
    id?: string
  ) {
    this.command = command;
    this.keybinding = keybinding;
    this.when = when;
    this.source = source;
    if (id) {
      this.id = id;
    } else {
      this.id = genShortID(10);
    }
  }

  updateKeybinding(keybinding: Keybinding): KeyboardShortcut {
    this.keybinding = keybinding;
    return this;
  }

  static fromJSON(json: any): KeyboardShortcut {
    return new KeyboardShortcut(
      json.command,
      new Keybinding(json.keybinding.keys),
      new When(json.when.condition),
      new Source(json.source.name, json.source.link),
      json?.id
    );
  }
}
