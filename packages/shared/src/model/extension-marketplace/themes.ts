import { z } from 'zod';
import { WhensSchema } from '../keyboard-shortcuts/model';

const ModeSchema = z.object({
  mode: z.enum(['Dark', 'Light']),
  primaryColors: z.array(z.string()),
  baseColors: z.array(z.string()),
});

export const CustomColorPaletteSchema = z.object({
  darkMode: ModeSchema,
  lightMode: ModeSchema,
  name: z.string(),
  id: z.string(),
});
export const CustomColorPaletteSchemaArray = z.array(CustomColorPaletteSchema);

export const KeyboardShortcutConfigSchema = z.object({
  command: z.string(),
  keys: z.array(z.array(z.string())), // Assuming KeyboardEventKey is a string type
  when: WhensSchema,
  title: z.string(),
});

export const KeyboardShortcutConfigArraySchema = z.array(KeyboardShortcutConfigSchema);
