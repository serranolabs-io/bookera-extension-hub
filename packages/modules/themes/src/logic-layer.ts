import { SlMenuItem } from '@shoelace-style/shoelace';
import {
  PrimaryColor,
  BaseColor,
  ColorSet,
  shadePercents,
  SystemColorSets,
  ColorSets,
} from './color-sets';
import { DarkMode } from './dark-mode';
import {
  CustomColorPalette,
  ColorPalettesSingleton,
  Mode,
  ColorPalette,
  SystemColorPalette,
} from './stateful';
import { savingKeys, savingProperties, ThemesElement } from './theme-switcher-element';
import { BagManager, CreateBagManager } from '@pb33f/saddlebag';
import { notify } from '@serranolabs.io/shared/lit';
import { doesClickContainElement } from '@serranolabs.io/shared/util';

export function switchCustomPaletteStep(this: ThemesElement) {
  this.customPaletteStep = this.customPaletteStep === 'DarkMode' ? 'LightMode' : 'DarkMode';

  this.requestUpdate();
}

export function fillShadeStyle(name: string, reverse: boolean): string[] {
  const shades: string[] = [];
  if (!reverse) {
    shadePercents.forEach((shade: number) => {
      const style = getComputedStyle(document.body).getPropertyValue(
        `--${ColorSet.FixProperty(name)}-${shade}`
      );

      shades.push(style);
    });
  } else {
    shadePercents.forEach((shade: number) => {
      const style = getComputedStyle(document.body).getPropertyValue(
        `--${ColorSet.FixProperty(name)}-${shade}`
      );

      shades.push(style);
    });
  }

  return shades;
}

export function enableCreateColorPaletteMode(this: ThemesElement) {
  this.createColorPaletteMode = true;
  this._savePanelTabState(savingProperties.createColorPaletteMode, this.createColorPaletteMode);
}

function getUserShades(this: ThemesElement, selector: string): string[] {
  const shades: string[] = [];
  this.shadowRoot?.querySelectorAll<HTMLInputElement>(selector).forEach((el: HTMLInputElement) => {
    shades.push(el.value);
  });

  return shades;
}

export function handleCustomPaletteForm(this: ThemesElement, e: Event) {
  e.preventDefault();
  const canSave = (allValues: string[]): boolean => {
    if (allValues.includes('')) {
      notify('Please fill in all colors!', 'warning', null);
      return false;
    }

    return true;
  };

  this.lightMode.primaryColors = getUserShades.bind(this)(
    `.${PrimaryColor}-picker[data-theme='${'Light'}']`
  );
  this.lightMode.baseColors = getUserShades.bind(this)(
    `.${BaseColor}-picker[data-theme='${'Light'}']`
  );
  this.darkMode.primaryColors = getUserShades.bind(this)(
    `.${PrimaryColor}-picker[data-theme='${'Dark'}']`
  );
  this.darkMode.baseColors = getUserShades.bind(this)(
    `.${BaseColor}-picker[data-theme='${'Dark'}']`
  );

  // verification
  if (
    !canSave(this.lightMode.primaryColors!) ||
    !canSave(this.lightMode.baseColors!) ||
    !canSave(this.darkMode.primaryColors!) ||
    !canSave(this.darkMode.baseColors!)
  ) {
    return;
  }
  const name = (this.shadowRoot?.querySelector('#color-palette-name') as HTMLInputElement)!.value;
  if (name.length === 0) {
    notify(`Please select a name!`, 'warning', '');
    return;
  }

  const newPalette = new CustomColorPalette(this.lightMode, this.darkMode, name);

  notify(`new color palette ${name} added 💅`, 'success', '');
  this.createColorPaletteMode = false;
  this.selectedColorPalette = newPalette;
  this.colorPalettes.push(this.selectedColorPalette);
  this.requestUpdate();
  ColorPalettesSingleton.NewColorPaletteAndSelect(this.bagManager, newPalette);

  this._setDefaults();
}

function _handleSelectInternals(colorPalette: ColorPalette, bagManager: BagManager) {
  // set color
  ColorPalette.SelectColorPalette(colorPalette, DarkMode.GetColorMode());

  // set state
  ColorPalettesSingleton.SetSelectedColorPalette(bagManager, colorPalette);

  console.log('hola Nathalia <3. Copia esto y damelo porfa', colorPalette);
}

export function handleSelectColorPaletteFromId(id: string) {
  const colorPalette = ColorPalettesSingleton.GetColorPaletteFromId(id);

  _handleSelectInternals(colorPalette, CreateBagManager(true));
}

export function handleSelectColorPalette(this: ThemesElement, e: Event) {
  const el = doesClickContainElement<SlMenuItem>(e, {
    nodeName: 'SL-MENU-ITEM',
  });

  if (!el) {
    return;
  }

  // suffix button press does not trigger
  const path = Array.from(e.composedPath());
  if (path.length > 2 && (path[2] as HTMLElement)?.nodeName === 'SL-ICON-BUTTON') {
    return;
  }

  const id = el.value;
  if (this.selectedColorPalette?.id === id) {
  } else {
    this.selectedColorPalette = this.colorPalettes.find(
      (colorPalette: ColorPalette) => colorPalette.id === id
    )!;
  }

  _handleSelectInternals(this.selectedColorPalette!, this.bagManager);

  this.requestUpdate();
}

export function selectSystemColor(this: ThemesElement) {
  const val = this.colorSelect.value as string;
  ColorSets.get(val as SystemColorSets)?.applyColorWithMode(DarkMode.GetColorMode());
  this.systemColorPaletteMode = true;
  this.backgroundColor = val as SystemColorSets;
  this._savePanelTabState(savingProperties.backgroundColor, this.backgroundColor);

  this._savePanelTabState(savingProperties.systemColorPaletteMode, this.systemColorPaletteMode);
}

export function selectPrimaryColor(this: ThemesElement) {
  this.systemColorPaletteMode = true;
  this._savePanelTabState(savingProperties.systemColorPaletteMode, this.systemColorPaletteMode);
  this.primaryColor = this.primaryColorPicker.value;
  ColorSet.SetPrimaryColor(this.primaryColor);
  this._savePanelTabState(savingProperties.primaryColor, this.primaryColor);
}

export function handleSubmitSystemColorPalette(this: ThemesElement, e: SubmitEvent) {
  e.preventDefault();
  const form = new FormData(e.target as HTMLFormElement);

  const systemColors = form.get('system-colors')!;
  const name = form.get('name')!;
  const primaryColor = form.get('primary-color')!;

  const newPalette = new SystemColorPalette(
    systemColors as SystemColorSets,
    primaryColor as string,
    name as string
  );

  this.selectedColorPalette = newPalette;
  this.colorPalettes.push(this.selectedColorPalette);
  ColorPalettesSingleton.NewColorPaletteAndSelect(this.bagManager, newPalette);
  this.systemColorPaletteMode = false;
  this._savePanelTabState(savingProperties.systemColorPaletteMode, this.systemColorPaletteMode);

  this._setDefaults();
}
