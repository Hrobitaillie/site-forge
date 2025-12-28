<?php
/**
 * InnerBlocks Component
 *
 * Permet d'utiliser <InnerBlocks /> comme une balise dans les templates render.php
 * Fonctionne comme le composant ACF InnerBlocks
 *
 * @package SiteForge\Blocks
 */

namespace SiteForge\Blocks;

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * InnerBlocksComponent class
 *
 * Parse et transforme les balises <InnerBlocks /> dans les rendus de blocs
 */
class InnerBlocksComponent {

    /**
     * Instance singleton
     */
    private static ?InnerBlocksComponent $instance = null;

    /**
     * Contenu InnerBlocks du bloc courant
     */
    private static ?string $current_content = null;

    /**
     * Get singleton instance
     */
    public static function get_instance(): InnerBlocksComponent {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        // Filtrer le rendu des blocs pour transformer <InnerBlocks />
        add_filter('siteforge/render_block_output', [$this, 'process_inner_blocks'], 10, 3);
    }

    /**
     * Définit le contenu InnerBlocks courant (appelé avant le rendu)
     */
    public static function set_content(?string $content): void {
        self::$current_content = $content;
    }

    /**
     * Récupère le contenu InnerBlocks courant
     */
    public static function get_content(): ?string {
        return self::$current_content;
    }

    /**
     * Traite les balises <InnerBlocks /> dans le rendu du bloc
     *
     * @param string $output    HTML du bloc
     * @param array  $attributes Attributs du bloc
     * @param mixed  $block     Instance du bloc
     * @return string HTML modifié
     */
    public function process_inner_blocks(string $output, array $attributes, $block): string {
        // Pattern pour matcher <InnerBlocks ... /> ou <InnerBlocks ...></InnerBlocks>
        // Le flag 's' permet à . de matcher les newlines
        $pattern = '/<InnerBlocks([\s\S]*?)(?:\s*\/>|><\/InnerBlocks>)/i';

        return preg_replace_callback($pattern, function ($matches) {
            $attrs_string = $matches[1] ?? '';
            // Nettoyer les whitespaces multiples
            $attrs_string = preg_replace('/\s+/', ' ', trim($attrs_string));
            return $this->render_inner_blocks($attrs_string);
        }, $output);
    }

    /**
     * Rend le composant InnerBlocks
     *
     * @param string $attrs_string Attributs de la balise
     * @return string HTML
     */
    private function render_inner_blocks(string $attrs_string): string {
        // Parser les attributs
        $attrs = $this->parse_attributes($attrs_string);
        $content = self::$current_content ?? '';

        // En frontend (pas dans l'éditeur), on retourne simplement le contenu
        if (!$this->is_editor_context()) {
            // Wrapper optionnel avec className
            if (!empty($attrs['className'])) {
                return '<div class="' . esc_attr($attrs['className']) . '">' . $content . '</div>';
            }
            return $content;
        }

        // Dans l'éditeur : créer un placeholder que le JS va remplacer
        $data_attrs = [];

        if (!empty($attrs['allowedBlocks'])) {
            // Si c'est déjà un JSON string, l'utiliser tel quel, sinon encoder
            $allowed = $attrs['allowedBlocks'];
            if (is_string($allowed) && $allowed[0] !== '[') {
                // C'est une liste séparée par des virgules
                $allowed = array_map('trim', explode(',', $allowed));
            }
            $data_attrs['data-allowed-blocks'] = is_array($allowed) ? wp_json_encode($allowed) : $allowed;
        }

        if (!empty($attrs['template'])) {
            // Le template peut être passé en JSON ou en array PHP sérialisé
            $template = $attrs['template'];
            if (is_string($template)) {
                $data_attrs['data-template'] = $template;
            } else {
                $data_attrs['data-template'] = wp_json_encode($template);
            }
        }

        if (isset($attrs['templateLock'])) {
            $lock = $attrs['templateLock'];
            if ($lock === 'false' || $lock === false) {
                $data_attrs['data-template-lock'] = 'false';
            } elseif ($lock === 'true' || $lock === true) {
                $data_attrs['data-template-lock'] = 'all';
            } else {
                $data_attrs['data-template-lock'] = $lock;
            }
        }

        // Classes CSS
        $classes = ['sf-inner-blocks'];
        if (!empty($attrs['className'])) {
            $classes[] = $attrs['className'];
        }

        // Construire le HTML du placeholder
        // Note: on n'échappe pas les valeurs JSON car elles seront parsées par JS
        $html = '<div class="' . esc_attr(implode(' ', $classes)) . '"';
        foreach ($data_attrs as $key => $value) {
            // Utiliser htmlspecialchars avec ENT_NOQUOTES pour garder les " intacts
            $html .= ' ' . $key . "='" . htmlspecialchars($value, ENT_NOQUOTES, 'UTF-8') . "'";
        }
        $html .= '>' . $content . '</div>';

        return $html;
    }

    /**
     * Parse les attributs d'une balise HTML
     *
     * @param string $attrs_string String d'attributs
     * @return array Attributs parsés
     */
    private function parse_attributes(string $attrs_string): array {
        $attrs = [];

        // Décoder les entités HTML potentielles
        $attrs_string = html_entity_decode($attrs_string, ENT_QUOTES, 'UTF-8');

        // Matcher les attributs avec simple quotes
        if (preg_match_all('/(\w+)=\'([^\']+)\'/', $attrs_string, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $attrs[$match[1]] = $match[2];
            }
        }

        // Matcher les attributs avec double quotes
        if (preg_match_all('/(\w+)="([^"]+)"/', $attrs_string, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $attrs[$match[1]] = $match[2];
            }
        }

        return $attrs;
    }

    /**
     * Vérifie si on est dans le contexte de l'éditeur
     */
    private function is_editor_context(): bool {
        // REST API pour ServerSideRender
        if (defined('REST_REQUEST') && REST_REQUEST) {
            return true;
        }

        // AJAX dans l'admin
        if (wp_doing_ajax() && is_admin()) {
            return true;
        }

        // Requête JSON
        if (wp_is_json_request()) {
            return true;
        }

        return false;
    }
}
