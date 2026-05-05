/** RGB components 0–255 */
export type Rgb = { r: number; g: number; b: number };

const DEFAULT_PRIMARY = '#4f46e5';
const DEFAULT_ACCENT = '#7c3aed';

/** Fallbacks when stored values are empty or unparsable (matches default theme). */
const FALLBACK_PRIMARY_RGB: Rgb = { r: 79, g: 70, b: 229 };
const FALLBACK_ACCENT_RGB: Rgb = { r: 124, g: 58, b: 237 };

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function expandShortHex(hex: string): string | null {
  const m = /^#([0-9a-f]{3})$/i.exec(hex.trim());
  if (!m) return null;
  const [a, b, c] = m[1].split('').map((ch) => ch + ch);
  return `#${a}${b}${c}`;
}

function hex6ToRgb(hex: string): Rgb | null {
  const t = hex.trim();
  const full = /^#[0-9a-f]{6}$/i.test(t) ? t : expandShortHex(t);
  if (!full || !/^#[0-9a-f]{6}$/i.test(full)) return null;
  const h = full.slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Resolve any CSS color string to sRGB using the browser (keywords, hsl(), etc.). */
export function parseCssColorToRgb(color: string): Rgb | null {
  const raw = color.trim();
  if (!raw) return null;
  const fromHex = hex6ToRgb(raw);
  if (fromHex) return fromHex;
  if (typeof document === 'undefined') return null;
  const el = document.createElement('span');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  el.style.color = raw;
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  document.body.removeChild(el);
  const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(computed);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** HSL components for Tailwind/shadcn vars: "H S% L%" (no hsl() wrapper). */
export function rgbToHslTriplet({ r, g, b }: Rgb): string {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d > 1e-6) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case R:
        h = ((G - B) / d + (G < B ? 6 : 0)) / 6;
        break;
      case G:
        h = ((B - R) / d + 2) / 6;
        break;
      default:
        h = ((R - G) / d + 4) / 6;
        break;
    }
  }
  const H = Math.round(h * 360);
  const S = Math.round(s * 100);
  const L = Math.round(l * 100);
  return `${H} ${S}% ${L}%`;
}

/** Space-separated channels for `rgb(var(--shop-primary-rgb) / α)` (CSS Color 4 — commas break alpha syntax). */
export function rgbToCssTriplet({ r, g, b }: Rgb): string {
  return `${clamp255(r)} ${clamp255(g)} ${clamp255(b)}`;
}

export function foregroundHslForBackground(bg: Rgb): string {
  return relativeLuminance(bg) > 0.55 ? '222 47% 11%' : '0 0% 100%';
}

/** Light tint background + strong foreground from primary hue. */
export function accentSurfaceFromPrimary(primary: Rgb): { surface: string; fg: string } {
  const hsl = rgbToHslTriplet(primary).split(' ');
  const h = hsl[0];
  return {
    surface: `${h} 100% 97%`,
    fg: `${h} 84% 32%`,
  };
}

export function defaultPrimaryHex(): string {
  return DEFAULT_PRIMARY;
}

export function defaultAccentHex(): string {
  return DEFAULT_ACCENT;
}

export function resolvePrimaryRgb(css: string): Rgb {
  const t = css.trim();
  if (!t) return FALLBACK_PRIMARY_RGB;
  return parseCssColorToRgb(t) ?? hex6ToRgb(defaultPrimaryHex()) ?? FALLBACK_PRIMARY_RGB;
}

export function resolveAccentRgb(css: string): Rgb {
  const t = css.trim();
  if (!t) return FALLBACK_ACCENT_RGB;
  return parseCssColorToRgb(t) ?? hex6ToRgb(defaultAccentHex()) ?? FALLBACK_ACCENT_RGB;
}
