/**
 * Collection Filter AJAX Engine
 *
 * Centralized AJAX filtering system for collection pages.
 * Replaces facets.js with custom implementation.
 *
 * @class CollectionFilterAjax
 */
class CollectionFilterAjax {
  constructor() {
    this.state = {
      filters: new Map(),          // All active filters
      priceRange: { min: null, max: null },
      sort: null,
      isLoading: false
    }
    this.cache = new Map()         // Response caching
    this.abortController = null    // Cancel previous requests

    // Initialize from URL on page load
    this.initializeFromURL()
  }

  /**
   * Main AJAX method to apply filters
   * Handles request cancellation, caching, error handling, and loading states
   *
   * @async
   * @param {Object} options - Options for applying filters
   * @param {boolean} options.replaceHistory - Use replaceState instead of pushState (default: false)
   * @returns {Promise<void>}
   */
  async applyFilters(options = {}) {
    const { replaceHistory = false } = options
    // Cancel any pending request to avoid race conditions
    if (this.abortController) {
      this.abortController.abort()
    }
    this.abortController = new AbortController()

    // Build URL with all filters
    const url = this.buildFilterURL()

    // Check cache first for performance
    if (this.cache.has(url)) {
      this.renderResults(this.cache.get(url))
      return
    }

    this.showLoadingState()

    try {
      const response = await fetch(url, {
        signal: this.abortController.signal,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()

      // Cache response
      this.cache.set(url, html)

      // Render results
      this.renderResults(html)

      // Update URL without reload
      // Use replaceState when called from drawer to avoid history pollution
      const historyData = { filters: Array.from(this.state.filters) }
      if (replaceHistory) {
        window.history.replaceState(historyData, '', url)
      } else {
        window.history.pushState(historyData, '', url)
      }

      // Emit event for other components to listen
      document.dispatchEvent(new CustomEvent('collection:filtered', {
        detail: { url, state: this.getState() }
      }))

    } catch (error) {
      // Ignore aborted requests (user clicked another filter quickly)
      if (error.name === 'AbortError') return

      console.error('[CollectionFilterAjax] Filter request failed:', error)
      this.showErrorState(error.message)
    } finally {
      this.hideLoadingState()
    }
  }

  /**
   * Build filter URL with all active filters, price range, and sort
   * Uses Shopify's standard URL parameter format
   * Preserves search query and options for search pages
   *
   * @returns {string} - Complete URL with filter parameters
   */
  buildFilterURL() {
    const url = new URL(window.location.href)

    // Preserve search-related params before clearing
    const searchQuery = url.searchParams.get('q')
    const searchOptions = url.searchParams.get('options[prefix]')

    url.search = '' // Clear existing params

    // Restore search params if on search page
    if (searchQuery) {
      url.searchParams.set('q', searchQuery)
    }
    if (searchOptions) {
      url.searchParams.set('options[prefix]', searchOptions)
    }

    // Add filter params (Shopify format: ?param=val&param=val)
    this.state.filters.forEach((filter) => {
      url.searchParams.append(filter.param, filter.value)
    })

    // Add price range filters
    if (this.state.priceRange.min !== null) {
      url.searchParams.set('filter.v.price.gte', this.state.priceRange.min)
    }
    if (this.state.priceRange.max !== null) {
      url.searchParams.set('filter.v.price.lte', this.state.priceRange.max)
    }

    // Add sort parameter
    if (this.state.sort) {
      url.searchParams.set('sort_by', this.state.sort)
    }

    return url.toString()
  }

  /**
   * Render filtered results by replacing product grid HTML
   *
   * @param {string} html - HTML response from server
   */
  renderResults(html) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Update product grid container
    const newGrid = doc.getElementById('ProductGridContainer')
    const currentGrid = document.getElementById('ProductGridContainer')
    if (newGrid && currentGrid) {
      currentGrid.innerHTML = newGrid.innerHTML
    } else {
      console.warn('[CollectionFilterAjax] ProductGridContainer not found in response or DOM')
    }

    // Update product count display
    const newCount = doc.querySelector('[data-product-count]')
    const currentCount = document.querySelector('[data-product-count]')
    if (newCount && currentCount) {
      currentCount.textContent = newCount.textContent
    }

    // Update filter drawer with new filter options (in case they changed)
    const newFilters = doc.querySelector('[data-filter-drawer-content]')
    const currentFilters = document.querySelector('[data-filter-drawer-content]')
    if (newFilters && currentFilters) {
      currentFilters.innerHTML = newFilters.innerHTML
    }

    // Don't scroll - let user stay at current position
    // currentGrid?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /**
   * Show loading overlay while filtering
   */
  showLoadingState() {
    this.state.isLoading = true
    document.body.classList.add('filtering-in-progress')

    // Don't add multiple overlays
    if (document.getElementById('filter-loading-overlay')) return

    // Show loading overlay
    const overlay = document.createElement('div')
    overlay.id = 'filter-loading-overlay'
    overlay.className = 'fixed inset-0 bg-white/60 z-40 flex items-center justify-center'
    overlay.innerHTML = `
      <div class="w-12 h-12 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
    `
    document.body.appendChild(overlay)
  }

  /**
   * Hide loading overlay
   */
  hideLoadingState() {
    this.state.isLoading = false
    document.body.classList.remove('filtering-in-progress')
    document.getElementById('filter-loading-overlay')?.remove()
  }

  /**
   * Show user-friendly error message
   *
   * @param {string} errorMessage - Optional error message to display
   */
  showErrorState(errorMessage = '') {
    // Show user-friendly error message
    const errorMsg = document.createElement('div')
    errorMsg.className = 'fixed bottom-24 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 z-50 shadow-lg'
    errorMsg.setAttribute('role', 'alert')
    errorMsg.setAttribute('aria-live', 'assertive')
    errorMsg.innerHTML = `
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <div class="flex-1">
          <p class="text-red-800 text-sm font-medium">Unable to apply filters</p>
          <p class="text-red-600 text-xs mt-1">Please try again or refresh the page</p>
          ${errorMessage ? `<p class="text-red-500 text-xs mt-1 font-mono">${errorMessage}</p>` : ''}
        </div>
        <button type="button" class="text-red-400 hover:text-red-600" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    `
    document.body.appendChild(errorMsg)

    // Auto-dismiss after 5 seconds
    setTimeout(() => errorMsg.remove(), 5000)
  }

  // ===== State Management Methods =====

  /**
   * Add a filter to the state
   *
   * @param {string} param - Filter parameter (e.g., 'filter.p.tag')
   * @param {string} value - Filter value (e.g., 'men')
   * @param {string} label - Human-readable label for UI display
   */
  addFilter(param, value, label) {
    const key = `${param}=${value}`
    this.state.filters.set(key, { param, value, label })
  }

  /**
   * Remove a filter from the state
   *
   * @param {string} key - Filter key in format 'param=value'
   */
  removeFilter(key) {
    this.state.filters.delete(key)
  }

  /**
   * Clear all filters, price range, and sort
   */
  clearAllFilters() {
    this.state.filters.clear()
    this.state.priceRange = { min: null, max: null }
    this.state.sort = null // Also clear sort when clearing all filters
  }

  /**
   * Set price range filter
   *
   * @param {number|null} min - Minimum price
   * @param {number|null} max - Maximum price
   */
  setPriceRange(min, max) {
    this.state.priceRange = {
      min: min !== null ? parseInt(min) : null,
      max: max !== null ? parseInt(max) : null
    }
  }

  /**
   * Set sort option
   *
   * @param {string|null} sortValue - Sort value (e.g., 'price-ascending')
   */
  setSort(sortValue) {
    this.state.sort = sortValue
  }

  /**
   * Get current state (for external components)
   * Returns a copy to prevent external mutation
   *
   * @returns {Object} - Current filter state
   */
  getState() {
    return {
      filters: new Map(this.state.filters),
      priceRange: { ...this.state.priceRange },
      sort: this.state.sort,
      isLoading: this.state.isLoading
    }
  }

  /**
   * Initialize filters from URL parameters on page load
   * Parses URL query string and populates state
   */
  initializeFromURL() {
    const params = new URLSearchParams(window.location.search)

    // Reset state first
    this.state.filters.clear()
    this.state.priceRange = { min: null, max: null }
    this.state.sort = null

    // Parse filter params
    for (const [key, value] of params.entries()) {
      if (key === 'filter.v.price.gte') {
        // Min price
        this.state.priceRange.min = parseInt(value)
      } else if (key === 'filter.v.price.lte') {
        // Max price
        this.state.priceRange.max = parseInt(value)
      } else if (key.startsWith('filter.')) {
        // Extract label from filter parameter
        const label = this.getLabelForFilter(key, value)
        this.state.filters.set(`${key}=${value}`, {
          param: key,
          value: value,
          label: label
        })
      } else if (key === 'sort_by') {
        this.state.sort = value
      }
    }

    // Log initialization for debugging
    console.log('[CollectionFilterAjax] Initialized from URL:', {
      filters: Array.from(this.state.filters.keys()),
      priceRange: this.state.priceRange,
      sort: this.state.sort
    })
  }

  /**
   * Extract human-readable label from filter parameter and value
   *
   * @param {string} param - Filter parameter
   * @param {string} value - Filter value
   * @returns {string} - Human-readable label
   */
  getLabelForFilter(param, value) {
    // Try to get label from DOM (if filter drawer is rendered)
    const checkbox = document.querySelector(`[data-filter-param="${param}"][data-filter-value="${value}"]`)
    if (checkbox) {
      return checkbox.dataset.filterLabel || value
    }

    // Try to get from window.collectionFilters (if available)
    if (window.collectionFilters) {
      for (const filter of window.collectionFilters) {
        const matchingValue = filter.values?.find(v => {
          const paramMatch = this.getFilterParamForType(filter.type, filter.param_name)
          return paramMatch === param && v.value === value
        })
        if (matchingValue) {
          return matchingValue.label || value
        }
      }
    }

    // Fallback: format value for display
    return this.formatFilterValue(value)
  }

  /**
   * Get Shopify filter parameter format for filter type
   *
   * @param {string} type - Filter type
   * @param {string} paramName - Parameter name
   * @returns {string} - Formatted parameter
   */
  getFilterParamForType(type, paramName) {
    if (type === 'price_range') {
      return 'filter.v.price'
    } else if (type.startsWith('filter.v.option')) {
      return `filter.v.option.${paramName}`
    } else if (type === 'filter.p.tag') {
      return 'filter.p.tag'
    } else if (type === 'filter.p.product_type') {
      return 'filter.p.product_type'
    }
    return paramName
  }

  /**
   * Format filter value for human-readable display
   *
   * @param {string} value - Raw filter value
   * @returns {string} - Formatted value
   */
  formatFilterValue(value) {
    return value
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * Clear cache (useful for testing or after major state changes)
   */
  clearCache() {
    this.cache.clear()
    console.log('[CollectionFilterAjax] Cache cleared')
  }
}

// Create global instance
window.collectionFilterAjax = new CollectionFilterAjax()

// NOTE: Popstate handling is now done by collection-sort-filter-bar.js
// That component decides whether to reload the page or close a drawer
// and will call initializeFromURL + applyFilters when needed
//
// // Handle browser back/forward buttons
// window.addEventListener('popstate', (event) => {
//   if (window.collectionFilterAjax) {
//     window.collectionFilterAjax.initializeFromURL()
//     window.collectionFilterAjax.applyFilters()
//   }
// })

console.log('[CollectionFilterAjax] Initialized successfully')
