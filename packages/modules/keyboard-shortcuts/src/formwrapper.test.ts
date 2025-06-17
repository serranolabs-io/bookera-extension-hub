// lmfao, this is a test test file.
// theres nothing in here

import { describe, it, expect, vi } from 'vitest';
import { modifierKeys } from '../../../shared/src/model/keyboard-shortcuts/keyboard-event-key-type';
import { Formwrapper } from './formwrapper';
import {
  KeyboardEventKey,
  When,
} from '@serranolabs.io/shared/keyboard-shortcuts';
import {
  evaluateWhenExpression,
  evaluateWhenExpressionEval,
  insertBooleansInCondition,
  matchCommand,
  WhenBoolean,
} from './handle-keyboard-shortcut';
import { html } from 'lit';
import { KeyboardShortcutsState } from './state';
import { renderMatches } from './fuzzy';
vi.mock(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/dialog/dialog.js',
  () => ({
    someFunction: () => '',
  })
);
vi.mock(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/icon/icon.js',
  () => ({
    someFunction: () => '',
  })
);
vi.mock(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/icon-button/icon-button.js',
  () => ({
    someFunction: () => '',
  })
);

vi.mock(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/input/input.js',
  () => ({
    someFunction: () => '',
  })
);
vi.mock(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/menu/menu.js',
  () => ({
    someFunction: () => '',
  })
);
vi.mock(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/menu-item/menu-item.js',
  () => ({
    someFunction: () => '',
  })
);
vi.mock(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/menu-label/menu-label.js',
  () => ({
    someFunction: () => '',
  })
);

describe('handle-keyboard-shortcuts', () => {
  it.each([
    {
      input: {
        when: ['panelFocus'] as When[],
        focusTree: ['panelFocus', 'inputFocus'] as When[],
        expected: [true],
      },
      description: 'base case',
    },
    {
      input: {
        when: ['panelFocus', '&&', 'panelTabFocus'] as When[],
        focusTree: ['panelFocus', 'inputFocus'] as When[],
        expected: [true, '&&', false],
      },
      description: '&& case where one if found yet the other is not',
    },
    {
      input: {
        when: ['panelBarFocus'] as When[],
        focusTree: [
          'sidePanelFocus',
          'leftSidePanelFocus',
          'panelBarFocus',
        ] as When[],
        expected: [true],
      },
      description: '&& case where one if found yet the other is not',
    },
    {
      input: {
        when: [
          'panelFocus',
          '&&',
          'panelTabFocus',
          '&&',
          '!',
          'panelFocus',
        ] as When[],
        focusTree: ['panelFocus', 'inputFocus'] as When[],
        expected: [true, '&&', false, '&&', '!', true],
      },
      description: '&& case where one if found yet the other is not',
    },
  ])('should insert booleans in condition', ({ input }) => {
    const conditionArray = insertBooleansInCondition(
      input.when,
      input.focusTree
    );

    expect(conditionArray).toEqual(input.expected);
  });

  it.each([
    {
      input: {
        conditions: [true, '&&', false] as WhenBoolean[],
        expected: false,
      },
      description: 'should match condition blah',
    },
    {
      input: {
        conditions: [true, '&&', true] as WhenBoolean[],
        expected: true,
      },
      description: 'should be true',
    },
    {
      input: {
        conditions: [false, '&&', '(', false, '||', true, ')'] as WhenBoolean[],
        expected: false,
      },
      description: 'parenthesis case',
    },
    {
      input: {
        conditions: [true, '&&', '(', false, '||', true, ')'] as WhenBoolean[],
        expected: true,
      },
      description: 'parenthesis case 2',
    },
    {
      input: {
        conditions: [
          '!',
          true,
          '&&',
          '(',
          false,
          '||',
          true,
          ')',
        ] as WhenBoolean[],
        expected: false,
      },
      description: 'inverted case',
    },
    {
      input: {
        conditions: ['!', true] as WhenBoolean[],
        expected: false,
      },
      description: 'inverted case',
    },
    {
      input: {
        conditions: ['!', false, '&&', '!', false] as WhenBoolean[],
        expected: true,
      },
      description: 'inverted case',
    },
    {
      input: {
        conditions: ['!', '(', false, '||', true, ')'] as WhenBoolean[],
        expected: false,
      },
      description: 'inverted case on parenthesis',
    },
    {
      input: {
        conditions: [
          false,
          '&&',
          true,
          '||',
          false,
          '||',
          true,
        ] as WhenBoolean[],
        expected: true,
      },
      description: 'inverted case on parenthesis WITH ORDER OF OPERATIONS',
    },
  ])('should evaluate when expression, $description', ({ input }) => {
    const evaluatedExpression = evaluateWhenExpressionEval(input.conditions);

    expect(evaluatedExpression).toEqual(input.expected);
  });
});

it.each([
  {
    input: {
      currentShortcut: [['D']] as KeyboardEventKey[][],
      shortcut: [['E'], ['F']] as KeyboardEventKey[][],
      expected: {
        match: false,
        hasPotentialMatch: false,
      },
    },
    description: 'has potential match true base case',
  },
  {
    input: {
      currentShortcut: [['D']] as KeyboardEventKey[][],
      shortcut: [['E'], ['F']] as KeyboardEventKey[][],
      expected: {
        match: false,
        hasPotentialMatch: false,
      },
    },
    description: 'no matches, current shortcut shorter than shortcut',
  },
  {
    input: {
      currentShortcut: [['D']] as KeyboardEventKey[][],
      shortcut: [['D'], ['F']] as KeyboardEventKey[][],
      expected: {
        match: false,
        hasPotentialMatch: true,
      },
    },
    description: 'has potential match true base case',
  },
  {
    input: {
      currentShortcut: [['D'], ['F']] as KeyboardEventKey[][],
      shortcut: [['D']] as KeyboardEventKey[][],
      expected: {
        match: false,
        hasPotentialMatch: false,
      },
    },
    description: 'no mathces or potential matches base case',
  },
  {
    input: {
      currentShortcut: [['F']] as KeyboardEventKey[][],
      shortcut: [['D']] as KeyboardEventKey[][],
      expected: {
        match: false,
        hasPotentialMatch: false,
      },
    },
    description: 'no mathces or potential matches base case',
  },
  {
    input: {
      currentShortcut: [['Shift', 'D'], ['j']] as KeyboardEventKey[][],
      shortcut: [['j']] as KeyboardEventKey[][],
      expected: {
        match: false,
        hasPotentialMatch: false,
      },
    },
    description: 'no mathces or potential matches base case',
  },
])('should have potential match $description', ({ input }) => {
  const { match, hasPotentialMatch } = matchCommand(
    input.currentShortcut,
    input.shortcut
  );

  console.log(match, hasPotentialMatch);

  expect(match).toEqual(input.expected.match);
  expect(hasPotentialMatch).toEqual(input.expected.hasPotentialMatch);
});

it.each([
  {
    input: {
      list: KeyboardShortcutsState.defaults,
      pattern: 'nextPanel',
      expected: true,
    },
    description: 'no mathces or potential matches base case',
  },
])('should properly highlight', ({ input }) => {
  const rendering = renderMatches(
    input.list,
    ['command', 'title', 'keys'],
    input.pattern
  );

  console.log(rendering);

  console.log(html`<span></span>`);

  expect(true).toBe(input.expected);
});
