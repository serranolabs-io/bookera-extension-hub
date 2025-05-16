import {
  KeyboardEventKey,
  KeyboardShortcut,
} from '@serranolabs.io/shared/keyboard-shortcuts';
import { handleKeyPress, handleKeyUp } from './formwrapper';
import {
  KeyboardShortcutsElement,
  SHORTCUT_MAX_LENGTH,
} from './keyboard-shortcuts';

// setting focus

// * click
// & I want to set focus to all focusable web components within the tree
// & ex: panel -> panel tab . the last element has focus() called on it
// & ex: panel -> content

// * opening application, I want to

// strategy. we will do nested focusing. do it on themes settings.
// when pressing background, it will set focus on all focusable web components within the tree

// 2 parts:
// 1. how to start focusing
// 2. keybindings when focusing

function matchCondition(this: KeyboardShortcutsElement): HTMLElement | null {
  let focusedElement = document.activeElement;

  // this will give me focused tree
  let focusTypes = [];
  while (focusedElement?.shadowRoot) {
    // todo if element is focusable, get focus type in array
    if (focusedElement.isFocusable) {
      focusTypes.unshift(focusedElement.getFocus());

      // setFocus on it
      if (focusedElement.setFocus) {
        focusedElement.setFocus();
      }
    }

    focusedElement = focusedElement.shadowRoot.activeElement;
  }

  focusedElement.focus();

  console.log('Currently focused element:', focusedElement);
  return focusedElement as HTMLElement;
}

function detectShortcut(this: KeyboardShortcutsElement) {
  console.log('triggered detectedShortcut');
  const allSets = [...this._allKeyPressSets, this._keyPressSet];
  this._keyboardShortcuts.forEach((shortcut: KeyboardShortcut) => {
    const matchKeys = shortcut.keys.every(
      (set: KeyboardEventKey[], setIndex: number) => {
        return set.every((key: KeyboardEventKey, arrayIndex: number) => {
          return key === allSets[setIndex][arrayIndex];
        });
      }
    );

    if (matchKeys) {
      const matchedCondition = matchCondition.bind(this)();
      if (matchedCondition) {
        this._allKeyPressSets = [];
        this._keyPressSet = [];
      }
    }
  });
}

function registerKeydownListener(
  this: KeyboardShortcutsElement,
  e: KeyboardEvent
) {
  const nextKey = e.key as KeyboardEventKey;
  const { allKeyPressSets, keyPressSet, isModifierPressed } = handleKeyPress(
    this._allKeyPressSets,
    this._keyPressSet,
    this.isModifierPressed,
    nextKey
  );
  this._allKeyPressSets = allKeyPressSets;
  this._keyPressSet = keyPressSet;
  this.isModifierPressed = isModifierPressed;
  if (this._allKeyPressSets.length > SHORTCUT_MAX_LENGTH) {
    this._allKeyPressSets = [];
  }
  this.requestUpdate();

  detectShortcut.bind(this)();
}
function registerKeyupListener(
  this: KeyboardShortcutsElement,
  e: KeyboardEvent
) {
  const { allKeyPressSets, keyPressSet, isModifierPressed } = handleKeyUp(
    this._allKeyPressSets,
    this._keyPressSet,
    this.isModifierPressed,
    e.key as KeyboardEventKey
  );
  this._allKeyPressSets = allKeyPressSets;
  this._keyPressSet = keyPressSet;
  this.isModifierPressed = isModifierPressed;
  this.requestUpdate();
}

export function createHandleInDaemonListeners(this: KeyboardShortcutsElement) {
  document.addEventListener('keydown', registerKeydownListener.bind(this));

  document.addEventListener('keyup', registerKeyupListener.bind(this));
}
