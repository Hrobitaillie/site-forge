/**
 * OKLCH Color Utilities
 *
 * Handles conversion between OKLCH, sRGB, and Hex color formats.
 * OKLCH is a perceptually uniform color space ideal for design systems.
 */

/**
 * Parse OKLCH string to object
 * @param {string} str - OKLCH string like "oklch(0.55 0.25 250)"
 * @returns {{ l: number, c: number, h: number } | null}
 */
export function parseOklch(str) {
    if (!str || typeof str !== 'string') return null;

    const match = str.match(/oklch\s*\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/i);
    if (!match) return null;

    return {
        l: parseFloat(match[1]),
        c: parseFloat(match[2]),
        h: parseFloat(match[3]),
    };
}

/**
 * Compose OKLCH object to string
 * @param {{ l: number, c: number, h: number }} color
 * @returns {string}
 */
export function composeOklch({ l, c, h }) {
    const lRound = Math.round(l * 100) / 100;
    const cRound = Math.round(c * 1000) / 1000;
    const hRound = Math.round(h);

    return `oklch(${lRound} ${cRound} ${hRound})`;
}

/**
 * Convert OKLCH to OKLab
 */
function oklchToOklab(l, c, h) {
    const hRad = (h * Math.PI) / 180;
    return {
        L: l,
        a: c * Math.cos(hRad),
        b: c * Math.sin(hRad),
    };
}

/**
 * Convert OKLab to OKLCH
 */
function oklabToOklch(L, a, b) {
    const c = Math.sqrt(a * a + b * b);
    let h = (Math.atan2(b, a) * 180) / Math.PI;
    if (h < 0) h += 360;

    return { l: L, c, h };
}

/**
 * Convert OKLab to linear sRGB
 */
function oklabToLinearSrgb(L, a, b) {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    return {
        r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    };
}

/**
 * Convert linear sRGB to OKLab
 */
function linearSrgbToOklab(r, g, b) {
    const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);

    return {
        L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
        a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
        b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
    };
}

/**
 * Convert sRGB to linear sRGB
 */
function srgbToLinear(value) {
    if (value <= 0.04045) {
        return value / 12.92;
    }
    return Math.pow((value + 0.055) / 1.055, 2.4);
}

/**
 * Convert linear sRGB to sRGB
 */
function linearToSrgb(value) {
    if (value <= 0.0031308) {
        return value * 12.92;
    }
    return 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

/**
 * Clamp value between 0 and 1
 */
function clamp(value) {
    return Math.max(0, Math.min(1, value));
}

/**
 * Convert OKLCH string to Hex
 * @param {string} oklchStr - OKLCH string
 * @returns {string} Hex color like "#ff5500"
 */
export function oklchToHex(oklchStr) {
    const parsed = parseOklch(oklchStr);
    if (!parsed) return '#808080';

    const { l, c, h } = parsed;
    const lab = oklchToOklab(l, c, h);
    const linear = oklabToLinearSrgb(lab.L, lab.a, lab.b);

    const r = Math.round(clamp(linearToSrgb(linear.r)) * 255);
    const g = Math.round(clamp(linearToSrgb(linear.g)) * 255);
    const b = Math.round(clamp(linearToSrgb(linear.b)) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Convert Hex to OKLCH string
 * @param {string} hex - Hex color like "#ff5500" or "ff5500"
 * @returns {string} OKLCH string
 */
export function hexToOklch(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse hex
    let r, g, b;
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16) / 255;
        g = parseInt(hex[1] + hex[1], 16) / 255;
        b = parseInt(hex[2] + hex[2], 16) / 255;
    } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16) / 255;
        g = parseInt(hex.slice(2, 4), 16) / 255;
        b = parseInt(hex.slice(4, 6), 16) / 255;
    } else {
        return 'oklch(0.5 0.15 250)';
    }

    // Convert to linear sRGB
    const linearR = srgbToLinear(r);
    const linearG = srgbToLinear(g);
    const linearB = srgbToLinear(b);

    // Convert to OKLab
    const lab = linearSrgbToOklab(linearR, linearG, linearB);

    // Convert to OKLCH
    const lch = oklabToOklch(lab.L, lab.a, lab.b);

    return composeOklch(lch);
}

/**
 * Generate shades for a base OKLCH color
 * @param {string} baseOklch - Base OKLCH color string
 * @returns {Object} Shades object with keys 50-950
 */
export function generateShades(baseOklch) {
    const parsed = parseOklch(baseOklch);
    if (!parsed) return {};

    const { c: baseChroma, h } = parsed;

    // Lightness values for each shade
    const lightnessMap = {
        50: 0.97,
        100: 0.93,
        200: 0.87,
        300: 0.77,
        400: 0.66,
        // 500 = base
        600: 0.48,
        700: 0.40,
        800: 0.32,
        900: 0.24,
        950: 0.16,
    };

    // Chroma multipliers
    const chromaMultiplier = {
        50: 0.08,
        100: 0.16,
        200: 0.32,
        300: 0.56,
        400: 0.80,
        // 500 = 1.0
        600: 0.88,
        700: 0.72,
        800: 0.56,
        900: 0.40,
        950: 0.24,
    };

    const shades = {};

    for (const [shade, lightness] of Object.entries(lightnessMap)) {
        const chroma = baseChroma * chromaMultiplier[shade];
        shades[shade] = composeOklch({ l: lightness, c: chroma, h });
    }

    return shades;
}

/**
 * Validate color name
 * @param {string} name - Color name to validate
 * @returns {boolean}
 */
export function validateColorName(name) {
    return /^[a-z][a-z0-9-]*$/.test(name);
}

/**
 * Sanitize color name
 * @param {string} name - Color name to sanitize
 * @returns {string}
 */
export function sanitizeColorName(name) {
    let clean = name.toLowerCase();
    clean = clean.replace(/[\s_]+/g, '-');
    clean = clean.replace(/[^a-z0-9-]/g, '');
    clean = clean.replace(/^[^a-z]+/, '');
    clean = clean.replace(/-+$/, '');
    return clean || 'color';
}

/**
 * Check if a color should have shades
 * @param {string} name - Color name
 * @returns {boolean}
 */
export function shouldHaveShades(name) {
    const noShades = ['success', 'warning', 'error', 'black', 'white'];
    return !noShades.includes(name);
}

/**
 * Get all shade levels
 * @returns {number[]}
 */
export function getShadeLevels() {
    return [50, 100, 200, 300, 400, 600, 700, 800, 900, 950];
}

/**
 * Get default color for new colors
 * @returns {string}
 */
export function getDefaultColor() {
    return 'oklch(0.55 0.2 250)';
}
