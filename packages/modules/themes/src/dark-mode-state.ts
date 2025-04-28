import { ColorMode } from './theme-switcher-element';
import { ColorPalette, ColorPalettesSingleton } from './stateful';
import { BagManager, Bag, CreateBagManager } from '@pb33f/saddlebag';

export const DarkModeKey = 'dark-mode-key';

export class DarkModeSingleton {
  static DarkModeKey: ColorMode = 'Light'; // should be system

  static SetAppliedMode(colorMode: ColorMode) {
    const bagManager = CreateBagManager(true);
    const bag = bagManager.getBag(DarkModeKey);

    bag?.set(DarkModeKey, colorMode);

    localStorage.setItem(DarkModeKey, colorMode);
    const selectedPalette =
      ColorPalettesSingleton.GetSelectedColorPalette(bagManager);

    ColorPalette.ApplyMode(selectedPalette, colorMode, false);
  }

  static InitializeModeInBag(
    bagManager: BagManager,
    media: MediaQueryList
  ): Bag<ColorMode> {
    const darkModeBag = bagManager.createBag<ColorMode>(DarkModeKey)!;

    let savedContent = localStorage.getItem(DarkModeKey)! as ColorMode;

    if (!savedContent) {
      // only if there is no theme chosen by the user, choose the theme
      if (media.matches) {
        savedContent = 'Dark';
      } else {
        savedContent = 'Light';
      }

      // save system defaults
      darkModeBag.set(DarkModeKey, DarkModeSingleton.DarkModeKey);
      localStorage.setItem(DarkModeKey, darkModeBag.get(DarkModeKey)!);
    } else {
      const map = new Map();
      map.set(DarkModeKey, savedContent);
      darkModeBag.populate(map);
    }

    return darkModeBag;
  }
}
