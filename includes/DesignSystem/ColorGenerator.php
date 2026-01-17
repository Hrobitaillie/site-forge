<?php

namespace SiteForge\DesignSystem;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Generates color shades from a base OKLCH color
 */
class ColorGenerator {

    /**
     * Standard shade levels
     */
    private const SHADE_LEVELS = [50, 100, 200, 300, 400, 600, 700, 800, 900, 950];

    /**
     * Lightness values for each shade level
     * These create a smooth gradient from light to dark
     */
    private const LIGHTNESS_MAP = [
        50  => 0.97,
        100 => 0.93,
        200 => 0.87,
        300 => 0.77,
        400 => 0.66,
        // 500 = base color (not in shades array)
        600 => 0.48,
        700 => 0.40,
        800 => 0.32,
        900 => 0.24,
        950 => 0.16,
    ];

    /**
     * Chroma multipliers for each shade level
     * Light colors have low chroma, mid tones have full chroma
     */
    private const CHROMA_MULTIPLIER = [
        50  => 0.08,
        100 => 0.16,
        200 => 0.32,
        300 => 0.56,
        400 => 0.80,
        // 500 = base color (1.0)
        600 => 0.88,
        700 => 0.72,
        800 => 0.56,
        900 => 0.40,
        950 => 0.24,
    ];

    /**
     * Generate all shades from a base OKLCH color
     *
     * @param string $base_oklch The base color in format "oklch(l c h)"
     * @return array Associative array of shade => oklch value
     */
    public function generate_shades(string $base_oklch): array {
        $parsed = $this->parse_oklch($base_oklch);

        if (!$parsed) {
            return [];
        }

        $shades = [];
        $base_chroma = $parsed['c'];

        foreach (self::SHADE_LEVELS as $level) {
            $lightness = self::LIGHTNESS_MAP[$level];
            $chroma = $base_chroma * self::CHROMA_MULTIPLIER[$level];

            $shades[(string) $level] = $this->compose_oklch($lightness, $chroma, $parsed['h']);
        }

        return $shades;
    }

    /**
     * Parse an OKLCH string into components
     *
     * @param string $value OKLCH string like "oklch(0.55 0.25 250)"
     * @return array|null Array with keys 'l', 'c', 'h' or null if invalid
     */
    public function parse_oklch(string $value): ?array {
        // Match oklch(l c h) format
        if (preg_match('/oklch\s*\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/i', $value, $matches)) {
            return [
                'l' => (float) $matches[1],
                'c' => (float) $matches[2],
                'h' => (float) $matches[3],
            ];
        }

        return null;
    }

    /**
     * Compose an OKLCH string from components
     *
     * @param float $l Lightness (0-1)
     * @param float $c Chroma (0-0.4 typically)
     * @param float $h Hue (0-360)
     * @return string OKLCH string
     */
    public function compose_oklch(float $l, float $c, float $h): string {
        // Round to reasonable precision
        $l = round($l, 2);
        $c = round($c, 3);
        $h = round($h, 0);

        return "oklch({$l} {$c} {$h})";
    }

    /**
     * Get shade levels
     */
    public function get_shade_levels(): array {
        return self::SHADE_LEVELS;
    }

    /**
     * Validate a color name
     *
     * @param string $name Color name to validate
     * @return bool True if valid
     */
    public function validate_color_name(string $name): bool {
        // Must start with letter, contain only lowercase letters, numbers, and hyphens
        return (bool) preg_match('/^[a-z][a-z0-9-]*$/', $name);
    }

    /**
     * Sanitize a color name
     *
     * @param string $name Color name to sanitize
     * @return string Sanitized name
     */
    public function sanitize_color_name(string $name): string {
        // Convert to lowercase
        $name = strtolower($name);

        // Replace spaces and underscores with hyphens
        $name = preg_replace('/[\s_]+/', '-', $name);

        // Remove invalid characters
        $name = preg_replace('/[^a-z0-9-]/', '', $name);

        // Remove leading hyphens/numbers
        $name = preg_replace('/^[^a-z]+/', '', $name);

        // Remove trailing hyphens
        $name = rtrim($name, '-');

        return $name ?: 'color';
    }

    /**
     * Check if a color should have shades
     * Utility colors like success, warning, error don't have shades
     *
     * @param string $name Color name
     * @return bool True if should have shades
     */
    public function should_have_shades(string $name): bool {
        $no_shades = ['success', 'warning', 'error', 'black', 'white'];
        return !in_array($name, $no_shades, true);
    }

    /**
     * Generate a lighter version of a color
     *
     * @param string $oklch Base OKLCH color
     * @param float $amount Amount to lighten (0-1)
     * @return string Lighter OKLCH color
     */
    public function lighten(string $oklch, float $amount = 0.1): string {
        $parsed = $this->parse_oklch($oklch);

        if (!$parsed) {
            return $oklch;
        }

        $new_lightness = min(1, $parsed['l'] + $amount);

        return $this->compose_oklch($new_lightness, $parsed['c'], $parsed['h']);
    }

    /**
     * Generate a darker version of a color
     *
     * @param string $oklch Base OKLCH color
     * @param float $amount Amount to darken (0-1)
     * @return string Darker OKLCH color
     */
    public function darken(string $oklch, float $amount = 0.1): string {
        $parsed = $this->parse_oklch($oklch);

        if (!$parsed) {
            return $oklch;
        }

        $new_lightness = max(0, $parsed['l'] - $amount);

        return $this->compose_oklch($new_lightness, $parsed['c'], $parsed['h']);
    }
}
