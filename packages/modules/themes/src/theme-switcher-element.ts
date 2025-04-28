import { html, PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import themeSwitcherElementStyles from './theme-switcher-element.styles';

import {
  BaseColor,
  ColorSet,
  ColorSets,
  PrimaryColor,
  baseColorNames,
  primaryColorName,
  shadePercents,
} from './color-sets';

import { SlColorPicker, SlSelect } from '@shoelace-style/shoelace';
import { Bag, BagManager, CreateBagManager } from '@pb33f/saddlebag';
import {
  ColorPalette,
  ColorPalettesKey,
  ColorPalettesSingleton,
  Mode,
  SelectedColorPaletteKey,
} from './stateful';
import {
  enableCreateColorPaletteMode,
  handleCustomPaletteForm,
  handleSelectColorPalette,
  handleSubmitSystemColorPalette,
  selectPrimaryColor,
  selectSystemColor,
  switchCustomPaletteStep,
} from './logic-layer';
import './dark-mode';
import { DarkMode } from './dark-mode';
import { DarkModeKey } from './dark-mode-state';
import baseCss from '@serranolabs.io/shared/base';
import {
  ModuleElement,
  moduleElementStyles,
} from '@serranolabs.io/shared/module/module-element';
import {
  BookeraModule,
  RenderMode,
} from '@serranolabs.io/shared/module/module';
// you need to rethink how dark theme works.
// when applying dark theme, you are swapping the colors. It breaks switching data-themes.

// I think I can get all of the colors in their palettes as code.
// all I have to do is apply the swap version of the Colors

export type ColorMode = 'Light' | 'Dark';

const CustomColorStepMode = {
  LightMode: 'Light mode',
  DarkMode: 'Dark mode',
} as const;

type CustomColorStep = keyof typeof CustomColorStepMode;
// the theme switcher should always have the same ID no matter what, across every single app
// the tab will follow
@customElement('themes-element')
export class ThemesElement extends ModuleElement {
  static styles = [themeSwitcherElementStyles, baseCss, moduleElementStyles];

  @query('#color-selector') colorSelect!: SlSelect;

  @query('#primary-color-picker') primaryColorPicker!: SlColorPicker;

  @property()
  bagManager: BagManager = CreateBagManager(true);

  @property()
  primaryColor: string;

  @state()
  createColorPaletteMode: boolean = false;

  // only consume what I want from the singleton
  @state()
  colorPalettes: ColorPalette[] = [];

  @state()
  systemColorPaletteMode: boolean = false;

  @state()
  colorPalettesBag!: Bag<ColorPalette>;

  @state()
  selectedColorPalette: ColorPalette | null = null;

  @state()
  customPaletteStep: CustomColorStep = 'LightMode';

  @state()
  lightMode!: Mode;

  @state()
  darkMode!: Mode;

  @state()
  darkModeElement!: DarkMode;

  @state()
  modeBag!: Bag<ColorMode>;

  @state()
  _currentColorMode!: ColorMode;

  @state()
  hasFirstUpdated: boolean = false;

  constructor(renderMode: RenderMode, module: BookeraModule) {
    super(renderMode, module);

    this.primaryColor = getComputedStyle(document.body).getPropertyValue(
      '--primary'
    );
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    const bagManager = CreateBagManager(true);
    ColorPalettesSingleton.InitializeColorPalettesInBag(bagManager);
    this.colorPalettesBag = bagManager.getBag<ColorPalette>(ColorPalettesKey)!;
    this.colorPalettesBag?.onPopulated(this.onPopulated.bind(this));
    this.colorPalettesBag?.onAllChanges(this.onChange.bind(this));

    this.modeBag = bagManager.getBag<ColorMode>(DarkModeKey)!;
    this._currentColorMode = this.modeBag.get(DarkModeKey)!;
    this.modeBag.subscribe(DarkModeKey, this.handleModeChange.bind(this));
    this.changeCustomSteps();
  }

  private handleModeChange(mode: ColorMode | undefined) {
    this._currentColorMode = mode!;
  }

  private changeCustomSteps() {
    const mode = this.modeBag.get(DarkModeKey);

    this.customPaletteStep = mode === 'Light' ? 'LightMode' : 'DarkMode';
  }

  private onChange(key: string) {
    const newCP = this.colorPalettesBag.get(key)!;

    if (
      !this.colorPalettes.map((cp: ColorPalette) => cp.id).includes(newCP.id)
    ) {
      this.colorPalettes.push(this.colorPalettesBag.get(key)!);
    }
    if (key === SelectedColorPaletteKey) {
      this.selectedColorPalette = newCP;
    }

    this.requestUpdate();
  }

  private onPopulated(colorPalettesBag: Map<string, ColorPalette> | undefined) {
    this.selectedColorPalette = colorPalettesBag?.get(SelectedColorPaletteKey)!;

    // remove selectedColorPalette key from all entries
    this.colorPalettes = Array.from(colorPalettesBag?.entries()!)
      .filter(([id, _]) => {
        return id !== SelectedColorPaletteKey;
      })
      .map(([_, colorPalette]) => {
        return colorPalette;
      });

    // ! tab has to render before we update it! maybe we should ask for it
    this.requestUpdate();
  }

  private renderShades(
    name: string,
    shade: number,
    index: number,
    style: string,
    colorMode: ColorMode
  ) {
    // create name
    let newName = '';
    if (ColorSet.FixProperty(name) === 'slate') {
      newName =
        baseColorNames[index] !== ''
          ? baseColorNames[index]
          : `Shade ${name}-${shade}`;
    } else {
      newName =
        primaryColorName[index] !== ''
          ? primaryColorName[index]
          : `Shade ${name}-${shade}`;
    }

    return html`
      <div class="shade-group space-between">
        <label>${newName}</label>
        <sl-color-picker
          class="${name}-picker"
          data-theme=${colorMode}
          label="Select a color"
          value=${style}
          @sl-change=${(e: any) => {
            const value = e.target!.value;

            ColorSet.SetStyle(name, shade, value);
          }}
        ></sl-color-picker>
      </div>
    `;
  }

  private _configureModeForCustomPalette(color: ColorMode) {
    if (color === 'Light') {
      return this.customPaletteStep === 'LightMode' ? 'show' : '';
    }

    return this.customPaletteStep === 'DarkMode' ? 'show' : '';
  }

  private renderFormButton() {
    let button;
    if (this.customPaletteStep === 'LightMode') {
      button = `Show Dark mode`;
    } else {
      button = `Show Light mode`;
    }

    return html`
      <div class="button-container space-between vertical">
        <sl-button @click=${switchCustomPaletteStep.bind(this)}
          >${button}</sl-button
        >
        <sl-button class="button-hundred" type="submit">Save</sl-button>
      </div>
    `;
  }

  private renderCustomPaletteSection() {
    if (!this.createColorPaletteMode) {
      return html`
        <sl-button @click=${enableCreateColorPaletteMode.bind(this)}
          >Create Color Palette</sl-button
        >
      `;
    }

    return html`
      <form @submit=${handleCustomPaletteForm.bind(this)}>
        <div class="color-palette-name">
          <label>Color Palette Name</label>
          <sl-input id="color-palette-name"></sl-input>
          <p>
            ${this.customPaletteStep === 'LightMode'
              ? 'Light Mode'
              : 'Dark Mode'}
            colors
          </p>
        </div>
        <div class="colors-box">
          <div
            class="colors space-between light ${this._configureModeForCustomPalette(
              'Light'
            )}"
          >
            <div class="color-column">
              <h6>Primary</h6>
              ${this.lightMode.primaryColors?.map(
                (style: string, i: number) => {
                  return this.renderShades(
                    PrimaryColor,
                    shadePercents[i],
                    i,
                    style,
                    'Light'
                  );
                }
              )}
            </div>
            <div class="color-column">
              <h6>${BaseColor}</h6>
              ${this.lightMode.baseColors?.map((style: string, i: number) => {
                return this.renderShades(
                  BaseColor,
                  shadePercents[i],
                  i,
                  style,
                  'Light'
                );
              })}
            </div>
          </div>
          <div
            class="colors space-between dark ${this._configureModeForCustomPalette(
              'Dark'
            )}"
          >
            <div class="color-column">
              <h6>Primary</h6>
              ${this.lightMode.primaryColors?.map(
                (style: string, i: number) => {
                  return this.renderShades(
                    PrimaryColor,
                    shadePercents[i],
                    i,
                    style,
                    'Dark'
                  );
                }
              )}
            </div>

            <div class="color-column">
              <h6>${BaseColor}</h6>
              ${this.lightMode.baseColors?.map((style: string, i: number) => {
                return this.renderShades(
                  BaseColor,
                  shadePercents[i],
                  i,
                  style,
                  'Dark'
                );
              })}
            </div>
          </div>
        </div>
        ${this.renderFormButton()}
      </form>
    `;
  }

  private renderSelectedColorPalettes() {
    return html`
      <div
        class="color-palettes flex"
        @click=${handleSelectColorPalette.bind(this)}
      >
        ${this.colorPalettes.map((colorPalette: ColorPalette) => {
          return html`<sl-menu-item
          class="${
            this.selectedColorPalette?.id === colorPalette.id
              ? 'selected-color-palette'
              : 'color-palette-item'
          }"
          value=${colorPalette.id}
        >
          ${colorPalette.name}
        </sl-menu-item> 
        </div>
        `;
        })}
      </div>
    `;
  }
  // style colors inside
  private renderSystemColorPaletteSection() {
    return html`
      <form @submit=${handleSubmitSystemColorPalette.bind(this)}>
        <div class="column-layout">
          <div>
            <label>background</label>
            <sl-select
              id="color-selector"
              name="system-colors"
              @sl-change=${selectSystemColor.bind(this)}
            >
              ${Array.from(ColorSets.values()).map((colorSet: ColorSet) => {
                return html`<sl-option value="${colorSet.name}"
                  >${colorSet.name}</sl-option
                >`;
              })}
            </sl-select>
          </div>
          <div>
            <label>Primary</label>
            <sl-color-picker
              name="primary-color"
              value=${this.primaryColor}
              id="primary-color-picker"
              label="Select a color"
              @sl-change=${selectPrimaryColor.bind(this)}
            ></sl-color-picker>
          </div>
          <div>
            <label>Mode</label>
            <dark-mode></dark-mode>
          </div>
        </div>
        ${this.systemColorPaletteMode
          ? html`
              <div class="name-color-palette">
                <label>Name your palette</label>
                <sl-input name="name"></sl-input>
              </div>
              <sl-button type="submit" class="button-hundred">Save</sl-button>
            `
          : ''}
      </form>
    `;
  }

  protected renderInSettings() {
    return html`
      <div class="panel-container">
        ${this.renderTitleSection()}
        ${this.createSection(
          'System Color Palettes',
          'Create from a system color palette',
          this.renderSystemColorPaletteSection.bind(this)
        )}
        ${this.createSection(
          'Custom Palettes',
          'Create your own color palette & share with others!',
          this.renderCustomPaletteSection.bind(this)
        )}
        ${this.createSection(
          'Select Color Palettes!',
          'These are your color palettes!',
          this.renderSelectedColorPalettes.bind(this)
        )}
      </div>
    `;
  }

  protected renderInSidePanel() {
    return html`
      <div class="side-panel">
        ${this.renderSidePanelTitleSection()}
        <div class="center dark-mode-padding">
          <dark-mode></dark-mode>
        </div>
        ${this.createSidePanelSection(
          'Your Color Palettes!',
          '',
          this.renderSelectedColorPalettes.bind(this)
        )}
      </div>
    `;
  }

  render() {
    switch (this.renderMode) {
      case 'renderInSettings':
        return this.renderInSettings();
      case 'renderInSidePanel':
        return this.renderInSidePanel();
    }

    return html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'themes-element': ThemesElement;
  }
}
