import { html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ModuleConfig } from '@serranolabs.io/shared/module';

import {
  BookeraModuleElement,
  moduleElementStyles,
} from '@serranolabs.io/shared/module-element';

import baseCss from '@serranolabs.io/shared/base';
import '@serranolabs.io/editor';

@customElement('scratchpad-element')
export class ScratchpadElement extends BookeraModuleElement {
  static styles = [baseCss, moduleElementStyles];

  constructor(config: ModuleConfig) {
    super(config);
  }

  protected renderInSidePanel(): TemplateResult {
    return html`
      ${this.renderSidePanelTitleSection()}
      <generic-text-window-element
        title="Scratchpad"
        description="Quick notes and temporary text"
      ></generic-text-window-element>
    `;
  }

  protected renderInSettings(): TemplateResult {
    return html`
      ${this.renderTitleSection()}
      <generic-text-window-element
        title="Scratchpad"
        description="Quick notes and temporary text"
      ></generic-text-window-element>
    `;
  }

  protected renderInModuleDaemon(): TemplateResult {
    return html`<sl-icon name="file-text"></sl-icon>`;
  }

  protected renderInPanel(): TemplateResult {
    return html`
      <generic-text-window-element
        title="Scratchpad"
        description="Quick notes and temporary text"
      ></generic-text-window-element>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scratchpad-element': ScratchpadElement;
  }
}
