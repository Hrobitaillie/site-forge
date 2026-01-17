<?php

namespace SiteForge\DesignSystem;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Manages the design system JSON file
 * Handles reading, writing, and syncing with theme.json and CSS
 */
class DesignSystemManager {

    /**
     * @var CSSGenerator
     */
    private $css_generator;

    /**
     * @var ColorGenerator
     */
    private $color_generator;

    public function __construct() {
        $this->css_generator = new CSSGenerator();
        $this->color_generator = new ColorGenerator();
    }

    /**
     * Get path to design-system.json in the active theme
     */
    public function get_design_system_path(): string {
        return get_template_directory() . '/design-system.json';
    }

    /**
     * Get path to theme.json in the active theme
     */
    public function get_theme_json_path(): string {
        return get_template_directory() . '/theme.json';
    }

    /**
     * Get path to _design-system.css in the active theme
     */
    public function get_css_path(): string {
        return get_template_directory() . '/assets/src/_design-system.css';
    }

    /**
     * Read the entire design system
     */
    public function read(): array {
        $path = $this->get_design_system_path();

        if (!file_exists($path)) {
            return $this->get_default_design_system();
        }

        $content = file_get_contents($path);
        $data = json_decode($content, true);

        return $data ?: $this->get_default_design_system();
    }

    /**
     * Write the entire design system
     */
    public function write(array $data): bool {
        $path = $this->get_design_system_path();

        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        if ($json === false) {
            return false;
        }

        $result = file_put_contents($path, $json);

        if ($result === false) {
            return false;
        }

        // Sync theme.json and CSS after writing
        $this->sync_theme_json();
        $this->generate_css();

        return true;
    }

    /**
     * Get colors from design system
     */
    public function get_colors(): array {
        $data = $this->read();
        return $data['colors'] ?? [];
    }

    /**
     * Save colors to design system
     */
    public function save_colors(array $colors): bool {
        $data = $this->read();
        $data['colors'] = $colors;
        return $this->write($data);
    }

    /**
     * Reset colors to empty
     */
    public function reset_colors(): bool {
        return $this->save_colors([]);
    }

    /**
     * Add a new color with auto-generated shades
     */
    public function add_color(string $name, string $base_oklch, bool $with_shades = true): array {
        $color = [
            'base' => $base_oklch,
        ];

        if ($with_shades) {
            $color['shades'] = $this->color_generator->generate_shades($base_oklch);
        }

        return $color;
    }

    /**
     * Sync theme.json with design system
     */
    public function sync_theme_json(): bool {
        $design_system = $this->read();
        $theme_json_path = $this->get_theme_json_path();

        // Read existing theme.json
        $existing = [];
        if (file_exists($theme_json_path)) {
            $content = file_get_contents($theme_json_path);
            $existing = json_decode($content, true) ?: [];
        }

        // Generate new theme.json content
        $theme_json = $this->generate_theme_json($design_system, $existing);

        // Write theme.json
        $json = json_encode($theme_json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        return file_put_contents($theme_json_path, $json) !== false;
    }

    /**
     * Generate CSS and write to theme
     */
    public function generate_css(): bool {
        $design_system = $this->read();
        $css = $this->css_generator->generate($design_system);

        $path = $this->get_css_path();
        $dir = dirname($path);

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        return file_put_contents($path, $css) !== false;
    }

    /**
     * Generate theme.json structure from design system
     */
    private function generate_theme_json(array $design_system, array $existing = []): array {
        $theme_json = $existing;

        // Ensure base structure
        $theme_json['$schema'] = $theme_json['$schema'] ?? 'https://schemas.wp.org/trunk/theme.json';
        $theme_json['version'] = $theme_json['version'] ?? 2;
        $theme_json['settings'] = $theme_json['settings'] ?? [];
        $theme_json['settings']['color'] = $theme_json['settings']['color'] ?? [];
        $theme_json['settings']['typography'] = $theme_json['settings']['typography'] ?? [];
        $theme_json['settings']['spacing'] = $theme_json['settings']['spacing'] ?? [];

        // Generate color palette
        if (!empty($design_system['colors'])) {
            $palette = [];

            foreach ($design_system['colors'] as $color_name => $color_config) {
                $name_capitalized = ucfirst($color_name);

                if (isset($color_config['shades'])) {
                    // Color with shades
                    $palette[] = [
                        'slug'  => $color_name,
                        'color' => "var(--color-{$color_name})",
                        'name'  => $name_capitalized,
                    ];
                    $palette[] = [
                        'slug'  => "{$color_name}-500",
                        'color' => "var(--color-{$color_name}-500)",
                        'name'  => "{$name_capitalized} 500",
                    ];

                    foreach ($color_config['shades'] as $shade => $value) {
                        $palette[] = [
                            'slug'  => "{$color_name}-{$shade}",
                            'color' => "var(--color-{$color_name}-{$shade})",
                            'name'  => "{$name_capitalized} {$shade}",
                        ];
                    }
                } elseif (isset($color_config['base'])) {
                    // Simple color
                    $palette[] = [
                        'slug'  => $color_name,
                        'color' => "var(--color-{$color_name})",
                        'name'  => $name_capitalized,
                    ];
                }
            }

            $theme_json['settings']['color']['palette'] = $palette;
            $theme_json['settings']['color']['defaultPalette'] = false;
            $theme_json['settings']['color']['defaultGradients'] = false;
            $theme_json['settings']['color']['custom'] = true;
        }

        // Generate font families
        if (!empty($design_system['fonts'])) {
            $font_families = [];

            foreach ($design_system['fonts'] as $font_name => $font_config) {
                $family = is_array($font_config['family'])
                    ? implode(', ', $font_config['family'])
                    : $font_config['family'];

                $font_families[] = [
                    'fontFamily' => "var(--font-{$font_name})",
                    'slug'       => $font_name,
                    'name'       => ucfirst($font_name),
                ];
            }

            $theme_json['settings']['typography']['fontFamilies'] = $font_families;
        }

        // Generate typography sizes
        if (!empty($design_system['typography'])) {
            $font_sizes = [];

            foreach ($design_system['typography'] as $type_name => $type_config) {
                $font_sizes[] = [
                    'slug'  => $type_name,
                    'size'  => "var(--text-{$type_name})",
                    'name'  => ucfirst(str_replace('-', ' ', $type_name)),
                    'fluid' => false,
                ];
            }

            $theme_json['settings']['typography']['fontSizes'] = $font_sizes;
            $theme_json['settings']['typography']['customFontSize'] = true;
        }

        // Generate spacing sizes
        if (!empty($design_system['spacing'])) {
            $spacing_sizes = [];

            foreach ($design_system['spacing'] as $space_name => $value) {
                $spacing_sizes[] = [
                    'slug' => $space_name,
                    'size' => "var(--spacing-{$space_name})",
                    'name' => strtoupper($space_name),
                ];
            }

            $theme_json['settings']['spacing']['spacingSizes'] = $spacing_sizes;
            $theme_json['settings']['spacing']['customSpacingSize'] = true;
            $theme_json['settings']['spacing']['units'] = ['px', 'em', 'rem', 'vh', 'vw', '%'];
        }

        // Set default styles
        $theme_json['styles'] = $theme_json['styles'] ?? [];
        $theme_json['styles']['color'] = [
            'background' => 'var(--color-neutral-50)',
            'text'       => 'var(--color-neutral-900)',
        ];
        $theme_json['styles']['typography'] = [
            'fontFamily' => 'var(--font-sans)',
            'fontSize'   => 'var(--text-body)',
            'lineHeight' => 'var(--text-body-line-height)',
        ];

        // Elements styling
        $theme_json['styles']['elements'] = $theme_json['styles']['elements'] ?? [];
        $theme_json['styles']['elements']['link'] = [
            'color'  => ['text' => 'var(--color-primary)'],
            ':hover' => ['color' => ['text' => 'var(--color-primary-600)']],
        ];

        // Heading styles
        $headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        foreach ($headings as $h) {
            if (isset($design_system['typography'][$h])) {
                $theme_json['styles']['elements'][$h] = [
                    'typography' => [
                        'fontFamily' => "var(--text-{$h}-font)",
                        'fontSize'   => "var(--text-{$h})",
                        'fontWeight' => "var(--text-{$h}-weight)",
                        'lineHeight' => "var(--text-{$h}-line-height)",
                    ],
                ];
            }
        }

        return $theme_json;
    }

    /**
     * Get default design system structure
     */
    private function get_default_design_system(): array {
        return [
            'version'     => '1.0.0',
            'breakpoints' => [
                'sm' => '375px',
                'lg' => '1024px',
                'xl' => '1536px',
            ],
            'colors'      => [],
            'fonts'       => [],
            'typography'  => [],
            'spacing'     => [],
            'radius'      => [],
            'shadows'     => [],
            'transitions' => [],
        ];
    }
}
