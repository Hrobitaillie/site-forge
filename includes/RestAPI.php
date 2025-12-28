<?php

namespace SiteForge;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * REST API endpoints for SiteForge
 */
class RestAPI {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        register_rest_route('siteforge/v1', '/icons', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_icons_list'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);

        register_rest_route('siteforge/v1', '/button-styles', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_button_styles'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);
    }

    /**
     * Get icons list from Lucide sprite
     *
     * @return \WP_REST_Response
     */
    public function get_icons_list() {
        $sprite_path = get_template_directory() . '/siteforge/src/sprites/lucide_sprite.svg';

        if (!file_exists($sprite_path)) {
            return new \WP_REST_Response([
                'icons' => [],
                'count' => 0,
                'error' => 'Sprite file not found: ' . $sprite_path,
            ], 200);
        }

        $svg_content = file_get_contents($sprite_path);
        $icons = [];

        // Parse symbol IDs from the sprite
        if (preg_match_all('/<symbol\s+id=["\']([^"\']+)["\']/', $svg_content, $matches)) {
            $icons = $matches[1];
        }

        return new \WP_REST_Response([
            'icons' => $icons,
            'count' => count($icons),
        ], 200);
    }

    /**
     * Get button styles from buttons.css
     *
     * Parses CSS comments with format: "label: Label Text | var: value"
     * placed before each .btn-name class definition.
     *
     * @return \WP_REST_Response
     */
    public function get_button_styles() {
        $css_path = get_template_directory() . '/assets/src/buttons.css';

        if (!file_exists($css_path)) {
            return new \WP_REST_Response([], 200);
        }

        $css = file_get_contents($css_path);
        $styles = [];

        // Parse: /* label: Label | var: value */ followed by .btn-name
        preg_match_all(
            '/\/\*\s*label:\s*([^|*]+)(?:\s*\|\s*([^*]+))?\s*\*\/\s*\.btn-([a-z0-9-]+)\s*\{/i',
            $css,
            $matches,
            PREG_SET_ORDER
        );

        foreach ($matches as $match) {
            $style = [
                'name'      => 'btn-' . $match[3],
                'label'     => trim($match[1]),
                'variables' => [],
            ];

            // Parse optional variables (icon: false, icon-default: arrow-right, etc.)
            if (!empty($match[2])) {
                preg_match_all('/([a-z-]+):\s*([^|]+)/i', $match[2], $vars, PREG_SET_ORDER);
                foreach ($vars as $var) {
                    $style['variables'][trim($var[1])] = trim($var[2]);
                }
            }

            $styles[] = $style;
        }

        return new \WP_REST_Response($styles, 200);
    }
}
