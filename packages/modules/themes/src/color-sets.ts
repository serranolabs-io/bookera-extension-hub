import { ColorMode } from './theme-switcher-element';

export const shadePercents = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
];

export const primaryColorName = [
  '',
  '',
  '',
  '',
  '',
  'Light hover color',
  'Dark hover color',
  '',
  '',
  '',
  '',
];

export const baseColorNames = [
  'Panel background',
  'lighter detail',
  'Panel tab trough',
  'Tabs & side panel',
  'Panel Bar',
  'lighter detail',
  'dark hover color',
  'heading text color',
  'paragraph text color',
  '',
  '',
];

export const BaseColor = 'Base';
export const PrimaryColor = 'Primary';
export enum SystemColorSets {
  Gray = 'gray',
  Slate = 'slate',
  Zinc = 'zinc',
  Neutral = 'neutral',
}
export class ColorSet {
  name: SystemColorSets;
  colors: string[];

  constructor(name: SystemColorSets, colors: string[]) {
    this.name = name;
    this.colors = colors;
  }

  applyColorWithMode(colorMode: ColorMode) {
    for (let i = 0; i < this.colors.length; i++) {
      document.documentElement.style.setProperty(
        `--slate-${shadePercents[i]}`,
        colorMode === 'Dark'
          ? this.colors[this.colors.length - 1 - i]
          : this.colors[i]
      );
    }
  }

  /**
   * Generates 10%-100% darker/lighter shades of a hex color using HSL.
   * @param {string} hex - Input color (e.g., "#C07EFF").
   * @returns {Object} - { darker: {10:hex, 20:hex, ...}, lighter: {...} }
   */
  private static GenerateFullShades(hex: string) {
    // Convert HEX to RGB
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    // Convert RGB to HSL
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h: number,
      s: number,
      l: number = (max + min) / 2;

    if (max === min) {
      h = s = 0; // Achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      // @ts-ignore
      h /= 6;
    }

    type Shades = {
      [key: string]: string; // Allows any string key with string values
    };
    interface ColorShades {
      darker: Shades;
      lighter: Shades;
    }
    // Generate shades by adjusting lightness
    const shades: ColorShades = { darker: {}, lighter: {} };
    for (let percent = 10; percent <= 100; percent += 10) {
      // Darken (reduce lightness)
      const darkL = Math.max(0, l - (l * percent) / 100);
      shades.darker[percent] = ColorSet.HslToHex(h, s, darkL);

      // Lighten (increase lightness)
      const lightL = Math.min(1, l + ((1 - l) * percent) / 100);
      shades.lighter[percent] = ColorSet.HslToHex(h, s, lightL);
    }

    return shades;
  }

  // Helper: HSL to HEX
  private static HslToHex(h: number, s: number, l: number) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // Achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = (x) =>
      Math.round(x * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Example usage:
  static SetPrimaryColor(newColor: string) {
    const colors = this.GenerateFullShades(newColor);

    document.documentElement.style.setProperty(
      '--primary-950',
      colors.darker['50']
    );
    document.documentElement.style.setProperty(
      '--primary-900',
      colors.darker['40']
    );
    document.documentElement.style.setProperty(
      '--primary-800',
      colors.darker['30']
    );
    document.documentElement.style.setProperty(
      '--primary-700',
      colors.darker['20']
    );
    document.documentElement.style.setProperty(
      '--primary-600',
      colors.darker['10']
    );
    document.documentElement.style.setProperty('--primary-500', newColor);
    document.documentElement.style.setProperty(
      '--primary-400',
      colors.lighter['10']
    );
    document.documentElement.style.setProperty(
      '--primary-300',
      colors.lighter['20']
    );
    document.documentElement.style.setProperty(
      '--primary-200',
      colors.lighter['30']
    );
    document.documentElement.style.setProperty(
      '--primary-100',
      colors.lighter['40']
    );
    document.documentElement.style.setProperty(
      '--primary-50',
      colors.lighter['50']
    );

    document.documentElement.style.setProperty('--primary', newColor);
  }

  static FixProperty(name: string): string {
    name = name.toLowerCase();
    name = name === 'base' ? 'slate' : name;
    return name;
  }

  static SetStyle(name: string, shade: number, value: string) {
    name = ColorSet.FixProperty(name);

    document.documentElement.style.setProperty(`--${name}-${shade}`, value);

    if (name === 'primary' && shade === 500) {
      document.documentElement.style.setProperty(`--primary`, value);
    }
  }

  static SwapModes(newColorMode: ColorMode, onStart?: boolean) {
    const styles = getComputedStyle(document.body);

    // const media = window.matchMedia('(prefers-color-scheme: dark)');

    // * this prevents multiple rerenders in the component
    const scheme = document.documentElement.getAttribute('prefers-scheme');
    if (onStart) {
      // if we are starting off, set the scheme attribute
      if (newColorMode === 'Dark' && scheme === null) {
        document.documentElement.setAttribute('prefers-scheme', 'dark');
      } else if (newColorMode === 'Light' && scheme === null) {
        document.documentElement.setAttribute('prefers-scheme', 'light');
        // do not go invert colors
        return;
      } else {
        return;
      }
    }

    // doing regular colors
    const values = [];
    for (let i = 0; i < shadePercents.length; i++) {
      values.push(styles.getPropertyValue(`--slate-${shadePercents[i]}`));
    }

    for (let i = 0; i < values.length / 2; i++) {
      document.documentElement.style.setProperty(
        `--slate-${shadePercents[i]}`,
        values[values.length - 1 - i]
      );

      document.documentElement.style.setProperty(
        `--slate-${shadePercents[values.length - 1 - i]}`,
        values[i]
      );
    }
  }
}

export const ColorSets: Map<SystemColorSets, ColorSet> = new Map();

ColorSets.set(
  SystemColorSets.Gray,
  new ColorSet(SystemColorSets.Gray, [
    '#f9fafb',
    '#f3f4f6',
    '#e5e7eb',
    '#d1d5db',
    '#9ca3af',
    '#6b7280',
    '#4b5563',
    '#374151',
    '#1f2937',
    '#111827',
    '#0a0f14', // 950 shade added
  ])
);

ColorSets.set(
  SystemColorSets.Slate,
  new ColorSet(SystemColorSets.Slate, [
    '#f8fafc',
    '#f1f5f9',
    '#e2e8f0',
    '#cbd5e1',
    '#94a3b8',
    '#64748b',
    '#475569',
    '#334155',
    '#1e293b',
    '#0f172a',
    '#020617', // 950 shade added
  ])
);

ColorSets.set(
  SystemColorSets.Zinc,
  new ColorSet(SystemColorSets.Zinc, [
    '#fafafa',
    '#f4f4f5',
    '#e4e4e7',
    '#d4d4d8',
    '#a3a3a8',
    '#737373',
    '#525252',
    '#404040',
    '#262626',
    '#171717',
    '#0c0c0c', // 950 shade added
  ])
);

ColorSets.set(
  SystemColorSets.Neutral,
  new ColorSet(SystemColorSets.Neutral, [
    '#fafaf9',
    '#f5f5f4',
    '#e7e5e4',
    '#d6d3d1',
    '#a8a29e',
    '#78716c',
    '#57534e',
    '#44403c',
    '#292524',
    '#1c1917',
    '#110f0c', // 950 shade added
  ])
);
