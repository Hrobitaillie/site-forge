<?php
// Stockage global du contexte de bloc courant
global $siteforge_block_context;
$siteforge_block_context = [
    'attributes' => [],
    'content' => '',
    'block' => null,
];

/**
 * Définit le contexte du bloc (appelé par Blocks avant le render)
 */
function siteforge_set_block_context($attributes, $content, $block) {
    global $siteforge_block_context;
    $siteforge_block_context = [
        'attributes' => $attributes,
        'content' => $content,
        'block' => $block,
    ];
}

/**
 * Réinitialise le contexte après le render
 */
function siteforge_clear_block_context() {
    global $siteforge_block_context;
    $siteforge_block_context = [
        'attributes' => [],
        'content' => '',
        'block' => null,
    ];
}

/**
 * Récupère un attribut du bloc courant
 *
 * @param string $key     Nom de l'attribut
 * @param mixed  $default Valeur par défaut
 * @return mixed
 *
 * @example
 * $title = attr('title', 'Default Title');
 */
if (!function_exists('attr')) {
    function attr($key, $default = null) {
        global $siteforge_block_context;
        return $siteforge_block_context['attributes'][$key] ?? $default;
    }
}

/**
 * Vérifie si un style de bloc est actif
 *
 * @param string $styleName Nom du style (ex: 'rounded', 'outline')
 * @return bool True si le style est actif
 *
 * @example
 * if (has_block_style('rounded')) {
 *     // Appliquer les styles arrondis
 * }
 */
if (!function_exists('has_block_style')) {
    function has_block_style($styleName) {
        $className = attr('className', '');
        return str_contains($className, 'is-style-' . $styleName);
    }
}

/**
 * Combine des classes CSS conditionnellement
 *
 * @param mixed ...$args Classes ou conditions ['class' => bool]
 * @return string Classes combinées
 *
 * @example
 * $classes = classes('block', ['is-active' => $active], $customClass);
 * classes('hero', 'relative', ['reversed' => $isReversed]);
 */
if (!function_exists('classes')) {
    function classes(...$args) {
        $result = [];

        foreach ($args as $arg) {
            if (empty($arg)) {
                continue;
            }

            if (is_string($arg)) {
                $result[] = $arg;
            } elseif (is_array($arg)) {
                foreach ($arg as $class => $condition) {
                    if (is_int($class)) {
                        // Index numérique = classe directe
                        $result[] = $condition;
                    } elseif ($condition) {
                        // Clé string = classe conditionnelle
                        $result[] = $class;
                    }
                }
            }
        }

        return implode(' ', array_filter($result));
    }
}

/**
 * Génère les attributs du wrapper de bloc (alias de get_block_wrapper_attributes)
 *
 * @param array $options Options ['class', 'style', 'id', ...]
 * @return string Attributs HTML
 */
if (!function_exists('block_wrapper')) {
    function block_wrapper($options = []) {
        return get_block_wrapper_attributes($options);
    }
}


/**
 * Récupère l'URL d'une image depuis différents formats
 *
 * @param mixed  $value Image value (string URL, int ID, or array with 'url')
 * @param string $size  Image size (default: 'large')
 * @return string URL de l'image
 */
if (!function_exists('image_url')) {
    function image_url($value, $size = 'large') {
        if (empty($value)) {
            return '';
        }

        // Array avec URL
        if (is_array($value) && !empty($value['url'])) {
            return $value['url'];
        }

        // ID numérique
        if (is_numeric($value)) {
            return wp_get_attachment_image_url($value, $size) ?: '';
        }

        // URL string
        if (is_string($value)) {
            return $value;
        }

        return '';
    }
}

if (!function_exists('image_id')) {
    /**
     * Récupère l'ID d'une image depuis différents formats
     */
    function image_id($value) {
        if (empty($value)) {
            return null;
        }
        if (is_array($value) && !empty($value['id'])) {
            return (int) $value['id'];
        }
        if (is_numeric($value)) {
            return (int) $value;
        }
        return null;
    }
}

if (!function_exists('image')) {
    /**
     * Génère une balise img responsive
     */
    function image($value, $size = 'large', $attributes = []) {
        $id = image_id($value);

        if ($id) {
            return wp_get_attachment_image($id, $size, false, $attributes);
        }

        $url = image_url($value, $size);
        if (!$url) {
            return '';
        }

        // Fallback pour URL sans ID
        $attrs = build_attributes([
            'src' => $url,
            'alt' => $attributes['alt'] ?? '',
            'class' => $attributes['class'] ?? '',
            'loading' => 'lazy',
        ]);

        return '<img ' . $attrs . '>';
    }
}

if (!function_exists('build_attributes')) {
    /**
     * Construit une chaîne d'attributs HTML
     */
    function build_attributes($attributes) {
        $parts = [];

        foreach ($attributes as $name => $value) {
            if ($value === true) {
                $parts[] = esc_attr($name);
            } elseif ($value !== false && $value !== null && $value !== '') {
                $parts[] = sprintf('%s="%s"', esc_attr($name), esc_attr($value));
            }
        }

        return implode(' ', $parts);
    }
}

if (!function_exists('button_classes')) {
    /**
     * Génère les classes CSS d'un bouton
     */
    function button_classes($style = 'primary', $size = 'medium', $extras = []) {
        $base = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300';

        $styles = [
            'primary' => 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105',
            'secondary' => 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105',
            'outline' => 'border-2 border-current hover:bg-white hover:text-gray-900',
            'ghost' => 'hover:bg-gray-100 text-gray-700',
        ];

        $sizes = [
            'small' => 'px-4 py-2 text-sm',
            'medium' => 'px-6 py-3 text-base',
            'large' => 'px-8 py-4 text-lg',
        ];

        return classes(
            $base,
            $styles[$style] ?? $styles['primary'],
            $sizes[$size] ?? $sizes['medium'],
            $extras
        );
    }
}

if (!function_exists('button')) {
    /**
     * Génère un lien stylisé en bouton
     */
    function button($text, $url = '#', $options = []) {
        $style = $options['style'] ?? 'primary';
        $size = $options['size'] ?? 'medium';
        $class = $options['class'] ?? '';
        $target = $options['target'] ?? '';
        $attrs = $options['attrs'] ?? [];

        $btn_classes = button_classes($style, $size, [$class]);

        $attributes = array_merge([
            'href' => esc_url($url),
            'class' => $btn_classes,
        ], $attrs);

        if ($target) {
            $attributes['target'] = $target;
            if ($target === '_blank') {
                $attributes['rel'] = 'noopener noreferrer';
            }
        }

        return sprintf(
            '<a %s>%s</a>',
            build_attributes($attributes),
            esc_html($text)
        );
    }
}

if (!function_exists('html')) {
    /**
     * Échappe du HTML sécurisé (autorise les balises standard)
     */
    function html($content) {
        return wp_kses_post($content);
    }
}

if (!function_exists('text')) {
    /**
     * Échappe du texte simple
     */
    function text($text) {
        return esc_html($text);
    }
}

if (!function_exists('sif_maybe_get')) {
    /**
     * Version SiteForge de acf_maybe_get
     * (gère aussi les objets)
     *
     * @param array|object $data    Tableau ou objet à parcourir.
     * @param int|string   $key     Clé ou propriété à récupérer.
     * @param null         $default Valeur de retour par défaut si la clé n'existe pas.
     *
     * @return mixed|null  La valeur trouvée ou la valeur par défaut.
     */
    function sif_maybe_get($data, $key = 0, $default = null) {
        if (is_object($data)) {
            $data = (object) $data;
            return isset($data->$key) ? $data->$key : $default;
        } elseif (is_array($data)) {
            $data = (array) $data;
            return isset($data[$key]) ? $data[$key] : $default;
        }
        return $default;
    }
}

if (!function_exists('sif_btn')) {
    /**
     * Affiche un bouton avec un lien et des options personnalisables.
     *
     * @param array $link Données du lien (type, url, title, target, value, etc.)
     * @param array $args Arguments du bouton (type, icon, icon_position, class, etc.)
     */
    function sif_btn($link = array(), $args = array()) {
        // Si le lien paramètre est une chaîne, on le convertit
        if (is_string($link)) {
            $link = array(
                'type'  => 'url',
                'url'   => $args['link'] ?? '',
                'title' => $args['title'] ?? '',
            );
            unset($args['link'], $args['title']);
        }

        if (!is_array($link)) {
            return;
        }

        $overrides = sif_maybe_get($args, 'overrides');
        if ($overrides && is_array($overrides)) {
            $link = wp_parse_args($overrides, $link);
        }

        if (empty(sif_maybe_get($link, 'title')) && sif_maybe_get($args, 'force_title') === true) {
            $link['title'] = sif_maybe_get($link, 'name', '');
        }

        // Génération dynamique de l'URL selon le type de lien
        $link_type = sif_maybe_get($link, 'type');
        if (!empty($link_type)) {
            $dynamic_url = '';
            $value = sif_maybe_get($link, 'value');

            switch ($link_type) {
                case 'page':
                case 'post':
                    if ($value) {
                        $dynamic_url = get_permalink($value);
                    }
                    break;
                case 'term':
                    if ($value) {
                        $dynamic_url = get_term_link($value);
                        if (is_wp_error($dynamic_url)) {
                            $dynamic_url = '';
                        }
                    }
                    break;
                case 'archive':
                    if ($value) {
                        $dynamic_url = get_post_type_archive_link($value);
                    }
                    break;
                case 'mail':
                    if ($value) {
                        $dynamic_url = str_starts_with($value, 'mailto:') ? $value : 'mailto:' . $value;
                    }
                    break;
                case 'phone':
                    if ($value) {
                        $dynamic_url = str_starts_with($value, 'tel:') ? $value : 'tel:' . $value;
                    }
                    break;
            }

            if ($dynamic_url) {
                $link['url'] = $dynamic_url;
            }
        }

        $btn_type = sif_maybe_get($args, 'type', 'btn-primary');

        // Vérifie si un template part spécifique pour ce type existe
        $specific_template_path = get_template_directory() . '/siteforge/src/buttons/' . $btn_type . '.php';

        // Prépare les arguments pour le template
        $template_args = array(
            'title'         => sif_maybe_get($link, 'title', ''),
            'type'          => $btn_type,
            'icon'          => sif_maybe_get($args, 'icon', 'arrow-right'),
            'icon_position' => sif_maybe_get($args, 'icon_position', 'after'),
            'link'          => $link,
            'class'         => sif_maybe_get($args, 'class', '') . ' ' . sif_maybe_get($link, 'class_gtm', ''),
            'html_tag'      => sif_maybe_get($args, 'html_tag', ''),
            'tabindex'      => sif_maybe_get($args, 'tabindex', ''),
            'before_title'  => sif_maybe_get($args, 'before_title', ''),
            'after_title'   => sif_maybe_get($args, 'after_title', ''),
            'around_title'  => sif_maybe_get($args, 'around_title', array()),
            'force_title'   => sif_maybe_get($args, 'force_title', false),
            'download'      => sif_maybe_get($args, 'download', false),
            'data'          => sif_maybe_get($args, 'data', array()),
        );

        // Ajoute tous les autres arguments non inclus
        foreach ($args as $key => $value) {
            if (!isset($template_args[$key])) {
                $template_args[$key] = $value;
            }
        }

        if (file_exists($specific_template_path)) {
            get_template_part('siteforge/src/buttons/' . $btn_type, null, $template_args);
        } else {
            get_template_part('siteforge/src/buttons/button', null, $template_args);
        }
    }
}

if (!function_exists('_sif_build_attrs')) {
    /**
     * Construit une chaîne d'attributs HTML à partir d'un tableau.
     *
     * @param array|string $attrs   Tableau d'attributs ou chaîne de classes
     * @param array        $options Options (skip_empty: bool)
     * @return string Chaîne d'attributs HTML
     */
    function _sif_build_attrs($attrs, $options = array()): string {
        $defaults = array('skip_empty' => false);
        $options = wp_parse_args($options, $defaults);

        if (is_string($attrs)) {
            return !empty($attrs) ? sprintf('class="%s"', esc_attr($attrs)) : '';
        }

        if (!is_array($attrs)) {
            return '';
        }

        $url_attrs = array('href', 'src', 'action', 'poster', 'cite', 'formaction');
        $attr_parts = array();

        if (!empty($attrs['class'])) {
            $attr_parts[] = sprintf('class="%s"', esc_attr($attrs['class']));
        }

        if (!empty($attrs['data']) && is_array($attrs['data'])) {
            foreach ($attrs['data'] as $key => $value) {
                $attr_parts[] = sprintf('data-%s="%s"', esc_attr($key), esc_attr($value));
            }
        }

        if (!empty($attrs['attrs']) && is_array($attrs['attrs'])) {
            foreach ($attrs['attrs'] as $attr_name => $attr_value) {
                if ($options['skip_empty'] && ($attr_value === null || $attr_value === '')) {
                    continue;
                }
                $escape_func = in_array($attr_name, $url_attrs, true) ? 'esc_url' : 'esc_attr';
                $attr_parts[] = sprintf('%s="%s"', esc_attr($attr_name), $escape_func($attr_value));
            }
        }

        return implode(' ', $attr_parts);
    }
}

if (!function_exists('get_svg')) {
    /**
     * Récupère un SVG depuis un sprite.
     *
     * @param string       $icon   Nom de l'icône
     * @param string|null  $sprite Nom du fichier sprite (sans extension)
     * @param array        $args   Attributs HTML à ajouter au SVG
     * @return string|null HTML du SVG ou null si non trouvé
     */
    function get_svg($icon, $sprite = null, $args = array()) {
        if (null === $sprite) {
            $sprite = 'lucide_sprite';
        }

        $icon_id = $icon;

        if ($sprite === false) {
            if (defined('DOING_AJAX') && DOING_AJAX) {
                $sprite = 'project';
            } else {
                return null;
            }
        }

        // Charger le fichier SVG depuis le thème
        $svg_path = get_stylesheet_directory() . '/siteforge/src/' . $sprite . '.svg';
        // Fallback vers sprites/
        if (!file_exists($svg_path)) {
            $svg_path = get_stylesheet_directory() . '/siteforge/src/sprites/' . $sprite . '.svg';
        }

        if (!file_exists($svg_path)) {
            return null;
        }

        $svg_content = file_get_contents($svg_path);
        if ($svg_content === false) {
            return null;
        }

        // Extraire le symbol et ses attributs
        $pattern = '/<symbol([^>]*id="' . preg_quote($icon_id, '/') . '"[^>]*)>(.*?)<\/symbol>/is';
        if (!preg_match($pattern, $svg_content, $matches)) {
            return null;
        }

        $attributes_string = $matches[1];
        $content = $matches[2];

        // Extraire les attributs du symbol
        $symbol_attrs = array();
        if (preg_match('/viewBox="([^"]*)"/', $attributes_string, $viewbox_match)) {
            $symbol_attrs['viewBox'] = $viewbox_match[1];
        }
        if (preg_match('/width="([^"]*)"/', $attributes_string, $width_match)) {
            $symbol_attrs['width'] = $width_match[1];
        }
        if (preg_match('/height="([^"]*)"/', $attributes_string, $height_match)) {
            $symbol_attrs['height'] = $height_match[1];
        }

        $default_attrs = array('aria-hidden' => 'true');
        $final_attrs = array_merge($default_attrs, $symbol_attrs, $args);

        $default_class = (strpos($sprite, 'lucide') === 0) ? 'sif-lucide-icon' : 'sif-svg-icon';
        $icon_class = $default_class . ' ' . $default_class . '-' . esc_attr($icon_id);

        if (isset($final_attrs['class'])) {
            $icon_class .= ' ' . $final_attrs['class'];
            unset($final_attrs['class']);
        }

        $attrs_string = ' ' . _sif_build_attrs(array(
            'class' => $icon_class,
            'attrs' => $final_attrs,
        ));

        return sprintf('<svg%s>%s</svg>', $attrs_string, $content);
    }
}

if (!function_exists('svg')) {
    /**
     * Affiche un SVG depuis un sprite.
     */
    function svg($icon, $sprite = null, $args = array()) {
        echo get_svg($icon, $sprite, $args);
    }
}

if (!function_exists('icon')) {
    /**
     * Récupère une icône Lucide.
     *
     * @param string $iconName Nom de l'icône
     * @param array  $attrs    Attributs HTML
     * @param string $sprite   Nom du sprite
     * @return string HTML du SVG
     */
    function icon($iconName, $attrs = [], $sprite = 'lucide_sprite') {
        if (empty($iconName)) {
            return '';
        }
        return get_svg($iconName, $sprite, $attrs);
    }
}

if (!function_exists('the_icon')) {
    /**
     * Affiche une icône Lucide.
     */
    function the_icon($iconName, $attrs = [], $sprite = 'lucide_sprite') {
        echo icon($iconName, $attrs, $sprite);
    }
}

if (!function_exists('sif_log')) {
    /**
     * Version améliorée de acf_log() qui affiche le fichier et la ligne du log.
     *
     * @param mixed $arg Argument(s) à afficher
     * @return void
     */
    function sif_log() {
        $backtrace = debug_backtrace(DEBUG_BACKTRACE_PROVIDE_OBJECT, 2);
        $caller    = $backtrace[0];
        $file      = basename($caller['file']);
        $line      = $caller['line'];
        $args      = func_get_args();

        // loop
        foreach ($args as $i => $arg) {

            // array | object
            if (is_array($arg) || is_object($arg)) {
                $arg = print_r($arg, true);

                // bool
            } elseif (is_bool($arg)) {
                $arg = 'bool(' . ($arg ? 'true' : 'false') . ')';
            }

            // update
            $args[$i] = $arg;
        }

        // log
        error_log("[{$file}:{$line}] " . implode(' ', $args));
    }
}
