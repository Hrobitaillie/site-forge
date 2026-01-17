<?php

namespace SiteForge\DesignSystem;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Generates CSS from design system JSON
 * PHP implementation of the Vite design system plugin
 */
class CSSGenerator {

    /**
     * Generate complete CSS from design system
     *
     * @param array $design_system The design system data
     * @return string Complete CSS content
     */
    public function generate(array $design_system): string {
        $lines = [];

        // Add Google Fonts import
        $google_fonts_url = $this->generate_google_fonts_url($design_system);
        if ($google_fonts_url) {
            $lines[] = "@import url('{$google_fonts_url}');";
            $lines[] = '';
        }

        // Generate CSS variables
        $lines[] = $this->generate_css_variables($design_system);
        $lines[] = '';

        // Generate Tailwind @theme
        $lines[] = $this->generate_tailwind_theme($design_system);
        $lines[] = '';

        // Generate typography utilities
        $lines[] = $this->generate_typography_utilities($design_system);

        return implode("\n", $lines);
    }

    /**
     * Generate CSS custom properties
     */
    private function generate_css_variables(array $design_system): string {
        $lines = [];
        $breakpoints = $design_system['breakpoints'] ?? ['sm' => '375px', 'lg' => '1024px', 'xl' => '1536px'];

        $sm_vw = $this->parse_breakpoint($breakpoints['sm']);
        $lg_vw = $this->parse_breakpoint($breakpoints['lg']);
        $xl_vw = $this->parse_breakpoint($breakpoints['xl']);

        $lines[] = ':root {';

        // Colors
        if (!empty($design_system['colors'])) {
            $lines[] = '  /* Colors */';

            foreach ($design_system['colors'] as $color_name => $color_config) {
                if (isset($color_config['shades'])) {
                    // Color with shades
                    $lines[] = "  --color-{$color_name}: {$color_config['base']};";
                    $lines[] = "  --color-{$color_name}-500: {$color_config['base']};";

                    foreach ($color_config['shades'] as $shade => $value) {
                        $lines[] = "  --color-{$color_name}-{$shade}: {$value};";
                    }
                } elseif (isset($color_config['base'])) {
                    // Simple color
                    $lines[] = "  --color-{$color_name}: {$color_config['base']};";
                }
            }
            $lines[] = '';
        }

        // Fonts
        if (!empty($design_system['fonts'])) {
            $lines[] = '  /* Fonts */';

            foreach ($design_system['fonts'] as $font_name => $font_config) {
                $family = is_array($font_config['family'])
                    ? implode(', ', $font_config['family'])
                    : $font_config['family'];
                $lines[] = "  --font-{$font_name}: {$family};";
            }
            $lines[] = '';
        }

        // Typography - Static sizes
        if (!empty($design_system['typography'])) {
            $lines[] = '  /* Typography - Static Sizes */';

            foreach ($design_system['typography'] as $type_name => $type_config) {
                $lines[] = "  --text-{$type_name}-sm: {$type_config['sm']};";
                $lines[] = "  --text-{$type_name}-lg: {$type_config['lg']};";
                $lines[] = "  --text-{$type_name}-xl: {$type_config['xl']};";

                if (isset($type_config['lineHeight'])) {
                    $lines[] = "  --text-{$type_name}-line-height: {$type_config['lineHeight']};";
                }
                if (isset($type_config['letterSpacing'])) {
                    $lines[] = "  --text-{$type_name}-letter-spacing: {$type_config['letterSpacing']};";
                }
                if (isset($type_config['weight'])) {
                    $lines[] = "  --text-{$type_name}-weight: {$type_config['weight']};";
                }
                if (isset($type_config['font']) && isset($design_system['fonts'][$type_config['font']])) {
                    $family = is_array($design_system['fonts'][$type_config['font']]['family'])
                        ? implode(', ', $design_system['fonts'][$type_config['font']]['family'])
                        : $design_system['fonts'][$type_config['font']]['family'];
                    $lines[] = "  --text-{$type_name}-font: {$family};";
                }
            }
            $lines[] = '';

            // Typography - Fluid clamps (sm -> lg)
            $lines[] = '  /* Typography - Fluid (clamp sm->lg) */';
            foreach ($design_system['typography'] as $type_name => $type_config) {
                $sm_size = $this->parse_size($type_config['sm']);
                $lg_size = $this->parse_size($type_config['lg']);
                $clamp = $this->generate_clamp($sm_size, $lg_size, $sm_vw, $lg_vw);
                $lines[] = "  --text-{$type_name}: {$clamp};";
            }
            $lines[] = '';

            // Typography - Fluid large (lg -> xl)
            $lines[] = '  /* Typography - Fluid Large (clamp lg->xl) */';
            foreach ($design_system['typography'] as $type_name => $type_config) {
                $lg_size = $this->parse_size($type_config['lg']);
                $xl_size = $this->parse_size($type_config['xl']);
                $clamp = $this->generate_clamp($lg_size, $xl_size, $lg_vw, $xl_vw);
                $lines[] = "  --text-{$type_name}-fluid-xl: {$clamp};";
            }
            $lines[] = '';
        }

        // Spacing
        if (!empty($design_system['spacing'])) {
            $lines[] = '  /* Spacing */';
            foreach ($design_system['spacing'] as $space_name => $value) {
                $lines[] = "  --spacing-{$space_name}: {$value};";
            }
            $lines[] = '';
        }

        // Radius
        if (!empty($design_system['radius'])) {
            $lines[] = '  /* Border Radius */';
            foreach ($design_system['radius'] as $radius_name => $value) {
                $lines[] = "  --radius-{$radius_name}: {$value};";
            }
            $lines[] = '';
        }

        // Shadows
        if (!empty($design_system['shadows'])) {
            $lines[] = '  /* Shadows */';
            foreach ($design_system['shadows'] as $shadow_name => $value) {
                $lines[] = "  --shadow-{$shadow_name}: {$value};";
            }
            $lines[] = '';
        }

        // Transitions
        if (!empty($design_system['transitions'])) {
            $lines[] = '  /* Transitions */';
            foreach ($design_system['transitions'] as $trans_name => $value) {
                $lines[] = "  --transition-{$trans_name}: {$value};";
            }
            $lines[] = '';
        }

        $lines[] = '}';

        return implode("\n", $lines);
    }

    /**
     * Generate Tailwind CSS 4 @theme configuration
     */
    private function generate_tailwind_theme(array $design_system): string {
        $lines = [];

        $lines[] = '@theme {';

        // Colors
        if (!empty($design_system['colors'])) {
            foreach ($design_system['colors'] as $color_name => $color_config) {
                if (isset($color_config['shades'])) {
                    $lines[] = "  --color-{$color_name}: {$color_config['base']};";
                    $lines[] = "  --color-{$color_name}-500: {$color_config['base']};";

                    foreach ($color_config['shades'] as $shade => $value) {
                        $lines[] = "  --color-{$color_name}-{$shade}: {$value};";
                    }
                } elseif (isset($color_config['base'])) {
                    $lines[] = "  --color-{$color_name}: {$color_config['base']};";
                }
            }
        }

        // Fonts
        if (!empty($design_system['fonts'])) {
            foreach ($design_system['fonts'] as $font_name => $font_config) {
                $family = is_array($font_config['family'])
                    ? implode(', ', $font_config['family'])
                    : $font_config['family'];
                $lines[] = "  --font-{$font_name}: {$family};";
            }
        }

        // Spacing
        if (!empty($design_system['spacing'])) {
            foreach ($design_system['spacing'] as $space_name => $value) {
                $lines[] = "  --spacing-{$space_name}: {$value};";
            }
        }

        // Radius
        if (!empty($design_system['radius'])) {
            foreach ($design_system['radius'] as $radius_name => $value) {
                $lines[] = "  --radius-{$radius_name}: {$value};";
            }
        }

        $lines[] = '}';

        return implode("\n", $lines);
    }

    /**
     * Generate typography utility classes
     */
    private function generate_typography_utilities(array $design_system): string {
        if (empty($design_system['typography'])) {
            return '';
        }

        $lines = [];

        $lines[] = '/* Typography Utility Classes */';
        $lines[] = '@layer utilities {';

        foreach ($design_system['typography'] as $type_name => $type_config) {
            $lines[] = "  .text-{$type_name} {";
            $lines[] = "    font-size: var(--text-{$type_name});";

            if (isset($type_config['lineHeight'])) {
                $lines[] = "    line-height: var(--text-{$type_name}-line-height);";
            }
            if (isset($type_config['letterSpacing'])) {
                $lines[] = "    letter-spacing: var(--text-{$type_name}-letter-spacing);";
            }
            if (isset($type_config['weight'])) {
                $lines[] = "    font-weight: var(--text-{$type_name}-weight);";
            }
            if (isset($type_config['font'])) {
                $lines[] = "    font-family: var(--text-{$type_name}-font);";
            }

            $lines[] = '  }';
            $lines[] = '';
        }

        $lines[] = '}';

        return implode("\n", $lines);
    }

    /**
     * Generate Google Fonts import URL
     */
    private function generate_google_fonts_url(array $design_system): ?string {
        if (empty($design_system['fonts'])) {
            return null;
        }

        $font_strings = [];

        foreach ($design_system['fonts'] as $font_config) {
            if (!empty($font_config['google'])) {
                $font_strings[] = $font_config['google'];
            }
        }

        if (empty($font_strings)) {
            return null;
        }

        $families = array_map(fn($f) => "family={$f}", $font_strings);

        return 'https://fonts.googleapis.com/css2?' . implode('&', $families) . '&display=swap';
    }

    /**
     * Parse size value to rem
     */
    private function parse_size(string $value): float {
        if (preg_match('/^([\d.]+)(rem|px)$/', $value, $matches)) {
            $num = (float) $matches[1];
            $unit = $matches[2];

            return $unit === 'px' ? $num / 16 : $num;
        }

        return (float) $value;
    }

    /**
     * Parse breakpoint to pixels
     */
    private function parse_breakpoint(string $value): float {
        if (preg_match('/^([\d.]+)(px|rem)$/', $value, $matches)) {
            $num = (float) $matches[1];
            $unit = $matches[2];

            return $unit === 'rem' ? $num * 16 : $num;
        }

        return (float) $value;
    }

    /**
     * Generate CSS clamp() for fluid typography
     */
    private function generate_clamp(float $min_size, float $max_size, float $min_vw, float $max_vw): string {
        // Calculate slope and intercept
        $slope = ($max_size - $min_size) / (($max_vw - $min_vw) / 16);
        $intercept = $min_size - ($slope * ($min_vw / 16));

        $slope_vw = number_format($slope * 100, 4, '.', '');
        $intercept_rem = number_format($intercept, 4, '.', '');

        $preferred = "{$intercept_rem}rem + {$slope_vw}vw";

        return "clamp({$min_size}rem, {$preferred}, {$max_size}rem)";
    }
}
