<?php
/**
 * Configuration: Testimonials Slider Block
 * Enqueue SplideJS et les scripts du bloc
 */

// Enqueue SplideJS sur le frontend quand le bloc est présent
add_action('wp_enqueue_scripts', function() {
    if (has_block('sif/testimonials-slider')) {
        // Splide CSS
        wp_enqueue_style(
            'splide',
            'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css',
            [],
            '4.1.4'
        );

        // Splide JS
        wp_enqueue_script(
            'splide',
            'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js',
            [],
            '4.1.4',
            true
        );

        // Block script (après Splide)
        wp_enqueue_script(
            'sif-testimonials-slider',
            SIF_URL . 'src/blocks/testimonials-slider/script.js',
            ['splide'],
            SIF_VERSION,
            true
        );
    }
});

// Enqueue dans l'éditeur aussi pour la preview
add_action('enqueue_block_editor_assets', function() {
    wp_enqueue_style(
        'splide-editor',
        'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css',
        [],
        '4.1.4'
    );
});
