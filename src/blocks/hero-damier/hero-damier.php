<?php

/**
 * Hero Damier Block - Render Template
 *
 * @var array    $attributes Block attributes
 * @var string   $content    InnerBlocks content
 * @var WP_Block $block      Block instance
 *
 * @package SiteForge
 */

// Récupérer les attributs (fonctions globales, pas de use nécessaire!)
$image = attr("image", '');
$imageAlt = attr("imageAlt", "");
$reversed = attr("reversed", false);

// Détecter le style de bloc via helper
$isRounded = has_block_style('rounded');

// Classes de l'image
$image_classes = classes(
    'w-full h-full object-cover',
    ['rounded-default' => $isRounded]
);

// Classes du conteneur image
$container_classes = classes(
    'aspect-4/3 lg:aspect-square overflow-hidden',
    ['rounded-base' => $isRounded]
);
?>

<section <?php echo block_wrapper(['class' => 'hero-damier py-16 lg:py-24']); ?>>
    <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

            <!-- Content Column -->
            <div class="flex flex-col justify-center space-y-6 <?php echo $reversed ? 'lg:order-2' : 'lg:order-1'; ?>">
                <InnerBlocks allowedBlocks='["core/heading", "core/paragraph", "core/list", "core/buttons", "core/button"]' template='[["core/heading", {"level": 2, "placeholder": "Titre..."}], ["core/paragraph", {"placeholder": "Contenu..."}]]' />

                <?php // Afficher les textes du repeater
                if (!empty($textes) && is_array($textes)) : ?>
                    <div class="additional-texts space-y-4">
                        <?php foreach ($textes as $item) : ?>
                            <div class="text-item">
                                <?php if (!empty($item['texte'])) : ?>
                                    <p class="text-gray-600"><?php echo html($item['texte']); ?></p>
                                <?php endif; ?>

                                <?php if (!empty($item['buttonUrl']) && $item['buttonUrl'] !== '#') : ?>
                                    <?php echo button('En savoir plus', $item['buttonUrl'], [
                                        'style' => 'outline',
                                        'size' => 'small',
                                    ]); ?>
                                <?php endif; ?>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>

            <!-- Image Column -->
            <div class="<?php echo $reversed ? 'lg:order-1' : 'lg:order-2'; ?>">
                <?php if (image_url($image)) : ?>
                    <div class="<?php echo esc_attr($container_classes); ?>">
                        <?php echo image($image, 'large', [
                            'class' => $image_classes,
                            'alt'   => $imageAlt,
                        ]); ?>
                    </div>
                <?php else : ?>
                    <div class="<?php echo esc_attr($container_classes); ?> bg-gray-200 flex items-center justify-center">
                        <span class="text-gray-400">Aucune image</span>
                    </div>
                <?php endif; ?>
            </div>

        </div>
    </div>
</section>