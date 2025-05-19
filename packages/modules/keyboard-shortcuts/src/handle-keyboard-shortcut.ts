import {
  KeyboardEventKey,
  KeyboardShortcut,
  Operator,
  operators,
  When,
} from '@serranolabs.io/shared/keyboard-shortcuts';
import { handleKeyDownAndSubmit } from './formwrapper';
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

function traversewebComponentTree(this: KeyboardShortcutsElement): {
  webComponentTree: HTMLElement[];
  activeElement: HTMLElement;
} {
  let activeElement = document.activeElement;

  // this will give me focused tree
  let webComponentTree = [];
  while (activeElement?.shadowRoot) {
    // todo if element is focusable, get when type in array
    if (activeElement.isFocusable) {
      activeElement.setFocus(false);
      webComponentTree.unshift(activeElement as HTMLElement);
    }

    activeElement = activeElement.shadowRoot.activeElement;
  }

  return {
    webComponentTree,
    activeElement: activeElement as HTMLElement,
  };
}

export type WhenBoolean = When | boolean;

export function evaluateWhenExpressionEval(conditions: WhenBoolean[]): boolean {
  return eval(conditions.join(' '));
}

export function insertBooleansInCondition(
  conditions: When[],
  webComponentTree: When[]
): WhenBoolean[] {
  return conditions.map((condition: When) => {
    if (operators.includes(condition as Operator)) {
      return condition;
    } else {
      const foundCondition = webComponentTree.find(
        (webComponentTreeCondition: When) => {
          return webComponentTreeCondition === condition;
        }
      );

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
): {
  isMatched: boolean;
  webComponentTree: HTMLElement[];
  activeElement: HTMLElement;
} {
  const { webComponentTree, activeElement } =
    traversewebComponentTree.bind(this)();

  this._context = webComponentTree.map((element: HTMLElement) => {
    return element.getWhen();
  });

  const whenBoolean: WhenBoolean[] = insertBooleansInCondition.bind(this)(
    when,
    this._context
  );
  const isMatched = evaluateWhenExpressionEval.bind(this)(whenBoolean);

  return { isMatched, webComponentTree, activeElement };
}

// [true, true, false]
// checks if the shortcut could possibly be a match & checks if it is a match
export function matchCommand(
  currentShortcut: KeyboardEventKey[][],
  shortcutKeys: KeyboardEventKey[][]
): { match: boolean; hasPotentialMatch: boolean } {
  let match = currentShortcut.length === shortcutKeys.length ? true : false;

  const hasPotentialMatch = currentShortcut.every(
    (set: KeyboardEventKey[], setIndex: number) => {
      const matchedCharacter = set.every(
        (key: KeyboardEventKey, arrayIndex: number) => {
          return key === shortcutKeys[setIndex]?.[arrayIndex];
        }
      );
      if (
        !shortcutKeys[setIndex] ||
        set.length !== shortcutKeys[setIndex].length ||
        !matchedCharacter
      ) {
        match = false;
      }

      return matchedCharacter;
    }
  );

  return { match, hasPotentialMatch };
}

function detectShortcut(this: KeyboardShortcutsElement, e: KeyboardEvent) {
  let hasPotentialMatches = false;
  let doesNotMatchWhen = false;
  this._keyboardShortcuts.forEach((shortcut: KeyboardShortcut) => {
    const { match, hasPotentialMatch } = matchCommand(
      this._allKeyPressSets,
      shortcut.keys
    );

    if (hasPotentialMatch) {
      hasPotentialMatches = hasPotentialMatch;
    }

    if (match) {
      const { isMatched, webComponentTree, activeElement } =
        matchCondition.bind(this)(shortcut.when as When[]);

      if (isMatched) {
        // @ts-ignore
        webComponentTree[0].applyCommand(shortcut.command);
        this._commandsRan.push(shortcut.command);
        e.preventDefault();
        this.requestUpdate();
        this._allKeyPressSets = [];
      } else {
        doesNotMatchWhen = true;
      }
    }
  });

  if (!hasPotentialMatches || (doesNotMatchWhen && !hasPotentialMatches)) {
    this._allKeyPressSets = [];
  }
}

function registerKeydownListener(
  this: KeyboardShortcutsElement,
  e: KeyboardEvent
) {
  const { allKeyPressSets, modifiers } = handleKeyDownAndSubmit(
    e,
    this._allKeyPressSets,
    this._modifiers
  );

  this._allKeyPressSets = allKeyPressSets;
  this._modifiers = modifiers;
  this.requestUpdate();

  detectShortcut.bind(this)(e);
}

export function createHandleInDaemonListeners(this: KeyboardShortcutsElement) {
  document.addEventListener('keydown', registerKeydownListener.bind(this));
}
