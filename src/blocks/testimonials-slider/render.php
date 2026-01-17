<?php
/**
 * Block: Testimonials Slider
 * Carrousel de témoignages avec glassmorphism, étoiles, vidéos et logos
 *
 * @var array    $attributes Block attributes
 * @var string   $content    InnerBlocks content
 * @var WP_Block $block      Block instance
 */

$sectionTitle = attr('sectionTitle', '');
$sectionSubtitle = attr('sectionSubtitle', '');
$testimonials = attr('testimonials', []);
$autoplay = attr('autoplay', false);
$autoplaySpeed = attr('autoplaySpeed', 5);
$showNavigation = attr('showNavigation', true);
$showPagination = attr('showPagination', true);

// Styles de bloc
$isGlass = has_block_style('default') || !has_block_style('cards') && !has_block_style('minimal');
$isCards = has_block_style('cards');
$isMinimal = has_block_style('minimal');

// Configuration Splide en data attribute
$splideConfig = [
    'type' => 'loop',
    'perPage' => 3,
    'gap' => '2rem',
    'autoplay' => $autoplay,
    'interval' => $autoplaySpeed * 1000,
    'pauseOnHover' => true,
    'arrows' => $showNavigation,
    'pagination' => $showPagination,
    'breakpoints' => [
        1024 => ['perPage' => 2, 'gap' => '1.5rem'],
        640 => ['perPage' => 1, 'gap' => '1rem'],
    ],
];

// Classes du wrapper
$wrapperClasses = classes(
    'testimonials-slider relative py-20 lg:py-32 overflow-hidden',
    ['bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900' => $isGlass],
    ['bg-neutral-50' => $isCards],
    ['bg-white' => $isMinimal]
);

// Classes des cartes
$cardClasses = classes(
    'testimonial-card relative h-full flex flex-col p-8 transition-all duration-500',
    // Glassmorphism style
    ['bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] shadow-2xl shadow-purple-500/10' => $isGlass],
    // Cards style
    ['bg-white rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 border border-neutral-100' => $isCards],
    // Minimal style
    ['bg-transparent border-l-4 border-primary pl-8 hover:border-primary-600' => $isMinimal]
);

// ID unique pour ce bloc
$blockId = 'testimonials-' . uniqid();

/**
 * Render star rating
 */
if (!function_exists("render_stars")) {
    function render_stars($rating, $isGlass = false) {
        $output = '<div class="flex items-center gap-1">';
        $starClass = $isGlass ? 'text-amber-400' : 'text-amber-500';
        $emptyClass = $isGlass ? 'text-white/20' : 'text-neutral-200';
    
        for ($i = 1; $i <= 5; $i++) {
            if ($i <= $rating) {
                $output .= '<svg class="w-5 h-5 ' . $starClass . ' fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
            } else {
                $output .= '<svg class="w-5 h-5 ' . $emptyClass . ' fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
            }
        }
        $output .= '</div>';
        return $output;
    }
}

/**
 * Extract video ID from URL
 */
if (!function_exists("get_video_embed_url")) {
    function get_video_embed_url($url) {
        if (empty($url)) return null;
    
        // YouTube
        if (preg_match('/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/', $url, $matches)) {
            return 'https://www.youtube.com/embed/' . $matches[1] . '?autoplay=1';
        }
    
        // Vimeo
        if (preg_match('/vimeo\.com\/(\d+)/', $url, $matches)) {
            return 'https://player.vimeo.com/video/' . $matches[1] . '?autoplay=1';
        }
    
        return null;
    }
}

// Si pas de témoignages, afficher un placeholder
if (empty($testimonials)) {
    ?>
    <section <?php echo block_wrapper(['class' => 'testimonials-slider py-16 bg-neutral-50']); ?>>
        <div class="container mx-auto px-4">
            <div class="text-center py-12 border-2 border-dashed border-neutral-300 rounded-2xl">
                <svg class="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>
                </svg>
                <p class="text-neutral-500 text-lg font-medium">Témoignages Slider</p>
                <p class="text-neutral-400 text-sm mt-1">Ajoutez des témoignages dans la barre latérale</p>
            </div>
        </div>
    </section>
    <?php
    return;
}
?>

<section <?php echo block_wrapper(['class' => $wrapperClasses]); ?> id="<?php echo esc_attr($blockId); ?>">

    <?php if ($isGlass): ?>
    <!-- Decorative elements for glass style -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"></div>
        <div class="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-purple-500/10 via-transparent to-blue-500/10 rounded-full blur-2xl opacity-50"></div>
    </div>
    <?php endif; ?>

    <div class="container mx-auto px-4 relative z-10">

        <!-- Section Header -->
        <?php if ($sectionTitle || $sectionSubtitle): ?>
        <div class="text-center mb-16 max-w-3xl mx-auto">
            <?php if ($sectionTitle): ?>
                <h2 class="text-h2 mb-4 <?php echo $isGlass ? 'text-white' : 'text-neutral-900'; ?>">
                    <?php echo text($sectionTitle); ?>
                </h2>
            <?php endif; ?>

            <?php if ($sectionSubtitle): ?>
                <p class="text-lg <?php echo $isGlass ? 'text-white/60' : 'text-neutral-600'; ?>">
                    <?php echo text($sectionSubtitle); ?>
                </p>
            <?php endif; ?>
        </div>
        <?php endif; ?>

        <!-- Splide Slider -->
        <div class="splide testimonials-splide" data-splide='<?php echo esc_attr(json_encode($splideConfig)); ?>'>
            <div class="splide__track">
                <ul class="splide__list">
                    <?php foreach ($testimonials as $index => $testimonial):
                        $quote = $testimonial['quote'] ?? '';
                        $rating = intval($testimonial['rating'] ?? 5);
                        $authorPhoto = $testimonial['authorPhoto'] ?? '';
                        $authorName = $testimonial['authorName'] ?? '';
                        $authorRole = $testimonial['authorRole'] ?? '';
                        $companyLogo = $testimonial['companyLogo'] ?? '';
                        $companyName = $testimonial['companyName'] ?? '';
                        $videoUrl = $testimonial['videoUrl'] ?? '';
                        $embedUrl = get_video_embed_url($videoUrl);
                    ?>
                    <li class="splide__slide">
                        <article class="<?php echo $cardClasses; ?>">

                            <!-- Quote Icon -->
                            <div class="mb-6">
                                <svg class="w-12 h-12 <?php echo $isGlass ? 'text-purple-400/50' : ($isMinimal ? 'text-primary/30' : 'text-primary-200'); ?>" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                                </svg>
                            </div>

                            <!-- Rating Stars -->
                            <?php if ($rating): ?>
                            <div class="mb-4">
                                <?php echo render_stars($rating, $isGlass); ?>
                            </div>
                            <?php endif; ?>

                            <!-- Quote Text -->
                            <?php if ($quote): ?>
                            <blockquote class="flex-grow mb-8">
                                <p class="text-lg leading-relaxed <?php echo $isGlass ? 'text-white/90' : 'text-neutral-700'; ?>">
                                    "<?php echo text($quote); ?>"
                                </p>
                            </blockquote>
                            <?php endif; ?>

                            <!-- Author Info -->
                            <div class="mt-auto">
                                <div class="flex items-center gap-4">
                                    <!-- Avatar -->
                                    <?php if (image_url($authorPhoto)): ?>
                                    <div class="relative flex-shrink-0">
                                        <div class="w-14 h-14 rounded-full overflow-hidden <?php echo $isGlass ? 'ring-2 ring-white/20' : 'ring-2 ring-primary-100'; ?>">
                                            <?php echo image($authorPhoto, 'thumbnail', [
                                                'class' => 'w-full h-full object-cover',
                                                'alt' => $authorName,
                                            ]); ?>
                                        </div>
                                        <?php if ($embedUrl): ?>
                                        <!-- Video play indicator -->
                                        <button
                                            class="video-trigger absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                                            data-video-url="<?php echo esc_attr($embedUrl); ?>"
                                            aria-label="Voir le témoignage vidéo"
                                        >
                                            <svg class="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z"/>
                                            </svg>
                                        </button>
                                        <?php endif; ?>
                                    </div>
                                    <?php endif; ?>

                                    <!-- Name & Role -->
                                    <div class="flex-grow min-w-0">
                                        <?php if ($authorName): ?>
                                        <p class="font-semibold truncate <?php echo $isGlass ? 'text-white' : 'text-neutral-900'; ?>">
                                            <?php echo text($authorName); ?>
                                        </p>
                                        <?php endif; ?>

                                        <?php if ($authorRole): ?>
                                        <p class="text-sm truncate <?php echo $isGlass ? 'text-white/60' : 'text-neutral-500'; ?>">
                                            <?php echo text($authorRole); ?>
                                        </p>
                                        <?php endif; ?>
                                    </div>

                                    <!-- Company Logo -->
                                    <?php if (image_url($companyLogo)): ?>
                                    <div class="flex-shrink-0 ml-auto">
                                        <div class="h-8 w-auto <?php echo $isGlass ? 'opacity-60 grayscale brightness-200' : 'opacity-50 grayscale'; ?> hover:opacity-100 hover:grayscale-0 transition-all">
                                            <?php echo image($companyLogo, 'thumbnail', [
                                                'class' => 'h-full w-auto object-contain',
                                                'alt' => $companyName ?: 'Logo entreprise',
                                            ]); ?>
                                        </div>
                                    </div>
                                    <?php endif; ?>
                                </div>
                            </div>

                        </article>
                    </li>
                    <?php endforeach; ?>
                </ul>
            </div>

            <?php if ($showNavigation): ?>
            <!-- Custom Navigation Arrows -->
            <div class="splide__arrows hidden lg:flex justify-center gap-4 mt-12">
                <button class="splide__arrow splide__arrow--prev group w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 <?php echo $isGlass ? 'bg-white/10 hover:bg-white/20 border border-white/20' : 'bg-neutral-100 hover:bg-primary hover:text-white'; ?>">
                    <svg class="w-6 h-6 <?php echo $isGlass ? 'text-white' : 'text-neutral-600 group-hover:text-white'; ?> transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                </button>
                <button class="splide__arrow splide__arrow--next group w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 <?php echo $isGlass ? 'bg-white/10 hover:bg-white/20 border border-white/20' : 'bg-neutral-100 hover:bg-primary hover:text-white'; ?>">
                    <svg class="w-6 h-6 <?php echo $isGlass ? 'text-white' : 'text-neutral-600 group-hover:text-white'; ?> transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                </button>
            </div>
            <?php endif; ?>
        </div>

    </div>

    <!-- Video Modal -->
    <div id="<?php echo esc_attr($blockId); ?>-modal" class="video-modal fixed inset-0 z-50 hidden items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
        <div class="relative w-full max-w-4xl aspect-video">
            <button class="video-modal-close absolute -top-12 right-0 text-white/60 hover:text-white transition-colors">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
            <iframe class="video-iframe w-full h-full rounded-lg" src="" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
    </div>

</section>

<style>
/* Custom Splide pagination for this block */
#<?php echo esc_attr($blockId); ?> .splide__pagination {
    position: relative;
    bottom: auto;
    margin-top: 2rem;
    gap: 0.5rem;
}

#<?php echo esc_attr($blockId); ?> .splide__pagination__page {
    width: 0.75rem;
    height: 0.75rem;
    <?php if ($isGlass): ?>
    background: rgba(255, 255, 255, 0.2);
    <?php else: ?>
    background: rgb(229, 231, 235);
    <?php endif; ?>
    border-radius: 9999px;
    transition: all 0.3s ease;
}

#<?php echo esc_attr($blockId); ?> .splide__pagination__page.is-active {
    <?php if ($isGlass): ?>
    background: rgba(255, 255, 255, 0.8);
    <?php else: ?>
    background: var(--color-primary, #6366f1);
    <?php endif; ?>
    transform: scale(1.25);
}

/* Video modal animation */
.video-modal.active {
    display: flex;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
</style>
