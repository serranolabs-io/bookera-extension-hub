// lmfao, this is a test test file.
// theres nothing in here

import { describe, it, expect, vi } from 'vitest';
import { modifierKeys } from '../../../shared/src/model/keyboard-shortcuts/keyboard-event-key-type';
import { Formwrapper } from './formwrapper';
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

const getRandomKey = () => {
  return Math.trunc(Math.random() * modifierKeys.length);
};

const acceptanceTests = [
  { input: ['a'], description: 'simple characters' },
  { input: ['a', 'b'], description: 'simple characters' },
  {
    input: [
      modifierKeys[getRandomKey()],
      'b',
      modifierKeys[getRandomKey()],
      'd',
    ],
    description: 'both modifier keys with characters',
  },
  {
    input: [modifierKeys[getRandomKey()], 'b'],
    description: 'modifier keys with characters, first key is modifier',
  },
  {
    input: [modifierKeys[getRandomKey()], 'b', 'e'],
    description: 'modifier keys with characters, first key is modifier',
  },
  {
    input: ['b', modifierKeys[getRandomKey()], 'e'],
    description: 'modifier keys with characters, last key is modifier',
  },
];

const canStillTypeTests = [
  {
    input: [],
    description: '0 length',
  },
  {
    input: ['b'],
    description: 'one key',
  },
  {
    input: [modifierKeys[getRandomKey()], 'b'],
    description: 'modifier key with one character, but can still type',
  },
  {
    input: [modifierKeys[getRandomKey()], 'c', modifierKeys[getRandomKey()]],
    description:
      'modifier key set, with another modifier key, can still accept one more',
  },
];

describe('Example Test', () => {
  it.each(acceptanceTests)(
    'should not accept a new character for $description',
    ({ input }) => {
      const fm = new Formwrapper();
      //   expect(fm.isValidKeyCombo(input)).toBe(true);
    }
  );
  it.each(canStillTypeTests)('can still type for $description', ({ input }) => {
    const fm = new Formwrapper();
    // expect(fm.canAcceptNewCharacter(input)).toBe(true);
  });
});
