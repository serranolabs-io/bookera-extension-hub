import {
  CustomColorPaletteSchema,
  CustomColorPaletteSchemaArray,
  ExtensionDownloadEndpoints,
  KeyboardShortcutConfigArraySchema,
  KeyboardShortcutConfigSchema,
} from '@serranolabs.io/shared/extension-marketplace';
import { KeyboardShortcut } from '@serranolabs.io/shared/keyboard-shortcuts';
import { notify } from '@serranolabs.io/shared/lit';
import { sendGlobalEvent } from '@serranolabs.io/shared/util';
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
  action: Function
): { schema: ZodObject; action: Function } => {
  return {
    schema,
    action,
  };
};

const keyboardShortcutAction = (shortcut: KeyboardShortcut) => {
  // Define the action for keyboard shortcuts

  return html`<p>${shortcut.command} => ${shortcut.keys}</p>`;
};

const keyboardShortcutActionArray = (keyboardShortcut: KeyboardShortcut[]) => {
  // Define the action for keyboard shortcuts
  return keyboardShortcut.map(shortcut => {
    return html`${keyboardShortcutAction(shortcut)}`;
  });
};

const renderColorCol = (colors: any) => {
  return html`
    <div class="col">
      <div class="cols">
        <div class="color-box">
          ${colors.baseColors.map((color: string) => {
            return html`<p>${color}</p>`;
          })}
        </div>
        <div class="color-box">
          ${colors.baseColors.map((color: string) => {
            return html`<p>${color}</p>`;
          })}
        </div>
      </div>
    </div>
  `;
};

const customColorPaletteAction = customColorPalette => {
  return html`
    <div class="palette">
      <p>${customColorPalette.name}</p>
      <div class="cols">
        ${renderColorCol(customColorPalette.lightMode)}
        ${renderColorCol(customColorPalette.darkMode)}
      </div>
    </div>
  `;
};

const customColorPaletteActionArray = (customColorPalettes: any[]) => {
  // Define the action for custom color palettes
  return html`
    ${customColorPalettes.map((customColorPalette: any) => {
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

function sendThemesConfig(config: any) {
  sendGlobalEvent(ExtensionDownloadEndpoints.themes, config);
}

function sendKeyboardShortcutsConfig() {
  // sendGlobalEvent(ExtensionDownloadEndpoints.themes, config);
  notify(
    'Feature is not fully complete yet! please report this if found',
    'warning'
  );
}

export const sendActions = [
  sendThemesConfig.bind(this),
  sendThemesConfig.bind(this),
  sendKeyboardShortcutsConfig.bind(this),
  sendKeyboardShortcutsConfig.bind(this),
];

export const schemaSendActions = schemas.map((schema, index: number) => {
  return setupSchemaAction(schema, sendActions[index]);
});

export const schemaActions = schemas.map((schema, index: number) => {
  return setupSchemaAction(schema, actions[index]);
});

export const renderConfig = (config: any[]) => {
  const rendered = schemaActions.find(sa => {
    const { success } = sa.schema.safeParse(config);
    return success;
  });

  if (!rendered) {
    console.error('Unfortunately this config cannot be rendered!');
    return;
  }

  return rendered?.action(config);
};
