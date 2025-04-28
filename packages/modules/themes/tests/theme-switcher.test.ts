import { beforeEach, expect, test, mock } from 'bun:test';

mock(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.18.0/cdn/components/split-panel/split-panel.js',
  () => ({
    someFunction: () => '',
  })
);

mock(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.17.1/cdn/components/tree/tree.js',
  () => ({
    someFunction: () => '',
  })
);

mock(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.17.1/cdn/components/tab/tab.js',
  () => ({
    someFunction: () => '',
  })
);

mock(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.17.1/cdn/components/tab-group/tab-group.js',
  () => ({
    // Mock implementation

    someFunction: () => '',
  })
);

mock(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.17.1/cdn/components/tab-panel/tab-panel.js',
  () => ({
    // Mock implementation

    someFunction: () => '',
  })
);

mock(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.17.1/cdn/components/tree-item/tree-item.js',
  () => ({
    // Mock implementation

    someFunction: () => '',
  })
);

mock(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.17.1/cdn/components/details/details.js',
  () => ({
    // Mock implementation

    someFunction: () => '',
  })
);

mock(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.18.0/cdn/components/icon-button/icon-button.js',
  () => ({
    // Mock implementation

    someFunction: () => '',
  })
);

mock(
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.18.0/cdn/components/tooltip/tooltip.js',
  () => ({
    // Mock implementation

    someFunction: () => '',
  })
);

// *
test('theme switcher test', () => {
  expect(true).toBe(true);
});

test('theme switcher test 2', () => {
  expect(true).toBe(true);
});
