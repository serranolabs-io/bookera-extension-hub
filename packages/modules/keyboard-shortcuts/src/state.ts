import type { Bag, BagManager } from '@pb33f/saddlebag';
import localforage from 'localforage';
import { KeyboardShortcut } from '@serranolabs.io/shared/keyboard-shortcuts';
import sharedShortcuts from '@serranolabs.io/shared/shortcuts-list';
import themesShortcuts from '@serranolabs.io/bookera-themes/shortcuts';

const KEYBINDINGS_BAG_NAME = 'keyboard-shortcuts';

const convertAll = (shortcuts: KeyboardShortcut[]): KeyboardShortcut[] => {
  return shortcuts.map((shortcut) => {
    return KeyboardShortcut.fromJSON(shortcut);
  });
};

export class KeyboardShortcutsState {
  static defaults: KeyboardShortcut[] = convertAll([
    ...sharedShortcuts,
    ...themesShortcuts,
  ] as KeyboardShortcut[]);
  constructor() {}

  static async GetShortcuts(): Promise<Map<string, KeyboardShortcut> | null> {
    return await localforage.getItem<Map<string, KeyboardShortcut>>(
      KEYBINDINGS_BAG_NAME
    );
  }

  static updateShortcut(bagManager: BagManager, shortcut: KeyboardShortcut) {
    const shortcutsBag =
      bagManager.getBag<KeyboardShortcut>(KEYBINDINGS_BAG_NAME);

    shortcutsBag?.set(shortcut.id, shortcut);
    localforage.setItem(
      KEYBINDINGS_BAG_NAME,
      shortcutsBag?.export() as Map<string, KeyboardShortcut>
    );
  }

  static async initializeShortcutsInBag(bagManager: BagManager): Promise<Bag> {
    const shortcutsBag =
      bagManager.createBag<KeyboardShortcut>(KEYBINDINGS_BAG_NAME)!;

    const savedShortcuts =
      await localforage.getItem<Map<string, KeyboardShortcut>>(
        KEYBINDINGS_BAG_NAME
      );
    console.log(this.defaults);

    if (!savedShortcuts) {
      const defaultShortcuts = new Map<string, KeyboardShortcut>();

      this.defaults.forEach((kb) => {
        defaultShortcuts.set(kb.id, kb);
      });

      await localforage.setItem(KEYBINDINGS_BAG_NAME, defaultShortcuts);
      shortcutsBag?.populate(defaultShortcuts);
    } else {
      shortcutsBag?.populate(savedShortcuts);
    }

    return shortcutsBag;
  }
}
