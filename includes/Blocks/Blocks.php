<?php

namespace SiteForge\Blocks;

if (!defined('ABSPATH')) {
    exit;
}

class Blocks {

    /**
     * Field Renderer instance
     *
     * @var FieldRenderer
     */
    private $field_renderer;

    /**
     * Constructor
     *
     * @param FieldRenderer  $field_renderer Field renderer instance
     */
    public function __construct(FieldRenderer $field_renderer) {

        $this->field_renderer = $field_renderer;
        // Initialisation des blocs
        add_action('init', array($this, 'create_block_multi_block_plugin_block_init'));

        add_filter('allowed_block_types_all', array($this, 'enable_blocks'), 10, 2);
        add_filter('block_categories_all', array($this, 'add_custom_categories'));

        // Charger les scripts de l'éditeur
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_editor_assets'));

        // Désactiver la suggestion de plugin et blocs dans l'éditeur Gutenberg
        add_action('init', array($this, 'disable_block_directory'), 20);

        // Paramètre PIB dans block.json
        // TODO
        // add_filter( 'block_type_metadata', array( $this, 'sif_add_blocks_icons' ), 99 );
        // add_filter( 'block_type_metadata_settings', array( $this, 'sif_expose_sif_meta' ), 10, 2 );

        // Remplacer les classes de couleurs par des variables CSS
        // TODO
        // add_filter( 'render_block', array( $this, 'front_convert_wp_classes_to_tailwind' ), 10, 2 );
    }

    /**
     * Initialise et enregistre tous les blocs disponibles dans le plugin
     * Gère les blocs natifs WordPress autorisés et les blocs personnalisés PIB
     *
     * @since 0.0.1
     */
    public function create_block_multi_block_plugin_block_init() {

        $natives_blocks = array(
            'core/paragraph',
            'core/heading',
            'core/image',
            'core/media-text',
            'core/group',
            'core/separator',
            'core/shortcode',
            'core/block',
            'core/list',
            'core/list-item',
        );

        $directories = glob(SIF_DIR . 'src/blocks/*', GLOB_ONLYDIR);
        $blockScanner = new BlockScanner();
        $sif_blocks = $blockScanner->scan_for_blocks();

        $all_blocks  = $natives_blocks;
        foreach ($sif_blocks as $block_data) {
            $slug = basename($block_data['path']);

            $this->register_single_block($block_data);
            $all_blocks[] = 'sif/' . $slug;
        }
        // On sauvegarde la liste des blocs dans la base de données
        $sif_blocks_list = get_option('sif_blocks_list');

        if (!$sif_blocks_list) {
            add_option('sif_blocks_list', $all_blocks);
        } elseif ($sif_blocks_list !== $all_blocks) {
            update_option('sif_blocks_list', $all_blocks);
        }
    }

    /**
     * Register a single block
     *
     * @param array $block_data Block data from scanner
     * @return bool True if registered successfully, false otherwise
     */
    private function register_single_block($block_data) {
        if (empty($block_data['block_json']) || !file_exists($block_data['block_json'])) {
            return false;
        }

        $block_json_content = file_get_contents($block_data['block_json']);
        $block_json = json_decode($block_json_content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return false;
        }

        $block_name = $block_json['name'] ?? '';

        if (empty($block_name)) {
            return false;
        }

        // Load config file if exists (for hooks, filters, enqueue)
        if (!empty($block_data['config_php']) && file_exists($block_data['config_php'])) {
            include_once $block_data['config_php'];
        }

        // Allow other code to modify block before registration
        do_action('siteforge/before_register_block', $block_data, $block_json);

        // Only pass necessary args - let WordPress handle everything else from block.json
        $register_args = [];
        $fields = [];

        // If siteforge.fields exists in block.json, merge field definitions into attributes
        if (!empty($block_json['siteforge']['fields'])) {
            $fields = $block_json['siteforge']['fields'];

            // Convert fields to attributes
            $field_attributes = $this->field_renderer->fields_to_attributes($fields);

            // Merge with existing attributes from block.json
            $existing_attributes = $block_json['attributes'] ?? [];
            $register_args['attributes'] = array_merge($existing_attributes, $field_attributes);
        }
        // Localize field definitions for JavaScript
        $this->localize_block_fields($block_name, $fields, $block_json);

        // Add render callback if render.php exists
        $render_php_path = $block_data['path'] . 'render.php';
        if (file_exists($render_php_path)) {
            $register_args['render_callback'] = function ($attributes, $content, $block) use ($render_php_path) {
                return $this->render_block_template($render_php_path, $attributes, $content, $block);
            };
        } elseif (!empty($block_data['render_php']) && file_exists($block_data['render_php'])) {
            // Fallback to old naming convention (block-name.php)
            $render_php_path = $block_data['render_php'];

            $register_args['render_callback'] = function ($attributes, $content, $block) use ($render_php_path) {
                return $this->render_block_template($render_php_path, $attributes, $content, $block);
            };
        }

        // Register the block type using directory path (WordPress reads block.json automatically)
        $block_type = register_block_type($block_data['path'], $register_args);

        if (!$block_type) {
            return false;
        }


        // Fire action after successful registration
        do_action('siteforge/after_register_block', $block_name, $block_data, $block_type);

        return true;
    }

    /**
     * Render block template
     *
     * @param string   $template_path Path to render template
     * @param array    $attributes    Block attributes
     * @param string   $content       Block content
     * @param \WP_Block $block         Block instance
     * @return string Rendered HTML
     */
    private function render_block_template($template_path, $attributes, $content, $block) {
        // Make variables available to template
        $attributes = (array) $attributes;
        $content = (string) $content;
        $block = $block;

        // Allow filtering of template path
        $template_path = apply_filters('siteforge/render_template_path', $template_path, $attributes, $block);

        if (!file_exists($template_path)) {
            return '';
        }

        // Set block context for helper functions (get_attribute, etc.)
        if (function_exists('siteforge_set_block_context')) {
            siteforge_set_block_context($attributes, $content, $block);
        }

        // Set content for InnerBlocksComponent
        InnerBlocksComponent::set_content($content);

        // Start output buffering
        ob_start();

        // Include template
        include $template_path;

        $output = ob_get_clean();

        // Clear block context
        if (function_exists('siteforge_clear_block_context')) {
            siteforge_clear_block_context();
        }

        // Allow filtering of output (processes <InnerBlocks /> tags)
        return apply_filters('siteforge/render_block_output', $output, $attributes, $block);
    }

    /**
     * Enregistre uniquement les blocs compatibles avec SiteForge
     *
     * @since 0.0.1
     * @param array $allowed_blocks Liste des blocs autorisés
     * @param object $editor_context Contexte de l'éditeur
     * @return array $sif_blocks_list Liste des blocs SiteForge autorisés
     */
    public function enable_blocks($allowed_blocks, $editor_context) {

        $sif_blocks_list = get_option('sif_blocks_list');
        $sif_blocks_list = apply_filters('sif_blocks_list', $sif_blocks_list, $editor_context);
        $sif_blocks_list = apply_filters('sif_blocks_list_with_extensions', $sif_blocks_list, $editor_context);
        return $sif_blocks_list;
    }

    /**
     * Ajoute les catégories personnalisées de blocs Gutenberg
     *
     * @since 2.0.3
     * @param array $categories Liste des catégories existantes
     * @return array Liste des catégories avec les nouvelles catégories ajoutées
     */
    public function add_custom_categories($categories) {
        // Ajouter les catégories par défaut du plugin
        $categories = array_merge($categories, $this->get_sif_categories());

        /**
         * Filtre pour ajouter des catégories de blocs personnalisées depuis le thème
         *
         * @since 2.0.3
         * @param array $categories Liste des catégories existantes
         * @return array Liste des catégories modifiée
         */
        $categories = apply_filters('sif_block_categories', $categories);
        return $categories;
    }

    /**
     * Récupère les catégories par défaut du plugin avec leurs titres
     *
     * @since 2.0.3
     * @return array
     */
    private function get_sif_categories() {
        return array(
            array(
                'slug'  => 'slider',
                'title' => __('Sliders', 'pilo-blocks'),
            ),
            array(
                'slug'  => 'checkerboard',
                'title' => __('Damiers', 'pilo-blocks'),
            ),
            array(
                'slug'  => 'grid',
                'title' => __('Grille', 'pilo-blocks'),
            ),
            array(
                'slug'  => 'single',
                'title' => __('Page', 'pilo-blocks'),
            ),
            array(
                'slug'  => 'archive',
                'title' => __('Archive', 'pilo-blocks'),
            ),
            array(
                'slug'  => 'cta',
                'title' => __('CTA', 'pilo-blocks'),
            ),
            array(
                'slug'  => 'last-posts',
                'title' => __('Dernières publications', 'pilo-blocks'),
            ),
            array(
                'slug'  => 'maps',
                'title' => __('Cartes', 'pilo-blocks'),
            ),
            array(
                'slug'  => 'perso',
                'title' => __('Espace Perso', 'pilo-blocks'),
            ),
        );
    }

    /**
     * Désactive la suggestion de plugin et blocs dans l'éditeur Gutenberg 'core/block-directory'.
     *
     * @since 1.0.24
     * @see https://developer.wordpress.org/block-editor/reference-guides/filters/editor-filters/#block-directory
     */
    public function disable_block_directory() {
        // Vérifie que la fonction existe avant de tenter de la supprimer
        if (function_exists('wp_enqueue_editor_block_directory_assets')) {
            remove_action('enqueue_block_editor_assets', 'wp_enqueue_editor_block_directory_assets');
        }
    }

    /**
     * Charge les assets de l'éditeur et passe les données des blocs au JS
     */
    public function enqueue_editor_assets() {
        // Scanner les blocs
        $blockScanner = new BlockScanner();
        $sif_blocks = $blockScanner->scan_for_blocks();

        // Préparer les données pour JS et enqueue les assets des blocs
        $blocks_data = [];
        foreach ($sif_blocks as $block) {
            sif_log('Enqueue editor assets for block: ' . $block['slug']);
            if (!empty($block['block_data']['name'])) {
                $blocks_data[] = [
                    'name' => $block['block_data']['name'],
                    'title' => $block['block_data']['title'] ?? '',
                    'category' => $block['block_data']['category'] ?? 'common',
                    'icon' => $block['block_data']['icon'] ?? 'block-default',
                    'description' => $block['block_data']['description'] ?? '',
                ];

                // Enqueue editorScript si défini
                $this->enqueue_block_editor_script($block);

                // Enqueue editorStyle si défini
                $this->enqueue_block_editor_style($block);
            }
        }

        // Note: Le script principal siteforge-block-editor est chargé dans Main.php
        // Il utilise build/js/editor.js avec le système avancé de field controls
        // Les données des blocs sont localisées via window.siteforgeBlocks dans localize_block_fields()
    }

    /**
     * Enqueue le script éditeur d'un bloc si défini dans block.json
     *
     * @param array $block Block data from scanner
     */
    private function enqueue_block_editor_script($block) {
        $block_data = $block['block_data'] ?? [];
        $editor_script = $block_data['editorScript'] ?? null;

        if (empty($editor_script)) {
            return;
        }

        $script_url = $this->resolve_block_asset_url($editor_script, $block['path']);

        if ($script_url) {
            $handle = 'sif-block-' . $block['slug'] . '-editor';
            wp_enqueue_script(
                $handle,
                $script_url,
                [
                    'wp-blocks',
                    'wp-element',
                    'wp-block-editor',
                    'wp-components',
                    'wp-i18n',
                    'wp-data',
                    'wp-primitives',
                    'wp-api-fetch',
                    'wp-compose',
                ],
                SIF_VERSION,
                false // Charger dans le header pour s'assurer que wp.* est disponible
            );
        }
    }

    /**
     * Enqueue le style éditeur d'un bloc si défini dans block.json
     *
     * @param array $block Block data from scanner
     */
    private function enqueue_block_editor_style($block) {
        $block_data = $block['block_data'] ?? [];
        $editor_style = $block_data['editorStyle'] ?? null;

        if (empty($editor_style)) {
            return;
        }

        $style_url = $this->resolve_block_asset_url($editor_style, $block['path']);

        if ($style_url) {
            $handle = 'sif-block-' . $block['slug'] . '-editor-style';
            wp_enqueue_style(
                $handle,
                $style_url,
                [],
                SIF_VERSION
            );
        }
    }

    /**
     * Résout un chemin d'asset block.json vers une URL
     *
     * Supporte:
     * - file:./path/to/file.js (chemin relatif au bloc)
     * - file:../path/to/file.js (chemin relatif avec parent)
     * - https://... (URL absolue)
     *
     * @param string $asset_path Chemin de l'asset depuis block.json
     * @param string $block_path Chemin absolu du dossier du bloc
     * @return string|null URL de l'asset ou null si invalide
     */
    private function resolve_block_asset_url($asset_path, $block_path) {
        // URL absolue
        if (strpos($asset_path, 'http://') === 0 || strpos($asset_path, 'https://') === 0) {
            return $asset_path;
        }

        // Chemin file:
        if (strpos($asset_path, 'file:') === 0) {
            $relative_path = substr($asset_path, 5); // Enlever "file:"

            // Résoudre le chemin absolu
            $absolute_path = realpath($block_path . $relative_path);

            if ($absolute_path && file_exists($absolute_path)) {
                // Convertir le chemin absolu en URL
                $plugin_path = realpath(SIF_DIR);
                if (strpos($absolute_path, $plugin_path) === 0) {
                    $relative_to_plugin = substr($absolute_path, strlen($plugin_path));
                    return SIF_URL . ltrim($relative_to_plugin, '/');
                }
            }
        }

        return null;
    }


    /**
     * Localize block fields for JavaScript
     *
     * @param string $block_name Block name
     * @param array  $fields     Field definitions
     */
    private function localize_block_fields($block_name, $fields, $block_json = []) {
        static $localized_blocks = [];

        if (in_array($block_name, $localized_blocks, true)) {
            return;
        }

        $prepared_fields = $this->field_renderer->prepare_fields_for_js($fields);

        // Add to global JS object
        if (!isset($GLOBALS['siteforge_blocks_data'])) {
            $GLOBALS['siteforge_blocks_data'] = [];
        }

        // Préparer la configuration innerBlocks
        $inner_blocks_config = $block_json['siteforge']['innerBlocks'] ?? null;

        $GLOBALS['siteforge_blocks_data'][$block_name] = [
            'fields' => $prepared_fields,
            'title' => $block_json['title'] ?? $block_name,
            'description' => $block_json['description'] ?? '',
            'icon' => $block_json['icon'] ?? 'block-default',
            'category' => $block_json['category'] ?? 'siteforge',
            'supports' => $block_json['supports'] ?? [],
            'innerBlocks' => $inner_blocks_config,
        ];

        $localized_blocks[] = $block_name;

        // Ensure the data gets localized to the script
        add_action('admin_footer', function () {
            if (!empty($GLOBALS['siteforge_blocks_data'])) {
?>
                <script type="text/javascript">
                    window.siteforgeBlocks = window.siteforgeBlocks || {};
                    <?php foreach ($GLOBALS['siteforge_blocks_data'] as $name => $data): ?>
                        window.siteforgeBlocks['<?php echo esc_js($name); ?>'] = <?php echo wp_json_encode($data); ?>;
                    <?php endforeach; ?>
                </script>
<?php
            }
        }, 99);
    }
}
