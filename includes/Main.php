<?php

namespace SiteForge;

use SiteForge\Blocks\Blocks;
use SiteForge\Blocks\FieldRenderer;
use SiteForge\Blocks\InnerBlocksComponent;
use SiteForge\RestAPI;
use SiteForge\DesignSystem\AdminPage;

class Main {

    /**
     * Field Renderer instance
     *
     * @var FieldRenderer
     */
    private $field_renderer;

    /**
     * Single instance of the class
     *
     * @var SiteForge
     */
    private static $instance = null;

    /**
     * Get singleton instance
     *
     * @return SiteForge
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Private constructor to prevent multiple instances
     */
    private function __construct() {
        $this->init_hooks();
        $this->init_components();


        // Enqueue editor assets
        add_action('enqueue_block_editor_assets', [$this, 'enqueue_editor_assets']);
    }

    private function init_hooks() {
    }

    /**
     * Initialize plugin components
     */
    private function init_components() {
        // Initialize InnerBlocks processor (adds filter for <InnerBlocks /> tags)
        InnerBlocksComponent::get_instance();

        $this->field_renderer = new FieldRenderer();

        $blocks = new Blocks($this->field_renderer);
        $restApi = new RestAPI();

        // Initialize Design System admin page
        new AdminPage();
    }

    /**
     * Enqueue editor assets
     */
    public function enqueue_editor_assets() {
        // Enqueue blocks CSS with HMR support
        // ViteIntegration::enqueue_editor_assets();

        // Enqueue block editor styles (no dependency in dev mode)
        // $deps = ViteIntegration::is_dev_server_running() ? [] : ['siteforge-blocks'];
        $deps = [];

        wp_enqueue_style(
            'siteforge-block-editor',
            SIF_URL . 'assets/css/block-editor.css',
            $deps,
            SIF_VERSION
        );

        // Enqueue block editor script
        wp_enqueue_script(
            'siteforge-block-editor',
            SIF_URL . 'build/js/editor.js',
            [
                'wp-blocks',
                'wp-element',
                'wp-components',
                'wp-block-editor',
                'wp-i18n',
                'wp-data',
                'wp-compose',
                'wp-hooks',
                'wp-server-side-render',
                'wp-api-fetch',
            ],
            SIF_VERSION,
            true
        );

        // Localize global config for icon picker and other features
        wp_localize_script('siteforge-block-editor', 'siteforgeConfig', [
            'spriteUrl' => get_stylesheet_directory_uri() . '/siteforge/src/lucide_sprite.svg',
            'restUrl'   => rest_url('siteforge/v1'),
        ]);
    }
}
?>