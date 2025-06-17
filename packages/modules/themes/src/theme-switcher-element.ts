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
import { Bag, BagManager, CreateBagManager } from '@pb33f/saddlebag';
import {
  ColorPalette,
  ColorPalettesKey,
  ColorPalettesSingleton,
  CustomColorPalette,
  getIndexes,
  Mode,
  SelectedColorPaletteKey,
  SystemColorPalette,
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
import {
  BookeraModule,
  BookeraModuleConfig,
  RenderMode,
} from '@serranolabs.io/shared/module';

import { genShortID, sendEvent } from '@serranolabs.io/shared/util';
import {
  Config,
  ExtensionConfig,
  SEND_CONFIG_EVENT,
  SEND_CONFIG_EVENT_TYPE,
} from '@serranolabs.io/shared/extension-marketplace';
import { Source } from '@serranolabs.io/shared/keyboard-shortcuts';
import { ExtensionDownloadEndpoints } from '@serranolabs.io/shared/extension-marketplace';

export type ColorMode = 'Light' | 'Dark';

const CustomColorStepMode = {
  LightMode: 'Light mode',
  DarkMode: 'Dark mode',
} as const;

type CustomColorStep = keyof typeof CustomColorStepMode;

export const systemKeys = {
  systemColorPaletteMode: false,
  primaryColor: '',
  backgroundColor: SystemColorSets.Slate,
  systemName: '',
};
export const customKeys = {
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

export const savingKeys = {
  ...systemKeys,
  ...customKeys,
};

export const systemProperties = {
  systemColorPaletteMode: 'systemColorPaletteMode',
  primaryColor: 'primaryColor',
  backgroundColor: 'backgroundColor',
  systemName: 'systemName',
};

export const customProperties = {
  customName: 'customName',
  createColorPaletteMode: 'createColorPaletteMode',
  lightMode: 'lightMode',
  darkMode: 'darkMode',
};

export const savingProperties = {
  ...systemProperties,
  ...customProperties,
  // custom
};

// the theme switcher should always have the same ID no matter what, across every single app
// the tab will follow
@customElement('themes-element')
export class ThemesElement extends BookeraModuleElement {
  static styles = [themeSwitcherElementStyles, baseCss, moduleElementStyles];

  @query('#color-selector') accessor colorSelect!: SlSelect;

  @query('#primary-color-picker') accessor primaryColorPicker!: SlColorPicker;

  @property()
  accessor bagManager: BagManager = CreateBagManager(true);

  @state()
  accessor createColorPaletteMode: boolean = savingKeys.createColorPaletteMode;

  // only consume what I want from the singleton
  @state()
  accessor colorPalettes: ColorPalette[] = [];

  // system color palette mode
  @state()
  accessor systemName: string = savingKeys.systemName;

  @state()
  accessor systemColorPaletteMode: boolean = savingKeys.systemColorPaletteMode;

  @state()
  accessor primaryColor: string = savingKeys.primaryColor;

  @state()
  accessor backgroundColor: SystemColorSets = savingKeys.backgroundColor;
  // end system color palette mode

  // begin custom color palettes
  @state()
  accessor lightMode: Mode = savingKeys.lightMode;

  @state()
  accessor darkMode: Mode = savingKeys.darkMode;

  @state()
  accessor customName: string = savingKeys.customName;

  @state()
  accessor colorPalettesBag!: Bag<ColorPalette>;

  @state()
  accessor selectedColorPalette: ColorPalette | null = null;

  @state()
  accessor customPaletteStep: CustomColorStep = 'LightMode';

  @state()
  accessor darkModeElement!: DarkMode;

  @state()
  accessor modeBag!: Bag<ColorMode>;

  @state()
  accessor _currentColorMode!: ColorMode;

  @state()
  accessor hasFirstUpdated: boolean = false;

  @state()
  private accessor _hasAppliedChanges: boolean = false;

  private _isSystemDirty = false;
  private _isCustomDirty = false;

  connectedCallback(): void {
    super.connectedCallback();

    if (this._config.renderMode === 'renderInDaemon') {
      document.addEventListener(
        ExtensionDownloadEndpoints.themes,
        (e: CustomEvent<Config<any>>) => {
          const configs = e.detail.values;
          configs.forEach((config: Config<any>) => {
            ColorPalettesSingleton.NewColorPaletteAndSelect(
              this.bagManager,
              config,
              false
            );
          });
        }
      );
    }
  }

  constructor(config: BookeraModuleConfig<any>) {
    super(config);

    savingKeys.primaryColor = getComputedStyle(document.body).getPropertyValue(
      '--primary'
    );

    this._kickOffLocalFlow();
  }

  private _runDirtyValidation(
    key: string,
    newValue: any,
    isOnChanges: boolean
  ) {
    if (
      key === savingProperties.lightMode ||
      key === savingProperties.darkMode
    ) {
      this[key] = new Mode(
        this[key].mode,
        this[key].primaryColors,
        this[key].baseColors
      );
      newValue = new Mode(
        newValue.mode,
        newValue.primaryColors,
        newValue.baseColors
      );
    }

    if (
      ((key === savingProperties.lightMode ||
        key === savingProperties.darkMode) &&
        !this[key].areModesEqual(newValue)) ||
      (this[key] !== newValue &&
        !(
          key === savingProperties.lightMode ||
          key === savingProperties.darkMode
        ))
    ) {
      if (Object.keys(systemProperties).includes(key)) {
        this._isSystemDirty = true;
      } else {
        this._isCustomDirty = true;
      }

      if (!isOnChanges) {
        this._isInstanceDirty = true;
      }
    }
  }

  private async _kickOffLocalFlow() {
    await this._runLocalFlow(this._setDefaults.bind(this));

    if (!this._bag) return;

    this._bag.onAllChanges((key) => {
      this._runDirtyValidation(key, savingKeys[key], true);
    });

    Array.from(this._bag?.export().entries()).forEach(([key, newValue]) => {
      this._runDirtyValidation(key, newValue, false);

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
    this._isCustomDirty = false;
    this._isSystemDirty = false;
    this._isInstanceDirty = false;
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

  protected renderInPanel(): TemplateResult {
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
          <sl-input
            id="color-palette-name"
            value=${this.customName}
            @sl-input=${(e: any) => {
              const newValue: string = e.target.value;
              this.customName = newValue;

              this._savePanelTabState(
                savingProperties.customName,
                this.customName
              );
            }}
          ></sl-input>
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

  private _sendConfig(
    customColorPalette: CustomColorPalette
  ): SEND_CONFIG_EVENT_TYPE<CustomColorPalette> {
    return {
      config: {
        source: this._source,
        values: [customColorPalette],
        id: customColorPalette.id,
        nameIndex: 'name',
      },
    };
  }

  private renderAllColorPalettes(isSettings: boolean) {
    const renderSendButton = (colorPalette: ColorPalette) => {
      if (
        isSettings &&
        !SystemColorPalette.IsSystemColorPalette(colorPalette)
      ) {
        return html`
          <div slot="suffix" class="share-config">
            <sl-tooltip content="Share your palette!">
              <sl-icon-button
                name="send"
                @click=${() => {
                  sendEvent<SEND_CONFIG_EVENT_TYPE<CustomColorPalette>>(
                    this,
                    SEND_CONFIG_EVENT,
                    this._sendConfig(colorPalette as CustomColorPalette)
                  );
                }}
              ></sl-icon-button>
            </sl-tooltip>
          </div>
        `;
      }

      return html``;
    };

    return html`
      <!-- I SHOULD BE USING THE FUCKING MENU. Wtf -->
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
          ${renderSendButton(colorPalette)}
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
    if (!this._isInstanceDirty || this._hasAppliedChanges) {
      return html``;
    }

    return html`<sl-button
      @click=${() => {
        if (this._isCustomDirty) {
          const np = new CustomColorPalette(
            this.lightMode,
            this.darkMode,
            this._currentColorMode,
            genShortID(8)
          );
          CustomColorPalette.SetColorMode(np, this._currentColorMode);
        }
        if (this._isSystemDirty) {
          const np = new SystemColorPalette(
            this.backgroundColor,
            this.primaryColor,
            genShortID(6)
          );

          SystemColorPalette.SelectColorPalette(np, this._currentColorMode);
        }

        this._hasAppliedChanges = true;
      }}
      >Apply changes</sl-button
    >`;
  }

  private _renderCurrentSection() {
    let sections = [];

    if (this._isSystemDirty || (!this._isSystemDirty && !this._isCustomDirty)) {
      sections.push(html`
        ${this.createSection(
          'System Color Palettes',
          'Create from a system color palette',
          this.renderSystemColorPaletteSection.bind(this)
        )}
      `);
    }
    if (this._isCustomDirty || (!this._isSystemDirty && !this._isCustomDirty)) {
      sections.push(
        html`${this.createSection(
          'Custom Palettes',
          'Create your own color palette & share with others!',
          this.renderCustomPaletteSection.bind(this)
        )}`
      );
    }

    return html`${sections.map((section) => {
      return section;
    })}`;
  }

  renderInSettings() {
    return html`
      ${this.renderTitleSection()} ${this._renderApplyChangesButton()}
      ${this._renderCurrentSection()}
      ${this.createSection(
        'Select Color Palettes!',
        'These are your color palettes!',
        this.renderAllColorPalettes.bind(this, true)
      )}
    `;
  }

  renderInSidePanel() {
    return html`
      ${this.renderSidePanelTitleSection()}
      <div class="center dark-mode-padding">
        <dark-mode></dark-mode>
      </div>
      ${this.createSidePanelSection(
        'Your Color Palettes!',
        '',
        this.renderAllColorPalettes.bind(this, false)
      )}
    `;
  }

  renderInModuleDaemon() {
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
