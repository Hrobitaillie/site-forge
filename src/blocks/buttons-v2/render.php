<?php

/**
 * Rendu du bloc Buttons V2
 *
 * @param array  $attributes
 * @param string $content
 */
$buttons  = $data['buttons'] ?? array();
$settings = $data['settings'] ?? array();

if ( empty( $buttons ) ) {
    return;
}

// Styles pour le conteneur
$container_style = array();
if ( isset( $settings['gap'] ) ) {
    $container_style[] = 'gap: ' . $settings['gap'];
}

$container_classes = array( 'pib-buttons', '|', 'not-prose', 'flex' );
if ( isset( $settings['justifyValue'] ) ) {
    $container_classes[] = $settings['justifyValue'];
}
if ( isset( $settings['flexWrap'] ) && $settings['flexWrap'] ) {
    $container_classes[] = 'flex-wrap';
}

?>
<div
    class="<?php echo esc_attr( implode( ' ', $container_classes ) ); ?>"
    <?php if ( !empty( $container_style ) ) : ?>
    style="<?php echo esc_attr( implode( '; ', $container_style ) ); ?>"
    <?php endif; ?>>
    <?php
    foreach ( $buttons as $index => $btn ) :
        // Transformation des données pour pib_btn($link, $args)
        $btn_link = $btn['link'] ?? array();

        // Conversion du format ACFE vers le format pib_btn
        $link = array();
        if ( !empty( $btn_link ) ) {
            // Récupération de la valeur selon le type de lien
            $value = '';
            switch ( $btn_link['type'] ?? 'url' ) {
                case 'post':
                case 'page':
                case 'archive':
                    $value = $btn_link['postId'] ?? '';
                    break;
                case 'term':
                    $value = $btn_link['termId'] ?? '';
                    break;
            }

            $link = array(
                'type'     => $btn_link['type'] ?? 'url',
                'value'    => $value,
                'url'      => $btn_link['url'] ?? '',
                'name'     => $btn_link['title'] ?? '',
                'title'    => $btn['title'] ?? '',
                'target'   => $btn_link['target'] ?? '',
                'download' => $btn['download'] ? '1' : '0',
                'seo_opt'  => '0',
            );

            // Génération automatique de l'URL si nécessaire
            switch ( $link['type'] ) {
                case 'post':
                case 'page':
                    $url         = get_permalink( intval( $link['value'] ) );
                    $link['url'] = is_wp_error( $url ) || empty( $url ) ? '' : $url;
                    break;
                case 'term':
                    $url         = get_term_link( intval( $link['value'] ) );
                    $link['url'] = is_wp_error( $url ) || empty( $url ) ? '' : $url;
                    break;
                case 'archive':
                    $post_type = $btn_link['postType'] ?? '';
                    if ( !empty( $post_type ) ) {
                        $url         = get_post_type_archive_link( $post_type );
                        $link['url'] = is_wp_error( $url ) || empty( $url ) ? '' : $url;
                    }
                    break;
            }
        }

        // Arguments pour pib_btn
        $args = array(
            'type'          => $btn['type'] ?? 'btn-primary',
            'icon'          => $btn['icon'] ?? 'arrow-right',
            'icon_position' => $btn['icon_position'] ?? 'after',
            'class'         => $btn['class'] ?? '',
            'download'      => $btn['download'] ?? false,
            'data'          => $btn['data'] ?? array(),
        );

        sif_btn( $link, $args );
    endforeach; ?>
</div>
