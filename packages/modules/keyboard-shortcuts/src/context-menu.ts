import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('context-menu')
export class ContextMenu extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }
    `,
  ];

  render() {
    return html`
      <sl-menu style="max-width: 200px;">
        <sl-menu-item value="copy">Copy</sl-menu-item>
        <sl-menu-item value="copy">Copy Command Id</sl-menu-item>
        <sl-menu-item value="copy">Copy</sl-menu-item>
        <sl-divider></sl-divider>
      </sl-menu>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'context-menu': ContextMenu;
  }
}
