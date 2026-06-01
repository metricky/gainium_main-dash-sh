// Utility function to get CSS custom properties as a 6-digit hex color.
// Supports hex (#rgb/#rrggbb), oklch(), oklab(), hsl()/hsla(), rgb()/rgba(), and named colors.
export const getCSSVar = (varName: string, fallback: string = '#000000') => {
  try {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();

    if (!raw) return fallback;

    // Handle OKLCH directly if the browser returns it as-is
    if (/^oklch\(/i.test(raw)) {
      const hex = oklchStringToHex(raw);
      if (hex) {
        return hex;
      }
    }

    // If already hex, normalize and return
    if (/^#[0-9A-Fa-f]{6}$/.test(raw)) return raw.toLowerCase();
    if (/^#[0-9A-Fa-f]{3}$/.test(raw)) {
      const h = raw.slice(1);
      return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
    }

    // Convert any CSS color to computed rgb/rgba using a temporary element.
    // This covers oklch()/oklab()/hsl()/rgb()/named colors, etc.
    const tmp = document.createElement('div');
    tmp.style.color = 'transparent';
    // Assign as a normal color property so the engine resolves it to sRGB
    tmp.style.color = raw;
    document.body.appendChild(tmp);
    const computed = getComputedStyle(tmp).color; // e.g. "rgb(255, 0, 0)" or "rgb(255 0 0 / 0.5)"
    document.body.removeChild(tmp);

    const hex = rgbaStringToHex(computed);
    // Debug log to help diagnose color resolution issues
    return hex ?? fallback;
  } catch (error) {
    console.warn('Error getting CSS variable:', varName, error);
    return fallback;
  }
};

// Parse a computed rgb/rgba string (CSS Color 4 compatible) to 6-digit hex (#rrggbb).
// Examples supported: "rgb(255, 0, 0)", "rgba(255, 0, 0, 0.5)", "rgb(255 0 0 / 1)".
function rgbaStringToHex(input: string): string | null {
  if (!input) return null;

  // Normalize to use commas for splitting while keeping numbers and dot
  // Match CSS Color 4 formats: rgb(r g b / a) or rgb(r, g, b) etc.
  const re =
    /rgba?\(\s*([0-9.]+)\s*[ ,]+\s*([0-9.]+)\s*[ ,]+\s*([0-9.]+)(?:\s*[/ ,]+\s*([0-9.]+))?\s*\)/i;
  const m = input.match(re);
  if (!m) return null;

  const r = clamp255(Number(m[1]));
  const g = clamp255(Number(m[2]));
  const b = clamp255(Number(m[3]));
  // const a = m[4] !== undefined ? Number(m[4]) : 1; // alpha not used for hex rgb

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clamp255(n: number): number {
  if (!isFinite(n) || isNaN(n)) return 0;
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toHex(n: number): string {
  return n.toString(16).padStart(2, '0');
}

// Convert an OKLCH CSS string to #rrggbb hex using Björn Ottosson's reference implementation
// Accepts forms like: oklch(0.7 0.15 140) or with units: oklch(70% 0.15 140deg) and optional alpha
function oklchStringToHex(input: string): string | null {
  try {
    // Basic tolerant parse; doesn't handle 'none' values
    const matchRes = input
      .trim()
      .match(
        /oklch\(\s*([^\s/]+)\s+([^\s/]+)\s+([^\s/)]+)(?:\s*\/\s*([^\s)]+))?\s*\)/i
      );
    if (!matchRes) return null;

    const L = parseL(matchRes[1]);
    const C = parseC(matchRes[2]);
    const hDeg = parseHue(matchRes[3]);

    if (L == null || C == null || hDeg == null) return null;

    // Convert OKLCH -> OKLab
    const hRad = (hDeg * Math.PI) / 180;
    const a = C * Math.cos(hRad);
    const b = C * Math.sin(hRad);

    // OKLab -> linear sRGB
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;

    const l = l_ * l_ * l_;
    const mLin = m_ * m_ * m_;
    const sLin = s_ * s_ * s_;

    let r = +4.0767416621 * l - 3.3077115913 * mLin + 0.2309699292 * sLin;
    let g = -1.2684380046 * l + 2.6097574011 * mLin - 0.3413193965 * sLin;
    let b2 = -0.0041960863 * l - 0.7034186147 * mLin + 1.707614701 * sLin;

    // Gamma compand to sRGB and clamp
    r = srgbCompandAndClamp(r);
    g = srgbCompandAndClamp(g);
    b2 = srgbCompandAndClamp(b2);

    return `#${toHex(Math.round(r * 255))}${toHex(Math.round(g * 255))}${toHex(
      Math.round(b2 * 255)
    )}`;
  } catch (_) {
    return null;
  }
}

function srgbCompandAndClamp(x: number): number {
  // Clamp linear light to [0, 1] before companding to avoid NaNs from pow on negatives
  const cl = Math.min(1, Math.max(0, x));
  return cl <= 0.0031308 ? 12.92 * cl : 1.055 * Math.pow(cl, 1 / 2.4) - 0.055;
}

function parseL(token: string): number | null {
  if (token.endsWith('%')) {
    const v = Number(token.slice(0, -1));
    return isFinite(v) ? v / 100 : null;
  }
  const v = Number(token);
  return isFinite(v) ? v : null;
}

function parseC(token: string): number | null {
  // CSS oklch chroma is unitless, but tolerate percentages by mapping 100% -> 1
  if (token.endsWith('%')) {
    const v = Number(token.slice(0, -1));
    return isFinite(v) ? v / 100 : null;
  }
  const v = Number(token);
  return isFinite(v) ? v : null;
}

function parseHue(token: string): number | null {
  const t = token.toLowerCase();
  if (t.endsWith('deg')) {
    const v = Number(t.slice(0, -3));
    return isFinite(v) ? normalizeDegrees(v) : null;
  }
  if (t.endsWith('rad')) {
    const v = Number(t.slice(0, -3));
    return isFinite(v) ? normalizeDegrees((v * 180) / Math.PI) : null;
  }
  if (t.endsWith('grad')) {
    const v = Number(t.slice(0, -4));
    return isFinite(v) ? normalizeDegrees(v * (9 / 10)) : null;
  }
  if (t.endsWith('turn')) {
    const v = Number(t.slice(0, -4));
    return isFinite(v) ? normalizeDegrees(v * 360) : null;
  }
  const v = Number(t);
  return isFinite(v) ? normalizeDegrees(v) : null;
}

function normalizeDegrees(d: number): number {
  let res = d % 360;
  if (res < 0) res += 360;
  return res;
}

// Helper function to interpolate between colors (exact copy from CodePen)
export const interpolateColors = (
  fromHexString: string,
  toHexString: string
): string[] => {
  const rgbaFromHex = (value: string) => {
    const rgba = {
      r: parseInt(value.slice(1, 3), 16),
      g: parseInt(value.slice(3, 5), 16),
      b: parseInt(value.slice(5, 7), 16),
      a: 1,
    };
    return rgba;
  };

  const fromRgba = rgbaFromHex(fromHexString);
  const toRgba = rgbaFromHex(toHexString);
  const numberOfSteps = 12; // Exact match to CodePen
  const results: string[] = [];
  const step = 1 / numberOfSteps;

  for (let t = step; t < 1 - step; t += step) {
    const r = Math.round(fromRgba.r + (toRgba.r - fromRgba.r) * t)
      .toString(16)
      .padStart(2, '0');
    const g = Math.round(fromRgba.g + (toRgba.g - fromRgba.g) * t)
      .toString(16)
      .padStart(2, '0');
    const b = Math.round(fromRgba.b + (toRgba.b - fromRgba.b) * t)
      .toString(16)
      .padStart(2, '0');

    results.push('#' + r + g + b);
  }

  return results;
};
