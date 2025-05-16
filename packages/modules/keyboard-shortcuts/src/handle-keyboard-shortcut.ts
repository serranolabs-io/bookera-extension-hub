import {
  KeyboardEventKey,
  KeyboardShortcut,
  Operator,
  operators,
  When,
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

// when clicking anywhere, please apply traverse focus tree

function traverseFocusTree(this: KeyboardShortcutsElement): {
  focusTree: When[];
  activeElement: HTMLElement;
} {
  let activeElement = document.activeElement;

  // this will give me focused tree
  let focusTree = [];
  while (activeElement?.shadowRoot) {
    // todo if element is focusable, get when type in array
    if (activeElement.isFocusable) {
      focusTree.unshift(activeElement.getFocus());

      // set UN FOCUS on element
      activeElement.setFocus(false);
    }

    activeElement = activeElement.shadowRoot.activeElement;
  }

  return {
    focusTree,
    activeElement: activeElement as HTMLElement,
  };
}

export type WhenBoolean = When | boolean;

export function evaluateWhenExpressionEval(conditions: WhenBoolean[]): boolean {
  return eval(conditions.join(' '));
}

export function insertBooleansInCondition(
  conditions: When[],
  focusTree: When[]
): WhenBoolean[] {
  return conditions.map((condition: When) => {
    if (operators.includes(condition as Operator)) {
      return condition;
    } else {
      const foundCondition = focusTree.find((focusTreeCondition: When) => {
        return focusTreeCondition === condition;
      });

      if (foundCondition) {
        return true;
      } else {
        return false;
      }
    }
  });
}

function matchCondition(
  this: KeyboardShortcutsElement,
  when: When[]
): { isMatched: boolean; activeElement: HTMLElement } {
  const { focusTree, activeElement } = traverseFocusTree.bind(this)();

  const whenBoolean: WhenBoolean[] = insertBooleansInCondition.bind(this)(
    when,
    focusTree
  );
  const isMatched = evaluateWhenExpressionEval.bind(this)(whenBoolean);

  return { isMatched, activeElement };
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
      const { isMatched, activeElement } = matchCondition.bind(this)(
        shortcut.when as When[]
      );

      if (isMatched) {
        activeElement.applyCommand(shortcut.command);

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
