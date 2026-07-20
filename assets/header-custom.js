/**
 * Header Custom - JavaScript functionality
 * Handles mobile menu, sticky header, and submenu toggles
 */

(function () {
    'use strict';

    // Mobile menu toggle
    let _drawerLastFocus = null;

    function _drawerFocusables(drawer) {
        return Array.from(
            drawer.querySelectorAll('a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])')
        ).filter((el) => el.offsetParent !== null);
    }

    function _drawerKeydown(e) {
        const drawer = document.querySelector('.mobile-menu-drawer.open');
        if (!drawer) return;
        if (e.key === 'Escape') {
            window.toggleMobileMenu();
            return;
        }
        if (e.key === 'Tab') {
            // Trap focus within the open drawer
            const items = _drawerFocusables(drawer);
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    window.toggleMobileMenu = function () {
        const drawer = document.querySelector('.mobile-menu-drawer');
        const overlay = document.querySelector('.mobile-menu-overlay');
        drawer.classList.toggle('open');
        overlay.classList.toggle('open');

        // Prevent body scroll when menu is open
        if (drawer.classList.contains('open')) {
            document.body.style.overflow = 'hidden';
            _drawerLastFocus = document.activeElement;
            document.addEventListener('keydown', _drawerKeydown);
            const first = _drawerFocusables(drawer)[0];
            if (first) setTimeout(() => first.focus(), 50);

            // Initialize Swiper for collections carousel if it exists
            setTimeout(() => {
                const swiperElement = document.querySelector('.mobile-collections-swiper');
                if (swiperElement && !swiperElement.swiper) {
                    new Swiper('.mobile-collections-swiper', {
                        slidesPerView: 'auto',
                        spaceBetween: 0,
                        freeMode: true,
                        grabCursor: true,
                        resistance: true,
                        resistanceRatio: 0.5,
                    });
                }
            }, 100);
        } else {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', _drawerKeydown);
            if (_drawerLastFocus && _drawerLastFocus.focus) _drawerLastFocus.focus();
        }
    };  // Mobile submenu toggle
    window.toggleMobileSubmenu = function (button) {
        const submenu = button.nextElementSibling;

        // Close all other submenus
        document.querySelectorAll('.mobile-menu-toggle.open').forEach((toggle) => {
            if (toggle !== button) {
                toggle.classList.remove('open');
                toggle.nextElementSibling.classList.remove('open');
                // Reset any expanded view more states
                const viewMoreBtn = toggle.nextElementSibling.querySelector('.view-more-btn');
                if (viewMoreBtn && viewMoreBtn.classList.contains('expanded')) {
                    toggleViewMore(viewMoreBtn);
                }
            }
        });

        // Toggle current submenu
        button.classList.toggle('open');
        submenu.classList.toggle('open');
    };

    // View More toggle for submenu items
    window.toggleViewMore = function (button) {
        const submenu = button.closest('.mobile-submenu');
        const viewMoreText = button.querySelector('.view-more-text');
        const viewLessText = button.querySelector('.view-less-text');

        button.classList.toggle('expanded');
        submenu.classList.toggle('expanded');

        if (button.classList.contains('expanded')) {
            viewMoreText.style.display = 'none';
            viewLessText.style.display = 'inline';
        } else {
            viewMoreText.style.display = 'inline';
            viewLessText.style.display = 'none';
        }
    };    // Initialize sticky header behavior
    function initStickyHeader(sectionId) {
        const section = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (!section) return;

        const sectionWrapper = section.closest('.section-header-custom');
        if (!sectionWrapper) return;

        // Sticky header on scroll up variables
        let currentScrollTop = 0;
        let headerHeight = sectionWrapper.offsetHeight;
        let isHidden = false;

        // Store header height for CSS calculations
        document.documentElement.style.setProperty('--header-custom-height', `${headerHeight}px`);

        function handleScroll() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // Add shadow when scrolled
            if (scrollTop > 10) {
                sectionWrapper.classList.add('scrolled');
            } else {
                sectionWrapper.classList.remove('scrolled');
            }

            // Sticky header show/hide logic
            if (scrollTop > headerHeight) {
                if (scrollTop > currentScrollTop) {
                    // Scrolling DOWN - hide the header
                    if (!isHidden) {
                        sectionWrapper.classList.add('header-hidden');
                        sectionWrapper.classList.remove('header-visible');
                        isHidden = true;
                    }
                } else {
                    // Scrolling UP - show the header
                    if (isHidden) {
                        sectionWrapper.classList.remove('header-hidden');
                        sectionWrapper.classList.add('header-visible');
                        isHidden = false;
                    }
                }
            } else {
                // At the top - reset to normal state
                sectionWrapper.classList.remove('header-hidden', 'header-visible');
                isHidden = false;
            }

            currentScrollTop = scrollTop;
        }

        window.addEventListener('scroll', handleScroll, { passive: true });

        // Update header height on resize
        window.addEventListener(
            'resize',
            () => {
                headerHeight = sectionWrapper.offsetHeight;
                document.documentElement.style.setProperty('--header-custom-height', `${headerHeight}px`);
            },
            { passive: true }
        );
    }

    // Export initialization function
    window.initHeaderCustom = initStickyHeader;
})();
