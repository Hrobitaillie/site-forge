/**
 * Testimonials Slider - Frontend Script
 * Initialise SplideJS et gère la modal vidéo
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all testimonials sliders
    initTestimonialsSliders();

    // Initialize video modals
    initVideoModals();
});

/**
 * Initialize Splide sliders
 */
function initTestimonialsSliders() {
    const sliders = document.querySelectorAll('.testimonials-splide');

    sliders.forEach(slider => {
        // Get config from data attribute
        let config = {
            type: 'loop',
            perPage: 3,
            gap: '2rem',
            autoplay: false,
            pauseOnHover: true,
            arrows: true,
            pagination: true,
            breakpoints: {
                1024: { perPage: 2, gap: '1.5rem' },
                640: { perPage: 1, gap: '1rem' },
            },
        };

        // Merge with data-splide config if present
        const dataConfig = slider.dataset.splide;
        if (dataConfig) {
            try {
                const parsedConfig = JSON.parse(dataConfig);
                config = { ...config, ...parsedConfig };
            } catch (e) {
                console.warn('Invalid Splide config:', e);
            }
        }

        // Initialize Splide
        const splide = new Splide(slider, config);

        // Custom arrow positioning (move arrows to custom container if exists)
        splide.on('mounted', function() {
            // Add entrance animation to slides
            const slides = slider.querySelectorAll('.splide__slide');
            slides.forEach((slide, index) => {
                slide.style.opacity = '0';
                slide.style.transform = 'translateY(20px)';

                setTimeout(() => {
                    slide.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    slide.style.opacity = '1';
                    slide.style.transform = 'translateY(0)';
                }, 100 + (index * 100));
            });
        });

        splide.mount();
    });
}

/**
 * Initialize video modal functionality
 */
function initVideoModals() {
    // Get all video triggers
    const triggers = document.querySelectorAll('.video-trigger');

    triggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const videoUrl = this.dataset.videoUrl;
            if (!videoUrl) return;

            // Find the parent section to get the modal
            const section = this.closest('section[id^="testimonials-"]');
            if (!section) return;

            const modal = document.getElementById(section.id + '-modal');
            if (!modal) return;

            const iframe = modal.querySelector('.video-iframe');
            if (iframe) {
                iframe.src = videoUrl;
            }

            // Show modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Focus trap
            modal.focus();
        });
    });

    // Close modal handlers
    const modals = document.querySelectorAll('.video-modal');

    modals.forEach(modal => {
        // Close button
        const closeBtn = modal.querySelector('.video-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeVideoModal(modal));
        }

        // Click outside to close
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeVideoModal(modal);
            }
        });

        // Escape key to close
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeVideoModal(modal);
            }
        });
    });
}

/**
 * Close video modal
 */
function closeVideoModal(modal) {
    const iframe = modal.querySelector('.video-iframe');
    if (iframe) {
        iframe.src = ''; // Stop video
    }

    modal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Reinitialize sliders (useful for dynamic content)
 */
window.reinitTestimonialsSliders = function() {
    // Destroy existing instances
    document.querySelectorAll('.testimonials-splide.is-initialized').forEach(slider => {
        if (slider.splide) {
            slider.splide.destroy();
        }
    });

    // Reinitialize
    initTestimonialsSliders();
};
