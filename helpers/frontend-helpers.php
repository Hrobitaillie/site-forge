<?php
// Stockage global du contexte de bloc courant
global $siteforge_block_context;
$siteforge_block_context = [
    'attributes' => [],
    'content' => '',
    'block' => null,
];


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
