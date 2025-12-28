<?php

/**
 * Block Scanner Class
 *
 * Scans directories for custom blocks and caches the results
 *
 * @package SiteForge\Blocks
 */

namespace SiteForge\Blocks;

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * BlockScanner class
 *
 * Responsible for discovering blocks in registered directories
 */
class BlockScanner {
    /**
     * Array of paths to scan for blocks
     *
     * @var array
     */
    private $scan_paths = [];

    /**
     * Cache key for transient
     *
     * @var string
     */
    private $cache_key = 'siteforge_blocks_cache';

    /**
     * Cache duration in seconds (1 hour)
     *
     * @var int
     */
    private $cache_duration = HOUR_IN_SECONDS;

    /**
     * Constructor
     */
    public function __construct() {
        // Register default scan paths
        $this->add_scan_path(SIF_DIR . 'src/blocks');

        // Check for theme blocks directory
        $theme_blocks_path = get_template_directory() . 'siteforge/blocks';
        if (is_dir($theme_blocks_path)) {
            $this->add_scan_path($theme_blocks_path);
        }

        // Allow other plugins/themes to register paths
        $additional_paths = apply_filters('siteforge/block_scan_paths', []);
        foreach ($additional_paths as $path) {
            $this->add_scan_path($path);
        }
    }

    /**
     * Add a path to scan for blocks
     *
     * @param string $path Directory path to scan
     * @return bool True if path was added, false otherwise
     */
    public function add_scan_path($path) {
        if (!is_dir($path)) {
            return false;
        }

        $path = trailingslashit($path);

        if (!in_array($path, $this->scan_paths, true)) {
            $this->scan_paths[] = $path;
            return true;
        }

        return false;
    }

    /**
     * Get all registered scan paths
     *
     * @return array Array of scan paths
     */
    public function get_scan_paths() {
        return $this->scan_paths;
    }

    /**
     * Scan for blocks with cache support
     *
     * @param bool $bypass_cache Whether to bypass the cache
     * @return array Array of discovered blocks
     */
    public function scan_for_blocks($bypass_cache = false) {
        // Try to get cached blocks
        // if (!$bypass_cache) {
        //     $cached_blocks = get_transient($this->cache_key);
        //     if (false !== $cached_blocks && is_array($cached_blocks)) {
        //         return $cached_blocks;
        //     }
        // }

        // Perform fresh scan
        $blocks = [];

        foreach ($this->scan_paths as $path) {
            $discovered = $this->scan_directory($path);
            $blocks = array_merge($blocks, $discovered);
        }

        // Cache the results
        // set_transient($this->cache_key, $blocks, $this->cache_duration);

        return $blocks;
    }

    /**
     * Scan a single directory for blocks
     *
     * @param string $path Directory path to scan
     * @return array Array of discovered blocks in this directory
     */
    private function scan_directory($path) {
        $blocks = [];

        if (!is_dir($path)) {
            return $blocks;
        }

        // Get all subdirectories
        $dirs = glob($path . '*', GLOB_ONLYDIR);

        if (false === $dirs) {
            return $blocks;
        }

        foreach ($dirs as $dir) {
            $block_data = $this->validate_block_directory($dir);

            if ($block_data !== false) {
                $blocks[] = $block_data;
            }
        }

        return $blocks;
    }

    /**
     * Validate and extract data from a block directory
     *
     * @param string $dir Directory path to validate
     * @return array|false Block data array or false if invalid
     */
    private function validate_block_directory($dir) {
        $block_json_path = $dir . '/block.json';

        // block.json is required
        if (!file_exists($block_json_path)) {
            return false;
        }

        // Validate that block.json is valid JSON
        $block_json_content = file_get_contents($block_json_path);
        $block_json = json_decode($block_json_content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            // Invalid JSON, skip this block
            return false;
        }

        // Check for required properties
        if (empty($block_json['name'])) {
            return false;
        }

        // Get block slug from directory name
        $block_slug = basename($dir);

        // Check for files with multiple naming conventions
        // Priority: standard names (render.php, fields.php) > slug-based names (block-slug.php)

        // Render template
        $render_php_path = null;
        if (file_exists($dir . '/render.php')) {
            $render_php_path = $dir . '/render.php';
        } elseif (file_exists($dir . '/' . $block_slug . '.php')) {
            $render_php_path = $dir . '/' . $block_slug . '.php';
        }

        // Fields definition
        $fields_php_path = null;
        if (file_exists($dir . '/fields.php')) {
            $fields_php_path = $dir . '/fields.php';
        }

        // Frontend style
        $style_css_path = null;
        if (file_exists($dir . '/style.css')) {
            $style_css_path = $dir . '/style.css';
        } elseif (file_exists($dir . '/' . $block_slug . '.css')) {
            $style_css_path = $dir . '/' . $block_slug . '.css';
        }

        // Editor style
        $editor_css_path = null;
        if (file_exists($dir . '/editor.css')) {
            $editor_css_path = $dir . '/editor.css';
        }

        // Frontend script
        $script_js_path = null;
        if (file_exists($dir . '/script.js')) {
            $script_js_path = $dir . '/script.js';
        } elseif (file_exists($dir . '/' . $block_slug . '.js')) {
            $script_js_path = $dir . '/' . $block_slug . '.js';
        }

        // Config file
        $config_php_path = $dir . '/config-' . $block_slug . '.php';

        return [
            'path'       => trailingslashit($dir),
            'slug'       => $block_slug,
            'block_json' => $block_json_path,
            'render_php' => $render_php_path,
            'fields_php' => $fields_php_path,
            'style_css'  => $style_css_path,
            'editor_css' => $editor_css_path,
            'script_js'  => $script_js_path,
            'config_php' => file_exists($config_php_path) ? $config_php_path : null,
            'block_data' => $block_json,
        ];
    }

    /**
     * Clear the blocks cache
     *
     * @return bool True if cache was cleared, false otherwise
     */
    public function clear_cache() {
        return delete_transient($this->cache_key);
    }

    /**
     * Get a single block by name
     *
     * @param string $block_name Block name (e.g., 'siteforge/hero')
     * @return array|null Block data or null if not found
     */
    public function get_block($block_name) {
        $blocks = $this->scan_for_blocks();

        foreach ($blocks as $block) {
            if (isset($block['block_data']['name']) && $block['block_data']['name'] === $block_name) {
                return $block;
            }
        }

        return null;
    }

    /**
     * Count discovered blocks
     *
     * @return int Number of discovered blocks
     */
    public function count_blocks() {
        return count($this->scan_for_blocks());
    }
}
