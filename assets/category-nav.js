'use strict';

(function () {
    const STORAGE_KEY = 'nowi-homepage-category';
    let cachedCategories = null;

    function getValidCategories(nav) {
        // Return cached if available
        if (cachedCategories && cachedCategories.length > 0) {
            return cachedCategories;
        }

        // Try to get from nav element
        if (!nav) {
            nav = document.querySelector('[data-category-nav]');
        }

        if (nav) {
            const triggers = nav.querySelectorAll('[data-category-trigger]');
            const categories = Array.from(triggers).map(t => t.dataset.categoryTrigger).filter(Boolean);
            if (categories.length > 0) {
                cachedCategories = categories;
                return categories;
            }
        }

        // Fallback to default categories if DOM not ready
        return ['men', 'women'];
    }

    function isValid(category, nav) {
        if (!category) return false;
        const validCategories = getValidCategories(nav);
        return validCategories.includes(category);
    }

    function getInitialCategory(defaultCategory, nav) {
        const hashValue = (window.location.hash || '').replace('#', '').toLowerCase();
        if (isValid(hashValue, nav)) {
            return hashValue;
        }

        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (isValid(stored, nav)) {
                return stored;
            }
        } catch (error) {
            console.warn('Category nav storage error', error);
        }

        return defaultCategory;
    }

    function saveCategory(category) {
        try {
            window.localStorage.setItem(STORAGE_KEY, category);
        } catch (error) {
            console.warn('Category nav storage error', error);
        }
    }

    function applyCategory(category) {
        const sections = document.querySelectorAll('[data-category-scope]');

        sections.forEach((node) => {
            const scope = node.dataset.categoryScope || 'all';
            const shouldShow = scope === 'all' || scope === category;

            if (shouldShow) {
                node.classList.remove('category-hidden');
                node.style.display = '';
            } else {
                node.classList.add('category-hidden');
                node.style.display = 'none';
            }
        });

        document.documentElement.classList.add('category-nav-initialized');
        document.documentElement.setAttribute('data-active-category', category);
    }

    function updateTriggers(nav, category) {
        const triggers = nav.querySelectorAll('[data-category-trigger]');
        triggers.forEach((trigger) => {
            const isActive = trigger.dataset.categoryTrigger === category;
            trigger.classList.toggle('category-nav__trigger--active', isActive);
            trigger.classList.toggle('category-nav__link--active', isActive);

            if (trigger.getAttribute('role') === 'tab') {
                trigger.setAttribute('aria-selected', isActive ? 'true' : 'false');
                trigger.setAttribute('tabindex', isActive ? '0' : '-1');
            }
        });
    }

    function updatePanels(nav, category) {
        const panels = nav.querySelectorAll('[data-category-panel]');
        if (!panels.length) {
            return;
        }

        panels.forEach((panel) => {
            const isActive = panel.dataset.categoryPanel === category;
            panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
            panel.setAttribute('tabindex', isActive ? '0' : '-1');
            panel.textContent = isActive ? panel.dataset.panelMessage || '' : '';
        });
    }

    function setHash(category) {
        if (window.location.hash.replace('#', '') === category) {
            return;
        }

        if (history.replaceState) {
            history.replaceState(null, '', `#${category}`);
        } else {
            window.location.hash = `#${category}`;
        }
    }

    function handleTriggerClick(event) {
        event.preventDefault();
        const trigger = event.currentTarget;
        const category = trigger.dataset.categoryTrigger;
        const nav = trigger.closest('[data-category-nav]');

        if (!isValid(category, nav)) {
            return;
        }

        activateCategory(nav, category, true);
    }

    function activateCategory(nav, category, persist) {
        if (!isValid(category, nav)) {
            return;
        }

        updateTriggers(nav, category);
        applyCategory(category);
        updatePanels(nav, category);
        setHash(category);
        if (persist) {
            saveCategory(category);
        }
    }

    function setupNav(nav) {
        // Cache categories from this nav instance
        getValidCategories(nav);

        const defaultCategory = nav.dataset.defaultCategory || 'women';
        const initialCategory = getInitialCategory(defaultCategory, nav);

        updateTriggers(nav, initialCategory);
        applyCategory(initialCategory);
        updatePanels(nav, initialCategory);
        setHash(initialCategory);

        const triggers = nav.querySelectorAll('[data-category-trigger]');
        triggers.forEach((trigger) => {
            trigger.addEventListener('click', handleTriggerClick);
        });
    }

    function initNav() {
        const navs = document.querySelectorAll('[data-category-nav]');
        if (!navs.length) {
            return;
        }

        navs.forEach(setupNav);
    }

    function handleHashChange() {
        const nav = document.querySelector('[data-category-nav]');
        if (!nav) {
            return;
        }

        const hashValue = (window.location.hash || '').replace('#', '').toLowerCase();
        if (isValid(hashValue, nav)) {
            activateCategory(nav, hashValue, true);
        }
    }

    document.addEventListener('DOMContentLoaded', initNav);
    document.addEventListener('shopify:section:load', initNav);
    window.addEventListener('hashchange', handleHashChange);
})();
