import type { Brand } from "@/lib/brands";

/**
 * Generates the CSS custom properties that re-theme the shared booking
 * journey (the Booking/Man-and-Van wizard, the deposit/payment page, the
 * confirmation page) for a white-label brand — WITHOUT touching any of
 * those components' own code. Those components use Tailwind's
 * `brand-purple-*`/`brand-green-*` utility classes, which are hardcoded
 * hex values baked into the Tailwind build (see tailwind.config.ts) — they
 * can't be swapped per-request on their own. Instead, `globals.css` has a
 * block of override rules scoped under `[data-brand-theme]` that redirect
 * each of those exact utility classes to a CSS variable; this function
 * computes that variable's value from the brand's own two colours
 * (`colors.primary`/`colors.primaryDark` stand in for the purple ramp's
 * 800/900 steps, `colors.accent`/`colors.accentLight` for the green ramp's
 * 600/500 steps) and generates the rest of the tint/shade ramp around them.
 *
 * Usage: on the shared booking journey's layout, wrap children in a div
 * with `data-brand-theme` (only when `brand.slug !== "ample"` — Ample's
 * own flow is untouched) and spread `brandThemeCssVars(brand)` into its
 * `style` prop.
 */
export function brandThemeCssVars(brand: Brand): Record<string, string> {
  const purple = buildRamp(brand.colors.primary, { 800: brand.colors.primary, 900: brand.colors.primaryDark });
  const green = buildRamp(brand.colors.accent, { 600: brand.colors.accent, 500: brand.colors.accentLight });

  const vars: Record<string, string> = {};
  for (const [shade, hex] of Object.entries(purple)) vars[`--bp-${shade}`] = hex;
  for (const [shade, hex] of Object.entries(green)) vars[`--bg-${shade}`] = hex;
  return vars;
}

const PURPLE_LIGHTNESS: Record<number, number> = { 50: 97, 100: 93, 200: 86, 300: 76, 400: 62, 500: 50, 600: 42, 700: 36, 800: 30, 900: 25, 950: 15 };
const GREEN_LIGHTNESS: Record<number, number> = { 50: 97, 100: 92, 200: 84, 500: 55, 600: 42, 700: 32, 800: 26 };

function buildRamp(anchorHex: string, fixed: Record<number, string>): Record<number, string> {
  const { h, s } = hexToHsl(anchorHex);
  const isGreenRamp = 600 in fixed;
  const curve = isGreenRamp ? GREEN_LIGHTNESS : PURPLE_LIGHTNESS;
  const ramp: Record<number, string> = {};
  for (const shade of Object.keys(curve).map(Number)) {
    ramp[shade] = fixed[shade] ?? hslToHex(h, s, curve[shade]);
  }
  return ramp;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
