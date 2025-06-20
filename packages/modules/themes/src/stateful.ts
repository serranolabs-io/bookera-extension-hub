import { Bag, BagManager, CreateBagManager } from '@pb33f/saddlebag';
import localforage from 'localforage';
import {
  BaseColor,
  ColorSet,
  ColorSets,
  PrimaryColor,
  SystemColorSets,
  shadePercents,
} from './color-sets';
import { html } from 'lit';
import { ColorMode, ThemesElement } from './theme-switcher-element';
import { genShortID } from '@serranolabs.io/shared/util';
import palettes from './palettes.json';
import { z } from 'zod';

export class ColorPalette {
  id?: string;
  name?: string;
  constructor(name?: string, id?: string) {
    this.name = name;

    if (id) {
      this.id = id;
    } else {
      this.id = genShortID(6);
    }
  }

  static ApplyMode(
    colorPalette: ColorPalette,
    colorMode: ColorMode,
    onStart?: boolean
  ) {
    const cp = ColorPalette.WhichColorPalette(colorPalette);
    cp.applyMode(colorMode, onStart);
  }

  static WhichColorPalette(
    colorPalette: ColorPalette
  ): SystemColorPalette | CustomColorPalette {
    if (SystemColorPalette.IsSystemColorPalette(colorPalette)) {
      const cp: SystemColorPalette = colorPalette as SystemColorPalette;
      return new SystemColorPalette(
        cp.background,
        cp.primaryColor,
        cp.name,
        cp.id
      );
    }

    const cp: CustomColorPalette = colorPalette as CustomColorPalette;
    return new CustomColorPalette(cp.lightMode, cp.darkMode, cp.name, cp.id);
  }

  static SelectColorPalette(colorPalette: ColorPalette, colorMode: ColorMode) {
    if (
      ColorPalette.WhichColorPalette(colorPalette) instanceof SystemColorPalette
    ) {
      SystemColorPalette.SelectColorPalette(colorPalette, colorMode);
    } else {
      CustomColorPalette.SelectColorPalette(colorPalette, colorMode);
    }
  }
}

export class SystemColorPalette extends ColorPalette {
  background?: SystemColorSets;
  primaryColor?: string;
  constructor(
    background?: SystemColorSets,
    primaryColor?: string,
    name?: string,
    id?: string
  ) {
    super(name, id);
    this.background = background;
    this.primaryColor = primaryColor;
  }

  static IsSystemColorPalette(colorPalette: ColorPalette): boolean {
    if ((colorPalette as SystemColorPalette).background) return true;

    return false;
  }

  static SelectColorPalette(colorPalette: ColorPalette, colorMode: ColorMode) {
    const sp = colorPalette as SystemColorPalette;
    ColorSets.get(sp.background!)?.applyColorWithMode(colorMode);
    ColorSet.SetPrimaryColor(sp.primaryColor!);
  }

  applyMode(colorMode: ColorMode, onStart?: boolean) {
    ColorSet.SwapModes(colorMode, onStart);
  }

  renderSystemColorPaletteInList() {
    return html` ${this.name} `;
  }
}

export class Mode {
  mode?: ColorMode;
  primaryColors?: string[];
  baseColors?: string[];
  constructor(
    mode?: ColorMode,
    primaryColors?: string[],
    baseColors?: string[]
  ) {
    this.mode = mode;
    this.primaryColors = primaryColors;
    this.baseColors = baseColors;
  }

  areModesEqual(otherMode: Mode) {
    if (
      this.mode === otherMode.mode &&
      this.primaryColors?.every(
        (color, index) => color === otherMode.primaryColors![index]
      ) &&
      this.baseColors?.every(
        (color, index) => color === otherMode.baseColors![index]
      )
    ) {
      return true;
    }

    return false;
  }
}

export function getIndexes(
  this: ThemesElement,
  name: string,
  index: number,
  colorMode: ColorMode
): { modeIndex: string; propertyIndex: string; index: number } {
  const property = name.toLocaleLowerCase() + 'Colors';
  const theme = colorMode === 'Dark' ? 'darkMode' : 'lightMode';

  return {
    modeIndex: theme,
    propertyIndex: property,
    index: index,
  };
}

export function getShadeVariable(
  this: ThemesElement,
  name: string,
  index: number,
  colorMode: ColorMode,
  newValue?: string
): string | undefined {
  const property = name.toLocaleLowerCase() + 'Colors';
  const theme = colorMode === 'Dark' ? 'darkMode' : 'lightMode';

  if (newValue) {
    this[theme][property][index] = newValue;
  }

  return this[theme][property][index];
}

export class CustomColorPalette extends ColorPalette {
  darkMode?: Mode;
  lightMode?: Mode;
  constructor(lightMode?: Mode, darkMode?: Mode, name?: string, id?: string) {
    super(name, id);
    this.darkMode = darkMode;
    this.lightMode = lightMode;
  }

  applyMode(colorMode: ColorMode, onStart?: boolean) {
    CustomColorPalette.SetColorMode(this, colorMode);
  }

  static SetColorMode(cp: CustomColorPalette, colorMode: ColorMode) {
    let primaryColors: string[];
    let baseColors: string[];
    switch (colorMode) {
      case 'Dark':
        primaryColors = cp.darkMode?.primaryColors!;
        baseColors = cp.darkMode?.baseColors!;
        break;
      case 'Light':
        primaryColors = cp.lightMode?.primaryColors!;
        baseColors = cp.lightMode?.baseColors!;
        break;
    }

    primaryColors?.forEach((pc: string, num: number) => {
      ColorSet.SetStyle(PrimaryColor, shadePercents[num], pc);
    });

    baseColors?.forEach((pc: string, num: number) => {
      ColorSet.SetStyle(BaseColor, shadePercents[num], pc);
    });
  }

  static SelectColorPalette(colorPalette: ColorPalette, colorMode: ColorMode) {
    const cp = colorPalette as CustomColorPalette;
    CustomColorPalette.SetColorMode(cp, colorMode);
  }

  renderSystemColorPaletteInList() {
    return html` ${this.name} `;
  }
}

// the point of this is to have one universal API
export class ColorPalettesSingleton {
  static defaultColorPalette: ColorPalette = new SystemColorPalette(
    SystemColorSets.Slate,
    '#ffb87e',
    'default',
    genShortID(6)
  );
  static defaultColorPalettes: ColorPalette[] = palettes;

  static selectedColorPalette: ColorPalette;

  constructor() {}

  static GetColorPaletteFromId(id: string): ColorPalette {
    const bagManager = CreateBagManager(true);

    return bagManager.getBag(ColorPalettesKey)?.get(id)!;
  }

  static GetSelectedColorPalette(bagManager: BagManager): ColorPalette {
    const cp = bagManager
      .getBag(ColorPalettesKey)
      ?.get(SelectedColorPaletteKey)!;

    return Object.assign(new ColorPalette(), cp);
  }

  static SetSelectedColorPalette(
    bagManager: BagManager,
    colorPalette: ColorPalette
  ) {
    const colorPalettes = bagManager.getBag(ColorPalettesKey)!;

    colorPalettes.set(SelectedColorPaletteKey, colorPalette)!;

    localforage.setItem(ColorPalettesKey, colorPalettes.export());
  }

  static NewColorPaletteAndSelect(
    bagManager: BagManager,
    newColorPalette: ColorPalette,
    setSelected: boolean = true
  ) {
    const bag = bagManager.getBag<ColorPalette>(ColorPalettesKey);
    bag?.set(newColorPalette.id!, newColorPalette);

    if (setSelected) {
      bag?.set(SelectedColorPaletteKey, newColorPalette);
    }

    const map = bagManager.getBag<ColorPalette>(ColorPalettesKey)?.export();
    localforage.setItem(ColorPalettesKey, map);
  }

  static async InitializeColorPalettesInBag(
    bagManager: BagManager
  ): Promise<Bag | undefined> {
    const colorPalettesBag =
      bagManager.createBag<ColorPalette>(ColorPalettesKey)!;

    const savedTabsContent =
      await localforage.getItem<Map<string, ColorPalette>>(ColorPalettesKey);

    // if there is nothing saved
    if (!savedTabsContent) {
      // selected is default
      ColorPalettesSingleton.selectedColorPalette =
        ColorPalettesSingleton.defaultColorPalette;

      // putting default in the main bag
      ColorPalettesSingleton.defaultColorPalettes.forEach((cp) => {
        ColorPalettesSingleton.NewColorPaletteAndSelect(bagManager, cp);
      });
      ColorPalettesSingleton.NewColorPaletteAndSelect(
        bagManager,
        ColorPalettesSingleton.defaultColorPalette
      );
    } else {
      colorPalettesBag.populate(savedTabsContent);
    }

    return colorPalettesBag;
  }
}

export const ColorPalettesKey = 'color-palettes-key';
export const SelectedColorPaletteKey = 'selected-color-palette-key';

export class InstanceManager {}
