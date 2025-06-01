import { z } from 'zod';

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
