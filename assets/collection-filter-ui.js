/**
 * Collection Filter UI - Unified Controller
 *
 * Handles both mobile drawer and desktop sidebar filter/sort UI.
 * Works with collection-filter-ajax.js for AJAX filtering.
 */
class CollectionFilterUI {
  constructor() {
    // UI Elements
    this.desktopSidebar = document.querySelector('.desktop-filter-sidebar')
    this.mobileDrawer = document.querySelector('.filter-drawer')
    this.activeFiltersBar = document.querySelector('[data-active-filters]')
    this.filtersList = document.querySelector('[data-filters-list]')

    // Debounce timer for price changes
    this.priceDebounceTimer = null

    // Track if we've created a filter history entry
    // First filter change creates entry, subsequent changes replace it
    // Browser back will go to unfiltered state
    this.hasFilterHistoryEntry = this.hasActiveFilters()

    // Initialize
    this.attachListeners()
    this.initializeFromURL()
    this.listenToAjaxEvents()

    // Listen for popstate to reset history tracking
    window.addEventListener('popstate', () => {
      // After browser back, check if we still have filters
      this.hasFilterHistoryEntry = this.hasActiveFilters()
    })
  }

  /**
   * Check if there are any active filters in the URL
   */
  hasActiveFilters() {
    const url = new URL(window.location)
    return Array.from(url.searchParams.keys()).some(key => key.startsWith('filter.'))
  }

  /**
   * Attach event listeners to all filter UI elements
   */
  attachListeners() {
    // Desktop sidebar listeners
    if (this.desktopSidebar) {
      this.attachDesktopListeners()
    }

    // Active filters bar (chip removal)
    if (this.filtersList) {
      this.filtersList.addEventListener('click', (e) => this.handleChipRemove(e))
    }
  }

  /**
   * Desktop sidebar event listeners
   */
  attachDesktopListeners() {
    // Filter checkbox changes (auto-apply)
    this.desktopSidebar.addEventListener('change', (e) => {
      if (e.target.classList.contains('filter-checkbox')) {
        this.applyFilters()
      }
    })

    // Sort dropdown change
    const sortSelect = this.desktopSidebar.querySelector('[data-sort-select]')
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.applySort(e.target.value)
      })
    }

    // Price input fields
    const priceMinInput = this.desktopSidebar.querySelector('.price-min')
    const priceMaxInput = this.desktopSidebar.querySelector('.price-max')
    if (priceMinInput) {
      priceMinInput.addEventListener('change', () => this.applyFilters())
    }
    if (priceMaxInput) {
      priceMaxInput.addEventListener('change', () => this.applyFilters())
    }

    // Clear All button
    const clearAllBtn = this.desktopSidebar.querySelector('[data-clear-all-desktop]')
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => this.clearAllFilters())
    }
  }

  /**
   * Clear all filters and reset UI
   */
  clearAllFilters() {
    const ajax = window.collectionFilterAjax
    if (!ajax) {
      // Fallback to URL redirect
      const url = new URL(window.location)
      Array.from(url.searchParams.keys())
        .filter(key => key.startsWith('filter.'))
        .forEach(key => url.searchParams.delete(key))
      window.location.href = url.toString()
      return
    }

    // Uncheck all checkboxes in desktop sidebar
    this.desktopSidebar?.querySelectorAll('.filter-checkbox:checked').forEach(checkbox => {
      checkbox.checked = false
    })

    // Clear price inputs
    this.clearPriceFilter()

    // Clear AJAX state and apply
    ajax.clearAllFilters()
    // Use replaceHistory to replace the filtered state with unfiltered state
    ajax.applyFilters({ replaceHistory: this.hasFilterHistoryEntry })

    // Reset flag since we're now unfiltered
    this.hasFilterHistoryEntry = false

    // Sync to mobile drawer
    this.syncDesktopToMobile()

    // Update active filters bar
    this.updateActiveFiltersBar()
  }

  /**
   * Handle filter chip removal
   */
  handleChipRemove(e) {
    const removeBtn = e.target.closest('.filter-chip-remove')
    if (!removeBtn) return

    // Check if it's a price filter
    if (removeBtn.dataset.removePrice) {
      this.clearPriceFilter()
      this.applyFilters()
    } else {
      // Regular filter checkbox
      const param = removeBtn.dataset.removeFilter
      const value = removeBtn.dataset.removeValue

      // Uncheck in desktop sidebar
      const desktopCheckbox = this.desktopSidebar?.querySelector(
        `.filter-checkbox[data-filter-param="${param}"][data-filter-value="${value}"]`
      )
      if (desktopCheckbox) desktopCheckbox.checked = false

      // Uncheck in mobile drawer
      const mobileCheckbox = this.mobileDrawer?.querySelector(
        `.filter-checkbox[data-filter-param="${param}"][data-filter-value="${value}"]`
      )
      if (mobileCheckbox) mobileCheckbox.checked = false

      this.applyFilters()
    }
  }

  /**
   * Clear price filter and reset inputs
   */
  clearPriceFilter() {
    // Clear desktop price inputs
    const desktopPriceMin = this.desktopSidebar?.querySelector('.price-min')
    const desktopPriceMax = this.desktopSidebar?.querySelector('.price-max')
    if (desktopPriceMin) desktopPriceMin.value = ''
    if (desktopPriceMax) desktopPriceMax.value = ''

    // Clear mobile price inputs if they exist
    const mobilePriceMin = this.mobileDrawer?.querySelector('.price-min')
    const mobilePriceMax = this.mobileDrawer?.querySelector('.price-max')
    if (mobilePriceMin) mobilePriceMin.value = ''
    if (mobilePriceMax) mobilePriceMax.value = ''
  }

  /**
   * Sync filter state to AJAX engine and apply
   */
  applyFilters() {
    const ajax = window.collectionFilterAjax
    if (!ajax) {
      console.warn('[CollectionFilterUI] AJAX engine not available')
      return
    }

    // Clear current state
    ajax.clearAllFilters()

    // Collect all checked filters from desktop sidebar
    const checkedFilters = this.desktopSidebar?.querySelectorAll('.filter-checkbox:checked') || []
    checkedFilters.forEach(checkbox => {
      const param = checkbox.dataset.filterParam
      const value = checkbox.dataset.filterValue
      const label = checkbox.dataset.filterLabel || value

      if (param && value) {
        ajax.addFilter(param, value, label)
      }
    })

    // Add price range
    this.syncPriceToAjax(ajax)

    // Sync desktop state to mobile drawer
    this.syncDesktopToMobile()

    // Apply filters via AJAX
    // First filter change creates history entry, subsequent changes replace it
    // This way browser back clears ALL filters at once
    const useReplace = this.hasFilterHistoryEntry
    ajax.applyFilters({ replaceHistory: useReplace })

    // Mark that we now have a filter history entry
    this.hasFilterHistoryEntry = true

    // Update active filters bar
    this.updateActiveFiltersBar()
  }

  /**
   * Apply sort option
   */
  applySort(sortValue) {
    const ajax = window.collectionFilterAjax
    if (!ajax) return

    ajax.setSort(sortValue || null)
    // Sort changes also use the same history logic as filters
    const useReplace = this.hasFilterHistoryEntry
    ajax.applyFilters({ replaceHistory: useReplace })
    this.hasFilterHistoryEntry = true

    // Update mobile sort UI if available
    if (window.collectionSortFilterBar) {
      window.collectionSortFilterBar.updateSortUI(sortValue)
    }
  }

  /**
   * Sync desktop sidebar state to mobile drawer
   */
  syncDesktopToMobile() {
    if (!this.mobileDrawer) return

    // Sync checkboxes
    this.desktopSidebar?.querySelectorAll('.filter-checkbox').forEach(desktopCheckbox => {
      const param = desktopCheckbox.dataset.filterParam
      const value = desktopCheckbox.dataset.filterValue

      const mobileCheckbox = this.mobileDrawer.querySelector(
        `.filter-checkbox[data-filter-param="${param}"][data-filter-value="${value}"]`
      )
      if (mobileCheckbox) {
        mobileCheckbox.checked = desktopCheckbox.checked
      }
    })

    // Sync price inputs
    const desktopPriceMin = this.desktopSidebar?.querySelector('.price-min')
    const desktopPriceMax = this.desktopSidebar?.querySelector('.price-max')
    const mobilePriceMin = this.mobileDrawer.querySelector('.price-min')
    const mobilePriceMax = this.mobileDrawer.querySelector('.price-max')
    const mobileSliderMin = this.mobileDrawer.querySelector('.price-slider-min')
    const mobileSliderMax = this.mobileDrawer.querySelector('.price-slider-max')

    if (desktopPriceMin && mobilePriceMin) {
      mobilePriceMin.value = desktopPriceMin.value
    }
    if (desktopPriceMax && mobilePriceMax) {
      mobilePriceMax.value = desktopPriceMax.value
    }

    // Also update mobile sliders if they exist
    if (desktopPriceMin && mobileSliderMin) {
      mobileSliderMin.value = desktopPriceMin.value || 0
    }
    if (desktopPriceMax && mobileSliderMax) {
      mobileSliderMax.value = desktopPriceMax.value || mobileSliderMax.max
    }

    // Update mobile slider track visual
    this.updateMobileSliderTrack()
  }

  /**
   * Sync price filter state to AJAX engine
   */
  syncPriceToAjax(ajax) {
    const priceMinInput = this.desktopSidebar?.querySelector('.price-min')
    const priceMaxInput = this.desktopSidebar?.querySelector('.price-max')
    const priceMin = priceMinInput?.value ? parseInt(priceMinInput.value) : null
    const priceMax = priceMaxInput?.value ? parseInt(priceMaxInput.value) : null
    ajax.setPriceRange(priceMin, priceMax)
  }

  /**
   * Initialize UI state from URL parameters
   */
  initializeFromURL() {
    const urlParams = new URLSearchParams(window.location.search)

    // Initialize checkboxes in desktop sidebar
    this.desktopSidebar?.querySelectorAll('.filter-checkbox').forEach(checkbox => {
      const param = checkbox.dataset.filterParam
      const value = checkbox.dataset.filterValue

      // Check if this filter is in URL
      const urlValues = urlParams.getAll(param)
      checkbox.checked = urlValues.includes(value)
    })

    // Initialize price inputs from URL
    const urlMinPrice = urlParams.get('filter.v.price.gte')
    const urlMaxPrice = urlParams.get('filter.v.price.lte')

    const priceMinInput = this.desktopSidebar?.querySelector('.price-min')
    const priceMaxInput = this.desktopSidebar?.querySelector('.price-max')

    if (urlMinPrice && priceMinInput) {
      priceMinInput.value = urlMinPrice
    }
    if (urlMaxPrice && priceMaxInput) {
      priceMaxInput.value = urlMaxPrice
    }

    // Initialize sort dropdown
    const sortValue = urlParams.get('sort_by')
    const sortSelect = this.desktopSidebar?.querySelector('[data-sort-select]')
    if (sortSelect && sortValue) {
      sortSelect.value = sortValue
    }

    // Update active filters bar
    this.updateActiveFiltersBar()
  }

  /**
   * Listen to AJAX engine events
   */
  listenToAjaxEvents() {
    // Update UI when AJAX filtering completes
    document.addEventListener('collection:filtered', () => {
      this.updateActiveFiltersBar()
    })
  }

  /**
   * Sync all UI elements from URL (for back/forward navigation)
   */
  syncFromURL() {
    this.initializeFromURL()

    // Also sync mobile drawer if it exists
    this.syncMobileFromURL()
  }

  /**
   * Sync mobile drawer UI from URL
   */
  syncMobileFromURL() {
    if (!this.mobileDrawer) return

    const urlParams = new URLSearchParams(window.location.search)

    // Sync mobile checkboxes
    this.mobileDrawer.querySelectorAll('.filter-checkbox').forEach(checkbox => {
      const param = checkbox.dataset.filterParam
      const value = checkbox.dataset.filterValue
      const urlValues = urlParams.getAll(param)
      checkbox.checked = urlValues.includes(value)
    })

    // Sync mobile price inputs and sliders
    const mobileSliderMin = this.mobileDrawer.querySelector('.price-slider-min')
    const mobileSliderMax = this.mobileDrawer.querySelector('.price-slider-max')
    const mobilePriceMin = this.mobileDrawer.querySelector('.price-min')
    const mobilePriceMax = this.mobileDrawer.querySelector('.price-max')

    const urlMinPrice = urlParams.get('filter.v.price.gte')
    const urlMaxPrice = urlParams.get('filter.v.price.lte')

    // Get range max from slider or container
    const rangeMax = mobileSliderMax?.max || 10000

    if (urlMinPrice) {
      if (mobileSliderMin) mobileSliderMin.value = urlMinPrice
      if (mobilePriceMin) mobilePriceMin.value = urlMinPrice
    } else {
      // Reset to default if no URL param
      if (mobileSliderMin) mobileSliderMin.value = 0
      if (mobilePriceMin) mobilePriceMin.value = ''
    }

    if (urlMaxPrice) {
      if (mobileSliderMax) mobileSliderMax.value = urlMaxPrice
      if (mobilePriceMax) mobilePriceMax.value = urlMaxPrice
    } else {
      // Reset to default if no URL param
      if (mobileSliderMax) mobileSliderMax.value = rangeMax
      if (mobilePriceMax) mobilePriceMax.value = ''
    }

    // Update mobile slider track visual if mobile controller exists
    this.updateMobileSliderTrack()
  }

  /**
   * Update mobile slider track visual
   */
  updateMobileSliderTrack() {
    // Try to use the mobile drawer controller's updateTrack if available
    const mobileController = document.querySelector('.section-collection-sort-filter-bar')
    if (!mobileController) return

    const container = this.mobileDrawer?.querySelector('.price-slider-container')
    const track = container?.querySelector('.price-slider-track')
    const sliderMin = container?.querySelector('.price-slider-min')
    const sliderMax = container?.querySelector('.price-slider-max')

    if (!container || !track || !sliderMin || !sliderMax) return

    const rangeMax = parseFloat(sliderMax.max) || 10000
    const trackPadding = 10
    const minVal = parseFloat(sliderMin.value) || 0
    const maxVal = parseFloat(sliderMax.value) || rangeMax
    const minPercent = (minVal / rangeMax) * 100
    const maxPercent = (maxVal / rangeMax) * 100
    const trackableWidth = container.offsetWidth - (trackPadding * 2)

    const leftPx = trackPadding + (minPercent / 100) * trackableWidth
    const widthPx = ((maxPercent - minPercent) / 100) * trackableWidth

    track.style.left = `${leftPx}px`
    track.style.width = `${widthPx}px`
  }

  /**
   * Check if we're on mobile view
   */
  isMobileView() {
    return window.innerWidth < 480
  }

  /**
   * Get the active filter container (desktop or mobile based on viewport)
   */
  getActiveFilterContainer() {
    return this.isMobileView() ? this.mobileDrawer : this.desktopSidebar
  }

  /**
   * Update the active filters bar with current filter chips
   */
  updateActiveFiltersBar() {
    if (!this.activeFiltersBar || !this.filtersList) return

    this.filtersList.innerHTML = ''
    let filterCount = 0

    // Get the active container based on viewport
    const container = this.getActiveFilterContainer()

    // Add chips for checked filters
    const checkedFilters = container?.querySelectorAll('.filter-checkbox:checked') || []
    checkedFilters.forEach(checkbox => {
      const label = checkbox.dataset.filterLabel || checkbox.dataset.filterValue
      const param = checkbox.dataset.filterParam
      const value = checkbox.dataset.filterValue

      const chip = this.createFilterChip(label, param, value)
      this.filtersList.appendChild(chip)
      filterCount++
    })

    // Add price range chip if set
    const priceChip = this.createPriceChip()
    if (priceChip) {
      this.filtersList.appendChild(priceChip)
      filterCount++
    }

    // Show/hide the filters bar
    if (filterCount > 0) {
      this.activeFiltersBar.classList.add('has-filters')
    } else {
      this.activeFiltersBar.classList.remove('has-filters')
    }
  }

  /**
   * Create a filter chip element
   */
  createFilterChip(label, param, value) {
    const chip = document.createElement('div')
    chip.className = 'filter-chip'
    chip.innerHTML = `
      <span>${label}</span>
      <span class="filter-chip-remove" data-remove-filter="${param}" data-remove-value="${value}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round"/>
        </svg>
      </span>
    `
    return chip
  }

  /**
   * Create a price filter chip if price range is applied
   */
  createPriceChip() {
    const container = this.getActiveFilterContainer()
    const priceMinInput = container?.querySelector('.price-min')
    const priceMaxInput = container?.querySelector('.price-max')

    const priceMin = priceMinInput?.value ? parseInt(priceMinInput.value) : null
    const priceMax = priceMaxInput?.value ? parseInt(priceMaxInput.value) : null

    // Only show chip if price is set
    if (!priceMin && !priceMax) return null

    let priceLabel = '₹'
    if (priceMin && priceMax) {
      priceLabel = `₹${priceMin} - ₹${priceMax}`
    } else if (priceMin) {
      priceLabel = `Min ₹${priceMin}`
    } else if (priceMax) {
      priceLabel = `Max ₹${priceMax}`
    }

    const chip = document.createElement('div')
    chip.className = 'filter-chip'
    chip.innerHTML = `
      <span>${priceLabel}</span>
      <span class="filter-chip-remove" data-remove-price="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round"/>
        </svg>
      </span>
    `
    return chip
  }
}

// Create global instance when DOM is ready
function initCollectionFilterUI() {
  // Wait for AJAX engine to be ready
  if (!window.collectionFilterAjax) {
    setTimeout(initCollectionFilterUI, 100)
    return
  }

  window.collectionFilterUI = new CollectionFilterUI()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCollectionFilterUI)
} else {
  initCollectionFilterUI()
}
