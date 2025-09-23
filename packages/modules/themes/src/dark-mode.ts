import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ColorMode } from './theme-switcher-element';
import { Bag, BagManager, CreateBagManager } from '@pb33f/saddlebag';
import { DarkModeKey, DarkModeSingleton } from './dark-mode-state';
import { ColorPalette, ColorPalettesSingleton } from './stateful';
import baseCss from '@serranolabs.io/shared/base';
import shortcuts from './shortcuts.json';

@customElement('dark-mode')
export class DarkMode extends LitElement {
  static styles = [
    css`
      sl-icon-button {
        font-size: 28px;
      }
      sl-icon-button::part(base) {
        padding: 0;
        padding-right: var(--spacingSmall);
      }
      :host {
        display: flex;
        align-items: center;
      }

      .daemon {
        font-size: 16px;
        color: var(--slate-300);
      }
    `,
    baseCss,
  ];

  @property({ type: Boolean })
  daemon: boolean = false;

  @state()
  bagManager!: BagManager;

  @state()
  bag!: Bag<ColorMode>;

  @property()
  colorMode!: ColorMode;

  @state()
  appliedMode: boolean = true;

  constructor(daemon: boolean) {
    super();

    this.bagManager = CreateBagManager(true);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.onchange = this.onMediaChange.bind(this);
    this.bag = DarkModeSingleton.InitializeModeInBag(this.bagManager, media);

    this.colorMode = this.bag.get(DarkModeKey)!;
    this.bag.onAllChanges(this.onChange.bind(this));

    // this is so gay
    setTimeout(() => {
      if (!this.appliedMode) return;

      this.applySelectedPallete();
      this.appliedMode = false;
    }, 100);
  }

  connectedCallback(): void {
    super.connectedCallback();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
  }

  applySelectedPallete() {
    const selectedPalette = ColorPalettesSingleton.GetSelectedColorPalette(this.bagManager);

    ColorPalette.ApplyMode(selectedPalette, this.colorMode, true);
    ColorPalette.SelectColorPalette(selectedPalette, this.colorMode);
  }

  private onMediaChange(e: MediaQueryListEvent) {
    const matches = e.matches;
    if (matches) {
      this.colorMode = 'Dark';
    } else {
      this.colorMode = 'Light';
    }

    DarkModeSingleton.SetAppliedMode(this.colorMode);
  }

  switchColorMode() {
    DarkModeSingleton.SwitchMode();

    this.requestUpdate();
  }

  static GetColorMode(): ColorMode {
    const bagManager = CreateBagManager(true);
    const bag = bagManager.getBag<ColorMode>(DarkModeKey)!;

    return bag.get(DarkModeKey)! as ColorMode;
  }

  onChange(key: string, value: ColorMode | undefined) {
    if (key === DarkModeKey) {
      this.colorMode = value as ColorMode;
      DarkMode.SetIconFromColorMode(this.colorMode);
    }
  }

  static SetIconFromColorMode(colorMode: ColorMode): 'moon' | 'sun' {
    return colorMode === 'Light' ? 'moon' : 'sun';
  }

  render() {
    return html`
      <sl-icon-button
        class="${this.daemon ? 'daemon' : ''}"
        name=${DarkMode.SetIconFromColorMode(this.colorMode)}
        @click=${this.switchColorMode}
      >
      </sl-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dark-mode': DarkMode;
  }
}
