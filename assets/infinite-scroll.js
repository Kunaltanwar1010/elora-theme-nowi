/**
 * Infinite Scroll Component
 * Automatically loads more products when user scrolls near the bottom.
 * Uses prefetching for instant loading experience.
 */

class InfiniteScroll extends HTMLElement {
  constructor() {
    super();
    this.container = this.querySelector('[data-infinite-scroll-container]');
    this.loadMoreButton = this.querySelector('[data-infinite-scroll-button]');
    this.spinner = this.querySelector('[data-infinite-scroll-spinner]');
    this.nextPageUrl = this.dataset.nextPage;
    this.collectionHandle = this.dataset.collectionHandle;
    this.isLoading = false;
    this.threshold = parseInt(this.dataset.threshold) || 1500;
    this.currentPage = 1;
    this.prefetchedData = null;
    this.debug = false; // Set to true for console logging

    this.log('Initialized', { nextPageUrl: this.nextPageUrl, collectionHandle: this.collectionHandle });

    if (this.nextPageUrl && this.container) {
      this.init();
    }
  }

  log(...args) {
    if (this.debug) console.log('[InfiniteScroll]', ...args);
  }

  init() {
    // Hide button - auto-scroll will handle loading
    if (this.loadMoreButton) {
      this.loadMoreButton.style.display = 'none';
    }

    // Start prefetching immediately
    this.prefetchNextPage();

    // Use IntersectionObserver - most reliable method
    this.setupObserver();

    // Fallback: scroll event for older browsers
    this.boundScrollHandler = this.onScroll.bind(this);
    window.addEventListener('scroll', this.boundScrollHandler, { passive: true });

    // Check immediately in case page is short
    setTimeout(() => this.checkTrigger(), 100);
    setTimeout(() => this.checkTrigger(), 500);
  }

  setupObserver() {
    // Create sentinel at end of container
    this.sentinel = document.createElement('div');
    this.sentinel.className = 'infinite-scroll-sentinel';
    this.sentinel.style.height = '1px';
    this.container.appendChild(this.sentinel);

    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        this.log('Observer triggered', { isIntersecting: entry.isIntersecting, isLoading: this.isLoading });
        if (entry.isIntersecting && !this.isLoading && this.nextPageUrl) {
          this.loadMore();
        }
      },
      {
        root: null, // viewport
        rootMargin: `0px 0px ${this.threshold}px 0px`, // trigger 1500px before reaching sentinel
        threshold: 0
      }
    );

    this.observer.observe(this.sentinel);
    this.log('Observer setup complete');
  }

  onScroll() {
    this.checkTrigger();
  }

  checkTrigger() {
    if (this.isLoading || !this.nextPageUrl) return;

    const scrollY = window.scrollY || window.pageYOffset;
    const viewportHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const distanceFromBottom = documentHeight - (scrollY + viewportHeight);

    this.log('Check trigger', { distanceFromBottom, threshold: this.threshold });

    if (distanceFromBottom <= this.threshold) {
      this.loadMore();
    }
  }

  buildFetchUrl(pageNum) {
    if (this.collectionHandle) {
      const url = new URL(`/collections/${this.collectionHandle}`, window.location.origin);
      url.searchParams.set('page', pageNum);

      // Preserve filter/sort params
      const currentParams = new URLSearchParams(window.location.search);
      for (const [key, value] of currentParams) {
        if (key !== 'page') {
          url.searchParams.set(key, value);
        }
      }
      return url.toString();
    }
    return this.nextPageUrl;
  }

  async prefetchNextPage() {
    if (!this.nextPageUrl) return;

    const url = this.buildFetchUrl(this.currentPage + 1);
    this.log('Prefetching', url);

    try {
      const response = await fetch(url);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const products = doc.querySelectorAll('[data-infinite-scroll-container] > *');
      const nextScroll = doc.querySelector('infinite-scroll');

      this.prefetchedData = {
        products: Array.from(products),
        nextPageUrl: nextScroll?.dataset.nextPage || null
      };
      this.log('Prefetch complete', { productCount: products.length, hasMore: !!this.prefetchedData.nextPageUrl });
    } catch (error) {
      this.log('Prefetch failed', error);
      this.prefetchedData = null;
    }
  }

  async loadMore() {
    if (this.isLoading || !this.nextPageUrl) return;

    this.isLoading = true;
    this.log('Loading more...');

    try {
      let products, nextPageUrl;

      // Use prefetched data if available
      if (this.prefetchedData) {
        products = this.prefetchedData.products;
        nextPageUrl = this.prefetchedData.nextPageUrl;
        this.prefetchedData = null;
        this.log('Using prefetched data');
      } else {
        // Fetch directly
        this.showSpinner();
        const url = this.buildFetchUrl(this.currentPage + 1);
        const response = await fetch(url);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        products = Array.from(doc.querySelectorAll('[data-infinite-scroll-container] > *'));
        const nextScroll = doc.querySelector('infinite-scroll');
        nextPageUrl = nextScroll?.dataset.nextPage || null;
        this.log('Fetched directly', { productCount: products.length });
      }

      // Append products
      if (products.length > 0) {
        const fragment = document.createDocumentFragment();
        products.forEach(p => fragment.appendChild(p.cloneNode(true)));

        // Insert before sentinel (which is at the end)
        if (this.sentinel) {
          this.container.insertBefore(fragment, this.sentinel);
        } else {
          this.container.appendChild(fragment);
        }
        this.log('Appended products');
      }

      this.currentPage++;
      this.nextPageUrl = nextPageUrl;
      this.dataset.nextPage = nextPageUrl || '';

      if (nextPageUrl) {
        // Prefetch next page
        this.prefetchNextPage();
      } else {
        // No more pages
        this.log('No more pages');
        if (this.sentinel) this.sentinel.remove();
        if (this.observer) this.observer.disconnect();
      }

      // Trigger any scroll animations
      if (typeof initializeScrollAnimationTrigger === 'function') {
        initializeScrollAnimationTrigger();
      }

    } catch (error) {
      console.error('[InfiniteScroll] Error:', error);
      this.showError();
    } finally {
      this.isLoading = false;
      this.hideSpinner();
    }
  }

  showSpinner() {
    if (this.spinner) this.spinner.classList.remove('hidden');
  }

  hideSpinner() {
    if (this.spinner) this.spinner.classList.add('hidden');
  }

  showError() {
    // Show button as error/retry
    if (this.loadMoreButton) {
      this.loadMoreButton.textContent = 'Error - Tap to retry';
      this.loadMoreButton.style.display = ''; // Clear inline style
      this.loadMoreButton.classList.remove('hidden');
      this.loadMoreButton.onclick = () => {
        this.loadMoreButton.style.display = 'none';
        this.loadMore();
      };
    }
  }

  disconnectedCallback() {
    if (this.boundScrollHandler) {
      window.removeEventListener('scroll', this.boundScrollHandler);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

customElements.define('infinite-scroll', InfiniteScroll);
