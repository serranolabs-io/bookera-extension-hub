// lmfao, this is a test test file.
// theres nothing in here

import { describe, it, expect, vi } from 'vitest';
import { modifierKeys } from '../../../shared/src/model/keyboard-shortcuts/keyboard-event-key-type';
import { Formwrapper } from './formwrapper';
import { When } from '@serranolabs.io/shared/keyboard-shortcuts';
import {
  evaluateWhenExpression,
  evaluateWhenExpressionEval,
  insertBooleansInCondition,
  WhenBoolean,
} from './handle-keyboard-shortcut';
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
