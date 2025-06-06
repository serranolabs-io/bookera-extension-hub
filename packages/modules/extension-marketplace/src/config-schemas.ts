import {
  CustomColorPaletteSchema,
  CustomColorPaletteSchemaArray,
  KeyboardShortcutConfigArraySchema,
  KeyboardShortcutConfigSchema,
} from '@serranolabs.io/shared/extension-marketplace';
import { KeyboardShortcut } from '@serranolabs.io/shared/keyboard-shortcuts';
import { html } from 'lit';
import { ZodObject } from 'zod/v4';

export const schemas = [
  CustomColorPaletteSchemaArray,
  CustomColorPaletteSchema,
  KeyboardShortcutConfigArraySchema,
  KeyboardShortcutConfigSchema,
] as const;

const setupSchemaAction = (
  schema: ZodObject,
  renderAction: Function
): { schema: ZodObject; renderAction: Function } => {
  return {
    schema,
    renderAction,
  };
};

const keyboardShortcutAction = (shortcut: KeyboardShortcut) => {
  // Define the action for keyboard shortcuts

  return html`<p>${shortcut.command} => ${shortcut.keys}</p>`;
};

const keyboardShortcutActionArray = (keyboardShortcut: KeyboardShortcut[]) => {
  // Define the action for keyboard shortcuts
  return keyboardShortcut.map((shortcut) => {
    return html`${keyboardShortcutAction(shortcut)}`;
  });
};

const customColorPaletteAction = (customColorPalette) => {
  return html`<p>${customColorPalette.name}</p>`;
};

const customColorPaletteActionArray = (customColorPalettes: any[]) => {
  // Define the action for custom color palettes
  return html`
    ${customColorPalettes.map((customColorPalette: any) => {
      console.log(customColorPaletteAction);
      return html`${customColorPaletteAction(customColorPalette)}`;
    })}
  `;
};

export const actions = [
  customColorPaletteActionArray.bind(this),
  customColorPaletteAction.bind(this),
  keyboardShortcutActionArray.bind(this),
  keyboardShortcutAction.bind(this),
];

export const schemaActions = schemas.map((schema, index: number) => {
  return setupSchemaAction(schema, actions[index]);
});

export const renderConfig = (config: any[]) => {
  const rendered = schemaActions.find((sa) => {
    const { success } = sa.schema.safeParse(config);
    return success;
  });

  if (!rendered) {
    console.error('Unfortunately this config cannot be rendered!');
    return;
  }

  return rendered?.renderAction(config);
};
