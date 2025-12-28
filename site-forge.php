<?php

/**
 * Plugin Name: SiteForge
 * Plugin URI: https://siteforge.dev
 * Description: Un système complet de gestion de blocs Gutenberg personnalisés pour remplacer ACF
 * Version: 1.0.0
 * Requires at least: 6.4
 * Requires PHP: 8.0
 * Author: Hugo
 * Author URI: https://siteforge.dev
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: siteforge
 * Domain Path: /languages
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('SIF_VERSION', '1.0.0');
define('SIF_FILE', __FILE__);
define('SIF_DIR', plugin_dir_path(__FILE__));
define('SIF_URL', plugin_dir_url(__FILE__));
define('SIF_BASENAME', plugin_basename(__FILE__));

/**
 * PSR-4 autoloader for SiteForge classes
 *
 * Examples:
 * - SiteForge\SiteForge -> includes/SiteForge.php
 * - SiteForge\Blocks\BlockScanner -> includes/Blocks/BlockScanner.php
 */
spl_autoload_register(function ($class) {
    // Only autoload SiteForge classes
    if (strpos($class, 'SiteForge\\') !== 0) {
        return;
    }

    // Remove namespace prefix to get relative path
    $relative_class = str_replace('SiteForge\\', '', $class);

    // Convert namespace separators to directory separators
    $relative_path = str_replace('\\', '/', $relative_class);

    // Build file path
    $file = SIF_DIR . 'includes/' . $relative_path . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});


/**
 * Load global helper functions (no namespace required in templates)
 */
require_once SIF_DIR . 'helpers/frontend-helpers.php';
require_once SIF_DIR . 'helpers/backend-helpers.php';


/**
 * Initialize the plugin
 */
function siteforge_init() {
    // Load text domain for translations
    load_textdomain('siteforge', false, dirname(SIF_BASENAME) . '/languages');

    // Initialize main plugin class
    if (class_exists('SiteForge\\Main')) {
        SiteForge\Main::get_instance();
    }
}
add_action('plugins_loaded', 'siteforge_init');

/**
 * Activation hook
 */
function siteforge_activate() {
    // Flush rewrite rules
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'siteforge_activate');

/**
 * Deactivation hook
 */
function siteforge_deactivate() {
    // Flush rewrite rules
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'siteforge_deactivate');
