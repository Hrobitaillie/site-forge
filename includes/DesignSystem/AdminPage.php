<?php

namespace SiteForge\DesignSystem;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Design System Admin Page
 * Registers the admin menu and handles the React app rendering
 */
class AdminPage {

    /**
     * @var DesignSystemManager
     */
    private $manager;

    /**
     * @var ColorGenerator
     */
    private $color_generator;

    /**
     * Page hook suffix
     */
    private $page_hook;

    public function __construct() {
        $this->manager = new DesignSystemManager();
        $this->color_generator = new ColorGenerator();

        add_action('admin_menu', [$this, 'register_menu']);
        add_action('rest_api_init', [$this, 'register_rest_routes']);
    }

    /**
     * Register admin menu
     */
    public function register_menu(): void {
        $this->page_hook = add_menu_page(
            __('Design System', 'siteforge'),
            __('Design System', 'siteforge'),
            'manage_options',
            'siteforge-design-system',
            [$this, 'render_page'],
            'dashicons-art',
            30
        );

        // Add submenu for colors (same as main page for now)
        add_submenu_page(
            'siteforge-design-system',
            __('Couleurs', 'siteforge'),
            __('Couleurs', 'siteforge'),
            'manage_options',
            'siteforge-design-system',
            [$this, 'render_page']
        );

        // Hook for enqueueing assets
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
    }

    /**
     * Render the admin page
     */
    public function render_page(): void {
        // Add fullscreen mode class to body
        add_filter('admin_body_class', function ($classes) {
            return $classes . ' is-fullscreen-mode siteforge-design-system-page';
        });

        ?>
        <div class="siteforge-admin-app" id="siteforge-design-system-app">
            <div class="siteforge-admin-loading">
                <span class="spinner is-active"></span>
                <p><?php esc_html_e('Chargement du Design System...', 'siteforge'); ?></p>
            </div>
        </div>
        <?php
    }

    /**
     * Enqueue admin assets
     */
    public function enqueue_assets(string $hook): void {
        if ($hook !== $this->page_hook) {
            return;
        }

        // WordPress dependencies
        wp_enqueue_script('wp-element');
        wp_enqueue_script('wp-components');
        wp_enqueue_script('wp-api-fetch');
        wp_enqueue_script('wp-i18n');
        wp_enqueue_script('wp-data');
        wp_enqueue_script('wp-notices');

        // WordPress styles
        wp_enqueue_style('wp-components');
        wp_enqueue_style('wp-edit-site');

        // Our admin app
        $build_path = SIF_DIR . 'build/js/design-system.js';
        $version = file_exists($build_path) ? filemtime($build_path) : SIF_VERSION;

        wp_enqueue_script(
            'siteforge-design-system-admin',
            SIF_URL . 'build/js/design-system.js',
            [
                'wp-element',
                'wp-components',
                'wp-api-fetch',
                'wp-i18n',
                'wp-data',
                'wp-notices',
            ],
            $version,
            true
        );

        // Localize configuration
        wp_localize_script('siteforge-design-system-admin', 'siteforgeDesignSystem', [
            'restUrl'   => rest_url('siteforge/v1'),
            'nonce'     => wp_create_nonce('wp_rest'),
            'adminUrl'  => admin_url(),
            'themeName' => wp_get_theme()->get('Name'),
        ]);

        // Admin CSS
        wp_enqueue_style(
            'siteforge-design-system-admin',
            SIF_URL . 'assets/css/admin/design-system.css',
            ['wp-components', 'wp-edit-site'],
            SIF_VERSION
        );
    }

    /**
     * Register REST API routes
     */
    public function register_rest_routes(): void {
        // Get colors
        register_rest_route('siteforge/v1', '/design-system/colors', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_colors'],
            'permission_callback' => [$this, 'check_permissions'],
        ]);

        // Save colors
        register_rest_route('siteforge/v1', '/design-system/colors', [
            'methods'             => 'POST',
            'callback'            => [$this, 'save_colors'],
            'permission_callback' => [$this, 'check_permissions'],
        ]);

        // Reset colors
        register_rest_route('siteforge/v1', '/design-system/reset-colors', [
            'methods'             => 'POST',
            'callback'            => [$this, 'reset_colors'],
            'permission_callback' => [$this, 'check_permissions'],
        ]);

        // Generate shades for a color
        register_rest_route('siteforge/v1', '/design-system/generate-shades', [
            'methods'             => 'POST',
            'callback'            => [$this, 'generate_shades'],
            'permission_callback' => [$this, 'check_permissions'],
        ]);

        // Get full design system
        register_rest_route('siteforge/v1', '/design-system', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_design_system'],
            'permission_callback' => [$this, 'check_permissions'],
        ]);
    }

    /**
     * Check if user can access design system
     */
    public function check_permissions(): bool {
        return current_user_can('manage_options');
    }

    /**
     * Get colors endpoint
     */
    public function get_colors(\WP_REST_Request $request): \WP_REST_Response {
        $colors = $this->manager->get_colors();

        return new \WP_REST_Response([
            'success' => true,
            'colors'  => $colors,
        ], 200);
    }

    /**
     * Save colors endpoint
     */
    public function save_colors(\WP_REST_Request $request): \WP_REST_Response {
        $colors = $request->get_json_params()['colors'] ?? [];

        // Validate and sanitize colors
        $sanitized = $this->sanitize_colors($colors);

        $result = $this->manager->save_colors($sanitized);

        if ($result) {
            return new \WP_REST_Response([
                'success' => true,
                'message' => __('Couleurs sauvegardées avec succès. Le CSS a été régénéré.', 'siteforge'),
                'colors'  => $sanitized,
            ], 200);
        }

        return new \WP_REST_Response([
            'success' => false,
            'message' => __('Erreur lors de la sauvegarde des couleurs.', 'siteforge'),
        ], 500);
    }

    /**
     * Reset colors endpoint
     */
    public function reset_colors(\WP_REST_Request $request): \WP_REST_Response {
        $result = $this->manager->reset_colors();

        if ($result) {
            return new \WP_REST_Response([
                'success' => true,
                'message' => __('Toutes les couleurs ont été supprimées.', 'siteforge'),
            ], 200);
        }

        return new \WP_REST_Response([
            'success' => false,
            'message' => __('Erreur lors de la réinitialisation des couleurs.', 'siteforge'),
        ], 500);
    }

    /**
     * Generate shades for a color
     */
    public function generate_shades(\WP_REST_Request $request): \WP_REST_Response {
        $base = $request->get_json_params()['base'] ?? '';

        if (empty($base)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => __('Couleur de base manquante.', 'siteforge'),
            ], 400);
        }

        $shades = $this->color_generator->generate_shades($base);

        return new \WP_REST_Response([
            'success' => true,
            'shades'  => $shades,
        ], 200);
    }

    /**
     * Get full design system
     */
    public function get_design_system(\WP_REST_Request $request): \WP_REST_Response {
        $data = $this->manager->read();

        return new \WP_REST_Response([
            'success' => true,
            'data'    => $data,
        ], 200);
    }

    /**
     * Sanitize colors array
     */
    private function sanitize_colors(array $colors): array {
        $sanitized = [];

        foreach ($colors as $name => $config) {
            // Sanitize the name
            $clean_name = $this->color_generator->sanitize_color_name($name);

            if (empty($clean_name)) {
                continue;
            }

            // Validate OKLCH base color
            if (!isset($config['base']) || !$this->is_valid_oklch($config['base'])) {
                continue;
            }

            $sanitized[$clean_name] = [
                'base' => $config['base'],
            ];

            // Add shades if present and valid
            if (isset($config['shades']) && is_array($config['shades'])) {
                $valid_shades = [];

                foreach ($config['shades'] as $shade => $value) {
                    if ($this->is_valid_shade($shade) && $this->is_valid_oklch($value)) {
                        $valid_shades[(string) $shade] = $value;
                    }
                }

                if (!empty($valid_shades)) {
                    $sanitized[$clean_name]['shades'] = $valid_shades;
                }
            }
        }

        return $sanitized;
    }

    /**
     * Validate OKLCH color string
     */
    private function is_valid_oklch(string $value): bool {
        return (bool) preg_match('/^oklch\s*\(\s*[\d.]+\s+[\d.]+\s+[\d.]+\s*\)$/i', $value);
    }

    /**
     * Validate shade level
     */
    private function is_valid_shade($shade): bool {
        $valid = [50, 100, 200, 300, 400, 600, 700, 800, 900, 950];
        return in_array((int) $shade, $valid, true);
    }
}
