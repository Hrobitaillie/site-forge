<?php

namespace SiteForge;

use SiteForge\Blocks\Blocks;
use SiteForge\Blocks\InnerBlocksComponent;
use SiteForge\RestAPI;

class Main {
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
    }

    private function init_hooks() {
    }

    /**
     * Initialize plugin components
     */
    private function init_components() {
        // Initialize InnerBlocks processor (adds filter for <InnerBlocks /> tags)
        InnerBlocksComponent::get_instance();

        $blocks = new Blocks();
        $restApi = new RestAPI();
    }
}
?>