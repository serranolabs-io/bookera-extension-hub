import { html, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import themeSwitcherElementStyles from './theme-switcher-element.styles';

import {
  BaseColor,
  ColorSet,
  ColorSets,
  PrimaryColor,
  SystemColorSets,
  baseColorNames,
  primaryColorName,
  shadePercents,
} from './color-sets';

import { SlColorPicker, SlSelect } from '@shoelace-style/shoelace';
import { Bag, BagManager, CreateBag, CreateBagManager } from '@pb33f/saddlebag';
import {
  ColorPalette,
  ColorPalettesKey,
  ColorPalettesSingleton,
  CustomColorPalette,
  getIndexes,
  getShadeVariable,
  Mode,
  SelectedColorPaletteKey,
} from './stateful';
import {
  enableCreateColorPaletteMode,
  fillShadeStyle,
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
import {
  BookeraModuleElement,
  moduleElementStyles,
} from '@serranolabs.io/shared/module-element';
import baseCss from '@serranolabs.io/shared/base';
import { BookeraModule, RenderMode } from '@serranolabs.io/shared/module';
import { key } from 'localforage';
import { loadConfigFromFile } from 'vite';
import { genShortID } from '@serranolabs.io/shared/util';
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

export const savingKeys = {
  systemColorPaletteMode: false,
  primaryColor: '',
  backgroundColor: SystemColorSets.Slate,
  systemName: '',
  // custom
  customName: '',
  lightMode: new Mode(
    'Light',
    fillShadeStyle(PrimaryColor, false),
    fillShadeStyle(BaseColor, false)
  ),
  darkMode: new Mode(
    'Dark',
    fillShadeStyle(PrimaryColor, false),
    fillShadeStyle(BaseColor, false)
  ),
  createColorPaletteMode: false,
};

export const savingProperties = {
  systemColorPaletteMode: 'systemColorPaletteMode',
  createColorPaletteMode: 'createColorPaletteMode',
  primaryColor: 'primaryColor',
  backgroundColor: 'backgroundColor',
  systemName: 'systemName',
  // custom
  customName: 'customName',
  lightMode: 'lightMode',
  darkMode: 'darkMode',
};

// the theme switcher should always have the same ID no matter what, across every single app
// the tab will follow
@customElement('themes-element')
export class ThemesElement extends BookeraModuleElement {
  static styles = [themeSwitcherElementStyles, baseCss, moduleElementStyles];

  @query('#color-selector') colorSelect!: SlSelect;

  @query('#primary-color-picker') primaryColorPicker!: SlColorPicker;

  @property()
  bagManager: BagManager = CreateBagManager(true);

  @state()
  createColorPaletteMode: boolean = savingKeys.createColorPaletteMode;

  // only consume what I want from the singleton
  @state()
  colorPalettes: ColorPalette[] = [];

  // system color palette mode
  @state()
  systemName: string = savingKeys.systemName;

  @state()
  systemColorPaletteMode: boolean = savingKeys.systemColorPaletteMode;

  @state()
  primaryColor: string = savingKeys.primaryColor;

  @state()
  backgroundColor: SystemColorSets = savingKeys.backgroundColor;
  // end system color palette mode

  // begin custom color palettes
  @state()
  lightMode: Mode = savingKeys.lightMode;

  @state()
  darkMode: Mode = savingKeys.darkMode;

  @state()
  customName: string = savingKeys.customName;

  // end custom color palettes

  @state()
  colorPalettesBag!: Bag<ColorPalette>;

  @state()
  selectedColorPalette: ColorPalette | null = null;

  @state()
  customPaletteStep: CustomColorStep = 'LightMode';

  @state()
  darkModeElement!: DarkMode;

  @state()
  modeBag!: Bag<ColorMode>;

  @state()
  _currentColorMode!: ColorMode;

  @state()
  hasFirstUpdated: boolean = false;

  constructor(
    renderMode: RenderMode,
    module: BookeraModule,
    _panelTabId?: string
  ) {
    super(renderMode, module, _panelTabId);

    savingKeys.primaryColor = getComputedStyle(document.body).getPropertyValue(
      '--primary'
    );

    this._kickOffLocalFlow();
  }
  private async _kickOffLocalFlow() {
    await this._runLocalFlow(this._setDefaults.bind(this));

    if (!this._bag) return;

    Array.from(this._bag?.export().entries()).forEach(([key, newValue]) => {
      if (this[key] !== newValue) {
        this._isInstanceDirty = true;
      }

      this[key] = newValue;

      this.requestUpdate();
    });
  }

  protected _setDefaults() {
    Object.entries(savingKeys).forEach(([key, value]) => {
      this._bag?.set(key, value);
      this[key] = value;
      this._savePanelTabState(key, value);
    });
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

  protected renderInPanel() {
    return html``;
  }

  private renderShades(
    name: string,
    shade: number,
    index: number,
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

    const indexes = getIndexes.bind(this)(name, index, colorMode);

    console.log(this[indexes.modeIndex][indexes.propertyIndex][indexes.index]);

    return html`
      <div class="shade-group space-between">
        <label>${newName}</label>
        <sl-color-picker
          class="${name}-picker"
          data-theme=${colorMode}
          label="Select a color"
          value=${this[indexes.modeIndex][indexes.propertyIndex][indexes.index]}
          @sl-change=${(e: any) => {
            const value = e.target!.value;

            ColorSet.SetStyle(name, shade, value);
            this[indexes.modeIndex][indexes.propertyIndex][indexes.index] =
              value;

            this._savePanelTabState(
              savingProperties[indexes.modeIndex],
              this[indexes.modeIndex]
            );
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
                    shadePercents[i]!,
                    i,
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
                  shadePercents[i]!,
                  i,
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
                    shadePercents[i]!,
                    i,
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
                  shadePercents[i]!,
                  i,
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
              value=${this.backgroundColor}
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
                <sl-input
                  name="name"
                  value=${this.systemName}
                  @sl-change=${(e) => {
                    const newValue: string = e.target.value;
                    this.systemName = newValue;

                    this._savePanelTabState(
                      savingProperties.systemName,
                      this.systemName
                    );
                  }}
                ></sl-input>
              </div>
              <sl-button type="submit" class="button-hundred">Save</sl-button>
            `
          : ''}
      </form>
    `;
  }

  private _renderApplyChangesButton() {
    if (!this._isInstanceDirty) {
      return html``;
    }

    return html`<sl-button
      @click=${() => {
        const np = new CustomColorPalette(
          this.lightMode,
          this.darkMode,
          this._currentColorMode,
          genShortID(8)
        );

        CustomColorPalette.SetColorMode(np, this._currentColorMode);
      }}
      >Apply changes</sl-button
    >`;
  }

  protected renderInSettings() {
    return html`
      ${this.renderTitleSection()} ${this._renderApplyChangesButton()}
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
    `;
  }

  protected renderInSidePanel() {
    return html`
      ${this.renderSidePanelTitleSection()}
      <div class="center dark-mode-padding">
        <dark-mode></dark-mode>
      </div>
      ${this.createSidePanelSection(
        'Your Color Palettes!',
        '',
        this.renderSelectedColorPalettes.bind(this)
      )}
    `;
  }

  protected renderInModuleDaemon() {
    return html`
      <dark-mode daemon></dark-mode>
      <code>${this.selectedColorPalette?.name}</code>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'themes-element': ThemesElement;
  }
}
